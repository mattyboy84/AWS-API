const AWS = require('aws-sdk');
const iam = new AWS.IAM();
/*
    "cognito:roles": [
        "arn:aws:iam::968721831531:role/test-api-v2-APIRoleOrders-63LGPAUVUGPW"
    ],
    "cognito:groups": [
        "test-api-v2-Cognito-UserPoolClient-OrderGroup"
    ],
*/

async function listRolePolicies(event) {
  const response = await iam.listRolePolicies({
    RoleName: event.RoleName
  }).promise();
  return response.PolicyNames;
}

async function getRolePolicy(event) {
  const response = await iam.getRolePolicy({
    RoleName: event.RoleName,
    PolicyName: event.PolicyName
  }).promise();
  const PolicyDocument = JSON.parse(decodeURIComponent(response.PolicyDocument));
  return PolicyDocument;
}

async function getPolicy(event) {
  const response = await iam.getPolicy({
    PolicyArn: event.PolicyArn
  }).promise();
  // console.log(`listRolePolicies response: ${JSON.stringify(response)}`);
  return response.PolicyNames;
}

// getRolePolicy();

module.exports = {
  listRolePolicies,
  getRolePolicy
};