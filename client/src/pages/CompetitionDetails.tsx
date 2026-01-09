import { useRaces, useCreateRace, useCompetitionStandings, useCompetition, useUpdateCompetition, useDeleteCompetition, useUpdateRace, useDeleteRace, useCompetitions, useUpdateRaceCompetitions, useRaceCompetitions } from "@/hooks/use-leagues";
import { useTieredLeagueByCompetition, useTierStandings, type TieredLeagueWithTiers } from "@/hooks/use-tiered-leagues";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Calendar, MapPin, Flag, Trophy, Medal, Pencil, Trash2, MoreVertical, Users, Layers, Star, Check, Ban, ChevronUp, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useProfile } from "@/hooks/use-profile";
import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRaceSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { z } from "zod";
import { useAllProfiles } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DriverNameWithIcons, useDriverIconsMap } from "@/components/driver-icon-token";

export default function CompetitionDetails() {
  const [match, params] = useRoute("/competitions/:id");
  const compId = parseInt(params?.id || "0");
  const { data: competition } = useCompetition(compId);
  const { data: races, isLoading: racesLoading } = useRaces(compId);
  const { data: standings, isLoading: standingsLoading } = useCompetitionStandings(compId);
  const { data: profile } = useProfile();
  const { data: allProfiles, isLoading: profilesLoading } = useAllProfiles();
  const { data: tieredLeague } = useTieredLeagueByCompetition(compId);
  const { data: tierStandings, isLoading: tierStandingsLoading } = useTierStandings(tieredLeague?.id || 0);
  const createRace = useCreateRace();
  const updateCompetition = useUpdateCompetition();
  const deleteCompetition = useDeleteCompetition();
  const updateRace = useUpdateRace();
  const deleteRace = useDeleteRace();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const setMainCompetition = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/competitions/${id}/set-main`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions/main'] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', compId] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      if (competition?.leagueId) {
        queryClient.invalidateQueries({ queryKey: ['competitions', competition.leagueId] });
      }
    }
  });
  
  const [open, setOpen] = useState(false);
  const [openEditComp, setOpenEditComp] = useState(false);
  const [deleteCompOpen, setDeleteCompOpen] = useState(false);
  const [editingRace, setEditingRace] = useState<any>(null);
  const [deletingRace, setDeletingRace] = useState<any>(null);
  const [editSelectedCompetitions, setEditSelectedCompetitions] = useState<number[]>([]);
  
  // Handle tab switching via URL hash
  const getInitialTab = () => {
    if (typeof window !== 'undefined' && window.location.hash === '#drivers') return 'drivers';
    if (typeof window !== 'undefined' && window.location.hash === '#races') return 'races';
    if (typeof window !== 'undefined' && window.location.hash === '#tiers') return 'tiers';
    return 'standings';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#drivers') setActiveTab('drivers');
    else if (hash === '#races') setActiveTab('races');
    else if (hash === '#tiers') setActiveTab('tiers');
  }, []);
  
  const updateRaceCompetitions = useUpdateRaceCompetitions();
  const iconsMap = useDriverIconsMap();

  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';

  const raceFormSchema = insertRaceSchema.extend({
    date: z.coerce.date({ message: "Select a valid date & time" }),
    competitionIds: z.array(z.number()).min(1, "Select at least one competition"),
  });

  const form = useForm({
    resolver: zodResolver(raceFormSchema),
    defaultValues: {
      leagueId: competition?.leagueId || 0,
      name: "",
      location: "",
      date: new Date(),
      status: "scheduled" as const,
      competitionIds: [compId],
    },
  });
  
  const { data: leagueCompetitions } = useCompetitions(competition?.leagueId || 0);

  const compForm = useForm({
    defaultValues: {
      name: competition?.name || "",
      type: competition?.type || "series",
    },
  });

  const editRaceForm = useForm({
    defaultValues: {
      name: "",
      location: "",
      date: new Date() as Date | string,
      status: "scheduled",
    },
  });

  const onSubmit = (data: any) => {
    createRace.mutate({ 
      ...data, 
      leagueId: competition?.leagueId,
      date: new Date(data.date) 
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset({
          leagueId: competition?.leagueId || 0,
          name: "",
          location: "",
          date: new Date(),
          status: "scheduled" as const,
          competitionIds: [compId],
        });
      }
    });
  };

  const onUpdateComp = (data: any) => {
    updateCompetition.mutate({ id: compId, data }, {
      onSuccess: () => setOpenEditComp(false)
    });
  };

  const onDeleteComp = () => {
    if (!competition) return;
    deleteCompetition.mutate({ id: compId, leagueId: competition.leagueId }, {
      onSuccess: () => setLocation(`/leagues/${competition.leagueId}`)
    });
  };

  const onUpdateRace = (data: any) => {
    if (!editingRace) return;
    updateRace.mutate({ id: editingRace.id, data: { ...data, date: new Date(data.date) } }, {
      onSuccess: () => {
        // Update competitions if changed
        if (editSelectedCompetitions.length > 0) {
          updateRaceCompetitions.mutate({ raceId: editingRace.id, competitionIds: editSelectedCompetitions });
        }
        setEditingRace(null);
      }
    });
  };

  const onDeleteRace = () => {
    if (!deletingRace) return;
    deleteRace.mutate({ id: deletingRace.id, leagueId: deletingRace.leagueId }, {
      onSuccess: () => setDeletingRace(null)
    });
  };

  const upcomingRaces = races?.filter(r => r.status === 'scheduled') || [];
  const completedRaces = races?.filter(r => r.status === 'completed') || [];
  const cancelledRaces = races?.filter(r => r.status === 'cancelled') || [];

  if (racesLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-8">
      <button 
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            setLocation(competition ? `/leagues/${competition.leagueId}` : '/leagues');
          }
        }}
        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-display font-bold italic text-white">
              {competition?.name || 'Championship'}
            </h1>
            {competition?.isMain && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                <Star className="w-3 h-3 mr-1" /> Main Championship
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Season standings and race calendar</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-comp-menu">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    compForm.reset({ name: competition?.name || "", type: competition?.type || "series" });
                    setOpenEditComp(true);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Competition
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setMainCompetition.mutate(compId)}
                    disabled={setMainCompetition.isPending || competition?.isMain}
                  >
                    <Star className="w-4 h-4 mr-2" /> {competition?.isMain ? 'Main Competition' : 'Set as Main'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteCompOpen(true)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Competition
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Schedule Race
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Schedule New Race</DialogTitle>
                    <DialogDescription className="sr-only">Create a new race for this competition</DialogDescription>
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
                              <DateTimePicker
                                value={field.value instanceof Date ? field.value : new Date(field.value)}
                                onChange={(date) => field.onChange(date)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="competitionIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Competitions</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {leagueCompetitions?.map((comp: any) => (
                                  <label 
                                    key={comp.id} 
                                    className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(comp.id)}
                                      onChange={(e) => {
                                        const newValue = e.target.checked
                                          ? [...(field.value || []), comp.id]
                                          : (field.value || []).filter((id: number) => id !== comp.id);
                                        field.onChange(newValue);
                                      }}
                                      className="w-4 h-4 rounded border-border"
                                    />
                                    <span className="text-sm">{comp.name}</span>
                                    {comp.id === compId && (
                                      <Badge variant="secondary" className="text-xs">Current</Badge>
                                    )}
                                  </label>
                                ))}
                              </div>
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
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary/50 border border-white/5">
          <TabsTrigger value="standings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            League Table
          </TabsTrigger>
          <TabsTrigger value="races" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Races
          </TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Drivers
          </TabsTrigger>
          {tieredLeague && (
            <TabsTrigger value="tiers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Layers className="w-4 h-4 mr-2" />
              Tiers
            </TabsTrigger>
          )}
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
                        <Link href={`/profiles/${driver.racerId}`}>
                          <span className="font-bold hover:text-primary cursor-pointer transition-colors" data-testid={`link-driver-${driver.racerId}`}>
                            <DriverNameWithIcons 
                              profileId={driver.racerId} 
                              name={driver.driverName || 'Unknown Driver'} 
                              iconsMap={iconsMap}
                            />
                          </span>
                        </Link>
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
                  <div key={race.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-all">
                    <Link href={`/races/${race.id}`}>
                      <div className="flex items-center gap-5 cursor-pointer">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                          {race.date && isValid(new Date(race.date)) ? (
                            <>
                              <span className="text-lg font-bold font-display">{format(new Date(race.date), 'dd')}</span>
                              <span className="text-[10px] font-medium uppercase">{format(new Date(race.date), 'MMM')}</span>
                            </>
                          ) : (
                            <span className="text-xs">TBD</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-display italic mb-0.5">{race.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {race.location}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 md:mt-0 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
                        Scheduled
                      </span>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-race-menu-${race.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={async () => {
                              editRaceForm.reset({ 
                                name: race.name, 
                                location: race.location, 
                                date: race.date && isValid(new Date(race.date)) 
                                  ? new Date(race.date).toISOString().slice(0, 16)
                                  : '',
                                status: race.status 
                              });
                              // Fetch current competitions for this race
                              try {
                                const res = await fetch(`/api/races/${race.id}/competitions`, { credentials: "include" });
                                if (res.ok) {
                                  const comps = await res.json();
                                  setEditSelectedCompetitions(comps.map((c: any) => c.id));
                                } else {
                                  setEditSelectedCompetitions([compId]);
                                }
                              } catch {
                                setEditSelectedCompetitions([compId]);
                              }
                              setEditingRace(race);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingRace(race)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedRaces.length > 0 && (
            <div>
              <h3 className="text-lg font-display font-bold italic mb-4 text-muted-foreground">Completed Races</h3>
              <div className="space-y-3">
                {completedRaces.map((race) => (
                  <div key={race.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/10 transition-all opacity-75 hover:opacity-100">
                    <Link href={`/races/${race.id}`}>
                      <div className="flex items-center gap-5 cursor-pointer">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white/5">
                          {race.date && isValid(new Date(race.date)) ? (
                            <>
                              <span className="text-lg font-bold font-display">{format(new Date(race.date), 'dd')}</span>
                              <span className="text-[10px] font-medium uppercase">{format(new Date(race.date), 'MMM')}</span>
                            </>
                          ) : (
                            <span className="text-xs">TBD</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-display italic mb-0.5">{race.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {race.location}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 md:mt-0 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-muted-foreground border border-white/10">
                        Completed
                      </span>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-race-menu-${race.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={async () => {
                              editRaceForm.reset({ 
                                name: race.name, 
                                location: race.location, 
                                date: race.date && isValid(new Date(race.date)) 
                                  ? new Date(race.date).toISOString().slice(0, 16)
                                  : '',
                                status: race.status 
                              });
                              // Fetch current competitions for this race
                              try {
                                const res = await fetch(`/api/races/${race.id}/competitions`, { credentials: "include" });
                                if (res.ok) {
                                  const comps = await res.json();
                                  setEditSelectedCompetitions(comps.map((c: any) => c.id));
                                } else {
                                  setEditSelectedCompetitions([compId]);
                                }
                              } catch {
                                setEditSelectedCompetitions([compId]);
                              }
                              setEditingRace(race);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingRace(race)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Races - Admin Only */}
          {isAdmin && cancelledRaces.length > 0 && (
            <div>
              <h2 className="text-xl font-display font-bold italic mb-4 text-muted-foreground flex items-center gap-2">
                <Ban className="w-5 h-5" /> Cancelled Races ({cancelledRaces.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {cancelledRaces.map((race) => (
                  <div key={race.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/30 rounded-xl border border-white/5" data-testid={`race-card-cancelled-${race.id}`}>
                    <Link href={`/races/${race.id}`} className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-white/5 flex flex-col items-center justify-center">
                          {race.date && isValid(new Date(race.date)) ? (
                            <>
                              <span className="text-xs text-muted-foreground">{format(new Date(race.date), 'MMM')}</span>
                              <span className="text-lg font-bold">{format(new Date(race.date), 'd')}</span>
                            </>
                          ) : (
                            <span className="text-xs">TBD</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-display italic mb-0.5 line-through">{race.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {race.location}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 md:mt-0 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive border border-destructive/30">
                        Cancelled
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-race-menu-${race.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => {
                            editRaceForm.reset({ 
                              name: race.name, 
                              location: race.location, 
                              date: race.date && isValid(new Date(race.date)) 
                                ? new Date(race.date).toISOString().slice(0, 16)
                                : '',
                              status: race.status 
                            });
                            try {
                              const res = await fetch(`/api/races/${race.id}/competitions`, { credentials: "include" });
                              if (res.ok) {
                                const comps = await res.json();
                                setEditSelectedCompetitions(comps.map((c: any) => c.id));
                              } else {
                                setEditSelectedCompetitions([compId]);
                              }
                            } catch {
                              setEditSelectedCompetitions([compId]);
                            }
                            setEditingRace(race);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingRace(race)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
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

        <TabsContent value="drivers" className="mt-6">
          {profilesLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (() => {
            const driversFromStandings = standings?.map(s => ({
              id: s.racerId,
              name: s.driverName,
              points: s.points
            })) || [];

            return (
              <div className="space-y-6">
                <div id="competitors" className="rounded-xl bg-secondary/30 border border-white/5 overflow-hidden scroll-mt-4">
                  <div className="p-4 border-b border-white/5">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Competitors ({driversFromStandings.length})
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drivers are assigned to tiers in tiered leagues. Go to the league page to manage tier assignments.
                    </p>
                  </div>
                  {driversFromStandings.length > 0 ? (
                    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {driversFromStandings.map((driver) => (
                        <Link key={driver.id} href={`/profiles/${driver.id}`}>
                          <div 
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            data-testid={`competitor-${driver.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">
                                <DriverNameWithIcons 
                                  profileId={driver.id} 
                                  name={driver.name || 'Unknown'} 
                                  iconsMap={iconsMap}
                                />
                              </p>
                              <p className="text-sm text-muted-foreground">{driver.points} points</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No drivers have competed in this competition yet.</p>
                    </div>
                  )}
                </div>

                {isAdmin && competition?.leagueId && (
                  <div className="rounded-xl bg-secondary/30 border border-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-bold">Manage Tier Assignments</p>
                        <p className="text-sm text-muted-foreground">Assign drivers to tiers in the league settings</p>
                      </div>
                      <Link href={`/leagues/${competition.leagueId}`} className="ml-auto">
                        <Button size="sm" variant="outline" data-testid="button-manage-tiers">
                          <Layers className="w-4 h-4 mr-1" />
                          Go to League
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* Tiered League Standings Tab */}
        {tieredLeague && (
          <TabsContent value="tiers" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-xl font-bold font-display italic flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    {tieredLeague.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tieredLeague.driversPerTier} drivers per tier • Shuffle after {tieredLeague.racesBeforeShuffle} races
                  </p>
                </div>
                {isAdmin && competition?.leagueId && (
                  <Link href={`/leagues/${competition.leagueId}`}>
                    <Button size="sm" variant="outline" data-testid="button-manage-tiered-league">
                      <Layers className="w-4 h-4 mr-1" />
                      Manage Tiers
                    </Button>
                  </Link>
                )}
              </div>

              {tierStandingsLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : tierStandings && tierStandings.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {tierStandings.map((tier) => (
                    <div 
                      key={tier.tierNumber} 
                      className="rounded-xl bg-secondary/30 border border-white/5 overflow-hidden"
                      data-testid={`tier-standings-${tier.tierNumber}`}
                    >
                      <div className="p-4 bg-white/5 border-b border-white/5">
                        <h4 className="font-bold font-display italic text-lg flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            tier.tierNumber === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                            tier.tierNumber === 2 ? 'bg-blue-500/20 text-blue-400' :
                            tier.tierNumber === 3 ? 'bg-green-500/20 text-green-400' :
                            'bg-white/10 text-muted-foreground'
                          }`}>
                            {tier.tierName}
                          </div>
                          <span>{tier.tierName} Tier</span>
                        </h4>
                      </div>
                      <div className="divide-y divide-white/5">
                        {tier.standings.map((driver: any, index: number) => {
                          const isPromotionZone = index < (tieredLeague.promotionSpots || 0) && tier.tierNumber > 1;
                          const isRelegationZone = tier.standings.length > 0 && 
                            index >= tier.standings.length - (tieredLeague.relegationSpots || 0) && 
                            tier.tierNumber < (tieredLeague.numberOfTiers || 1);
                          
                          return (
                            <Link key={driver.profileId} href={`/profiles/${driver.profileId}`}>
                              <div 
                                className={`flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer ${
                                  isPromotionZone ? 'bg-green-500/10 border-l-2 border-green-500' :
                                  isRelegationZone ? 'bg-red-500/10 border-l-2 border-red-500' : ''
                                }`}
                                data-testid={`tier-driver-${driver.profileId}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-white/10">
                                    {index + 1}
                                  </div>
                                  <span className="font-medium">
                                    <DriverNameWithIcons 
                                      profileId={driver.profileId} 
                                      name={driver.driverName || 'Unknown'} 
                                      iconsMap={iconsMap}
                                    />
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-display text-primary">{driver.points}</span>
                                  <span className="text-xs text-muted-foreground">pts</span>
                                  {isPromotionZone && <ChevronUp className="w-4 h-4 text-green-500" />}
                                  {isRelegationZone && <ChevronDown className="w-4 h-4 text-red-500" />}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        {tier.standings.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No drivers assigned to this tier
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Layers className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No tier standings yet</p>
                  <p className="text-sm">Assign drivers to tiers to see standings!</p>
                </div>
              )}

              {/* Promotion/Relegation Legend */}
              {tierStandings && tierStandings.length > 1 && (
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Promotion zone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span>Relegation zone</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Competition Dialog */}
      <Dialog open={openEditComp} onOpenChange={setOpenEditComp}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
            <DialogDescription className="sr-only">Edit competition details</DialogDescription>
          </DialogHeader>
          <Form {...compForm}>
            <form onSubmit={compForm.handleSubmit(onUpdateComp)} className="space-y-4">
              <FormField
                control={compForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={compForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
              <Button type="submit" className="w-full bg-primary font-bold" disabled={updateCompetition.isPending}>
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Competition Alert */}
      <AlertDialog open={deleteCompOpen} onOpenChange={setDeleteCompOpen}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{competition?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteComp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Race Dialog */}
      <Dialog open={!!editingRace} onOpenChange={(open) => !open && setEditingRace(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Race</DialogTitle>
            <DialogDescription className="sr-only">Edit race details</DialogDescription>
          </DialogHeader>
          <Form {...editRaceForm}>
            <form onSubmit={editRaceForm.handleSubmit(onUpdateRace)} className="space-y-4">
              <FormField
                control={editRaceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRaceForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRaceForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : new Date())}
                        onChange={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRaceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Competitions</FormLabel>
                <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-white/10 p-2">
                  {leagueCompetitions?.map((comp: any) => (
                    <label 
                      key={comp.id} 
                      className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                      data-testid={`edit-checkbox-competition-${comp.id}`}
                    >
                      <div 
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          editSelectedCompetitions.includes(comp.id) 
                            ? 'bg-primary border-primary' 
                            : 'border-white/20'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setEditSelectedCompetitions(prev => 
                            prev.includes(comp.id) 
                              ? prev.filter(id => id !== comp.id)
                              : [...prev, comp.id]
                          );
                        }}
                      >
                        {editSelectedCompetitions.includes(comp.id) && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{comp.name}</span>
                      {comp.isMain && (
                        <span className="text-xs text-muted-foreground ml-auto">(Main)</span>
                      )}
                    </label>
                  ))}
                  {(!leagueCompetitions || leagueCompetitions.length === 0) && (
                    <p className="text-sm text-muted-foreground p-2">No competitions in this league</p>
                  )}
                </div>
                {editSelectedCompetitions.length === 0 && (
                  <p className="text-sm text-destructive">Select at least one competition</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary font-bold" 
                disabled={updateRace.isPending || editSelectedCompetitions.length === 0}
              >
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Race Alert */}
      <AlertDialog open={!!deletingRace} onOpenChange={(open) => !open && setDeletingRace(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Race?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingRace?.name}" and all its results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteRace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
