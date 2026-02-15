import { describe, it, expect } from 'vitest'
import { extractFeatureIdentifiers, getFeatureKey } from './featureProperties'

describe('extractFeatureIdentifiers', () => {
  describe('country features', () => {
    it('extracts from holtzy world.geojson format', () => {
      const feature = {
        properties: {
          NAME: 'United States',
          'ISO3166-1-Alpha-2': 'US',
        },
      }

      const ids = extractFeatureIdentifiers(feature, false)
      expect(ids).toEqual({
        code: 'US',
        name: 'United States',
        countryCode: 'US',
        isSubdivision: false,
      })
    })

    it('extracts from Natural Earth format', () => {
      const feature = {
        properties: {
          NAME: 'Germany',
          ISO_A2: 'DE',
        },
      }

      const ids = extractFeatureIdentifiers(feature, false)
      expect(ids).toEqual({
        code: 'DE',
        name: 'Germany',
        countryCode: 'DE',
        isSubdivision: false,
      })
    })

    it('extracts using lowercase iso_a2', () => {
      const feature = {
        properties: {
          name: 'Japan',
          iso_a2: 'JP',
        },
      }

      const ids = extractFeatureIdentifiers(feature, false)
      expect(ids).toEqual({
        code: 'JP',
        name: 'Japan',
        countryCode: 'JP',
        isSubdivision: false,
      })
    })

    it('returns null for features with -99 code', () => {
      const feature = {
        properties: {
          NAME: 'Unknown',
          ISO_A2: '-99',
        },
      }

      expect(extractFeatureIdentifiers(feature, false)).toBeNull()
    })

    it('returns null for features without code', () => {
      const feature = {
        properties: {
          NAME: 'Some Place',
        },
      }

      expect(extractFeatureIdentifiers(feature, false)).toBeNull()
    })

    it('returns null for features without name', () => {
      const feature = {
        properties: {
          ISO_A2: 'XX',
        },
      }

      expect(extractFeatureIdentifiers(feature, false)).toBeNull()
    })

    it('returns null for features without properties', () => {
      const feature = {}
      expect(extractFeatureIdentifiers(feature, false)).toBeNull()
    })
  })

  describe('subdivision features', () => {
    it('extracts from Natural Earth admin-1 format', () => {
      const feature = {
        properties: {
          name: 'California',
          iso_3166_2: 'US-CA',
          iso_a2: 'US',
        },
      }

      const ids = extractFeatureIdentifiers(feature, true)
      expect(ids).toEqual({
        code: 'US-CA',
        name: 'California',
        countryCode: 'US',
        isSubdivision: true,
      })
    })

    it('extracts from geoBoundaries format', () => {
      const feature = {
        properties: {
          shapeName: 'Bavaria',
          shapeISO: 'DE-BY',
          shapeGroup: 'DE',
        },
      }

      const ids = extractFeatureIdentifiers(feature, true)
      expect(ids).toEqual({
        code: 'DE-BY',
        name: 'Bavaria',
        countryCode: 'DE',
        isSubdivision: true,
      })
    })

    it('generates code from name when no code available', () => {
      const feature = {
        properties: {
          name: 'Some Region',
          iso_a2: 'XX',
        },
      }

      const ids = extractFeatureIdentifiers(feature, true)
      expect(ids).not.toBeNull()
      expect(ids!.name).toBe('Some Region')
      expect(ids!.code).toContain('SOME_REGION')
      expect(ids!.isSubdivision).toBe(true)
    })

    it('returns null for features without name', () => {
      const feature = {
        properties: {
          iso_a2: 'US',
        },
      }

      expect(extractFeatureIdentifiers(feature, true)).toBeNull()
    })
  })
})

describe('getFeatureKey', () => {
  it('returns country code for country features', () => {
    const key = getFeatureKey({
      code: 'US',
      name: 'United States',
      countryCode: 'US',
      isSubdivision: false,
    })
    expect(key).toBe('US')
  })

  it('returns composite key for subdivision features', () => {
    const key = getFeatureKey({
      code: 'US-CA',
      name: 'California',
      countryCode: 'US',
      isSubdivision: true,
    })
    expect(key).toBe('US-US-CA')
  })
})
