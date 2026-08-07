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
