import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Trophy, Target, Timer, Award, TrendingUp, Medal, CheckCircle, XCircle, HelpCircle, Plus, Trash2, Calendar, Download, Copy, Check, ChevronDown, Lock, Sparkles, ArrowRight, Flag, Zap, Grid2x2, ArrowUp, Star, CircleDot, Users, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { getBadgeIcon } from "@/components/badge-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useState, useMemo, memo } from "react";
import { getIconComponent } from "@/components/icon-picker";
import type { Profile, League, PersonalBest, SeasonGoal, Badge as BadgeType, DriverIcon, Race } from "@shared/schema";
import { DriverIconToken } from "@/components/driver-icon-token";
import { useTieredLeagues } from "@/hooks/use-tiered-leagues";

interface DriverStatsProps {
  profile: Profile;
  isOwnProfile?: boolean;
  isAdmin?: boolean;
}

export const DriverStatsDashboard = memo(function DriverStatsDashboard({ profile }: DriverStatsProps) {
  const { data: stats, isLoading } = useQuery<{
    totalRaces: number;
    totalPoints: number;
    avgPosition: number;
    wins: number;
    podiums: number;
    bestPosition: number;
  }>({
    queryKey: ['/api/profiles', profile.id, 'stats'],
  });

  const statCards = useMemo(() => [
    { label: "Total Races", value: stats?.totalRaces || 0, icon: Trophy, color: "text-blue-400" },
    { label: "Total Points", value: stats?.totalPoints || 0, icon: TrendingUp, color: "text-green-400" },
    { label: "Wins", value: stats?.wins || 0, icon: Medal, color: "text-yellow-400" },
    { label: "Podiums", value: stats?.podiums || 0, icon: Award, color: "text-orange-400" },
    { label: "Avg Position", value: stats?.avgPosition || "--", icon: Target, color: "text-purple-400" },
    { label: "Best Finish", value: stats?.bestPosition ? `P${stats.bestPosition}` : "--", icon: Timer, color: "text-primary" },
  ], [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <div key={stat.label} className="p-4 rounded-xl bg-secondary/50 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold font-display">{stat.value}</div>
        </div>
      ))}
    </div>
  );
});

export const RecentResults = memo(function RecentResults({ profile }: DriverStatsProps) {
  const { data: results, isLoading } = useQuery<any[]>({
    queryKey: ['/api/profiles', profile.id, 'recent-results'],
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  if (!results?.length) {
    return (
      <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>No recent results</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result, i) => (
        <Link key={i} href={`/races/${result.raceId}`} data-testid={`link-race-result-${result.raceId}`}>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-display ${
                result.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                result.position === 3 ? 'bg-orange-600/20 text-orange-400' :
                'bg-primary/10 text-primary'
              }`}>
                P{result.position}
              </div>
              <div>
                <p className="font-medium">{result.raceName}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(result.raceDate), 'MMM d, yyyy')} - {result.location}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">{result.points} pts</div>
              {result.raceTime && <div className="text-xs text-muted-foreground">{result.raceTime}</div>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
});

export function PersonalBests({ profile }: DriverStatsProps) {
  const { data: bests, isLoading } = useQuery<PersonalBest[]>({
    queryKey: ['/api/profiles', profile.id, 'personal-bests'],
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" /> Personal Bests
        </h3>
        <p className="text-xs text-muted-foreground">Auto-updated from race results</p>
      </div>

      {bests?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {bests.map((pb) => {
            const content = (
              <div className={`p-4 rounded-xl bg-secondary/30 border border-white/5 flex items-center justify-between ${pb.raceId ? 'hover:bg-secondary/50 transition-colors cursor-pointer' : ''}`}>
                <div>
                  <p className="font-medium">{pb.location}</p>
                  {pb.achievedAt && <p className="text-xs text-muted-foreground">{format(new Date(pb.achievedAt), 'MMM d, yyyy')}</p>}
                </div>
                <div className="text-xl font-bold font-display text-primary">{pb.bestTime}</div>
              </div>
            );
            return pb.raceId ? (
              <Link key={pb.id} href={`/races/${pb.raceId}`} data-testid={`link-personal-best-${pb.id}`}>
                {content}
              </Link>
            ) : (
              <div key={pb.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Timer className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No personal bests recorded yet</p>
          <p className="text-sm">Your best lap times will appear here after race results are submitted</p>
        </div>
      )}
    </div>
  );
}

const BADGE_CATEGORY_LABELS: Record<string, string> = {
  getting_started: "Getting Started",
  milestones: "Milestones",
  race_highlights: "Race Highlights",
  hot_streaks: "Hot Streaks",
  season_heroes: "Season Heroes",
  legends: "Legends",
  league_laughs: "League Laughs",
  tier_achievements: "Tier Achievements",
};

const BADGE_CATEGORY_ORDER = [
  "getting_started",
  "milestones",
  "race_highlights",
  "hot_streaks",
  "season_heroes",
  "tier_achievements",
  "legends",
  "league_laughs",
];

export function BadgesSection({ profile, isOwnProfile = false, isAdmin = false }: DriverStatsProps) {
  const { toast } = useToast();
  
  const { data: allBadges, isLoading: loadingAll } = useQuery<BadgeType[]>({
    queryKey: ['/api/badges'],
  });

  const { data: earnedBadges, isLoading: loadingEarned } = useQuery<{ badge: BadgeType; earnedAt: string }[]>({
    queryKey: ['/api/profiles', profile.id, 'badges'],
  });

  const revokeMutation = useMutation({
    mutationFn: (badgeId: number) =>
      apiRequest("DELETE", `/api/profiles/${profile.id}/badges/${badgeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profile.id, 'badges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: "Badge Revoked", description: "The badge has been removed from this driver." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revoke badge", variant: "destructive" });
    },
  });

  if (loadingAll || loadingEarned) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  const earnedBadgeIds = new Set(earnedBadges?.map(eb => eb.badge.id) || []);

  const badgesByCategory = BADGE_CATEGORY_ORDER.reduce((acc, category) => {
    const categoryBadges = allBadges?.filter(b => b.category === category) || [];
    if (categoryBadges.length > 0) {
      acc[category] = categoryBadges;
    }
    return acc;
  }, {} as Record<string, BadgeType[]>);

  const displayBadges = isOwnProfile 
    ? allBadges || []
    : (allBadges || []).filter(b => earnedBadgeIds.has(b.id));

  const displayCategories = isOwnProfile 
    ? BADGE_CATEGORY_ORDER.filter(cat => badgesByCategory[cat]?.length > 0)
    : BADGE_CATEGORY_ORDER.filter(cat => 
        badgesByCategory[cat]?.some(b => earnedBadgeIds.has(b.id))
      );

  const earnedCount = earnedBadgeIds.size;
  const totalCount = allBadges?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" /> Badges & Achievements
        </h3>
        {isOwnProfile && (
          <Badge variant="secondary" className="text-sm">
            {earnedCount} / {totalCount} unlocked
          </Badge>
        )}
      </div>

      {displayCategories.length === 0 ? (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No badges earned yet</p>
          {isOwnProfile && <p className="text-sm">Keep racing to unlock achievements!</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {displayCategories.map(category => {
            const categoryBadges = badgesByCategory[category] || [];
            const displayCategoryBadges = isOwnProfile 
              ? categoryBadges 
              : categoryBadges.filter(b => earnedBadgeIds.has(b.id));

            if (displayCategoryBadges.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {BADGE_CATEGORY_LABELS[category] || category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayCategoryBadges.map(badge => {
                    const isUnlocked = earnedBadgeIds.has(badge.id);
                    const CustomIcon = getBadgeIcon(badge.iconName);
                    const FallbackIcon = getIconComponent(badge.iconName) || Award;

                    return (
                      <div
                        key={badge.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          isUnlocked 
                            ? '' 
                            : 'opacity-40 grayscale'
                        }`}
                        style={isUnlocked ? {
                          backgroundColor: `${badge.iconColor}15`,
                          borderColor: `${badge.iconColor}30`,
                        } : {
                          backgroundColor: 'hsl(var(--secondary) / 0.3)',
                          borderColor: 'hsl(var(--border))',
                        }}
                        data-testid={`badge-${badge.slug}-${isUnlocked ? 'unlocked' : 'locked'}`}
                      >
                        <div 
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center relative ${
                            isUnlocked ? '' : 'bg-muted'
                          }`}
                          style={isUnlocked ? { backgroundColor: `${badge.iconColor}25` } : {}}
                        >
                          {CustomIcon ? (
                            <CustomIcon 
                              className="w-6 h-6" 
                              style={{ color: isUnlocked ? badge.iconColor : 'hsl(var(--muted-foreground))' }} 
                            />
                          ) : (
                            <FallbackIcon 
                              className="w-6 h-6" 
                              style={{ color: isUnlocked ? badge.iconColor : 'hsl(var(--muted-foreground))' }} 
                            />
                          )}
                          {!isUnlocked && (
                            <div className="absolute -bottom-1 -right-1 bg-muted rounded-full p-0.5">
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isUnlocked ? '' : 'text-muted-foreground'}`}>
                            {badge.name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {badge.description}
                          </p>
                        </div>
                        {isAdmin && !isOwnProfile && isUnlocked && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="flex-shrink-0 text-muted-foreground"
                            onClick={() => revokeMutation.mutate(badge.id)}
                            disabled={revokeMutation.isPending}
                            data-testid={`button-revoke-badge-${badge.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Goals that don't require a target value (end-of-season binary outcomes)
const noTargetGoals = ['getPromoted', 'reachSRank', 'reachARank', 'reachBRank', 'avoidRelegation', 'stayInSRank', 'stayInARank', 'stayInBRank', 'rankChampion'];

const goalSchema = z.object({
  leagueId: z.number().min(1, "Please select a league"),
  goalType: z.enum(['wins', 'podiums', 'points', 'races', 'position', 'top5', 'top10', 'poles', 'frontRow', 'gridClimber', 'perfectWeekend', 'getPromoted', 'reachSRank', 'reachARank', 'reachBRank', 'avoidRelegation', 'stayInSRank', 'stayInARank', 'stayInBRank', 'rankChampion']),
  targetValue: z.number().min(1).nullable().optional(),
  targetTier: z.number().min(1).nullable().optional(),
}).refine((data) => {
  // Target is required for goals that need it
  if (!noTargetGoals.includes(data.goalType)) {
    return data.targetValue !== null && data.targetValue !== undefined && data.targetValue >= 1;
  }
  return true;
}, { message: "Target value is required", path: ["targetValue"] }).refine((data) => {
  // targetTier is required for rankChampion goal
  if (data.goalType === 'rankChampion') {
    return data.targetTier !== null && data.targetTier !== undefined && data.targetTier >= 1;
  }
  return true;
}, { message: "Please select a tier", path: ["targetTier"] });

interface SeasonGoalsProps extends DriverStatsProps {
  isReadOnly?: boolean;
}

export function SeasonGoals({ profile, isReadOnly = false }: SeasonGoalsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: goals, isLoading } = useQuery<SeasonGoal[]>({
    queryKey: ['/api/profiles', profile.id, 'goals'],
  });

  const { data: leagues } = useQuery<League[]>({
    queryKey: ['/api/leagues'],
  });

  // Fetch races for all active leagues to determine which have started
  const activeLeagueIds = leagues?.filter(l => l.status === 'active').map(l => l.id) || [];
  const { data: leagueRacesData } = useQuery<{ leagueId: number; races: Race[] }[]>({
    queryKey: ['/api/leagues/races', activeLeagueIds],
    queryFn: async () => {
      const results = await Promise.all(
        activeLeagueIds.map(async (leagueId) => {
          const res = await fetch(`/api/leagues/${leagueId}/races`);
          const races = await res.json();
          return { leagueId, races };
        })
      );
      return results;
    },
    enabled: activeLeagueIds.length > 0,
  });

  // Helper to check if a league has started (any race with valid date is in the past or league is completed)
  const hasLeagueStarted = (leagueId: number): boolean => {
    const league = leagues?.find(l => l.id === leagueId);
    // Completed leagues are always considered "started"
    if (league?.status === 'completed') return true;
    
    const leagueData = leagueRacesData?.find(d => d.leagueId === leagueId);
    if (!leagueData) return false;
    const now = new Date();
    return leagueData.races.some(race => {
      if (!race.date) return false;
      const raceDate = new Date(race.date);
      return !isNaN(raceDate.getTime()) && raceDate <= now;
    });
  };

  // Filter leagues that haven't started yet for the dropdown
  const availableLeagues = leagues?.filter(l => l.status === 'active' && !hasLeagueStarted(l.id)) || [];

  const addMutation = useMutation({
    mutationFn: (data: z.infer<typeof goalSchema>) =>
      apiRequest("POST", `/api/profiles/${profile.id}/goals`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profile.id, 'goals'] });
      setIsAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: number) =>
      apiRequest("DELETE", `/api/goals/${goalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profile.id, 'goals'] });
    },
  });

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: { leagueId: 0, goalType: 'wins', targetValue: 1, targetTier: null }
  });
  
  const selectedLeagueId = form.watch('leagueId');
  const selectedGoalType = form.watch('goalType');
  
  // Fetch tiered leagues for the selected league using existing hook
  const { data: tieredLeaguesForGoal } = useTieredLeagues(selectedLeagueId > 0 && selectedGoalType === 'rankChampion' ? selectedLeagueId : 0);
  
  // Get tier names from the first tiered league (most leagues will only have one)
  const tierOptions = tieredLeaguesForGoal?.[0]?.tierNames || [];
  
  // Helper to get tier name for a goal's targetTier
  // Uses the fetched tier names if available, otherwise falls back to standard tier labels
  const getTierNameForGoal = (goal: SeasonGoal): string | null => {
    if (goal.goalType !== 'rankChampion' || goal.targetTier === null) return null;
    // Check if we have tier names from the fetched tiered leagues
    const tierName = tierOptions.find(t => t.tierNumber === goal.targetTier);
    if (tierName) return tierName.name;
    // Fallback to standard tier labels
    const tierLabels: Record<number, string> = { 1: 'S', 2: 'A', 3: 'B', 4: 'C', 5: 'D' };
    return tierLabels[goal.targetTier] || `Tier ${goal.targetTier}`;
  };

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  const goalLabels: Record<string, string> = {
    wins: 'Wins',
    podiums: 'Podium Finishes',
    points: 'Total Points',
    races: 'Races Entered',
    position: 'Championship Position',
    top5: 'Top 5 Finishes',
    top10: 'Top 10 Finishes',
    poles: 'Pole Positions',
    frontRow: 'Front Row Starts',
    gridClimber: 'Grid Climber (Finish Higher Than Start)',
    perfectWeekend: 'Perfect Weekends (Pole + Win)',
    getPromoted: 'Get Promoted',
    reachSRank: 'Reach S Rank',
    reachARank: 'Reach A Rank',
    reachBRank: 'Reach B Rank',
    avoidRelegation: 'Avoid Relegation All Season',
    stayInSRank: 'Stay in S Rank',
    stayInARank: 'Stay in A Rank',
    stayInBRank: 'Stay in B Rank',
    rankChampion: 'Rank Champion',
  };

  // Helper to get outcome display info
  const getOutcomeDisplay = (outcome: string) => {
    switch (outcome) {
      case 'achieved':
        return { label: 'Achieved!', bgClass: 'bg-green-500/20', textClass: 'text-green-400', borderClass: 'border-green-500/30' };
      case 'failed':
        return { label: 'Failed', bgClass: 'bg-red-500/20', textClass: 'text-red-400', borderClass: 'border-red-500/30' };
      case 'exceeded':
        return { label: 'Exceeded!', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', borderClass: 'border-amber-500/30' };
      default:
        return { label: 'In Progress', bgClass: 'bg-muted/20', textClass: 'text-muted-foreground', borderClass: 'border-white/5' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" /> Season Goals
        </h3>
        {!isReadOnly && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid="button-add-goal">
              <Plus className="w-4 h-4 mr-1" /> Set Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set a Season Goal</DialogTitle>
              <DialogDescription className="sr-only">Create a new goal for this season</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="leagueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League/Season</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || '')}>
                        <FormControl>
                          <SelectTrigger data-testid="select-goal-league">
                            <SelectValue placeholder="Select a league" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLeagues.map((league) => (
                            <SelectItem key={league.id} value={String(league.id)}>{league.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-goal-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(goalLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => {
                    const goalType = form.watch('goalType');
                    const isPositionGoal = goalType === 'position';
                    const needsTarget = !noTargetGoals.includes(goalType);
                    
                    if (!needsTarget) {
                      return (
                        <FormItem>
                          <p className="text-sm text-muted-foreground italic">
                            This goal will be evaluated at the end of the season.
                          </p>
                        </FormItem>
                      );
                    }
                    
                    return (
                      <FormItem>
                        <FormLabel>
                          {isPositionGoal ? 'Target Position' : 'Target'}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            {isPositionGoal && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">P</span>
                            )}
                            <Input 
                              type="number" 
                              min={1} 
                              className={isPositionGoal ? "pl-8" : ""}
                              value={field.value ?? 1}
                              onChange={(e) => field.onChange(Number(e.target.value))} 
                              data-testid="input-goal-target" 
                            />
                          </div>
                        </FormControl>
                        {isPositionGoal && (
                          <p className="text-xs text-muted-foreground mt-1">
                            E.g., enter "5" to aim for a Top 5 finish in the championship
                          </p>
                        )}
                      </FormItem>
                    );
                  }}
                />
                {/* Tier selection for rankChampion goal */}
                {selectedGoalType === 'rankChampion' && (
                  <FormField
                    control={form.control}
                    name="targetTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Which Tier?</FormLabel>
                        {tierOptions.length > 0 ? (
                          <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ''}>
                            <FormControl>
                              <SelectTrigger data-testid="select-goal-tier">
                                <SelectValue placeholder="Select a tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tierOptions.map((tier) => (
                                <SelectItem key={tier.tierNumber} value={String(tier.tierNumber)}>
                                  {tier.name} Champion
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No tiered leagues found for this league. Please select a league with a tiered championship first.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" className="w-full" disabled={addMutation.isPending} data-testid="button-save-goal">
                  {addMutation.isPending ? 'Saving...' : 'Save Goal'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {goals?.length ? (
        <div className="space-y-3">
          {(() => {
            const completedCount = goals.filter(g => {
              // For tier goals, use the outcome field (default to 'pending' if undefined)
              if (noTargetGoals.includes(g.goalType)) {
                const outcome = g.outcome || 'pending';
                return outcome === 'achieved' || outcome === 'exceeded';
              }
              const isPositionGoal = g.goalType === 'position';
              const goalLeague = leagues?.find(l => l.id === g.leagueId);
              const isLeagueCompleted = goalLeague?.status === 'completed';
              const targetValue = g.targetValue ?? 0;
              const meetsTarget = isPositionGoal 
                ? (g.currentValue > 0 && g.currentValue <= targetValue)
                : g.currentValue >= targetValue;
              return isPositionGoal ? (meetsTarget && isLeagueCompleted) : meetsTarget;
            }).length;
            const exceededCount = goals.filter(g => (g.outcome || 'pending') === 'exceeded').length;
            return (completedCount > 0 || exceededCount > 0) && (
              <div className="p-3 rounded-xl bg-secondary/30 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {completedCount}/{goals.length} goal{goals.length !== 1 ? 's' : ''} achieved
                    {exceededCount > 0 && <span className="text-amber-400 ml-1">({exceededCount} exceeded!)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {goals.map((g, i) => {
                    const isAchieved = g.outcome === 'achieved' || (g.targetValue !== null && g.currentValue >= g.targetValue);
                    const isExceeded = g.outcome === 'exceeded';
                    return (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${isExceeded ? 'bg-amber-500' : isAchieved ? 'bg-green-500' : 'bg-muted/30'}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {goals.map((goal) => {
            const league = leagues?.find(l => l.id === goal.leagueId);
            const isPositionGoal = goal.goalType === 'position';
            const isLeagueCompleted = league?.status === 'completed';
            const isTierGoal = noTargetGoals.includes(goal.goalType);
            const targetValue = goal.targetValue ?? 0;
            
            // For tier goals, use outcome field (default to 'pending' if undefined)
            if (isTierGoal) {
              const outcomeDisplay = getOutcomeDisplay(goal.outcome || 'pending');
              return (
                <div 
                  key={goal.id} 
                  className={`p-4 rounded-xl border transition-all ${outcomeDisplay.bgClass} ${outcomeDisplay.borderClass}`}
                  data-testid={`goal-card-${goal.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(goal.outcome || 'pending') === 'achieved' && (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center" data-testid={`goal-completed-${goal.id}`}>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                      {(goal.outcome || 'pending') === 'exceeded' && (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center" data-testid={`goal-exceeded-${goal.id}`}>
                          <Star className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                      {(goal.outcome || 'pending') === 'failed' && (
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center" data-testid={`goal-failed-${goal.id}`}>
                          <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${outcomeDisplay.textClass}`}>
                          {goal.goalType === 'rankChampion' && goal.targetTier !== null
                            ? `${getTierNameForGoal(goal)} Champion`
                            : (goalLabels[goal.goalType] || goal.goalType)}
                          {(goal.outcome || 'pending') !== 'pending' && (
                            <span className={`ml-2 text-xs ${outcomeDisplay.bgClass} ${outcomeDisplay.textClass} px-2 py-0.5 rounded-full`}>
                              {outcomeDisplay.label}
                            </span>
                          )}
                        </p>
                        {league && <p className="text-xs text-muted-foreground">{league.name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(goal.outcome || 'pending') === 'pending' && (
                        <span className="text-xs text-muted-foreground italic">Awaiting season end</span>
                      )}
                      {!isReadOnly && !hasLeagueStarted(goal.leagueId) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => deleteMutation.mutate(goal.id)}
                          data-testid={`button-delete-goal-${goal.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            
            // Regular goals with targets
            const meetsTarget = isPositionGoal 
              ? (goal.currentValue > 0 && goal.currentValue <= targetValue)
              : goal.currentValue >= targetValue;
            const isCompleted = isPositionGoal 
              ? (meetsTarget && isLeagueCompleted)
              : meetsTarget;
            const progress = isPositionGoal 
              ? (goal.currentValue > 0 && targetValue > 0 ? Math.min(100, (targetValue / goal.currentValue) * 100) : 0)
              : (targetValue > 0 ? Math.min(100, (goal.currentValue / targetValue) * 100) : 0);

            return (
              <div 
                key={goal.id} 
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-secondary/30 border-white/5'
                }`}
                data-testid={`goal-card-${goal.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center" data-testid={`goal-completed-${goal.id}`}>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${isCompleted ? 'text-green-400' : ''}`}>
                        {goal.goalType === 'rankChampion' && goal.targetTier !== null
                          ? `${getTierNameForGoal(goal)} Champion`
                          : (goalLabels[goal.goalType] || goal.goalType)}
                        {isCompleted && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Achieved!</span>}
                      </p>
                      {league && <p className="text-xs text-muted-foreground">{league.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && !hasLeagueStarted(goal.leagueId) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => deleteMutation.mutate(goal.id)}
                        data-testid={`button-delete-goal-${goal.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {isPositionGoal ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Current</p>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold font-display italic text-lg ${
                          goal.currentValue === 0 ? 'bg-muted/30 text-muted-foreground' :
                          goal.currentValue === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                          goal.currentValue === 2 ? 'bg-gray-400/20 text-gray-300' :
                          goal.currentValue === 3 ? 'bg-orange-600/20 text-orange-400' :
                          isCompleted ? 'bg-green-500/20 text-green-400' :
                          goal.currentValue <= targetValue ? 'bg-primary/20 text-primary' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {goal.currentValue > 0 ? `P${goal.currentValue}` : '—'}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center font-bold font-display italic text-lg text-primary">
                          P{targetValue}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      {goal.currentValue === 0 ? (
                        <span className="text-sm text-muted-foreground">Season not started</span>
                      ) : isCompleted ? (
                        <span className="text-sm text-green-400 font-medium">Goal achieved!</span>
                      ) : goal.currentValue <= targetValue ? (
                        <span className="text-sm text-muted-foreground">
                          {isLeagueCompleted ? 'Goal achieved!' : `Currently P${goal.currentValue} (Target: P${targetValue})`}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {goal.currentValue - targetValue} position{goal.currentValue - targetValue !== 1 ? 's' : ''} to go
                        </span>
                      )}
                    </div>
                  </div>
                ) : ['wins', 'podiums', 'races', 'top5', 'top10', 'poles', 'frontRow', 'gridClimber', 'perfectWeekend'].includes(goal.goalType) ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: targetValue }).map((_, i) => {
                          const isAchieved = i < goal.currentValue;
                          const IconComponent = goal.goalType === 'wins' ? Trophy : 
                                               goal.goalType === 'podiums' ? Medal :
                                               goal.goalType === 'poles' ? Zap :
                                               goal.goalType === 'frontRow' ? Grid2x2 :
                                               goal.goalType === 'gridClimber' ? ArrowUp :
                                               goal.goalType === 'perfectWeekend' ? Star :
                                               goal.goalType === 'top5' ? CircleDot :
                                               goal.goalType === 'top10' ? CircleDot : Flag;
                          return (
                            <div
                              key={i}
                              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                                isAchieved 
                                  ? goal.goalType === 'wins' ? 'bg-yellow-500/20' : 
                                    goal.goalType === 'podiums' ? 'bg-orange-500/20' : 
                                    goal.goalType === 'poles' ? 'bg-purple-500/20' :
                                    goal.goalType === 'perfectWeekend' ? 'bg-amber-500/20' :
                                    goal.goalType === 'gridClimber' ? 'bg-green-500/20' : 'bg-primary/20'
                                  : 'bg-muted/20'
                              }`}
                            >
                              <IconComponent className={`w-4 h-4 ${
                                isAchieved 
                                  ? goal.goalType === 'wins' ? 'text-yellow-500' : 
                                    goal.goalType === 'podiums' ? 'text-orange-400' : 
                                    goal.goalType === 'poles' ? 'text-purple-400' :
                                    goal.goalType === 'perfectWeekend' ? 'text-amber-400' :
                                    goal.goalType === 'gridClimber' ? 'text-green-400' : 'text-primary'
                                  : 'text-muted-foreground/30'
                              }`} />
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-sm font-bold">
                        {goal.currentValue}/{targetValue}
                      </span>
                    </div>
                    {!isCompleted && goal.currentValue > 0 && targetValue > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {targetValue - goal.currentValue} more to go!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{goal.currentValue} / {targetValue} pts</span>
                      <span className={`font-medium ${isCompleted ? 'text-green-400' : ''}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`} />
                    {!isCompleted && goal.currentValue > 0 && targetValue > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {targetValue - goal.currentValue} points to go!
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {goals.some(g => {
            if (noTargetGoals.includes(g.goalType)) {
              const outcome = g.outcome || 'pending';
              return outcome === 'achieved' || outcome === 'exceeded';
            }
            const isPositionGoal = g.goalType === 'position';
            const tv = g.targetValue ?? 0;
            return isPositionGoal 
              ? (g.currentValue > 0 && g.currentValue <= tv)
              : g.currentValue >= tv;
          }) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 text-center">
              <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Goal Achieved! Keep pushing for more!</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium mb-2">No goals set yet</p>
          <p className="text-sm mb-4">Set personal targets to track your progress throughout the season!</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">Win races</span>
            <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">Podium finishes</span>
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Points target</span>
            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400">Championship position</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface HeadToHeadProps {
  profile: Profile;
  allProfiles: Profile[];
}

export function HeadToHead({ profile, allProfiles }: HeadToHeadProps) {
  const [opponentId, setOpponentId] = useState<number | null>(null);

  const { data: h2h, isLoading } = useQuery<{
    driver1Wins: number;
    driver2Wins: number;
    draws: number;
    driver1Podiums: number;
    driver2Podiums: number;
    driver1Points: number;
    driver2Points: number;
    driver1AvgPosition: number;
    driver2AvgPosition: number;
    driver1AvgQuali: number | null;
    driver2AvgQuali: number | null;
    recentFormDriver1: number;
    recentFormDriver2: number;
    podiumDifferential: number;
    pointsDifferential: number;
    avgPositionGap: number;
    avgQualiGap: number | null;
    races: any[];
  }>({
    queryKey: ['/api/head-to-head', profile.id, opponentId],
    enabled: !!opponentId,
  });

  const opponent = allProfiles.find(p => p.id === opponentId);
  
  const driver1Name = profile.driverName || 'You';
  const driver2Name = opponent?.driverName || 'Opponent';

  const chartData = h2h ? [
    { name: 'Wins', driver1: h2h.driver1Wins, driver2: h2h.driver2Wins },
    { name: 'Podiums', driver1: h2h.driver1Podiums, driver2: h2h.driver2Podiums },
    { name: 'Points', driver1: h2h.driver1Points, driver2: h2h.driver2Points },
    { name: 'Recent Form', driver1: h2h.recentFormDriver1, driver2: h2h.recentFormDriver2 },
  ] : [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
        <Users className="w-5 h-5 text-red-500" /> Head-to-Head
      </h3>

      <Select onValueChange={(v) => setOpponentId(Number(v))} value={opponentId ? String(opponentId) : ''}>
        <SelectTrigger className="w-full md:w-64" data-testid="select-h2h-opponent">
          <SelectValue placeholder="Select opponent to compare" />
        </SelectTrigger>
        <SelectContent>
          {allProfiles.filter(p => p.id !== profile.id && p.role === 'racer').map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>{p.driverName || p.fullName || 'Driver'}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && opponentId && <Skeleton className="h-32 rounded-xl" />}

      {h2h && opponent && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{h2h.driver1Wins}</div>
              <div className="text-xs text-muted-foreground">{driver1Name}</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
              <div className="text-2xl font-bold">{h2h.draws}</div>
              <div className="text-xs text-muted-foreground">Draws</div>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{h2h.driver2Wins}</div>
              <Link href={`/profiles/${opponent.id}`}>
                <div className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                  {driver2Name}
                </div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-muted-foreground">Podium Differential</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className={h2h.driver1Podiums > h2h.driver2Podiums ? 'text-green-400 font-bold' : 'text-muted-foreground'}>{h2h.driver1Podiums}</span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className={h2h.driver2Podiums > h2h.driver1Podiums ? 'text-red-400 font-bold' : 'text-muted-foreground'}>{h2h.driver2Podiums}</span>
              </div>
              <div className={`text-xs text-center ${h2h.podiumDifferential > 0 ? 'text-green-400' : h2h.podiumDifferential < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {h2h.podiumDifferential > 0 ? `+${h2h.podiumDifferential} ${driver1Name}` : h2h.podiumDifferential < 0 ? `+${Math.abs(h2h.podiumDifferential)} ${driver2Name}` : 'Even'}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Points Difference</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className={h2h.driver1Points > h2h.driver2Points ? 'text-green-400 font-bold' : 'text-muted-foreground'}>{h2h.driver1Points}</span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className={h2h.driver2Points > h2h.driver1Points ? 'text-red-400 font-bold' : 'text-muted-foreground'}>{h2h.driver2Points}</span>
              </div>
              <div className={`text-xs text-center ${h2h.pointsDifferential > 0 ? 'text-green-400' : h2h.pointsDifferential < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {h2h.pointsDifferential > 0 ? `+${h2h.pointsDifferential} pts ${driver1Name}` : h2h.pointsDifferential < 0 ? `+${Math.abs(h2h.pointsDifferential)} pts ${driver2Name}` : 'Even'}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Avg Finish Gap</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className={h2h.driver1AvgPosition < h2h.driver2AvgPosition ? 'text-green-400 font-bold' : 'text-muted-foreground'}>P{h2h.driver1AvgPosition}</span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className={h2h.driver2AvgPosition < h2h.driver1AvgPosition ? 'text-red-400 font-bold' : 'text-muted-foreground'}>P{h2h.driver2AvgPosition}</span>
              </div>
              <div className={`text-xs text-center ${h2h.avgPositionGap > 0 ? 'text-green-400' : h2h.avgPositionGap < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {h2h.avgPositionGap > 0 ? `${h2h.avgPositionGap} pos better ${driver1Name}` : h2h.avgPositionGap < 0 ? `${Math.abs(h2h.avgPositionGap)} pos better ${driver2Name}` : 'Equal'}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Grid2x2 className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-muted-foreground">Avg Quali Gap</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className={h2h.driver1AvgQuali && h2h.driver2AvgQuali && h2h.driver1AvgQuali < h2h.driver2AvgQuali ? 'text-green-400 font-bold' : 'text-muted-foreground'}>
                  {h2h.driver1AvgQuali ? `P${h2h.driver1AvgQuali}` : '--'}
                </span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className={h2h.driver1AvgQuali && h2h.driver2AvgQuali && h2h.driver2AvgQuali < h2h.driver1AvgQuali ? 'text-red-400 font-bold' : 'text-muted-foreground'}>
                  {h2h.driver2AvgQuali ? `P${h2h.driver2AvgQuali}` : '--'}
                </span>
              </div>
              <div className={`text-xs text-center ${h2h.avgQualiGap !== null && h2h.avgQualiGap > 0 ? 'text-green-400' : h2h.avgQualiGap !== null && h2h.avgQualiGap < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {h2h.avgQualiGap !== null ? (h2h.avgQualiGap > 0 ? `${h2h.avgQualiGap} pos better ${driver1Name}` : h2h.avgQualiGap < 0 ? `${Math.abs(h2h.avgQualiGap)} pos better ${driver2Name}` : 'Equal') : 'No data'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Momentum (Last 5 Races)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{driver1Name}</span>
                <span className={h2h.recentFormDriver1 > h2h.recentFormDriver2 ? 'text-lg font-bold text-green-400' : 'text-lg font-bold text-muted-foreground'}>
                  {h2h.recentFormDriver1} wins
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={h2h.recentFormDriver2 > h2h.recentFormDriver1 ? 'text-lg font-bold text-red-400' : 'text-lg font-bold text-muted-foreground'}>
                  {h2h.recentFormDriver2} wins
                </span>
                <Link href={`/profiles/${opponent.id}`}>
                  <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">{driver2Name}</span>
                </Link>
              </div>
            </div>
            {h2h.recentFormDriver1 > h2h.recentFormDriver2 && (
              <p className="text-xs text-green-400 mt-2">{driver1Name} has the momentum!</p>
            )}
            {h2h.recentFormDriver2 > h2h.recentFormDriver1 && (
              <p className="text-xs text-red-400 mt-2">{driver2Name} has the momentum!</p>
            )}
            {h2h.recentFormDriver1 === h2h.recentFormDriver2 && h2h.races.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Both drivers are evenly matched recently</p>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
              <p className="text-sm font-medium mb-4">Stats Comparison</p>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                  <span className="text-muted-foreground">{driver1Name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-muted-foreground">{driver2Name}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" barGap={4}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--secondary))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="driver1" fill="#22c55e" radius={[0, 4, 4, 0]} name={driver1Name} />
                  <Bar dataKey="driver2" fill="#ef4444" radius={[0, 4, 4, 0]} name={driver2Name} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {h2h.races.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent Race Results:</p>
              {h2h.races.slice(0, 5).map((race: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-white/5">
                  <span className="text-sm font-medium">{race.name}</span>
                  <div className="flex items-center gap-4">
                    <span className={race.winner === 1 ? 'text-green-400 font-bold' : 'text-muted-foreground'}>P{race.driver1Position}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={race.winner === 2 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>P{race.driver2Position}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!opponentId && (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Select an opponent to compare records</p>
        </div>
      )}
    </div>
  );
}

export function CalendarSync() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const calendarUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/calendar/races.ics`
    : '/api/calendar/races.ics';
  
  const webcalUrl = calendarUrl.replace('https://', 'webcal://').replace('http://', 'webcal://');
  
  const googleCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
  
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      toast({
        title: "Calendar URL copied",
        description: "Paste this URL in your calendar app to subscribe",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium">Sync to Calendar</p>
          <p className="text-xs text-muted-foreground">Add race schedule to your calendar app</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" data-testid="button-calendar-options">
            <Calendar className="w-4 h-4 mr-2" /> Add to Calendar <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild data-testid="menu-google-calendar">
            <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <Calendar className="w-4 h-4 mr-2" />
              Google Calendar
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-testid="menu-apple-calendar">
            <a href={webcalUrl} className="cursor-pointer">
              <Calendar className="w-4 h-4 mr-2" />
              Apple Calendar / Outlook
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid="menu-download-ics">
            <a href="/api/calendar/races.ics" download="mck-grid-races.ics" className="cursor-pointer">
              <Download className="w-4 h-4 mr-2" />
              Download .ics file
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyUrl} data-testid="menu-copy-url">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Copy calendar URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DriverIconsSection({ profile, isOwnProfile = false, isAdmin = false }: DriverStatsProps) {
  const { toast } = useToast();
  
  const { data: profileIcons, isLoading } = useQuery<{ icon: DriverIcon; awardedAt: string }[]>({
    queryKey: ['/api/profiles', profile.id, 'driver-icons'],
  });

  const revokeMutation = useMutation({
    mutationFn: (iconId: number) =>
      apiRequest("DELETE", `/api/profiles/${profile.id}/driver-icons/${iconId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profile.id, 'driver-icons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver-icons/all-assignments'] });
      toast({ title: "Icon Revoked", description: "The icon has been removed from this driver." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revoke icon", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  const icons = profileIcons || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" /> Driver Icons
        </h3>
        <Badge variant="secondary" className="text-sm">
          {icons.length} icon{icons.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {icons.length === 0 ? (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No special icons earned yet</p>
          {isOwnProfile && <p className="text-sm">Icons are awarded by admins for special achievements!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {icons.map(({ icon, awardedAt }) => (
            <div
              key={icon.id}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{
                backgroundColor: `${icon.iconColor}15`,
                borderColor: `${icon.iconColor}30`,
              }}
              data-testid={`driver-icon-card-${icon.slug}`}
            >
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${icon.iconColor}25` }}
              >
                <DriverIconToken icon={icon} size="lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{icon.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{icon.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awarded {format(new Date(awardedAt), "MMM d, yyyy")}
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => revokeMutation.mutate(icon.id)}
                  disabled={revokeMutation.isPending}
                  data-testid={`button-revoke-icon-${icon.slug}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
