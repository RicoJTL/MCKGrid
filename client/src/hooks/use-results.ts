import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Result } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useResults(raceId: number) {
  return useQuery({
    queryKey: [api.results.list.path, raceId],
    queryFn: async () => {
      const url = buildUrl(api.results.list.path, { id: raceId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch results");
      return api.results.list.responses[200].parse(await res.json());
    },
    enabled: !!raceId,
  });
}

export function useSubmitResults() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ raceId, results }: { raceId: number; results: any[] }) => {
      const validated = api.results.submit.input.parse(results);
      const url = buildUrl(api.results.submit.path, { id: raceId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit results");
      }
      return { data: await res.json(), raceId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.results.list.path, result.raceId] });
      toast({ title: "Results Submitted", description: "Podium decided!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
