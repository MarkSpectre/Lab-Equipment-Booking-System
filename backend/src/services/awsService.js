import {
    PublishCommand,
    SNSClient,
    SubscribeCommand,
} from "@aws-sdk/client-sns";
import { env } from "../config/env.js";

// ─── SNS Client ────────────────────────────────────────────────────────────
// Credentials block is only added when explicit keys are present in env.
// On EC2 with an attached IAM Role, leave the keys blank and the SDK will
// automatically use the instance metadata service (IMDS).
const snsClientConfig = { region: env.awsRegion };

if (env.awsAccessKeyId && env.awsSecretAccessKey) {
    snsClientConfig.credentials = {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
        ...(env.awsSessionToken ? { sessionToken: env.awsSessionToken } : {}),
    };
}

const snsClient = new SNSClient(snsClientConfig);

// ─── Publish approval email to the SNS Topic ───────────────────────────────
/**
 * @param {string} studentName   – Display name of the student
 * @param {string} studentEmail  – Student's email address  (for logging only;
 *                                 actual delivery goes through the SNS topic)
 * @param {string} equipmentName – Name of the approved equipment
 * @param {Date}   dueDate       – Due date for returning the equipment
 */
export async function publishApprovalNotification({
    studentName,
    studentEmail,
    equipmentName,
    dueDate,
}) {
    if (!env.awsSnsTopicArn) {
        console.warn("AWS_SNS_TOPIC_ARN not set – skipping approval notification.");
        return;
    }

    const subject = `Lab Equipment Approved: ${equipmentName}`;
    const message = [
        `Hi ${studentName}!`,
        "",
        `Your request for "${equipmentName}" has been APPROVED.`,
        "Please collect it from the lab supervisor.",
        "",
        `Return by: ${new Date(dueDate).toDateString()}`,
        `Registered email: ${studentEmail}`,
    ].join("\n");

    await snsClient.send(
        new PublishCommand({
            TopicArn: env.awsSnsTopicArn,
            Subject: subject,
            Message: message,
        })
    );

    console.log(`📧 Approval notification published for ${studentEmail}`);
}

// ─── Subscribe a student email to the SNS Topic ────────────────────────────
/**
 * Subscribes the student's email address to the SNS topic so they can
 * receive future approval emails.  AWS will send a confirmation email;
 * the subscription is only active once the student clicks "Confirm".
 *
 * Idempotent: calling this multiple times for the same email is safe –
 * SNS deduplicates pending/confirmed subscriptions automatically.
 *
 * @param {string} email – Student's email address
 */
export async function subscribeEmail(email) {
    if (!env.awsSnsTopicArn) {
        console.warn("AWS_SNS_TOPIC_ARN not set – skipping email subscription.");
        return;
    }

    const result = await snsClient.send(
        new SubscribeCommand({
            TopicArn: env.awsSnsTopicArn,
            Protocol: "email",
            Endpoint: email,
            // ReturnSubscriptionArn: true so we can log the ARN
            ReturnSubscriptionArn: true,
        })
    );

    console.log(
        `📬 SNS subscription requested for ${email} → ARN: ${result.SubscriptionArn}`
    );

    return result.SubscriptionArn;
}