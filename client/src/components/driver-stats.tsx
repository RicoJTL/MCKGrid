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
import { Trophy, Target, Timer, Award, TrendingUp, Medal, CheckCircle, XCircle, HelpCircle, Plus, Trash2, Calendar, Download, Copy, Check, ChevronDown, Lock, Sparkles } from "lucide-react";
import { getBadgeIcon } from "@/components/badge-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useState, useMemo, memo } from "react";
import { getIconComponent } from "@/components/icon-picker";
import type { Profile, League, PersonalBest, SeasonGoal, Badge as BadgeType, DriverIcon } from "@shared/schema";
import { DriverIconToken } from "@/components/driver-icon-token";

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
};

const BADGE_CATEGORY_ORDER = [
  "getting_started",
  "milestones",
  "race_highlights",
  "hot_streaks",
  "season_heroes",
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

const goalSchema = z.object({
  leagueId: z.number(),
  goalType: z.enum(['wins', 'podiums', 'points', 'races', 'position']),
  targetValue: z.number().min(1),
});

export function SeasonGoals({ profile }: DriverStatsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: goals, isLoading } = useQuery<SeasonGoal[]>({
    queryKey: ['/api/profiles', profile.id, 'goals'],
  });

  const { data: leagues } = useQuery<League[]>({
    queryKey: ['/api/leagues'],
  });

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
    defaultValues: { leagueId: 0, goalType: 'wins', targetValue: 1 }
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  const goalLabels: Record<string, string> = {
    wins: 'Wins',
    podiums: 'Podium Finishes',
    points: 'Total Points',
    races: 'Races Entered',
    position: 'Final Position',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" /> Season Goals
        </h3>
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
                          {leagues?.filter(l => l.status === 'active').map((league) => (
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-goal-target" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addMutation.isPending} data-testid="button-save-goal">
                  {addMutation.isPending ? 'Saving...' : 'Save Goal'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {goals?.length ? (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
            const league = leagues?.find(l => l.id === goal.leagueId);
            return (
              <div key={goal.id} className="p-4 rounded-xl bg-secondary/30 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{goalLabels[goal.goalType] || goal.goalType}</p>
                    {league && <p className="text-xs text-muted-foreground">{league.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{goal.currentValue}/{goal.targetValue}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => deleteMutation.mutate(goal.id)}
                      data-testid={`button-delete-goal-${goal.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No goals set yet</p>
          <p className="text-sm">Set targets for the season!</p>
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
    races: any[];
  }>({
    queryKey: ['/api/head-to-head', profile.id, opponentId],
    enabled: !!opponentId,
  });

  const opponent = allProfiles.find(p => p.id === opponentId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-display italic flex items-center gap-2">
        <Trophy className="w-5 h-5 text-red-500" /> Head-to-Head
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
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{h2h.driver1Wins}</div>
              <div className="text-xs text-muted-foreground">{profile.driverName || 'You'}</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
              <div className="text-2xl font-bold">{h2h.draws}</div>
              <div className="text-xs text-muted-foreground">Draws</div>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{h2h.driver2Wins}</div>
              <Link href={`/profiles/${opponent.id}`}>
                <div className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                  {opponent.driverName || 'Opponent'}
                </div>
              </Link>
            </div>
          </div>

          {h2h.races.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Race Results:</p>
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
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
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
