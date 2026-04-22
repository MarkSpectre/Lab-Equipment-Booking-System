import {
  PublishCommand,
  SetSubscriptionAttributesCommand,
  SNSClient,
  SubscribeCommand,
} from "@aws-sdk/client-sns";
import { env } from "../config/env.js";

const snsClient = new SNSClient({ region: "us-east-1" });

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

export async function subscribeUser(email, role) {
  if (!guardTopicArn("subscribeUser")) {
    return { success: false, error: "AWS_SNS_TOPIC_ARN not set" };
  }

  const normalizedRole = String(role).toUpperCase();

  const filterPolicy =
    normalizedRole === "ADMIN"
      ? { email_type: ["admin_notification"] }
      : { email_type: ["student_notification"] };

  try {
    const result = await snsClient.send(
      new SubscribeCommand({
        TopicArn: env.awsSnsTopicArn,
        Protocol: "email",
        Endpoint: email,
        ReturnSubscriptionArn: true,
      })
    );

    const subscriptionArn = result.SubscriptionArn;
    console.log(
      `📬 [SNS] Subscribed (${normalizedRole}) ${email} → ARN: ${subscriptionArn}`
    );

    await setFilterPolicy(subscriptionArn, filterPolicy);

    return { success: true, subscriptionArn };
  } catch (error) {
    console.error(`[SNS] Subscription failed for ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function sendSNS(subject, message, targetEmail, role) {
  if (!guardTopicArn("sendSNS")) {
    return { success: false, error: "AWS_SNS_TOPIC_ARN not set" };
  }

  try {
    const normalizedRole = String(role || "").toUpperCase();
    const messageAttributes =
      normalizedRole === "ADMIN"
        ? {
            email_type: { DataType: "String", StringValue: "admin_notification" },
          }
        : {
            email_type: {
              DataType: "String",
              StringValue: "student_notification",
            },
          };

    if (
      normalizedRole !== "ADMIN" &&
      !targetEmail
    ) {
      return { success: false, error: "targetEmail is required for non-ADMIN" };
    }

    const params = {
      TopicArn: env.awsSnsTopicArn,
      Subject: String(subject || "").slice(0, 100),
      Message: message,
      MessageAttributes: messageAttributes,
    };

    const result = await snsClient.send(new PublishCommand(params));

    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error(`[SNS] Publish failed | Subject: "${subject}":`, error.message);
    return { success: false, error: error.message };
  }
}

export async function notifyStudent(studentEmail, studentName, equipmentName, status) {
  const subject = `Lab Equipment ${status}: ${equipmentName}`;
  const message = status === "Approved"
    ? `Hi ${studentName},\n\nYour request for "${equipmentName}" has been APPROVED.\nYou may now collect the equipment from the lab.\n\nRegards,\nLab Management System`
    : `Hi ${studentName},\n\nYour request for "${equipmentName}" has been REJECTED.\nPlease contact the lab administrator for more information.\n\nRegards,\nLab Management System`;
  return sendSNS(subject, message, studentEmail, "STUDENT");
}

export async function notifyAdmin(studentName, studentEmail, equipmentName) {
  const subject = `New Lab Request: ${equipmentName}`;
  const message = `A new lab equipment request has been submitted.\n\nStudent: ${studentName}\nEmail: ${studentEmail}\nEquipment: ${equipmentName}\n\nPlease log in to review and approve/reject this request.`;
  return sendSNS(subject, message, null, "ADMIN");
}
