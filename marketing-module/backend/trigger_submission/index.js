"use strict";

/**
 * trigger_submission
 * ------------------
 * POST /campaigns/broadcast
 *
 * Called when a Screen Start user shares a new video link + AI-generated
 * document and wants to broadcast it to contacts. It:
 *   1. Reads the submission payload (video link, AI doc, target segment).
 *   2. Queries the DynamoDB contacts table, filtering by the target segment.
 *   3. Fans out one async invocation of `worker_send_email` per contact,
 *      passing the resolved template name and the dynamic attributes to merge.
 *
 * Expected request body:
 * {
 *   "target": "all" | "english_view",        // marketing segment to reach
 *   "submission": {
 *     "authorName": "Ada Lovelace",
 *     "videoTitle": "How we ship features",
 *     "videoLink": "https://screenstart.app/v/abc123",
 *     "videoThumbnail": "https://cdn.screenstart.app/t/abc123.png",
 *     "aiDocSummary": "A 90-second walkthrough of ...",
 *     "aiDocLink": "https://screenstart.app/docs/abc123"
 *   }
 * }
 *
 * Environment variables:
 *   USERS_TABLE        - DynamoDB contacts table name.
 *   WORKER_FUNCTION    - Name/ARN of the worker_send_email Lambda.
 *   BROADCAST_TEMPLATE - S3 key of the broadcast HTML template.
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambda = new LambdaClient({});

const USERS_TABLE = process.env.USERS_TABLE;
const WORKER_FUNCTION = process.env.WORKER_FUNCTION;
const BROADCAST_TEMPLATE =
  process.env.BROADCAST_TEMPLATE || "new_submission_broadcast.html";

// Known marketing segments. "all" means no filter.
const VALID_TARGETS = new Set(["all", "english_view"]);

/**
 * Query the contacts table filtered by the requested segment.
 * @param {string} target - "all" or a specific segment id.
 * @returns {Promise<Array<object>>}
 */
async function getSegmentContacts(target) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const params = { TableName: USERS_TABLE, ExclusiveStartKey };

    if (target && target !== "all") {
      params.FilterExpression = "contains(segments, :segment)";
      params.ExpressionAttributeValues = { ":segment": target };
    }

    const page = await ddb.send(new ScanCommand(params));
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

/**
 * Asynchronously invoke the worker for a single contact.
 */
async function dispatchToWorker(contact, submission) {
  const payload = {
    template: BROADCAST_TEMPLATE,
    recipient: {
      email: contact.email,
      firstName: contact.firstName || contact.first_name || "there",
    },
    // Attributes surfaced as {{token}} inside the HTML template.
    attributes: {
      first_name: contact.firstName || contact.first_name || "there",
      author_name: submission.authorName,
      video_title: submission.videoTitle,
      video_link: submission.videoLink,
      video_thumbnail: submission.videoThumbnail,
      ai_doc_summary: submission.aiDocSummary,
      ai_doc_link: submission.aiDocLink,
      unsubscribe_url: contact.unsubscribeUrl || "https://screenstart.app/unsubscribe",
    },
    subject: `${submission.authorName} shared: ${submission.videoTitle}`,
  };

  return lambda.send(
    new InvokeCommand({
      FunctionName: WORKER_FUNCTION,
      InvocationType: "Event", // fire-and-forget async fan-out
      Payload: Buffer.from(JSON.stringify(payload)),
    })
  );
}

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
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};

    const target = (body.target || "all").toLowerCase();
    const submission = body.submission || {};

    if (!VALID_TARGETS.has(target)) {
      return respond(400, {
        message: `Unknown target segment '${target}'.`,
        allowed: [...VALID_TARGETS],
      });
    }
    if (!submission.videoLink) {
      return respond(400, { message: "submission.videoLink is required." });
    }

    const contacts = await getSegmentContacts(target);

    // Fan out, but bound concurrency so a large list does not exhaust sockets.
    const BATCH = 25;
    let dispatched = 0;
    for (let i = 0; i < contacts.length; i += BATCH) {
      const slice = contacts.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        slice.map((c) => dispatchToWorker(c, submission))
      );
      dispatched += results.filter((r) => r.status === "fulfilled").length;
    }

    return respond(202, {
      message: "Broadcast accepted",
      target,
      matched: contacts.length,
      dispatched,
    });
  } catch (err) {
    console.error("trigger_submission failed", err);
    return respond(500, {
      message: "Failed to trigger broadcast",
      error: err.message,
    });
  }
};
