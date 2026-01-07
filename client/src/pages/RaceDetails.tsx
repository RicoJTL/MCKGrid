import { useRace, useUpdateRace, useDeleteRace, useRaceCompetitions, useUpdateRaceCompetitions, useCompetitions } from "@/hooks/use-leagues";
import { useResults, useSubmitResults } from "@/hooks/use-results";
import { useRoute, Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Flag, Trophy, ArrowLeft, Plus, Trash2, Save, Pencil, MoreVertical, Check } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useEnrolledDrivers } from "@/hooks/use-enrollments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@shared/schema";

export default function RaceDetails() {
  const [match, params] = useRoute("/races/:id");
  const raceId = parseInt(params?.id || "0");
  const { data: race, isLoading: loadingRace } = useRace(raceId);
  const { data: raceCompetitions } = useRaceCompetitions(raceId);
  const { data: results, isLoading: loadingResults } = useResults(raceId);
  const { data: profiles } = useQuery<Profile[]>({ queryKey: ['/api/profiles'] });
  const { data: profile } = useProfile();
  const firstCompetitionId = raceCompetitions?.[0]?.id || 0;
  const { data: enrolledDrivers } = useEnrolledDrivers(firstCompetitionId);
  const { data: leagueCompetitions } = useCompetitions(race?.leagueId || 0);
  const updateRace = useUpdateRace();
  const updateRaceCompetitions = useUpdateRaceCompetitions();
  const deleteRace = useDeleteRace();
  const [, setLocation] = useLocation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [openEditRace, setOpenEditRace] = useState(false);
  const [deleteRaceOpen, setDeleteRaceOpen] = useState(false);
  const [selectedCompetitions, setSelectedCompetitions] = useState<number[]>([]);
  
  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';

  const editRaceForm = useForm({
    defaultValues: {
      name: "",
      location: "",
      date: new Date() as Date | string,
      status: "scheduled",
    },
  });

  const onUpdateRace = (data: any) => {
    updateRace.mutate({ id: raceId, data: { ...data, date: new Date(data.date) } }, {
      onSuccess: () => {
        // Also update competitions if changed
        const currentCompIds = raceCompetitions?.map(c => c.id) || [];
        const hasCompetitionChanges = selectedCompetitions.length !== currentCompIds.length ||
          selectedCompetitions.some(id => !currentCompIds.includes(id));
        
        if (hasCompetitionChanges && selectedCompetitions.length > 0) {
          updateRaceCompetitions.mutate({ raceId, competitionIds: selectedCompetitions });
        }
        setOpenEditRace(false);
      }
    });
  };

  const onDeleteRace = () => {
    if (!race) return;
    deleteRace.mutate({ id: raceId, leagueId: race.leagueId }, {
      onSuccess: () => setLocation(firstCompetitionId ? `/competitions/${firstCompetitionId}` : '/leagues')
    });
  };

  if (loadingRace || loadingResults) return <Skeleton className="h-96 w-full" />;
  if (!race) return <div>Race not found</div>;

  const getDriverName = (racerId: number) => {
    const driver = profiles?.find(p => p.id === racerId);
    return driver?.driverName || `Driver #${racerId}`;
  };

  return (
    <div className="space-y-8">
      <Link href={firstCompetitionId ? `/competitions/${firstCompetitionId}` : '/leagues'}>
        <div className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </div>
      </Link>

      <div className="flex items-center justify-between p-8 rounded-2xl bg-secondary border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
            <Flag className="w-4 h-4" /> {race.status}
          </div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">{race.name}</h1>
          <p className="text-muted-foreground">{format(new Date(race.date), "PPP 'at' p")} - {race.location}</p>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-10" data-testid="button-race-menu">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                editRaceForm.reset({ 
                  name: race.name, 
                  location: race.location, 
                  date: new Date(race.date).toISOString().slice(0, 16),
                  status: race.status 
                });
                setSelectedCompetitions(raceCompetitions?.map(c => c.id) || []);
                setOpenEditRace(true);
              }}>
                <Pencil className="w-4 h-4 mr-2" /> Edit Race
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteRaceOpen(true)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Race
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-display font-bold italic flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Race Results
          </h2>
          {isAdmin && (
            <Button 
              onClick={() => setIsEditing(!isEditing)} 
              variant={isEditing ? "destructive" : "secondary"}
              className="font-bold"
              data-testid="button-toggle-edit"
            >
              {isEditing ? "Cancel Edit" : "Enter Results"}
            </Button>
          )}
        </div>

        {isEditing ? (
          <ResultsEditor 
            raceId={raceId}
            competitionId={firstCompetitionId}
            existingResults={results || []} 
            profiles={enrolledDrivers || []}
            allProfiles={profiles || []}
            onCancel={() => setIsEditing(false)} 
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <div className="bg-secondary/30 rounded-xl border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[80px] text-white font-bold">Pos</TableHead>
                  <TableHead className="text-white font-bold">Driver</TableHead>
                  <TableHead className="text-white font-bold">Race Time</TableHead>
                  <TableHead className="text-right text-white font-bold">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.map((result) => (
                  <TableRow key={result.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-display font-bold text-lg italic">
                      {result.position === 1 ? <span className="text-yellow-500">1st</span> :
                       result.position === 2 ? <span className="text-gray-400">2nd</span> :
                       result.position === 3 ? <span className="text-amber-700">3rd</span> :
                       `${result.position}th`}
                    </TableCell>
                    <TableCell className="font-bold">{getDriverName(result.racerId)}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{result.raceTime || "--:--"}</TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary">{result.points}</TableCell>
                  </TableRow>
                ))}
                {(!results || results.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No results entered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Race Dialog */}
      <Dialog open={openEditRace} onOpenChange={setOpenEditRace}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Race</DialogTitle>
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
                      data-testid={`checkbox-competition-${comp.id}`}
                    >
                      <div 
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedCompetitions.includes(comp.id) 
                            ? 'bg-primary border-primary' 
                            : 'border-white/20'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCompetitions(prev => 
                            prev.includes(comp.id) 
                              ? prev.filter(id => id !== comp.id)
                              : [...prev, comp.id]
                          );
                        }}
                      >
                        {selectedCompetitions.includes(comp.id) && (
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
                {selectedCompetitions.length === 0 && (
                  <p className="text-sm text-destructive">Select at least one competition</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary font-bold" 
                disabled={updateRace.isPending || selectedCompetitions.length === 0}
              >
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Race Alert */}
      <AlertDialog open={deleteRaceOpen} onOpenChange={setDeleteRaceOpen}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Race?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{race.name}" and all its results. This action cannot be undone.
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

interface ResultEntry {
  racerId: string;
  position: string;
  raceTime: string;
  points: string;
}

function ResultsEditor({ 
  raceId,
  competitionId,
  existingResults, 
  profiles,
  allProfiles,
  onCancel, 
  onSave 
}: { 
  raceId: number;
  competitionId: number;
  existingResults: any[]; 
  profiles: Profile[];
  allProfiles: Profile[];
  onCancel: () => void; 
  onSave: () => void;
}) {
  const submitResults = useSubmitResults();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<ResultEntry[]>(() => {
    if (existingResults.length > 0) {
      return existingResults.map(r => ({
        racerId: String(r.racerId),
        position: String(r.position),
        raceTime: r.raceTime || "",
        points: String(r.points)
      }));
    }
    return [{ racerId: "", position: "1", raceTime: "", points: "25" }];
  });

  const addEntry = () => {
    const nextPos = entries.length + 1;
    const defaultPoints = nextPos === 1 ? 25 : nextPos === 2 ? 18 : nextPos === 3 ? 15 : 10;
    setEntries([...entries, { racerId: "", position: String(nextPos), raceTime: "", points: String(defaultPoints) }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ResultEntry, value: string) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleSave = () => {
    const resultsData = entries
      .filter(e => e.racerId)
      .map(e => ({
        racerId: parseInt(e.racerId),
        position: parseInt(e.position),
        raceTime: e.raceTime || null,
        points: parseInt(e.points)
      }));

    submitResults.mutate({ raceId, competitionId, results: resultsData }, {
      onSuccess: () => {
        toast({ title: "Results saved!" });
        onSave();
      },
      onError: () => {
        toast({ title: "Error saving results", variant: "destructive" });
      }
    });
  };

  // Merge enrolled drivers with any drivers from existing results (in case they were unenrolled)
  const existingRacerIds = new Set(existingResults.map(r => r.racerId));
  const enrolledIds = new Set(profiles.map(p => p.id));
  const unenrolledWithResults = allProfiles.filter(p => existingRacerIds.has(p.id) && !enrolledIds.has(p.id));
  const racers = [...profiles, ...unenrolledWithResults];
  
  // Helper to get driver name from allProfiles
  const getDriverName = (id: number) => {
    const driver = allProfiles.find(p => p.id === id);
    return driver?.driverName || driver?.fullName || `Driver ${id}`;
  };
  
  // Check if a driver is not enrolled (for visual indication)
  const isUnenrolled = (id: number) => !enrolledIds.has(id);

  return (
    <div className="p-6 bg-secondary/50 rounded-xl border border-white/10 space-y-4">
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <div className="w-12 text-center font-bold text-lg">P{entry.position}</div>
            <Select value={entry.racerId} onValueChange={(v) => updateEntry(i, 'racerId', v)}>
              <SelectTrigger className="flex-1 bg-secondary/30" data-testid={`select-driver-${i}`}>
                <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent>
                {racers.length === 0 ? (
                  <SelectItem value="no-drivers" disabled>No enrolled drivers</SelectItem>
                ) : (
                  racers.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.driverName || `Driver ${p.id}`}
                      {isUnenrolled(p.id) && " (not enrolled)"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Race Time" 
              value={entry.raceTime} 
              onChange={(e) => updateEntry(i, 'raceTime', e.target.value)}
              className="w-32 bg-secondary/30"
              data-testid={`input-racetime-${i}`}
            />
            <Input 
              placeholder="Points" 
              type="number"
              value={entry.points} 
              onChange={(e) => updateEntry(i, 'points', e.target.value)}
              className="w-20 bg-secondary/30"
              data-testid={`input-points-${i}`}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeEntry(i)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Button variant="outline" onClick={addEntry} data-testid="button-add-result">
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            className="bg-primary font-bold"
            disabled={submitResults.isPending}
            data-testid="button-save-results"
          >
            <Save className="w-4 h-4 mr-2" /> Save Results
          </Button>
        </div>
      </div>
    </div>
  );
}
