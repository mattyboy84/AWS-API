const { adminCreateUser, adminSetUserPassword } = require('./Cognito');

const {
  COGNITO_USERPOOL_ID,
} = require('./config');

/*
{
  "Username": "customer0",
  "Password": "Password123!",
  "Email": "a@b.com"
}
*/

async function create(event) {
  await adminCreateUser({
    UserPoolId: COGNITO_USERPOOL_ID,
    Username: event.Username,
    TemporaryPassword: event.Password,
    UserAttributes: [
      {
      Name: 'name',
      Value: event.Username,
      },
      {
      Name: 'preferred_username',
      Value: event.Username,
      },
      {
      Name: 'email',
      Value: event.Email,
      },
      {
      Name: 'email_verified',
      Value: 'true',
      }
    ],
    MessageAction: "SUPPRESS"
  });
  
  await adminSetUserPassword({
    UserPoolId: COGNITO_USERPOOL_ID,
    Username: event.Username,
    Password: event.Password,
  });
}

module.exports = {
  create,
}
