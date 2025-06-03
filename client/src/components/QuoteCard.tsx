import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Clock, 
  Eye,
  LayoutGrid,
  Disc,
  Printer
} from "lucide-react";

interface Quote {
  id: string;
  title: string;
  type: 'sheet_label' | 'roll_label' | 'general_printing';
  status: 'pending' | 'received_quotes' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  specifications?: Record<string, any>;
  createdAt: string;
  deadline?: string;
  budget?: string;
}

interface QuoteCardProps {
  quote: Quote;
  showActions?: boolean;
  onViewDetails?: (quote: Quote) => void;
}

export default function QuoteCard({ 
  quote, 
  showActions = true, 
  onViewDetails 
}: QuoteCardProps) {
  
  const getStatusConfig = (status: string) => {
    const statusMap = {
      pending: { 
        label: "Beklemede", 
        variant: "secondary" as const,
        color: "bg-yellow-100 text-yellow-800"
      },
      received_quotes: { 
        label: "Teklifler Alındı", 
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800"
      },
      approved: { 
        label: "Onaylandı", 
        variant: "default" as const,
        color: "bg-green-100 text-green-800"
      },
      in_progress: { 
        label: "Üretimde", 
        variant: "outline" as const,
        color: "bg-purple-100 text-purple-800"
      },
      completed: { 
        label: "Tamamlandı", 
        variant: "default" as const,
        color: "bg-green-100 text-green-800"
      },
      cancelled: { 
        label: "İptal", 
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800"
      }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getTypeConfig = (type: string) => {
    const typeMap = {
      sheet_label: {
        label: "Tabaka Etiket",
        icon: <LayoutGrid className="h-4 w-4" />,
        color: "text-blue-600"
      },
      roll_label: {
        label: "Rulo Etiket",
        icon: <Disc className="h-4 w-4" />,
        color: "text-orange-600"
      },
      general_printing: {
        label: "Genel Baskı",
        icon: <Printer className="h-4 w-4" />,
        color: "text-green-600"
      }
    };
    
    return typeMap[type as keyof typeof typeMap] || typeMap.general_printing;
  };

  const getQuoteCount = () => {
    // This would typically come from the quote data
    // For now, return a mock value based on status
    if (quote.status === 'received_quotes') {
      return Math.floor(Math.random() * 5) + 1;
    }
    return 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSpecificationSummary = () => {
    if (!quote.specifications) return null;
    
    const specs = quote.specifications;
    const summaryItems: string[] = [];
    
    // Common specifications to show
    if (specs.quantity) summaryItems.push(`${specs.quantity} adet`);
    if (specs.width && specs.height) summaryItems.push(`${specs.width}x${specs.height}mm`);
    if (specs.diameter && specs.length) summaryItems.push(`${specs.diameter}x${specs.length}mm`);
    if (specs.size) summaryItems.push(specs.size);
    if (specs.paperType) summaryItems.push(specs.paperType);
    if (specs.material) summaryItems.push(specs.material);
    
    return summaryItems.slice(0, 3).join(', ');
  };

  const statusConfig = getStatusConfig(quote.status);
  const typeConfig = getTypeConfig(quote.type);
  const quoteCount = getQuoteCount();
  const specSummary = getSpecificationSummary();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-gray-100 rounded-lg ${typeConfig.color}`}>
              {typeConfig.icon}
            </div>
            <div>
              <h5 className="font-medium text-gray-900 truncate max-w-48">
                {quote.title}
              </h5>
              <p className="text-sm text-gray-600">
                {typeConfig.label}
              </p>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            {quoteCount > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {quoteCount} teklif
              </p>
            )}
            {quote.budget && (
              <p className="text-sm font-medium text-gray-900 mt-1">
                ₺{quote.budget}
              </p>
            )}
          </div>
        </div>

        {/* Specifications Summary */}
        {specSummary && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {specSummary}
            </p>
          </div>
        )}

        {/* Dates and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(quote.createdAt)}
            </div>
            {quote.deadline && (
              <div className="flex items-center">
                <span>Termin: {formatDate(quote.deadline)}</span>
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(quote)}
                  className="h-7 px-2 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Detay
                </Button>
              )}
              
              {quote.status === 'received_quotes' && (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-primary hover:bg-blue-700"
                >
                  Teklifleri Gör
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
