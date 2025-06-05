import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  File, 
  X, 
  Check,
  FileImage,
  FileText,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (fileId: string) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export default function FileUpload({
  onFileUpload,
  maxFiles = 10,
  maxSizeInMB = 100,
  acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/postscript',
    'image/svg+xml',
    'application/zip',
    'application/x-rar-compressed'
  ],
  className
}: FileUploadProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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
    onSuccess: (data, file) => {
      const fileId = Date.now().toString(); // Temporary ID for UI
      setUploadedFiles(prev => prev.map(f => 
        f.name === file.name && f.status === 'uploading'
          ? { ...f, status: 'completed', progress: 100, id: data.id }
          : f
      ));
      onFileUpload(data.id);
      toast({
        title: "Başarılı",
        description: `${file.name} başarıyla yüklendi.`,
      });
    },
    onError: (error, file) => {
      setUploadedFiles(prev => prev.map(f => 
        f.name === file.name && f.status === 'uploading'
          ? { ...f, status: 'error', progress: 0 }
          : f
      ));
      toast({
        title: "Hata",
        description: `${file.name} yüklenirken bir hata oluştu.`,
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Desteklenmeyen dosya türü. Sadece resim, PDF, AI, SVG, ZIP ve RAR dosyaları kabul edilir.';
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `Dosya boyutu ${maxSizeInMB}MB'dan büyük olamaz.`;
    }

    if (uploadedFiles.length >= maxFiles) {
      return `En fazla ${maxFiles} dosya yükleyebilirsiniz.`;
    }

    return null;
  };

  const handleFileSelect = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Hata",
          description: error,
          variant: "destructive",
        });
        return;
      }

      const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newFile: UploadedFile = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, newFile]);
      uploadMutation.mutate(file);
    });
  }, [uploadedFiles.length, maxFiles, toast, uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FileImage className="h-5 w-5" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="h-5 w-5" />;
    }
    if (type.includes('zip') || type.includes('rar')) {
      return <Archive className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary hover:bg-gray-50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Dosyaları sürükleyip bırakın
        </h3>
        <p className="text-gray-600 mb-4">
          veya dosya seçmek için tıklayın
        </p>
        <Button variant="outline" type="button">
          Dosya Seç
        </Button>
        
        <input
          id="file-input"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Desteklenen formatlar: JPG, PNG, PDF, AI, SVG, ZIP, RAR</p>
          <p>Maksimum dosya boyutu: {maxSizeInMB}MB</p>
          <p>Maksimum dosya sayısı: {maxFiles}</p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Yüklenen Dosyalar ({uploadedFiles.length}/{maxFiles})
          </h4>
          
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <Badge
                    variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'error' ? 'destructive' : 'secondary'
                    }
                    className="ml-2 flex-shrink-0"
                  >
                    {file.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                    {file.status === 'completed' ? 'Tamamlandı' :
                     file.status === 'error' ? 'Hata' : 'Yükleniyor...'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {file.status === 'uploading' && (
                    <div className="flex-1 max-w-32 ml-2">
                      <Progress value={file.progress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
