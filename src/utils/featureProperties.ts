/**
 * Normalizes feature properties across different GeoJSON sources.
 * Sources: holtzy world.geojson, Natural Earth admin-1, geoBoundaries
 */

export interface FeatureIdentifiers {
  code: string;        // ISO Alpha-2 for countries, subdivision code for subdivisions
  name: string;        // Display name
  countryCode: string; // Parent country ISO Alpha-2 (same as code for countries)
  isSubdivision: boolean;
}

/**
 * Extract normalized identifiers from a GeoJSON feature.
 * Handles property name differences across data sources.
 */
export function extractFeatureIdentifiers(
  feature: any,
  isSubdivisionData: boolean
): FeatureIdentifiers | null {
  const props = feature.properties;
  if (!props) return null;

  if (isSubdivisionData) {
    return extractSubdivisionIdentifiers(props);
  }
  return extractCountryIdentifiers(props);
}

function extractCountryIdentifiers(props: any): FeatureIdentifiers | null {
  const code = props['ISO3166-1-Alpha-2']
    || props.ISO_A2
    || props.iso_a2
    || props.ISO
    || props.iso;

  const name = props.NAME
    || props.name
    || props.NAME_EN
    || props.name_en
    || props.ADMIN
    || props.admin;

  if (!code || code === '-99' || !name) return null;

  return {
    code,
    name,
    countryCode: code,
    isSubdivision: false,
  };
}

function extractSubdivisionIdentifiers(props: any): FeatureIdentifiers | null {
  // Natural Earth admin-1 properties
  const neCode = props.iso_3166_2 || props.code_hasc || props.adm1_code;
  const neName = props.name || props.NAME || props.name_en || props.NAME_EN;
  const neCountry = props.iso_a2 || props.ISO_A2 || props.adm0_a3?.substring(0, 2);

  // geoBoundaries properties
  const gbCode = props.shapeISO || props.shapeName;
  const gbName = props.shapeName || props.shapeGroup;
  const gbCountry = props.shapeGroup || props.ISO_A2;

  const code = neCode || gbCode;
  const name = neName || gbName;
  const countryCode = neCountry || gbCountry;

  if (!name) return null;

  return {
    code: code || `${countryCode}-${name.replace(/\s+/g, '_').toUpperCase()}`,
    name,
    countryCode: countryCode || '',
    isSubdivision: true,
  };
}

/**
 * Build a unique key for a feature, used for travel data lookup.
 */
export function getFeatureKey(identifiers: FeatureIdentifiers): string {
  if (identifiers.isSubdivision) {
    return `${identifiers.countryCode}-${identifiers.code}`;
  }
  return identifiers.code;
}
