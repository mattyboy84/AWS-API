const AWS = require('aws-sdk');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18', region: 'eu-west-2'});

/**
 * @param {*} event contains Username, Password & UserPoolAppClientId - the Id of the App Client
 * @returns 
 */
  async function login(event) {
    const response = await cognitoidentityserviceprovider.initiateAuth({
      AuthFlow: event.Authflow,
      AuthParameters: event.AuthParameters,
      ClientId: event.UserPoolAppClientId  
    }).promise();
    // console.log(`Login response: ${JSON.stringify(response)}`);
    return response.AuthenticationResult;
  }
  
  async function adminCreateUser(event) {
    const response = await cognitoidentityserviceprovider.adminCreateUser(event).promise();
    // console.log(`Login response: ${JSON.stringify(response)}`);
    return response.AuthenticationResult;
  }

  async function adminSetUserPassword(event) {
    const response = await cognitoidentityserviceprovider.adminSetUserPassword({
      Username: event.Username,
      Password: event.Password,
      UserPoolId: event.UserPoolId,
      Permanent: true
    }).promise();
    // console.log(`Login response: ${JSON.stringify(response)}`);
    return response.AuthenticationResult;
  }

  async function adminConfirmSignUp(event) {
    const response = await cognitoidentityserviceprovider.adminConfirmSignUp({
      UserPoolId: event.UserPoolId,
      Username: event.Username
    }).promise();
    // console.log(`Login response: ${JSON.stringify(response)}`);
    return response.AuthenticationResult;
  }

/**
 * @param {*} event contains Username, Password & UserPoolAppClientId - the Id of the App Client
 * @returns 
 */
  async function getUserGroups(event) {
    const { IdToken } = await login(event);
    //
    const attributes = JSON.parse(Buffer.from(IdToken.split('.')[1],'base64').toString());
    // console.log(`Attributes: ${JSON.stringify(attributes, null, 4)}`);
    const cognitoGroups = attributes['cognito:groups'] || [];

    return cognitoGroups;

  }

  async function getUserRoles(event) {
    const { IdToken } = await login(event);
    //
    const attributes = JSON.parse(Buffer.from(IdToken.split('.')[1],'base64').toString());
    // console.log(`Attributes: ${JSON.stringify(attributes, null, 4)}`);
    const cognitoRoles = attributes['cognito:roles'] || [];

    return cognitoRoles;
  }

  async function getGroup(event) {
    const response = await cognitoidentityserviceprovider.getGroup({
      GroupName: event.Group,
      UserPoolId: event.UserPoolId
    }).promise();
    console.log(`getGroup response: ${JSON.stringify(response)}`);
    return response;
  }

module.exports = {
  login,
  getGroup,
  getUserGroups,
  getUserRoles,
  adminCreateUser,
  adminSetUserPassword,
};
