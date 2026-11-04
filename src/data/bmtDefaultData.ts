export interface ActivityDetailInfo {
  noiz?: string;
  ordutegia?: string;
  non?: string;
  zer?: string;
  planninga?: string[];
  zailtasuna?: string;
  geltokiak?: string[];
  plazak?: string;
  prezioa?: string[];
  ordainketa?: string;
  izena?: string;
  bulegoa?: string;
  antolatzailea?: string;
  telefonoa?: string;
  wikiloc?: { t: string; u: string }[];
}

export interface ActivityItem {
  id: string;
  category: 'ikastaroa' | 'irteera' | 'jardunaldia' | 'ekitaldia';
  sort_order: number;
  visible_in_cards: boolean;
  visible_in_calendar: boolean;
  title_eu: string;
  title_es: string;
  summary_eu: string;
  summary_es: string;
  date_badge_eu: string;
  date_badge_es: string;
  cal_day: string;
  cal_month_eu: string;
  cal_month_es: string;
  cal_subtitle_eu: string;
  cal_subtitle_es: string;
  image: string;
  capacity: number;
  occupied: number;
  status: 'open' | 'full' | 'soon' | 'closed';
  registration_enabled: boolean;
  days?: number;
  km?: string;
  elevation?: string;
  level_eu?: string;
  level_es?: string;
  info?: ActivityDetailInfo;
}

export interface RegistrationItem {
  id: string;
  activity_key: string;
  activity_title: string;
  izena: string;
  abizenak: string;
  nan: string;
  jaiotza: string;
  telefonoa: string;
  eposta: string;
  bazkidea: boolean;
  bazkide_zenbakia: string;
  oharrak: string;
  created_at: string;
}

export interface MaterialItem {
  id: string;
  name_eu: string;
  name_es: string;
  price_eur: number;
  unit_eu: string;
  unit_es: string;
  stock_total: number;
  stock_available: number;
  image: string;
  available: boolean;
}

export interface WikilocRouteItem {
  id: string;
  title_eu: string;
  title_es: string;
  difficulty: 'erraza' | 'ertaina' | 'zaila';
  km: string;
  up_m: string;
  down_m: string;
  url: string;
}

export interface ClubSettings {
  office_hours_eu: string;
  office_hours_es: string;
  shirt_price_eur: number;
  shirt_sizes: string[];
  shirt_where_eu: string;
  shirt_where_es: string;
}

export interface BmtStoreData {
  version: number;
  activities: ActivityItem[];
  registrations: RegistrationItem[];
  materials: MaterialItem[];
  wikiloc: WikilocRouteItem[];
  settings: ClubSettings;
}

export const DEFAULT_BMT_DATA: BmtStoreData = {
  version: 1,
  activities: [
    {
      id: 'ik-eskalada-hastapena-2026',
      category: 'ikastaroa',
      sort_order: 1,
      visible_in_cards: true,
      visible_in_calendar: false,
      title_eu: 'Eskaladako hastapena',
      title_es: 'Iniciación a la escalada',
      summary_eu: 'Eskalada-teknika oinarrizkoak, segurtasuna eta lehen igoerak gidari batekin.',
      summary_es: 'Técnicas básicas de escalada, seguridad y primeras subidas con guía.',
      date_badge_eu: 'Maiatzak 30–31',
      date_badge_es: '30–31 de mayo',
      cal_day: '30–31',
      cal_month_eu: 'Maiatza',
      cal_month_es: 'Mayo',
      cal_subtitle_eu: 'Ikastaroa · Urduliz',
      cal_subtitle_es: 'Curso · Urduliz',
      image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=700&q=80&auto=format&fit=crop',
      capacity: 20,
      occupied: 14,
      status: 'open',
      registration_enabled: true,
      days: 2,
      level_eu: 'Hasiberriak',
      level_es: 'Principiantes',
      info: {
        noiz: 'Maiatzak 30 eta 31 (larunbata eta igandea)',
        ordutegia: '9:30 – 16:30 (konfirmatu gabe)',
        non: 'Urduliz (eguraldiaren arabera)',
        zer: 'Bi eguneko eskalada-ikastaroa, hasiberrientzat. Kirol-eskalada segurtasunez praktikatzeko edukiak ikasiko dira.',
        zailtasuna: 'Jende guztiarentzat',
        plazak: '20',
        prezioa: ['Bazkidea: 55 €', 'Bazkidea <25 urte: 40 €', 'Ez-bazkidea: 80 €'],
        ordainketa: 'Dena eskudirutan',
        izena: 'Apirilak 22tik maiatzak 20ra',
        bulegoa: 'Asteazkenetan 19:00 – 21:00 (klubaren egoitzan)'
      }
    },
    {
      id: 'ik-autoerreskatea-2026',
      category: 'ikastaroa',
      sort_order: 2,
      visible_in_cards: true,
      visible_in_calendar: false,
      title_eu: 'Eskaladako autoerreskatea',
      title_es: 'Autorrescate en escalada',
      summary_eu: 'Larrialdietan jarduteko teknikak: maniobrak, jaitsierak eta erreskate-sistemak.',
      summary_es: 'Técnicas de actuación en emergencias: maniobras, descensos y sistemas de rescate.',
      date_badge_eu: 'Maiatzak 23–24',
      date_badge_es: '23–24 de mayo',
      cal_day: '23–24',
      cal_month_eu: 'Maiatza',
      cal_month_es: 'Mayo',
      cal_subtitle_eu: 'Ikastaroa · Mañaria',
      cal_subtitle_es: 'Curso · Mañaria',
      image: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=700&q=80&auto=format&fit=crop',
      capacity: 16,
      occupied: 12,
      status: 'open',
      registration_enabled: true,
      days: 2,
      level_eu: 'Esperientzia beharrezkoa',
      level_es: 'Se requiere experiencia',
      info: {
        noiz: 'Maiatzak 23 eta 24 (larunbata eta igandea)',
        ordutegia: 'Zehaztu gabe',
        non: 'Mañaria',
        zer: 'Bi eguneko autoerreskateko ikastaroa. Eskaladan trebatutako pertsonentzat; gutxieneko esperientzia derrigorrezkoa da.',
        zailtasuna: 'Eskaladan esperientzia dutenak soilik',
        plazak: '16 (plaza gehiagorako, galdetu)',
        prezioa: ['Bazkidea: 100 €', 'Bazkidea <25 urte: 75 €', 'Ez-bazkidea: 150 €'],
        ordainketa: 'Guztia eskudirutan',
        izena: 'Apirilak 22tik maiatzak 13ra',
        bulegoa: 'Asteazkenetan 19:00 – 21:00 (klubaren egoitzan)'
      }
    },
    {
      id: 'ir-bidarrai-2026',
      category: 'irteera',
      sort_order: 3,
      visible_in_cards: true,
      visible_in_calendar: true,
      title_eu: 'Iparraldeko ehun mendiak',
      title_es: 'Cien montes de Iparralde',
      summary_eu: 'Iparla (1.044 m) eta Behorlegi (1.265 m) inguruko irteera, Ipar Euskal Herrian.',
      summary_es: 'Salida por el entorno de Iparla (1.044 m) y Behorlegi (1.265 m), en Iparralde.',
      date_badge_eu: 'Iraila 12–13',
      date_badge_es: '12–13 de septiembre',
      cal_day: '12–13',
      cal_month_eu: 'Iraila',
      cal_month_es: 'Septiembre',
      cal_subtitle_eu: 'Iparla – Behorlegi',
      cal_subtitle_es: 'Iparla – Behorlegi',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80&auto=format&fit=crop',
      capacity: 40,
      occupied: 31,
      status: 'open',
      registration_enabled: true,
      days: 2,
      level_eu: 'Ertaina',
      level_es: 'Media',
      info: {
        noiz: 'Irailak 12 eta 13 · 2026',
        geltokiak: ['06:00 Bilbo (Begoña)', '06:15 Kalero', '06:20 San Miguel', '06:30 Miradores (Ariz)'],
        non: 'Ipar Euskal Herria · Auziberri (Nafarroa), ostatua',
        zer: 'EMFren Iparraldeko Ehun Mendietako batzuk igoko ditugu (Behorlegituturru, Hauskoa, Buztanzelai, Iparla), Auziberrin (Nafarroa) lo eginda.',
        zailtasuna: 'Ibilbideak erdi-mailakoak eta luzeak dira, desnibel handiekin.',
        plazak: '40',
        prezioa: ['95 €-tik hasita, elkarbanatutako logelan', 'Plazak betetzen ez badira, prezioa igoko da'],
        izena: 'Ekainak 3 – Uztailak 1 (2026)'
      }
    },
    {
      id: 'ir-besaide-2026',
      category: 'irteera',
      sort_order: 4,
      visible_in_cards: true,
      visible_in_calendar: true,
      title_eu: 'Oroimenaren eguna Besaiden',
      title_es: 'Día del recuerdo en Besaide',
      summary_eu: 'Besaideko oroimen-eguna, mendizaleak gogoratzeko urteroko hitzordua.',
      summary_es: 'Día del recuerdo en Besaide, cita anual en memoria de los montañeros.',
      date_badge_eu: 'Iraila 20',
      date_badge_es: '20 de septiembre',
      cal_day: '20',
      cal_month_eu: 'Iraila',
      cal_month_es: 'Septiembre',
      cal_subtitle_eu: 'Irteera',
      cal_subtitle_es: 'Salida',
      image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=900&q=80&auto=format&fit=crop',
      capacity: 50,
      occupied: 0,
      status: 'soon',
      registration_enabled: false,
      days: 1,
      level_eu: 'Erraza',
      level_es: 'Fácil'
    },
    {
      id: 'ir-bardenak-2026',
      category: 'irteera',
      sort_order: 5,
      visible_in_cards: true,
      visible_in_calendar: true,
      title_eu: 'Bardeak',
      title_es: 'Las Bardenas',
      summary_eu: 'Nafarroako Bardeak: Pisquerra (465 m) eta Rallón (493 m), paisaia lehor ikusgarrian.',
      summary_es: 'Bardenas de Navarra: Pisquerra (465 m) y Rallón (493 m), en un paisaje árido espectacular.',
      date_badge_eu: 'Urria 3–4',
      date_badge_es: '3–4 de octubre',
      cal_day: '3–4',
      cal_month_eu: 'Urria',
      cal_month_es: 'Octubre',
      cal_subtitle_eu: 'Irteera',
      cal_subtitle_es: 'Salida',
      image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&q=80&auto=format&fit=crop',
      capacity: 45,
      occupied: 40,
      status: 'open',
      registration_enabled: true,
      days: 2,
      level_eu: 'Ertaina',
      level_es: 'Media',
      info: {
        noiz: 'Urriak 3 eta 4 · 2026',
        non: 'Nafarroako Bardeak',
        zer: 'Nafarroako Bardeetara goaz! Bi eguneko irteera, Olitan ostatu hartuta.',
        planninga: [
          '1. eguna: Basauritik irten eta Bardea Beltzeko «Peña del Fraile»ra igoko gara. Ondoren Olitera, Ducay hotelera: afaria eta ostatua.',
          '2. eguna: Bardea Zurian, Pisquerra eta Rallón gailurrak. Bakoitzak bere bazkaria eginda, 19:00ak aldera Basaurira bueltan.'
        ],
        zailtasuna: 'Gailurretara igotzeko maila «ertaina» behar da; aukeran, gailurrik gabeko ibilbide zirkularrak.',
        geltokiak: ['Bilbo 6:30', 'El Kalero 6:40', 'San Miguel 6:50', 'Basauri (Miradoreetan) 7:00'],
        plazak: 'Gehienez 45 lagun',
        prezioa: ['Logela bikoitza: 105 € bazkideak · 125 € bazkide ez direnak', 'Bakarrentzako logela: 125 € (denak)'],
        izena: 'Uztailak 8 – Irailak 23',
        wikiloc: [
          { t: 'Piskerra – Rallón', u: 'https://loc.wiki/t/20502168?h=3p7qrlayml&wa=sd&la=es' },
          { t: 'Peña del Fraile', u: 'https://loc.wiki/t/100072027?h=3p7qrlayml&wa=sd&la=es' }
        ]
      }
    },
    {
      id: 'ja-mendi-jardunaldiak-2026',
      category: 'jardunaldia',
      sort_order: 6,
      visible_in_cards: true,
      visible_in_calendar: true,
      title_eu: 'Mendi jardunaldiak',
      title_es: 'Jornadas de montaña',
      summary_eu: 'Azaroko lau asteartez, mendiari buruzko hitzaldi eta jardunaldien zikloa.',
      summary_es: 'Cuatro martes de noviembre, ciclo de charlas y jornadas sobre montaña.',
      date_badge_eu: 'Azaroa 3·10·17·24',
      date_badge_es: 'Noviembre 3·10·17·24',
      cal_day: '3·10·17·24',
      cal_month_eu: 'Azaroa',
      cal_month_es: 'Noviembre',
      cal_subtitle_eu: 'Jardunaldia',
      cal_subtitle_es: 'Jornada',
      image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=900&q=80&auto=format&fit=crop',
      capacity: 60,
      occupied: 0,
      status: 'soon',
      registration_enabled: false
    },
    {
      id: 'ir-malmasin-2026',
      category: 'irteera',
      sort_order: 7,
      visible_in_cards: false,
      visible_in_calendar: true,
      title_eu: 'Irteera historikoa Malmasin inguruan',
      title_es: 'Salida histórica por el entorno de Malmasin',
      summary_eu: 'Malmasin inguruko irteera historikoa, gure ondarea eta ingurua ezagutzeko.',
      summary_es: 'Salida histórica por el entorno de Malmasin, para conocer nuestro patrimonio y el entorno.',
      date_badge_eu: 'Azaroak 8',
      date_badge_es: '8 de noviembre',
      cal_day: '8',
      cal_month_eu: 'Azaroa',
      cal_month_es: 'Noviembre',
      cal_subtitle_eu: 'Irteera',
      cal_subtitle_es: 'Salida',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=80&auto=format&fit=crop',
      capacity: 40,
      occupied: 0,
      status: 'soon',
      registration_enabled: false,
      days: 1,
      level_eu: 'Erraza',
      level_es: 'Fácil'
    },
    {
      id: 'ir-castrovalnera-2026',
      category: 'irteera',
      sort_order: 8,
      visible_in_cards: true,
      visible_in_calendar: true,
      title_eu: 'Castrovalnera',
      title_es: 'Castrovalnera',
      summary_eu: 'Castrovalnera (1.718 m), urteko azken irteera handietako bat.',
      summary_es: 'Castrovalnera (1.718 m), una de las grandes salidas finales del año.',
      date_badge_eu: 'Abendua 13',
      date_badge_es: '13 de diciembre',
      cal_day: '13',
      cal_month_eu: 'Abendua',
      cal_month_es: 'Diciembre',
      cal_subtitle_eu: 'Irteera',
      cal_subtitle_es: 'Salida',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=80&auto=format&fit=crop',
      capacity: 40,
      occupied: 0,
      status: 'soon',
      registration_enabled: false,
      days: 1,
      level_eu: 'Zaila',
      level_es: 'Difícil'
    },
    {
      id: 'ir-bazkaria-2026',
      category: 'ekitaldia',
      sort_order: 9,
      visible_in_cards: false,
      visible_in_calendar: true,
      title_eu: 'Adiskidetasunaren bazkaria',
      title_es: 'Comida de hermandad',
      summary_eu: 'Urtea ospatzeko elkarte-bazkaria, bazkide eta lagunentzat.',
      summary_es: 'Comida de hermandad para celebrar el año, para socios, socias y amigos.',
      date_badge_eu: 'Abenduak 20',
      date_badge_es: '20 de diciembre',
      cal_day: '20',
      cal_month_eu: 'Abendua',
      cal_month_es: 'Diciembre',
      cal_subtitle_eu: 'Ekitaldia',
      cal_subtitle_es: 'Evento',
      image: '',
      capacity: 80,
      occupied: 0,
      status: 'soon',
      registration_enabled: false,
      days: 1
    },
    {
      id: 'ir-agur-2026',
      category: 'irteera',
      sort_order: 10,
      visible_in_cards: false,
      visible_in_calendar: true,
      title_eu: 'Agur urteari Gorbeian',
      title_es: 'Despedida del año en el Gorbea',
      summary_eu: 'Urteari agur esateko igoera Gorbeiara.',
      summary_es: 'Subida al Gorbea para despedir el año.',
      date_badge_eu: 'Abenduak 31',
      date_badge_es: '31 de diciembre',
      cal_day: '31',
      cal_month_eu: 'Abendua',
      cal_month_es: 'Diciembre',
      cal_subtitle_eu: 'Irteera',
      cal_subtitle_es: 'Salida',
      image: '',
      capacity: 60,
      occupied: 0,
      status: 'soon',
      registration_enabled: false,
      days: 1,
      level_eu: 'Ertaina',
      level_es: 'Media'
    }
  ],
  registrations: [
    {
      id: 'reg-demo-1',
      activity_key: 'ir-bardenak-2026',
      activity_title: 'Bardeak / Las Bardenas',
      izena: 'Ane',
      abizenak: 'Etxebarria Bilbao',
      nan: '78912345K',
      jaiotza: '1989-04-12',
      telefonoa: '688 123 456',
      eposta: 'ane.etxebarria@example.com',
      bazkidea: true,
      bazkide_zenbakia: '412',
      oharrak: 'Logela bikoitza Jon Agirrerekin',
      created_at: '2026-09-10T18:30:00Z'
    },
    {
      id: 'reg-demo-2',
      activity_key: 'ir-bardenak-2026',
      activity_title: 'Bardeak / Las Bardenas',
      izena: 'Jon',
      abizenak: 'Agirre Zabala',
      nan: '45678912L',
      jaiotza: '1987-11-23',
      telefonoa: '644 987 654',
      eposta: 'jon.agirre@example.com',
      bazkidea: true,
      bazkide_zenbakia: '389',
      oharrak: 'San Miguel geltokian igoko naiz',
      created_at: '2026-09-10T18:35:00Z'
    },
    {
      id: 'reg-demo-3',
      activity_key: 'ik-eskalada-hastapena-2026',
      activity_title: 'Eskaladako hastapena',
      izena: 'Mikel',
      abizenak: 'Uriarte Goikoetxea',
      nan: '16089234A',
      jaiotza: '2003-06-19',
      telefonoa: '677 223 344',
      eposta: 'mikel.uriarte@example.com',
      bazkidea: false,
      bazkide_zenbakia: '',
      oharrak: 'Katu-oinak baditut (42 neurria)',
      created_at: '2026-05-02T11:15:00Z'
    }
  ],
  materials: [
    {
      id: 'mat-kranpoiak',
      name_eu: 'Kranpoiak',
      name_es: 'Crampones',
      price_eur: 3,
      unit_eu: 'astea',
      unit_es: 'semana',
      stock_total: 12,
      stock_available: 8,
      image: '/img/materiala/kranpoiak.jpg',
      available: true
    },
    {
      id: 'mat-erraketak',
      name_eu: 'Erraketak',
      name_es: 'Raquetas',
      price_eur: 3,
      unit_eu: 'astea',
      unit_es: 'semana',
      stock_total: 15,
      stock_available: 11,
      image: '/img/materiala/erraketak.jpg',
      available: true
    },
    {
      id: 'mat-pioletak',
      name_eu: 'Pioletak',
      name_es: 'Piolets',
      price_eur: 3,
      unit_eu: 'astea',
      unit_es: 'semana',
      stock_total: 10,
      stock_available: 6,
      image: '/img/materiala/pioletak.jpg',
      available: true
    }
  ],
  wikiloc: [
    {
      id: 'wl-gorbeia-gauez',
      title_eu: 'Basauri – Gorbeia gauez',
      title_es: 'Basauri – Gorbea nocturna',
      difficulty: 'zaila',
      km: '41,4',
      up_m: '2.118',
      down_m: '1.223',
      url: 'https://es.wikiloc.com/rutas-senderismo/marcha-nocturna-basauri-gorbea-10021132'
    },
    {
      id: 'wl-mugarriz-mugarri',
      title_eu: 'Mugarriz mugarri Basauri',
      title_es: 'Basauri de muga en muga',
      difficulty: 'ertaina',
      km: '—',
      up_m: '—',
      down_m: '—',
      url: 'https://es.wikiloc.com/rutas-senderismo/basauri-mugarriz-mugarri-66993395'
    },
    {
      id: 'wl-basauriko-bira',
      title_eu: 'Basauriko Bira',
      title_es: 'Vuelta a Basauri',
      difficulty: 'ertaina',
      km: '—',
      up_m: '—',
      down_m: '—',
      url: 'https://es.wikiloc.com/rutas-senderismo/basauriko-bira-kukurrustu-oiarkrutze-malmasin-casco-titigana-san-bizente-titigane-217422520'
    }
  ],
  settings: {
    office_hours_eu: 'asteazkenetan zabalik · 19:00 – 21:00',
    office_hours_es: 'abierta los miércoles · 19:00 – 21:00',
    shirt_price_eur: 18,
    shirt_sizes: ['S', 'M', 'L', 'XL'],
    shirt_where_eu: 'Egoitzan',
    shirt_where_es: 'En la sede'
  }
};
