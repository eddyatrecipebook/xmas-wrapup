import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import logoFull from "@/assets/logo-full.png";
import logoLockup from "@/assets/logo-lockup.png";
import treeAtCurb from "@/assets/tree-at-curb.jpg";
import { EVENT } from "@/lib/config";
import {
  SpotsCounter,
  SpotsCounterFallback,
  SpotsHeadline,
} from "@/components/SpotsCounter";

// Update these two each year. Leave SPONSORS empty to hide that section.
const TOTAL_RAISED = "over $39,000";
const SPONSORS: string[] = [];

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Home() {
  const mailto = `mailto:${EVENT.contactEmail}`;
  return (
    <>
      <header className="container site-header">
        <Image
          src={logoFull}
          alt="7th Annual Xmas Tree Wrap-Up, in support of London Food Bank"
          className="site-header__logo"
          priority
        />
        <nav className="site-nav" aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#faq">Questions</a>
          <Link href="/register" className="btn btn--small">
            Book your pickup
          </Link>
        </nav>
      </header>

      <main>
        <section className="container hero">
          <div className="hero__copy">
            <p className="eyebrow">{EVENT.pickupDateLong} · London, Ontario</p>
            <h1>Leave your tree at the curb. Leave the rest to us.</h1>
            <p className="hero__lede">
              Donate ${EVENT.minDonation} or more and our volunteers will
              collect your real Christmas tree. 100% of proceeds support the
              London Food Bank.
            </p>
            <Suspense fallback={<SpotsCounterFallback />}>
              <SpotsCounter />
            </Suspense>
            <Link href="/register" className="btn">
              Donate and book your pickup
              <Arrow />
            </Link>
          </div>
          <div className="hero__media">
            <Image
              src={treeAtCurb}
              alt="A Christmas tree lying at a snowy curb, ready for pickup"
              className="hero__photo"
              sizes="(max-width: 1000px) 100vw, 560px"
              priority
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-calendar.svg"
              alt="Calendar showing January 9"
              className="hero__badge"
            />
          </div>
        </section>

        <section id="how" className="steps">
          <div className="container steps__inner">
            <h2 className="section-title">
              Three steps, and one of them is relaxing
            </h2>
            <div className="steps__grid">
              <div className="step">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-calendar.svg" alt="" />
                <p className="eyebrow">Step 1</p>
                <h3>Donate &amp; Schedule Pickup</h3>
                <p>
                  Make a donation and enter your pickup address. 100% of
                  proceeds support the London Food Bank.
                </p>
              </div>
              <div className="step">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-curb.svg" alt="" />
                <p className="eyebrow">Step 2</p>
                <h3>Take Your Tree to the Curb</h3>
                <p>
                  Ensure all decorations, lights, and tinsel are removed from
                  your tree. Then place it at the curb by 7 am on your pickup
                  day (or put it out the night before!)
                </p>
              </div>
              <div className="step">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-heart.svg" alt="" />
                <p className="eyebrow">Step 3</p>
                <h3>Smile, Sit Back, and Relax!</h3>
                <p>
                  Your work is done! We&apos;ll collect your tree between 7 AM
                  and midnight on {EVENT.pickupDateShort}. Thank you for
                  supporting the London Food Bank!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="impact">
          <div className="container impact__inner">
            <div className="impact__heading">
              <p className="eyebrow">Where your donation goes</p>
              <h2>100% of proceeds support the London Food Bank</h2>
            </div>
            <p className="impact__text">
              Since 2020, the Xmas Tree Wrap-Up campaign has raised{" "}
              {TOTAL_RAISED} for the London Food Bank to support its mission of
              helping a generous community share its food resources.
            </p>
          </div>
        </section>

        <section id="faq" className="container faq">
          <div className="faq__intro">
            <h2 className="section-title">Questions, answered</h2>
            <p>
              Something else on your mind? Email{" "}
              <a href={mailto}>
                <strong>{EVENT.contactEmail}</strong>
              </a>
              .
            </p>
          </div>
          <div className="faq__list">
            <details open>
              <summary>What time will my tree be collected?</summary>
              <p>
                Our volunteers are on the road from 7 AM until midnight on{" "}
                {EVENT.pickupDateShort}. If your tree is still at the curb
                after midnight, report a missed tree and we&apos;ll come back
                for it on Sunday.
              </p>
            </details>
            <details>
              <summary>Is there a limit on pickups?</summary>
              <p>
                Yes. We&apos;re collecting {EVENT.capacity} trees this year,
                first come, first served. Once every spot is booked you can
                join the waitlist, and we&apos;ll email you if we&apos;re able
                to add more.
              </p>
            </details>
            <details>
              <summary>Will I get a tax receipt?</summary>
              <p>
                Donations of ${EVENT.receiptThreshold} or more receive a tax
                receipt from the London Food Bank. Smaller donations
                aren&apos;t receipted, because Xmas Tree Wrap-Up is a
                third-party fundraiser.
              </p>
            </details>
            <details>
              <summary>I live just outside London. Can you collect my tree?</summary>
              <p>
                Yes! We collect from communities near London, including Komoka,
                Kilworth, Ilderton, Arva, Dorchester and Delaware. The address
                check at registration tells you right away whether you&apos;re
                in range.
              </p>
            </details>
            <details>
              <summary>Can I change or cancel my pickup?</summary>
              <p>
                Yes. <a href={`${mailto}?subject=Cancel%20my%20pickup`}>Email us</a>{" "}
                to let us know. We appreciate it, because it saves our
                volunteers a trip.
              </p>
            </details>
            <details>
              <summary>What happens if I forget to put out my tree?</summary>
              <p>
                If we arrive and can&apos;t find your tree, we&apos;ll leave a
                door hanger on your front door or mailbox with instructions for
                requesting a second pickup attempt.
              </p>
            </details>
            <details>
              <summary>Doesn&apos;t the City of London collect Christmas trees?</summary>
              <p>
                The city ended curbside Christmas tree collection in 2020. Your
                other options are dropping your tree at an EnviroDepot, or
                storing it until spring yard waste collection.
              </p>
            </details>
          </div>
        </section>

        <section className="closing">
          <div className="container closing__inner">
            <div>
              <h2 className="section-title">
                <Suspense fallback={<>Book your pickup spot</>}>
                  <SpotsHeadline />
                </Suspense>
              </h2>
              <p>Book yours for {EVENT.pickupDateShort}.</p>
            </div>
            <Link href="/register" className="btn">
              Donate and book your pickup
              <Arrow />
            </Link>
          </div>
        </section>

        {SPONSORS.length > 0 && (
          <section className="container sponsors">
            <p className="eyebrow">Supporting sponsors</p>
            <ul>
              {SPONSORS.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Image
            src={logoLockup}
            alt="Xmas Tree Wrap-Up"
            className="site-footer__logo"
          />
          <nav aria-label="Footer">
            <a href={`${mailto}?subject=Report%20a%20missed%20tree`}>
              Report a missed tree
            </a>
            <a href={`${mailto}?subject=Cancel%20my%20pickup`}>
              Cancel your pickup
            </a>
            <a href={mailto}>{EVENT.contactEmail}</a>
          </nav>
          <small>© 2020–2027 Xmas Tree Wrap-Up</small>
        </div>
      </footer>
    </>
  );
}
