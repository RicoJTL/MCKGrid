import { Switch, Route, Redirect } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load frequently accessed pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

// Lazy load less frequently accessed pages
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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/" />;

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
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
