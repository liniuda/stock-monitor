"use client";

import MarketOverview from "@/components/MarketOverview";
import SectorGrid from "@/components/SectorGrid";
import RecommendPanel from "@/components/recommend/RecommendPanel";

export default function Home() {
  return (
    <div className="space-y-6">
      <MarketOverview />
      <SectorGrid />
      <RecommendPanel />
    </div>
  );
}
