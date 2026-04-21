import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { env } from "../config/env.js";

const snsClientConfig = {
  region: env.awsRegion,
};

if (env.awsAccessKeyId && env.awsSecretAccessKey) {
  snsClientConfig.credentials = {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
    sessionToken: env.awsSessionToken || undefined,
  };
}

const snsClient = new SNSClient(snsClientConfig);

export async function publishApprovalNotification({ studentName, studentEmail, equipmentName, dueDate }) {
  if (!env.awsSnsTopicArn) {
    return;
  }

  const subject = "Lab Request Approved";
  const message = [
    `Hi ${studentName},`,
    "",
    `Your request for \"${equipmentName}\" has been approved.`,
    `Due date: ${new Date(dueDate).toDateString()}`,
    `Student email: ${studentEmail}`,
    "",
    "Please return the equipment before the due date.",
  ].join("\n");

  await snsClient.send(
    new PublishCommand({
      TopicArn: env.awsSnsTopicArn,
      Subject: subject,
      Message: message,
    })
  );
}
