"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Phone-only donate button that rides along the bottom of the screen.
 *
 * It stays hidden while the hero's own button (id="hero-cta") is on screen,
 * then follows the reader down the page. CSS `position: sticky` makes it come
 * to rest in the closing section, where it scrolls away like a normal button.
 */
export function PinnedCta() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setHeroVisible(entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`pin-cta${heroVisible ? " is-hidden" : ""}`}>
      <Link
        href="/register"
        className="btn btn--block"
        tabIndex={heroVisible ? -1 : undefined}
        aria-hidden={heroVisible ? true : undefined}
      >
        Donate and book your pickup
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
      </Link>
    </div>
  );
}
