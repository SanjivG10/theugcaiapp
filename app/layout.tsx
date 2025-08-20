import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/hooks/useBusiness";
import { Toaster } from "react-hot-toast";
import "react-phone-number-input/style.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AI UGC Platform",
  description: "Create stunning AI-generated UGC videos for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <BusinessProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "1px solid hsl(var(--border))",
                },
                success: {
                  iconTheme: {
                    primary: "hsl(var(--primary))",
                    secondary: "hsl(var(--primary-foreground))",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "hsl(var(--destructive))",
                    secondary: "hsl(var(--destructive-foreground))",
                  },
                },
              }}
            />
          </BusinessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
