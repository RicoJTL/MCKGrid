import { useRaces, useCreateRace, useCompetitionStandings, useCompetition } from "@/hooks/use-leagues";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Calendar, MapPin, Flag, Trophy, Medal } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRaceSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitionDetails() {
  const [match, params] = useRoute("/competitions/:id");
  const compId = parseInt(params?.id || "0");
  const { data: competition } = useCompetition(compId);
  const { data: races, isLoading: racesLoading } = useRaces(compId);
  const { data: standings, isLoading: standingsLoading } = useCompetitionStandings(compId);
  const { data: profile } = useProfile();
  const createRace = useCreateRace();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const form = useForm({
    resolver: zodResolver(insertRaceSchema),
    defaultValues: {
      competitionId: compId,
      name: "",
      location: "",
      date: new Date().toISOString(),
      status: "scheduled"
    },
  });

  const onSubmit = (data: any) => {
    createRace.mutate({ 
      ...data, 
      competitionId: compId,
      date: new Date(data.date) 
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  const upcomingRaces = races?.filter(r => r.status === 'scheduled') || [];
  const completedRaces = races?.filter(r => r.status === 'completed') || [];

  if (racesLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-8">
      <Link href="#" onClick={() => history.back()}>
        <div className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </div>
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold italic text-white">
            {competition?.name || 'Championship'}
          </h1>
          <p className="text-muted-foreground mt-1">Season standings and race calendar</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Schedule Race
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Schedule New Race</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Round 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Track/Circuit Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} className="block w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary font-bold" disabled={createRace.isPending}>
                    Schedule Race
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="bg-secondary/50 border border-white/5">
          <TabsTrigger value="standings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            League Table
          </TabsTrigger>
          <TabsTrigger value="races" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Races
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-6">
          {standingsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : standings && standings.length > 0 ? (
            <div className="rounded-xl bg-secondary/30 border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-4 font-display italic text-sm text-muted-foreground">Pos</th>
                    <th className="text-left p-4 font-display italic text-sm text-muted-foreground">Driver</th>
                    <th className="text-center p-4 font-display italic text-sm text-muted-foreground">Points</th>
                    <th className="text-center p-4 font-display italic text-sm text-muted-foreground">Podiums</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((driver: any, index: number) => (
                    <tr 
                      key={driver.racerId} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      data-testid={`standing-row-${driver.racerId}`}
                    >
                      <td className="p-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-display ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-600/20 text-orange-400' :
                          'bg-white/10 text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold">{driver.driverName || driver.fullName || 'Unknown Driver'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-display font-bold text-xl text-primary">{driver.points}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Medal className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold">{driver.podiums}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Trophy className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No standings yet</p>
              <p className="text-sm">Complete some races to see the league table!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="races" className="mt-6 space-y-6">
          {upcomingRaces.length > 0 && (
            <div>
              <h3 className="text-lg font-display font-bold italic mb-4 text-primary">Upcoming Races</h3>
              <div className="space-y-3">
                {upcomingRaces.map((race) => (
                  <Link key={race.id} href={`/races/${race.id}`}>
                    <div className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="text-lg font-bold font-display">{format(new Date(race.date), 'dd')}</span>
                          <span className="text-[10px] font-medium uppercase">{format(new Date(race.date), 'MMM')}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-display italic mb-0.5">{race.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {race.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {completedRaces.length > 0 && (
            <div>
              <h3 className="text-lg font-display font-bold italic mb-4 text-muted-foreground">Completed Races</h3>
              <div className="space-y-3">
                {completedRaces.map((race) => (
                  <Link key={race.id} href={`/races/${race.id}`}>
                    <div className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/10 transition-all cursor-pointer opacity-75 hover:opacity-100">
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white/5">
                          <span className="text-lg font-bold font-display">{format(new Date(race.date), 'dd')}</span>
                          <span className="text-[10px] font-medium uppercase">{format(new Date(race.date), 'MMM')}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-display italic mb-0.5">{race.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {race.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-muted-foreground border border-white/10">
                          Completed
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {races?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Calendar className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No races scheduled</p>
              <p className="text-sm">Schedule races to build your championship calendar!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
