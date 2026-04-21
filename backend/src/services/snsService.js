/**
 * snsService.js — Smart-routed AWS SNS service
 *
 * Routing strategy (SNS Subscription Filter Policies):
 *   • ADMIN subscriptions filter on MessageAttribute "recipient_role" = "ADMIN"
 *   • STUDENT subscriptions filter on MessageAttribute "recipient_email" = <their email>
 *
 * This means a single SNS Topic handles all notifications, but each
 * subscriber only receives messages targeted at them.
 *
 * Prerequisites in the AWS Console:
 *   1. Create an SNS Topic (Standard, not FIFO) in us-east-1.
 *   2. Set AWS_SNS_TOPIC_ARN in .env.
 *   3. Admins subscribe once (done at server startup or manually) with the
 *      recipient_role filter.
 *   4. Students subscribe when they save a notification email on their profile.
 */

import {
  PublishCommand,
  SetSubscriptionAttributesCommand,
  SNSClient,
  SubscribeCommand,
} from "@aws-sdk/client-sns";
import { env } from "../config/env.js";

// ─── SNS Client ────────────────────────────────────────────────────────────
const snsClientConfig = { region: env.awsRegion };

if (env.awsAccessKeyId && env.awsSecretAccessKey) {
  snsClientConfig.credentials = {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
    ...(env.awsSessionToken ? { sessionToken: env.awsSessionToken } : {}),
  };
}

const snsClient = new SNSClient(snsClientConfig);

// ─── Guard helper ──────────────────────────────────────────────────────────
function guardTopicArn(fnName) {
  if (!env.awsSnsTopicArn) {
    console.warn(`[snsService.${fnName}] AWS_SNS_TOPIC_ARN not set — skipping.`);
    return false;
  }
  return true;
}

// ─── Internal: apply filter policy to a confirmed subscription ────────────
/**
 * SNS only honours SetSubscriptionAttributes on a *confirmed* subscription.
 * When the ARN comes back as "pending confirmation" we skip the call and log
 * a friendly message — the filter will need to be applied after the user
 * clicks the confirmation link (or via the NotificationSettings page).
 *
 * @param {string} subscriptionArn
 * @param {object} filterPolicy  e.g. { recipient_role: ["ADMIN"] }
 */
async function setFilterPolicy(subscriptionArn, filterPolicy) {
  if (subscriptionArn === "pending confirmation") {
    console.log(
      "📋 [SNS] Filter policy will apply once the user confirms their email."
    );
    return;
  }

  try {
    await snsClient.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: subscriptionArn,
        AttributeName: "FilterPolicy",
        AttributeValue: JSON.stringify(filterPolicy),
      })
    );
    console.log(
      `✅ [SNS] FilterPolicy applied to subscription ${subscriptionArn}`
    );
  } catch (err) {
    // Subscription may be pending — this is non-fatal
    if (
      err?.message?.includes("pending") ||
      err?.message?.includes("Subscription does not exist")
    ) {
      console.log(
        "📋 [SNS] Filter policy will apply once the user confirms their email."
      );
    } else {
      console.error("[SNS] SetSubscriptionAttributes failed:", err.message);
    }
  }
}

// ─── 1. subscribeUser ──────────────────────────────────────────────────────
/**
 * Subscribes an email address to the SNS topic with a role-based filter policy.
 *
 * ADMIN  → FilterPolicy: { "recipient_role": ["ADMIN"] }
 *          Any Publish with MessageAttribute recipient_role=ADMIN goes to admins.
 *
 * STUDENT → FilterPolicy: { "recipient_email": ["<email>"] }
 *           Only Publish calls that name this exact email reach the student.
 *
 * Idempotent: SNS deduplicates identical endpoint+protocol subscriptions.
 * AWS sends a "Confirm subscription" email — it only activates after clicking.
 *
 * @param {string} email
 * @param {"ADMIN"|"STUDENT"} role
 * @returns {Promise<string|undefined>} SubscriptionArn
 */
export async function subscribeUser(email, role) {
  if (!guardTopicArn("subscribeUser")) {
    return { success: false, error: "AWS_SNS_TOPIC_ARN not set" };
  }

  const normalizedRole = String(role).toUpperCase();

  // Build the role-based filter policy
  const filterPolicy =
    normalizedRole === "ADMIN"
      ? { recipient_role: ["ADMIN"] }   // matches any admin-targeted publish
      : { recipient_email: [email] };    // matches only this student's email

  try {
    // Step 1 — Subscribe (AWS sends confirmation email to the user)
    const result = await snsClient.send(
      new SubscribeCommand({
        TopicArn: env.awsSnsTopicArn,
        Protocol: "email",
        Endpoint: email,
        // ReturnSubscriptionArn=true returns the ARN even for pending subscriptions
        ReturnSubscriptionArn: true,
      })
    );

    const subscriptionArn = result.SubscriptionArn;
    console.log(
      `📬 [SNS] Subscribed (${normalizedRole}) ${email} → ARN: ${subscriptionArn}`
    );

    // Step 2 — Apply the filter policy via SetSubscriptionAttributes
    // This is a separate API call because email protocol ignores Attributes
    // on SubscribeCommand. Skipped automatically if still pending confirmation.
    await setFilterPolicy(subscriptionArn, filterPolicy);

    return { success: true, subscriptionArn };
  } catch (error) {
    console.error(`[SNS] Subscription failed for ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ─── 2. publishNotification ────────────────────────────────────────────────
/**
 * Publishes a message to the SNS topic with MessageAttributes for smart routing.
 *
 * Pass ONE of these attribute combinations so the filter policies match:
 *
 *   Admin-targeted:
 *     attributes: { recipient_role: { DataType: "String", StringValue: "ADMIN" } }
 *
 *   Student-targeted:
 *     attributes: { recipient_email: { DataType: "String", StringValue: studentEmail } }
 *
 * @param {string} message    – Plain-text body
 * @param {string} subject    – Email subject (≤100 chars for email protocol)
 * @param {Record<string, { DataType: string, StringValue: string }>} attributes
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>} SNS Result
 */
function normalizeMessageAttributes(attributes = {}) {
  const normalized = {};

  if (attributes.recipient_role) {
    normalized.recipient_role = attributes.recipient_role;
  }

  if (attributes.recipient_email) {
    normalized.recipient_email = attributes.recipient_email;
  }

  return normalized;
}

export async function publishNotification(message, subject, attributes = {}) {
  if (!guardTopicArn("publishNotification")) {
    return { success: false, error: "AWS_SNS_TOPIC_ARN not set" };
  }

  try {
    const messageAttributes = normalizeMessageAttributes(attributes);

    const params = {
      TopicArn: env.awsSnsTopicArn,
      Subject: subject.slice(0, 100), // SNS hard limit
      Message: message,
      MessageAttributes: messageAttributes,
    };

    console.log(
      `PUBLISHING TO SNS: ${params.Subject} -> ${JSON.stringify(messageAttributes)}`
    );
    console.log("SNS Payload:", JSON.stringify(params, null, 2));

    const result = await snsClient.send(new PublishCommand(params));

    console.log(`📧 [SNS] Published message ${result.MessageId} | Subject: "${subject}"`);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error(`[SNS] Publish failed | Subject: "${subject}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Backward-compatible alias for existing call sites
export const notify = publishNotification;

// ─── Pre-built attribute helpers ───────────────────────────────────────────
/** Returns MessageAttributes that route to ALL admin subscribers */
export function adminAttributes() {
  return {
    recipient_role: { DataType: "String", StringValue: "ADMIN" },
  };
}

/** Returns MessageAttributes that route to ONE specific student subscriber */
export function studentAttributes(email) {
  return {
    recipient_email: { DataType: "String", StringValue: email },
  };
}

/**
 * Sends approval notifications to the dynamic student recipient.
 * Priority: notificationEmail, then fallback to login email.
 */
export async function sendApprovalNotification(user, equipmentName) {
  const studentEmail =
    user?.notificationEmail?.trim() ||
    user?.email?.trim();

  if (!studentEmail) {
    console.warn("[snsService.sendApprovalNotification] User has no notificationEmail or email; skipping publish.");
    return {
      success: false,
      error: "No valid recipient email",
    };
  }

  const studentName = user?.name?.trim() || "Student";

  return publishNotification(
    `Hi ${studentName}, your request for ${equipmentName} has been approved. Please collect it from the lab.`,
    `Lab Equipment Approved: ${equipmentName}`,
    studentAttributes(studentEmail)
  );
}
