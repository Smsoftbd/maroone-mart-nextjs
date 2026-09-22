"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStoreConfig } from "@/components/providers/StoreConfigProvider";
import { appToast } from "@/lib/utils/toast";
import { useT } from "@/lib/i18n/I18nProvider";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(5, "Phone is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { authMode } = useStoreConfig();
  const t = useT();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Guest-only stores have no registration UI. SMS OTP unifies login/register,
  // so send OTP registration to the login screen.
  useEffect(() => {
    if (authMode === "guest_only") router.replace("/");
    else if (authMode === "sms_otp") router.replace("/login");
  }, [authMode, router]);

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      appToast.loginSuccess(data.name);
      router.push("/account");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      appToast.apiError(msg);
    }
  };

  if (authMode !== "email_password") return null;

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8">
      <h1 className="font-display text-2xl font-bold mb-1">{t("create_account", "Create Account")}</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {t("join_us_today", "Join us today")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={`${t("full_name", "Full Name")} *`} {...register("name")} error={errors.name?.message} />
        <Input label={`${t("email", "Email")} *`} type="email" {...register("email")} error={errors.email?.message} />
        <Input label={`${t("phone", "Phone")} *`} type="tel" {...register("phone")} error={errors.phone?.message} />
        <Input
          label={`${t("password", "Password")} *`}
          type="password"
          {...register("password")}
          error={errors.password?.message}
          helper={t("password_helper", "Minimum 6 characters")}
        />
        <Input
          label={`${t("confirm_password", "Confirm Password")} *`}
          type="password"
          {...register("password_confirmation")}
          error={errors.password_confirmation?.message}
        />
        <Button type="submit" variant="primary" fullWidth loading={isLoading}>
          {t("create_account", "Create Account")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        {t("have_account", "Already have an account?")}{" "}
        <Link href="/login" className="text-brand-ink font-medium hover:text-brand-ink">
          {t("sign_in", "Sign in")}
        </Link>
      </p>
    </div>
  );
}
