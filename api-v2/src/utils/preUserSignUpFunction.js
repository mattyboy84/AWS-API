


async function handler(event, context, callback) {
  console.log(`Event: ${JSON.stringify(event, null, 4)}`);

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  console.log(`returning event: ${JSON.stringify(event)}`);
  callback(null, event);
}

module.exports = {
  handler
};