import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { FaqList } from "@/components/ui/FaqList";
import { FAQS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ILLUMINATE events, fees, team sizes and payment verification.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="Questions" title="FAQ">
        <p>
          Answers based on confirmed event information. Already registered?{" "}
          <Link href="/registration" className="text-flare underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
            Check your registration status
          </Link>
          .
        </p>
      </PageHero>
      <Container className="pb-28">
        <FaqList items={FAQS} />
      </Container>
    </>
  );
}
