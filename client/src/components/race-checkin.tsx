import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, HelpCircle, Clock, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, isValid } from "date-fns";
import type { Race, Profile, RaceCheckin } from "@shared/schema";
import { Link } from "wouter";
import { DriverNameWithIcons, useDriverIconsMap } from "@/components/driver-icon-token";
import { useState } from "react";

interface RaceCheckinProps {
  race: Race;
  profile?: Profile | null;
}

export function RaceCheckinButton({ race, profile }: RaceCheckinProps) {
  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { data: myCheckin, isLoading } = useQuery<RaceCheckin | null>({
    queryKey: ['/api/races', race.id, 'my-checkin'],
    enabled: !!profile && profile.role === 'racer',
  });

  const checkinMutation = useMutation({
    mutationFn: async (status: 'confirmed' | 'maybe' | 'not_attending') => {
      const res = await fetch(`/api/races/${race.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to check in');
      }
      return res.json();
    },
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/races', race.id, 'my-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/races', race.id, 'checkins'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  // Only racers can check in
  if (!profile || profile.role !== 'racer') return null;
  if (isLoading) return <Skeleton className="h-9 w-24" />;

  const statusConfig = {
    confirmed: { icon: CheckCircle, color: 'text-green-400 bg-green-500/20 border-green-500/30', label: 'Going' },
    maybe: { icon: HelpCircle, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', label: 'Maybe' },
    not_attending: { icon: XCircle, color: 'text-red-400 bg-red-500/20 border-red-500/30', label: 'Not Going' },
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {(['confirmed', 'maybe', 'not_attending'] as const).map((status) => {
          const config = statusConfig[status];
          const isActive = myCheckin?.status === status;
          const Icon = config.icon;
          return (
            <Button
              key={status}
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={isActive ? config.color : ''}
              onClick={() => {
                setErrorMessage(null);
                checkinMutation.mutate(status);
              }}
              disabled={checkinMutation.isPending}
              data-testid={`button-checkin-${status}`}
            >
              <Icon className="w-4 h-4 mr-1" />
              {config.label}
            </Button>
          );
        })}
      </div>
      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

interface RaceCheckinListProps {
  raceId: number;
}

export function RaceCheckinList({ raceId }: RaceCheckinListProps) {
  const { data: checkins, isLoading } = useQuery<(RaceCheckin & { profile: Profile })[]>({
    queryKey: ['/api/races', raceId, 'checkins'],
  });
  const iconsMap = useDriverIconsMap();

  if (isLoading) return <Skeleton className="h-24 rounded-xl" />;
  if (!checkins?.length) return null;

  const confirmed = checkins.filter(c => c.status === 'confirmed');
  const maybe = checkins.filter(c => c.status === 'maybe');
  const notAttending = checkins.filter(c => c.status === 'not_attending');

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Attendance</h4>
      {confirmed.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {confirmed.map(c => (
            <Link key={c.id} href={`/profiles/${c.profile.id}`}>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors">
                <CheckCircle className="w-3 h-3 mr-1" />
                <DriverNameWithIcons 
                  profileId={c.profile.id} 
                  name={c.profile.driverName || c.profile.fullName || 'Unknown'} 
                  iconsMap={iconsMap}
                />
              </Badge>
            </Link>
          ))}
        </div>
      )}
      {maybe.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {maybe.map(c => (
            <Link key={c.id} href={`/profiles/${c.profile.id}`}>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 cursor-pointer hover:bg-yellow-500/20 transition-colors">
                <HelpCircle className="w-3 h-3 mr-1" />
                <DriverNameWithIcons 
                  profileId={c.profile.id} 
                  name={c.profile.driverName || c.profile.fullName || 'Unknown'} 
                  iconsMap={iconsMap}
                />
              </Badge>
            </Link>
          ))}
        </div>
      )}
      {notAttending.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {notAttending.map(c => (
            <Link key={c.id} href={`/profiles/${c.profile.id}`}>
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 cursor-pointer hover:bg-red-500/20 transition-colors">
                <XCircle className="w-3 h-3 mr-1" />
                <DriverNameWithIcons 
                  profileId={c.profile.id} 
                  name={c.profile.driverName || c.profile.fullName || 'Unknown'} 
                  iconsMap={iconsMap}
                />
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface RaceCountdownProps {
  race: Race;
}

export function RaceCountdown({ race }: RaceCountdownProps) {
  const raceDate = new Date(race.date);
  const now = new Date();
  
  // Don't render if date is invalid
  if (!race.date || !isValid(raceDate)) return null;
  
  const days = differenceInDays(raceDate, now);
  const hours = differenceInHours(raceDate, now) % 24;
  const minutes = differenceInMinutes(raceDate, now) % 60;

  if (raceDate < now) return null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
      <Clock className="w-5 h-5 text-primary" />
      <div>
        <span className="font-medium text-primary">
          {days > 0 && `${days}d `}
          {hours > 0 && `${hours}h `}
          {days === 0 && `${minutes}m`}
        </span>
        <span className="text-muted-foreground text-sm ml-2">until race start</span>
      </div>
    </div>
  );
}
