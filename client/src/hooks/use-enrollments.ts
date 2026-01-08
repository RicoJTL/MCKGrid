import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@shared/schema";

export function useEnrolledDrivers(competitionId: number) {
  return useQuery<Profile[]>({
    queryKey: ['/api/competitions', competitionId, 'enrollments'],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}/enrollments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch enrolled drivers");
      return res.json();
    },
    enabled: !!competitionId,
  });
}

export function useEnrollDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ competitionId, profileId }: { competitionId: number; profileId: number }) => {
      return apiRequest("POST", `/api/competitions/${competitionId}/enrollments`, { profileId });
    },
    onSuccess: (_, { competitionId, profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', competitionId, 'enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'enrolled-competitions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', competitionId, 'standings'] });
      toast({ title: "Driver enrolled successfully" });
    },
    onError: (error: Error) => {
      console.error("Enrollment error:", error);
      toast({ 
        title: "Failed to enroll driver", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useUnenrollDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ competitionId, profileId }: { competitionId: number; profileId: number }) => {
      return apiRequest("DELETE", `/api/competitions/${competitionId}/enrollments/${profileId}`);
    },
    onSuccess: (_, { competitionId, profileId }) => {
      // Invalidate enrollment-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', competitionId, 'enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'enrolled-competitions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', competitionId, 'standings'] });
      // Invalidate check-in related queries (since unenrollment may remove check-ins)
      queryClient.invalidateQueries({ queryKey: ['/api/races'] });
      queryClient.invalidateQueries({ queryKey: ['/api/races/upcoming'] });
      // Invalidate dashboard and profile data
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'recent-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions/active'] });
      // Invalidate enrollment notifications (cleaned up on unenroll)
      queryClient.invalidateQueries({ queryKey: ['/api/enrollment-notifications'] });
      toast({ title: "Driver removed from competition" });
    },
    onError: (error: Error) => {
      console.error("Unenroll error:", error);
      toast({ 
        title: "Failed to remove driver", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
