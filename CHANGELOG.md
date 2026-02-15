# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Per-country merge strategy for continental/world subdivision views:
  - **blob** (MT, XK, LU, CY, SI, ME, MD, MK, AD, LI, MC, SM, VA): single clickable feature, no subdivisions
  - **region** (IT, FR, ES, BE, PT, GB, IE, HU, LV): group by Natural Earth `region`, dissolve shared-region subdivisions (e.g. UK London boroughs → 1 feature)
  - **none** (DE, PL, DK, SE, NO, UA, CZ, SK, HR, RS, GR, RO, BG, AL, AT, LT, EE, BY, RU, and all unlisted): keep individual subdivisions as-is after scalerank filter
- Merged regions use `@turf/union` to dissolve polygons into clean outlines — no internal ADM3 borders
- Country-level views (geoBoundaries) are unaffected

### Added
- Dev-only debug panel (bottom-left overlay) showing total feature count and per-country breakdown, collapsible, only visible in development mode
- Tests for region merging (6 tests) and DebugPanel component (4 tests) — total: 131 tests

### Fixed (previous)
- Filter out tiny subdivisions at continental/world scope using Natural Earth `scalerank` property (threshold: 9)
- Countries where all subdivisions are scalerank 10 were merged into a single clickable country-level MultiPolygon (now improved with region-based merging above)

### Added
- Restore map context on load: saving a map now persists scope, detail level, and admin level alongside travel data
- Loading a saved map navigates back to the exact scope and admin level it was created with
- Scope label displayed on saved map entries (e.g. "Greece ADM2", "World", "Europe")
- Backward compatible: old saved maps without scope fields still load correctly
- Tests for context persistence in useTravelMaps hook, scope label in SaveLoadControls

### Added (previous)
- Export map as image feature: PNG, JPEG, and SVG download from the sidebar
- Map automatically centers to current scope before export capture
- `ExportControls` component with format buttons in the sidebar
- `exportMapAsImage` utility using `html-to-image` library
- `mapRef` prop on `TravelMap` for DOM capture
- `mapInstanceRef` prop on `TravelMap` to expose Leaflet map instance for centering
- Tests for export utility (6 tests) and ExportControls component (9 tests)
- App test verifying ExportControls renders on map page

### Fixed
- Race condition in useGeoData: rapid admin level/detail level switches caused stale responses to overwrite the correct data, making buttons appear to "rotate". Fixed with cancellation flag on unmount/re-render
- Load map not applying styles: GeoJSON layers now imperatively re-style when `travelData` changes (e.g. on load), using a ref + `useEffect` instead of relying on mouse events

### Added (previous)
- Admin level selector for country view: users can toggle between ADM1 (Regions), ADM2 (Counties), and ADM3 (Sub-counties)
- `AdminLevel` type (`'ADM1' | 'ADM2' | 'ADM3'`) in types
- Admin level toggle buttons in `TravelControls` sidebar (visible only for country scope)
- `adminLevel` state in App with reset on scope change and toast on level change
- Tests for admin level toggle visibility and click behavior

### Changed
- `useGeoData` hook now accepts explicit `adminLevel` parameter instead of auto-detecting from country config
- `fetchCountrySubdivisions` accepts admin level parameter
- Each admin level gets its own cache key for instant toggling
- Switching admin level clears travel data (subdivision codes differ per level)

### Removed
- `preferredAdminLevel` field from `CountryInfo` interface
- `getPreferredAdminLevel()` function (replaced by user-controlled toggle)
- Hardcoded ADM2 override for UK

### Fixed
- geoBoundaries API calls now use ISO Alpha-3 codes (e.g. `FRA`) instead of Alpha-2 (`FR`), fixing 404 errors on all country subdivision fetches
- CORS error on geoBoundaries GeoJSON download: rewrite `github.com/raw/` URLs to `raw.githubusercontent.com` to avoid 302 redirect with invalid CORS header

### Added (previous)
- ISO Alpha-2 to Alpha-3 mapping (`ISO2_TO_ISO3`) covering all countries
- `iso3Code` field on `CountryInfo` interface
- Helper function `getIso3()`
- Tests verifying ISO3 conversion

### Added (previous)
- Landing page with scope selection (World / Continent / Country)
- `LandingPage` component with tabbed interface, continent dropdown, searchable country dropdown
- `useGeoData` hook supporting all scope/detail level combinations
- `featureProperties` utility for normalizing GeoJSON property names across data sources
- `geography.ts` static data module with continent/country bounds and ISO-to-continent mapping
- `MapBoundsController` sub-component for auto-zoom on scope changes
- `MapScope`, `DetailLevel`, `ContinentName` types
- New test suites: LandingPage (12 tests), useGeoData (8 tests), featureProperties (13 tests)
- geoBoundaries API integration for country-level subdivision data
- Natural Earth admin-1 data source for world/continent subdivision view

### Changed
- Replaced OpenStreetMap tiles with CartoDB Positron no-labels for cleaner appearance
- Fixed country click bug caused by GeoJSON key including `JSON.stringify(travelData)` (caused unmount/remount on every click)
- Removed `e.originalEvent.preventDefault()` that was swallowing clicks
- Deduplicated France features in GeoJSON pre-processing (eliminates `clickedFrance` hack)
- Stabilized GeoJSON callbacks using refs instead of recreating on every render
- Converted `TravelControls` from `viewMode`/`onViewModeChange` to `scope`/`detailLevel`/`onDetailLevelChange`
- Detail level toggle is now hidden for country scope (always subdivisions)
- Converted `useCountryData` to thin wrapper around `useGeoData`
- App now has landing/map page routing with scope-based state management
- Travel data is independent per scope (cleared on scope change)
- Full rewrite of DESIGN.md
- Updated all existing tests (App, TravelControls, useCountryData) for new API
- Total test count: 81 tests across 8 files (up from 54)

### Added (previous)
- Toast notification system for user feedback on save/load/delete actions
- Loading spinner component for improved loading UX
- Vercel deployment configuration

### Added (previous)
- Comprehensive test suite following TDD methodology
- Unit tests for all React components using Vitest + React Testing Library
  - App component tests covering state management and user interactions
  - TravelControls component tests for UI controls and travel status selection
  - SaveLoadControls component tests for form handling and map persistence
- Unit tests for custom hooks
  - useTravelMaps hook tests for localStorage operations and data persistence
  - useCountryData hook tests for API data fetching and error handling
- End-to-end tests using Playwright
  - Core application workflow tests
  - Map interaction and user journey tests
  - Cross-browser compatibility testing setup
- Test configuration and infrastructure
  - Vitest configuration with jsdom environment
  - Playwright configuration for cross-browser testing
  - Comprehensive mocking for Leaflet and external dependencies
  - Test setup with proper React Testing Library integration
- Test scripts in package.json
  - `npm test` - Run unit tests
  - `npm run test:watch` - Run tests in watch mode
  - `npm run test:coverage` - Run tests with coverage report
  - `npm run test:e2e` - Run end-to-end tests
  - `npm run test:all` - Run all tests sequentially

### Changed
- Enhanced development workflow with comprehensive testing capabilities
- Improved code reliability through extensive test coverage

### Technical Details
- 46 passing unit tests with 100% pass rate
- Tests cover all major components, hooks, and user workflows
- Proper async testing patterns for data fetching operations
- Mock implementations for complex external dependencies (Leaflet maps)
- Test-driven development approach ensuring code quality and maintainability