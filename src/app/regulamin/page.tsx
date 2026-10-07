import type { Metadata } from "next";
import { RulesViewer } from "@/components/RulesViewer";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin Galaxy Music Club Gdańsk — zasady klubu i programu promotorskiego.",
  alternates: { canonical: "/regulamin" },
};

export default function RulesPage() {
  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <RulesViewer />
      </div>
    </div>
  );
}
