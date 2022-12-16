const { JSONresponse } = require('./utils/Response');

const {
  executeQuery,
  waitForQuery,
  getQueryResults
} = require('./utils/Athena');

const {
  ATHENA_DATABASE,
  ATHENA_BUCKET_QUERY_RESULTS_FULL_PATH,
  ATHENA_BUCKET,
  ATHENA_PAGE_LIMIT,
  ATHENA_MAX_PAGE_LIMIT,
} = require('./utils/Config');

let OFFSET = 0;
let LIMIT = ATHENA_PAGE_LIMIT;
let PAGE = 1;
let FINAL_PAGE;

const rawWhereData = [];

async function constructWhereData(event) {
  let whereData = [];
  if (event.queryStringParameters?.updated_at) {
    const { updated_at } = event.queryStringParameters;
    whereData.push(`from_iso8601_timestamp(updated_at) > from_iso8601_timestamp('${updated_at}')`);
    rawWhereData.push(`updated_at=${updated_at}`);
  }

  //

  if (whereData.length === 0) {
    return undefined;
  }
  return whereData;
}

async function constructSortDate(event, customer) {
  let sortData = [];

  sortData.push(`ORDER BY updated_at`);

  if ((event.queryStringParameters?.limit && typeof Number(event.queryStringParameters?.limit) === 'number') || (event.queryStringParameters?.limit === 0)) {
    LIMIT = event.queryStringParameters?.limit;
    LIMIT = Math.min(Math.max(parseInt(LIMIT), 1), ATHENA_MAX_PAGE_LIMIT);
    console.log(`Limit in event ${LIMIT}`);
  }
  console.log(`using a limit of ${LIMIT}`);
  

  if ((event.queryStringParameters?.page && typeof Number(event.queryStringParameters?.page) === 'number')) {
    PAGE = event.queryStringParameters?.page;
    PAGE = Math.max(parseInt(PAGE), 1);
    console.log(`Page in event ${PAGE}`);
  }

  console.log(`using a page of ${PAGE}`);
  
  
  OFFSET = (( PAGE - 1 ) * LIMIT);
  console.log(`using an offset of ${OFFSET}`);
  
  sortData.push(`OFFSET ${OFFSET}`);
  sortData.push(`LIMIT ${LIMIT}`);
  
  if (sortData.length === 0) {
    return undefined;
  }
  return sortData;
}

async function query(event) {
    console.log(JSON.stringify(event, null, 4));
    const { rawPath, rawQueryString } = event;
    const { domainName } = event.requestContext;
    const { customer } = event.requestContext.authorizer.lambda;



    const selectData = ['*'];
    const fromData = `"${ATHENA_DATABASE}"."${customer}"`;
    const whereData = await constructWhereData(event);
    const sortData = await constructSortDate(event, customer);

    let query =
    `SELECT ${selectData.join(',')} FROM ${fromData}`;


    if (whereData !== undefined) {
      query += ` WHERE ${whereData.join(' AND ')}`;
    }

    if (sortData !== undefined) {
      query += ` ${sortData.join(' ')}`;
    }

    query += `;`;

    console.log(`Constructed query: ${query}`);

    const QueryExecutionId = await executeQuery({
      Query: query,
      Database: ATHENA_DATABASE,
      OutputLocation: `${ATHENA_BUCKET_QUERY_RESULTS_FULL_PATH}/${customer}/`
    });

    console.log(`QueryExecutionId: ${QueryExecutionId}`);
    await waitForQuery(QueryExecutionId);

    const queryResults = await getQueryResults({QueryExecutionId});

    const resultBody = {
      total: queryResults.length,
      limit: LIMIT,
      page: PAGE,
      results: queryResults,
    }
    console.log(JSON.stringify(resultBody, null, 4));

    const response = await JSONresponse(
      200,
      { 'Content-Type': 'application/json',
        'QueryExecutionId': QueryExecutionId },
        resultBody,
    );
  
    console.log(`response: ${JSON.stringify(response, null, 4)}`);
  
    return response;
}

module.exports = {
    query,
}
