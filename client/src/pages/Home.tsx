import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { 
  Users, 
  Building2, 
  FileText, 
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getRoleContent = () => {
    switch (user.role) {
      case 'customer':
        return {
          title: "Müşteri Paneli",
          subtitle: `Hoş geldiniz, ${user.firstName || 'Müşteri'}!`,
          actions: [
            {
              title: "Yeni Teklif Talebi",
              description: "Baskı ihtiyacınız için teklif talep edin",
              icon: <Plus className="h-6 w-6" />,
              href: "/quote/sheet_label",
              color: "bg-blue-500"
            },
            {
              title: "Dashboard",
              description: "Tekliflerinizi ve siparişlerinizi görüntüleyin",
              icon: <FileText className="h-6 w-6" />,
              href: "/dashboard",
              color: "bg-green-500"
            }
          ],
          stats: [
            { label: "Kredi Bakiyesi", value: `₺${user.creditBalance}`, icon: <TrendingUp className="h-5 w-5" /> }
          ]
        };
      
      case 'printer':
        return {
          title: "Matbaa Paneli",
          subtitle: `Hoş geldiniz, ${user.companyName || user.firstName || 'Matbaa'}!`,
          actions: [
            {
              title: "Dashboard",
              description: "Teklif taleplerini görüntüleyin ve yönetin",
              icon: <Building2 className="h-6 w-6" />,
              href: "/dashboard",
              color: "bg-orange-500"
            }
          ],
          stats: [
            { label: "Puanınız", value: user.rating || "0.0", icon: <TrendingUp className="h-5 w-5" /> },
            { label: "Abonelik", value: user.subscriptionStatus === 'active' ? 'Aktif' : 'Pasif', icon: <Building2 className="h-5 w-5" /> }
          ]
        };
      
      case 'admin':
        return {
          title: "Admin Paneli",
          subtitle: "Sistem yönetimi ve denetim",
          actions: [
            {
              title: "Admin Dashboard",
              description: "Sistem istatistikleri ve kullanıcı yönetimi",
              icon: <Users className="h-6 w-6" />,
              href: "/dashboard",
              color: "bg-purple-500"
            }
          ],
          stats: []
        };
      
      default:
        return {
          title: "Ana Sayfa",
          subtitle: "Hoş geldiniz!",
          actions: [],
          stats: []
        };
    }
  };

  const content = getRoleContent();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{content.subtitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                {user.role === 'customer' ? 'Müşteri' : 
                 user.role === 'printer' ? 'Matbaa' : 'Admin'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        {content.stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {content.stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-4">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{action.description}</p>
                  <div className="flex items-center text-primary font-medium group-hover:text-blue-700">
                    Başla
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Welcome Message */}
        <Card className="mt-8">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                PrintConnect'e Hoş Geldiniz
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Modern teknoloji ile matbaa sektöründe devrim yaratan platformumuzda, 
                müşteriler ve matbaa firmaları arasında güvenli ve verimli bir köprü kuruyoruz.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
