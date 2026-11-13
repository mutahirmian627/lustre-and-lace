"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useCart } from "@/features/cart/context/CartProvider";
import { placeOrder } from "@/actions/checkout.actions";
import { checkoutSchema, type CheckoutInput } from "@/features/checkout/types";
import { ContactInfoForm } from "@/features/checkout/components/ContactInfoForm";
import { ShippingAddressForm } from "@/features/checkout/components/ShippingAddressForm";
import { SavedAddressSelector } from "@/features/checkout/components/SavedAddressSelector";
import { PaymentMethodSelector } from "@/features/checkout/components/PaymentMethodSelector";
import { OrderSummarySidebar } from "@/features/checkout/components/OrderSummarySidebar";
import type { addresses } from "@/db/schema";

type Address = typeof addresses.$inferSelect;

export function CheckoutPageClient({ savedAddresses }: { savedAddresses: Address[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { cart, coupon } = useCart();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod", saveAddress: true },
  });

  const didPrefill = useRef(false);
  useEffect(() => {
    if (!session?.user || didPrefill.current) return;
    didPrefill.current = true;
    setValue("customerName", session.user.name);
    setValue("customerEmail", session.user.email);
    if (session.user.phone) {
      setValue("customerPhone", session.user.phone);
      setValue("phone", session.user.phone);
    }
    setValue("fullName", session.user.name);
  }, [session, setValue]);

  const onSubmit = async (data: CheckoutInput) => {
    const result = await placeOrder({ ...data, couponCode: coupon?.code });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.push(`/shop/checkout/confirmation/${result.orderId}`);
  };

  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          Your cart is empty — add something before checking out.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 md:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <ContactInfoForm register={register} errors={errors} />
        <div className="space-y-4">
          <SavedAddressSelector savedAddresses={savedAddresses} setValue={setValue} />
          <ShippingAddressForm
            register={register}
            errors={errors}
            control={control}
            isLoggedIn={!!session?.user}
          />
        </div>
        <PaymentMethodSelector control={control} />
      </div>
      <div>
        <OrderSummarySidebar isSubmitting={isSubmitting} />
      </div>
    </form>
  );
}
