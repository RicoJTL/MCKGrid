import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type League, type Competition, type Race } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useLeagues() {
  return useQuery({
    queryKey: [api.leagues.list.path],
    queryFn: async () => {
      const res = await fetch(api.leagues.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leagues");
      return api.leagues.list.responses[200].parse(await res.json());
    },
  });
}

export function useLeague(id: number) {
  return useQuery({
    queryKey: [api.leagues.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.leagues.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch league");
      return api.leagues.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateLeague() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.leagues.create.input.parse(data);
      const res = await fetch(api.leagues.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create league");
      return api.leagues.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leagues.list.path] });
      toast({ title: "League Created", description: "Start your engines!" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

// Competitions
export function useCompetitions(leagueId: number) {
  return useQuery({
    queryKey: ['competitions', leagueId],
    queryFn: async () => {
      const url = buildUrl(api.competitions.list.path, { id: leagueId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch competitions");
      return api.competitions.list.responses[200].parse(await res.json());
    },
    enabled: !!leagueId,
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.competitions.create.input.parse(data);
      const res = await fetch(api.competitions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create competition");
      return api.competitions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['competitions', variables.leagueId] });
      toast({ title: "Competition Created", description: "Ready to race!" });
    },
  });
}

// Races
export function useRaces(competitionId: number) {
  return useQuery({
    queryKey: ['races', competitionId],
    queryFn: async () => {
      const url = buildUrl(api.races.list.path, { id: competitionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch races");
      return api.races.list.responses[200].parse(await res.json());
    },
    enabled: !!competitionId,
  });
}

export function useRace(id: number) {
  return useQuery({
    queryKey: [api.races.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.races.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch race");
      return api.races.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateRace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.races.create.input.parse(data);
      const res = await fetch(api.races.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create race");
      return api.races.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['races', variables.competitionId] });
      toast({ title: "Race Scheduled", description: "Date set!" });
    },
  });
}
