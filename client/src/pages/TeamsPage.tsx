import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Team } from "@shared/schema";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";

function useTeams() {
  return useQuery({
    queryKey: [api.teams.list.path],
    queryFn: async () => {
      const res = await fetch(api.teams.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return api.teams.list.responses[200].parse(await res.json());
    },
  });
}

function useCreateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.teams.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return api.teams.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
      toast({ title: "Team Created" });
    }
  });
}

export default function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';

  const form = useForm({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: { name: "", code: "", logoUrl: "" }
  });

  const onSubmit = (data: any) => {
    createTeam.mutate(data, { onSuccess: () => setOpen(false) });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold italic text-white">Teams</h1>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold"><Plus className="mr-2 w-4 h-4"/> Create Team</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>New Team</DialogTitle>
                <DialogDescription className="sr-only">Create a new racing team</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField name="name" control={form.control} render={({field}) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                  )}/>
                   <FormField name="code" control={form.control} render={({field}) => (
                    <FormItem><FormLabel>Code (3 letters)</FormLabel><FormControl><Input {...field} maxLength={3} className="uppercase"/></FormControl><FormMessage/></FormItem>
                  )}/>
                  <Button type="submit" className="w-full bg-primary font-bold">Create</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams?.map(team => (
          <div key={team.id} className="p-6 rounded-2xl bg-secondary/30 border border-white/5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-bold font-display italic text-2xl text-primary border-2 border-primary/20">
              {team.code}
            </div>
            <div>
              <h3 className="text-xl font-bold font-display italic">{team.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Users className="w-3 h-3" /> 0 Members
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
