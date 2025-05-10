'use client';

import { useClerk } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { CentralHubSection } from "@/components/central-hub-section";
import { TrackAccountsSection } from "@/components/track-accounts-section";
import { DebtConfidenceSection } from "@/components/debt-confidence-section";

const HomePage = () => {
  const { isSignedIn } = useClerk();

  return (
    <div>
      <Header />
      <main className="px-3 lg:px-14">
        <Hero />
        <CentralHubSection />
        <TrackAccountsSection />
        <DebtConfidenceSection />
      </main>
    </div>
  );
};

export default HomePage; 