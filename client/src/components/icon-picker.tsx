import { useState, useEffect } from "react";
import {
  Trophy, Flag, Zap, Star, Crown, Target, Award, Flame,
  Rocket, Shield, Medal, Timer, Gauge, Car, CircleDot, Sparkles,
  Lightbulb, Heart, Diamond, Hexagon, Triangle, Square, Circle, Dice1,
  Bolt, Compass, Crosshair, Globe, Mountain, Anchor, Map, Navigation,
  Wind, Tornado, Sun, Moon, Snowflake, Skull, Ghost,
  Swords, Gem, Bomb, Wand2,
  Gamepad2, Joystick, Dumbbell, Bike, Footprints, Ticket,
  Fuel, Wrench, Settings, Cog, Clock, Watch, Hourglass, StopCircle,
  PlayCircle, FastForward, Rewind, SkipForward, SkipBack, RefreshCw,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Activity, BarChart3, LineChart, PieChart,
  Milestone, Route, MapPin, LocateFixed, Signpost, Construction,
  AlertTriangle, AlertCircle, CheckCircle, XCircle, Info, HelpCircle,
  Power, Battery, BatteryCharging, Plug, Wifi, Signal,
  Volume2, VolumeX, Mic, Radio, Headphones, Speaker,
  Eye, EyeOff, Focus, Scan, ScanLine, Maximize,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown,
  Minus, Plus, X, Check, Equal, Hash
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
  // Trophies & Awards (12)
  { name: "Trophy", icon: Trophy },
  { name: "Medal", icon: Medal },
  { name: "Award", icon: Award },
  { name: "Crown", icon: Crown },
  { name: "Star", icon: Star },
  { name: "Gem", icon: Gem },
  { name: "Diamond", icon: Diamond },
  { name: "Sparkles", icon: Sparkles },
  { name: "Ticket", icon: Ticket },
  { name: "Shield", icon: Shield },
  { name: "Target", icon: Target },
  { name: "Crosshair", icon: Crosshair },
  
  // Flags & Racing Signals (10)
  { name: "Flag", icon: Flag },
  { name: "Milestone", icon: Milestone },
  { name: "Signpost", icon: Signpost },
  { name: "AlertTriangle", icon: AlertTriangle },
  { name: "AlertCircle", icon: AlertCircle },
  { name: "CheckCircle", icon: CheckCircle },
  { name: "XCircle", icon: XCircle },
  { name: "StopCircle", icon: StopCircle },
  { name: "PlayCircle", icon: PlayCircle },
  { name: "Construction", icon: Construction },
  
  // Speed & Performance (14)
  { name: "Gauge", icon: Gauge },
  { name: "Zap", icon: Zap },
  { name: "Bolt", icon: Bolt },
  { name: "Flame", icon: Flame },
  { name: "Rocket", icon: Rocket },
  { name: "Wind", icon: Wind },
  { name: "Tornado", icon: Tornado },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "TrendingDown", icon: TrendingDown },
  { name: "Activity", icon: Activity },
  { name: "FastForward", icon: FastForward },
  { name: "Rewind", icon: Rewind },
  { name: "SkipForward", icon: SkipForward },
  { name: "SkipBack", icon: SkipBack },
  
  // Timing & Clocks (10)
  { name: "Timer", icon: Timer },
  { name: "Clock", icon: Clock },
  { name: "Watch", icon: Watch },
  { name: "Hourglass", icon: Hourglass },
  { name: "RefreshCw", icon: RefreshCw },
  { name: "ChevronsUp", icon: ChevronsUp },
  { name: "ChevronsDown", icon: ChevronsDown },
  { name: "ChevronUp", icon: ChevronUp },
  { name: "ChevronDown", icon: ChevronDown },
  { name: "Equal", icon: Equal },
  
  // Vehicles & Mechanics (12)
  { name: "Car", icon: Car },
  { name: "Bike", icon: Bike },
  { name: "Fuel", icon: Fuel },
  { name: "Wrench", icon: Wrench },
  { name: "Settings", icon: Settings },
  { name: "Cog", icon: Cog },
  { name: "Power", icon: Power },
  { name: "Battery", icon: Battery },
  { name: "BatteryCharging", icon: BatteryCharging },
  { name: "Plug", icon: Plug },
  { name: "Wifi", icon: Wifi },
  { name: "Signal", icon: Signal },
  
  // Navigation & Track (12)
  { name: "Compass", icon: Compass },
  { name: "Navigation", icon: Navigation },
  { name: "Map", icon: Map },
  { name: "MapPin", icon: MapPin },
  { name: "Route", icon: Route },
  { name: "LocateFixed", icon: LocateFixed },
  { name: "Globe", icon: Globe },
  { name: "ArrowUp", icon: ArrowUp },
  { name: "ArrowDown", icon: ArrowDown },
  { name: "ArrowLeft", icon: ArrowLeft },
  { name: "ArrowRight", icon: ArrowRight },
  { name: "ArrowUpRight", icon: ArrowUpRight },
  
  // Stats & Leaderboards (10)
  { name: "BarChart3", icon: BarChart3 },
  { name: "LineChart", icon: LineChart },
  { name: "PieChart", icon: PieChart },
  { name: "Hash", icon: Hash },
  { name: "Plus", icon: Plus },
  { name: "Minus", icon: Minus },
  { name: "X", icon: X },
  { name: "Check", icon: Check },
  { name: "Info", icon: Info },
  { name: "HelpCircle", icon: HelpCircle },
  
  // Focus & Vision (10)
  { name: "Eye", icon: Eye },
  { name: "EyeOff", icon: EyeOff },
  { name: "Focus", icon: Focus },
  { name: "Scan", icon: Scan },
  { name: "ScanLine", icon: ScanLine },
  { name: "Maximize", icon: Maximize },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Snowflake", icon: Snowflake },
  
  // Shapes & Symbols (10)
  { name: "CircleDot", icon: CircleDot },
  { name: "Circle", icon: Circle },
  { name: "Square", icon: Square },
  { name: "Triangle", icon: Triangle },
  { name: "Hexagon", icon: Hexagon },
  { name: "Heart", icon: Heart },
  { name: "Skull", icon: Skull },
  { name: "Ghost", icon: Ghost },
  { name: "Bomb", icon: Bomb },
  { name: "Dice1", icon: Dice1 },
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
  if (!iconName) return Trophy; // Default fallback
  const found = AVAILABLE_ICONS.find(i => i.name === iconName);
  return found?.icon || Trophy; // Default fallback
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
