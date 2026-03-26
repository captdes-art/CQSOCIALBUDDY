import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CQ Social Buddy",
  description: "Privacy Policy for CQ Social Buddy by Celtic Quest Fishing",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-10">
          Last updated: February 18, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Introduction
            </h2>
            <p>
              CQ Social Buddy (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is a social media
              management tool operated by Celtic Quest Fishing Fleet. This
              Privacy Policy explains how we collect, use, and protect
              information when you interact with our Facebook Page, Instagram
              account, or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-3">
              When you interact with us through Facebook or Instagram, we may
              collect:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Messages and comments:</strong>{" "}
                Content you send to us via direct messages or post as comments
                on our pages.
              </li>
              <li>
                <strong className="text-foreground">Profile information:</strong>{" "}
                Your public profile name and profile ID as provided by
                Meta&apos;s platform.
              </li>
              <li>
                <strong className="text-foreground">Interaction data:</strong>{" "}
                Timestamps and metadata related to your messages and comments.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. How We Use Your Information
            </h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Respond to your messages and comments in a timely manner.</li>
              <li>
                Provide customer support and answer questions about our fishing
                charter services.
              </li>
              <li>
                Improve our social media response quality and customer
                experience.
              </li>
              <li>
                Generate analytics about conversation volume and response times
                (in aggregate, not individually identifiable).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. AI-Assisted Responses
            </h2>
            <p>
              Our App uses artificial intelligence to help draft responses to
              messages and comments. All AI-generated responses are reviewed
              by a human team member before being sent. We do not use your
              messages to train AI models. The AI is used solely to assist our
              team in providing faster, more helpful responses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Data Storage and Security
            </h2>
            <p>
              Your data is stored securely using industry-standard encryption
              and access controls. We use Supabase (hosted on AWS) for data
              storage with row-level security policies. Access to your data is
              limited to authorized team members of Celtic Quest Fishing Fleet.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Data Sharing
            </h2>
            <p className="mb-3">
              We do not sell, rent, or share your personal information with
              third parties, except:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Service providers:</strong>{" "}
                We use third-party services (Supabase, Vercel, OpenAI) to
                operate our App. These providers only process data on our behalf
                and are bound by their own privacy policies.
              </li>
              <li>
                <strong className="text-foreground">Legal requirements:</strong>{" "}
                We may disclose information if required by law or to protect our
                rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Data Retention
            </h2>
            <p>
              We retain conversation data for as long as necessary to provide
              our services and support. You may request deletion of your data
              at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Your Rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to the data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of future communications.</li>
              <li>
                Revoke the App&apos;s access to your data through your Facebook
                or Instagram settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Data Deletion
            </h2>
            <p>
              To request deletion of your data, please email us at{" "}
              <a
                href="mailto:captdes@gmail.com"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                captdes@gmail.com
              </a>
              . We will process your request within 30 days. You can also remove
              the App&apos;s access to your data through your Facebook or Instagram
              privacy settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or your data,
              please contact us at{" "}
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
