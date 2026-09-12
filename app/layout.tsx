import type { Metadata } from "next";
import { Libre_Franklin, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/provider";
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from "@/app/utils/authOptions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { UploadProvider } from "@/contexts/UploadContext";
import UploadToast from "@/components/UploadToast";

// Chrome and data: a Franklin Gothic revival, the type of civic and
// institutional printing. Carries real tabular figures, which the gradebook
// columns depend on.
const franklin = Libre_Franklin({
  variable: "--font-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Reading only: lesson content and quiz questions, inside a ruled page block.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Smart School",
  description: "An AI-driven platform for sustainable, personalized computer-science education. Empower every student with hands-on lessons, real-time analytics, and eco-friendly activities.",
  keywords: "education, AI, computer science, learning platform, sustainable education",
  authors: [{ name: "My Smart School" }],
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
        className={`${franklin.variable} ${newsreader.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers session={session}>
          <UploadProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 px-4 pb-12 pt-[5.5rem] sm:px-6">
                {children}
              </main>
              <Footer />
            </div>
            <UploadToast />
          </UploadProvider>
        </Providers>
      </body>
    </html>
  );
}
