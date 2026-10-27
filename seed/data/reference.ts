import { digits, fill, int, pick, type Rand } from '../rng'
import type { Locale } from './locale'
import { locales } from './locales'

export { trades, type Trade } from './locale'

export const amenities = [
  ['balcony', 'Balcony'], ['garden', 'Garden'], ['roof_terrace', 'Roof terrace'], ['lift', 'Lift'],
  ['parking', 'Parking space'], ['bike_storage', 'Bike storage'], ['storage_room', 'Storage room'],
  ['solar_panels', 'Solar panels'], ['heat_pump', 'Heat pump'], ['furnished', 'Furnished'],
] as const

export type AmenityCode = (typeof amenities)[number][0]

/** Where an organization lets homes: the city as it writes its own name, its centre and its market. */
export type City = {
  name: string
  locale: Locale
  lat: number
  lng: number
  /** The market rent per m² a month in 2026, in the locale's currency. */
  rentPerM2: number
  /** How much of the organization's portfolio is here, against its other cities. */
  weight: number
  /** A postal code of the city, or null where the country has none. */
  postalCode: (rand: Rand) => string | null
  /** The city's own streets and buildings, where the locale's are another city's. */
  streets?: readonly string[]
  buildings?: readonly string[]
}

const pad = (value: number, length: number) => String(value).padStart(length, '0')
const ukLetters = 'ABDEFGHJLNPQRSTUWXYZ'
const caLetters = 'ABCEGHJKLMNPRSTVWXYZ'

const org1Cities: readonly City[] = [
  { name: 'London', locale: locales.gb, lat: 51.5072, lng: -0.1276, rentPerM2: 38, weight: 5, postalCode: (rand) => `${pick(rand, ['SW', 'SE', 'N', 'NW', 'E', 'W'])}${int(rand, 1, 19)} ${int(rand, 1, 9)}${fill(rand, '##', ukLetters)}` },
  { name: 'Manchester', locale: locales.gb, lat: 53.4808, lng: -2.2426, rentPerM2: 19, weight: 2, postalCode: (rand) => `M${int(rand, 1, 40)} ${int(rand, 1, 9)}${fill(rand, '##', ukLetters)}`, streets: ['Wilmslow Road', 'Deansgate', 'Oldham Street', 'Burton Road', 'Great Ancoats Street'], buildings: ['Albion Works', 'Canal Side Lofts', 'The Old Print Works', 'Ancoats Mill'] },
  { name: 'New York', locale: locales.us, lat: 40.7128, lng: -74.006, rentPerM2: 58, weight: 4, postalCode: (rand) => `${int(rand, 10001, 10475)}${rand() < 0.1 ? `-${digits(rand, 4)}` : ''}` },
  { name: 'Berlin', locale: locales.de, lat: 52.52, lng: 13.405, rentPerM2: 19, weight: 3, postalCode: (rand) => String(int(rand, 10115, 14199)) },
  { name: 'München', locale: locales.de, lat: 48.1351, lng: 11.582, rentPerM2: 24, weight: 2, postalCode: (rand) => String(int(rand, 80331, 81929)), streets: ['Leopoldstraße', 'Türkenstraße', 'Maximilianstraße', 'Klenzestraße', 'Hohenzollernstraße'], buildings: ['Isarauen', 'Wohnpark Schwabing', 'Haus am Englischen Garten'] },
  { name: 'Paris', locale: locales.fr, lat: 48.8566, lng: 2.3522, rentPerM2: 31, weight: 3, postalCode: (rand) => `750${pad(int(rand, 1, 20), 2)}` },
  { name: 'Lyon', locale: locales.fr, lat: 45.764, lng: 4.8357, rentPerM2: 16, weight: 1, postalCode: (rand) => `6900${int(rand, 1, 9)}`, streets: ['cours Lafayette', 'montée de la Grande-Côte', 'rue de la République', 'quai Saint-Antoine'], buildings: ['L\'Atelier des Canuts', 'Résidence Croix-Rousse', 'Les Terrasses de Fourvière'] },
  { name: 'Amsterdam', locale: locales.nl, lat: 52.3676, lng: 4.9041, rentPerM2: 25, weight: 2, postalCode: (rand) => `${int(rand, 1011, 1109)} ${fill(rand, '##', 'ABCEGHJKLMNPRTVWXZ')}` },
  { name: 'Kraków', locale: locales.pl, lat: 50.0647, lng: 19.945, rentPerM2: 75, weight: 1, postalCode: (rand) => `3${int(rand, 0, 1)}-${digits(rand, 3)}` },
  { name: 'İstanbul', locale: locales.tr, lat: 41.0082, lng: 28.9784, rentPerM2: 650, weight: 2, postalCode: (rand) => `34${digits(rand, 3)}` },
  { name: 'Αθήνα', locale: locales.gr, lat: 37.9838, lng: 23.7275, rentPerM2: 13, weight: 1, postalCode: (rand) => `${int(rand, 104, 117)} ${digits(rand, 2)}` },
  { name: 'София', locale: locales.bg, lat: 42.6977, lng: 23.3219, rentPerM2: 11, weight: 1, postalCode: (rand) => String(int(rand, 1000, 1799)) },
  { name: 'دبي', locale: locales.ae, lat: 25.2048, lng: 55.2708, rentPerM2: 110, weight: 2, postalCode: () => null },
  { name: 'תל אביב-יפו', locale: locales.il, lat: 32.0853, lng: 34.7818, rentPerM2: 105, weight: 2, postalCode: (rand) => `6${digits(rand, 6)}` },
  { name: 'मुंबई', locale: locales.in, lat: 19.076, lng: 72.8777, rentPerM2: 900, weight: 2, postalCode: (rand) => String(400000 + int(rand, 1, 104)) },
  { name: 'Bengaluru', locale: locales.in, lat: 12.9716, lng: 77.5946, rentPerM2: 450, weight: 1, postalCode: (rand) => String(560000 + int(rand, 1, 103)), streets: ['100 Feet Road, Indiranagar', '12th Main Road, HSR Layout', 'Sarjapur Road', 'ಎಂ.ಜಿ. ರಸ್ತೆ'], buildings: ['Prestige Lakeview', 'Brigade Orchards', 'Sobha Silicon Oasis'] },
  { name: 'กรุงเทพมหานคร', locale: locales.th, lat: 13.7563, lng: 100.5018, rentPerM2: 520, weight: 2, postalCode: (rand) => `10${int(rand, 1, 9)}${int(rand, 1, 6)}0` },
  { name: '東京', locale: locales.jp, lat: 35.6762, lng: 139.6503, rentPerM2: 4300, weight: 3, postalCode: (rand) => `${int(rand, 100, 199)}-${digits(rand, 4)}` },
  { name: '서울', locale: locales.kr, lat: 37.5665, lng: 126.978, rentPerM2: 32000, weight: 2, postalCode: (rand) => pad(int(rand, 1000, 8899), 5) },
  { name: 'São Paulo', locale: locales.br, lat: -23.5505, lng: -46.6333, rentPerM2: 68, weight: 2, postalCode: (rand) => `0${int(rand, 1000, 5999)}-${digits(rand, 3)}` },
  { name: 'Dublin', locale: locales.ie, lat: 53.3498, lng: -6.2603, rentPerM2: 33, weight: 2, postalCode: (rand) => `D${pad(int(rand, 1, 24), 2)} ${fill(rand, '####', 'ACDEFHKNPRTVWXY0123456789')}` },
]

const org2Cities: readonly City[] = [
  { name: 'Ciudad de México', locale: locales.mx, lat: 19.4326, lng: -99.1332, rentPerM2: 380, weight: 4, postalCode: (rand) => pad(int(rand, 1000, 16999), 5) },
  { name: 'Guadalajara', locale: locales.mx, lat: 20.6597, lng: -103.3496, rentPerM2: 260, weight: 2, postalCode: (rand) => String(int(rand, 44100, 45999)), streets: ['Avenida Vallarta', 'Calle López Cotilla', 'Avenida de la Paz', 'Avenida Chapultepec'] },
  { name: 'Toronto', locale: locales.ca, lat: 43.6532, lng: -79.3832, rentPerM2: 42, weight: 3, postalCode: (rand) => `M${int(rand, 1, 9)}${fill(rand, '#', caLetters)} ${int(rand, 1, 9)}${fill(rand, '#', caLetters)}${int(rand, 0, 9)}` },
  { name: 'Montréal', locale: locales.qc, lat: 45.5019, lng: -73.5674, rentPerM2: 30, weight: 2, postalCode: (rand) => `H${int(rand, 1, 9)}${fill(rand, '#', caLetters)} ${int(rand, 1, 9)}${fill(rand, '#', caLetters)}${int(rand, 0, 9)}` },
  { name: 'Sydney', locale: locales.au, lat: -33.8688, lng: 151.2093, rentPerM2: 48, weight: 3, postalCode: (rand) => String(int(rand, 2000, 2234)) },
  { name: 'Lagos', locale: locales.ng, lat: 6.5244, lng: 3.3792, rentPerM2: 5500, weight: 2, postalCode: (rand) => (rand() < 0.3 ? null : String(int(rand, 100001, 102999))) },
  { name: 'Nairobi', locale: locales.ke, lat: -1.2921, lng: 36.8219, rentPerM2: 1100, weight: 2, postalCode: (rand) => `00${pick(rand, ['100', '200', '300', '400', '505', '600', '606', '800'])}` },
]

export const orgSpecs = [
  {
    id: 1,
    name: 'Kestrel Lane Residential Ltd',
    slug: 'kestrel-lane',
    city: 'London',
    registration: '14832657',
    share: 0.7,
    cities: org1Cities,
    users: [
      ['Amara', 'O.', 'admin'], ['Kenji', 'S.', 'manager'], ['Léa', 'M.', 'manager'], ['Rahul', 'K.', 'finance'],
      ['Zofia', 'W.', 'finance'], ['Yusuf', 'A.', 'maintenance'], ['Søren', 'H.', 'maintenance'], ['Chloé', 'B.', 'manager'],
    ] as const,
  },
  {
    id: 2,
    name: 'Pacífico Habitat Group S.A. de C.V.',
    slug: 'pacifico-habitat',
    city: 'Ciudad de México',
    registration: 'PHG190312KD4',
    share: 0.3,
    cities: org2Cities,
    users: [
      ['Valentina', 'G.', 'admin'], ['Chinedu', 'E.', 'manager'], ['Wanjiru', 'K.', 'finance'], ['Liam', 'T.', 'maintenance'], ['Mai', 'N.', 'maintenance'],
    ] as const,
  },
] as const
