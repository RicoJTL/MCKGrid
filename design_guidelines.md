# MCK Grid - Design Guidelines

## Design Approach: Racing/Motorsport Digital Experience

**Reference Inspiration**: F1 TV app, iRacing dashboard, Gran Turismo Sport menus - combining sleek data presentation with motorsport energy.

**Core Principles**:
- Performance dashboard aesthetic with competitive edge
- High-contrast dark theme with accent color energy bursts
- Data-dense but scannable layouts
- Championship prestige through visual hierarchy

---

## Typography System

**Font Stack**: 
- Headers: Inter Bold/Black (geometric, technical precision)
- Body: Inter Regular/Medium (optimal data readability)
- Numbers/Stats: Inter Tabular (monospaced figures for alignment)

**Hierarchy**:
- Page Titles: text-4xl/5xl font-black tracking-tight
- Section Headers: text-2xl/3xl font-bold
- Card Titles: text-lg/xl font-semibold
- Stats/Numbers: text-3xl/4xl font-black tabular-nums
- Body Text: text-sm/base
- Labels/Meta: text-xs/sm text-muted-foreground uppercase tracking-wide

---

## Layout & Spacing System

**Spacing Scale**: Tailwind units of 4, 6, 8, 12, 16 (p-4, gap-6, mb-8, py-12, mt-16)

**Container Strategy**:
- Dashboard layouts: max-w-screen-2xl mx-auto px-6
- Content sections: Flexible grid systems, never single-column on desktop
- Sidebar navigation: Fixed 240px-280px width on desktop, collapsible mobile

**Grid Patterns**:
- Championship standings: Full-width tables with sticky headers
- Driver cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Race results: Mixed 2-column desktop (results table + race info sidebar)
- Stats dashboard: 3-4 column metric cards (grid-cols-2 lg:grid-cols-4)

---

## Component Library

**Navigation**:
- Top bar: Championship/season selector + profile dropdown
- Sidebar: Collapsible with icons (Home, Standings, Races, Drivers, Settings)
- Active state: Border-left accent + background tint

**Data Display**:
- Championship Table: Striped rows, position indicators with colored badges (#1-3 special treatment), points in bold tabular
- Race Results Grid: Position, driver name with flag icon, team, fastest lap indicator (purple badge), points
- Driver Cards: Avatar + name + number, stats grid (races/wins/podiums/points), badge collection showcase
- Stat Cards: Large number + label + trend indicator (↑↓ with color)

**Interactive Elements**:
- Primary CTA: Full button with accent color, medium shadow
- Secondary: Outline button with border-accent
- Tabs: Underlined active state with accent border-b-2
- Filters/Sorting: Dropdown menus with icons

**Promotion/Relegation Indicators**:
- Green border-left for promotion zone positions
- Red border-left for relegation zone
- Visual separators between zones in standings tables

**Badges System**:
- Achievement badges: Icon + title in rounded containers (pole position, fastest lap, clean race, champion)
- Earned badges: Full color accent
- Locked badges: Grayscale with lock icon overlay

**Season Goals**:
- Progress bars with percentage + target (e.g., "15/20 races completed")
- Goal cards: Icon + description + status indicator
- Completion celebration visual treatment (glow effect on completed goals)

---

## Images

**Hero Section**: 
- Full-width dynamic racing imagery (1920x600px)
- Kart racing action shot - preferably motion blur background with sharp foreground kart
- Overlay: Gradient from bottom (dark) to transparent
- Hero content: Centered or left-aligned with current championship name, tagline, and blurred-background primary CTA button

**Additional Images**:
- Track thumbnails for race cards (400x225px, 16:9 ratio)
- Driver avatars: Circular 80px-120px (profile photos or helmet shots)
- Championship trophy/podium imagery for season completion states
- Background texture: Subtle carbon fiber or track tarmac pattern at 5-10% opacity for dashboard sections

**Placement Strategy**:
- Hero: Top of dashboard/home page
- Track images: Race schedule cards and individual race detail headers
- Driver photos: Profile pages, leaderboard rows (small avatars), team rosters
- Trophy/achievement graphics: Season wrap-up modals, championship winner announcements

---

**Visual Enhancement Notes**:
- Use subtle racing stripe accents (2px borders) on championship leaders
- Implement position number badges (1st, 2nd, 3rd) with metallic gradient treatments (gold/silver/bronze)
- Add checkered flag iconography sparingly for race completion indicators
- Grid pattern overlays for section backgrounds (very subtle, 2-3% opacity)