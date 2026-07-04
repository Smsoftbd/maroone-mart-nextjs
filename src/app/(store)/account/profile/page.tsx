"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";
import { useT } from "@/lib/i18n/I18nProvider";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  password_confirmation: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { customer, updateProfile, isLoading } = useAuthStore();
  const t = useT();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      city: customer?.city || "",
      state: customer?.state || "",
      country: customer?.country || "",
      postal_code: customer?.postal_code || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile({
        ...data,
        password: data.password || undefined,
        password_confirmation: data.password_confirmation || undefined,
      });
      appToast.addedToCart("Profile updated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      appToast.apiError(msg);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-6">{t("edit_profile", "Edit Profile")}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <Input label={`${t("full_name", "Full Name")} *`} {...register("name")} error={errors.name?.message} />
        <Input label={t("phone", "Phone")} type="tel" {...register("phone")} />
        <Input label={t("address", "Address")} {...register("address")} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("city", "City")} {...register("city")} />
          <Input label={t("state", "State")} {...register("state")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("country", "Country")} {...register("country")} />
          <Input label={t("postal_code", "Postal Code")} {...register("postal_code")} />
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-medium mb-3 text-[var(--color-text-secondary)]">
            {t("change_password_hint", "Change Password (leave blank to keep current)")}
          </p>
          <Input
            label={t("new_password", "New Password")}
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="mt-4">
            <Input
              label={t("confirm_password", "Confirm Password")}
              type="password"
              {...register("password_confirmation")}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" loading={isLoading}>
          {t("save_changes", "Save Changes")}
        </Button>
      </form>
    </div>
  );
}
