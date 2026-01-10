import { Switch, Route, Redirect } from "wouter";
import { Suspense, lazy, Component, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

// Eager load main pages for fast initial load
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

// Lazy load other pages
const LeaguesPage = lazy(() => import("@/pages/LeaguesPage"));
const LeagueDetails = lazy(() => import("@/pages/LeagueDetails"));
const CompetitionDetails = lazy(() => import("@/pages/CompetitionDetails"));
const RaceDetails = lazy(() => import("@/pages/RaceDetails"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("@/pages/PublicProfilePage"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/" />;

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
           <Layout><Dashboard /></Layout>
        ) : (
          <Landing />
        )}
      </Route>
      
      <Route path="/leagues" component={() => <ProtectedRoute component={LeaguesPage} />} />
      <Route path="/leagues/:id" component={() => <ProtectedRoute component={LeagueDetails} />} />
      <Route path="/competitions/:id" component={() => <ProtectedRoute component={CompetitionDetails} />} />
      <Route path="/races/:id" component={() => <ProtectedRoute component={RaceDetails} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/profiles/:id" component={() => <ProtectedRoute component={PublicProfilePage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPanel} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
