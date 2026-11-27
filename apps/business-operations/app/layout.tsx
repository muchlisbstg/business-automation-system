import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUTRAVA Operations | Business Automation",
  description: "Internal business operations workspace. Preview data is illustrative and not connected to live business records."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}