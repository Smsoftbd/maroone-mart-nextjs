"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStoreConfig } from "@/components/providers/StoreConfigProvider";
import { appToast } from "@/lib/utils/toast";
import { useT } from "@/lib/i18n/I18nProvider";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { authMode } = useStoreConfig();
  const t = useT();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Guest-only stores have no login UI — bounce home.
  useEffect(() => {
    if (authMode === "guest_only") router.replace("/");
  }, [authMode, router]);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      appToast.loginSuccess(useAuthStore.getState().customer?.name || "");
      router.push("/account");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      appToast.apiError(msg);
    }
  };

  if (authMode === "guest_only") return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h1 className="font-display text-2xl font-bold mb-1">{t("welcome_back", "Welcome back")}</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {authMode === "sms_otp"
          ? t("sign_in_otp_subtitle", "Sign in with your phone number")
          : t("sign_in_subtitle", "Sign in to your account")}
      </p>

      {authMode === "sms_otp" ? (
        <OtpAuthForm collectName />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t("email", "Email")}
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label={t("password", "Password")}
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            {t("sign_in", "Sign In")}
          </Button>
        </form>
      )}

      {authMode === "email_password" && (
        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {t("no_account", "Don't have an account?")}{" "}
          <Link href="/register" className="text-brand-500 font-medium hover:text-brand-600">
            {t("create_one", "Create one")}
          </Link>
        </p>
      )}
    </div>
  );
}
