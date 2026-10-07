export type Promotion = {
  id: string;
  title: string;
  description: string;
  validUntil: string;
  badge: string;
};

export const promotions: Promotion[] = [
  {
    id: "early-bird",
    title: "Early Bird",
    description:
      "Wejście w obniżonej cenie do godziny 23:00 na wybrane eventy. Obowiązuje przy zakupie online lub na drzwi do wyczerpania puli.",
    validUntil: "2026-12-31",
    badge: "Stała oferta",
  },
  {
    id: "birthday",
    title: "Urodziny w Galaxy",
    description:
      "W dniu urodzin — free entry do 00:00 oraz drink powitalny. Wymagany dokument tożsamości i wcześniejsze zgłoszenie w recepcji.",
    validUntil: "2026-12-31",
    badge: "Dla gości 18+",
  },
  {
    id: "student-thursday",
    title: "Student Thursday",
    description:
      "W czwartki legitymacja studencka = zniżka na wejście. Nie łączy się z innymi promocjami bez zgody obsługi.",
    validUntil: "2026-11-30",
    badge: "Czwartki",
  },
  {
    id: "promoter-bonus",
    title: "Bonus promotorski",
    description:
      "Wejście z aktywnym kodem promotora może uprawniać do preferencyjnych warunków — szczegóły u promotora i na recepcji.",
    validUntil: "2026-12-31",
    badge: "Program",
  },
];
