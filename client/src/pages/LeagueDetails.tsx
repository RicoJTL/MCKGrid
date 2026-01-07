import { useLeague, useCompetitions, useCreateCompetition, useUpdateLeague, useDeleteLeague, useUpdateCompetition, useDeleteCompetition } from "@/hooks/use-leagues";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Flag, Pencil, Trash2, MoreVertical, Star, CheckCircle2, Circle, UserCheck } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Competition } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function LeagueDetails() {
  const [match, params] = useRoute("/leagues/:id");
  const leagueId = parseInt(params?.id || "0");
  const { data: league, isLoading: loadingLeague } = useLeague(leagueId);
  const { data: competitions, isLoading: loadingCompetitions } = useCompetitions(leagueId);
  const { data: profile } = useProfile();
  
  // Fetch the current user's enrolled competitions to show enrollment status
  const { data: enrolledCompetitions } = useQuery<Competition[]>({
    queryKey: ['/api/profiles', profile?.id, 'enrolled-competitions'],
    enabled: !!profile?.id,
  });
  
  // Create a set of enrolled competition IDs for quick lookup
  const enrolledCompetitionIds = new Set(enrolledCompetitions?.map(c => c.id) || []);
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
    updateLeague.mutate({ id: leagueId, data }, {
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
    updateCompetition.mutate({ id: editingComp.id, data }, {
      onSuccess: () => setEditingComp(null)
    });
  };

  const onDeleteComp = () => {
    if (!deletingComp) return;
    deleteCompetition.mutate({ id: deletingComp.id, leagueId }, {
      onSuccess: () => setDeletingComp(null)
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
          <div key={comp.id} className="p-6 rounded-xl bg-secondary/30 border border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group">
            <Link href={`/competitions/${comp.id}`}>
              <div className="flex items-center gap-4 cursor-pointer flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-display italic">{comp.name}</h3>
                    {comp.isMain && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                    {enrolledCompetitionIds.has(comp.id) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20" data-testid={`badge-enrolled-${comp.id}`}>
                        <UserCheck className="w-3 h-3" />
                        Enrolled
                      </span>
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

      {/* Edit League Dialog */}
      <Dialog open={openEditLeague} onOpenChange={setOpenEditLeague}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit League</DialogTitle>
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
