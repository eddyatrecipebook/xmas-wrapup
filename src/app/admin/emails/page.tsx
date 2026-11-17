import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL_PREVIEWS, buildPreview } from "@/emails/samples";

export const metadata: Metadata = {
  title: "Emails",
  robots: { index: false },
};

/** Every email we send donors, filled in with a made-up donor. */
export default function EmailsPage() {
  return (
    <main className="admin">
      <h1>Emails</h1>
      <p>
        What donors receive, shown at phone width with made-up details.{" "}
        <Link href="/admin">Back to the pickup list</Link>
      </p>
      <div className="email-previews">
        {Object.entries(EMAIL_PREVIEWS).map(([name, preview]) => {
          const email = buildPreview(name, "one-tree");
          return (
            <section key={name} className="email-preview">
              <h2>{preview.title}</h2>
              <p>{preview.when}</p>
              <dl>
                <dt>Subject</dt>
                <dd>{email?.subject}</dd>
                <dt>Preview line</dt>
                <dd>{email?.preheader}</dd>
              </dl>
              <p className="email-preview__links">
                {Object.keys(preview.samples).map((sample) => (
                  <a key={sample} href={`/admin/emails/${name}?sample=${sample}`}>
                    Open: {sample.replace("-", " ")}
                  </a>
                ))}
                <a href={`/admin/emails/${name}?format=text`}>Plain text</a>
              </p>
              <iframe
                title={`${preview.title} preview`}
                src={`/admin/emails/${name}?sample=two-trees`}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
}
