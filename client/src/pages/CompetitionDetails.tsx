import { useRaces, useCreateRace } from "@/hooks/use-leagues";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Calendar, MapPin, Flag } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRaceSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitionDetails() {
  const [match, params] = useRoute("/competitions/:id");
  const compId = parseInt(params?.id || "0");
  const { data: races, isLoading } = useRaces(compId);
  const { data: profile } = useProfile();
  const createRace = useCreateRace();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const form = useForm({
    resolver: zodResolver(insertRaceSchema),
    defaultValues: {
      competitionId: compId,
      name: "",
      location: "",
      date: new Date().toISOString(), // Default to ISO string for API compatibility? Need to check coerce.
      status: "scheduled"
    },
  });

  const onSubmit = (data: any) => {
    // Ensure date is a valid date object or string parsable by backend
    createRace.mutate({ 
      ...data, 
      competitionId: compId,
      date: new Date(data.date) 
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-8">
       <Link href="#" onClick={() => history.back()}>
        <div className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </div>
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold italic text-white">Race Calendar</h1>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Schedule Race
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Schedule New Race</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Monaco GP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Track/Circuit Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} className="block w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary font-bold" disabled={createRace.isPending}>
                    Schedule Race
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {races?.map((race) => (
          <Link key={race.id} href={`/races/${race.id}`}>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl bg-secondary/30 border border-white/5 hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white/5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="text-xl font-bold font-display">{format(new Date(race.date), 'dd')}</span>
                  <span className="text-xs font-medium uppercase">{format(new Date(race.date), 'MMM')}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display italic mb-1">{race.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {race.location}</span>
                    <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> {race.status}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <Button variant="ghost" className="text-primary group-hover:bg-primary/10">
                  View Details <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
