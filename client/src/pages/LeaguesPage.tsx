import { useLeagues, useCreateLeague, useUpdateLeague, useDeleteLeague } from "@/hooks/use-leagues";
import { Plus, Trophy, Calendar, ArrowRight, MoreVertical, Pencil, Trash2, Star } from "lucide-react";
import { Link } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeagueSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { format } from "date-fns";

export default function LeaguesPage() {
  const { data: leagues, isLoading } = useLeagues();
  const { data: profile } = useProfile();
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();
  const [open, setOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<any>(null);
  const [deletingLeague, setDeletingLeague] = useState<any>(null);

  const isAdmin = profile?.adminLevel === 'admin' || profile?.adminLevel === 'super_admin';

  const form = useForm({
    resolver: zodResolver(insertLeagueSchema),
    defaultValues: {
      name: "",
      description: "",
      seasonStart: new Date(),
    },
  });

  const editForm = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: any) => {
    createLeague.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const onUpdate = (data: any) => {
    if (!editingLeague) return;
    updateLeague.mutate({ id: editingLeague.id, data }, {
      onSuccess: () => setEditingLeague(null)
    });
  };

  const onDelete = () => {
    if (!deletingLeague) return;
    deleteLeague.mutate(deletingLeague.id, {
      onSuccess: () => setDeletingLeague(null)
    });
  };

  if (isLoading) return <div className="text-center py-20 animate-pulse text-muted-foreground">Loading leagues...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">Leagues</h1>
          <p className="text-muted-foreground">Championship series and ongoing competitions</p>
        </div>

        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle className="font-display italic text-2xl">Create New League</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>League Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Winter Cup 2024" {...field} className="bg-secondary/50 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Details about this league..." {...field} className="bg-secondary/50 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold" disabled={createLeague.isPending}>
                    {createLeague.isPending ? "Starting Engine..." : "Create League"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues?.map((league) => (
          <div key={league.id} className="group relative p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy className="w-24 h-24 rotate-12" />
            </div>
            
            {isAdmin && (
              <div className="absolute top-2 right-2 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-league-menu-${league.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      editForm.reset({ name: league.name, description: league.description || "" });
                      setEditingLeague(league);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setDeletingLeague(league);
                    }} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <Link href={`/leagues/${league.id}`}>
              <div className="relative z-10 cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Trophy className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                
                <h3 className="text-xl font-bold font-display italic mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                  {league.name}
                  {league.isMain && (
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  )}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 h-10">
                  {league.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {league.seasonStart ? format(new Date(league.seasonStart), 'MMM yyyy') : 'TBA'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 group-hover:text-primary transition-colors font-medium">
                    View Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Edit League Dialog */}
      <Dialog open={!!editingLeague} onOpenChange={(open) => !open && setEditingLeague(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit League</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
      <AlertDialog open={!!deletingLeague} onOpenChange={(open) => !open && setDeletingLeague(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete League?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingLeague?.name}" and all its competitions, races, and results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
