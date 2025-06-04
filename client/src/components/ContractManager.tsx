import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  PenTool,
  Plus
} from "lucide-react";

interface Contract {
  id: string;
  orderId: string;
  customerId: string;
  printerId: string;
  contractNumber: string;
  title: string;
  description?: string;
  terms: string;
  totalAmount: string;
  status: string;
  customerSignedAt?: string;
  printerSignedAt?: string;
  customerSignature?: string;
  printerSignature?: string;
  contractPdfPath?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ContractManagerProps {
  userRole: string;
}

export default function ContractManager({ userRole }: ContractManagerProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signature, setSignature] = useState("");
  const [showSignDialog, setShowSignDialog] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contracts based on user role
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['/api/contracts', userRole],
    queryFn: () => apiRequest('GET', '/api/contracts'),
  });

  // Sign contract mutation
  const signMutation = useMutation({
    mutationFn: async ({ contractId, signature }: { contractId: string; signature: string }) => {
      return await apiRequest('POST', `/api/contracts/${contractId}/sign`, { signature });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      setShowSignDialog(false);
      setSignature("");
      toast({
        title: "Başarılı",
        description: "Sözleşme imzalandı.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Sözleşme imzalanamadı.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Taslak", variant: "secondary" as const, icon: Clock },
      sent: { label: "Gönderildi", variant: "outline" as const, icon: Clock },
      customer_approved: { label: "Müşteri Onayı", variant: "default" as const, icon: CheckCircle },
      printer_approved: { label: "Matbaa Onayı", variant: "default" as const, icon: CheckCircle },
      fully_approved: { label: "Tam Onaylı", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Reddedildi", variant: "destructive" as const, icon: XCircle },
      cancelled: { label: "İptal", variant: "secondary" as const, icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, variant: "outline" as const, icon: Clock };
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canSign = (contract: Contract) => {
    if (userRole === 'customer') {
      return contract.status === 'sent' || contract.status === 'printer_approved';
    } else if (userRole === 'printer') {
      return contract.status === 'sent' || contract.status === 'customer_approved';
    }
    return false;
  };

  const isSignedByUser = (contract: Contract) => {
    if (userRole === 'customer') {
      return !!contract.customerSignedAt;
    } else if (userRole === 'printer') {
      return !!contract.printerSignedAt;
    }
    return false;
  };

  const ContractDetailsDialog = ({ contract }: { contract: Contract }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sözleşme Detayları - {contract.contractNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Contract Header */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium">Sözleşme Başlığı:</Label>
              <p className="mt-1">{contract.title}</p>
            </div>
            <div>
              <Label className="font-medium">Toplam Tutar:</Label>
              <p className="mt-1 text-lg font-semibold text-green-600">₺{contract.totalAmount}</p>
            </div>
            <div>
              <Label className="font-medium">Durum:</Label>
              <div className="mt-1">{getStatusBadge(contract.status)}</div>
            </div>
            <div>
              <Label className="font-medium">Oluşturulma Tarihi:</Label>
              <p className="mt-1">{new Date(contract.createdAt).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          {/* Description */}
          {contract.description && (
            <div>
              <Label className="font-medium">Açıklama:</Label>
              <p className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">{contract.description}</p>
            </div>
          )}

          {/* Terms */}
          <div>
            <Label className="font-medium">Sözleşme Şartları:</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
              {contract.terms}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Müşteri İmzası:</Label>
              {contract.customerSignedAt ? (
                <div className="mt-2">
                  <Badge variant="default" className="mb-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    İmzalandı
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {new Date(contract.customerSignedAt).toLocaleString('tr-TR')}
                  </p>
                  {contract.customerSignature && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border-2 border-blue-200">
                      <p className="text-sm font-mono">{contract.customerSignature}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Bekliyor
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Label className="font-medium">Matbaa İmzası:</Label>
              {contract.printerSignedAt ? (
                <div className="mt-2">
                  <Badge variant="default" className="mb-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    İmzalandı
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {new Date(contract.printerSignedAt).toLocaleString('tr-TR')}
                  </p>
                  {contract.printerSignature && (
                    <div className="mt-2 p-2 bg-green-50 rounded border-2 border-green-200">
                      <p className="text-sm font-mono">{contract.printerSignature}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Bekliyor
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Valid Until */}
          {contract.validUntil && (
            <div>
              <Label className="font-medium">Geçerlilik Tarihi:</Label>
              <p className="mt-1 text-orange-600">
                {new Date(contract.validUntil).toLocaleDateString('tr-TR')} tarihine kadar geçerli
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {canSign(contract) && !isSignedByUser(contract) && (
              <Button
                onClick={() => {
                  setSelectedContract(contract);
                  setShowSignDialog(true);
                }}
                className="flex items-center gap-2"
              >
                <PenTool className="h-4 w-4" />
                İmzala
              </Button>
            )}
            
            {contract.contractPdfPath && (
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                PDF İndir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const SignContractDialog = () => (
    <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sözleşme İmzala</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Dijital İmza</Label>
            <Textarea
              placeholder="Adınızı ve soyadınızı yazarak dijital imzanızı oluşturun..."
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                if (selectedContract && signature.trim()) {
                  signMutation.mutate({
                    contractId: selectedContract.id,
                    signature: signature.trim()
                  });
                }
              }}
              disabled={!signature.trim() || signMutation.isPending}
            >
              {signMutation.isPending ? "İmzalanıyor..." : "İmzala"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Sözleşmeler yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sözleşmeler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(contracts) && contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sözleşme bulunamadı</h3>
              <p className="text-gray-600">Henüz hiç sözleşmeniz bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(contracts) && contracts.map((contract: Contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{contract.title}</h3>
                          {getStatusBadge(contract.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Sözleşme No:</span>
                            <p>{contract.contractNumber}</p>
                          </div>
                          <div>
                            <span className="font-medium">Tutar:</span>
                            <p className="font-semibold text-green-600">₺{contract.totalAmount}</p>
                          </div>
                          <div>
                            <span className="font-medium">Oluşturulma:</span>
                            <p>{new Date(contract.createdAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div>
                            <span className="font-medium">İmza Durumu:</span>
                            <div className="flex gap-1 mt-1">
                              {contract.customerSignedAt && (
                                <Badge variant="outline" className="text-xs">Müşteri ✓</Badge>
                              )}
                              {contract.printerSignedAt && (
                                <Badge variant="outline" className="text-xs">Matbaa ✓</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <ContractDetailsDialog contract={contract} />
                        
                        {canSign(contract) && !isSignedByUser(contract) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowSignDialog(true);
                            }}
                          >
                            <PenTool className="h-3 w-3 mr-1" />
                            İmzala
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SignContractDialog />
    </div>
  );
}