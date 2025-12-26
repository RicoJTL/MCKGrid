import { useLeagues, useCreateLeague } from "@/hooks/use-leagues";
import { Plus, Trophy, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeagueSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { format } from "date-fns";

export default function LeaguesPage() {
  const { data: leagues, isLoading } = useLeagues();
  const { data: profile } = useProfile();
  const createLeague = useCreateLeague();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const form = useForm({
    resolver: zodResolver(insertLeagueSchema),
    defaultValues: {
      name: "",
      description: "",
      seasonStart: new Date(),
    },
  });

  const onSubmit = (data: any) => {
    createLeague.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  if (isLoading) return <div className="text-center py-20 animate-pulse text-muted-foreground">Loading leagues...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">Leagues</h1>
          <p className="text-muted-foreground">Championship series and ongoing competitions</p>
        </div>

        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle className="font-display italic text-2xl">Create New League</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>League Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Winter Cup 2024" {...field} className="bg-secondary/50 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Details about this league..." {...field} className="bg-secondary/50 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold" disabled={createLeague.isPending}>
                    {createLeague.isPending ? "Starting Engine..." : "Create League"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues?.map((league) => (
          <Link key={league.id} href={`/leagues/${league.id}`}>
            <div className="group relative p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-24 h-24 rotate-12" />
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Trophy className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                
                <h3 className="text-xl font-bold font-display italic mb-2 group-hover:text-primary transition-colors">
                  {league.name}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 h-10">
                  {league.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {league.seasonStart ? format(new Date(league.seasonStart), 'MMM yyyy') : 'TBA'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 group-hover:text-primary transition-colors font-medium">
                    View Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
