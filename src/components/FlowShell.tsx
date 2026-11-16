import Image from "next/image";
import Link from "next/link";
import logoLockup from "@/assets/logo-lockup.png";

/** Narrow page frame shared by registration, confirmation and the waitlist. */
export function FlowShell({
  chip,
  children,
}: {
  chip?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flow">
      <div className="flow__inner">
        <header className="flow__header">
          <Link href="/" aria-label="Back to the home page">
            <Image
              src={logoLockup}
              alt="Xmas Tree Wrap-Up"
              className="flow__logo"
              priority
            />
          </Link>
          {chip}
        </header>
        <main style={{ display: "contents" }}>{children}</main>
      </div>
    </div>
  );
}
