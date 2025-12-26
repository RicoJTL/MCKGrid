import { useLeague, useCompetitions, useCreateCompetition } from "@/hooks/use-leagues";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Flag, MapPin } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompetitionSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeagueDetails() {
  const [match, params] = useRoute("/leagues/:id");
  const leagueId = parseInt(params?.id || "0");
  const { data: league, isLoading: loadingLeague } = useLeague(leagueId);
  const { data: competitions, isLoading: loadingCompetitions } = useCompetitions(leagueId);
  const { data: profile } = useProfile();
  const createCompetition = useCreateCompetition();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const form = useForm({
    resolver: zodResolver(insertCompetitionSchema),
    defaultValues: {
      leagueId,
      name: "",
      type: "series",
      rules: { pointsSystem: {} }
    },
  });

  const onSubmit = (data: any) => {
    createCompetition.mutate({ ...data, leagueId }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  if (loadingLeague || loadingCompetitions) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  if (!league) return <div>League not found</div>;

  return (
    <div className="space-y-8">
      <Link href="/leagues">
        <div className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leagues
        </div>
      </Link>

      <div className="relative p-8 rounded-2xl bg-secondary border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-5xl font-display font-bold italic text-white mb-4">{league.name}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">{league.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold italic">Competitions</h2>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Add Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>New Competition</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competition Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Pro Series 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="series">Series</SelectItem>
                            <SelectItem value="single_event">Single Event</SelectItem>
                            <SelectItem value="time_attack">Time Attack</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary font-bold" disabled={createCompetition.isPending}>
                    Create Competition
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {competitions?.map((comp) => (
          <Link key={comp.id} href={`/competitions/${comp.id}`}>
            <div className="p-6 rounded-xl bg-secondary/30 border border-white/5 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display italic">{comp.name}</h3>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider text-xs">{comp.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                <ArrowLeft className="w-5 h-5 rotate-180 text-primary" />
              </div>
            </div>
          </Link>
        ))}
        {competitions?.length === 0 && (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-muted-foreground">
            No competitions found. Start one!
          </div>
        )}
      </div>
    </div>
  );
}
