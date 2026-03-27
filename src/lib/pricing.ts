export type PricingTier = {
  id: string;
  label: string;
  maxMiles: number | null;
  price: number;
};

export const PRICING_TIERS: PricingTier[] = [
  { id: "tier-5", label: "Within 5 miles", maxMiles: 5, price: 65 },
  { id: "tier-10", label: "Up to 10 miles", maxMiles: 10, price: 75 },
  { id: "tier-20", label: "Up to 20 miles", maxMiles: 20, price: 85 },
  { id: "tier-20-plus", label: "Over 20 miles", maxMiles: null, price: 100 }
];

export function getPricingForDistance(distanceMiles: number) {
  const tier = PRICING_TIERS.find((t) => t.maxMiles === null || distanceMiles <= t.maxMiles);
  return tier ?? PRICING_TIERS[PRICING_TIERS.length - 1];
}
