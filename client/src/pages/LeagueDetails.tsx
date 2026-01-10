import { useLeague, useCompetitions, useCreateCompetition, useUpdateLeague, useDeleteLeague, useUpdateCompetition, useDeleteCompetition } from "@/hooks/use-leagues";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Flag, Pencil, Trash2, MoreVertical, Star, CheckCircle2, Circle, UserCheck, Layers, ChevronUp, ChevronDown, Users, X } from "lucide-react";
import { useProfile, useAllProfiles } from "@/hooks/use-profile";
import { useTieredLeagues, useCreateTieredLeague, useUpdateTieredLeague, useDeleteTieredLeague, useTierAssignments, useAssignDriverToTier, useRemoveDriverFromTier, useMoveDriverTier, type TieredLeagueWithTiers } from "@/hooks/use-tiered-leagues";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Competition } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompetitionSchema, insertLeagueSchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { IconPicker, getIconComponent, AVAILABLE_ICONS } from "@/components/icon-picker";
import { Trophy } from "lucide-react";

export default function LeagueDetails() {
  const [match, params] = useRoute("/leagues/:id");
  const leagueId = parseInt(params?.id || "0");
  const { data: league, isLoading: loadingLeague } = useLeague(leagueId);
  const { data: competitions, isLoading: loadingCompetitions } = useCompetitions(leagueId);
  const { data: profile } = useProfile();
  
  const createCompetition = useCreateCompetition();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();
  const updateCompetition = useUpdateCompetition();
  const deleteCompetition = useDeleteCompetition();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const setMainLeague = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/leagues/${id}/set-main`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leagues/main'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leagues', leagueId] });
      queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
    }
  });
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openEditLeague, setOpenEditLeague] = useState(false);
  const [deleteLeagueOpen, setDeleteLeagueOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [deletingComp, setDeletingComp] = useState<any>(null);
  
  const [leagueIconName, setLeagueIconName] = useState(league?.iconName || "Trophy");
  const [leagueIconColor, setLeagueIconColor] = useState(league?.iconColor || "#3b82f6");
  const [compIconName, setCompIconName] = useState("Flag");
  const [compIconColor, setCompIconColor] = useState("#3b82f6");
  
  // Tiered league state
  const [openCreateTieredLeague, setOpenCreateTieredLeague] = useState(false);
  const [editingTieredLeague, setEditingTieredLeague] = useState<TieredLeagueWithTiers | null>(null);
  const [deletingTieredLeague, setDeletingTieredLeague] = useState<TieredLeagueWithTiers | null>(null);
  const [managingTieredLeague, setManagingTieredLeague] = useState<TieredLeagueWithTiers | null>(null);
  
  // Tiered league form state
  const [tieredLeagueName, setTieredLeagueName] = useState("");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);
  const [numberOfTiers, setNumberOfTiers] = useState(4);
  const [driversPerTier, setDriversPerTier] = useState(4);
  const [racesBeforeShuffle, setRacesBeforeShuffle] = useState(3);
  const [promotionSpots, setPromotionSpots] = useState(1);
  const [relegationSpots, setRelegationSpots] = useState(1);
  const [tierNames, setTierNames] = useState<string[]>(["S Tier", "A Tier", "B Tier", "C Tier"]);
  const [tieredLeagueIconName, setTieredLeagueIconName] = useState("Layers");
  const [tieredLeagueIconColor, setTieredLeagueIconColor] = useState("#eab308");
  
  // Tiered league hooks
  const { data: tieredLeagues } = useTieredLeagues(leagueId);
  const { data: allProfiles } = useAllProfiles();
  const createTieredLeague = useCreateTieredLeague();
  const updateTieredLeague = useUpdateTieredLeague();
  const deleteTieredLeague = useDeleteTieredLeague();
  const assignDriverToTier = useAssignDriverToTier();
  const removeDriverFromTier = useRemoveDriverFromTier();
  const moveDriverTier = useMoveDriverTier();
  
  // Get assignments for the currently managed tiered league
  const { data: currentAssignments } = useTierAssignments(managingTieredLeague?.id || 0);

  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';

  const compForm = useForm({
    resolver: zodResolver(insertCompetitionSchema),
    defaultValues: {
      leagueId,
      name: "",
      type: "series",
      rules: { pointsSystem: {} }
    },
  });

  const leagueForm = useForm({
    defaultValues: {
      name: league?.name || "",
      description: league?.description || "",
    },
  });

  const editCompForm = useForm({
    defaultValues: {
      name: "",
      type: "series",
    },
  });

  const onSubmitComp = (data: any) => {
    createCompetition.mutate({ ...data, leagueId }, {
      onSuccess: () => {
        setOpenCreate(false);
        compForm.reset();
      }
    });
  };

  const onUpdateLeague = (data: any) => {
    updateLeague.mutate({ 
      id: leagueId, 
      data: { ...data, iconName: leagueIconName, iconColor: leagueIconColor } 
    }, {
      onSuccess: () => setOpenEditLeague(false)
    });
  };

  const onDeleteLeague = () => {
    deleteLeague.mutate(leagueId, {
      onSuccess: () => setLocation("/leagues")
    });
  };

  const onUpdateComp = (data: any) => {
    if (!editingComp) return;
    updateCompetition.mutate({ 
      id: editingComp.id, 
      data: { ...data, iconName: compIconName, iconColor: compIconColor } 
    }, {
      onSuccess: () => setEditingComp(null)
    });
  };

  const onDeleteComp = () => {
    if (!deletingComp) return;
    deleteCompetition.mutate({ id: deletingComp.id, leagueId }, {
      onSuccess: () => setDeletingComp(null)
    });
  };

  // Tiered league handlers
  const resetTieredLeagueForm = () => {
    setTieredLeagueName("");
    setSelectedCompetitionId(null);
    setNumberOfTiers(4);
    setDriversPerTier(4);
    setRacesBeforeShuffle(3);
    setPromotionSpots(1);
    setRelegationSpots(1);
    setTierNames(["S Tier", "A Tier", "B Tier", "C Tier"]);
    setTieredLeagueIconName("Layers");
    setTieredLeagueIconColor("#eab308");
  };

  const handleCreateTieredLeague = () => {
    if (!selectedCompetitionId || !tieredLeagueName) return;
    createTieredLeague.mutate({
      name: tieredLeagueName,
      leagueId,
      parentCompetitionId: selectedCompetitionId,
      numberOfTiers,
      driversPerTier,
      racesBeforeShuffle,
      promotionSpots,
      relegationSpots,
      tierNames: tierNames.slice(0, numberOfTiers),
      iconName: tieredLeagueIconName,
      iconColor: tieredLeagueIconColor,
    }, {
      onSuccess: () => {
        setOpenCreateTieredLeague(false);
        resetTieredLeagueForm();
      }
    });
  };

  const handleDeleteTieredLeague = () => {
    if (!deletingTieredLeague) return;
    deleteTieredLeague.mutate({ id: deletingTieredLeague.id, leagueId }, {
      onSuccess: () => setDeletingTieredLeague(null)
    });
  };

  const handleUpdateTieredLeague = () => {
    if (!editingTieredLeague || !tieredLeagueName) return;
    updateTieredLeague.mutate({
      id: editingTieredLeague.id,
      leagueId,
      data: {
        name: tieredLeagueName,
        numberOfTiers,
        driversPerTier,
        racesBeforeShuffle,
        promotionSpots,
        relegationSpots,
        tierNames: tierNames.slice(0, numberOfTiers),
        iconName: tieredLeagueIconName,
        iconColor: tieredLeagueIconColor,
      }
    }, {
      onSuccess: () => {
        setEditingTieredLeague(null);
        resetTieredLeagueForm();
      }
    });
  };

  const handleTierCountChange = (newCount: number) => {
    setNumberOfTiers(newCount);
    const defaultNames = ["S Tier", "A Tier", "B Tier", "C Tier", "D Tier", "E Tier", "F Tier", "G Tier"];
    if (newCount > tierNames.length) {
      setTierNames([...tierNames, ...defaultNames.slice(tierNames.length, newCount)]);
    } else {
      setTierNames(tierNames.slice(0, newCount));
    }
  };

  // Get drivers available for assignment (racers not already assigned)
  const availableDrivers = allProfiles?.filter(p => 
    p.role === 'racer' && 
    !currentAssignments?.some(a => a.profileId === p.id)
  ) || [];

  // Group assignments by tier
  const assignmentsByTier = managingTieredLeague?.tierNames?.map(tn => ({
    tierNumber: tn.tierNumber,
    tierName: tn.name,
    drivers: currentAssignments?.filter(a => a.tierNumber === tn.tierNumber).map(a => ({
      ...a,
      profile: allProfiles?.find(p => p.id === a.profileId)
    })) || []
  })) || [];

  if (loadingLeague || loadingCompetitions) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  if (!league) return <div>League not found</div>;

  return (
    <div className="space-y-8">
      <button 
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            setLocation('/leagues');
          }
        }}
        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="relative p-8 rounded-2xl bg-secondary border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-5xl font-display font-bold italic text-white mb-4 flex items-center gap-3 flex-wrap">
              {league.name}
              {league.isMain && (
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              )}
              <Badge variant={league.status === 'completed' ? 'secondary' : 'default'} className="text-sm">
                {league.status === 'completed' ? 'Completed' : 'Active'}
              </Badge>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">{league.description}</p>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-league-menu">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  leagueForm.reset({ name: league.name, description: league.description || "" });
                  setOpenEditLeague(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit League
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setMainLeague.mutate(leagueId)}
                  disabled={setMainLeague.isPending || league?.isMain}
                >
                  <Star className="w-4 h-4 mr-2" /> {league?.isMain ? 'Main League' : 'Set as Main League'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateLeague.mutate({ id: leagueId, data: { status: league.status === 'active' ? 'completed' : 'active' } })}
                >
                  {league.status === 'active' ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed</>
                  ) : (
                    <><Circle className="w-4 h-4 mr-2" /> Mark Active</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteLeagueOpen(true)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete League
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-display font-bold italic">Competitions</h2>
        {isAdmin && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Add Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>New Competition</DialogTitle>
                <DialogDescription className="sr-only">Create a new competition in this league</DialogDescription>
              </DialogHeader>
              <Form {...compForm}>
                <form onSubmit={compForm.handleSubmit(onSubmitComp)} className="space-y-4">
                  <FormField
                    control={compForm.control}
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
                    control={compForm.control}
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
                            <SelectItem value="head_to_head">Head to Head</SelectItem>
                            <SelectItem value="time_attack">Time Attack</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {field.value === "series" && "Multiple races, points accumulate across the season"}
                          {field.value === "single_event" && "Standalone race, no championship points"}
                          {field.value === "head_to_head" && "Tournament bracket, winner advances"}
                          {field.value === "time_attack" && "Fastest individual lap time wins"}
                        </FormDescription>
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
          <div key={comp.id} className="p-6 rounded-xl bg-secondary/30 border border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group">
            <Link href={`/competitions/${comp.id}`}>
              <div className="flex items-center gap-4 cursor-pointer flex-1">
                {(() => {
                  const CompIcon = getIconComponent(comp.iconName) || Flag;
                  const iconColor = comp.iconColor || "#3b82f6";
                  return (
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${iconColor}20` }}
                    >
                      <CompIcon className="w-5 h-5" style={{ color: iconColor }} />
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-display italic">{comp.name}</h3>
                    {comp.isMain && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider text-xs">{comp.type.replace('_', ' ')}</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-comp-menu-${comp.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      editCompForm.reset({ name: comp.name, type: comp.type });
                      setCompIconName(comp.iconName || "Flag");
                      setCompIconColor(comp.iconColor || "#3b82f6");
                      setEditingComp(comp);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeletingComp(comp)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Link href={`/competitions/${comp.id}`}>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="w-5 h-5 rotate-180 text-primary" />
                </div>
              </Link>
            </div>
          </div>
        ))}
        {competitions?.length === 0 && (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-muted-foreground">
            No competitions found. Start one!
          </div>
        )}
      </div>

      {/* Tiered Leagues Section - Admin Only */}
      {isAdmin && (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-display font-bold italic flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              Tiered Leagues
            </h2>
            <Dialog open={openCreateTieredLeague} onOpenChange={(open) => {
              if (!open) resetTieredLeagueForm();
              setOpenCreateTieredLeague(open);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 font-bold" data-testid="button-create-tiered-league">
                  <Plus className="w-4 h-4 mr-2" /> Create Tiered League
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Tiered League</DialogTitle>
                  <DialogDescription>Configure tiers with promotion and relegation mechanics</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input 
                      placeholder="e.g. Pro Division" 
                      value={tieredLeagueName}
                      onChange={(e) => setTieredLeagueName(e.target.value)}
                      data-testid="input-tiered-league-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Parent Competition</label>
                    <Select 
                      value={selectedCompetitionId?.toString() || ""} 
                      onValueChange={(v) => setSelectedCompetitionId(parseInt(v))}
                    >
                      <SelectTrigger data-testid="select-parent-competition">
                        <SelectValue placeholder="Select competition..." />
                      </SelectTrigger>
                      <SelectContent>
                        {competitions?.map(comp => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>{comp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Points from this competition determine tier standings</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Tiers</label>
                      <Select value={numberOfTiers.toString()} onValueChange={(v) => handleTierCountChange(parseInt(v))}>
                        <SelectTrigger data-testid="select-number-of-tiers">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n} Tiers</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Drivers per Tier</label>
                      <Select value={driversPerTier.toString()} onValueChange={(v) => setDriversPerTier(parseInt(v))}>
                        <SelectTrigger data-testid="select-drivers-per-tier">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n} Drivers</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Races Before Shuffle</label>
                      <Select value={racesBeforeShuffle.toString()} onValueChange={(v) => setRacesBeforeShuffle(parseInt(v))}>
                        <SelectTrigger data-testid="select-races-before-shuffle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Promotion Spots</label>
                      <Select value={promotionSpots.toString()} onValueChange={(v) => setPromotionSpots(parseInt(v))}>
                        <SelectTrigger data-testid="select-promotion-spots">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Relegation Spots</label>
                      <Select value={relegationSpots.toString()} onValueChange={(v) => setRelegationSpots(parseInt(v))}>
                        <SelectTrigger data-testid="select-relegation-spots">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tier Names</label>
                    <div className="space-y-2">
                      {tierNames.slice(0, numberOfTiers).map((name, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge variant="outline" className="w-8 justify-center">{i + 1}</Badge>
                          <Input 
                            value={name}
                            onChange={(e) => {
                              const newNames = [...tierNames];
                              newNames[i] = e.target.value;
                              setTierNames(newNames);
                            }}
                            placeholder={`Tier ${i + 1} name`}
                            data-testid={`input-tier-name-${i}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <IconPicker
                    selectedIcon={tieredLeagueIconName}
                    selectedColor={tieredLeagueIconColor}
                    onIconChange={setTieredLeagueIconName}
                    onColorChange={setTieredLeagueIconColor}
                  />
                  <Button 
                    onClick={handleCreateTieredLeague} 
                    className="w-full bg-primary font-bold" 
                    disabled={createTieredLeague.isPending || !tieredLeagueName || !selectedCompetitionId}
                    data-testid="button-submit-tiered-league"
                  >
                    Create Tiered League
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tiered Leagues Grid */}
          <div className="grid grid-cols-1 gap-4">
            {tieredLeagues?.map((tl) => {
              const parentComp = competitions?.find(c => c.id === tl.parentCompetitionId);
              return (
                <div key={tl.id} className="p-6 rounded-xl bg-secondary/30 border border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${tl.iconColor || "#eab308"}20` }}
                      >
                        {(() => {
                          const IconComponent = getIconComponent(tl.iconName || "Layers");
                          return <IconComponent className="w-6 h-6" style={{ color: tl.iconColor || "#eab308" }} />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-display italic">{tl.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tl.numberOfTiers} tiers, {tl.driversPerTier} drivers each | Shuffle after {tl.racesBeforeShuffle} races
                        </p>
                        {parentComp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on: {parentComp.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setManagingTieredLeague(tl)}
                        data-testid={`button-manage-tiers-${tl.id}`}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Manage Drivers
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-tiered-league-menu-${tl.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingTieredLeague(tl);
                            setTieredLeagueName(tl.name);
                            setSelectedCompetitionId(tl.parentCompetitionId);
                            setNumberOfTiers(tl.numberOfTiers);
                            setDriversPerTier(tl.driversPerTier);
                            setRacesBeforeShuffle(tl.racesBeforeShuffle);
                            setPromotionSpots(tl.promotionSpots);
                            setRelegationSpots(tl.relegationSpots);
                            setTierNames(tl.tierNames?.sort((a, b) => a.tierNumber - b.tierNumber).map(t => t.name) || []);
                            setTieredLeagueIconName(tl.iconName || "Layers");
                            setTieredLeagueIconColor(tl.iconColor || "#eab308");
                          }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingTieredLeague(tl)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {/* Show tier breakdown */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tl.tierNames?.sort((a, b) => a.tierNumber - b.tierNumber).map(tn => (
                      <Badge key={tn.id} variant="secondary" className="text-xs">
                        {tn.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
            {(!tieredLeagues || tieredLeagues.length === 0) && (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tiered leagues configured</p>
                <p className="text-sm">Create a tiered league to organize drivers into skill-based tiers</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Manage Drivers Dialog */}
      <Dialog open={!!managingTieredLeague} onOpenChange={(open) => !open && setManagingTieredLeague(null)}>
        <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {managingTieredLeague?.name} - Driver Assignments
            </DialogTitle>
            <DialogDescription>Click on a driver to assign them to a tier. Click on assigned drivers for options to promote, relegate, or remove.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Available Drivers */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Drivers ({availableDrivers.length})
              </h4>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/30 border border-white/5 min-h-[60px]">
                {availableDrivers.length > 0 ? (
                  availableDrivers.map(driver => (
                    <div key={driver.id} className="flex items-center gap-1 bg-background/50 rounded-md p-1 pr-2 border border-white/10">
                      <span className="text-sm font-medium px-2">{driver.driverName || driver.fullName}</span>
                      <div className="flex gap-1">
                        {managingTieredLeague?.tierNames?.sort((a, b) => a.tierNumber - b.tierNumber).map(tn => (
                          <Button
                            key={tn.tierNumber}
                            size="sm"
                            variant="outline"
                            onClick={() => assignDriverToTier.mutate({
                              tieredLeagueId: managingTieredLeague.id,
                              profileId: driver.id,
                              tierNumber: tn.tierNumber
                            })}
                            data-testid={`button-assign-${driver.id}-tier-${tn.tierNumber}`}
                          >
                            {tn.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">All drivers are assigned to tiers</p>
                )}
              </div>
            </div>

            {/* Tier Groups */}
            {assignmentsByTier.map((tier, tierIndex) => (
              <div key={tier.tierNumber} className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">{tier.tierName}</Badge>
                  <span className="text-muted-foreground">({tier.drivers.length} / {managingTieredLeague?.driversPerTier})</span>
                </h4>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/30 border border-white/5 min-h-[60px]">
                  {tier.drivers.length > 0 ? (
                    tier.drivers.map(assignment => {
                      const canPromote = tierIndex > 0;
                      const canRelegate = tierIndex < assignmentsByTier.length - 1;
                      const promoteTier = canPromote ? assignmentsByTier[tierIndex - 1] : null;
                      const relegateTier = canRelegate ? assignmentsByTier[tierIndex + 1] : null;
                      
                      return (
                        <DropdownMenu key={assignment.id}>
                          <DropdownMenuTrigger asChild>
                            <button 
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-transparent bg-secondary text-secondary-foreground text-xs font-semibold cursor-pointer hover:bg-secondary/80 transition-colors"
                              data-testid={`driver-badge-${assignment.profileId}`}
                            >
                              {assignment.profile?.driverName || assignment.profile?.fullName || 'Unknown'}
                              <MoreVertical className="w-3 h-3 ml-1" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent sideOffset={5}>
                            {canPromote && promoteTier && (
                              <DropdownMenuItem 
                                onClick={() => moveDriverTier.mutate({
                                  tieredLeagueId: managingTieredLeague!.id,
                                  profileId: assignment.profileId,
                                  newTierNumber: promoteTier.tierNumber
                                })}
                                data-testid={`button-promote-${assignment.profileId}`}
                              >
                                <ChevronUp className="w-4 h-4 mr-2 text-green-500" />
                                Promote to {promoteTier.tierName}
                              </DropdownMenuItem>
                            )}
                            {canRelegate && relegateTier && (
                              <DropdownMenuItem 
                                onClick={() => moveDriverTier.mutate({
                                  tieredLeagueId: managingTieredLeague!.id,
                                  profileId: assignment.profileId,
                                  newTierNumber: relegateTier.tierNumber
                                })}
                                data-testid={`button-relegate-${assignment.profileId}`}
                              >
                                <ChevronDown className="w-4 h-4 mr-2 text-orange-500" />
                                Relegate to {relegateTier.tierName}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => removeDriverFromTier.mutate({
                                tieredLeagueId: managingTieredLeague!.id,
                                profileId: assignment.profileId
                              })}
                              className="text-destructive"
                              data-testid={`button-remove-driver-${assignment.profileId}`}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove from Tier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No drivers in this tier</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Tiered League Alert */}
      <AlertDialog open={!!deletingTieredLeague} onOpenChange={(open) => !open && setDeletingTieredLeague(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tiered League?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingTieredLeague?.name}" and all tier assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTieredLeague} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Tiered League Dialog */}
      <Dialog open={!!editingTieredLeague} onOpenChange={(open) => {
        if (!open) {
          setEditingTieredLeague(null);
          resetTieredLeagueForm();
        }
      }}>
        <DialogContent className="bg-card border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tiered League</DialogTitle>
            <DialogDescription>Update tiered league configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input 
                placeholder="e.g. Pro Division" 
                value={tieredLeagueName}
                onChange={(e) => setTieredLeagueName(e.target.value)}
                data-testid="input-edit-tiered-league-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Parent Competition</label>
              <p className="text-sm p-2 rounded bg-secondary/50">
                {competitions?.find(c => c.id === selectedCompetitionId)?.name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">Parent competition cannot be changed after creation</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Tiers</label>
                <Select value={numberOfTiers.toString()} onValueChange={(v) => handleTierCountChange(parseInt(v))}>
                  <SelectTrigger data-testid="edit-select-number-of-tiers">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} Tiers</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Drivers per Tier</label>
                <Select value={driversPerTier.toString()} onValueChange={(v) => setDriversPerTier(parseInt(v))}>
                  <SelectTrigger data-testid="edit-select-drivers-per-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} Drivers</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Races Before Shuffle</label>
                <Select value={racesBeforeShuffle.toString()} onValueChange={(v) => setRacesBeforeShuffle(parseInt(v))}>
                  <SelectTrigger data-testid="edit-select-races-before-shuffle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Promotion Spots</label>
                <Select value={promotionSpots.toString()} onValueChange={(v) => setPromotionSpots(parseInt(v))}>
                  <SelectTrigger data-testid="edit-select-promotion-spots">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relegation Spots</label>
                <Select value={relegationSpots.toString()} onValueChange={(v) => setRelegationSpots(parseInt(v))}>
                  <SelectTrigger data-testid="edit-select-relegation-spots">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tier Names</label>
              <div className="space-y-2">
                {tierNames.slice(0, numberOfTiers).map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="w-8 justify-center">{i + 1}</Badge>
                    <Input 
                      value={name}
                      onChange={(e) => {
                        const newNames = [...tierNames];
                        newNames[i] = e.target.value;
                        setTierNames(newNames);
                      }}
                      placeholder={`Tier ${i + 1} name`}
                      data-testid={`edit-input-tier-name-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <IconPicker
              selectedIcon={tieredLeagueIconName}
              selectedColor={tieredLeagueIconColor}
              onIconChange={setTieredLeagueIconName}
              onColorChange={setTieredLeagueIconColor}
            />
            <Button 
              onClick={handleUpdateTieredLeague} 
              className="w-full bg-primary font-bold" 
              disabled={updateTieredLeague.isPending || !tieredLeagueName}
              data-testid="button-update-tiered-league"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit League Dialog */}
      <Dialog open={openEditLeague} onOpenChange={(open) => {
        if (open && league) {
          setLeagueIconName(league.iconName || "Trophy");
          setLeagueIconColor(league.iconColor || "#3b82f6");
        }
        setOpenEditLeague(open);
      }}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit League</DialogTitle>
            <DialogDescription className="sr-only">Edit league details</DialogDescription>
          </DialogHeader>
          <Form {...leagueForm}>
            <form onSubmit={leagueForm.handleSubmit(onUpdateLeague)} className="space-y-4">
              <FormField
                control={leagueForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>League Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leagueForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Icon & Color</FormLabel>
                <IconPicker 
                  value={leagueIconName} 
                  color={leagueIconColor}
                  onChange={(name, color) => {
                    setLeagueIconName(name);
                    setLeagueIconColor(color);
                  }}
                />
              </div>
              <Button type="submit" className="w-full bg-primary font-bold" disabled={updateLeague.isPending}>
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete League Alert */}
      <AlertDialog open={deleteLeagueOpen} onOpenChange={setDeleteLeagueOpen}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete League?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{league.name}" and all its competitions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteLeague} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Competition Dialog */}
      <Dialog open={!!editingComp} onOpenChange={(open) => !open && setEditingComp(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
            <DialogDescription className="sr-only">Edit competition details</DialogDescription>
          </DialogHeader>
          <Form {...editCompForm}>
            <form onSubmit={editCompForm.handleSubmit(onUpdateComp)} className="space-y-4">
              <FormField
                control={editCompForm.control}
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
                control={editCompForm.control}
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
                        <SelectItem value="head_to_head">Head to Head</SelectItem>
                        <SelectItem value="time_attack">Time Attack</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      {field.value === "series" && "Multiple races, points accumulate across the season"}
                      {field.value === "single_event" && "Standalone race, no championship points"}
                      {field.value === "head_to_head" && "Tournament bracket, winner advances"}
                      {field.value === "time_attack" && "Fastest individual lap time wins"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Icon & Color</FormLabel>
                <IconPicker 
                  value={compIconName} 
                  color={compIconColor}
                  onChange={(name, color) => {
                    setCompIconName(name);
                    setCompIconColor(color);
                  }}
                />
              </div>
              <Button type="submit" className="w-full bg-primary font-bold" disabled={updateCompetition.isPending}>
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Competition Alert */}
      <AlertDialog open={!!deletingComp} onOpenChange={(open) => !open && setDeletingComp(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingComp?.name}". This action cannot be undone.
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
    </div>
  );
}
