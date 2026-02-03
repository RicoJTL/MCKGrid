import { motion } from "framer-motion";
import { Trophy, Timer, Flag, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return <div className="h-screen w-full bg-background flex items-center justify-center text-primary">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Dynamic background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="flex justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Man Can Kart" 
              className="h-64 md:h-80 w-auto object-contain"
            />
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4 font-light">
            Professional karting league management. Track race results, manage championships, and follow your favorite drivers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/api/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25 group"
              data-testid="button-login"
            >
              Start Your Engine
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { icon: Trophy, title: "Championships", desc: "Track standings and compete for the title." },
            { icon: Timer, title: "Race Results", desc: "Record times, positions, and points." },
            { icon: Flag, title: "Race Days", desc: "Manage events and driver entries." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="p-8 rounded-2xl glass-card hover:bg-white/5 transition-colors"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold font-display italic mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
