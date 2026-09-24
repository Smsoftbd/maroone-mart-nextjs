"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, MapPin, ShieldCheck, UserRound, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils/cn";
import type { Customer } from "@/lib/api/types";

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
    password: z.string().min(6, "At least 6 characters").optional().or(z.literal("")),
    password_confirmation: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !d.password || d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof schema>;

const toFormValues = (c: Customer | null): FormData => ({
  name: c?.name || "",
  phone: c?.phone || "",
  address: c?.address || "",
  city: c?.city || "",
  state: c?.state || "",
  country: c?.country || "",
  postal_code: c?.postal_code || "",
  password: "",
  password_confirmation: "",
});

const PROFILE_FIELDS = ["name", "phone", "address", "city", "state", "country", "postal_code"] as const;

function initials(name?: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

// 0–4: length, mixed case, digit, symbol.
function passwordScore(pw: string) {
  if (!pw) return 0;
  let score = pw.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(score, 1);
}

const STRENGTH = [
  { label: "", bar: "" },
  { label: "Weak", bar: "bg-red-500" },
  { label: "Fair", bar: "bg-amber-500" },
  { label: "Good", bar: "bg-lime-500" },
  { label: "Strong", bar: "bg-green-600" },
];

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <section className="store-card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="rounded-lg bg-brand-50 p-2 shrink-0">
          <Icon className="h-4 w-4 text-brand-ink" />
        </div>
        <div>
          <h3 className="font-semibold text-[15px] leading-tight">{title}</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, error, id, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-form-label,var(--color-text-primary))]">
        {label}
      </label>
      <div className="relative">
        <Input ref={ref} id={id} type={visible ? "text" : "password"} className="pr-11" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export default function ProfilePage() {
  const { customer, updateProfile } = useAuthStore();
  const t = useT();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(customer),
  });

  const password = useWatch({ control, name: "password" }) || "";
  const watchedName = useWatch({ control, name: "name" });
  const score = passwordScore(password);

  const filled = PROFILE_FIELDS.filter((f) => customer?.[f]?.toString().trim()).length;
  const completion = Math.round((filled / PROFILE_FIELDS.length) * 100);

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile({
        ...data,
        password: data.password || undefined,
        password_confirmation: data.password_confirmation || undefined,
      });
      reset({ ...data, password: "", password_confirmation: "" });
      appToast.profileUpdated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Identity header */}
      <div className="store-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[var(--color-primary-text)] flex items-center justify-center font-display text-xl font-semibold ring-4 ring-brand-50">
          {initials(watchedName || customer?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold truncate">
            {watchedName || customer?.name || t("edit_profile", "Edit Profile")}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-0.5 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {customer?.email}
          </p>
        </div>
        <div className="sm:w-48">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--color-text-muted)]">{t("profile_complete", "Profile complete")}</span>
            <span className="font-semibold text-brand-ink">{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <Section
        icon={UserRound}
        title={t("personal_info", "Personal information")}
        desc={t("personal_info_desc", "How we address you and reach you about orders.")}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            id="name"
            label={`${t("full_name", "Full Name")} *`}
            autoComplete="name"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            id="phone"
            label={t("phone", "Phone")}
            type="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            {...register("phone")}
          />
          <div className="sm:col-span-2">
            <Input
              id="email"
              label={t("email", "Email")}
              value={customer?.email || ""}
              readOnly
              disabled
              helper={t("email_locked_hint", "Email can't be changed. Contact support if you need help.")}
            />
          </div>
        </div>
      </Section>

      <Section
        icon={MapPin}
        title={t("default_address", "Default address")}
        desc={t("default_address_desc", "Pre-filled at checkout to save you time.")}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              id="address"
              label={t("address", "Address")}
              autoComplete="street-address"
              placeholder={t("address_placeholder", "House, road, area")}
              {...register("address")}
            />
          </div>
          <Input id="city" label={t("city", "City")} autoComplete="address-level2" {...register("city")} />
          <Input id="state" label={t("state", "State")} autoComplete="address-level1" {...register("state")} />
          <Input id="country" label={t("country", "Country")} autoComplete="country-name" {...register("country")} />
          <Input
            id="postal_code"
            label={t("postal_code", "Postal Code")}
            autoComplete="postal-code"
            inputMode="numeric"
            {...register("postal_code")}
          />
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        title={t("security", "Security")}
        desc={t("change_password_hint", "Change Password (leave blank to keep current)")}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <PasswordInput
              id="password"
              label={t("new_password", "New Password")}
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />
            {password && (
              <div className="mt-2">
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 rounded-full transition-colors",
                        i <= score ? STRENGTH[score].bar : "bg-[var(--color-border)]"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{STRENGTH[score].label}</p>
              </div>
            )}
          </div>
          <PasswordInput
            id="password_confirmation"
            label={t("confirm_password", "Confirm Password")}
            autoComplete="new-password"
            {...register("password_confirmation")}
            error={errors.password_confirmation?.message}
          />
        </div>
      </Section>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10">
        <div className="store-card px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <p className="text-sm flex items-center gap-2 text-[var(--color-text-secondary)] min-w-0">
            {isDirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">{t("unsaved_changes", "Unsaved changes")}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-brand-ink shrink-0" />
                <span className="truncate">{t("all_saved", "All changes saved")}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {isDirty && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => reset(toFormValues(customer))}
                disabled={isSubmitting}
              >
                {t("discard", "Discard")}
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting} disabled={!isDirty}>
              {t("save_changes", "Save Changes")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
