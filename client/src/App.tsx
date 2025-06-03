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
import QuoteForm from "@/pages/QuoteFormNew";
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
          {/* Tüm paneller aktif - role'e göre dashboard yönlendirme */}
          <Route path="/dashboard" component={() => {
            const userRole = (user as any)?.role || 'customer';
            if (userRole === 'admin') return <AdminDashboard />;
            if (userRole === 'printer') return <PrinterDashboard />;
            return <CustomerDashboard />;
          }} />
          <Route path="/quote/:type" component={QuoteForm} />
          {/* Test için tüm panellere erişim */}
          <Route path="/customer-dashboard" component={CustomerDashboard} />
          <Route path="/printer-dashboard" component={PrinterDashboard} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
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
