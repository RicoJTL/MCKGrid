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

// Update League
export function useUpdateLeague() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/leagues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update league");
      return await res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.leagues.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.leagues.get.path, id] });
      toast({ title: "League Updated" });
    },
  });
}

// Delete League
export function useDeleteLeague() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/leagues/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete league");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leagues.list.path] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast({ title: "League Deleted" });
    },
  });
}

// Update Competition
export function useUpdateCompetition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update competition");
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['competitions', result.leagueId] });
      queryClient.invalidateQueries({ queryKey: ['competition', result.id] });
      toast({ title: "Competition Updated" });
    },
  });
}

// Delete Competition
export function useDeleteCompetition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, leagueId }: { id: number; leagueId: number }) => {
      const res = await fetch(`/api/competitions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete competition");
      return { leagueId, id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['competitions', result.leagueId] });
      queryClient.invalidateQueries({ queryKey: ['competition', result.id] });
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast({ title: "Competition Deleted" });
    },
  });
}

// Update Race
export function useUpdateRace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/races/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update race");
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['races', result.competitionId] });
      queryClient.invalidateQueries({ queryKey: [api.races.get.path, result.id] });
      toast({ title: "Race Updated" });
    },
  });
}

// Delete Race
export function useDeleteRace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, competitionId }: { id: number; competitionId: number }) => {
      const res = await fetch(`/api/races/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete race");
      return { competitionId, id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['races', result.competitionId] });
      queryClient.invalidateQueries({ queryKey: [api.races.get.path, result.id] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast({ title: "Race Deleted" });
    },
  });
}

// Competition standings (league table)
export function useCompetitionStandings(competitionId: number) {
  return useQuery({
    queryKey: ['standings', competitionId],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}/standings`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch standings");
      return await res.json() as Array<{
        racerId: number;
        driverName: string | null;
        fullName: string | null;
        points: number;
        podiums: number;
      }>;
    },
    enabled: !!competitionId,
  });
}

// Competition info
export function useCompetition(id: number) {
  return useQuery<Competition>({
    queryKey: ['competition', id],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch competition");
      return await res.json();
    },
    enabled: !!id,
  });
}

// Dashboard data hook - fetches main competition standings and upcoming races
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      // Get all leagues
      const leaguesRes = await fetch('/api/leagues', { credentials: "include" });
      if (!leaguesRes.ok) {
        return { standings: [], competition: null, upcomingRaces: [] };
      }
      const leagues: League[] = await leaguesRes.json();
      if (leagues.length === 0) {
        return { standings: [], competition: null, upcomingRaces: [] };
      }
      
      // Get competitions for first league
      const compsRes = await fetch(`/api/leagues/${leagues[0].id}/competitions`, { credentials: "include" });
      if (!compsRes.ok) {
        return { standings: [], competition: null, upcomingRaces: [] };
      }
      const comps: Competition[] = await compsRes.json();
      if (comps.length === 0) {
        return { standings: [], competition: null, upcomingRaces: [] };
      }
      
      const mainComp = comps[0];
      
      // Fetch standings and races in parallel
      const [standingsRes, racesRes] = await Promise.all([
        fetch(`/api/competitions/${mainComp.id}/standings`, { credentials: "include" }),
        fetch(`/api/competitions/${mainComp.id}/races`, { credentials: "include" }),
      ]);
      
      const standings = standingsRes.ok ? await standingsRes.json() : [];
      const allRaces: Race[] = racesRes.ok ? await racesRes.json() : [];
      
      // Filter upcoming races (scheduled status)
      const upcomingRaces = allRaces
        .filter(r => r.status === 'scheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        standings: standings as Array<{
          racerId: number;
          driverName: string | null;
          fullName: string | null;
          points: number;
          podiums: number;
        }>,
        competition: mainComp,
        upcomingRaces,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
