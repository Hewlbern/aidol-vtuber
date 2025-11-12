import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Live2D VTuber Demo",
  description: "A demo of Live2D with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
    
      </head>
      <body className="overflow-hidden">
        <Link href="/aidol">Self</Link>
        {children}
      </body>
    </html>
  );
}
