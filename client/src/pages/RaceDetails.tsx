import { useRace } from "@/hooks/use-leagues";
import { useResults, useSubmitResults } from "@/hooks/use-results";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Flag, Trophy, Clock, Save } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function RaceDetails() {
  const [match, params] = useRoute("/races/:id");
  const raceId = parseInt(params?.id || "0");
  const { data: race, isLoading: loadingRace } = useRace(raceId);
  const { data: results, isLoading: loadingResults } = useResults(raceId);
  const { data: profile } = useProfile();
  const submitResults = useSubmitResults();
  
  // State for admin editing
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = profile?.role === 'admin';

  if (loadingRace || loadingResults) return <Skeleton className="h-96 w-full" />;
  if (!race) return <div>Race not found</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-8 rounded-2xl bg-secondary border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
            <Flag className="w-4 h-4" /> {race.status}
          </div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">{race.name}</h1>
          <p className="text-muted-foreground">{format(new Date(race.date), "PPP")} • {race.location}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold italic flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Race Results
          </h2>
          {isAdmin && (
            <Button 
              onClick={() => setIsEditing(!isEditing)} 
              variant={isEditing ? "destructive" : "secondary"}
              className="font-bold"
            >
              {isEditing ? "Cancel Edit" : "Enter Results"}
            </Button>
          )}
        </div>

        {isEditing ? (
          <ResultsEditor raceId={raceId} existingResults={results || []} onCancel={() => setIsEditing(false)} />
        ) : (
          <div className="bg-secondary/30 rounded-xl border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[100px] text-white font-bold">Pos</TableHead>
                  <TableHead className="text-white font-bold">Driver</TableHead>
                  <TableHead className="text-white font-bold">Team</TableHead>
                  <TableHead className="text-right text-white font-bold">Best Lap</TableHead>
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
                    <TableCell>Driver Name (ID: {result.racerId})</TableCell>
                    <TableCell>Team Name</TableCell>
                    <TableCell className="text-right font-mono text-primary">{result.bestLapTime || "--:--"}</TableCell>
                    <TableCell className="text-right font-bold text-lg">{result.points}</TableCell>
                  </TableRow>
                ))}
                {(!results || results.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Race has not started yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsEditor({ raceId, existingResults, onCancel }: { raceId: number, existingResults: any[], onCancel: () => void }) {
  // Simplified editor - normally needs a way to select drivers. 
  // For demo, we assume we just input raw data or use existing mock profiles.
  // In a real app, this would be a dynamic form field array.
  
  // NOTE: This assumes there are users/profiles in the system to pick from.
  // We'll just show a "Not Implemented for Demo" placeholder or basic input fields if no profiles exist.
  
  return (
    <div className="p-8 bg-secondary/50 rounded-xl text-center border border-dashed border-white/20">
      <p className="mb-4">Result entry requires racer selection logic.</p>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
    </div>
  );
}
