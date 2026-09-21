"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { appToast } from "@/lib/utils/toast";
import { metaEvents, setMetaUserData } from "@/lib/analytics/meta";
import { buildMetaUserData } from "@/lib/analytics/meta-shared";
import { useT } from "@/lib/i18n/I18nProvider";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
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
      setMetaUserData(buildMetaUserData(data));
      metaEvents.contact();
      setSuccess(true);
      reset();
    } catch {
      appToast.apiError("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-bold mb-2">{t("contact_us", "Contact Us")}</h1>
      <p className="text-[var(--color-text-secondary)] mb-10">
        We&apos;d love to hear from you. Send us a message!
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="font-display text-xl font-semibold text-green-800 mb-2">
                Message Sent!
              </p>
              <p className="text-sm text-green-700">
                We&apos;ll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 text-sm text-green-600 underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label={`${t("full_name", "Full Name")} *`} {...register("name")} error={errors.name?.message} />
              <Input label={t("email", "Email")} type="email" {...register("email")} error={errors.email?.message} />
              <Input label={t("phone", "Phone")} type="tel" {...register("phone")} />
              <Input label={t("subject", "Subject")} {...register("subject")} />
              <div>
                <label className="text-sm font-medium block mb-1">{t("message", "Message")} *</label>
                <textarea
                  {...register("message")}
                  rows={5}
                  className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t("contact_msg_ph", "How can we help you?")}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
                )}
              </div>
              <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
                {t("send_message", "Send Message")}
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-50 p-3 rounded-xl">
              <MapPin className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{t("address", "Address")}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Contact our store for our address details.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-brand-50 p-3 rounded-xl">
              <Phone className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{t("phone", "Phone")}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Available during business hours
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-brand-50 p-3 rounded-xl">
              <Mail className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{t("email", "Email")}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                We respond within 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
