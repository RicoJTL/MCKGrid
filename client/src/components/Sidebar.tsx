import { Link, useLocation } from "wouter";
import { 
  Trophy, 
  Flag, 
  LayoutDashboard, 
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Trophy, label: "Competitions", href: "/leagues" },
  { icon: UserCircle, label: "Profile", href: "/profile" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full w-full bg-sidebar border-r border-white/5">
      <Link href="/" onClick={() => onNavigate?.()}>
        <a 
          className="block p-6 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
          data-testid="link-logo"
        >
          <div className="flex items-center gap-3">
            <Flag className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold font-display italic tracking-wider text-white">
                GRID<span className="text-primary">LINE</span>
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">Racing</p>
            </div>
          </div>
        </a>
      </Link>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href} onClick={() => onNavigate?.()}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("w-5 h-5", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                <span className="font-medium tracking-wide">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
