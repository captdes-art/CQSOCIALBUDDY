import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CQ Social Buddy",
  description: "Terms of Service for CQ Social Buddy by Celtic Quest Fishing",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-10">
          Last updated: March 15, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By using CQ Social Buddy (&quot;the App&quot;), operated by Celtic Quest
              Fishing Fleet, you agree to these Terms of Service. If you do not
              agree, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Description of Service
            </h2>
            <p>
              CQ Social Buddy is a social media management tool that allows
              Celtic Quest Fishing Fleet to manage communications across
              Facebook, Instagram, and other social platforms. The App uses
              AI-assisted features to help our team respond to customer
              inquiries.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Use of the Service
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the App for any unlawful purpose.</li>
              <li>Transmit harmful, offensive, or abusive content.</li>
              <li>Attempt to gain unauthorized access to any part of the App.</li>
              <li>Interfere with or disrupt the App&apos;s operation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Intellectual Property
            </h2>
            <p>
              All content, trademarks, and intellectual property associated
              with CQ Social Buddy and Celtic Quest Fishing Fleet are owned by
              Celtic Quest Fishing Fleet. You may not reproduce or distribute
              any content without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Privacy
            </h2>
            <p>
              Your use of the App is also governed by our{" "}
              <a
                href="/privacy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Privacy Policy
              </a>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Disclaimer of Warranties
            </h2>
            <p>
              The App is provided &quot;as is&quot; without warranties of any kind,
              either express or implied. Celtic Quest Fishing Fleet does not
              warrant that the App will be uninterrupted, error-free, or free
              of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Celtic Quest Fishing
              Fleet shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of, or
              inability to use, the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes
              will be effective immediately upon posting. Your continued use of
              the App constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the State of New York,
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Contact Us
            </h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a
                href="mailto:captdes@gmail.com"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                captdes@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground">
          Celtic Quest Fishing Fleet &mdash; CQ Social Buddy
        </div>
      </div>
    </main>
  );
}
