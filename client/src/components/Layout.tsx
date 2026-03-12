import { Sidebar } from "./Sidebar";
import { Menu, Flag, Bell } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { useNotifications } from "@/hooks/use-notifications";

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-full shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative racing-stripe">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-sidebar border-b border-white/5 z-20">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <Flag className="w-5 h-5 text-primary" />
              <span className="font-display font-bold italic text-lg text-white">
                MCK <span className="text-primary">GRID</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/notifications">
              <button className="relative p-2 text-white hover:bg-white/10 rounded-lg" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>
            <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-white hover:bg-white/10 rounded-lg" data-testid="button-mobile-menu">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r border-white/10 w-64 bg-sidebar">
              <Sidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
