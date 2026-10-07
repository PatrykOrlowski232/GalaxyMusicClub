"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/hooks/useMockAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgeGate } from "@/components/AgeGate";
import { PageViewTracker } from "@/components/PageViewTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AgeGate />
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </AuthProvider>
  );
}
