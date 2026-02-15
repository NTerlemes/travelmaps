import { ContinentName } from '../types';

export interface ContinentInfo {
  name: ContinentName;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
}

export interface CountryInfo {
  code: string;
  iso3Code: string;
  name: string;
  continent: ContinentName;
  bounds: [[number, number], [number, number]];
}

export const CONTINENTS: ContinentInfo[] = [
  { name: 'Europe', bounds: [[35, -25], [72, 45]] },
  { name: 'Asia', bounds: [[-10, 25], [55, 150]] },
  { name: 'Africa', bounds: [[-35, -20], [38, 55]] },
  { name: 'North America', bounds: [[5, -170], [85, -50]] },
  { name: 'South America', bounds: [[-57, -82], [13, -34]] },
  { name: 'Oceania', bounds: [[-50, 110], [0, 180]] },
  { name: 'Antarctica', bounds: [[-90, -180], [-60, 180]] },
];

export const COUNTRIES: CountryInfo[] = [
  // Europe
  { code: 'FR', iso3Code: 'FRA', name: 'France', continent: 'Europe', bounds: [[41.3, -5.1], [51.1, 9.6]] },
  { code: 'DE', iso3Code: 'DEU', name: 'Germany', continent: 'Europe', bounds: [[47.3, 5.9], [55.1, 15.0]] },
  { code: 'GB', iso3Code: 'GBR', name: 'United Kingdom', continent: 'Europe', bounds: [[49.9, -8.2], [60.8, 1.8]] },
  { code: 'IT', iso3Code: 'ITA', name: 'Italy', continent: 'Europe', bounds: [[36.6, 6.6], [47.1, 18.5]] },
  { code: 'ES', iso3Code: 'ESP', name: 'Spain', continent: 'Europe', bounds: [[36.0, -9.3], [43.8, 3.3]] },
  { code: 'PT', iso3Code: 'PRT', name: 'Portugal', continent: 'Europe', bounds: [[36.9, -9.5], [42.2, -6.2]] },
  { code: 'NL', iso3Code: 'NLD', name: 'Netherlands', continent: 'Europe', bounds: [[50.8, 3.4], [53.5, 7.2]] },
  { code: 'BE', iso3Code: 'BEL', name: 'Belgium', continent: 'Europe', bounds: [[49.5, 2.5], [51.5, 6.4]] },
  { code: 'CH', iso3Code: 'CHE', name: 'Switzerland', continent: 'Europe', bounds: [[45.8, 5.9], [47.8, 10.5]] },
  { code: 'AT', iso3Code: 'AUT', name: 'Austria', continent: 'Europe', bounds: [[46.4, 9.5], [49.0, 17.2]] },
  { code: 'PL', iso3Code: 'POL', name: 'Poland', continent: 'Europe', bounds: [[49.0, 14.1], [54.8, 24.2]] },
  { code: 'SE', iso3Code: 'SWE', name: 'Sweden', continent: 'Europe', bounds: [[55.3, 11.1], [69.1, 24.2]] },
  { code: 'NO', iso3Code: 'NOR', name: 'Norway', continent: 'Europe', bounds: [[57.9, 4.6], [71.2, 31.1]] },
  { code: 'DK', iso3Code: 'DNK', name: 'Denmark', continent: 'Europe', bounds: [[54.6, 8.1], [57.8, 15.2]] },
  { code: 'FI', iso3Code: 'FIN', name: 'Finland', continent: 'Europe', bounds: [[59.8, 20.6], [70.1, 31.6]] },
  { code: 'GR', iso3Code: 'GRC', name: 'Greece', continent: 'Europe', bounds: [[34.8, 19.4], [41.7, 29.6]] },
  { code: 'CZ', iso3Code: 'CZE', name: 'Czech Republic', continent: 'Europe', bounds: [[48.6, 12.1], [51.1, 18.9]] },
  { code: 'IE', iso3Code: 'IRL', name: 'Ireland', continent: 'Europe', bounds: [[51.4, -10.5], [55.4, -6.0]] },
  { code: 'RO', iso3Code: 'ROU', name: 'Romania', continent: 'Europe', bounds: [[43.6, 20.3], [48.3, 29.7]] },
  { code: 'HU', iso3Code: 'HUN', name: 'Hungary', continent: 'Europe', bounds: [[45.7, 16.1], [48.6, 22.9]] },

  // Asia
  { code: 'CN', iso3Code: 'CHN', name: 'China', continent: 'Asia', bounds: [[18.2, 73.5], [53.6, 134.8]] },
  { code: 'JP', iso3Code: 'JPN', name: 'Japan', continent: 'Asia', bounds: [[24.2, 122.9], [45.5, 153.9]] },
  { code: 'IN', iso3Code: 'IND', name: 'India', continent: 'Asia', bounds: [[6.7, 68.2], [35.5, 97.4]] },
  { code: 'KR', iso3Code: 'KOR', name: 'South Korea', continent: 'Asia', bounds: [[33.1, 124.6], [38.6, 131.9]] },
  { code: 'TH', iso3Code: 'THA', name: 'Thailand', continent: 'Asia', bounds: [[5.6, 97.3], [20.5, 105.6]] },
  { code: 'VN', iso3Code: 'VNM', name: 'Vietnam', continent: 'Asia', bounds: [[8.4, 102.1], [23.4, 109.5]] },
  { code: 'ID', iso3Code: 'IDN', name: 'Indonesia', continent: 'Asia', bounds: [[-11.0, 95.0], [6.1, 141.0]] },
  { code: 'PH', iso3Code: 'PHL', name: 'Philippines', continent: 'Asia', bounds: [[4.6, 116.9], [21.1, 126.6]] },
  { code: 'TR', iso3Code: 'TUR', name: 'Turkey', continent: 'Asia', bounds: [[36.0, 26.0], [42.1, 44.8]] },
  { code: 'SA', iso3Code: 'SAU', name: 'Saudi Arabia', continent: 'Asia', bounds: [[16.4, 34.6], [32.2, 55.7]] },
  { code: 'AE', iso3Code: 'ARE', name: 'United Arab Emirates', continent: 'Asia', bounds: [[22.6, 51.6], [26.1, 56.4]] },
  { code: 'IL', iso3Code: 'ISR', name: 'Israel', continent: 'Asia', bounds: [[29.5, 34.3], [33.3, 35.9]] },
  { code: 'MY', iso3Code: 'MYS', name: 'Malaysia', continent: 'Asia', bounds: [[0.9, 99.6], [7.4, 119.3]] },
  { code: 'SG', iso3Code: 'SGP', name: 'Singapore', continent: 'Asia', bounds: [[1.2, 103.6], [1.5, 104.0]] },

  // Africa
  { code: 'ZA', iso3Code: 'ZAF', name: 'South Africa', continent: 'Africa', bounds: [[-34.8, 16.5], [-22.1, 32.9]] },
  { code: 'EG', iso3Code: 'EGY', name: 'Egypt', continent: 'Africa', bounds: [[22.0, 24.7], [31.7, 36.9]] },
  { code: 'MA', iso3Code: 'MAR', name: 'Morocco', continent: 'Africa', bounds: [[27.7, -13.2], [35.9, -1.0]] },
  { code: 'KE', iso3Code: 'KEN', name: 'Kenya', continent: 'Africa', bounds: [[-4.7, 33.9], [5.0, 41.9]] },
  { code: 'NG', iso3Code: 'NGA', name: 'Nigeria', continent: 'Africa', bounds: [[4.3, 2.7], [13.9, 14.7]] },
  { code: 'TZ', iso3Code: 'TZA', name: 'Tanzania', continent: 'Africa', bounds: [[-11.7, 29.3], [-1.0, 40.4]] },
  { code: 'ET', iso3Code: 'ETH', name: 'Ethiopia', continent: 'Africa', bounds: [[3.4, 33.0], [14.9, 48.0]] },
  { code: 'GH', iso3Code: 'GHA', name: 'Ghana', continent: 'Africa', bounds: [[4.7, -3.3], [11.2, 1.2]] },
  { code: 'TN', iso3Code: 'TUN', name: 'Tunisia', continent: 'Africa', bounds: [[30.2, 7.5], [37.3, 11.6]] },

  // North America
  { code: 'US', iso3Code: 'USA', name: 'United States', continent: 'North America', bounds: [[24.5, -125.0], [49.4, -66.9]] },
  { code: 'CA', iso3Code: 'CAN', name: 'Canada', continent: 'North America', bounds: [[41.7, -141.0], [83.1, -52.6]] },
  { code: 'MX', iso3Code: 'MEX', name: 'Mexico', continent: 'North America', bounds: [[14.5, -118.4], [32.7, -86.7]] },
  { code: 'CU', iso3Code: 'CUB', name: 'Cuba', continent: 'North America', bounds: [[19.8, -85.0], [23.3, -74.1]] },
  { code: 'CR', iso3Code: 'CRI', name: 'Costa Rica', continent: 'North America', bounds: [[8.0, -85.9], [11.2, -82.6]] },
  { code: 'PA', iso3Code: 'PAN', name: 'Panama', continent: 'North America', bounds: [[7.2, -83.1], [9.6, -77.2]] },

  // South America
  { code: 'BR', iso3Code: 'BRA', name: 'Brazil', continent: 'South America', bounds: [[-33.8, -73.9], [5.3, -34.8]] },
  { code: 'AR', iso3Code: 'ARG', name: 'Argentina', continent: 'South America', bounds: [[-55.1, -73.6], [-21.8, -53.6]] },
  { code: 'CL', iso3Code: 'CHL', name: 'Chile', continent: 'South America', bounds: [[-55.9, -75.6], [-17.5, -66.4]] },
  { code: 'CO', iso3Code: 'COL', name: 'Colombia', continent: 'South America', bounds: [[-4.2, -79.0], [12.5, -66.9]] },
  { code: 'PE', iso3Code: 'PER', name: 'Peru', continent: 'South America', bounds: [[-18.3, -81.3], [-0.04, -68.7]] },
  { code: 'EC', iso3Code: 'ECU', name: 'Ecuador', continent: 'South America', bounds: [[-5.0, -81.1], [1.5, -75.2]] },
  { code: 'UY', iso3Code: 'URY', name: 'Uruguay', continent: 'South America', bounds: [[-35.0, -58.4], [-30.1, -53.1]] },

  // Oceania
  { code: 'AU', iso3Code: 'AUS', name: 'Australia', continent: 'Oceania', bounds: [[-43.6, 113.3], [-10.7, 153.6]] },
  { code: 'NZ', iso3Code: 'NZL', name: 'New Zealand', continent: 'Oceania', bounds: [[-47.3, 166.4], [-34.4, 178.6]] },
  { code: 'FJ', iso3Code: 'FJI', name: 'Fiji', continent: 'Oceania', bounds: [[-21.0, 177.0], [-12.5, -179.8]] },
];

// Mapping from ISO Alpha-2 codes to continents (extended list for filtering world GeoJSON)
export const ISO_TO_CONTINENT: Record<string, ContinentName> = {
  // Europe
  AL: 'Europe', AD: 'Europe', AT: 'Europe', BY: 'Europe', BE: 'Europe',
  BA: 'Europe', BG: 'Europe', HR: 'Europe', CY: 'Europe', CZ: 'Europe',
  DK: 'Europe', EE: 'Europe', FI: 'Europe', FR: 'Europe', DE: 'Europe',
  GR: 'Europe', HU: 'Europe', IS: 'Europe', IE: 'Europe', IT: 'Europe',
  XK: 'Europe', LV: 'Europe', LI: 'Europe', LT: 'Europe', LU: 'Europe',
  MT: 'Europe', MD: 'Europe', MC: 'Europe', ME: 'Europe', NL: 'Europe',
  MK: 'Europe', NO: 'Europe', PL: 'Europe', PT: 'Europe', RO: 'Europe',
  RU: 'Europe', SM: 'Europe', RS: 'Europe', SK: 'Europe', SI: 'Europe',
  ES: 'Europe', SE: 'Europe', CH: 'Europe', UA: 'Europe', GB: 'Europe',
  VA: 'Europe',

  // Asia
  AF: 'Asia', AM: 'Asia', AZ: 'Asia', BH: 'Asia', BD: 'Asia',
  BT: 'Asia', BN: 'Asia', KH: 'Asia', CN: 'Asia', GE: 'Asia',
  IN: 'Asia', ID: 'Asia', IR: 'Asia', IQ: 'Asia', IL: 'Asia',
  JP: 'Asia', JO: 'Asia', KZ: 'Asia', KW: 'Asia', KG: 'Asia',
  LA: 'Asia', LB: 'Asia', MY: 'Asia', MV: 'Asia', MN: 'Asia',
  MM: 'Asia', NP: 'Asia', KP: 'Asia', OM: 'Asia', PK: 'Asia',
  PS: 'Asia', PH: 'Asia', QA: 'Asia', SA: 'Asia', SG: 'Asia',
  KR: 'Asia', LK: 'Asia', SY: 'Asia', TW: 'Asia', TJ: 'Asia',
  TH: 'Asia', TL: 'Asia', TR: 'Asia', TM: 'Asia', AE: 'Asia',
  UZ: 'Asia', VN: 'Asia', YE: 'Asia',

  // Africa
  DZ: 'Africa', AO: 'Africa', BJ: 'Africa', BW: 'Africa', BF: 'Africa',
  BI: 'Africa', CM: 'Africa', CV: 'Africa', CF: 'Africa', TD: 'Africa',
  KM: 'Africa', CD: 'Africa', CG: 'Africa', CI: 'Africa', DJ: 'Africa',
  EG: 'Africa', GQ: 'Africa', ER: 'Africa', ET: 'Africa', GA: 'Africa',
  GM: 'Africa', GH: 'Africa', GN: 'Africa', GW: 'Africa', KE: 'Africa',
  LS: 'Africa', LR: 'Africa', LY: 'Africa', MG: 'Africa', MW: 'Africa',
  ML: 'Africa', MR: 'Africa', MU: 'Africa', MA: 'Africa', MZ: 'Africa',
  NA: 'Africa', NE: 'Africa', NG: 'Africa', RW: 'Africa', ST: 'Africa',
  SN: 'Africa', SC: 'Africa', SL: 'Africa', SO: 'Africa', ZA: 'Africa',
  SS: 'Africa', SD: 'Africa', SZ: 'Africa', TZ: 'Africa', TG: 'Africa',
  TN: 'Africa', UG: 'Africa', ZM: 'Africa', ZW: 'Africa',

  // North America
  AG: 'North America', BS: 'North America', BB: 'North America', BZ: 'North America',
  CA: 'North America', CR: 'North America', CU: 'North America', DM: 'North America',
  DO: 'North America', SV: 'North America', GD: 'North America', GT: 'North America',
  HT: 'North America', HN: 'North America', JM: 'North America', MX: 'North America',
  NI: 'North America', PA: 'North America', KN: 'North America', LC: 'North America',
  VC: 'North America', TT: 'North America', US: 'North America',

  // South America
  AR: 'South America', BO: 'South America', BR: 'South America', CL: 'South America',
  CO: 'South America', EC: 'South America', GY: 'South America', PY: 'South America',
  PE: 'South America', SR: 'South America', UY: 'South America', VE: 'South America',

  // Oceania
  AU: 'Oceania', FJ: 'Oceania', KI: 'Oceania', MH: 'Oceania',
  FM: 'Oceania', NR: 'Oceania', NZ: 'Oceania', PW: 'Oceania',
  PG: 'Oceania', WS: 'Oceania', SB: 'Oceania', TO: 'Oceania',
  TV: 'Oceania', VU: 'Oceania',
};

// Comprehensive ISO Alpha-2 to Alpha-3 mapping for all countries in ISO_TO_CONTINENT
export const ISO2_TO_ISO3: Record<string, string> = {
  // Europe
  AL: 'ALB', AD: 'AND', AT: 'AUT', BY: 'BLR', BE: 'BEL',
  BA: 'BIH', BG: 'BGR', HR: 'HRV', CY: 'CYP', CZ: 'CZE',
  DK: 'DNK', EE: 'EST', FI: 'FIN', FR: 'FRA', DE: 'DEU',
  GR: 'GRC', HU: 'HUN', IS: 'ISL', IE: 'IRL', IT: 'ITA',
  XK: 'XKX', LV: 'LVA', LI: 'LIE', LT: 'LTU', LU: 'LUX',
  MT: 'MLT', MD: 'MDA', MC: 'MCO', ME: 'MNE', NL: 'NLD',
  MK: 'MKD', NO: 'NOR', PL: 'POL', PT: 'PRT', RO: 'ROU',
  RU: 'RUS', SM: 'SMR', RS: 'SRB', SK: 'SVK', SI: 'SVN',
  ES: 'ESP', SE: 'SWE', CH: 'CHE', UA: 'UKR', GB: 'GBR',
  VA: 'VAT',

  // Asia
  AF: 'AFG', AM: 'ARM', AZ: 'AZE', BH: 'BHR', BD: 'BGD',
  BT: 'BTN', BN: 'BRN', KH: 'KHM', CN: 'CHN', GE: 'GEO',
  IN: 'IND', ID: 'IDN', IR: 'IRN', IQ: 'IRQ', IL: 'ISR',
  JP: 'JPN', JO: 'JOR', KZ: 'KAZ', KW: 'KWT', KG: 'KGZ',
  LA: 'LAO', LB: 'LBN', MY: 'MYS', MV: 'MDV', MN: 'MNG',
  MM: 'MMR', NP: 'NPL', KP: 'PRK', OM: 'OMN', PK: 'PAK',
  PS: 'PSE', PH: 'PHL', QA: 'QAT', SA: 'SAU', SG: 'SGP',
  KR: 'KOR', LK: 'LKA', SY: 'SYR', TW: 'TWN', TJ: 'TJK',
  TH: 'THA', TL: 'TLS', TR: 'TUR', TM: 'TKM', AE: 'ARE',
  UZ: 'UZB', VN: 'VNM', YE: 'YEM',

  // Africa
  DZ: 'DZA', AO: 'AGO', BJ: 'BEN', BW: 'BWA', BF: 'BFA',
  BI: 'BDI', CM: 'CMR', CV: 'CPV', CF: 'CAF', TD: 'TCD',
  KM: 'COM', CD: 'COD', CG: 'COG', CI: 'CIV', DJ: 'DJI',
  EG: 'EGY', GQ: 'GNQ', ER: 'ERI', ET: 'ETH', GA: 'GAB',
  GM: 'GMB', GH: 'GHA', GN: 'GIN', GW: 'GNB', KE: 'KEN',
  LS: 'LSO', LR: 'LBR', LY: 'LBY', MG: 'MDG', MW: 'MWI',
  ML: 'MLI', MR: 'MRT', MU: 'MUS', MA: 'MAR', MZ: 'MOZ',
  NA: 'NAM', NE: 'NER', NG: 'NGA', RW: 'RWA', ST: 'STP',
  SN: 'SEN', SC: 'SYC', SL: 'SLE', SO: 'SOM', ZA: 'ZAF',
  SS: 'SSD', SD: 'SDN', SZ: 'SWZ', TZ: 'TZA', TG: 'TGO',
  TN: 'TUN', UG: 'UGA', ZM: 'ZMB', ZW: 'ZWE',

  // North America
  AG: 'ATG', BS: 'BHS', BB: 'BRB', BZ: 'BLZ',
  CA: 'CAN', CR: 'CRI', CU: 'CUB', DM: 'DMA',
  DO: 'DOM', SV: 'SLV', GD: 'GRD', GT: 'GTM',
  HT: 'HTI', HN: 'HND', JM: 'JAM', MX: 'MEX',
  NI: 'NIC', PA: 'PAN', KN: 'KNA', LC: 'LCA',
  VC: 'VCT', TT: 'TTO', US: 'USA',

  // South America
  AR: 'ARG', BO: 'BOL', BR: 'BRA', CL: 'CHL',
  CO: 'COL', EC: 'ECU', GY: 'GUY', PY: 'PRY',
  PE: 'PER', SR: 'SUR', UY: 'URY', VE: 'VEN',

  // Oceania
  AU: 'AUS', FJ: 'FJI', KI: 'KIR', MH: 'MHL',
  FM: 'FSM', NR: 'NRU', NZ: 'NZL', PW: 'PLW',
  PG: 'PNG', WS: 'WSM', SB: 'SLB', TO: 'TON',
  TV: 'TUV', VU: 'VUT',
};

export function getIso3(iso2: string): string {
  return ISO2_TO_ISO3[iso2] || iso2;
}

export function getCountriesByContinent(continent: ContinentName): CountryInfo[] {
  return COUNTRIES.filter(c => c.continent === continent);
}

export function getContinentBounds(continent: ContinentName): [[number, number], [number, number]] | null {
  return CONTINENTS.find(c => c.name === continent)?.bounds || null;
}

export function getCountryBounds(code: string): [[number, number], [number, number]] | null {
  return COUNTRIES.find(c => c.code === code)?.bounds || null;
}
