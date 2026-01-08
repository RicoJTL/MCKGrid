import { useState } from "react";
import { Link } from "wouter";
import { useProfile, useAllProfiles, useAdminUpdateProfile, useCreateDriver, useDeleteProfile, useUpdateAdminLevel } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Users, Shield, Plus, Trash2, Crown, ShieldCheck, Camera, Award, Gift, Check, X } from "lucide-react";
import { getBadgeIcon } from "@/components/badge-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUpload } from "@/hooks/use-upload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getIconComponent } from "@/components/icon-picker";
import type { Badge as BadgeType, Profile } from "@shared/schema";

const driverSchema = z.object({
  driverName: z.string().min(1, "Driver name is required"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["racer", "spectator"]),
});

const getRoleDisplay = (role: string) => {
  if (role === 'racer') return 'Driver';
  if (role === 'admin') return 'Driver';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getRoleBadgeStyles = (role: string) => {
  switch (role) {
    case 'admin':
    case 'racer':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'spectator':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return '';
  }
};

const getAdminBadgeStyles = (adminLevel: string) => {
  switch (adminLevel) {
    case 'super_admin':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'admin':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return '';
  }
};

const BADGE_CATEGORY_LABELS: Record<string, string> = {
  getting_started: "Getting Started",
  milestones: "Milestones",
  race_highlights: "Race Highlights",
  hot_streaks: "Hot Streaks",
  season_heroes: "Season Heroes",
  legends: "Legends",
};

const BADGE_CATEGORY_ORDER = [
  "getting_started",
  "milestones",
  "race_highlights",
  "hot_streaks",
  "season_heroes",
  "legends",
];

const getAdminLevelDisplay = (adminLevel: string) => {
  switch (adminLevel) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    default:
      return null;
  }
};

function BadgeAwardList({ 
  badge, 
  drivers, 
  onAward, 
  onRevoke, 
  isAwarding, 
  isRevoking 
}: { 
  badge: BadgeType;
  drivers: Profile[];
  onAward: (profileId: number) => void;
  onRevoke: (profileId: number) => void;
  isAwarding: boolean;
  isRevoking: boolean;
}) {
  const { data: allProfileBadges, isLoading } = useQuery<{ profileId: number; badgeId: number }[]>({
    queryKey: ['/api/badges', badge.id, 'profiles'],
  });
  
  const driverBadgeMap = new Map<number, boolean>();
  if (allProfileBadges) {
    allProfileBadges.forEach(pb => driverBadgeMap.set(pb.profileId, true));
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Drivers</label>
      <div className="max-h-72 overflow-y-auto space-y-2 rounded-lg border border-white/10 p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          drivers.map((driver) => {
            const hasBadge = driverBadgeMap.get(driver.id) || false;
            
            return (
              <div
                key={driver.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  hasBadge ? 'bg-green-500/10 border border-green-500/30' : 'bg-secondary/30'
                }`}
                data-testid={`driver-badge-row-${driver.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={driver.profileImage || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {(driver.driverName || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{driver.driverName || driver.fullName}</p>
                    {hasBadge && (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Has badge
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {hasBadge ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-400/30"
                      onClick={() => onRevoke(driver.id)}
                      disabled={isRevoking}
                      data-testid={`button-revoke-from-${driver.id}`}
                    >
                      <X className="w-4 h-4 mr-1" /> Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onAward(driver.id)}
                      disabled={isAwarding}
                      data-testid={`button-award-to-${driver.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" /> Award
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { data: currentProfile } = useProfile();
  const { data: profiles, isLoading } = useAllProfiles();
  const updateProfile = useAdminUpdateProfile();
  const createDriver = useCreateDriver();
  const deleteProfile = useDeleteProfile();
  const updateAdminLevel = useUpdateAdminLevel();
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { uploadFile, isUploading } = useUpload();
  const queryClient = useQueryClient();
  
  const [showAwardBadge, setShowAwardBadge] = useState(false);
  const [selectedBadgeForAward, setSelectedBadgeForAward] = useState<BadgeType | null>(null);
  
  const { data: badges } = useQuery<BadgeType[]>({
    queryKey: ['/api/badges'],
  });
  
  const isSuperAdmin = currentProfile?.adminLevel === 'super_admin';
  
  const updateProfileImage = useMutation({
    mutationFn: async ({ id, profileImage }: { id: number; profileImage: string }) => {
      await apiRequest("PATCH", `/api/profiles/${id}/profile-image`, { profileImage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
    }
  });

  const awardBadgeMutation = useMutation({
    mutationFn: async ({ profileId, badgeId }: { profileId: number; badgeId: number }) => {
      return apiRequest("POST", `/api/profiles/${profileId}/badges/${badgeId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', variables.profileId, 'badges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges', variables.badgeId, 'profiles'] });
    }
  });

  const revokeBadgeMutation = useMutation({
    mutationFn: async ({ profileId, badgeId }: { profileId: number; badgeId: number }) => {
      return apiRequest("DELETE", `/api/profiles/${profileId}/badges/${badgeId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', variables.profileId, 'badges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges', variables.badgeId, 'profiles'] });
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, profileId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    
    const result = await uploadFile(file);
    if (result) {
      updateProfileImage.mutate({ id: profileId, profileImage: result.objectPath });
    }
  };

  const editForm = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      driverName: "",
      fullName: "",
      role: "racer",
    },
  });

  const createForm = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      driverName: "",
      fullName: "",
      role: "racer",
    },
  });

  const onEditDriver = (data: z.infer<typeof driverSchema>) => {
    if (!editingProfile) return;
    updateProfile.mutate({ id: editingProfile.id, data }, {
      onSuccess: () => {
        setEditingProfile(null);
        editForm.reset();
      }
    });
  };

  const onCreateDriver = (data: z.infer<typeof driverSchema>) => {
    createDriver.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
        createForm.reset();
      }
    });
  };

  const onDeleteProfile = () => {
    if (!deleteConfirmProfile) return;
    deleteProfile.mutate(deleteConfirmProfile.id, {
      onSuccess: () => {
        setDeleteConfirmProfile(null);
      }
    });
  };

  const admins = profiles?.filter(p => p.adminLevel === 'admin' || p.adminLevel === 'super_admin') || [];
  const drivers = profiles?.filter(p => p.role === 'racer') || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold italic">Admin Panel</h1>
            <p className="text-muted-foreground">Manage Drivers, Badges, and user roles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-secondary/30 border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profiles?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30 border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{drivers.length}</p>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30 border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{admins.length}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/30 border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{badges?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start bg-secondary/30 p-1 rounded-xl gap-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-badges">
              <Award className="w-4 h-4 mr-2" /> Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-secondary/30 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="font-display italic">All Users</CardTitle>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-driver">
                  <Plus className="w-4 h-4 mr-2" /> Create Driver
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : profiles && profiles.length > 0 ? (
                  <div className="space-y-3">
                    {profiles.map((profile) => (
                      <div 
                        key={profile.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        data-testid={`profile-row-${profile.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={profile.profileImage || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {(profile.driverName || profile.fullName || "?")[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/profiles/${profile.id}`}>
                              <p className="font-bold hover:text-primary cursor-pointer transition-colors">
                                {profile.driverName || profile.fullName || "No name set"}
                              </p>
                            </Link>
                            {profile.fullName && (
                              <p className="text-sm text-muted-foreground">{profile.fullName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {getAdminLevelDisplay(profile.adminLevel) && (
                            <Badge 
                              variant="secondary"
                              className={getAdminBadgeStyles(profile.adminLevel)}
                            >
                              {profile.adminLevel === 'super_admin' ? <Crown className="w-3 h-3 mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
                              {getAdminLevelDisplay(profile.adminLevel)}
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary"
                            className={getRoleBadgeStyles(profile.role)}
                          >
                            {getRoleDisplay(profile.role)}
                          </Badge>
                          {isSuperAdmin && profile.id !== currentProfile?.id && profile.adminLevel !== 'super_admin' && (
                            <Select 
                              value={profile.adminLevel}
                              onValueChange={(value) => updateAdminLevel.mutate({ id: profile.id, adminLevel: value as "none" | "admin" })}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-admin-level-${profile.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Admin</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              const roleValue = profile.role === 'admin' ? 'racer' : profile.role;
                              editForm.reset({
                                driverName: profile.driverName || "",
                                fullName: profile.fullName || "",
                                role: roleValue as "racer" | "spectator",
                              });
                              setEditingProfile(profile);
                            }}
                            data-testid={`button-edit-${profile.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => setDeleteConfirmProfile(profile)}
                            data-testid={`button-delete-${profile.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No users found</p>
                    <p className="text-sm mt-1">Users will appear here when they log in</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="mt-6 space-y-6">
            <Card className="bg-secondary/30 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="font-display italic">Manage Badges</CardTitle>
                <Button onClick={() => setShowAwardBadge(true)} disabled={!badges?.length} data-testid="button-award-badge">
                  <Gift className="w-4 h-4 mr-2" /> Award Badge to Driver
                </Button>
              </CardHeader>
              <CardContent>
                {badges && badges.length > 0 ? (
                  <div className="space-y-8">
                    {BADGE_CATEGORY_ORDER.map(category => {
                      const categoryBadges = badges.filter(b => b.category === category);
                      if (categoryBadges.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-4">
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-white/10 pb-2">
                            {BADGE_CATEGORY_LABELS[category] || category}
                          </h4>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {categoryBadges.map((badge) => {
                              const CustomIcon = getBadgeIcon(badge.iconName);
                              const FallbackIcon = getIconComponent(badge.iconName) || Award;
                              return (
                                <div
                                  key={badge.id}
                                  className="p-4 rounded-xl border flex items-start gap-3 cursor-pointer hover-elevate"
                                  style={{
                                    backgroundColor: `${badge.iconColor}10`,
                                    borderColor: `${badge.iconColor}30`,
                                  }}
                                  onClick={() => {
                                    setSelectedBadgeForAward(badge);
                                    setShowAwardBadge(true);
                                  }}
                                  data-testid={`badge-card-${badge.id}`}
                                >
                                  <div 
                                    className="p-2 rounded-lg flex-shrink-0"
                                    style={{ backgroundColor: `${badge.iconColor}20` }}
                                  >
                                    {CustomIcon ? (
                                      <CustomIcon className="w-6 h-6" style={{ color: badge.iconColor }} />
                                    ) : (
                                      <FallbackIcon className="w-6 h-6" style={{ color: badge.iconColor }} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm">{badge.name}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No badges available</p>
                    <p className="text-sm mt-1">Badges will be loaded automatically</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingProfile} onOpenChange={(open) => {
          if (!open) {
            setEditingProfile(null);
            setImagePreview(null);
          }
        }}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            
            {isSuperAdmin && editingProfile && (
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-white/10">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={imagePreview || editingProfile.profileImage || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {(editingProfile.driverName || editingProfile.fullName || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor={`profile-image-upload-${editingProfile.id}`}
                    className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </label>
                  <input
                    id={`profile-image-upload-${editingProfile.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, editingProfile.id)}
                    disabled={isUploading || updateProfileImage.isPending}
                  />
                </div>
                {(isUploading || updateProfileImage.isPending) && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
                <p className="text-sm text-muted-foreground">Click the camera icon to change profile picture</p>
              </div>
            )}
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditDriver)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Racing nickname" {...field} data-testid="input-edit-driver-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Real name" {...field} data-testid="input-edit-full-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="racer">Driver</SelectItem>
                          <SelectItem value="spectator">Spectator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary" disabled={updateProfile.isPending} data-testid="button-save-driver">
                  Save Changes
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Create Driver</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateDriver)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Racing nickname" {...field} data-testid="input-create-driver-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Real name" {...field} data-testid="input-create-full-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="racer">Driver</SelectItem>
                          <SelectItem value="spectator">Spectator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary" disabled={createDriver.isPending} data-testid="button-submit-create-driver">
                  Create Driver
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmProfile} onOpenChange={(open) => !open && setDeleteConfirmProfile(null)}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deleteConfirmProfile?.driverName || deleteConfirmProfile?.fullName || "this user"}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmProfile(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={onDeleteProfile}
                disabled={deleteProfile.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteProfile.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAwardBadge} onOpenChange={(open) => {
          if (!open) {
            setShowAwardBadge(false);
            setSelectedBadgeForAward(null);
          }
        }}>
          <DialogContent className="bg-card border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle>Award Badge to Drivers</DialogTitle>
              <DialogDescription>
                {selectedBadgeForAward 
                  ? `Manage "${selectedBadgeForAward.name}" badge assignments`
                  : "Select a badge first, then award or revoke from drivers"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Badge</label>
                <Select 
                  value={selectedBadgeForAward?.id?.toString() || ''} 
                  onValueChange={(v) => setSelectedBadgeForAward(badges?.find(b => b.id === Number(v)) || null)}
                >
                  <SelectTrigger data-testid="select-badge-to-award">
                    <SelectValue placeholder="Choose a badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_CATEGORY_ORDER.map(category => {
                      const categoryBadges = badges?.filter(b => b.category === category) || [];
                      if (categoryBadges.length === 0) return null;
                      return (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                            {BADGE_CATEGORY_LABELS[category]}
                          </div>
                          {categoryBadges.map((badge) => (
                            <SelectItem key={badge.id} value={badge.id.toString()}>
                              {badge.name}
                            </SelectItem>
                          ))}
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedBadgeForAward && (
                <BadgeAwardList 
                  badge={selectedBadgeForAward}
                  drivers={drivers}
                  onAward={(profileId) => awardBadgeMutation.mutate({ profileId, badgeId: selectedBadgeForAward.id })}
                  onRevoke={(profileId) => revokeBadgeMutation.mutate({ profileId, badgeId: selectedBadgeForAward.id })}
                  isAwarding={awardBadgeMutation.isPending}
                  isRevoking={revokeBadgeMutation.isPending}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
