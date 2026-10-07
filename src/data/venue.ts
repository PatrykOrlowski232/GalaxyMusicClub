export type VenuePackage = {
  id: string;
  title: string;
  description: string;
  capacity: string;
  fromPrice: string;
};

export const venuePackages: VenuePackage[] = [
  {
    id: "private-night",
    title: "Impreza prywatna",
    description:
      "Urodziny, spotkania firmowe, afterparty — cała przestrzeń lub wydzielona strefa z obsługą bara.",
    capacity: "do 250 osób",
    fromPrice: "wycena indywidualna",
  },
  {
    id: "brand-event",
    title: "Event marki / launch",
    description:
      "Prezentacje, premiery i aktywacje z systemem audio-świetlnym Galaxy oraz opcją brandingu przestrzeni.",
    capacity: "do 300 osób",
    fromPrice: "wycena indywidualna",
  },
  {
    id: "closed-club",
    title: "Zamknięty klub",
    description:
      "Pełny wynajem lokalu na wyłączność — recepcja, ochrona, technika i koordynacja wieczoru.",
    capacity: "cały lokal",
    fromPrice: "wycena indywidualna",
  },
];

export const venueEventTypes = [
  "Urodziny / prywatka",
  "Event firmowy",
  "Afterparty",
  "Launch / premiera",
  "Sesja / produkcja",
  "Inne",
] as const;
