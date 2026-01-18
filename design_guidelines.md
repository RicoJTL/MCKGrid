# MCK Grid - Design Guidelines v3

## Design Approach: Modern Racing Data Platform

**Reference Inspiration**: F1 TV app + Gran Turismo Sport menus + Apple Sports app

**Core Principles**:
- Dark navy theme for motorsport atmosphere
- Green primary accent for energy and success states
- Light text on dark backgrounds for readability
- Data-dense but scannable championship layouts

---

## Color System

**Single Dark Theme**:
- Background: Deep navy (#000d29)
- Text: Light/off-white for readability
- Cards: Slightly lighter navy with subtle borders

**Primary Accent (Green)**:
- Primary: `#00cc66` - CTAs, buttons, success states, promotion zones, wins
- Dark Green: `#006633` - hover states, emphasis

**Secondary Accent (Blues)**:
- Accent: `#6666ff` (blue-purple) - highlights, tier badges, special elements
- Royal Blue: `#0033cc` - links, secondary actions

**Color Usage**:
- Backgrounds: Dark navy tones
- Text: Light/white (primary), gray-400 (secondary/muted)
- Borders: Subtle navy borders
- Cards: Slightly elevated navy with border
- Primary buttons: Green background with dark text
- Success/promotion zones: Green left border or background

**Special Treatments**:
- Position #1: Gold gradient badge
- Position #2: Silver gradient badge
- Position #3: Bronze gradient badge
- Promotion zone: Left border `#00cc66`
- Relegation zone: Left border red

---

## Typography System

**Font Stack**: Inter (via Google Fonts CDN)

**Hierarchy**:
- Page Titles: text-5xl font-black tracking-tight
- Section Headers: text-3xl font-bold
- Card Titles: text-xl font-semibold
- Stats: text-4xl font-black tabular-nums
- Body: text-base
- Labels: text-xs uppercase tracking-wider text-muted-foreground

---

## Layout & Spacing

**Spacing Scale**: Tailwind units of 4, 6, 8, 12, 16

**Container Strategy**:
- Dashboard: max-w-screen-2xl mx-auto px-6
- Sidebar: Dark navy, lighter text

**Grid Patterns**:
- Driver cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Standings table: Full-width with sticky header
- Stats dashboard: grid-cols-2 lg:grid-cols-4 gap-6

---

## Component Library

**Navigation**:
- Sidebar: Darker navy background with light text
- Active state: Green left border + subtle background tint

**Data Components**:
- Championship Table: Alternating rows, position badges, promotion/relegation borders
- Driver Cards: Avatar, driver info, stats grid, badges
- Stat Cards: Large number, label, trend arrow (green up, red down)

**Interactive Elements**:
- Primary Button: Green background with dark text
- Secondary Button: Blue or outline style
- Success states: Green accents

**Badge System**:
- Achievement badges: Rounded containers with icon + title
- Earned: Full color with green or blue accent
- Locked: Grayscale with lock icon

---

## Key Rules

1. **Always light text on dark backgrounds**
2. **Green is the primary action/success color**
3. **Blue-purple for special highlights and accents**
4. **Consistent dark navy throughout the app**
