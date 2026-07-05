"use strict";

/**
 * start_onboarding
 * ----------------
 * POST /users/onboard
 *
 * Kicks off the onboarding drip campaign by starting an execution of the
 * Step Functions state machine. The state machine sends the welcome email,
 * waits, then checks whether the user recorded their first video and follows
 * up accordingly.
 *
 * Expected request body:
 * {
 *   "email": "new.user@example.com",
 *   "firstName": "Grace",
 *   "userId": "usr_123"        // optional, used for the "first video" check
 * }
 *
 * Environment variables:
 *   ONBOARDING_STATE_MACHINE_ARN - ARN of the Step Functions state machine.
 */

const {
  SFNClient,
  StartExecutionCommand,
} = require("@aws-sdk/client-sfn");

const sfn = new SFNClient({});
const STATE_MACHINE_ARN = process.env.ONBOARDING_STATE_MACHINE_ARN;

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

/**
 * Build a safe, unique execution name from an email address.
 */
function executionName(email) {
  const safe = String(email).replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 60);
  return `onboard-${safe}-${Date.now()}`;
}

exports.handler = async (event = {}) => {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};

    const { email, firstName, userId } = body;

    if (!email) {
      return respond(400, { message: "email is required." });
    }

    const input = {
      email,
      firstName: firstName || "there",
      userId: userId || null,
      startedAt: new Date().toISOString(),
    };

    const result = await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        name: executionName(email),
        input: JSON.stringify(input),
      })
    );

    return respond(202, {
      message: "Onboarding journey started",
      executionArn: result.executionArn,
      startDate: result.startDate,
    });
  } catch (err) {
    console.error("start_onboarding failed", err);
    return respond(500, {
      message: "Failed to start onboarding",
      error: err.message,
    });
  }
};
