const { JSONresponse } = require('../utils/Response');
const { putObject } = require('../utils/S3');

const exampleEvent = require('../../examples/exampleHttpRequest.json')

const {
  FILE_BUCKET_NAME
} = require('../utils/config');


async function handler(event) {
  console.log(`event: ${JSON.stringify(event, null, 4)}`);

  const file = JSON.parse(event.body);
  console.log(`received file: ${JSON.stringify(file, null, 4)}`);

  console.log(`Saving to: ${FILE_BUCKET_NAME}`);

  const Objectresponse = await putObject({
    Body: JSON.stringify(file, null, 4),
    Bucket: FILE_BUCKET_NAME,
    Key: 'file.json'
  });
  console.log(JSON.stringify(Objectresponse, null, 4));

  const response = await JSONresponse(
    201,
    { 'Content-Type': 'application/json' },
    undefined,
  );

  console.log(`response: ${JSON.stringify(response, null, 4)}`);

  return response;
}

module.exports = {
  handler,
}
