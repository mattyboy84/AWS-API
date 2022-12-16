
async function JSONresponse(statusCode, headers, body) {

  return {
    statusCode,
    headers: {...headers},
    body: JSON.stringify(body),
  }
}

module.exports = {
  JSONresponse,
};