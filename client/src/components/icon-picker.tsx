import { useState, useEffect } from "react";
import {
  Trophy, Flag, Zap, Star, Crown, Target, Award, Flame,
  Rocket, Shield, Medal, Timer, Gauge, Car, CircleDot, Sparkles,
  Lightbulb, Heart, Diamond, Hexagon, Triangle, Square, Circle, Dice1,
  Bolt, Compass, Crosshair, Globe, Mountain, Anchor, Map, Navigation,
  Wind, Tornado, Sun, Moon, CloudRain, Snowflake, TreePine, Leaf,
  Bird, Fish, Bug, Cat, Dog, Rabbit, Skull, Ghost,
  Swords, Gem, Crown as CrownIcon, Bomb, Axe, Sword, Wand2, Scroll,
  Music, Headphones, Camera, Film, Tv, Radio, Gamepad2, Joystick,
  Dumbbell, Bike, Footprints, Ticket, Gift, PartyPopper, Cake, Coffee,
  Pizza, Apple, Cherry, Grape, Banana, Carrot, Cookie, IceCream,
  Palette, Brush, PenTool, Pencil, Eraser, Ruler, Scissors, Paperclip,
  Book, Bookmark, Library, GraduationCap, School, Building, Building2, Castle,
  Factory, Landmark, Church, Home, Warehouse, Store, Hotel, Hospital,
  Plane, Ship, Train, Bus, Truck, Tractor, Ambulance, Bike as Bicycle
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
  // Racing & Competition (12)
  { name: "Trophy", icon: Trophy },
  { name: "Flag", icon: Flag },
  { name: "Medal", icon: Medal },
  { name: "Award", icon: Award },
  { name: "Crown", icon: Crown },
  { name: "Star", icon: Star },
  { name: "Target", icon: Target },
  { name: "Crosshair", icon: Crosshair },
  { name: "Ticket", icon: Ticket },
  { name: "Gift", icon: Gift },
  { name: "PartyPopper", icon: PartyPopper },
  { name: "Gem", icon: Gem },
  
  // Speed & Vehicles (14)
  { name: "Car", icon: Car },
  { name: "Gauge", icon: Gauge },
  { name: "Timer", icon: Timer },
  { name: "Zap", icon: Zap },
  { name: "Bolt", icon: Bolt },
  { name: "Flame", icon: Flame },
  { name: "Rocket", icon: Rocket },
  { name: "Wind", icon: Wind },
  { name: "Tornado", icon: Tornado },
  { name: "Plane", icon: Plane },
  { name: "Ship", icon: Ship },
  { name: "Train", icon: Train },
  { name: "Bus", icon: Bus },
  { name: "Truck", icon: Truck },
  
  // Shapes & Symbols (14)
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
  { name: "Bomb", icon: Bomb },
  
  // Fantasy & Gaming (10)
  { name: "Swords", icon: Swords },
  { name: "Sword", icon: Sword },
  { name: "Axe", icon: Axe },
  { name: "Wand2", icon: Wand2 },
  { name: "Scroll", icon: Scroll },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Joystick", icon: Joystick },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Bike", icon: Bike },
  { name: "Footprints", icon: Footprints },
  
  // Navigation & Exploration (8)
  { name: "Compass", icon: Compass },
  { name: "Globe", icon: Globe },
  { name: "Mountain", icon: Mountain },
  { name: "Anchor", icon: Anchor },
  { name: "Map", icon: Map },
  { name: "Navigation", icon: Navigation },
  { name: "Tractor", icon: Tractor },
  { name: "Ambulance", icon: Ambulance },
  
  // Nature & Weather (10)
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "CloudRain", icon: CloudRain },
  { name: "Snowflake", icon: Snowflake },
  { name: "TreePine", icon: TreePine },
  { name: "Leaf", icon: Leaf },
  { name: "Apple", icon: Apple },
  { name: "Cherry", icon: Cherry },
  { name: "Grape", icon: Grape },
  { name: "Carrot", icon: Carrot },
  
  // Animals (6)
  { name: "Bird", icon: Bird },
  { name: "Fish", icon: Fish },
  { name: "Bug", icon: Bug },
  { name: "Cat", icon: Cat },
  { name: "Dog", icon: Dog },
  { name: "Rabbit", icon: Rabbit },
  
  // Media & Entertainment (8)
  { name: "Music", icon: Music },
  { name: "Headphones", icon: Headphones },
  { name: "Camera", icon: Camera },
  { name: "Film", icon: Film },
  { name: "Tv", icon: Tv },
  { name: "Radio", icon: Radio },
  { name: "Cake", icon: Cake },
  { name: "Coffee", icon: Coffee },
  
  // Tools & Creative (10)
  { name: "Palette", icon: Palette },
  { name: "Brush", icon: Brush },
  { name: "PenTool", icon: PenTool },
  { name: "Pencil", icon: Pencil },
  { name: "Eraser", icon: Eraser },
  { name: "Ruler", icon: Ruler },
  { name: "Scissors", icon: Scissors },
  { name: "Paperclip", icon: Paperclip },
  { name: "Pizza", icon: Pizza },
  { name: "Cookie", icon: Cookie },
  
  // Buildings & Places (8)
  { name: "Book", icon: Book },
  { name: "Bookmark", icon: Bookmark },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Building", icon: Building },
  { name: "Castle", icon: Castle },
  { name: "Factory", icon: Factory },
  { name: "Landmark", icon: Landmark },
  { name: "Home", icon: Home },
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
            <ScrollArea className="h-56">
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
