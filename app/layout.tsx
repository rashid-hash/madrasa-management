import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// File: app/layout.tsx

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning যুক্ত করুন
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}