
import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LoadingPage from "@/components/LoadingPage";
import Landing from "./pages/Landing";
import LandingNew from "./pages/LandingNew";
import Home from "./pages/Home";
import CustomerDashboard from "@/pages/CustomerDashboard";
import PrinterDashboard from "@/pages/PrinterDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import QuoteForm from "@/pages/QuoteForm";
import Payment from "./pages/Payment";
import CustomerRegister from "./pages/CustomerRegister";
import PrinterRegister from "./pages/PrinterRegister";
import ProductCategories from "./pages/ProductCategories";
import ProductCategoriesNew from "./pages/ProductCategoriesNew";
import References from "./pages/References";
import ReferencesNew from "./pages/ReferencesNew";
import NotFound from "./pages/not-found";

function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingPage message="Hesap bilgileriniz kontrol ediliyor..." />;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={LandingNew} />
          <Route path="/products" component={ProductCategoriesNew} />
          <Route path="/old" component={Landing} />
          <Route path="/old-products" component={ProductCategories} />
          <Route path="/references" component={ReferencesNew} />
          <Route path="/old-references" component={References} />
          <Route path="/customer-register" component={CustomerRegister} />
          <Route path="/printer-register" component={PrinterRegister} />
          <Route path="/payment" component={Payment} />
          
          {/* Authentication-protected panel routes redirect to login */}
          <Route path="/customer-dashboard" component={() => {
            window.location.href = '/customer-register';
            return <div>Redirecting to customer registration...</div>;
          }} />
          <Route path="/printer-dashboard" component={() => {
            window.location.href = '/printer-register';
            return <div>Redirecting to printer registration...</div>;
          }} />
          <Route path="/admin-dashboard" component={() => {
            window.location.href = '/api/login';
            return <div>Redirecting to admin login...</div>;
          }} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          
          <Route path="/dashboard" component={() => {
            // Universal dashboard route that redirects based on role
            const userRole = (user as any)?.role || 'customer';
            
            if (userRole === 'admin') {
              window.location.href = '/admin-dashboard';
              return null;
            }
            if (userRole === 'printer') {
              window.location.href = '/printer-dashboard';
              return null;
            }
            // Default to customer dashboard
            window.location.href = '/customer-dashboard';
            return null;
          }} />
          
          {/* Role-based protected routes */}
          <Route path="/customer-dashboard" component={() => {
            const userRole = (user as any)?.role;
            if (userRole !== 'customer') {
              window.location.href = '/';
              return null;
            }
            return <CustomerDashboard />;
          }} />
          
          <Route path="/printer-dashboard" component={() => {
            const userRole = (user as any)?.role;
            if (userRole !== 'printer') {
              window.location.href = '/';
              return null;
            }
            return <PrinterDashboard />;
          }} />
          
          <Route path="/admin-dashboard" component={() => {
            const userRole = (user as any)?.role;
            if (userRole !== 'admin') {
              window.location.href = '/';
              return null;
            }
            return <AdminDashboard />;
          }} />
          
          <Route path="/quote/:type" component={() => {
            const userRole = (user as any)?.role;
            if (userRole !== 'customer') {
              window.location.href = '/';
              return null;
            }
            return <QuoteForm />;
          }} />
          
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
        <Router>
          <AppRouter />
          <Toaster />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
