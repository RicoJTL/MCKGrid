import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trophy, Flag, Zap, Star, Crown, Target, Award, Flame,
  Rocket, Shield, Medal, Timer, Gauge, Car, CircleDot, Sparkles,
  Lightbulb, Heart, Diamond, Hexagon, Triangle, Square, Circle, Dice1,
  Compass, Crosshair, Globe, Mountain, Anchor, Map, Navigation,
  Wind, Tornado, Sun, Moon, Snowflake, Skull, Ghost,
  Swords, Gem, Bomb, Wand2, Gamepad2, Joystick, Dumbbell, Bike,
  Footprints, Ticket, Fuel, Wrench, Settings, Cog, Clock, Watch,
  Hourglass, StopCircle, PlayCircle, FastForward, TrendingUp,
  Activity, BarChart3, MapPin, AlertTriangle, CheckCircle, Power,
  Battery, Eye, Mic, Headphones, Speaker
} from "lucide-react";

const PRESTIGE_ICONS = [
  { name: "Crown", icon: Crown, category: "Royalty" },
  { name: "Trophy", icon: Trophy, category: "Awards" },
  { name: "Medal", icon: Medal, category: "Awards" },
  { name: "Award", icon: Award, category: "Awards" },
  { name: "Star", icon: Star, category: "Celestial" },
  { name: "Gem", icon: Gem, category: "Rare" },
  { name: "Diamond", icon: Diamond, category: "Rare" },
  { name: "Sparkles", icon: Sparkles, category: "Effects" },
  { name: "Shield", icon: Shield, category: "Protection" },
  { name: "Swords", icon: Swords, category: "Combat" },
  { name: "Target", icon: Target, category: "Precision" },
  { name: "Crosshair", icon: Crosshair, category: "Precision" },
  { name: "Flame", icon: Flame, category: "Elements" },
  { name: "Zap", icon: Zap, category: "Energy" },
  { name: "Rocket", icon: Rocket, category: "Speed" },
  { name: "Gauge", icon: Gauge, category: "Speed" },
  { name: "Wind", icon: Wind, category: "Elements" },
  { name: "Tornado", icon: Tornado, category: "Elements" },
  { name: "Sun", icon: Sun, category: "Celestial" },
  { name: "Moon", icon: Moon, category: "Celestial" },
  { name: "Snowflake", icon: Snowflake, category: "Elements" },
  { name: "Skull", icon: Skull, category: "Dark" },
  { name: "Ghost", icon: Ghost, category: "Dark" },
  { name: "Heart", icon: Heart, category: "Love" },
  { name: "Bomb", icon: Bomb, category: "Combat" },
  { name: "Wand2", icon: Wand2, category: "Magic" },
  { name: "Timer", icon: Timer, category: "Time" },
  { name: "Clock", icon: Clock, category: "Time" },
  { name: "Hourglass", icon: Hourglass, category: "Time" },
  { name: "Car", icon: Car, category: "Racing" },
  { name: "Flag", icon: Flag, category: "Racing" },
  { name: "Fuel", icon: Fuel, category: "Racing" },
  { name: "Wrench", icon: Wrench, category: "Racing" },
  { name: "Gamepad2", icon: Gamepad2, category: "Gaming" },
  { name: "Joystick", icon: Joystick, category: "Gaming" },
  { name: "Dice1", icon: Dice1, category: "Gaming" },
  { name: "Mountain", icon: Mountain, category: "Nature" },
  { name: "Globe", icon: Globe, category: "World" },
  { name: "Compass", icon: Compass, category: "Navigation" },
  { name: "Anchor", icon: Anchor, category: "Navigation" },
  { name: "MapPin", icon: MapPin, category: "Navigation" },
  { name: "TrendingUp", icon: TrendingUp, category: "Stats" },
  { name: "Activity", icon: Activity, category: "Stats" },
  { name: "BarChart3", icon: BarChart3, category: "Stats" },
  { name: "Power", icon: Power, category: "Energy" },
  { name: "Battery", icon: Battery, category: "Energy" },
  { name: "Eye", icon: Eye, category: "Vision" },
  { name: "Lightbulb", icon: Lightbulb, category: "Ideas" },
];

const PRESTIGE_COLORS = [
  { name: "Gold", color: "#fbbf24", gradient: "from-yellow-400 to-amber-600" },
  { name: "Platinum", color: "#94a3b8", gradient: "from-slate-300 to-slate-500" },
  { name: "Ruby", color: "#ef4444", gradient: "from-red-400 to-red-700" },
  { name: "Emerald", color: "#10b981", gradient: "from-emerald-400 to-emerald-700" },
  { name: "Sapphire", color: "#3b82f6", gradient: "from-blue-400 to-blue-700" },
  { name: "Amethyst", color: "#a855f7", gradient: "from-purple-400 to-purple-700" },
  { name: "Diamond", color: "#22d3ee", gradient: "from-cyan-300 to-cyan-600" },
  { name: "Onyx", color: "#1e1e1e", gradient: "from-gray-600 to-gray-900" },
  { name: "Rose Gold", color: "#f472b6", gradient: "from-pink-300 to-pink-600" },
  { name: "Bronze", color: "#cd7f32", gradient: "from-orange-400 to-amber-700" },
];

interface PrestigeIconPickerProps {
  value: { iconName: string; iconColor: string };
  onChange: (value: { iconName: string; iconColor: string }) => void;
  triggerLabel?: string;
}

export function PrestigeIconPicker({ value, onChange, triggerLabel = "Select Icon" }: PrestigeIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(value.iconName);
  const [selectedColor, setSelectedColor] = useState(value.iconColor);
  const [customColor, setCustomColor] = useState(value.iconColor);

  const SelectedIconComponent = PRESTIGE_ICONS.find(i => i.name === selectedIcon)?.icon || Star;
  const PreviewIcon = PRESTIGE_ICONS.find(i => i.name === value.iconName)?.icon || Star;

  const handleSave = () => {
    onChange({ iconName: selectedIcon, iconColor: selectedColor });
    setOpen(false);
  };

  const categories = Array.from(new Set(PRESTIGE_ICONS.map(i => i.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-14 px-4"
          data-testid="button-prestige-icon-picker"
        >
          <span 
            className="w-10 h-10 rounded-xl flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${value.iconColor}40 0%, ${value.iconColor}20 100%)`,
              boxShadow: `0 4px 12px ${value.iconColor}40, inset 0 1px 2px rgba(255,255,255,0.3)`,
              border: `1px solid ${value.iconColor}50`,
            }}
          >
            <span
              className="absolute inset-0 rounded-xl opacity-50 blur-sm animate-pulse"
              style={{ background: `radial-gradient(circle, ${value.iconColor}60 0%, transparent 70%)` }}
            />
            <PreviewIcon className="w-5 h-5 relative z-10" style={{ color: value.iconColor }} />
          </span>
          <span className="flex-1 text-left">
            {value.iconName ? `${value.iconName}` : triggerLabel}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display italic text-xl">Choose Prestigious Icon</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Icon</Label>
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-4">
                {categories.map(category => (
                  <div key={category}>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{category}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESTIGE_ICONS.filter(i => i.category === category).map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          onClick={() => setSelectedIcon(name)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            selectedIcon === name 
                              ? 'ring-2 ring-primary scale-110' 
                              : 'hover:bg-white/10'
                          }`}
                          style={{
                            background: selectedIcon === name 
                              ? `linear-gradient(135deg, ${selectedColor}30 0%, ${selectedColor}10 100%)`
                              : undefined,
                            boxShadow: selectedIcon === name 
                              ? `0 2px 8px ${selectedColor}30` 
                              : undefined,
                          }}
                          data-testid={`icon-option-${name}`}
                        >
                          <Icon 
                            className="w-5 h-5" 
                            style={{ color: selectedIcon === name ? selectedColor : undefined }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="space-y-4">
            <Label className="text-sm font-medium">Color Theme</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESTIGE_COLORS.map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => { setSelectedColor(color); setCustomColor(color); }}
                  className={`p-3 rounded-lg flex items-center gap-2 transition-all ${
                    selectedColor === color 
                      ? 'ring-2 ring-white/50 scale-105' 
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                    border: `1px solid ${color}40`,
                  }}
                  data-testid={`color-option-${name}`}
                >
                  <span 
                    className="w-6 h-6 rounded-full"
                    style={{ 
                      background: `linear-gradient(135deg, ${color} 0%, ${color}90 100%)`,
                      boxShadow: `0 2px 6px ${color}60`,
                    }}
                  />
                  <span className="text-sm">{name}</span>
                </button>
              ))}
            </div>
            
            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }}
                  placeholder="#hex"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Label className="text-sm font-medium mb-3 block">Preview</Label>
              <div className="flex justify-center">
                <span 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${selectedColor}40 0%, ${selectedColor}15 100%)`,
                    boxShadow: `
                      0 8px 24px ${selectedColor}40,
                      inset 0 2px 4px rgba(255,255,255,0.3),
                      inset 0 -2px 4px rgba(0,0,0,0.2)
                    `,
                    border: `2px solid ${selectedColor}60`,
                    transform: 'rotateX(10deg)',
                    perspective: '200px',
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-2xl opacity-60 blur-md animate-pulse"
                    style={{ background: `radial-gradient(circle, ${selectedColor}50 0%, transparent 70%)` }}
                  />
                  <SelectedIconComponent 
                    className="w-10 h-10 relative z-10 drop-shadow-lg" 
                    style={{ 
                      color: selectedColor,
                      filter: `drop-shadow(0 2px 4px ${selectedColor}80)`
                    }}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="button-save-icon">
            Save Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getPrestigeIconComponent(name: string) {
  return PRESTIGE_ICONS.find(i => i.name === name)?.icon;
}
