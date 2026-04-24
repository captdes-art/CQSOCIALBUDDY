import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — CQ Social Buddy",
  description: "How to request deletion of your data from CQ Social Buddy",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          User Data Deletion
        </h1>
        <p className="text-muted-foreground mb-10">
          Last updated: March 15, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              How to Request Data Deletion
            </h2>
            <p className="mb-4">
              CQ Social Buddy, operated by Celtic Quest Fishing Fleet, respects
              your right to have your data deleted. If you would like us to
              delete any personal data we have collected about you through our
              Facebook or Instagram integrations, please follow the steps below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Option 1: Remove App Access via Facebook
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to your Facebook account settings.</li>
              <li>Navigate to <strong className="text-foreground">Settings &amp; Privacy &rarr; Settings</strong>.</li>
              <li>Click <strong className="text-foreground">Apps and Websites</strong>.</li>
              <li>Find <strong className="text-foreground">CQ Social Buddy</strong> and click <strong className="text-foreground">Remove</strong>.</li>
              <li>This will revoke the App&apos;s access to your Facebook data.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Option 2: Email Us Directly
            </h2>
            <p className="mb-3">
              To request complete deletion of all data associated with your
              account, send an email to:
            </p>
            <p className="mb-3">
              <a
                href="mailto:captdes@gmail.com"
                className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
              >
                captdes@gmail.com
              </a>
            </p>
            <p>
              Please include your full name and the Facebook or Instagram
              profile name associated with your account. We will process your
              request and confirm deletion within <strong className="text-foreground">30 days</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              What Gets Deleted
            </h2>
            <p className="mb-3">Upon a verified deletion request, we will remove:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All messages and comments stored in our system.</li>
              <li>Your profile name and profile ID.</li>
              <li>Any interaction history and metadata associated with your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Questions
            </h2>
            <p>
              If you have questions about our data practices, please review our{" "}
              <a
                href="/privacy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Privacy Policy
              </a>{" "}
              or contact us at{" "}
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
