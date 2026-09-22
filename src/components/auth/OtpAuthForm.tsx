"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * Two-step SMS OTP auth used for both login and registration.
 * Step 1: enter phone → request code. Step 2: enter code (+ optional name for
 * first-time users) → verify & sign in. Registration and login are unified on
 * the backend (Contact is created on first verified OTP).
 */
export function OtpAuthForm({ collectName = false }: { collectName?: boolean }) {
  const router = useRouter();
  const t = useT();
  const { requestOtp, otpLogin, isLoading } = useAuthStore();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setError(null);
    if (phone.trim().length < 5) {
      setError(t("phone_required", "Please enter a valid phone number"));
      return;
    }
    setSending(true);
    try {
      await requestOtp(phone.trim());
      toast.success(t("otp_sent", "Verification code sent"));
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setError(null);
    if (code.trim().length < 4) {
      setError(t("otp_required", "Enter the verification code"));
      return;
    }
    try {
      await otpLogin(phone.trim(), code.trim(), collectName ? name.trim() : undefined);
      appToast.loginSuccess(useAuthStore.getState().customer?.name || "");
      router.push("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    }
  };

  if (step === "phone") {
    return (
      <div className="space-y-4">
        {collectName && (
          <Input
            label={t("full_name", "Full Name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <Input
          label={t("phone", "Phone")}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="button" variant="primary" fullWidth loading={sending} onClick={sendCode}>
          {t("send_code", "Send Code")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        {t("otp_sent_to", "We sent a code to")} <span className="font-medium">{phone}</span>
      </p>
      <Input
        label={t("verification_code", "Verification Code")}
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        error={error ?? undefined}
      />
      <Button type="button" variant="primary" fullWidth loading={isLoading} onClick={verify}>
        {t("verify_and_continue", "Verify & Continue")}
      </Button>
      <button
        type="button"
        onClick={() => { setStep("phone"); setCode(""); setError(null); }}
        className="w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-brand-ink"
      >
        {t("change_number", "Change number")}
      </button>
    </div>
  );
}
