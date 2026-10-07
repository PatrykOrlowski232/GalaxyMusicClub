export type RulesLang = "pl" | "en" | "es";

export type RulesDoc = "club" | "site";

export type RulesSection = {
  title: string;
  points: string[];
};

export type RulesContent = {
  eyebrow: string;
  title: string;
  intro: string;
  footer: string;
  sections: RulesSection[];
};

export const rulesByLang: Record<RulesLang, RulesContent> = {
  pl: {
    eyebrow: "Dokumenty",
    title: "Regulamin klubu",
    intro:
      "Galaxy Music Club Gdańsk — zasady obowiązujące wszystkich gości. Wejście na teren klubu oznacza akceptację niniejszego regulaminu.",
    footer:
      "Ostatnia aktualizacja: październik 2026. W sprawach wizerunku i zagubionych rzeczy: kontakt przez Instagram @galaxymusicclub lub recepcję klubu (Tkacka 9/10, Gdańsk).",
    sections: [
      {
        title: "Wiek i wstęp",
        points: [
          "Klub jest dostępny wyłącznie dla osób pełnoletnich (18+).",
          "Personel ma prawo odmówić wstępu bez podania przyczyny.",
          "Obowiązuje kontrola dokumentów i dress code ustalony na dany event.",
        ],
      },
      {
        title: "Bezpieczeństwo",
        points: [
          "Zakaz wnoszenia alkoholu, narkotyków i niebezpiecznych przedmiotów.",
          "Goście podlegają kontroli bezpieczeństwa przy wejściu.",
          "W razie zagrożenia należy stosować się do poleceń ochrony i obsługi.",
        ],
      },
      {
        title: "Zachowanie",
        points: [
          "Zakaz agresji, molestowania i zachowań naruszających dobre obyczaje.",
          "Niszczenie mienia skutkuje odpowiedzialnością materialną i usunięciem z lokalu.",
        ],
      },
      {
        title: "Rzeczy pozostawione w klubie",
        points: [
          "Klub nie ponosi odpowiedzialności za rzeczy pozostawione, zgubione, skradzione lub uszkodzone na terenie lokalu, w szatni, w lożach oraz w strefach wspólnych.",
          "Gość obowiązany jest dbać o swoje mienie przez cały czas pobytu.",
          "Znalezione przedmioty można zgłaszać na recepcji; klub może przechowywać je przez ograniczony czas, bez gwarancji odzyskania.",
        ],
      },
      {
        title: "Zdjęcia, nagrania i wizerunek",
        points: [
          "Na terenie klubu mogą być wykonywane zdjęcia i nagrania (w tym przez organizatora, DJ-ów, partnerów oraz innych gości) na potrzeby dokumentacji, promocji i social mediów.",
          "Wejście do klubu oznacza zgodę na utrwalenie i publikację wizerunku w materiałach związanych z działalnością Galaxy Music Club, o ile przepisy prawa nie stanowią inaczej.",
          "Fotografowanie i filmowanie przez gości może być ograniczone lub zakazane przez organizatora konkretnego eventu.",
          "W razie braku zgody na publikację Twojego wizerunku — prosimy o kontakt (Instagram @galaxymusicclub lub recepcja). Dołożymy starań, aby usunąć lub ograniczyć publikację, o ile będzie to technicznie i prawnie możliwe.",
        ],
      },
      {
        title: "Bilety, guestlist, loże",
        points: [
          "Bilet / zapis na guestlist nie gwarantuje wstępu po wyczerpaniu limitu pojemności.",
          "Rezerwacja wybranej loży wymaga wpłaty zaliczki w wysokości 20% ceny loży (płatność online).",
          "Loża zobowiązuje do darmowego wejścia dla gości loży; cała kwota loży jest saldem do wykorzystania na barze w trakcie eventu.",
          "Po opłaceniu zaliczki rezerwacja otrzymuje status Confirmed; pozostała część ceny rozliczana jest zgodnie z ustaleniami klubu (bar).",
          "Zwroty i przeniesienia podlegają zasadom danego eventu.",
        ],
      },
      {
        title: "Dane osobowe",
        points: [
          "Dane podane przy rejestracji konta i rezerwacjach przetwarzane są w celu realizacji usług klubu.",
          "Zapisanie się do newslettera jest jednoznaczne ze zgodą na otrzymywanie materiałów promocyjnych Galaxy Music Club (e-mail).",
          "Zgodę na newsletter możesz w każdej chwili wycofać w ustawieniach konta na stronie.",
          "Szczegółowa polityka prywatności może zostać uzupełniona przez klub.",
        ],
      },
    ],
  },
  en: {
    eyebrow: "Documents",
    title: "Club rules",
    intro:
      "Galaxy Music Club Gdańsk — rules for all guests. Entering the venue means you accept these terms.",
    footer:
      "Last update: October 2026. For image rights and lost property: contact us via Instagram @galaxymusicclub or the club reception (Tkacka 9/10, Gdańsk).",
    sections: [
      {
        title: "Age and entry",
        points: [
          "The club is available only to adults (18+).",
          "Staff may refuse entry without giving a reason.",
          "ID checks and the dress code set for each event apply.",
        ],
      },
      {
        title: "Safety",
        points: [
          "Bringing alcohol, drugs or dangerous items is forbidden.",
          "Guests are subject to security checks at the entrance.",
          "In case of danger, follow security and staff instructions.",
        ],
      },
      {
        title: "Behaviour",
        points: [
          "Aggression, harassment and behaviour that violates good conduct are forbidden.",
          "Damaging property results in financial liability and removal from the venue.",
        ],
      },
      {
        title: "Items left in the club",
        points: [
          "The club is not liable for items left, lost, stolen or damaged on the premises, in the cloakroom, lounges or common areas.",
          "Guests must look after their belongings at all times.",
          "Found items may be reported at reception; the club may keep them for a limited time with no guarantee of recovery.",
        ],
      },
      {
        title: "Photos, recordings and likeness",
        points: [
          "Photos and recordings may be taken on the premises (by the organiser, DJs, partners and other guests) for documentation, promotion and social media.",
          "Entering the club means you consent to the capture and publication of your likeness in materials related to Galaxy Music Club, unless applicable law provides otherwise.",
          "Guest photography and filming may be restricted or banned by the organiser of a specific event.",
          "If you do not consent to publication of your likeness, please contact us (Instagram @galaxymusicclub or reception). We will make reasonable efforts to remove or limit publication where technically and legally possible.",
        ],
      },
      {
        title: "Tickets, guestlist, lounges",
        points: [
          "A ticket / guestlist entry does not guarantee admission once capacity is reached.",
          "Booking a lounge requires a 20% deposit of the lounge price (online payment).",
          "A lounge includes free entry for lounge guests; the full lounge amount is bar credit to spend during the event.",
          "After the deposit is paid the reservation is Confirmed; the remaining balance is settled as agreed with the club (bar).",
          "Refunds and transfers follow the rules of each event.",
        ],
      },
      {
        title: "Personal data",
        points: [
          "Data provided at registration and for reservations is processed to deliver club services.",
          "Signing up for the newsletter constitutes consent to receive Galaxy Music Club promotional materials by email.",
          "You may withdraw newsletter consent at any time in your account settings.",
          "A detailed privacy policy may be provided by the club.",
        ],
      },
    ],
  },
  es: {
    eyebrow: "Documentos",
    title: "Reglamento del club",
    intro:
      "Galaxy Music Club Gdańsk — normas aplicables a todos los invitados. La entrada al local implica la aceptación de este reglamento.",
    footer:
      "Última actualización: octubre 2026. Para imagen y objetos perdidos: contacto por Instagram @galaxymusicclub o recepción del club (Tkacka 9/10, Gdańsk).",
    sections: [
      {
        title: "Edad y acceso",
        points: [
          "El club está disponible únicamente para personas mayores de edad (18+).",
          "El personal puede denegar la entrada sin indicar el motivo.",
          "Se aplica el control de documentos y el dress code establecido para cada evento.",
        ],
      },
      {
        title: "Seguridad",
        points: [
          "Está prohibido introducir alcohol, drogas u objetos peligrosos.",
          "Los invitados están sujetos a un control de seguridad en la entrada.",
          "En caso de peligro, deben seguirse las instrucciones de seguridad y del personal.",
        ],
      },
      {
        title: "Comportamiento",
        points: [
          "Están prohibidos la agresión, el acoso y las conductas que vulneren las buenas costumbres.",
          "Los daños a la propiedad conllevan responsabilidad material y la expulsión del local.",
        ],
      },
      {
        title: "Objetos dejados en el club",
        points: [
          "El club no se responsabiliza de objetos dejados, perdidos, robados o dañados en el local, el guardarropa, los lounges ni las zonas comunes.",
          "El invitado debe cuidar sus pertenencias durante toda la estancia.",
          "Los objetos encontrados pueden comunicarse en recepción; el club puede guardarlos durante un tiempo limitado, sin garantía de recuperación.",
        ],
      },
      {
        title: "Fotos, grabaciones e imagen",
        points: [
          "En el club pueden realizarse fotos y grabaciones (por el organizador, DJs, partners y otros invitados) con fines de documentación, promoción y redes sociales.",
          "La entrada al club implica el consentimiento para captar y publicar la imagen en materiales relacionados con Galaxy Music Club, salvo que la ley aplicable disponga lo contrario.",
          "La fotografía y filmación por parte de los invitados pueden restringirse o prohibirse por el organizador de un evento concreto.",
          "Si no consientes la publicación de tu imagen, contacta con nosotros (Instagram @galaxymusicclub o recepción). Haremos lo razonable para eliminar o limitar la publicación cuando sea técnica y legalmente posible.",
        ],
      },
      {
        title: "Entradas, guestlist, lounges",
        points: [
          "Una entrada / guestlist no garantiza el acceso una vez alcanzada la capacidad.",
          "La reserva de un lounge requiere un anticipo del 20% del precio (pago online).",
          "El lounge incluye entrada gratuita para sus invitados; el importe total es saldo para consumir en la barra durante el evento.",
          "Tras pagar el anticipo la reserva queda Confirmed; el resto se liquida según lo acordado con el club (barra).",
          "Los reembolsos y traspasos se rigen por las normas de cada evento.",
        ],
      },
      {
        title: "Datos personales",
        points: [
          "Los datos facilitados en el registro y las reservas se tratan para prestar los servicios del club.",
          "Suscribirse al newsletter equivale al consentimiento para recibir materiales promocionales de Galaxy Music Club por correo electrónico.",
          "Puedes retirar el consentimiento del newsletter en cualquier momento en la configuración de tu cuenta.",
          "La política de privacidad detallada puede ser completada por el club.",
        ],
      },
    ],
  },
};

export const siteRulesByLang: Record<RulesLang, RulesContent> = {
  pl: {
    eyebrow: "Dokumenty",
    title: "Regulamin strony",
    intro:
      "Regulamin korzystania z serwisu internetowego Galaxy Music Club (dalej: „Serwis”). Korzystanie ze strony oraz rejestracja konta oznaczają akceptację niniejszych zasad.",
    footer:
      "Ostatnia aktualizacja: październik 2026. Kontakt: Instagram @galaxymusicclub · lokal: Tkacka 9/10, Gdańsk. W sprawach spornych stosuje się prawo polskie.",
    sections: [
      {
        title: "Postanowienia ogólne",
        points: [
          "Administratorem Serwisu jest Galaxy Music Club z siedzibą przy ul. Tkacka 9/10 w Gdańsku.",
          "Serwis służy do prezentacji eventów, sprzedaży biletów, rezerwacji lóż, zapytań o wynajem sali, programu promotorskiego oraz kont użytkownika.",
          "Treści na stronie mają charakter informacyjny; ostateczne warunki wstępu, dress code i limity pojemności ustala klub na miejscu.",
        ],
      },
      {
        title: "Wiek i dostęp",
        points: [
          "Serwis i usługi klubowe są przeznaczone wyłącznie dla osób pełnoletnich (18+).",
          "Użytkownik oświadcza, że ma ukończone 18 lat — m.in. poprzez potwierdzenie w bramce wiekowej oraz przy rejestracji konta.",
          "Podanie nieprawdziwych danych wieku może skutkować odmową świadczenia usług i usunięciem konta.",
        ],
      },
      {
        title: "Konto użytkownika",
        points: [
          "Do zakupu biletów, rezerwacji lóż i części funkcji wymagane jest konto z adresem e-mail i hasłem.",
          "Użytkownik odpowiada za poufność danych logowania oraz za działania wykonane z jego konta.",
          "Zabronione jest tworzenie kont w imieniu osób trzecich bez ich zgody oraz udostępnianie konta innym osobom.",
          "Klub może zawiesić lub usunąć konto w razie naruszenia regulaminu Serwisu lub regulaminu klubu.",
        ],
      },
      {
        title: "Bilety i płatności online",
        points: [
          "Zakup biletu online realizowany jest przez zewnętrznego operatora płatności (Stripe). Klub nie przechowuje pełnych danych kart płatniczych.",
          "Umowa sprzedaży biletu dochodzi do skutku po skutecznym zaksięgowaniu płatności.",
          "Bilet elektroniczny / potwierdzenie zamówienia należy okazać przy wejściu zgodnie z instrukcjami eventu.",
          "Zwroty, przeniesienia i zmiany terminu podlegają zasadom danego eventu oraz obowiązującym przepisom prawa konsumenckiego.",
          "Bilet nie gwarantuje wstępu po wyczerpaniu pojemności lokalu — w takich przypadkach klub stosuje zasady wskazane przy evencie.",
        ],
      },
      {
        title: "Rezerwacje lóż",
        points: [
          "Rezerwacja loży przez Serwis wymaga wyboru eventu i wolnej loży oraz wpłaty zaliczki 20% ceny loży online (Stripe).",
          "Loża zobowiązuje do darmowego wejścia; cała kwota loży jest do wykorzystania na barze w trakcie eventu.",
          "Po skutecznym opłaceniu zaliczki rezerwacja otrzymuje status Confirmed; anulowanie płatności zwalnia lożę.",
          "Pozostała część ceny oraz warunki wieczoru ustalane są z klubem (rozliczenie barowe).",
          "Dostępność lóż zależy od eventu i może ulec zmianie.",
        ],
      },
      {
        title: "Wynajem sali i imprezy specjalne",
        points: [
          "Formularz wynajmu sali to zapytanie ofertowe — nie stanowi automatycznej rezerwacji ani umowy najmu.",
          "Warunki, cena i dostępność ustalane są indywidualnie po kontakcie z klubem.",
          "Klub może odmówić realizacji imprezy bez podania szczegółowej przyczyny, w szczególności ze względów bezpieczeństwa lub kalendarza eventów.",
        ],
      },
      {
        title: "Program promotorski",
        points: [
          "Status promotora i linki / kody QR służą do śledzenia sprzedaży i rozliczenia prowizji według aktualnych zasad klubu.",
          "Nadużycia (fałszywy ruch, spam, wprowadzanie w błąd) mogą skutkować utratą statusu i niewypłaceniem prowizji.",
          "Rankingi i statystyki mają charakter informacyjny i mogą być korygowane w razie błędów technicznych.",
        ],
      },
      {
        title: "Newsletter i komunikacja",
        points: [
          "Zapisanie się do newslettera jest jednoznaczne ze zgodą na otrzymywanie materiałów promocyjnych Galaxy Music Club na podany adres e-mail.",
          "Zgodę można w każdej chwili wycofać w ustawieniach konta lub poprzez kontakt z klubem.",
          "Komunikaty transakcyjne (np. potwierdzenie zakupu lub rezerwacji) mogą być wysyłane niezależnie od zgody marketingowej.",
        ],
      },
      {
        title: "Dane osobowe i pliki cookie",
        points: [
          "Dane podane w Serwisie (m.in. e-mail, dane rezerwacji, zapytania o wynajem) przetwarzane są w celu realizacji usług, rozliczeń i kontaktu.",
          "Sesja użytkownika utrzymywana jest za pomocą pliku cookie / tokenu sesyjnego niezbędnego do logowania.",
          "Operator płatności (Stripe) może przetwarzać dane niezbędne do realizacji transakcji zgodnie z własną polityką prywatności.",
          "Szczegółowa polityka prywatności może zostać uzupełniona przez klub; w razie pytań — kontakt przez Instagram @galaxymusicclub.",
        ],
      },
      {
        title: "Odpowiedzialność i własność intelektualna",
        points: [
          "Klub dokłada starań, aby informacje w Serwisie były aktualne, lecz nie gwarantuje nieprzerwanej dostępności strony ani braku błędów technicznych.",
          "W zakresie dozwolonym prawem klub nie odpowiada za przerwy w działaniu Serwisu, działania osób trzecich (w tym operatora płatności) ani za szkody wynikające z nieprawidłowego korzystania z konta.",
          "Nazwa Galaxy, materiały graficzne, teksty i nagrania na stronie są chronione prawem — kopiowanie w celach komercyjnych bez zgody jest zabronione.",
          "Korzystanie z Serwisu nie zwalnia z obowiązku przestrzegania regulaminu klubu na miejscu.",
        ],
      },
      {
        title: "Zmiany regulaminu",
        points: [
          "Klub może aktualizować regulamin strony; data ostatniej aktualizacji wskazana jest na końcu dokumentu.",
          "Dalsze korzystanie z Serwisu po publikacji zmian oznacza ich akceptację, o ile przepisy bezwzględnie obowiązujące nie stanowią inaczej.",
        ],
      },
    ],
  },
  en: {
    eyebrow: "Documents",
    title: "Website terms",
    intro:
      "Terms of use for the Galaxy Music Club website (the “Service”). Using the site and creating an account means you accept these terms.",
    footer:
      "Last update: October 2026. Contact: Instagram @galaxymusicclub · venue: Tkacka 9/10, Gdańsk. Polish law applies to disputes.",
    sections: [
      {
        title: "General",
        points: [
          "The Service is operated by Galaxy Music Club at Tkacka 9/10, Gdańsk.",
          "The Service presents events, ticket sales, lounge bookings, venue-hire enquiries, the promoter programme and user accounts.",
          "Website content is informational; final entry rules, dress code and capacity limits are set by the club on site.",
        ],
      },
      {
        title: "Age and access",
        points: [
          "The Service and club services are for adults only (18+).",
          "You confirm you are 18 or older — including via the age gate and when registering.",
          "False age information may result in refusal of service and account removal.",
        ],
      },
      {
        title: "User account",
        points: [
          "An account with email and password is required for tickets, lounge bookings and some features.",
          "You are responsible for keeping login details confidential and for activity on your account.",
          "Creating accounts for third parties without consent or sharing accounts is forbidden.",
          "The club may suspend or delete an account for breach of these terms or the club rules.",
        ],
      },
      {
        title: "Tickets and online payments",
        points: [
          "Online tickets are paid via Stripe. The club does not store full card details.",
          "The ticket purchase is completed once payment is successfully received.",
          "Show your e-ticket / order confirmation at the door as required for the event.",
          "Refunds, transfers and date changes follow each event’s rules and applicable consumer law.",
          "A ticket does not guarantee entry once capacity is reached — the club applies the rules stated for that event.",
        ],
      },
      {
        title: "Lounge reservations",
        points: [
          "Booking a lounge via the Service requires choosing an event and an available lounge, then paying a 20% deposit online (Stripe).",
          "A lounge includes free entry; the full lounge amount is bar credit during the event.",
          "After successful deposit payment the reservation is Confirmed; cancelling payment frees the lounge.",
          "The remaining balance and evening terms are agreed with the club (bar settlement).",
          "Lounge availability depends on the event and may change.",
        ],
      },
      {
        title: "Venue hire and special events",
        points: [
          "The venue-hire form is an enquiry only — not an automatic booking or hire contract.",
          "Price, terms and availability are agreed individually with the club.",
          "The club may decline an event, especially for safety or calendar reasons.",
        ],
      },
      {
        title: "Promoter programme",
        points: [
          "Promoter status and links / QR codes track sales and commission under the club’s current rules.",
          "Abuse (fake traffic, spam, misleading promotion) may result in loss of status and unpaid commission.",
          "Rankings and stats are informational and may be corrected after technical errors.",
        ],
      },
      {
        title: "Newsletter and communication",
        points: [
          "Signing up for the newsletter means consent to receive Galaxy Music Club promotional emails.",
          "You may withdraw consent anytime in account settings or by contacting the club.",
          "Transactional messages (e.g. purchase or booking confirmation) may be sent regardless of marketing consent.",
        ],
      },
      {
        title: "Personal data and cookies",
        points: [
          "Data submitted on the Service (email, bookings, venue enquiries, etc.) is processed to deliver services, settlements and contact.",
          "Sessions use a cookie / session token required for login.",
          "Stripe may process payment data under its own privacy policy.",
          "A fuller privacy policy may be published by the club; questions: Instagram @galaxymusicclub.",
        ],
      },
      {
        title: "Liability and IP",
        points: [
          "We aim to keep information up to date but do not guarantee uninterrupted availability or absence of technical errors.",
          "To the extent permitted by law, the club is not liable for Service downtime, third-party actions (including the payment provider) or misuse of an account.",
          "Galaxy branding, graphics, text and media on the site are protected — commercial copying without consent is forbidden.",
          "Using the Service does not waive the obligation to follow the club rules on site.",
        ],
      },
      {
        title: "Changes",
        points: [
          "The club may update these website terms; the last update date appears at the end of this document.",
          "Continued use of the Service after changes are published means acceptance, unless mandatory law provides otherwise.",
        ],
      },
    ],
  },
  es: {
    eyebrow: "Documentos",
    title: "Términos del sitio",
    intro:
      "Condiciones de uso del sitio web de Galaxy Music Club (el “Servicio”). El uso del sitio y el registro de una cuenta implican la aceptación de estas normas.",
    footer:
      "Última actualización: octubre 2026. Contacto: Instagram @galaxymusicclub · local: Tkacka 9/10, Gdańsk. Se aplica la ley polaca a las controversias.",
    sections: [
      {
        title: "Disposiciones generales",
        points: [
          "El Servicio lo opera Galaxy Music Club en Tkacka 9/10, Gdańsk.",
          "El Servicio presenta eventos, venta de entradas, reservas de lounges, consultas de alquiler, el programa de promotores y cuentas de usuario.",
          "El contenido es informativo; las normas finales de acceso, dress code y aforo las fija el club en el local.",
        ],
      },
      {
        title: "Edad y acceso",
        points: [
          "El Servicio y los servicios del club son solo para mayores de edad (18+).",
          "Confirmas tener 18 años o más — también mediante el aviso de edad y al registrarte.",
          "Datos de edad falsos pueden implicar la denegación del servicio y la eliminación de la cuenta.",
        ],
      },
      {
        title: "Cuenta de usuario",
        points: [
          "Se requiere una cuenta con email y contraseña para entradas, reservas de lounge y algunas funciones.",
          "Eres responsable de la confidencialidad del acceso y de la actividad en tu cuenta.",
          "Está prohibido crear cuentas para terceros sin consentimiento o compartir la cuenta.",
          "El club puede suspender o eliminar una cuenta por incumplimiento de estos términos o del reglamento del club.",
        ],
      },
      {
        title: "Entradas y pagos online",
        points: [
          "Las entradas online se pagan a través de Stripe. El club no almacena los datos completos de la tarjeta.",
          "La compra se perfecciona tras el cobro efectivo del pago.",
          "Debes mostrar el e-ticket / confirmación del pedido en la entrada según el evento.",
          "Reembolsos, traspasos y cambios de fecha se rigen por las normas del evento y la ley de consumo aplicable.",
          "Una entrada no garantiza el acceso una vez alcanzado el aforo — se aplican las normas indicadas para ese evento.",
        ],
      },
      {
        title: "Reservas de lounges",
        points: [
          "Reservar un lounge en el Servicio requiere elegir un evento y un lounge libre y pagar un anticipo del 20% online (Stripe).",
          "El lounge incluye entrada gratuita; el importe total es saldo para la barra durante el evento.",
          "Tras el pago correcto del anticipo la reserva queda Confirmed; cancelar el pago libera el lounge.",
          "El resto del precio y las condiciones de la noche se acuerdan con el club (barra).",
          "La disponibilidad depende del evento y puede cambiar.",
        ],
      },
      {
        title: "Alquiler y eventos especiales",
        points: [
          "El formulario de alquiler es solo una consulta — no es una reserva automática ni un contrato de alquiler.",
          "Precio, condiciones y disponibilidad se acuerdan individualmente con el club.",
          "El club puede rechazar un evento, especialmente por seguridad o calendario.",
        ],
      },
      {
        title: "Programa de promotores",
        points: [
          "El estatus de promotor y los enlaces / códigos QR sirven para el seguimiento de ventas y comisiones según las reglas vigentes del club.",
          "El abuso (tráfico falso, spam, engaño) puede implicar la pérdida del estatus y la no liquidación de comisiones.",
          "Los rankings y estadísticas son informativos y pueden corregirse ante errores técnicos.",
        ],
      },
      {
        title: "Newsletter y comunicación",
        points: [
          "Suscribirse al newsletter equivale al consentimiento para recibir emails promocionales de Galaxy Music Club.",
          "Puedes retirar el consentimiento en cualquier momento en la cuenta o contactando al club.",
          "Los mensajes transaccionales (p. ej. confirmación de compra o reserva) pueden enviarse con independencia del consentimiento de marketing.",
        ],
      },
      {
        title: "Datos personales y cookies",
        points: [
          "Los datos facilitados en el Servicio (email, reservas, consultas de alquiler, etc.) se tratan para prestar servicios, liquidaciones y contacto.",
          "La sesión usa una cookie / token necesario para el inicio de sesión.",
          "Stripe puede tratar datos de pago según su propia política de privacidad.",
          "Una política de privacidad más detallada puede publicarse por el club; consultas: Instagram @galaxymusicclub.",
        ],
      },
      {
        title: "Responsabilidad y PI",
        points: [
          "Procuramos mantener la información actualizada, pero no garantizamos disponibilidad ininterrumpida ni ausencia de errores técnicos.",
          "En la medida permitida por la ley, el club no responde por interrupciones del Servicio, actos de terceros (incluido el pago) ni el uso indebido de una cuenta.",
          "La marca Galaxy, gráficos, textos y medios del sitio están protegidos — está prohibida la copia comercial sin consentimiento.",
          "Usar el Servicio no exime de cumplir el reglamento del club en el local.",
        ],
      },
      {
        title: "Cambios",
        points: [
          "El club puede actualizar estos términos; la fecha de la última actualización figura al final del documento.",
          "El uso continuado del Servicio tras la publicación de cambios implica su aceptación, salvo que la ley imperativa disponga lo contrario.",
        ],
      },
    ],
  },
};

export const rulesDocsByLang: Record<
  RulesLang,
  Record<RulesDoc, RulesContent>
> = {
  pl: { club: rulesByLang.pl, site: siteRulesByLang.pl },
  en: { club: rulesByLang.en, site: siteRulesByLang.en },
  es: { club: rulesByLang.es, site: siteRulesByLang.es },
};

/** @deprecated użyj rulesByLang.pl */
export const clubRules = rulesByLang.pl.sections;
