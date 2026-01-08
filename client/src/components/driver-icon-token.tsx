import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getIconComponent } from "@/components/icon-picker";
import { Crown, Star, Medal, Trophy, Shield, Gem, Sparkles, Flame, Zap, Rocket, Award, BadgeCheck } from "lucide-react";
import type { DriverIcon } from "@shared/schema";

const ICON_COMPONENTS: Record<string, any> = {
  Crown, Star, Medal, Trophy, Shield, Gem, Sparkles, Flame, Zap, Rocket, Award, BadgeCheck
};

interface DriverIconTokenProps {
  icon: DriverIcon;
  size?: "sm" | "md" | "lg";
}

export function DriverIconToken({ icon, size = "sm" }: DriverIconTokenProps) {
  const IconComponent = ICON_COMPONENTS[icon.iconName] || getIconComponent(icon.iconName) || Star;
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span 
          className="inline-flex items-center justify-center cursor-help"
          data-testid={`driver-icon-${icon.slug}`}
        >
          <IconComponent 
            className={sizeClasses[size]}
            style={{ color: icon.iconColor }}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{icon.name}</p>
        <p className="text-xs text-muted-foreground">{icon.description}</p>
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
    <span className="inline-flex items-center gap-1 ml-1">
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
