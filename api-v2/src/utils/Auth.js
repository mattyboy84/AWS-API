const { getUserRoles} = require('./Cognito');
const { listRolePolicies, getRolePolicy } = require('./IAM');

const {
  COGNITO_USERPOOL_APPCLIENT_ID
} = require('./config');

// const authEvent = require('../../examples/AuthEvent.json');

async function getUserRolesFromAuth(authType, authToken) {
  let username;
  let roles;
  let Authflow;
  let AuthParameters = {};
    if (authType === 'basic') {

        const basicUsername = Buffer.from(authToken,'base64').toString().split(':')[0];
        const basicPassword = Buffer.from(authToken,'base64').toString().split(':')[1];
        username = basicUsername;

        AuthParameters = {
        USERNAME: basicUsername,
        PASSWORD: basicPassword
      };
    Authflow = 'USER_PASSWORD_AUTH'
  } else if (authType === 'oauth') {

    Authflow = 'REFRESH_TOKEN_AUTH'

    AuthParameters = {
      REFRESH_TOKEN: authToken
    };
  }

  try {
    roles = await getUserRoles({
        Authflow,
        AuthParameters,
        UserPoolAppClientId: COGNITO_USERPOOL_APPCLIENT_ID
      });
    } catch (err) {
      roles = [];
      username = 'Unauthorized'
      console.log(`Error getting roles: ${err.message}`);
      if (err.message === 'Incorrect username or password.') {
        console.warn(`Incorrect username or password.`);
        throw Error("Unauthorized");
       }
       else if (err.message === 'User does not exist.') {
        console.warn(`User does not exist`);
        throw Error("Unauthorized");
       }
       else if (err.message === 'Refresh Token has expired') {
        console.warn(`Refresh Token has expired`);
        throw Error("Unauthorized");
       }
       else {
        throw Error("Internal Server Error");
      }
    }
    return {
      roles: roles || [],
      username: username,
    }
}

async function authenticate(event) {
  console.log(`Auth event: ${JSON.stringify(event, null, 4)}`);
  
  const { method } = event.requestContext.http;// POST
  const { stage } = event.requestContext;// Prod
  let routeKey = event.routeKey.split(' ')[1];
  routeKey = routeKey.split('/')[1]// Order

  const auth = {
    type: undefined,
    token: undefined,
  };

  auth.type = 'basic' || undefined;
  auth.token = event.queryStringParameters?.token || undefined;

  if (event.headers.authorization) {
    auth.type = event.headers.authorization.split(' ')[0].toLowerCase();
    auth.token = event.headers.authorization.split(' ')[1];
  }

  console.log(auth);

  if (auth.type === undefined || auth.token === undefined) {
    throw Error("Unauthorized");
  }

  const { roles, username } = await getUserRolesFromAuth(auth.type, auth.token);
  console.log(`Users Roles: ${JSON.stringify(roles, null, 4)}`);

  const statements = [];

  for (let i = 0; i < roles.length; i++) {
    const roleName = roles[i].split('role/')[1];
    console.log(roleName);
    const policyNames = await listRolePolicies({RoleName: roleName});
    for (let j = 0; j < policyNames.length; j++) {
      const state = (await getRolePolicy({
        RoleName: roleName,
        PolicyName: policyNames[j]
      })).Statement;
      statements.push(...state);
    }
  }
  console.log(`User Statements: ${JSON.stringify(statements, null, 4)}`);

  let authorized = false;
  
  for ( let j = 0; j < statements.length; j++) {
    const { Resource } = statements[j];
    for ( let k = 0; k < Resource.length; k++) {
      if (Resource[k].endsWith(`${method}/${routeKey}`) || Resource[k].endsWith(`${method}/${routeKey}/*`)) {
        authorized = true;
        break;
      }
    }
  }


  if (!authorized) {
    statements.push({
      Action: "execute-api:Invoke",
      Resource: [
        event.routeArn
      ],
      Effect: "Deny"
    });
  }

  const responseIAM = {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: statements,
    },
    context: {// this is passed to the next lambda function
      customer: username
    },
  };

  console.log(`returning: ${JSON.stringify(responseIAM, null, 4)}`);
  return responseIAM;
}

module.exports = {
    authenticate,
}
