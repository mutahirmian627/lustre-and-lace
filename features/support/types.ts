import { z } from "zod";

export const SUPPORT_MESSAGE_MAX_LENGTH = 1000;

export const supportMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Type a message first.")
    .max(SUPPORT_MESSAGE_MAX_LENGTH, `Messages can be at most ${SUPPORT_MESSAGE_MAX_LENGTH} characters.`),
});

export const faqFormSchema = z.object({
  question: z.string().trim().min(3, "Enter the question").max(200, "Keep the question under 200 characters"),
  answer: z.string().trim().min(3, "Enter the answer").max(1500, "Keep the answer under 1500 characters"),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
});
export type FaqFormInput = z.input<typeof faqFormSchema>;

export interface SupportMessageDTO {
  id: string;
  senderRole: "user" | "admin";
  body: string;
  createdAt: string;
}

export type OrderStatusLookupResult =
  | {
      ok: true;
      reference: string;
      placedAt: string;
      headline: string;
      detail: string;
      tone: "neutral" | "good" | "attention" | "bad";
    }
  | { ok: false; reason: "invalid" | "not_found" | "rate_limited"; message: string };

export interface FaqDTO {
  id: string;
  question: string;
  answer: string;
}

export interface UserThreadDTO {
  status: "open" | "closed";
  userUnreadCount: number;
  messages: SupportMessageDTO[];
}

export interface AdminConversationSummary {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "open" | "closed";
  adminUnreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string;
}

export interface AdminThreadDTO {
  conversation: AdminConversationSummary & { userPhone: string | null };
  messages: SupportMessageDTO[];
}
