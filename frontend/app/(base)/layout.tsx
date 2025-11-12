import type { Metadata } from "next";

import "../globals.css";


export const metadata: Metadata = {
  title: "Hiero",
  description: "Your Character, Your Sense of Self - Your Hiero",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* External scripts loaded with afterInteractive strategy to prevent hydration issues */}
      
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
