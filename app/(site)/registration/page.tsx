import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { StatusLookupForm } from "@/components/registration/StatusLookupForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Check registration status",
  description: "Check the payment verification status of your ILLUMINATE registration.",
  robots: { index: false },
};

export default function RegistrationLookupPage() {
  return (
    <>
      <PageHero eyebrow="Registration" title="Check your status" intensity="faint">
        <p>Enter the registration ID you received after submitting your payment proof.</p>
      </PageHero>
      <Container size="compact" className="pb-32">
        <StatusLookupForm />
      </Container>
    </>
  );
}
