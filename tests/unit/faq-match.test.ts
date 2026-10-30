import { describe, expect, it } from "vitest";
import { findBestFaq, tokenize } from "@/features/support/faq-match";
import type { FaqDTO } from "@/features/support/types";

const FAQS: FaqDTO[] = [
  { id: "1", question: "How long does delivery take?", answer: "Delivery across Pakistan takes 3-5 business days." },
  { id: "2", question: "What payment methods do you accept?", answer: "Cash on Delivery, EasyPaisa and JazzCash." },
  { id: "3", question: "What is your return policy?", answer: "Unworn items can be returned within 7 days." },
];

describe("tokenize", () => {
  it("drops stopwords and punctuation and singularizes plurals", () => {
    expect(tokenize("What are your returns?!")).toEqual(["return"]);
  });
});

describe("findBestFaq", () => {
  it("matches a differently-worded question", () => {
    expect(findBestFaq("how many days will delivery take", FAQS)?.id).toBe("1");
    expect(findBestFaq("can I return something?", FAQS)?.id).toBe("3");
  });

  it("treats shipping and delivery as the same thing", () => {
    expect(findBestFaq("how many days for shipping", FAQS)?.id).toBe("1");
  });

  it("matches on words that only appear in the answer", () => {
    expect(findBestFaq("jazzcash or easypaisa", FAQS)?.id).toBe("2");
  });

  it("returns null instead of guessing when nothing fits", () => {
    expect(findBestFaq("is the moon made of cheese", FAQS)).toBeNull();
  });

  it("returns null for empty or stopword-only input", () => {
    expect(findBestFaq("   ", FAQS)).toBeNull();
    expect(findBestFaq("what is the", FAQS)).toBeNull();
  });

  it("returns null when there are no quick answers", () => {
    expect(findBestFaq("delivery", [])).toBeNull();
  });
});
