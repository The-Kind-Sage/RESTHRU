"use server";

import { z } from "zod";
import fs from "fs/promises";
import path from "path";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Persists a public "Contact us" submission.
 *
 * There is no dedicated contact-submission table in the schema and no email/ticketing
 * service wired into this app yet (no Notification row fits — that model requires a
 * restaurantId/recipientUserId, neither of which exists for an anonymous marketing-site
 * visitor). Until a real inbox/CRM integration is built, submissions are appended to a
 * server-side log file so nothing is silently dropped, and also written to the server
 * console so it shows up in hosting logs. This is a deliberately minimal stand-in --
 * swap the persistence below for a real email send or support-ticket table when one
 * exists.
 */
export async function submitContactMessage(input: ContactFormData) {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission" };
  }

  const entry = {
    ...parsed.data,
    submittedAt: new Date().toISOString(),
  };

  console.log("[contact] New submission:", entry);

  try {
    const logDir = path.join(process.cwd(), "data");
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(
      path.join(logDir, "contact-submissions.jsonl"),
      `${JSON.stringify(entry)}\n`,
      "utf-8"
    );
  } catch (err) {
    // Filesystem writes can fail in read-only/serverless environments -- the console.log
    // above already captured the submission, so don't fail the request over this.
    console.error("[contact] Failed to write contact-submissions.jsonl:", err);
  }

  return { data: { success: true } };
}
