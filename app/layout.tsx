import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kodeshala · 100-Card Algorithm Challenge",
    template: "%s | Kodeshala",
  },
  description:
    "Kodeshala — An interactive educational game for Grade 7–8 students learning sorting, searching, and algorithmic thinking through a fun 100-card challenge.",
  keywords: [
    "algorithm",
    "binary search",
    "linear search",
    "sorting",
    "education",
    "coding",
    "computer science",
    "Grade 7",
    "Grade 8",
    "Kodeshala",
    "interactive game",
    "programming",
  ],
  authors: [{ name: "Kodeshala" }],
  creator: "Kodeshala",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kodeshala.com",
    siteName: "Kodeshala",
    title: "Kodeshala · 100-Card Algorithm Challenge",
    description:
      "An interactive educational game for Grade 7–8 students learning sorting, searching, and algorithmic thinking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kodeshala · 100-Card Algorithm Challenge",
    description:
      "An interactive educational game for Grade 7–8 students learning sorting, searching, and algorithmic thinking.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#2563EB] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
