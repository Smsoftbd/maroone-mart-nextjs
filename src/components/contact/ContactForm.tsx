"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { appToast } from "@/lib/utils/toast";
import { setTrackingUserData, track } from "@/lib/analytics/track";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

/** Contact form with its own sent state; posts to /api/contact. */
export function ContactForm() {
  const t = useT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setTrackingUserData(buildMetaUserData(data));
      track.contact();
      setSuccess(true);
      reset();
    } catch {
      appToast.apiError("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
        </span>
        <p className="mt-5 font-display text-xl font-semibold">{t("message_sent", "Message sent!")}</p>
        <p className="mt-1.5 max-w-sm text-sm text-[var(--color-text-secondary)]">
          {t("message_sent_hint", "Thanks for reaching out. We'll get back to you as soon as possible.")}
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm font-semibold text-[var(--color-brand-500)] hover:underline"
        >
          {t("send_another_message", "Send another message")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="checkout-field">
          <label htmlFor="contact-name">
            {t("full_name", "Full Name")} <span className="req">*</span>
          </label>
          <input
            id="contact-name"
            autoComplete="name"
            placeholder={t("full_name", "Full Name")}
            className={cn("checkout-input", errors.name && "has-error")}
            {...register("name")}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="checkout-field">
          <label htmlFor="contact-phone">{t("phone", "Phone")}</label>
          <input
            id="contact-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phone_number", "Phone Number")}
            className="checkout-input"
            {...register("phone")}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="checkout-field">
          <label htmlFor="contact-email">{t("email", "Email")}</label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder={t("email_placeholder", "your@email.com")}
            className={cn("checkout-input", errors.email && "has-error")}
            {...register("email")}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div className="checkout-field">
          <label htmlFor="contact-subject">{t("subject", "Subject")}</label>
          <input
            id="contact-subject"
            placeholder={t("contact_subject_ph", "Order, product, delivery…")}
            className="checkout-input"
            {...register("subject")}
          />
        </div>
      </div>

      <div className="checkout-field">
        <label htmlFor="contact-message">
          {t("message", "Message")} <span className="req">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={6}
          placeholder={t("contact_msg_ph", "How can we help you?")}
          className={cn("checkout-input resize-y", errors.message && "has-error")}
          {...register("message")}
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message.message}</p>}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
        {!isSubmitting && <Send className="h-4 w-4" />}
        {t("send_message", "Send Message")}
      </Button>
    </form>
  );
}
