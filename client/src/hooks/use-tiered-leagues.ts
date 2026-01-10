import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TieredLeague, TierName, TierAssignment, Profile } from "@shared/schema";

export interface TieredLeagueWithTiers extends TieredLeague {
  tierNames: TierName[];
}

export interface TierStanding {
  tierNumber: number;
  tierName: string;
  standings: Array<{
    profileId: number;
    driverName: string;
    fullName: string;
    points: number;
  }>;
}

export interface DriverActiveTier {
  tieredLeague: TieredLeague;
  tierNumber: number;
  tierName: string;
  standing: number;
  points: number;
}

export function useTieredLeagues(leagueId: number) {
  return useQuery<TieredLeagueWithTiers[]>({
    queryKey: ['/api/leagues', leagueId, 'tiered-leagues'],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${leagueId}/tiered-leagues`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tiered leagues");
      return res.json();
    },
    enabled: !!leagueId,
  });
}

export function useTieredLeague(tieredLeagueId: number) {
  return useQuery<TieredLeagueWithTiers>({
    queryKey: ['/api/tiered-leagues', tieredLeagueId],
    queryFn: async () => {
      const res = await fetch(`/api/tiered-leagues/${tieredLeagueId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tiered league");
      return res.json();
    },
    enabled: !!tieredLeagueId,
  });
}

export function useTieredLeagueByCompetition(competitionId: number) {
  return useQuery<TieredLeagueWithTiers | null>({
    queryKey: ['/api/competitions', competitionId, 'tiered-league'],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}/tiered-league`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tiered league");
      return res.json();
    },
    enabled: !!competitionId,
  });
}

export function useTierNames(tieredLeagueId: number) {
  return useQuery<TierName[]>({
    queryKey: ['/api/tiered-leagues', tieredLeagueId, 'tier-names'],
    queryFn: async () => {
      const res = await fetch(`/api/tiered-leagues/${tieredLeagueId}/tier-names`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tier names");
      return res.json();
    },
    enabled: !!tieredLeagueId,
  });
}

export function useTierStandings(tieredLeagueId: number) {
  return useQuery<TierStanding[]>({
    queryKey: ['/api/tiered-leagues', tieredLeagueId, 'standings'],
    queryFn: async () => {
      const res = await fetch(`/api/tiered-leagues/${tieredLeagueId}/standings`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tier standings");
      return res.json();
    },
    enabled: !!tieredLeagueId,
  });
}

export function useTierAssignments(tieredLeagueId: number) {
  return useQuery<TierAssignment[]>({
    queryKey: ['/api/tiered-leagues', tieredLeagueId, 'assignments'],
    queryFn: async () => {
      const res = await fetch(`/api/tiered-leagues/${tieredLeagueId}/assignments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tier assignments");
      return res.json();
    },
    enabled: !!tieredLeagueId,
  });
}

export function useDriverActiveTier(profileId: number | undefined) {
  return useQuery<DriverActiveTier | null>({
    queryKey: ['/api/profiles', profileId, 'active-tier'],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${profileId}/active-tier`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch driver tier");
      }
      return res.json();
    },
    enabled: !!profileId,
  });
}

export function useCreateTieredLeague() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      leagueId: number;
      parentCompetitionId: number;
      numberOfTiers?: number;
      driversPerTier?: number;
      racesBeforeShuffle?: number;
      promotionSpots?: number;
      relegationSpots?: number;
      tierNames: string[];
    }) => {
      return apiRequest("POST", `/api/tiered-leagues`, data);
    },
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leagues', leagueId, 'tiered-leagues'] });
      toast({ title: "Tiered league created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create tiered league", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateTieredLeague() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, leagueId, data }: { id: number; leagueId: number; data: Partial<TieredLeague> & { tierNames?: string[] } }) => {
      return apiRequest("PATCH", `/api/tiered-leagues/${id}`, data);
    },
    onSuccess: (_, { id, leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/leagues', leagueId, 'tiered-leagues'] });
      toast({ title: "Tiered league updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update tiered league", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteTieredLeague() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, leagueId }: { id: number; leagueId: number }) => {
      return apiRequest("DELETE", `/api/tiered-leagues/${id}`);
    },
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leagues', leagueId, 'tiered-leagues'] });
      toast({ title: "Tiered league deleted" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete tiered league", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useAssignDriverToTier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ tieredLeagueId, profileId, tierNumber }: { tieredLeagueId: number; profileId: number; tierNumber: number }) => {
      return apiRequest("POST", `/api/tiered-leagues/${tieredLeagueId}/assignments`, { profileId, tierNumber });
    },
    onSuccess: (_, { tieredLeagueId, profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', tieredLeagueId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', tieredLeagueId, 'standings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'active-tier'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tier-movement-notifications'] });
      toast({ title: "Driver assigned to tier" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to assign driver", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useRemoveDriverFromTier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ tieredLeagueId, profileId }: { tieredLeagueId: number; profileId: number }) => {
      return apiRequest("DELETE", `/api/tiered-leagues/${tieredLeagueId}/assignments/${profileId}`);
    },
    onSuccess: (_, { tieredLeagueId, profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', tieredLeagueId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', tieredLeagueId, 'standings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'active-tier'] });
      toast({ title: "Driver removed from tier" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to remove driver", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useMoveDriverTier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ tieredLeagueId, profileId, newTierNumber }: { tieredLeagueId: number; profileId: number; newTierNumber: number }) => {
      return apiRequest("POST", `/api/tiered-leagues/${tieredLeagueId}/move-driver`, { profileId, newTierNumber });
    },
    onSuccess: (_, { tieredLeagueId, profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', tieredLeagueId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tiered-leagues', tieredLeagueId, 'standings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'active-tier'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tier-movement-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/badge-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'badges'] });
      toast({ title: "Driver tier updated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to move driver", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export interface TierMovementNotification {
  notification: { id: number; profileId: number; movementId: number; isRead: boolean; createdAt: string };
  movement: { id: number; tieredLeagueId: number; profileId: number; fromTier: number | null; toTier: number; movementType: string; afterRaceNumber: number; createdAt: string };
  tieredLeague: { id: number; name: string; leagueId: number; parentCompetitionId: number; numberOfTiers: number };
}

export function useTierMovementNotifications() {
  return useQuery<TierMovementNotification[]>({
    queryKey: ['/api/tier-movement-notifications'],
    queryFn: async () => {
      const res = await fetch(`/api/tier-movement-notifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });
}

export function useMarkTierMovementNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("POST", `/api/tier-movement-notifications/${notificationId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tier-movement-notifications'] });
    },
  });
}
