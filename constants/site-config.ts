/**
 * Copy that doesn't belong in the database — reused across the PDP
 * accordion (specs/06) and the dedicated policy pages linked from the
 * footer (specs/05). Editing this file is the intended way to change this
 * copy; no admin UI is planned for it.
 */
export const SITE_POLICIES = {
  shipping: `We dispatch every order within 1-2 business days. Delivery across Pakistan
typically takes 3-5 business days via our courier partners. Cash on Delivery is
available nationwide; bank transfer orders are dispatched once payment is
confirmed.`,
  returns: `Not quite right? Unworn items with tags attached can be returned within 7
days of delivery for a replacement or store credit. Earrings can't be returned
for hygiene reasons unless the item arrives damaged or defective. Contact us
via WhatsApp with your order reference to start a return.`,
} as const;
