import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, Trophy, Calendar, MapPin, Shield, Car, Eye, BarChart3, Timer, Award } from "lucide-react";
import { format } from "date-fns";
import { DriverStatsDashboard, RecentResults, PersonalBests, BadgesSection } from "@/components/driver-stats";
import { useProfile } from "@/hooks/use-profile";
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
  
  const isAdmin = myProfile?.adminLevel === 'admin' || myProfile?.adminLevel === 'super_admin';

  const { data: publicProfile, isLoading: isLoadingProfile } = useQuery<PublicProfile>({
    queryKey: ['/api/profiles/public', profileId],
    enabled: !!profileId,
  });

  const { data: raceHistoryByCompetition } = useQuery<any[]>({
    queryKey: ['/api/profiles', profileId, 'history-by-competition'],
    enabled: !!profileId,
  });

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
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/30 to-accent/10 border border-white/10">
        <Avatar className="w-20 h-20 ring-2 ring-primary/20">
          <AvatarImage src={displayImage || ""} alt={publicProfile.driverName || "Profile"} />
          <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
            {publicProfile.driverName?.charAt(0) || publicProfile.fullName?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold font-display italic text-white" data-testid="text-profile-name">
            {publicProfile.driverName || publicProfile.fullName || "Unknown Driver"}
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

      {isDriver ? (
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="w-full justify-start bg-secondary/30 p-1 rounded-xl gap-1 flex-wrap h-auto" data-testid="public-profile-tabs">
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-stats">
              <BarChart3 className="w-4 h-4 mr-2" /> Stats
            </TabsTrigger>
            <TabsTrigger value="personal-bests" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-personal-bests">
              <Timer className="w-4 h-4 mr-2" /> Personal Bests
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-badges">
              <Award className="w-4 h-4 mr-2" /> Badges
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-public-history">
              <Trophy className="w-4 h-4 mr-2" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6 mt-6">
            <DriverStatsDashboard profile={mockProfile} />
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-display italic">Recent Results</h3>
              <RecentResults profile={mockProfile} />
            </div>
          </TabsContent>

          <TabsContent value="personal-bests" className="mt-6">
            <PersonalBests profile={mockProfile} />
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
            <BadgesSection profile={mockProfile} isOwnProfile={false} isAdmin={isAdmin} />
          </TabsContent>

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