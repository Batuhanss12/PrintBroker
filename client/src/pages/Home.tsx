import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      const userRole = (user as any)?.role || 'customer';
      
      // Redirect to appropriate dashboard based on role
      if (userRole === 'admin') {
        window.location.href = '/admin-dashboard';
      } else if (userRole === 'printer') {
        window.location.href = '/printer-dashboard';
      } else {
        window.location.href = '/customer-dashboard';
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Yönlendiriliyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Hoş Geldiniz</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Hesabınıza yönlendiriliyorsunuz...</p>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full"
          >
            Dashboard'a Git
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}