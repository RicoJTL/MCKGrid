import { useState, useEffect } from "react";
import {
  Trophy, Flag, Zap, Star, Crown, Target, Award, Flame,
  Rocket, Shield, Medal, Timer, Gauge, Car, CircleDot, Sparkles,
  Lightbulb, Heart, Diamond, Hexagon, Triangle, Square, Circle, Dice1,
  Bolt, Compass, Crosshair, Globe, Mountain, Anchor, Map, Navigation,
  Wind, Tornado, Sun, Moon, CloudRain, Snowflake, TreePine, Leaf,
  Bird, Fish, Bug, Cat, Dog, Rabbit, Skull, Ghost
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AVAILABLE_ICONS = [
  // Racing & Competition
  { name: "Trophy", icon: Trophy },
  { name: "Flag", icon: Flag },
  { name: "Medal", icon: Medal },
  { name: "Award", icon: Award },
  { name: "Crown", icon: Crown },
  { name: "Star", icon: Star },
  { name: "Target", icon: Target },
  { name: "Crosshair", icon: Crosshair },
  
  // Speed & Energy
  { name: "Car", icon: Car },
  { name: "Gauge", icon: Gauge },
  { name: "Timer", icon: Timer },
  { name: "Zap", icon: Zap },
  { name: "Bolt", icon: Bolt },
  { name: "Flame", icon: Flame },
  { name: "Rocket", icon: Rocket },
  { name: "Wind", icon: Wind },
  { name: "Tornado", icon: Tornado },
  
  // Shapes & Symbols
  { name: "Shield", icon: Shield },
  { name: "CircleDot", icon: CircleDot },
  { name: "Sparkles", icon: Sparkles },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Heart", icon: Heart },
  { name: "Diamond", icon: Diamond },
  { name: "Hexagon", icon: Hexagon },
  { name: "Triangle", icon: Triangle },
  { name: "Square", icon: Square },
  { name: "Circle", icon: Circle },
  { name: "Dice1", icon: Dice1 },
  { name: "Skull", icon: Skull },
  { name: "Ghost", icon: Ghost },
  
  // Navigation & Exploration
  { name: "Compass", icon: Compass },
  { name: "Globe", icon: Globe },
  { name: "Mountain", icon: Mountain },
  { name: "Anchor", icon: Anchor },
  { name: "Map", icon: Map },
  { name: "Navigation", icon: Navigation },
  
  // Nature & Weather
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "CloudRain", icon: CloudRain },
  { name: "Snowflake", icon: Snowflake },
  { name: "TreePine", icon: TreePine },
  { name: "Leaf", icon: Leaf },
  
  // Animals
  { name: "Bird", icon: Bird },
  { name: "Fish", icon: Fish },
  { name: "Bug", icon: Bug },
  { name: "Cat", icon: Cat },
  { name: "Dog", icon: Dog },
  { name: "Rabbit", icon: Rabbit },
] as const;

export const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
  "#ffffff", // white
];

export function getIconComponent(iconName: string | null | undefined) {
  if (!iconName) return null;
  const found = AVAILABLE_ICONS.find(i => i.name === iconName);
  return found?.icon || null;
}

interface IconPickerProps {
  value: string | null | undefined;
  color: string | null | undefined;
  onChange: (iconName: string, color: string) => void;
}

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(value || "Trophy");
  const [selectedColor, setSelectedColor] = useState(color || "#3b82f6");

  // Sync internal state with props when they change
  useEffect(() => {
    setSelectedIcon(value || "Trophy");
  }, [value]);

  useEffect(() => {
    setSelectedColor(color || "#3b82f6");
  }, [color]);

  const CurrentIcon = getIconComponent(selectedIcon) || Trophy;

  const handleSave = () => {
    onChange(selectedIcon, selectedColor);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          data-testid="button-icon-picker"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${selectedColor}20` }}
          >
            <CurrentIcon className="w-5 h-5" style={{ color: selectedColor }} />
          </div>
          <span>Change Icon & Color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Select Icon ({AVAILABLE_ICONS.length} available)</Label>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-8 gap-2 pr-3">
                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover-elevate ${
                      selectedIcon === name
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-secondary/50"
                    }`}
                    data-testid={`icon-option-${name}`}
                    title={name}
                  >
                    <Icon className="w-4 h-4" style={{ color: selectedColor }} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Select Color</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === c ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  data-testid={`color-option-${c.replace("#", "")}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
                data-testid="input-custom-color"
              />
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
                data-testid="input-color-hex"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <div className="flex-1 text-sm text-muted-foreground">Preview:</div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${selectedColor}20` }}
            >
              <CurrentIcon className="w-6 h-6" style={{ color: selectedColor }} />
            </div>
            <Button onClick={handleSave} data-testid="button-save-icon">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
