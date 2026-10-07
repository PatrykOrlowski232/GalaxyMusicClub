export type Lounge = {
  id: string;
  name: string;
  capacity: number;
  priceFrom: string;
  perks: string[];
  available: boolean;
};

export const lounges: Lounge[] = [
  {
    id: "orbit",
    name: "Loża Orbit",
    capacity: 6,
    priceFrom: "od 800 zł",
    perks: ["Widok na parkiet", "Butelka w cenie", "Host / hostessa"],
    available: true,
  },
  {
    id: "nova",
    name: "Loża Nova",
    capacity: 8,
    priceFrom: "od 1200 zł",
    perks: ["Strefa VIP", "Priority entry", "Dedykowany stolik"],
    available: true,
  },
  {
    id: "eclipse",
    name: "Loża Eclipse",
    capacity: 12,
    priceFrom: "od 2000 zł",
    perks: ["Największa loża", "Pakiet premium", "Prywatna strefa"],
    available: false,
  },
];
