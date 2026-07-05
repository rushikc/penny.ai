"use strict";

/**
 * worker_send_email
 * -----------------
 * Core worker Lambda. It is invoked in two contexts:
 *
 *   1. Broadcast fan-out (from trigger_submission) and onboarding email steps
 *      (from Step Functions) -> action "send_email".
 *      It fetches the raw HTML template from S3, merges dynamic {{token}}
 *      attributes (video link, AI doc summary, first name, ...), and sends the
 *      message through Amazon SES.
 *
 *   2. Onboarding decision step (from Step Functions) -> action "check_first_video".
 *      It looks up the contact in DynamoDB and reports whether they have
 *      recorded their first video yet, so the state machine can branch.
 *
 * Payload shape:
 * {
 *   "action": "send_email" | "check_first_video",   // defaults to send_email
 *   "template": "onboarding_welcome.html",           // S3 key (send_email)
 *   "subject": "Welcome to Screen Start",
 *   "recipient": { "email": "a@b.com", "firstName": "Ada" },
 *   "attributes": { "dashboard_url": "https://...", ... },
 *   "userId": "usr_123",                             // check_first_video
 *   "email": "a@b.com"                               // check_first_video
 * }
 *
 * Environment variables:
 *   TEMPLATES_BUCKET - S3 bucket that stores the HTML templates.
 *   SES_SENDER       - Verified "From" address used by SES.
 *   USERS_TABLE      - DynamoDB contacts table (for check_first_video).
 */

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const s3 = new S3Client({});
const ses = new SESv2Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TEMPLATES_BUCKET = process.env.TEMPLATES_BUCKET;
const SES_SENDER = process.env.SES_SENDER;
const USERS_TABLE = process.env.USERS_TABLE;

// Small in-memory cache so warm containers avoid repeated S3 reads for the
// same template during a broadcast fan-out.
const templateCache = new Map();

/**
 * Read a template's raw HTML from S3 (cached per warm container).
 * @param {string} key - S3 object key, e.g. "onboarding_welcome.html".
 * @returns {Promise<string>}
 */
async function loadTemplate(key) {
  if (templateCache.has(key)) return templateCache.get(key);

  const res = await s3.send(
    new GetObjectCommand({ Bucket: TEMPLATES_BUCKET, Key: key })
  );
  const html = await res.Body.transformToString();
  templateCache.set(key, html);
  return html;
}

/**
 * Replace every {{token}} in the template with the matching attribute value.
 * Unknown tokens are replaced with an empty string so raw {{...}} never leaks
 * into the delivered email.
 * @param {string} html
 * @param {Record<string, unknown>} attributes
 * @returns {string}
 */
function renderTemplate(html, attributes = {}) {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, token) => {
    const value = attributes[token];
    return value === undefined || value === null ? "" : String(value);
  });
}

/**
 * Send a rendered HTML email through Amazon SES.
 */
async function sendEmail({ to, subject, html }) {
  return ses.send(
    new SendEmailCommand({
      FromEmailAddress: SES_SENDER,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      },
    })
  );
}

/**
 * Look up whether a contact has recorded their first video.
 * Used by the onboarding state machine to decide follow-up.
 */
async function checkFirstVideo({ userId, email }) {
  const Key = userId ? { userId } : { email };
  const { Item } = await ddb.send(
    new GetCommand({ TableName: USERS_TABLE, Key })
  );

  const hasRecordedFirstVideo = Boolean(
    Item && (Item.hasRecordedFirstVideo || Item.firstVideoAt)
  );

  return { hasRecordedFirstVideo, email: email || (Item && Item.email) };
}

exports.handler = async (event = {}) => {
  const action = event.action || "send_email";

  if (action === "check_first_video") {
    const result = await checkFirstVideo({
      userId: event.userId,
      email: event.email,
    });
    console.log("check_first_video", result);
    return result;
  }

  // Default: render and send an email.
  const recipient = event.recipient || {};
  const to = recipient.email || event.email;
  if (!to) throw new Error("worker_send_email: recipient email is required.");
  if (!event.template) throw new Error("worker_send_email: template is required.");

  const rawHtml = await loadTemplate(event.template);

  // Ensure first_name is always available even if only recipient.firstName was set.
  const attributes = {
    first_name: recipient.firstName || "there",
    ...event.attributes,
  };

  const html = renderTemplate(rawHtml, attributes);
  const subject = event.subject || "An update from Screen Start";

  const result = await sendEmail({ to, subject, html });
  console.log(`Email sent to ${to} (messageId=${result.MessageId})`);

  return { delivered: true, to, messageId: result.MessageId };
};
