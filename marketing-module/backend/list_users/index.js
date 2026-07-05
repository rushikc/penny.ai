"use strict";

/**
 * list_users
 * ----------
 * GET /users
 *
 * Fetches all contacts/users from the DynamoDB contacts table. Supports an
 * optional `?segment=` query-string parameter to filter contacts down to a
 * marketing segment (for example "english_view").
 *
 * Environment variables:
 *   USERS_TABLE - Name of the DynamoDB table holding marketing contacts.
 *
 * Returns an API Gateway proxy response with the list of contacts.
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;

/**
 * Scan the contacts table, optionally filtering by segment.
 * @param {string|undefined} segment - Optional segment id to filter by.
 * @returns {Promise<Array<object>>} List of contact records.
 */
async function fetchContacts(segment) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const params = {
      TableName: USERS_TABLE,
      ExclusiveStartKey,
    };

    // Filter server-side when a segment is requested. The `segments` attribute
    // is a DynamoDB String Set / List that holds the segments a user belongs to.
    if (segment) {
      params.FilterExpression = "contains(segments, :segment)";
      params.ExpressionAttributeValues = { ":segment": segment };
    }

    const page = await ddb.send(new ScanCommand(params));
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

/**
 * Build a standard API Gateway proxy response.
 */
function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event = {}) => {
  try {
    const segment =
      event.queryStringParameters && event.queryStringParameters.segment;

    const contacts = await fetchContacts(segment);

    return respond(200, {
      count: contacts.length,
      segment: segment || "all",
      contacts,
    });
  } catch (err) {
    console.error("list_users failed", err);
    return respond(500, { message: "Failed to list users", error: err.message });
  }
};
