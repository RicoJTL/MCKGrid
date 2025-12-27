import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Profile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const validated = api.profiles.update.input.parse(data);
      const res = await fetch(api.profiles.update.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return api.profiles.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
      toast({ title: "Profile Updated", description: "See you on the track!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  });
}

export function useAllProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return res.json();
    },
  });
}

export function useAdminUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { driverName?: string; fullName?: string; role?: string } }) => {
      const safeData = {
        ...(data.driverName !== undefined && { driverName: data.driverName }),
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.role !== undefined && { role: data.role }),
      };
      const res = await apiRequest("PATCH", `/api/profiles/${id}`, safeData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Profile Updated", description: "Driver profile has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { driverName: string; fullName: string; role?: string }) => {
      const res = await apiRequest("POST", "/api/profiles/create-driver", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Driver Created", description: "New driver has been added" });
    },
    onError: (error: Error) => {
      console.error("Create driver error:", error);
      toast({ title: "Error", description: error.message || "Failed to create driver", variant: "destructive" });
    }
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Profile Deleted", description: "User has been removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete profile", variant: "destructive" });
    }
  });
}

export function useUpdateAdminLevel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, adminLevel }: { id: number; adminLevel: "none" | "admin" | "super_admin" }) => {
      const res = await apiRequest("PATCH", `/api/profiles/${id}/admin-level`, { adminLevel });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({ title: "Admin Level Updated", description: "User access has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update admin level. Super Admin access required.", variant: "destructive" });
    }
  });
}

