const AWS = require('aws-sdk');
const Athena = new AWS.Athena({
  region: 'eu-west-2'
});

const queryResults = require('../../examples/athena/getQueryResults.json');

async function waitForQuery(QueryExecutionId) {
  let State = 'QUEUED';
  let result = undefined;
  while (State === 'QUEUED' || State === 'RUNNING') {
    await delay(50);
    result = await (Athena.getQueryExecution({
      QueryExecutionId: QueryExecutionId
    }).promise());
    
    State = result.QueryExecution.Status.State;
  }
  //SUCCEEDED
  //FAILED
  return State;
}

async function executeQuery(event) {
  console.log(`Executing query : ${JSON.stringify(event)}`);
  console.log(`Query to be executed : ${event.Query}`);
  const result = await (Athena.startQueryExecution({
    QueryString: event.Query,
    QueryExecutionContext: {
      Database: event.Database,
    },
    ResultConfiguration: {
      OutputLocation: event.OutputLocation,
    }
  }).promise());
  const { QueryExecutionId } = result;

  return QueryExecutionId;
}

async function getQueryResults(event) {
  const queryResult = await (Athena.getQueryResults({
    QueryExecutionId: event.QueryExecutionId,
  }).promise());

  const results = [];

  const { Rows } = queryResult.ResultSet;

  for (let i = 1; i < Rows.length; i++) {
    const result = {};
    const { Data } = Rows[i];
    for (let j = 0; j < Data.length; j++) {
      result[Rows[0].Data[j].VarCharValue] = Data[j].VarCharValue;       
    }
    results.push(result);
  }

  return results;
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = {
  executeQuery,
  waitForQuery,
  getQueryResults,
}
