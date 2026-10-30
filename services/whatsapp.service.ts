/**
 * Builds a wa.me deep link with a pre-filled message. Screenshot attachment
 * stays manual on the customer's end — a wa.me link can pre-fill text, not
 * attach a file, so this is the practical limit of what gets automated
 * (specs/10).
 */
export function buildWhatsAppLink(businessNumber: string, orderReference: string): string {
  const message = `Hi, here's my payment for order ${orderReference}.`;
  const digitsOnly = businessNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

/** A plain "say hello" link for the Contact page. */
export function buildWhatsAppChatLink(businessNumber: string): string {
  const digitsOnly = businessNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent("Hi, I have a question about Lustre & Lace.")}`;
}

/** The seeded default ("923XXXXXXXXX") is a placeholder, not a number — don't render a dead link for it. */
export function isRealWhatsAppNumber(businessNumber: string): boolean {
  return /^\+?\d[\d\s-]{7,}$/.test(businessNumber.trim());
}
