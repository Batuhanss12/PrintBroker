import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Home from "./pages/HomeNew";
import CustomerDashboard from "@/pages/CustomerDashboard";
import PrinterDashboard from "@/pages/PrinterDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import QuoteForm from "@/pages/QuoteForm";
import Payment from "./pages/Payment";
import CustomerRegister from "./pages/CustomerRegister";
import PrinterRegister from "./pages/PrinterRegister";
import NotFound from "./pages/not-found";

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
        <>
          <Route path="/" component={Landing} />
          <Route path="/customer-register" component={CustomerRegister} />
          <Route path="/printer-register" component={PrinterRegister} />
          <Route path="/payment" component={Payment} />
        </>
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
          <Route path="/payment" component={Payment} />
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
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/home" component={Home} />
          <Route path="/customer" component={CustomerDashboard} />
          <Route path="/printer" component={PrinterDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/quote" component={QuoteForm} />
          <Route path="/payment" component={Payment} />
          <Route path="/customer-register" component={CustomerRegister} />
          <Route path="/printer-register" component={PrinterRegister} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;