import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, Trophy, Calendar, MapPin, Shield, Car, Eye, BarChart3, Award, Sparkles, Target, TrendingUp, ChevronUp, ChevronDown, Layers } from "lucide-react";
import { format, isValid } from "date-fns";
import { DriverStatsDashboard, RecentResults, BadgesSection, DriverIconsSection, SeasonGoals } from "@/components/driver-stats";
import { useProfile } from "@/hooks/use-profile";
import { DriverIconsDisplay } from "@/components/driver-icon-token";
import { useTierMovementHistory } from "@/hooks/use-tiered-leagues";
import { motion } from "framer-motion";
import type { Profile } from "@shared/schema";

interface PublicProfile {
  id: number;
  driverName: string | null;
  fullName: string | null;
  profileImage: string | null;
  role: string;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profileId = Number(id);
  const { data: myProfile } = useProfile();
  const [, setLocation] = useLocation();
  
  const isAdmin = myProfile?.adminLevel === 'admin' || myProfile?.adminLevel === 'super_admin';

  const { data: publicProfile, isLoading: isLoadingProfile } = useQuery<PublicProfile>({
    queryKey: ['/api/profiles/public', profileId],
    enabled: !!profileId,
  });

  const { data: raceHistoryByCompetition } = useQuery<any[]>({
    queryKey: ['/api/profiles', profileId, 'history-by-competition'],
    enabled: !!profileId,
  });

  const { data: profileIcons } = useQuery<any[]>({
    queryKey: ['/api/profiles', profileId, 'driver-icons'],
    enabled: !!profileId,
  });

  const { data: tierHistory } = useTierMovementHistory(profileId);
  
  const hasIcons = (profileIcons?.length ?? 0) > 0;
  const hasTierHistory = (tierHistory?.length ?? 0) > 0;

  const groupedHistory = raceHistoryByCompetition?.reduce((acc, result) => {
    const compId = result.competitionId;
    if (!acc[compId]) {
      acc[compId] = {
        competitionId: compId,
        competitionName: result.competitionName,
        results: []
      };
    }
    acc[compId].results.push(result);
    return acc;
  }, {} as Record<number, { competitionId: number; competitionName: string; results: any[] }>);

  const competitionGroups = groupedHistory ? Object.values(groupedHistory) : [];

  const isDriver = publicProfile?.role === 'racer' || (publicProfile?.driverName && publicProfile?.fullName);

  if (isLoadingProfile) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!publicProfile) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">This profile doesn't exist or is not available.</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const roleDisplay = publicProfile.role === 'racer' ? 'Driver' : 'Spectator';
  const displayImage = publicProfile.profileImage;

  const mockProfile: Profile = {
    id: publicProfile.id,
    userId: null,
    driverName: publicProfile.driverName,
    fullName: publicProfile.fullName,
    role: publicProfile.role as 'racer' | 'spectator',
    profileImage: publicProfile.profileImage,
    adminLevel: 'none',
    teamId: null,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              setLocation('/');
            }
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/30 to-accent/10 border border-white/10">
        <Avatar className="w-20 h-20 ring-2 ring-primary/20">
          <AvatarImage src={displayImage || ""} alt={publicProfile.driverName || "Profile"} />
          <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
            {publicProfile.driverName?.charAt(0) || publicProfile.fullName?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold font-display italic text-white inline-flex items-center gap-2" data-testid="text-profile-name">
            {publicProfile.driverName || publicProfile.fullName || "Unknown Driver"}
            <DriverIconsDisplay profileId={publicProfile.id} size="md" />
          </h2>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium border border-white/10">
              {publicProfile.role === 'racer' ? (
                <Car className="w-3 h-3 text-primary" />
              ) : (
                <Eye className="w-3 h-3 text-muted-foreground" />
              )}
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>

      {(isDriver || isAdmin) ? (
        <Tabs defaultValue={isDriver ? "stats" : "goals"} className="w-full">
          <TabsList className="w-full justify-start bg-secondary/30 p-1 rounded-xl gap-1 flex-wrap h-auto" data-testid="public-profile-tabs">
            {isDriver && (
              <>
                <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-stats">
                  <BarChart3 className="w-4 h-4 mr-2" /> Stats
                </TabsTrigger>
                <TabsTrigger value="badges" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-badges">
                  <Award className="w-4 h-4 mr-2" /> Badges
                </TabsTrigger>
                {hasIcons && (
                  <TabsTrigger value="icons" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-icons">
                    <Sparkles className="w-4 h-4 mr-2" /> Icons
                  </TabsTrigger>
                )}
                <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-history">
                  <Trophy className="w-4 h-4 mr-2" /> History
                </TabsTrigger>
                {hasTierHistory && (
                  <TabsTrigger value="tier-history" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-tier-history">
                    <TrendingUp className="w-4 h-4 mr-2" /> Tier History
                  </TabsTrigger>
                )}
              </>
            )}
            {isAdmin && (
              <TabsTrigger value="goals" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-goals">
                <Target className="w-4 h-4 mr-2" /> Goals
              </TabsTrigger>
            )}
          </TabsList>

          {isDriver && (
            <>
              <TabsContent value="stats" className="space-y-6 mt-6">
                <DriverStatsDashboard profile={mockProfile} />
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-display italic">Recent Results</h3>
                  <RecentResults profile={mockProfile} />
                </div>
              </TabsContent>

              <TabsContent value="badges" className="mt-6">
                <BadgesSection profile={mockProfile} isOwnProfile={false} isAdmin={isAdmin} />
              </TabsContent>

              {hasIcons && (
                <TabsContent value="icons" className="mt-6">
                  <DriverIconsSection profile={mockProfile} isOwnProfile={false} isAdmin={isAdmin} />
                </TabsContent>
              )}

              <TabsContent value="history" className="space-y-6 mt-6">
            <h2 className="text-xl font-display font-bold italic text-white">Race History</h2>
            {competitionGroups.length > 0 ? (
              <div className="space-y-6">
                {competitionGroups.map((group: any) => (
                  <div key={group.competitionId} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <Trophy className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-lg">{group.competitionName}</h3>
                      <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                        {group.results.length} race{group.results.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.results.map((result: any, i: number) => (
                        <Link key={i} href={`/races/${result.raceId}`} data-testid={`link-history-race-${result.raceId}`}>
                          <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 flex items-center justify-between flex-wrap gap-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold font-display italic text-xl ${
                                result.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                                result.position === 3 ? 'bg-orange-600/20 text-orange-400' :
                                'bg-primary/10 text-primary'
                              }`}>
                                P{result.position}
                              </div>
                              <div>
                                <h4 className="font-bold">{result.raceName}</h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(result.raceDate), "MMM d, yyyy")}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {result.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">{result.points} pts</div>
                              {result.raceTime && <div className="text-sm text-muted-foreground">{result.raceTime}</div>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No race history yet.</p>
              </div>
            )}
              </TabsContent>

              {hasTierHistory && (
                <TabsContent value="tier-history" className="space-y-6 mt-6">
                  <h2 className="text-xl font-display font-bold italic text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Tier History
                  </h2>
                  <div className="space-y-3">
                    {tierHistory?.map((item, index) => {
                      const isPromotion = item.movement.movementType.includes('promotion');
                      const isRelegation = item.movement.movementType.includes('relegation');
                      const isInitial = item.movement.movementType === 'initial_assignment';
                      const date = new Date(item.movement.createdAt);
                      
                      return (
                        <motion.div
                          key={item.movement.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5"
                          data-testid={`public-tier-history-${item.movement.id}`}
                        >
                          <div className={`p-3 rounded-lg ${
                            isPromotion ? 'bg-green-500/20' : 
                            isRelegation ? 'bg-red-500/20' : 
                            'bg-blue-500/20'
                          }`}>
                            {isPromotion ? (
                              <ChevronUp className="w-5 h-5 text-green-500" />
                            ) : isRelegation ? (
                              <ChevronDown className="w-5 h-5 text-red-500" />
                            ) : (
                              <Layers className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {isInitial ? (
                                <>Joined <span className="text-primary font-bold">{item.toTierName}</span></>
                              ) : isPromotion ? (
                                <>Promoted from <span className="text-muted-foreground">{item.fromTierName}</span> to <span className="text-green-500 font-bold">{item.toTierName}</span></>
                              ) : (
                                <>Relegated from <span className="text-muted-foreground">{item.fromTierName}</span> to <span className="text-red-500 font-bold">{item.toTierName}</span></>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{item.tieredLeague.name} • {isValid(date) ? format(date, 'MMM d, yyyy') : 'Unknown date'}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </TabsContent>
              )}
            </>
          )}

          {isAdmin && (
            <TabsContent value="goals" className="mt-6">
              <SeasonGoals profile={mockProfile} isReadOnly={true} />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="p-8 rounded-xl bg-secondary/30 border border-white/5 text-center text-muted-foreground">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Spectator Account</p>
          <p className="text-sm">This user is a spectator and doesn't have racing statistics.</p>
        </div>
      )}
    </div>
  );
}