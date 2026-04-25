"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { appToast } from "@/lib/utils/toast";

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
      <h2 className="font-display text-xl font-semibold mb-6">Edit Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <Input label="Full Name *" {...register("name")} error={errors.name?.message} />
        <Input label="Phone" type="tel" {...register("phone")} />
        <Input label="Address" {...register("address")} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" {...register("city")} />
          <Input label="State" {...register("state")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Country" {...register("country")} />
          <Input label="Postal Code" {...register("postal_code")} />
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-medium mb-3 text-[var(--color-text-secondary)]">
            Change Password (leave blank to keep current)
          </p>
          <Input
            label="New Password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="mt-4">
            <Input
              label="Confirm Password"
              type="password"
              {...register("password_confirmation")}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" loading={isLoading}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
