import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  Upload, 
  File, 
  Image, 
  FileText,
  Grid3X3,
  List,
  Calendar,
  BarChart3
} from "lucide-react";
import AdvancedFileUpload from "./AdvancedFileUpload";

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: string;
  status: string;
  thumbnailPath?: string;
  dimensions?: string;
  colorProfile?: string;
  resolution?: number;
  hasTransparency?: boolean;
  pageCount?: number;
  processingNotes?: string;
  downloadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function FileManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['/api/files'],
    queryFn: () => apiRequest('GET', '/api/files'),
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "Başarılı",
        description: "Dosya silindi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Dosya silinemedi.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (fileId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    toast({
      title: "Başarılı",
      description: "Dosya yüklendi.",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploading: { label: "Yükleniyor", variant: "secondary" as const },
      processing: { label: "İşleniyor", variant: "secondary" as const },
      ready: { label: "Hazır", variant: "default" as const },
      error: { label: "Hata", variant: "destructive" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, variant: "outline" as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Filter files based on search and type
  const filteredFiles = Array.isArray(files) ? files.filter((file: FileItem) => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || file.fileType === filterType;
    return matchesSearch && matchesType;
  }) : [];

  const FilePreviewDialog = ({ file }: { file: FileItem }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file.originalName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* File Preview */}
          {file.thumbnailPath && (
            <div className="flex justify-center">
              <img 
                src={`/uploads/${file.thumbnailPath}`} 
                alt={file.originalName}
                className="max-w-full max-h-80 object-contain rounded-lg border"
              />
            </div>
          )}

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <span className="font-medium">Dosya Adı:</span>
                <p className="text-gray-600">{file.originalName}</p>
              </div>
              <div>
                <span className="font-medium">Dosya Boyutu:</span>
                <p className="text-gray-600">{formatFileSize(file.size)}</p>
              </div>
              <div>
                <span className="font-medium">Dosya Türü:</span>
                <p className="text-gray-600">{file.mimeType}</p>
              </div>
              <div>
                <span className="font-medium">Durum:</span>
                <div className="mt-1">{getStatusBadge(file.status)}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {file.dimensions && (
                <div>
                  <span className="font-medium">Boyutlar:</span>
                  <p className="text-gray-600">{file.dimensions}</p>
                </div>
              )}
              {file.resolution && (
                <div>
                  <span className="font-medium">Çözünürlük:</span>
                  <p className="text-gray-600">{file.resolution} DPI</p>
                </div>
              )}
              {file.colorProfile && (
                <div>
                  <span className="font-medium">Renk Profili:</span>
                  <p className="text-gray-600">{file.colorProfile}</p>
                </div>
              )}
              {file.pageCount && file.pageCount > 1 && (
                <div>
                  <span className="font-medium">Sayfa Sayısı:</span>
                  <p className="text-gray-600">{file.pageCount}</p>
                </div>
              )}
              {file.downloadCount !== undefined && (
                <div>
                  <span className="font-medium">İndirme Sayısı:</span>
                  <p className="text-gray-600">{file.downloadCount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Processing Notes */}
          {file.processingNotes && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <span className="font-medium text-sm">İşleme Notları:</span>
              <p className="text-sm text-gray-600 mt-1">{file.processingNotes}</p>
            </div>
          )}

          {/* Technical Properties */}
          <div className="flex flex-wrap gap-2">
            {file.hasTransparency && (
              <Badge variant="secondary">Şeffaflık Var</Badge>
            )}
            <Badge variant="outline">{file.fileType.toUpperCase()}</Badge>
          </div>

          {/* Creation Date */}
          <div className="text-sm text-gray-500 border-t pt-3">
            Yüklenme Tarihi: {new Date(file.createdAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const FileGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredFiles.map((file: FileItem) => (
        <Card key={file.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* File Preview */}
              <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
                {file.thumbnailPath ? (
                  <img 
                    src={`/uploads/${file.thumbnailPath}`} 
                    alt={file.originalName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400">
                    {getFileIcon(file.mimeType)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div>
                <h3 className="font-medium text-sm truncate" title={file.originalName}>
                  {file.originalName}
                </h3>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                {file.dimensions && (
                  <p className="text-xs text-gray-500">{file.dimensions}</p>
                )}
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                {getStatusBadge(file.status)}
                <div className="flex gap-1">
                  <FilePreviewDialog file={file} />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const FileListView = () => (
    <div className="space-y-2">
      {filteredFiles.map((file: FileItem) => (
        <Card key={file.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {getFileIcon(file.mimeType)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{file.originalName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    {file.dimensions && <span>• {file.dimensions}</span>}
                    {file.resolution && <span>• {file.resolution} DPI</span>}
                    <span>• {new Date(file.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusBadge(file.status)}
                <FilePreviewDialog file={file} />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteMutation.mutate(file.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Dosyalar yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Dosya Yöneticisi
            </CardTitle>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Dosya Yükle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Dosya ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Tüm Dosyalar</option>
                <option value="image">Görseller</option>
                <option value="document">Dokümanlar</option>
                <option value="design">Tasarımlar</option>
                <option value="other">Diğer</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* File Count */}
          <div className="text-sm text-gray-600">
            {filteredFiles.length} dosya bulundu
          </div>

          {/* Files Display */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dosya bulunamadı</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== "all" 
                  ? "Arama kriterlerinize uygun dosya bulunamadı." 
                  : "Henüz hiç dosya yüklememişsiniz."}
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                İlk Dosyanızı Yükleyin
              </Button>
            </div>
          ) : (
            viewMode === "grid" ? <FileGridView /> : <FileListView />
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Dosya Yükle</DialogTitle>
          </DialogHeader>
          <AdvancedFileUpload
            onFileUpload={handleFileUpload}
            maxFiles={10}
            maxSizeInMB={50}
            showPreview={true}
            allowMultiple={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}