import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = { title: "Create an Account" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
