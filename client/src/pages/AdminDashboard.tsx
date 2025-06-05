
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Building2, 
  FileText, 
  ShoppingCart,
  Settings,
  AlertCircle,
  UserPlus,
  CheckCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/activity"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      customer: { label: "Müşteri", variant: "default" },
      printer: { label: "Matbaa", variant: "secondary" },
      admin: { label: "Admin", variant: "destructive" }
    };
    
    const config = roleMap[role] || { label: role, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-2xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <Settings className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Admin Paneli</h3>
                <p className="text-gray-300">Sistem Yönetimi</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-300">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Aktif Müşteriler"
            value={statsLoading ? "..." : stats?.customers || 0}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatsCard
            title="Matbaa Sayısı"
            value={statsLoading ? "..." : stats?.printers || 0}
            icon={<Building2 className="h-5 w-5 text-orange-600" />}
            color="bg-orange-50"
          />
          <StatsCard
            title="Toplam Teklif"
            value={statsLoading ? "..." : stats?.quotes || 0}
            icon={<FileText className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatsCard
            title="Toplam Sipariş"
            value={statsLoading ? "..." : stats?.orders || 0}
            icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
            color="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Son Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : users && users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.slice(0, 5).map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-600 text-center py-4">Kullanıcı bulunamadı.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.map((item: any, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        {item.type === 'quote' ? (
                          <FileText className="text-blue-600 text-sm" />
                        ) : (
                          <ShoppingCart className="text-green-600 text-sm" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          {item.type === 'quote' ? 'Yeni teklif: ' : 'Yeni sipariş: '}
                          <span className="font-medium">{item.description}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">Aktivite bulunamadı.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
