"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { submitInquiry } from "@/actions/inquiries.actions";
import { inquirySchema, type InquiryInput } from "@/features/agency/types";
import { BUDGET_RANGES, INDUSTRIES, SERVICES, type ServiceSlug } from "@/constants/agency";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function EnquiryForm({ defaultService }: { defaultService?: ServiceSlug }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [trap, setTrap] = useState("");
  const [submittedTo, setSubmittedTo] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessName: "",
      industry: "",
      services: defaultService ? [defaultService] : [],
      budgetRange: "",
      existingWebsite: "",
      message: "",
    },
  });

  async function onSubmit(data: InquiryInput) {
    setFormError(null);
    const result = await submitInquiry(data, trap);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSubmittedTo(data.email);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submittedTo) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12" role="status">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <h2 className="mt-5 font-heading text-2xl text-foreground sm:text-3xl">Thank you, we&apos;ve got it</h2>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
          We&apos;ll read your details and reply to <strong className="font-medium text-foreground">{submittedTo}</strong>{" "}
          with some questions and a clear quote. We&apos;ve also sent you a confirmation email.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-7")}>
            Try the demo store
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-7")}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-7 rounded-2xl border border-border bg-card p-4 sm:space-y-8 sm:p-9"
    >
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      <fieldset className="space-y-4">
        <legend className="font-heading text-lg text-foreground">About you</legend>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Your name</FieldLabel>
              <Input id="name" autoComplete="name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">WhatsApp / phone (optional)</FieldLabel>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="0300 1234567" {...register("phone")} />
            <FieldError errors={[errors.phone]} />
          </Field>
        </FieldGroup>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-heading text-lg text-foreground">Your business</legend>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.businessName}>
              <FieldLabel htmlFor="businessName">Business name</FieldLabel>
              <Input id="businessName" autoComplete="organization" {...register("businessName")} />
              <FieldError errors={[errors.businessName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="industry">What kind of business?</FieldLabel>
              <select id="industry" className={SELECT_CLASS} {...register("industry")}>
                <option value="">Choose one</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field data-invalid={!!errors.existingWebsite}>
            <FieldLabel htmlFor="existingWebsite">Current website or Instagram page (optional)</FieldLabel>
            <Input id="existingWebsite" placeholder="https://" {...register("existingWebsite")} />
            <FieldError errors={[errors.existingWebsite]} />
          </Field>
        </FieldGroup>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-heading text-lg text-foreground">What do you need?</legend>
        <Controller
          control={control}
          name="services"
          render={({ field }) => (
            <div>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5" role="group" aria-label="Services you are interested in">
                {SERVICES.map((service) => {
                  const selected = field.value.includes(service.slug);
                  return (
                    <button
                      key={service.slug}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        field.onChange(
                          selected ? field.value.filter((slug) => slug !== service.slug) : [...field.value, service.slug]
                        )
                      }
                      className={cn(
                        "flex min-h-14 flex-col justify-center rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:block sm:px-4 sm:py-3",
                        selected
                          ? "border-primary bg-accent text-foreground ring-1 ring-primary"
                          : "border-border bg-background text-foreground/80 hover:border-primary/40"
                      )}
                    >
                      <span className="block font-medium">{service.title}</span>
                      <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{service.tags.join(" · ")}</span>
                    </button>
                  );
                })}
              </div>
              {errors.services && <p className="mt-2 text-sm text-destructive">{errors.services.message}</p>}
            </div>
          )}
        />
        <Field>
          <FieldLabel htmlFor="budgetRange">Rough budget</FieldLabel>
          <select id="budgetRange" className={SELECT_CLASS} {...register("budgetRange")}>
            <option value="">Choose one</option>
            {BUDGET_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </Field>
        <Field data-invalid={!!errors.message}>
          <FieldLabel htmlFor="message">Tell us about your project</FieldLabel>
          <Textarea
            id="message"
            rows={5}
            placeholder="What do you sell, who are your customers, and what would you like to achieve online?"
            {...register("message")}
          />
          <FieldError errors={[errors.message]} />
        </Field>
      </fieldset>

      <div className="space-y-3">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full">
          {isSubmitting ? "Sending..." : "Send my project details"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Free quote, no commitment. We use your details only to reply to this enquiry.
        </p>
      </div>
    </form>
  );
}
