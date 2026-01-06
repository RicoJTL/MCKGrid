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
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', competitionId, 'enrollments'] });
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
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', competitionId, 'enrollments'] });
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
