import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/provider";
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from "@/app/utils/authOptions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Smart Digital School",
  description: "An AI-driven platform for sustainable, personalized computer-science education. Empower every student with hands-on lessons, real-time analytics, and eco-friendly activities.",
  keywords: "education, AI, computer science, learning platform, sustainable education",
  authors: [{ name: "My Smart Digital School" }],
  viewport: "width=device-width, initial-scale=1",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: Session | null = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers session={session}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 mt-12">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}