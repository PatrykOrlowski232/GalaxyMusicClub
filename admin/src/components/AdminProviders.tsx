"use client";

import { AuthProvider } from "@/hooks/useMockAuth";
import { StaffNav } from "./StaffNav";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StaffNav />
      {children}
    </AuthProvider>
  );
}
