import { useState } from "react";
import { useProfile, useAllProfiles, useAdminUpdateProfile, useCreateDriver, useDeleteProfile, useUpdateAdminLevel } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Users, Shield, Plus, Trash2, Crown, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  
  const isSuperAdmin = currentProfile?.adminLevel === 'super_admin';

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
  const spectators = profiles?.filter(p => p.role === 'spectator') || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold italic">Admin Panel</h1>
            <p className="text-muted-foreground">Manage Drivers and user roles</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-driver">
            <Plus className="w-4 h-4 mr-2" /> Create Driver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        <Card className="bg-secondary/30 border-white/5">
          <CardHeader>
            <CardTitle className="font-display italic">All Users</CardTitle>
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
                        <p className="font-bold">{profile.driverName || profile.fullName || "No name set"}</p>
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

        <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
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
      </div>
    </div>
  );
}
