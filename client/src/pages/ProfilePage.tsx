import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Shield, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm({
    resolver: zodResolver(insertProfileSchema.partial()),
    defaultValues: {
      bio: profile?.bio || "",
      kartNumber: profile?.kartNumber || "",
      // Role is readonly for user usually, managed by admin or preset
    },
    values: { // Use 'values' to react to data loading
      bio: profile?.bio || "",
      kartNumber: profile?.kartNumber || "",
    }
  });

  const onSubmit = (data: any) => {
    updateProfile.mutate(data);
  };

  if (isLoading) return <div className="max-w-2xl mx-auto space-y-6"><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold italic text-white mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your driver identity</p>
      </div>

      <div className="p-8 rounded-2xl bg-secondary/50 border border-white/5 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <UserCircle className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display italic text-white">{user?.firstName} {user?.lastName}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-4 mt-4">
             <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium border border-white/10">
               <Shield className="w-3 h-3 text-primary" /> 
               {profile?.role || "Spectator"}
             </span>
             {profile?.teamId && (
               <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium border border-white/10">
                 <Briefcase className="w-3 h-3 text-primary" /> 
                 Team ID: {profile.teamId}
               </span>
             )}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="kartNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kart / Racing Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 33" {...field} className="bg-secondary/30 font-display font-bold italic text-xl w-32" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about your racing experience..." 
                    {...field} 
                    className="bg-secondary/30 h-32" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold h-12 text-lg" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
