const AWS = require('aws-sdk');
const S3 = new AWS.S3({apiVersion: '2006-03-01'});

async function putObject(event) {
  const response = S3.putObject({
    Body: event.Body,
    Bucket: event.Bucket,
    Key: event.Key
  }).promise();
  return response;
}

module.exports = {
  putObject
};
