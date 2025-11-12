import type { Metadata } from "next";

import "../../globals.css";
import Script from "next/script";

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
        {/* External scripts loaded with afterInteractive strategy to prevent hydration issues */}
        <Script 
          src="/libs/live2d.min.js" 
          strategy="beforeInteractive" 
          
        />
        <Script 
          src="/libs/live2dcubismcore.min.js" 
          strategy="beforeInteractive" 
          
        />
             {/* Initialize global variables in a consistent way to prevent hydration issues */}
             <Script id="init-globals" strategy="afterInteractive">
          {`
            window.Live2DCubismCore = window.Live2DCubismCore || {};
            window.PIXI = window.PIXI || {};
            window.appConfig = window.appConfig || {};
          `}
        </Script>
        
      </head>
      <body className="overflow-hidden">
        {children}
      </body>
    </html>
  );
}
