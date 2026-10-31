"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { projectInquiries } from "@/db/schema";
import { allowRequest } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/send-email";
import { inquirySchema } from "@/features/agency/types";
import { SERVICES } from "@/constants/agency";
import NewInquiry from "@/emails/new-inquiry";
import InquiryReceived from "@/emails/inquiry-received";

const HOUR_MS = 60 * 60 * 1000;

export type SubmitInquiryResult = { ok: true } | { ok: false; error: string };

function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Saves a "start a project" enquiry and emails it to the studio owner, with a receipt to the sender.
 * Public (no account needed), so it validates everything again on the server, ignores bots that
 * fill the hidden `trap` field, and caps submissions per address.
 */
export async function submitInquiry(input: unknown, trap = ""): Promise<SubmitInquiryResult> {
  // A real visitor never sees this field. Pretend success so bots learn nothing.
  if (trap.trim()) return { ok: true };

  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(`inquiry:ip:${ip}`, 5, HOUR_MS) || !allowRequest(`inquiry:email:${data.email}`, 3, HOUR_MS)) {
    return { ok: false, error: "You've sent a few enquiries already. Please wait a while before sending another." };
  }

  try {
    await db.insert(projectInquiries).values({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      businessName: data.businessName,
      industry: data.industry || null,
      services: data.services,
      budgetRange: data.budgetRange || null,
      existingWebsite: data.existingWebsite || null,
      message: data.message,
    });
  } catch (error) {
    console.error("[inquiry] Could not save enquiry:", error instanceof Error ? error.message : error);
    return { ok: false, error: "Something went wrong saving your enquiry. Please try again in a moment." };
  }

  // The enquiry is already saved, so a failed email must not turn a success into an error.
  const notifyTo = process.env.INQUIRY_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  const serviceTitles = data.services.map((slug) => SERVICES.find((service) => service.slug === slug)?.title ?? slug);
  await Promise.all([
    notifyTo
      ? sendEmail({
          to: notifyTo,
          subject: `New project enquiry: ${data.businessName}`,
          react: NewInquiry({
            ...data,
            services: serviceTitles,
            adminUrl: `${siteUrl()}/admin/inquiries`,
          }),
          replyTo: data.email,
        })
      : Promise.resolve(console.warn("[inquiry] INQUIRY_NOTIFY_EMAIL is not set, so no notification was sent.")),
    sendEmail({
      to: data.email,
      subject: "We've received your project details — Lustre & Lace",
      react: InquiryReceived({ name: data.name, businessName: data.businessName, siteUrl: siteUrl() }),
    }),
  ]);

  return { ok: true };
}
