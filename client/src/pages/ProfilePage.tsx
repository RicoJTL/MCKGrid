import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Trophy, Calendar, MapPin, Upload, Shield, Car, Eye, Crown, ShieldCheck, BarChart3, Timer, Award, Target, Swords, Sparkles, Layers, ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useUpload } from "@/hooks/use-upload";
import { format } from "date-fns";
import { DriverStatsDashboard, RecentResults, BadgesSection, SeasonGoals, HeadToHead, CalendarSync, DriverIconsSection } from "@/components/driver-stats";
import { useTierMovementHistory, useDeleteTierHistory, type TierMovementHistory } from "@/hooks/use-tiered-leagues";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { isValid } from "date-fns";
import { Link, useLocation } from "wouter";
import { DriverIconsDisplay } from "@/components/driver-icon-token";
import type { Profile } from "@shared/schema";

const profileFormSchema = z.object({
  accountType: z.enum(["driver", "spectator"]),
  fullName: z.string().optional(),
  driverName: z.string().optional(),
  profileImage: z.string().optional(),
}).refine((data) => {
  if (data.accountType === "driver") {
    return data.fullName && data.fullName.length > 0 && data.driverName && data.driverName.length > 0;
  }
  return true;
}, {
  message: "Full name and driver name are required for Driver accounts",
  path: ["driverName"],
});

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { uploadFile, isUploading: isUploadingImage } = useUpload();
  const [location] = useLocation();
  
  const isDriver = profile?.role === 'racer' || (profile?.driverName && profile?.fullName);
  
  const [activeTab, setActiveTab] = useState<string>('stats');
  const [tabInitialized, setTabInitialized] = useState(false);

  const { data: raceHistoryByCompetition } = useQuery<any[]>({
    queryKey: ['/api/profiles', profile?.id, 'history-by-competition'],
    enabled: !!profile?.id,
  });

  const { data: allProfiles } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    enabled: !!profile?.id,
  });

  const { data: profileIcons } = useQuery<any[]>({
    queryKey: ['/api/profiles', profile?.id, 'driver-icons'],
    enabled: !!profile?.id,
  });
  
  const { data: tierHistory } = useTierMovementHistory(profile?.id);
  const deleteTierHistory = useDeleteTierHistory();
  
  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';
  const hasIcons = (profileIcons?.length ?? 0) > 0;
  const hasTierHistory = (tierHistory?.length ?? 0) > 0;
  
  useEffect(() => {
    if (profile && !tabInitialized) {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'badges' && isDriver) {
        setActiveTab('badges');
      } else if (hash === 'icons' && isDriver && hasIcons) {
        setActiveTab('icons');
      } else {
        setActiveTab(isDriver ? 'stats' : 'settings');
      }
      setTabInitialized(true);
    }
  }, [profile, isDriver, tabInitialized, hasIcons]);
  
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'badges' && isDriver && tabInitialized) {
      setActiveTab('badges');
    }
  }, [location, isDriver, tabInitialized]);

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

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      accountType: isDriver ? "driver" : "spectator",
      fullName: profile?.fullName || "",
      driverName: profile?.driverName || "",
      profileImage: profile?.profileImage || "",
    },
    values: {
      accountType: isDriver ? "driver" : "spectator",
      fullName: profile?.fullName || "",
      driverName: profile?.driverName || "",
      profileImage: profile?.profileImage || "",
    }
  });

  const accountType = form.watch("accountType");

  const onSubmit = (data: z.infer<typeof profileFormSchema>) => {
    const updateData: any = {
      profileImage: data.profileImage,
    };
    
    if (data.accountType === "driver") {
      updateData.fullName = data.fullName;
      updateData.driverName = data.driverName;
      updateData.role = "racer";
    } else {
      updateData.role = "spectator";
      updateData.fullName = null;
      updateData.driverName = null;
    }
    
    updateProfile.mutate(updateData);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    
    const result = await uploadFile(file);
    if (result) {
      form.setValue("profileImage", result.objectPath);
    }
  };

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-6"><Skeleton className="h-40 w-full" /></div>;

  const displayImage = imagePreview || (profile?.profileImage ? profile.profileImage : null);
  const roleDisplay = profile?.role === 'racer' ? 'Driver' : profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Spectator";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold italic text-white mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your stats</p>
      </div>

      <div className="p-8 rounded-2xl bg-secondary/50 border border-white/5 flex items-center gap-6 flex-wrap">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
            {displayImage ? (
              <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-12 h-12" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
            <Upload className="w-4 h-4 text-white" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isUploadingImage}
            />
          </label>
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display italic text-white inline-flex items-center gap-2">
            {profile?.driverName || user?.firstName || "Set up your profile"}
            {profile?.id && <DriverIconsDisplay profileId={profile.id} size="md" />}
          </h2>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {profile?.adminLevel === 'super_admin' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-xs font-medium border border-purple-500/30 text-purple-400">
                <Crown className="w-3 h-3" /> 
                Super Admin
              </span>
            )}
            {profile?.adminLevel === 'admin' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-xs font-medium border border-yellow-500/30 text-yellow-400">
                <ShieldCheck className="w-3 h-3" /> 
                Admin
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium border border-white/10">
              <Shield className="w-3 h-3 text-primary" /> 
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-secondary/30 p-1 rounded-xl gap-1 flex-wrap h-auto" data-testid="profile-tabs">
          {isDriver && (
            <>
              <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-stats">
                <BarChart3 className="w-4 h-4 mr-2" /> Stats
              </TabsTrigger>
              <TabsTrigger value="badges" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-badges">
                <Award className="w-4 h-4 mr-2" /> Badges
              </TabsTrigger>
              {hasIcons && (
                <TabsTrigger value="icons" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-icons">
                  <Sparkles className="w-4 h-4 mr-2" /> Icons
                </TabsTrigger>
              )}
              <TabsTrigger value="goals" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-goals">
                <Target className="w-4 h-4 mr-2" /> Goals
              </TabsTrigger>
              <TabsTrigger value="h2h" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-h2h">
                <Swords className="w-4 h-4 mr-2" /> Head-to-Head
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-history">
                <Trophy className="w-4 h-4 mr-2" /> History
              </TabsTrigger>
              {hasTierHistory && (
                <TabsTrigger value="tier-history" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-tier-history">
                  <TrendingUp className="w-4 h-4 mr-2" /> Tier History
                </TabsTrigger>
              )}
            </>
          )}
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-settings">
            <UserCircle className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        {isDriver && profile && (
          <>
            <TabsContent value="stats" className="space-y-6 mt-6">
              <DriverStatsDashboard profile={profile} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-display italic">Recent Results</h3>
                  <RecentResults profile={profile} />
                </div>
                <CalendarSync />
              </div>
            </TabsContent>


            <TabsContent value="badges" className="mt-6">
              <BadgesSection profile={profile} isOwnProfile={true} />
            </TabsContent>

            {hasIcons && (
              <TabsContent value="icons" className="mt-6">
                <DriverIconsSection profile={profile} isOwnProfile={true} />
              </TabsContent>
            )}

            <TabsContent value="goals" className="mt-6">
              <SeasonGoals profile={profile} />
            </TabsContent>

            <TabsContent value="h2h" className="mt-6">
              <HeadToHead profile={profile} allProfiles={allProfiles || []} />
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
                          <Link key={i} href={`/races/${result.raceId}`} data-testid={`link-profile-race-${result.raceId}`}>
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
                  <p className="text-sm">Complete your first race to see results here!</p>
                </div>
              )}
            </TabsContent>

            {hasTierHistory && (
              <TabsContent value="tier-history" className="space-y-6 mt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-xl font-display font-bold italic text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Tier History
                  </h2>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" data-testid="button-delete-tier-history">
                          <Trash2 className="w-4 h-4 mr-2" /> Clear History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tier History</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all tier movement history for this driver. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => profile?.id && deleteTierHistory.mutate(profile.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete-tier-history"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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
                        data-testid={`tier-history-${item.movement.id}`}
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

        <TabsContent value="settings" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Account Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <label 
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            field.value === "driver" 
                              ? "border-primary bg-primary/10" 
                              : "border-white/10 bg-secondary/30 hover:border-white/20"
                          }`}
                        >
                          <RadioGroupItem value="driver" id="driver" className="sr-only" />
                          <Car className={`w-5 h-5 ${field.value === "driver" ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-bold">Driver</p>
                            <p className="text-xs text-muted-foreground">Participate in races</p>
                          </div>
                        </label>
                        <label 
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            field.value === "spectator" 
                              ? "border-primary bg-primary/10" 
                              : "border-white/10 bg-secondary/30 hover:border-white/20"
                          }`}
                        >
                          <RadioGroupItem value="spectator" id="spectator" className="sr-only" />
                          <Eye className={`w-5 h-5 ${field.value === "spectator" ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-bold">Spectator</p>
                            <p className="text-xs text-muted-foreground">View races and standings</p>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {accountType === "driver" && (
                <>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} className="bg-secondary/30" data-testid="input-fullname" />
                        </FormControl>
                        <FormDescription>Your real name (only visible to you and admins)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your racing name" {...field} className="bg-secondary/30" data-testid="input-drivername" />
                        </FormControl>
                        <FormDescription>Your public racing name shown on leaderboards</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold h-12 text-lg" disabled={updateProfile.isPending || isUploadingImage} data-testid="button-save-profile">
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
