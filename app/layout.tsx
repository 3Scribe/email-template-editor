import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Template Editor",
  description: "Frontend foundation for an email template editor"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
