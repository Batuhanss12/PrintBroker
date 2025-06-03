import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import CustomerDashboard from "@/pages/CustomerDashboard";
import PrinterDashboard from "@/pages/PrinterDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import QuoteForm from "@/pages/QuoteForm";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          {(user as any)?.role === 'customer' && (
            <>
              <Route path="/dashboard" component={CustomerDashboard} />
              <Route path="/quote/:type" component={QuoteForm} />
            </>
          )}
          {(user as any)?.role === 'printer' && (
            <Route path="/dashboard" component={PrinterDashboard} />
          )}
          {(user as any)?.role === 'admin' && (
            <Route path="/dashboard" component={AdminDashboard} />
          )}
        </>
      )}
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
