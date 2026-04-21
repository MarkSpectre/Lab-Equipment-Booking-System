import { publishApprovalNotification } from "./awsService.js";

export async function sendRequestApprovedNotification({ studentName, studentEmail, equipmentName, dueDate }) {
  try {
    await publishApprovalNotification({
      studentName,
      studentEmail,
      equipmentName,
      dueDate,
    });
  } catch (error) {
    console.warn("SNS notification skipped:", error?.message || error);
  }
}
