import type { InsertDriverIcon } from "./schema";

export interface PredefinedIcon extends Omit<InsertDriverIcon, 'createdByProfileId'> {
  slug: string;
}

export const PREDEFINED_ICONS: PredefinedIcon[] = [
  {
    slug: "mck_champion_2021",
    name: "MCK Champion 2021",
    description: "MCK Champion 2021",
    iconName: "Crown",
    iconColor: "#ffd700",
  },
  {
    slug: "founding_driver",
    name: "Founding Driver",
    description: "Driver in the inaugural MCK League",
    iconName: "Star",
    iconColor: "#c0c0c0",
  },
];

export const PRESTIGIOUS_ICON_OPTIONS = [
  { name: "Crown", label: "Crown" },
  { name: "Star", label: "Star" },
  { name: "Medal", label: "Medal" },
  { name: "Trophy", label: "Trophy" },
  { name: "Shield", label: "Shield" },
  { name: "Gem", label: "Gem" },
  { name: "Sparkles", label: "Sparkles" },
  { name: "Flame", label: "Flame" },
  { name: "Zap", label: "Lightning" },
  { name: "Rocket", label: "Rocket" },
  { name: "Award", label: "Award" },
  { name: "BadgeCheck", label: "Verified" },
];

export const ICON_COLORS = [
  { value: "#ffd700", label: "Gold" },
  { value: "#c0c0c0", label: "Silver" },
  { value: "#cd7f32", label: "Bronze" },
  { value: "#e5e4e2", label: "Platinum" },
  { value: "#b9f2ff", label: "Diamond" },
  { value: "#50c878", label: "Emerald" },
  { value: "#e0115f", label: "Ruby" },
  { value: "#0f52ba", label: "Sapphire" },
  { value: "#9b59b6", label: "Amethyst" },
  { value: "#ff6b35", label: "Champion Orange" },
];
