import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Trophy, Calendar, User, ArrowRight, Activity, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [, setLocation] = useLocation();

  // Redirect to profile creation if no profile exists
  if (!isLoading && !profile) {
    setLocation("/profile");
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const roleDisplay = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ') : 'Racer';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold italic text-white mb-2">
            Welcome back, <span className="text-primary">{user?.firstName}</span>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            {roleDisplay} Account
          </p>
        </div>
        
        {profile?.role === 'admin' && (
          <Link href="/leagues">
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Manage Leagues
            </button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active League", value: "Summer Cup", icon: Trophy, color: "text-yellow-500" },
          { label: "Next Race", value: "Monza GP", icon: Calendar, color: "text-blue-500" },
          { label: "Current Rank", value: "P3", icon: Crown, color: "text-primary" },
          { label: "Best Lap", value: "1:24.5", icon: Activity, color: "text-green-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold font-display italic">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display italic">Upcoming Races</h3>
            <Link href="/leagues">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold font-display italic">
                    {12 + i}
                    <span className="text-[10px] ml-0.5">MAY</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Grand Prix {i + 1}</h4>
                    <p className="text-sm text-muted-foreground">Silverstone Circuit</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
                  Scheduled
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display italic">Recent Results</h3>
          </div>
          
          {/* Placeholder for when no results exist */}
          <div className="flex flex-col items-center justify-center h-[240px] text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mb-4 opacity-20" />
            <p>No race results yet.</p>
            <p className="text-sm">Complete your first race to see stats!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
