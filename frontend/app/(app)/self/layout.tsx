import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration - VTuber Settings",
  description: "Configure character, background, model settings, and interactions",
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
        {children}
      </body>
    </html>
  );
}
