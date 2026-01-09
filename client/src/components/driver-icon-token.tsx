import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getIconComponent } from "@/components/icon-picker";
import { Crown, Star, Medal, Trophy, Shield, Gem, Sparkles, Flame, Zap, Rocket, Award, BadgeCheck, Swords, Target, CircleDot, Hexagon, Diamond, Heart, Skull, Ghost, Bird, Cat, Dog, Fish, Bug, Leaf, Snowflake, Sun, Moon, Cloud, Mountain, Waves, Wind, Compass, Anchor, Flag, Clock, Bell, Gift, Key, Lock, Eye, Lightbulb, Music, Camera, Mic, Headphones, Gamepad2, Dice1 } from "lucide-react";
import type { DriverIcon } from "@shared/schema";

const ICON_COMPONENTS: Record<string, any> = {
  Crown, Star, Medal, Trophy, Shield, Gem, Sparkles, Flame, Zap, Rocket, Award, BadgeCheck,
  Swords, Target, CircleDot, Hexagon, Diamond, Heart, Skull, Ghost, Bird, Cat, Dog, Fish, Bug,
  Leaf, Snowflake, Sun, Moon, Cloud, Mountain, Waves, Wind, Compass, Anchor, Flag, Clock, Bell,
  Gift, Key, Lock, Eye, Lightbulb, Music, Camera, Mic, Headphones, Gamepad2, Dice1
};

function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    return false;
  });
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    
    window.addEventListener('touchstart', () => setIsTouchDevice(true), { once: true });
  }, []);
  
  return isTouchDevice;
}

interface DriverIconTokenProps {
  icon: DriverIcon;
  size?: "sm" | "md" | "lg";
}

function IconButton({ icon, config, onClick }: { icon: DriverIcon; config: any; onClick?: (e: React.MouseEvent) => void }) {
  const IconComponent = ICON_COMPONENTS[icon.iconName] || getIconComponent(icon.iconName) || Star;
  
  return (
    <button 
      type="button"
      className={`inline-flex items-center justify-center cursor-pointer ${config.container} relative group`}
      data-testid={`driver-icon-${icon.slug}`}
      style={{ perspective: "200px" }}
      onClick={onClick}
    >
      <span
        className="absolute inset-0 rounded-full opacity-60 blur-sm group-hover:opacity-80 transition-opacity duration-300 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${icon.iconColor}40 0%, transparent 70%)`,
        }}
      />
      <span
        className="relative flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${icon.iconColor}30 0%, ${icon.iconColor}10 50%, ${icon.iconColor}20 100%)`,
          boxShadow: `
            0 ${config.shadow} ${config.glow} ${icon.iconColor}40,
            inset 0 1px 2px rgba(255,255,255,0.3),
            inset 0 -1px 2px rgba(0,0,0,0.2)
          `,
          border: `1px solid ${icon.iconColor}50`,
          width: '100%',
          height: '100%',
          transform: 'rotateX(10deg)',
        }}
      >
        <IconComponent 
          className={`${config.icon} drop-shadow-sm`}
          style={{ 
            color: icon.iconColor,
            filter: `drop-shadow(0 1px 2px ${icon.iconColor}60)`
          }}
        />
      </span>
    </button>
  );
}

function IconTooltipContent({ icon }: { icon: DriverIcon }) {
  const IconComponent = ICON_COMPONENTS[icon.iconName] || getIconComponent(icon.iconName) || Star;
  
  return (
    <div className="flex items-center gap-2">
      <span 
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${icon.iconColor}40 0%, ${icon.iconColor}20 100%)`,
          boxShadow: `0 2px 8px ${icon.iconColor}40`
        }}
      >
        <IconComponent className="w-4 h-4" style={{ color: icon.iconColor }} />
      </span>
      <div>
        <p className="font-semibold text-sm">{icon.name}</p>
        <p className="text-xs text-muted-foreground">{icon.description}</p>
      </div>
    </div>
  );
}

export function DriverIconToken({ icon, size = "sm" }: DriverIconTokenProps) {
  const isTouchDevice = useIsTouchDevice();
  
  const sizeConfig = {
    sm: { icon: "w-4 h-4", container: "w-6 h-6", glow: "8px", shadow: "2px" },
    md: { icon: "w-5 h-5", container: "w-8 h-8", glow: "12px", shadow: "3px" },
    lg: { icon: "w-6 h-6", container: "w-10 h-10", glow: "16px", shadow: "4px" }
  };

  const config = sizeConfig[size];

  // Mobile: use Popover (click to open)
  if (isTouchDevice) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <span onClick={(e) => e.stopPropagation()}>
            <IconButton icon={icon} config={config} />
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 bg-card/95 backdrop-blur-sm border border-white/10" sideOffset={5}>
          <IconTooltipContent icon={icon} />
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop: use Tooltip (hover to show)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <IconButton icon={icon} config={config} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="p-3 bg-card/95 backdrop-blur-sm border border-white/10" sideOffset={5}>
        <IconTooltipContent icon={icon} />
      </TooltipContent>
    </Tooltip>
  );
}

interface DriverIconsDisplayProps {
  profileId: number;
  size?: "sm" | "md" | "lg";
}

export function DriverIconsDisplay({ profileId, size = "sm" }: DriverIconsDisplayProps) {
  const { data: profileIcons } = useQuery<{ icon: DriverIcon }[]>({
    queryKey: ['/api/profiles', profileId, 'driver-icons'],
  });

  if (!profileIcons || profileIcons.length === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {profileIcons.map(({ icon }) => (
        <DriverIconToken key={icon.id} icon={icon} size={size} />
      ))}
    </span>
  );
}

export function useDriverIconsMap() {
  const { data: allAssignments } = useQuery<{ profileId: number; icons: DriverIcon[] }[]>({
    queryKey: ['/api/driver-icons/all-assignments'],
  });

  const iconsMap = new Map<number, DriverIcon[]>();
  if (allAssignments) {
    for (const assignment of allAssignments) {
      iconsMap.set(assignment.profileId, assignment.icons);
    }
  }

  return iconsMap;
}

interface DriverNameWithIconsProps {
  profileId: number;
  name: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  iconsMap?: Map<number, DriverIcon[]>;
}

export function DriverNameWithIcons({ 
  profileId, 
  name, 
  className = "", 
  iconSize = "sm",
  iconsMap
}: DriverNameWithIconsProps) {
  const icons = iconsMap?.get(profileId) || [];

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{name}</span>
      {icons.length > 0 && (
        <span className="inline-flex items-center gap-0.5">
          {icons.map(icon => (
            <DriverIconToken key={icon.id} icon={icon} size={iconSize} />
          ))}
        </span>
      )}
    </span>
  );
}
