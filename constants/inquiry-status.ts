export const INQUIRY_STATUSES = ["new", "in_progress", "won", "closed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
