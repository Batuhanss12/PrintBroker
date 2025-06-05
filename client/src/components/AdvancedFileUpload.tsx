import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Upload, File, CheckCircle, AlertCircle, Eye, Image, FileText, Download, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (fileId: string) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
  showPreview?: boolean;
  allowMultiple?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  thumbnailPath?: string;
  dimensions?: string;
  colorProfile?: string;
  resolution?: number;
  hasTransparency?: boolean;
  pageCount?: number;
  processingNotes?: string;
  downloadCount?: number;
  fileType?: string;
  errors?: string[];
}

export default function AdvancedFileUpload({
  onFileUpload,
  maxFiles = 10,
  maxSizeInMB = 50,
  acceptedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  className,
  showPreview = true,
  allowMultiple = true
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (response, file) => {
      const uploadedFile = files.find(f => f.name === file.name);
      if (uploadedFile) {
        updateFileStatus(uploadedFile.id, 'completed', response);
        onFileUpload(response.id);
      }
    },
    onError: (error, file) => {
      const uploadedFile = files.find(f => f.name === file.name);
      if (uploadedFile) {
        updateFileStatus(uploadedFile.id, 'error');
      }
      toast({
        title: "Yükleme Hatası",
        description: `${file.name} yüklenemedi.`,
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];

    if (file.size > maxSizeInMB * 1024 * 1024) {
      errors.push(`Dosya boyutu ${maxSizeInMB}MB'dan büyük olamaz`);
    }

    if (!acceptedTypes.includes(file.type)) {
      errors.push('Desteklenmeyen dosya formatı');
    }

    return errors;
  };

  const updateFileStatus = (fileId: string, status: UploadedFile['status'], data?: any) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? { 
              ...file, 
              status, 
              progress: status === 'completed' ? 100 : file.progress,
              ...data
            }
          : file
      )
    );
  };

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    if (!allowMultiple && selectedFiles.length > 1) {
      toast({
        title: "Çoklu Dosya",
        description: "Sadece bir dosya seçebilirsiniz.",
        variant: "destructive",
      });
      return;
    }

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Dosya Limiti",
        description: `En fazla ${maxFiles} dosya yükleyebilirsiniz.`,
        variant: "destructive",
      });
      return;
    }

    Array.from(selectedFiles).forEach(file => {
      const errors = validateFile(file);
      
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: errors.length > 0 ? 'error' : 'uploading',
        errors: errors.length > 0 ? errors : undefined
      };

      setFiles(prevFiles => [...prevFiles, newFile]);

      if (errors.length === 0) {
        uploadMutation.mutate(file);
      }
    });
  }, [files.length, maxFiles, allowMultiple, uploadMutation, toast]);

  const removeFile = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const FilePreviewDialog = ({ file }: { file: UploadedFile }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* File Preview */}
          {file.thumbnailPath && (
            <div className="flex justify-center">
              <img 
                src={`/uploads/${file.thumbnailPath}`} 
                alt={file.name}
                className="max-w-full max-h-64 object-contain rounded-lg border"
              />
            </div>
          )}

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Dosya Boyutu:</span>
              <p>{formatFileSize(file.size)}</p>
            </div>
            <div>
              <span className="font-medium">Dosya Türü:</span>
              <p>{file.type}</p>
            </div>
            {file.dimensions && (
              <div>
                <span className="font-medium">Boyutlar:</span>
                <p>{file.dimensions}</p>
              </div>
            )}
            {file.resolution && (
              <div>
                <span className="font-medium">Çözünürlük:</span>
                <p>{file.resolution} DPI</p>
              </div>
            )}
            {file.colorProfile && (
              <div>
                <span className="font-medium">Renk Profili:</span>
                <p>{file.colorProfile}</p>
              </div>
            )}
            {file.pageCount && file.pageCount > 1 && (
              <div>
                <span className="font-medium">Sayfa Sayısı:</span>
                <p>{file.pageCount}</p>
              </div>
            )}
          </div>

          {/* Processing Notes */}
          {file.processingNotes && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <span className="font-medium text-sm">İşleme Notları:</span>
                  <p className="text-sm text-gray-600">{file.processingNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Transparency and Technical Info */}
          <div className="flex flex-wrap gap-2">
            {file.hasTransparency && (
              <Badge variant="secondary">Şeffaflık Var</Badge>
            )}
            {file.fileType && (
              <Badge variant="outline">{file.fileType.toUpperCase()}</Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = allowMultiple;
          input.accept = acceptedTypes.join(',');
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) {
              handleFileSelect(target.files);
            }
          };
          input.click();
        }}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Dosya Yükle</h3>
          <p className="text-gray-600 mb-4">
            Dosyaları buraya sürükleyin veya tıklayarak seçin
          </p>
          <div className="text-sm text-gray-500">
            <p>Maksimum dosya boyutu: {maxSizeInMB}MB</p>
            <p>Desteklenen formatlar: JPG, PNG, PDF, DOC, TXT</p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Yüklenen Dosyalar ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === 'completed' && file.dimensions && (
                        <span>• {file.dimensions}</span>
                      )}
                      {file.status === 'completed' && file.resolution && (
                        <span>• {file.resolution} DPI</span>
                      )}
                    </div>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                    
                    {file.errors && file.errors.length > 0 && (
                      <div className="mt-2">
                        {file.errors.map((error, idx) => (
                          <p key={idx} className="text-sm text-red-600">{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(file)}
                  
                  {file.status === 'completed' && showPreview && (
                    <FilePreviewDialog file={file} />
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}