import {
    publishApprovalNotification,
    subscribeEmail,
} from "./awsService.js";

// ─── Send approval email notification ─────────────────────────────────────
/**
 * Canonical approval notifier used by requestService.
 *
 * Signature matches the spec: sendApprovalEmail(studentEmail, equipmentName)
 * but also accepts the richer object form for backward compatibility.
 *
 * Error handling: SNS failures are logged but never thrown – the caller's
 * DB transaction has already committed, so we must not roll back the UI.
 *
 * @param {string} studentEmail
 * @param {string} equipmentName
 * @param {object} [opts]
 * @param {string} [opts.studentName]
 * @param {Date}   [opts.dueDate]
 */
export async function sendApprovalEmail(studentEmail, equipmentName, opts = {}) {
    try {
        await publishApprovalNotification({
            studentEmail,
            equipmentName,
            studentName: opts.studentName ?? studentEmail, // fallback to email if name unavailable
            dueDate: opts.dueDate ?? new Date(),
        });
    } catch (error) {
        // Non-fatal: log the error and let the request status update stand
        console.error(
            `⚠️  SNS approval notification failed for ${studentEmail}:`,
            error?.message ?? error
        );
    }
}

// Keep the old function name as an alias so existing callers don't break
export async function sendRequestApprovedNotification({
    studentName,
    studentEmail,
    equipmentName,
    dueDate,
}) {
    await sendApprovalEmail(studentEmail, equipmentName, { studentName, dueDate });
}

// ─── Subscribe student email to SNS Topic ─────────────────────────────────
/**
 * Called during STUDENT signup.  Triggers an AWS confirmation email;
 * the subscription only becomes active after the student clicks "Confirm".
 *
 * Error handling: subscription failures are non-fatal – the signup still
 * succeeds so the student account is created regardless.
 *
 * @param {string} email – Student's email address
 */
export async function subscribeStudentEmail(email) {
    try {
        await subscribeEmail(email);
    } catch (error) {
        console.error(
            `⚠️  SNS email subscription failed for ${email}:`,
            error?.message ?? error
        );
    }
}