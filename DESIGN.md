# Travel Maps — Design Document

## Product Vision

Travel Maps is a web application for creating and sharing personal travel maps. Users select a geographic scope (world, continent, or country), then interactively mark locations with travel statuses (visited, lived, from, current). The app runs entirely client-side with localStorage persistence.

## User Flow

```
Landing Page → Scope Selection → Map View → Mark Locations → Save/Load
```

### 1. Landing Page
- Full-screen centered card on a light background
- Title: "Travel Maps" with subtitle
- Three tabs: **World** | **Continent** | **Country**
- World: no additional input, explore immediately
- Continent: dropdown of 7 continents
- Country: searchable dropdown grouped by continent
- "Explore" button confirms selection

### 2. Map View
- Full-width interactive map (left) + control sidebar (right, 300px)
- Back button returns to landing page (clears data for scope independence)
- Scope label displayed above controls
- CartoDB Positron no-labels tile layer for minimal, clean appearance

### 3. Interaction Model
- Click a geographic feature to apply the currently selected travel status
- Click again with the same status to remove it (toggle behavior)
- Click with a different status to update
- Hover shows tooltip with feature name
- Debounced clicks (100ms) prevent double-fires

## Scope Selection Logic

| Scope | Default Detail Level | Detail Toggle | Auto-Zoom |
|-------|---------------------|---------------|-----------|
| World | Countries | Yes (countries / subdivisions) | No (default view) |
| Continent | Countries | Yes (countries / subdivisions) | Yes (continent bounds) |
| Country | Subdivisions (forced) | Hidden | Yes (country bounds) |

### Data Independence
Each scope starts with a fresh, empty travel data set. Navigating back to the landing page clears all data. Saved maps persist in localStorage independently.

## Visual Design

### Map Tiles
- **CartoDB Positron No-Labels**: `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png`
- Chosen for minimal visual noise — lets colored travel data stand out

### Color Palette
| Status | Color | Hex |
|--------|-------|-----|
| Not visited | Light gray | `#e8e8e8` |
| Visited | Green | `#22C55E` |
| Lived there | Blue | `#3B82F6` |
| From here | Amber | `#F59E0B` |
| Live here now | Red | `#EF4444` |

### Feature Styling
- Unvisited: thin border (0.5px), low opacity (0.15 fill)
- Marked: thicker border (1px), higher opacity (0.7 fill)
- Hover: weight 2, full border opacity, slightly increased fill

### Landing Page
- Background: `#f0f2f5`
- Card: white, 16px border-radius, subtle shadow
- Primary color: `#1a1a2e` (dark navy)
- Tab row with active state highlighting

## Component Architecture

```
App
├── LandingPage                    (scope selection)
│   ├── Tab row (World/Continent/Country)
│   ├── Continent dropdown
│   ├── Country search + grouped dropdown
│   └── Explore button
│
├── Map View (when scope selected)
│   ├── TravelMap                  (Leaflet map + GeoJSON)
│   │   ├── MapBoundsController    (auto-zoom on scope change)
│   │   ├── TileLayer              (CartoDB Positron)
│   │   └── GeoJSON                (processed, deduplicated features)
│   │
│   ├── TravelControls             (sidebar)
│   │   ├── Back button
│   │   ├── Detail level toggle    (hidden for country scope)
│   │   ├── Status selector
│   │   ├── Statistics
│   │   └── Clear all
│   │
│   └── SaveLoadControls           (save/load/delete maps)
│
└── ToastContainer                 (notifications)
```

## Data Sources

| Scope | Detail | Source |
|-------|--------|--------|
| World | Countries | holtzy world.geojson (with fallbacks) |
| World | Subdivisions | Natural Earth admin-1 provinces |
| Continent | Countries | World GeoJSON filtered by ISO-to-continent mapping |
| Continent | Subdivisions | Natural Earth admin-1 filtered by continent |
| Country | Subdivisions | geoBoundaries API (2-step: metadata → GeoJSON) |

### Feature Property Normalization
Different sources use different property names. The `extractFeatureIdentifiers` utility normalizes across:
- holtzy: `NAME`, `ISO3166-1-Alpha-2`
- Natural Earth: `name`, `iso_a2`, `iso_3166_2`
- geoBoundaries: `shapeName`, `shapeISO`, `shapeGroup`

## Key Types

```typescript
type MapScope =
  | { type: 'world' }
  | { type: 'continent'; continent: ContinentName }
  | { type: 'country'; countryCode: string; countryName: string };

type DetailLevel = 'countries' | 'subdivisions';
type ContinentName = 'Europe' | 'Asia' | 'Africa' | 'North America' | 'South America' | 'Oceania' | 'Antarctica';
```

## Caching Strategy
- In-memory `Map<string, GeoJSON>` keyed by scope+detailLevel
- Avoids re-fetching when toggling detail level or re-entering a scope
- Cache persists for the session (cleared on page reload)

## Product Roadmap

### Phase 1 — Anonymous Map Creation (MVP for launch)
Core principle: **no account required to create and share a map.**

- User creates a map, paints countries/regions → gets a **shareable link** (e.g. `mytravelmap.io/m/abc123`)
- Map data stored in self-hosted backend (Node + PostgreSQL)
- Each map gets a unique slug/ID, no auth needed to create
- Exported images include the **mytravelmap.io logo** as a watermark (bottom corner)
- Landing page redesign to reflect the brand

### Phase 2 — Branding & Monetization

#### Logo
- Need a logo for the site and for watermarking exported images
- Should work at small sizes (favicon, watermark corner) and large (landing page)
- Travel + map motif — consider: stylized globe, pin, compass, brush stroke

#### Ads
- Small, non-intrusive ads — sidebar below controls or banner below map
- Consider: Google AdSense, Carbon Ads (developer-friendly, cleaner), or ethical ad networks
- No full-screen interstitials, no popups — keep UX clean
- Ad-free for logged-in users (future upsell?)

### Phase 3 — Optional Accounts

#### Privacy-first approach
- Accounts are **optional**, never required
- Login via OAuth only (Google, GitHub, Apple) — **no email/password stored by us**
- Logged-in users can:
  - Claim anonymous maps they created (link to their profile)
  - Have a profile page: `mytravelmap.io/u/nick`
  - Manage multiple maps
  - Edit maps after creation (anonymous maps are immutable after share?)
- **No email exposure** — no public email anywhere, no email-based login

#### Data model sketch
```
users
  id, oauth_provider, oauth_id, display_name, created_at

maps
  id, slug, user_id (nullable), title, scope, detail_level, admin_level,
  travel_data (jsonb), status_config (jsonb), forked_from (nullable, maps.id),
  last_viewed_at, created_at, updated_at

-- status_config example:
-- [
--   { "key": "visited", "label": "Visited", "color": "#22C55E" },
--   { "key": "lived",   "label": "Lived there", "color": "#3B82F6" },
--   { "key": "from",    "label": "From here", "color": "#F59E0B" },
--   { "key": "current", "label": "Live here now", "color": "#EF4444" },
--   { "key": "custom1", "label": "Want to visit", "color": "#8B5CF6" }
-- ]
-- travel_data references status keys, not hardcoded enum values
```

### Phase 4 — Custom Labels & Colors
- Users can **add more statuses** beyond the default 4 (e.g. add "Want to visit", "Transit", "Studied abroad")
- Users can rename any status label (e.g. "Visited" → "Backpacked")
- Users can pick custom colors per status
- No hard limit on number of statuses — but UI should encourage 4–8 for usability
- Presets: "Classic", "Pastel", "Dark mode", "Earthy"
- Settings saved per map (not global) so each map can have its own theme
- Default stays as current palette for anonymous/quick maps
- Forked maps inherit the parent's labels & colors

### Phase 5 — Print Service
- "Order a print" button on any map
- Options: poster size (A3, A2, A1), paper type (matte, glossy), frame (yes/no)
- Partnership model with print shops (Printful, Gelato, or local partners)
- Flow: user clicks print → preview with frame mockup → checkout → we send order to print API → shipped to user
- Revenue: markup on print cost
- Premium option: canvas print, framed, custom title text on the map

### Revenue Streams (summary)
1. **Ads** — small, non-intrusive, on free tier
2. **Print orders** — margin on physical prints
3. **Premium tier** (future) — ad-free, custom domains, analytics, HD export, priority print

### Technical Requirements for Backend

#### Stack decision: Self-hosted
- **API**: Node.js (Express or Fastify) + TypeScript
- **Database**: PostgreSQL (maps as JSONB, efficient for travel data)
- **Hosting**: VPS (Hetzner, DigitalOcean, or similar)
- **Auth**: OAuth 2.0 (Google, GitHub, Apple) — no email/password
- **Storage**: Map data in Postgres, exported images in S3-compatible object storage

#### API endpoints (initial)
```
POST   /api/maps              — create anonymous map, returns slug
GET    /api/maps/:slug        — get map data (public)
PATCH  /api/maps/:slug        — update map (owner only, if logged in)
DELETE /api/maps/:slug        — delete map (owner only)
POST   /api/auth/login        — OAuth flow
GET    /api/users/me/maps     — list user's maps (authed)
POST   /api/maps/:slug/claim  — claim anonymous map to account
```

#### Migration path from localStorage
- Keep localStorage as offline fallback / draft mode
- "Share" button triggers first save to backend
- If logged in, auto-sync; if anonymous, map is public-read, write-once

### Decided Questions

#### Map expiry
Anonymous maps expire after **90 days of inactivity** (no views). Logged-in users' maps never expire. Show a warning banner at 60 days ("This map will be deleted in 30 days — create an account to keep it"). Each view resets the clock.

#### Map forking
Yes — when someone opens a shared map link, they see the map in **read-only view**. They can:
- **"Make a copy"** → creates a new independent map with its own slug, pre-filled with all the data from the original. They can edit, re-export, share — it's a completely separate map.
- **Or just view/export** the original without copying.

The original map/link is **never impacted** by forks. This also means:
- Shared links are stable and permanent (within expiry window)
- No edit conflicts — each person works on their own copy
- Fork chain is tracked (optional: "forked from /m/abc123")

The user can also choose: when they open their own previously shared map, do they want to **edit in place** or **fork it** as a new version? Default: edit in place for the owner, fork for everyone else.

#### Map embedding
Yes — provide an embed snippet (iframe) so travel bloggers and sites can embed their map. Example:
```html
<iframe src="https://mytravelmap.io/embed/abc123" width="800" height="500"></iframe>
```
- Embed view: map only, no sidebar, no controls, read-only
- Optional: small "Made with mytravelmap.io" link in corner (drives traffic)
- Could be a Phase 2/3 feature alongside sharing

#### Fork attribution
Yes — like GitHub forks. Forked maps show a small link: "Forked from [original map title]" pointing to the parent map. Builds community and discoverability. Attribution is visible on the map page, in embeds, and on profile pages.

#### Collaboration
Secondary feature (Phase 5+). Real-time collaboration (multiple people painting the same map) is complex (WebSockets, conflict resolution). Park it for later. For now, forking covers the "share and build on" use case well enough.

#### Mobile strategy
PWA first (Progressive Web App). A PWA makes the site installable on phone home screens, works offline (localStorage drafts), and avoids App Store overhead. Native apps only if traction demands it.

### Decided Questions (continued)

#### Rate limiting
Yes — enforce rate limits on anonymous map creation to prevent spam/abuse. Limits per IP (e.g. 10 maps/hour, 50 maps/day). Logged-in users get higher limits.

#### Map visibility
All maps are **unlisted** — shareable only by link, never in a public feed. There is no public directory or explore page. Maps are personal; they only have meaning to the creator. A discovery/social feed would only make sense if maps had richer content (stories, photos, recommendations) — that's a potential future pivot, not a current goal.

### Future Vision — Travel Social Maps (potential pivot)
If the product gains traction, there's a natural evolution into richer, shareable travel content. Maps could become the backbone of a travel social platform:
- Attach **photos** to marked regions (click France → see your Paris photos)
- Add **trip stories/notes** per country or region
- **Recommendations**: restaurants, hotels, activities pinned to locations
- **Trip itineraries**: ordered routes with dates, drawn on the map
- This would justify a public feed / explore page / following system
- Essentially: Instagram meets Google Maps meets travel blog, anchored by the painted map

This is a different product. Don't design for it now, but keep the data model extensible enough that maps could gain richer content later without a full rewrite.

### Decided Questions (continued)

#### Social preview cards (og:image)
Yes — when a map link is shared on Twitter/WhatsApp/iMessage, show a rich preview card with a thumbnail of the painted map. Implementation: generate a static PNG thumbnail server-side when a map is saved/updated, serve it via `og:image` meta tag. No full SSR needed — just dynamic meta tags from the API + pre-rendered thumbnails.

#### Custom map titles
Optional — users can give their map a title (e.g. "Nick's Europe 2024"). Shown on the shared page, in the social preview card, and in the user's map list. Defaults to "Untitled Map" if not set.

#### Watermark
Present on both exported images and the shared web view. Keep it tasteful:
- Small, semi-transparent logo + "mytravelmap.io" in the bottom-right corner of the map
- Light enough to not distract from the map content
- On exports: baked into the image
- On shared web view: CSS overlay (not part of the map data)
- On embeds (iframe): same overlay, doubles as a clickable link back to the site
