import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const dmSans = localFont({
  src: "./fonts/dm-sans-latin-wght-normal.woff2",
  weight: "100 1000",
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: {
    default:
      "Xmas Tree Wrap-Up | London, ON Christmas Tree Pickup in Support of London Food Bank",
    template: "%s | Xmas Tree Wrap-Up",
  },
  description:
    "Make a donation and we'll collect your tree from the curb. 100% of proceeds support the London Food Bank.",
  openGraph: {
    siteName: "Xmas Tree Wrap-Up",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#007951",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
