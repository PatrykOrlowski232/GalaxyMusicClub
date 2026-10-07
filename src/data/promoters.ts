export type PromoterGuest = {
  name: string;
  date: string;
  event: string;
};

export type Promoter = {
  code: string;
  name: string;
  points: number;
  checkIns: number;
  referrals: number;
  guests: PromoterGuest[];
};

export const promoters: Promoter[] = [
  {
    code: "NOVA42",
    name: "Kasia Nova",
    points: 1280,
    checkIns: 47,
    referrals: 31,
    guests: [
      { name: "Michał K.", date: "2026-10-04", event: "Neon Orbit" },
      { name: "Ola W.", date: "2026-10-04", event: "Neon Orbit" },
      { name: "Bartek S.", date: "2026-09-27", event: "Void Session" },
      { name: "Nina P.", date: "2026-09-20", event: "Magenta Nights" },
    ],
  },
  {
    code: "PULSAR",
    name: "Tomek Pulsar",
    points: 860,
    checkIns: 29,
    referrals: 18,
    guests: [
      { name: "Ada M.", date: "2026-10-03", event: "Neon Orbit" },
      { name: "Krzysztof L.", date: "2026-09-28", event: "Void Session" },
    ],
  },
  {
    code: "ORBIT",
    name: "Demo Promotor",
    points: 420,
    checkIns: 12,
    referrals: 9,
    guests: [
      { name: "Guest Demo", date: "2026-10-01", event: "Stellar Bass" },
    ],
  },
];

export function getPromoterByCode(code: string): Promoter | undefined {
  return promoters.find(
    (promoter) => promoter.code.toLowerCase() === code.toLowerCase(),
  );
}
