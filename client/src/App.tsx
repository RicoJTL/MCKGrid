import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import LeaguesPage from "@/pages/LeaguesPage";
import LeagueDetails from "@/pages/LeagueDetails";
import CompetitionDetails from "@/pages/CompetitionDetails";
import RaceDetails from "@/pages/RaceDetails";
import ProfilePage from "@/pages/ProfilePage";
import TeamsPage from "@/pages/TeamsPage";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/" />;

  return (
    <Layout>
      <Component />
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
      <Route path="/teams" component={() => <ProtectedRoute component={TeamsPage} />} />
      
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
