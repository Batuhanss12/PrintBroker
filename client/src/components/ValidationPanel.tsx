
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Lightbulb,
  Ruler,
  FileCheck,
  Layout,
  TrendingUp,
  Target,
  DollarSign
} from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface FileValidationResult extends ValidationResult {
  metadata?: {
    dimensions?: string;
    resolution?: number;
    colorProfile?: string;
    optimizationSuggestions?: string[];
  };
}

interface LayoutValidationResult extends ValidationResult {
  efficiency: number;
  alternatives: Array<{
    dimensions: { width: number; height: number; unit: string };
    efficiency: number;
    cost: string;
    description: string;
  }>;
}

interface ValidationPanelProps {
  pageValidation?: ValidationResult;
  fileValidations?: FileValidationResult[];
  layoutValidation?: LayoutValidationResult;
  onApplyAlternative?: (alternative: any) => void;
  className?: string;
}

export default function ValidationPanel({
  pageValidation,
  fileValidations = [],
  layoutValidation,
  onApplyAlternative,
  className
}: ValidationPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Genel skor hesaplama
  const calculateOverallScore = () => {
    let score = 100;
    let totalIssues = 0;

    // Sayfa validasyonu
    if (pageValidation) {
      score -= pageValidation.errors.length * 20;
      score -= pageValidation.warnings.length * 10;
      totalIssues += pageValidation.errors.length + pageValidation.warnings.length;
    }

    // Dosya validasyonları - safe check for undefined
    if (fileValidations && fileValidations.length > 0) {
      fileValidations.forEach(validation => {
        if (validation && validation.errors && validation.warnings) {
          score -= validation.errors.length * 15;
          score -= validation.warnings.length * 8;
          totalIssues += validation.errors.length + validation.warnings.length;
        }
      });
    }

    // Layout validasyonu
    if (layoutValidation) {
      score -= layoutValidation.errors.length * 25;
      score -= layoutValidation.warnings.length * 12;
      
      // Verimlilik bonusu/cezası
      if (layoutValidation.efficiency > 70) {
        score += 10;
      } else if (layoutValidation.efficiency < 40) {
        score -= 15;
      }
      
      totalIssues += layoutValidation.errors.length + layoutValidation.warnings.length;
    }

    return { score: Math.max(0, Math.min(100, score)), totalIssues };
  };

  const { score, totalIssues } = calculateOverallScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Mükemmel";
    if (score >= 80) return "Çok İyi";
    if (score >= 70) return "İyi";
    if (score >= 60) return "Orta";
    if (score >= 40) return "Zayıf";
    return "Kritik";
  };

  return (
    <div className={className}>
      {/* Özet Kartı */}
      <Card className="mb-4">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('summary')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Validasyon Özeti
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                {getScoreLabel(score)}
              </Badge>
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score}%
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        
        {expandedSections.has('summary') && (
          <CardContent className="space-y-4">
            <Progress value={score} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {(pageValidation?.errors.length || 0) + 
                   fileValidations.reduce((sum, v) => sum + v.errors.length, 0) + 
                   (layoutValidation?.errors.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Kritik Hatalar</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(pageValidation?.warnings.length || 0) + 
                   fileValidations.reduce((sum, v) => sum + v.warnings.length, 0) + 
                   (layoutValidation?.warnings.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Uyarılar</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {(pageValidation?.suggestions.length || 0) + 
                   fileValidations.reduce((sum, v) => sum + v.suggestions.length, 0) + 
                   (layoutValidation?.suggestions.length || 0)}
                </div>
                <div className="text-sm text-gray-600">Öneriler</div>
              </div>
            </div>

            {layoutValidation && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alan Kullanım Verimliliği:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={layoutValidation.efficiency} className="w-20 h-2" />
                    <span className="font-bold">{layoutValidation.efficiency}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Sayfa Boyutu Validasyonu */}
      {pageValidation && (
        <Card className="mb-4">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('page')}
          >
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Sayfa Boyutu Validasyonu
              {pageValidation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </CardTitle>
          </CardHeader>
          
          {expandedSections.has('page') && (
            <CardContent className="space-y-3">
              {pageValidation.errors.map((error, idx) => (
                <Alert key={idx} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
              
              {pageValidation.warnings.map((warning, idx) => (
                <Alert key={idx}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
              
              {pageValidation.suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Öneriler:
                  </div>
                  {pageValidation.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="text-sm text-gray-600 ml-6">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Dosya Validasyonları */}
      {fileValidations.length > 0 && (
        <Card className="mb-4">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('files')}
          >
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Dosya Validasyonları ({fileValidations.length})
              {fileValidations.every(v => v.isValid) ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </CardTitle>
          </CardHeader>
          
          {expandedSections.has('files') && (
            <CardContent className="space-y-4">
              {fileValidations.map((validation, fileIdx) => (
                <div key={fileIdx} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm">Dosya {fileIdx + 1}</div>
                  
                  {validation.metadata && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      {validation.metadata.dimensions && (
                        <div>Boyut: {validation.metadata.dimensions}</div>
                      )}
                      {validation.metadata.resolution && (
                        <div>Çözünürlük: {validation.metadata.resolution} DPI</div>
                      )}
                      {validation.metadata.colorProfile && (
                        <div>Renk: {validation.metadata.colorProfile}</div>
                      )}
                    </div>
                  )}
                  
                  {validation.errors.map((error, idx) => (
                    <Alert key={idx} variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  ))}
                  
                  {validation.warnings.map((warning, idx) => (
                    <Alert key={idx} className="py-2">
                      <AlertDescription className="text-xs">{warning}</AlertDescription>
                    </Alert>
                  ))}
                  
                  {validation.metadata?.optimizationSuggestions && (
                    <div className="text-xs text-blue-600">
                      {validation.metadata.optimizationSuggestions.map((suggestion, idx) => (
                        <div key={idx}>💡 {suggestion}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Layout Validasyonu ve Alternatifler */}
      {layoutValidation && (
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('layout')}
          >
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Layout Optimizasyonu
              <Badge variant="outline">{layoutValidation.efficiency}% verimlilik</Badge>
            </CardTitle>
          </CardHeader>
          
          {expandedSections.has('layout') && (
            <CardContent className="space-y-4">
              {/* Hatalar ve Uyarılar */}
              {layoutValidation.errors.map((error, idx) => (
                <Alert key={idx} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
              
              {layoutValidation.warnings.map((warning, idx) => (
                <Alert key={idx}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}

              {/* Alternatif Düzenler */}
              {layoutValidation.alternatives.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center gap-2 font-medium">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Önerilen Alternatifler:
                  </div>
                  
                  {layoutValidation.alternatives.map((alternative, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {alternative.dimensions.width}×{alternative.dimensions.height}{alternative.dimensions.unit}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {alternative.efficiency}%
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {alternative.cost}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {alternative.description}
                      </div>
                      
                      {onApplyAlternative && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onApplyAlternative(alternative)}
                          className="w-full"
                        >
                          Bu Alternatifi Uygula
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Öneriler */}
              {layoutValidation.suggestions.length > 0 && (
                <div className="space-y-2">
                  <Separator />
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Optimizasyon Önerileri:
                  </div>
                  {layoutValidation.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="text-sm text-gray-600 ml-6">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
