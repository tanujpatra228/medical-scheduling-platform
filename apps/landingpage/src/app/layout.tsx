import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "MSP | Modern Medical Scheduling",
  description: "A multi-tenant, event-driven medical appointment scheduling platform built for modern healthcare.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${bricolage.variable} ${dmSans.variable} font-sans antialiased text-foreground bg-background selection:bg-accent selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
