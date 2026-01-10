import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Trophy, Calendar, User, ArrowRight, Crown, Medal, MapPin, Flag, Clock, TrendingUp, AlertCircle, CheckCircle, Award, X, Sparkles, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isValid } from "date-fns";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, CACHE_TIMES } from "@/lib/queryClient";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Competition, RaceCheckin, Badge as BadgeType, DriverIcon } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { getIconComponent } from "@/components/icon-picker";
import { Button } from "@/components/ui/button";
import { getBadgeIcon } from "@/components/badge-icons";
import { DriverNameWithIcons, useDriverIconsMap } from "@/components/driver-icon-token";
import { useDriverActiveTier, useTierMovementNotifications, useMarkTierMovementNotificationRead, type DriverActiveTier } from "@/hooks/use-tiered-leagues";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [, setLocation] = useLocation();

  const { data: activeTier } = useDriverActiveTier(profile?.id);

  const { data: allCompetitions } = useQuery<any[]>({
    queryKey: ['/api/competitions/active'],
    staleTime: CACHE_TIMES.STABLE,
  });

  const { data: upcomingRacesData } = useQuery<any[]>({
    queryKey: ['/api/races/upcoming'],
    staleTime: CACHE_TIMES.DYNAMIC,
  });

  const { data: mainCompetition } = useQuery<Competition | null>({
    queryKey: ['/api/competitions/main'],
    staleTime: CACHE_TIMES.STABLE,
  });

  const { data: mainStandings } = useQuery<any[]>({
    queryKey: ['/api/competitions', mainCompetition?.id, 'standings'],
    enabled: !!mainCompetition?.id,
    staleTime: CACHE_TIMES.DYNAMIC,
  });

  const { data: driverStats } = useQuery<{
    totalRaces: number;
    totalPoints: number;
    avgPosition: number;
    wins: number;
    podiums: number;
    bestPosition: number;
  }>({
    queryKey: ['/api/profiles', profile?.id, 'stats'],
    enabled: !!profile?.id && profile?.role === 'racer',
    staleTime: CACHE_TIMES.USER_DATA,
  });

  const { data: recentResults } = useQuery<any[]>({
    queryKey: ['/api/profiles', profile?.id, 'recent-results'],
    enabled: !!profile?.id && profile?.role === 'racer',
    staleTime: CACHE_TIMES.USER_DATA,
  });

  const iconsMap = useDriverIconsMap();

  // Badge notifications
  const { data: badgeNotifications } = useQuery<{ notification: { id: number; createdAt: string }; badge: BadgeType }[]>({
    queryKey: ['/api/badge-notifications'],
    enabled: !!profile?.id,
    staleTime: CACHE_TIMES.NOTIFICATIONS,
  });

  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const markReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/badge-notifications/mark-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badge-notifications'] });
      setDismissedIds(new Set());
    },
  });

  const handleDismissBadgeNotifications = () => {
    const currentIds = new Set(badgeNotifications?.map(n => n.notification.id) || []);
    setDismissedIds(currentIds);
    markReadMutation.mutate();
  };

  const visibleBadgeNotifications = (badgeNotifications || []).filter(
    n => !dismissedIds.has(n.notification.id)
  );

  // Driver icon notifications
  const { data: iconNotifications } = useQuery<{ notification: { id: number; createdAt: string }; icon: DriverIcon }[]>({
    queryKey: ['/api/driver-icon-notifications'],
    enabled: !!profile?.id,
    staleTime: CACHE_TIMES.NOTIFICATIONS,
  });

  const [dismissedIconIds, setDismissedIconIds] = useState<Set<number>>(new Set());

  const markIconReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/driver-icon-notifications/mark-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver-icon-notifications'] });
      setDismissedIconIds(new Set());
    },
  });

  const handleDismissIconNotifications = () => {
    const currentIds = new Set(iconNotifications?.map(n => n.notification.id) || []);
    setDismissedIconIds(currentIds);
    markIconReadMutation.mutate();
  };

  const visibleIconNotifications = (iconNotifications || []).filter(
    n => !dismissedIconIds.has(n.notification.id)
  );

  // Tier movement notifications
  const { data: tierMovementNotifications } = useTierMovementNotifications();
  const markTierMovementReadMutation = useMarkTierMovementNotificationRead();

  const [dismissedTierMovementIds, setDismissedTierMovementIds] = useState<Set<number>>(new Set());

  const handleDismissAllTierMovementNotifications = () => {
    const currentIds = (tierMovementNotifications || []).map(n => n.id);
    setDismissedTierMovementIds(new Set(currentIds));
    currentIds.forEach(id => markTierMovementReadMutation.mutate(id));
  };

  const visibleTierMovementNotifications = (tierMovementNotifications || []).filter(
    n => !dismissedTierMovementIds.has(n.id)
  );

  // Fetch check-in status for all upcoming races (only for racers)
  const checkinQueries = useQueries({
    queries: (upcomingRacesData || []).slice(0, 5).map((race: any) => ({
      queryKey: ['/api/races', race.id, 'my-checkin'],
      enabled: !!profile?.id && profile?.role === 'racer',
      staleTime: CACHE_TIMES.DYNAMIC,
    })),
  });

  // Find races where the driver hasn't checked in yet
  // If tier is assigned, filter to that league; otherwise show all upcoming races
  const racesNeedingCheckin = useMemo(() => {
    if (!upcomingRacesData || !profile || profile.role !== 'racer') return [];
    
    return upcomingRacesData.slice(0, 5).filter((race: any, index: number) => {
      const checkinData = checkinQueries[index]?.data as RaceCheckin | null | undefined;
      // If driver has a tier, only show races from their assigned league
      // If no tier, show all upcoming races for check-in
      if (activeTier) {
        const isInLeague = race.leagueId === activeTier.tieredLeague.leagueId;
        return !checkinData && isInLeague;
      }
      return !checkinData;
    });
  }, [upcomingRacesData, checkinQueries, profile, activeTier]);


  const sortedAllCompetitions = useMemo(() => {
    if (!allCompetitions) return [];
    return [...allCompetitions].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.id - b.id;
    });
  }, [allCompetitions]);

  // Get next race for countdown (must be before conditional returns)
  const upcomingRaces = upcomingRacesData || [];
  
  // Find the first race that's today or in the future
  const nextRace = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return upcomingRaces.find((race: any) => {
      if (!race.date) return false;
      const raceDate = new Date(race.date);
      if (!isValid(raceDate)) return false;
      const raceDateOnly = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate());
      return raceDateOnly >= today;
    });
  }, [upcomingRaces]);

  // Countdown timer state (must be before conditional returns)
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isRaceDay, setIsRaceDay] = useState(false);

  // Use the race date string as a stable reference for the effect
  const nextRaceDate = nextRace?.date;

  useEffect(() => {
    const calculateCountdown = () => {
      if (!nextRaceDate) {
        setCountdown(null);
        setIsRaceDay(false);
        return;
      }

      const raceDate = new Date(nextRaceDate);
      const now = new Date();
      
      // Check if it's race day (same calendar date)
      const isToday = raceDate.toDateString() === now.toDateString();
      setIsRaceDay(isToday);

      if (isToday) {
        setCountdown(null);
        return;
      }

      // If race is in the past, no countdown
      if (raceDate < now) {
        setCountdown(null);
        setIsRaceDay(false);
        return;
      }

      const diff = raceDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    // Calculate immediately when race changes
    calculateCountdown();
    
    // Then update every second
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextRaceDate]);

  if (!profileLoading && !profile) {
    setLocation("/profile");
    return null;
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const roleDisplay = profile?.role === 'racer' ? 'Driver' : profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ') : 'Driver';
  
  const standings = mainStandings || [];

  // Find current user's position in main competition
  const userStanding = standings.find((s: any) => s.racerId === profile?.id);
  const userPosition = userStanding ? standings.indexOf(userStanding) + 1 : null;
  const leader = standings[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">
            Welcome back, <span className="text-primary">{profile?.driverName || user?.firstName || 'Driver'}</span>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            {roleDisplay} Account
          </p>
        </div>
        
        {profile?.role === 'admin' && (
          <Link href="/leagues">
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Manage Leagues
            </button>
          </Link>
        )}
      </div>

      {/* Race Countdown Banner */}
      <AnimatePresence>
        {isRaceDay && nextRace && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-500 to-green-600 p-6 text-center shadow-lg shadow-green-500/30"
            data-testid="race-day-banner"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23000%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M0 0h30v30H0zM30 30h30v30H30z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-display font-bold italic text-white drop-shadow-lg">
                RACE DAY
              </h2>
              <p className="text-white/90 mt-2 text-lg font-medium">
                {nextRace.name} {nextRace.location && `@ ${nextRace.location}`}
              </p>
            </div>
          </motion.div>
        )}

        {countdown && !isRaceDay && nextRace && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 p-6"
            data-testid="race-countdown-banner"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Next Race</p>
              <h3 className="text-lg font-semibold text-white mb-4">
                {nextRace.name} {nextRace.location && <span className="text-muted-foreground">@ {nextRace.location}</span>}
              </h3>
              <div className="flex justify-center gap-4 md:gap-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-display font-bold text-primary">{countdown.days}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Days</div>
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold text-white/30">:</div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-display font-bold text-primary">{String(countdown.hours).padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Hours</div>
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold text-white/30">:</div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-display font-bold text-primary">{String(countdown.minutes).padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Mins</div>
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold text-white/30">:</div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-display font-bold text-primary">{String(countdown.seconds).padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Secs</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {format(new Date(nextRace.date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Reminder Banner for Drivers */}
      {profile?.role === 'racer' && racesNeedingCheckin.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
          data-testid="banner-checkin-reminder"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-300">Check-in Required</h3>
                <p className="text-sm text-muted-foreground">
                  You have {racesNeedingCheckin.length} upcoming {racesNeedingCheckin.length === 1 ? 'race' : 'races'} that need your attendance confirmation
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {racesNeedingCheckin.slice(0, 2).map((race: any) => (
                <Link key={race.id} href={`/races/${race.id}`}>
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300" data-testid={`button-checkin-race-${race.id}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {race.name}
                  </Button>
                </Link>
              ))}
              {racesNeedingCheckin.length > 2 && (
                <Link href="/races">
                  <Button size="sm" variant="ghost" className="text-amber-300">
                    +{racesNeedingCheckin.length - 2} more
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Badge Notification Banner */}
      <AnimatePresence>
        {visibleBadgeNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 cursor-pointer hover:border-yellow-500/50 transition-colors"
            data-testid="banner-badge-notification"
            onClick={() => { handleDismissBadgeNotifications(); setLocation('/profile#badges'); }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Award className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-300">New Badge{visibleBadgeNotifications.length > 1 ? 's' : ''} Unlocked!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've earned {visibleBadgeNotifications.length} new badge{visibleBadgeNotifications.length > 1 ? 's' : ''}! Click to view.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {visibleBadgeNotifications.slice(0, 3).map((item) => {
                  const CustomIcon = getBadgeIcon(item.badge.iconName);
                  const FallbackIcon = getIconComponent(item.badge.iconName) || Award;
                  return (
                    <div
                      key={item.notification.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: `${item.badge.iconColor}25`, borderColor: `${item.badge.iconColor}40` }}
                      data-testid={`badge-notification-${item.badge.id}`}
                    >
                      {CustomIcon ? (
                        <CustomIcon className="w-4 h-4" style={{ color: item.badge.iconColor }} />
                      ) : (
                        <FallbackIcon className="w-4 h-4" style={{ color: item.badge.iconColor }} />
                      )}
                      <span className="text-sm font-medium">{item.badge.name}</span>
                    </div>
                  );
                })}
                {visibleBadgeNotifications.length > 3 && (
                  <span className="text-sm text-yellow-300">+{visibleBadgeNotifications.length - 3} more</span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-yellow-300"
                  onClick={(e) => { e.stopPropagation(); handleDismissBadgeNotifications(); }}
                  disabled={markReadMutation.isPending}
                  data-testid="button-dismiss-badge-notifications"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Driver Icon Notification Banner */}
      <AnimatePresence>
        {visibleIconNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors"
            data-testid="banner-icon-notification"
            onClick={() => { handleDismissIconNotifications(); setLocation('/profile#icons'); }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-300">New Icon{visibleIconNotifications.length > 1 ? 's' : ''} Awarded!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've received {visibleIconNotifications.length} prestigious icon{visibleIconNotifications.length > 1 ? 's' : ''}! Click to view.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {visibleIconNotifications.slice(0, 3).map((item) => {
                  const IconComponent = getIconComponent(item.icon.iconName) || Sparkles;
                  return (
                    <div
                      key={item.notification.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: `${item.icon.iconColor}25`, borderColor: `${item.icon.iconColor}40` }}
                      data-testid={`icon-notification-${item.icon.id}`}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: item.icon.iconColor }} />
                      <span className="text-sm font-medium">{item.icon.name}</span>
                    </div>
                  );
                })}
                {visibleIconNotifications.length > 3 && (
                  <span className="text-sm text-purple-300">+{visibleIconNotifications.length - 3} more</span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-purple-300"
                  onClick={(e) => { e.stopPropagation(); handleDismissIconNotifications(); }}
                  disabled={markIconReadMutation.isPending}
                  data-testid="button-dismiss-icon-notifications"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tier Movement Notifications Banner */}
        {visibleTierMovementNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 cursor-pointer hover:border-blue-500/50 transition-colors"
            data-testid="banner-tier-movement-notifications"
            onClick={() => { 
              handleDismissAllTierMovementNotifications(); 
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-300">
                    Tier Update{visibleTierMovementNotifications.length > 1 ? 's' : ''}!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {visibleTierMovementNotifications.length === 1 
                      ? `Your tier has been updated! Click to dismiss.`
                      : `You have ${visibleTierMovementNotifications.length} tier updates. Click to dismiss.`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-blue-300"
                  onClick={(e) => { e.stopPropagation(); handleDismissAllTierMovementNotifications(); }}
                  disabled={markTierMovementReadMutation.isPending}
                  data-testid="button-dismiss-tier-movement-notifications"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Tier - Current tier assignment */}
      {activeTier && (
        <Link href={`/competitions/${activeTier.tieredLeague.parentCompetitionId}#tiers`}>
          <div 
            className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-secondary/30 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer"
            data-testid="card-my-tier"
          >
            <h3 className="text-lg font-bold font-display italic flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-yellow-500" /> My Tier
            </h3>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-secondary/80 border border-white/10">
                <div className="p-3 rounded-lg bg-yellow-500/20">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display italic text-white">{activeTier.tierName}</p>
                  <p className="text-sm text-muted-foreground">{activeTier.tieredLeague.name}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold font-display text-primary">P{activeTier.standing}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Position</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-display text-white">{activeTier.points}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Points</div>
                </div>
              </div>
            </motion.div>
          </div>
        </Link>
      )}

      {/* All Competitions - Scrollable */}
      {sortedAllCompetitions.length > 0 && (
        <div className="p-5 rounded-2xl bg-secondary/30 border border-white/10">
          <h3 className="text-lg font-bold font-display italic flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-primary" /> All Competitions
          </h3>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-2">
              {sortedAllCompetitions.map((comp, index) => {
                const CompIcon = getIconComponent(comp.iconName) || Flag;
                const iconColor = comp.iconColor || "#3b82f6";
                return (
                  <Link key={comp.id} href={`/competitions/${comp.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all cursor-pointer min-w-[200px]"
                      data-testid={`card-all-competition-${comp.id}`}
                    >
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${iconColor}20` }}
                      >
                        <CompIcon className="w-4 h-4" style={{ color: iconColor }} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-white truncate">{comp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{comp.leagueName}</p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href={nextRace ? `/races/${nextRace.id}` : '/leagues'}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-colors relative overflow-hidden group cursor-pointer"
            data-testid="card-next-race"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/5 text-blue-500">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Next Race</span>
            </div>
            <div className="text-xl font-bold font-display italic truncate">
              {nextRace?.name || 'No scheduled races'}
            </div>
            {nextRace && (
              <div className="text-sm text-muted-foreground mt-1">
                {format(new Date(nextRace.date), 'MMM dd, yyyy')}
              </div>
            )}
          </motion.div>
        </Link>

        <Link href={mainCompetition ? `/competitions/${mainCompetition.id}` : '/leagues'}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-colors relative overflow-hidden group cursor-pointer"
            data-testid="card-your-position"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/5 text-primary">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Your Position</span>
                {mainCompetition && (
                  <span className="text-xs text-muted-foreground/70 truncate">{mainCompetition.name}</span>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold font-display italic">
              {userPosition ? `P${userPosition}` : '--'}
            </div>
            {userStanding && (
              <div className="text-sm text-muted-foreground mt-1">
                {userStanding.points} points
              </div>
            )}
          </motion.div>
        </Link>

        <Link href={mainCompetition ? `/competitions/${mainCompetition.id}` : '/leagues'}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-colors relative overflow-hidden group cursor-pointer"
            data-testid="card-championship-leader"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Medal className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/5 text-green-500">
                <Medal className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Championship Leader</span>
                {mainCompetition && (
                  <span className="text-xs text-muted-foreground/70 truncate">{mainCompetition.name}</span>
                )}
              </div>
            </div>
            <div className="text-xl font-bold font-display italic truncate">
              {leader ? (
                <span 
                  className="hover:text-primary cursor-pointer transition-colors inline-flex items-center gap-1"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLocation(`/profiles/${leader.racerId}`); }}
                >
                  <DriverNameWithIcons 
                    profileId={leader.racerId} 
                    name={leader.driverName} 
                    iconsMap={iconsMap}
                    iconSize="sm"
                  />
                </span>
              ) : 'TBD'}
            </div>
            {leader && (
              <div className="text-sm text-muted-foreground mt-1">
                {leader.points} points
              </div>
            )}
          </motion.div>
        </Link>
      </div>

      {/* Driver Stats (for racers only) */}
      {profile?.role === 'racer' && driverStats && driverStats.totalRaces > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/30 border border-primary/20">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Your Stats
            </h3>
            <Link href="/profile">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
                View Profile <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xl font-bold font-display text-primary">{driverStats.totalRaces}</div>
              <div className="text-xs text-muted-foreground">Races</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xl font-bold font-display text-green-400">{driverStats.totalPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xl font-bold font-display text-yellow-400">{driverStats.wins}</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xl font-bold font-display text-orange-400">{driverStats.podiums}</div>
              <div className="text-xs text-muted-foreground">Podiums</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xl font-bold font-display">{driverStats.avgPosition}</div>
              <div className="text-xs text-muted-foreground">Avg Pos</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <div className="text-2xl font-bold font-display text-blue-400">P{driverStats.bestPosition}</div>
              <div className="text-xs text-muted-foreground">Best</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Results (for racers only) */}
      {profile?.role === 'racer' && recentResults && recentResults.length > 0 && (
        <div className="p-5 rounded-2xl bg-secondary/30 border border-white/5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Recent Results
            </h3>
            <Link href="/profile">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
                All History <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentResults.slice(0, 4).map((result: any, i: number) => (
              <Link key={i} href={`/races/${result.raceId}`}>
                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-display italic text-lg ${
                      result.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                      result.position === 3 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-primary/10 text-primary'
                    }`}>
                      P{result.position}
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-lg font-bold text-primary">{result.points} pts</div>
                    </div>
                  </div>
                  <h4 className="font-medium text-sm truncate">{result.raceName}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.raceDate && isValid(new Date(result.raceDate)) 
                      ? format(new Date(result.raceDate), "MMM d, yyyy")
                      : "Date TBD"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Races & Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5">
          <div className="flex items-center justify-between mb-6 gap-2">
            <h3 className="text-xl font-bold font-display italic">Upcoming Races</h3>
            <Link href="/leagues">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          
          {upcomingRaces.length > 0 ? (
            <div className="flex flex-col gap-4">
              {upcomingRaces.slice(0, 4).map((race) => (
                <Link key={race.id} href={`/races/${race.id}`}>
                  <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary font-bold font-display flex-shrink-0">
                        {race.date && isValid(new Date(race.date)) ? (
                          <>
                            <span className="text-sm">{format(new Date(race.date), 'dd')}</span>
                            <span className="text-[10px]">{format(new Date(race.date), 'MMM')}</span>
                          </>
                        ) : (
                          <span className="text-xs">TBD</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold truncate">{race.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{race.location}</span>
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20 flex-shrink-0">
                      Scheduled
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p>No upcoming races.</p>
              <p className="text-sm">Schedule some races to see them here!</p>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5">
          <div className="flex items-center justify-between mb-6 gap-2">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold font-display italic">Championship Standings</h3>
              {mainCompetition && (
                <span className="text-xs text-muted-foreground/70 truncate">{mainCompetition.name}</span>
              )}
            </div>
            {mainCompetition && (
              <Link href={`/competitions/${mainCompetition.id}`}>
                <span className="text-sm text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
                  Full Table <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            )}
          </div>
          
          {standings.length > 0 ? (
            <div className="space-y-2">
              {standings.slice(0, 5).map((driver, index: number) => (
                <div 
                  key={driver.racerId}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-display text-sm ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-white/10 text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <Link href={`/profiles/${driver.racerId}`}>
                      <span className="font-medium hover:text-primary cursor-pointer transition-colors">
                        <DriverNameWithIcons 
                          profileId={driver.racerId} 
                          name={driver.driverName || 'Unknown'} 
                          iconsMap={iconsMap}
                          iconSize="sm"
                        />
                      </span>
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Medal className="w-3 h-3 text-yellow-500" />
                      {driver.podiums}
                    </div>
                    <span className="font-display font-bold text-primary min-w-[50px] text-right">
                      {driver.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mb-4 opacity-20" />
              <p>No standings yet.</p>
              <p className="text-sm">Complete races to see the leaderboard!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
