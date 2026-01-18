# MCK Grid - Design Guidelines v2

## Design Approach: Modern Racing Data Platform

**Reference Inspiration**: F1 TV app + Gran Turismo Sport menus + Apple Sports app - combining sleek data visualization with motorsport energy and modern polish.

**Core Principles**:
- Performance dashboard aesthetic with vibrant accent energy
- Dual-mode design (light and dark) with consistent color psychology
- Data-dense but scannable championship layouts
- Visual hierarchy emphasizing competitive positioning

---

## Color System

**Primary Palette**:
- Primary Accent: `#6666ff` (vibrant blue-purple) - CTAs, active states, championship highlights
- Secondary Blue: `#0033cc` (royal blue) - links, secondary actions, data points
- Deep Navy: `#000099` (dark navy) - dark mode backgrounds, emphasis text, headers

**Success/Promotion States**:
- Bright Green: `#00cc66` - promotion zones, wins, positive trends, success badges
- Forest Green: `#006633` - darker green accents, hover states on success elements

**Application Strategy**:

*Light Mode*:
- Backgrounds: White/gray-50
- Text: gray-900 primary, gray-600 secondary
- Borders: gray-200/300
- Cards: white with subtle shadow
- Accent usage: Primary actions, position indicators (#1-3), active navigation
- Success green: Promotion zone borders, win indicators, achievement badges

*Dark Mode*:
- Backgrounds: `#000099` for main, gray-900 for cards
- Text: white primary, gray-300 secondary  
- Borders: gray-700/800
- Cards: gray-800/900 with border glow
- Accent usage: Amplified on interactive elements, position badges get gradient treatments
- Green accents pop more against dark backgrounds

**Special Treatments**:
- Position #1: Gold-to-`#6666ff` gradient badge
- Position #2-3: `#6666ff` solid badges  
- Promotion zone: Left border `#00cc66`, 4px width
- Relegation zone: Left border red-500, 4px width
- Fastest lap: Badge with `#6666ff` background

---

## Typography System

**Font Stack**: Inter (via Google Fonts CDN)

**Hierarchy**:
- Page Titles: text-5xl font-black tracking-tight
- Section Headers: text-3xl font-bold  
- Card Titles: text-xl font-semibold
- Championship Stats: text-4xl font-black tabular-nums
- Body: text-base
- Labels: text-xs uppercase tracking-wider text-muted-foreground

---

## Layout & Spacing

**Spacing Scale**: Tailwind units of 4, 6, 8, 12, 16

**Container Strategy**:
- Dashboard: max-w-screen-2xl mx-auto px-6
- Sidebar: Fixed 280px desktop, collapsible mobile overlay

**Grid Patterns**:
- Driver cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Standings table: Full-width with sticky header, position + driver + team + points columns
- Stats dashboard: grid-cols-2 lg:grid-cols-4 gap-6 for metric cards
- Race results: 2-column desktop split (main results table 8/12, race info sidebar 4/12)

---

## Component Library

**Navigation**:
- Top bar: Championship selector dropdown + user profile
- Sidebar: Icons + labels (Dashboard, Standings, Races, Drivers, Teams, Badges, Settings)
- Active state: `#6666ff` border-left-4 + background tint

**Data Components**:
- Championship Table: Striped rows (alternating background), position badges (1-3 special), tabular points, promotion/relegation borders
- Driver Cards: Avatar circle (120px), driver number badge overlay, name + team, stats grid (4 metrics: races/wins/podiums/points), earned badges row
- Stat Cards: Large number (text-4xl), label below, trend arrow with color (`#00cc66` up, red down), icon top-right
- Race Results: Position column with colored badges, driver name + flag icon, team, time/gap, fastest lap purple indicator, points bold

**Interactive Elements**:
- Primary Button: bg-`#6666ff` text-white with shadow
- Secondary Button: border-2 border-`#6666ff` text-`#6666ff`
- Success Button: bg-`#00cc66` for positive actions (confirm win, promote)
- Tabs: border-b-2 border-`#6666ff` for active
- Filters: Dropdown menus with `#0033cc` icons

**Badge System**:
- Achievement badges: Rounded-lg containers with icon + title
- Earned: Full color with `#6666ff` or `#00cc66` accent glow
- Locked: Grayscale opacity-40 with lock icon

**Progress Indicators**:
- Season goals: Progress bar with `#6666ff` fill, percentage + target label
- Race completion: Checkered flag icons with `#00cc66` on completion

---

## Images

**Hero Section**: 
- Full-width kart racing action (1920x600px), motion-blur background with sharp foreground kart
- Dark gradient overlay bottom-to-transparent
- Hero content: Championship name (text-5xl font-black), tagline, primary CTA button with blurred background (backdrop-blur-md bg-white/20 dark:bg-gray-900/40)

**Additional Images**:
- Track thumbnails: Race schedule cards (400x225px, 16:9)
- Driver avatars: Circular 120px (profile photos or helmet shots)
- Championship trophy: Season completion modals
- Background: Subtle carbon fiber texture overlay at 5% opacity for dashboard sections

**Placement**:
- Hero: Top of home/dashboard
- Track images: Race cards, race detail headers
- Driver photos: Leaderboard rows (60px avatars), profile pages (large), team rosters
- Trophy graphics: Winner announcements, season wrap banners

---

**Enhancement Details**:
- Position number badges: Circular with gradient (gold #1, silver #2, bronze #3, `#6666ff` 4+)
- Racing stripe accents: 2px `#6666ff` borders on championship leaders
- Grid pattern overlays: 2% opacity for section backgrounds
- Card hover states: Lift with shadow increase, border glow with `#6666ff` in dark mode