# MCK Grid - Design Guidelines v3

## Design Approach: Modern Racing Data Platform

**Reference Inspiration**: F1 TV app + Gran Turismo Sport menus + Apple Sports app - combining sleek data visualization with motorsport energy and modern polish.

**Core Principles**:
- Performance dashboard aesthetic with vibrant green accent energy
- Proper contrast: dark text on light backgrounds, light text on dark backgrounds
- Data-dense but scannable championship layouts
- Visual hierarchy emphasizing competitive positioning

---

## Color System

**Primary Palette (Green Focus)**:
- Primary Green: `#00cc66` (vibrant green) - CTAs, active states, success, wins, promotion
- Dark Green: `#006633` - hover states, darker accents, emphasis

**Secondary Palette (Blues)**:
- Accent Blue: `#6666ff` (blue-purple) - highlights, tier badges, special accents
- Royal Blue: `#0033cc` - links, secondary actions, data points
- Deep Navy: `#000099` - sidebar backgrounds, dark mode base

**Contrast Rules (CRITICAL)**:
- Light mode: Light/white backgrounds with dark navy text
- Dark mode: Navy/dark backgrounds with light/white text
- Primary green buttons: Use dark text for accessibility compliance (≥4.5:1 contrast)
- Accent elements on bright colors must use dark foreground text

**Application Strategy**:

*Light Mode*:
- Backgrounds: White/light gray (#fafafa)
- Text: Dark navy (primary), gray-600 (secondary)
- Borders: Light gray
- Cards: White with subtle shadow
- Primary buttons: Green background with dark text
- Success/promotion: Green accents

*Dark Mode*:
- Backgrounds: Deep navy (#000d29 to #001a4d range)
- Text: Light (near-white primary, gray-400 secondary)
- Borders: Navy-700/800
- Cards: Dark navy with subtle border
- Primary buttons: Bright green with dark text
- Accents pop more against dark backgrounds

**Special Treatments**:
- Position #1: Gold gradient badge
- Position #2: Silver gradient badge
- Position #3: Bronze gradient badge
- Promotion zone: Left border `#00cc66`, 4px width
- Relegation zone: Left border red-500, 4px width
- Fastest lap: Badge with accent blue background

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
- Sidebar: Fixed dark navy, light text for contrast

**Grid Patterns**:
- Driver cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Standings table: Full-width with sticky header
- Stats dashboard: grid-cols-2 lg:grid-cols-4 gap-6 for metric cards

---

## Component Library

**Navigation**:
- Sidebar: Dark navy background, light text for maximum contrast
- Active state: Green left border + subtle background tint
- Hover states: Subtle elevation, no dramatic color shifts

**Data Components**:
- Championship Table: Alternating rows, position badges (1-3 special), promotion/relegation borders
- Driver Cards: Avatar circle, driver info, stats grid, badges
- Stat Cards: Large number, label, trend arrow (green up, red down)
- Race Results: Position badges, driver name, team, time/gap, points

**Interactive Elements**:
- Primary Button: bg-green with dark text (accessibility compliant)
- Secondary Button: Blue outline/background with appropriate text contrast
- Success states: Green accents throughout
- Focus rings: Green outline

**Badge System**:
- Achievement badges: Rounded containers with icon + title
- Earned: Full color with green or blue accent
- Locked: Grayscale opacity-40 with lock icon

---

## Key Rules

1. **Never use light text on light backgrounds**
2. **Never use dark text on dark backgrounds**
3. **Green buttons always have dark text**
4. **Sidebar is always dark with light text**
5. **Respect WCAG contrast ratios (≥4.5:1 for text)**
