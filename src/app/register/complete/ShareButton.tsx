"use client";

import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.origin;
    const data = {
      title: "Xmas Tree Wrap-Up",
      text: "Donate to the London Food Bank and get your Christmas tree picked up from the curb.",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // The donor closed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link to share:", url);
    }
  }

  return (
    <button type="button" className="btn btn--small btn--block" onClick={share}>
      {copied ? "Link copied" : "Share Xmas Tree Wrap-Up"}
    </button>
  );
}
