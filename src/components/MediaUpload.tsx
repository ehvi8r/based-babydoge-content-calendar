
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Video, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onMediaChange: (files: File[]) => void;
}

const MediaUpload = ({ onMediaChange }: MediaUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload only images or videos",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 50MB",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (uploadedFiles.length + validFiles.length > 4) {
      toast({
        title: "Too many files",
        description: "You can upload up to 4 media files per post",
        variant: "destructive",
      });
      return;
    }

    const newFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(newFiles);
    onMediaChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onMediaChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <Label className="text-blue-200">Media Upload</Label>
      
      <div className="grid grid-cols-2 gap-2">
        <Label htmlFor="media-upload" className="cursor-pointer">
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-orange-500/50 rounded-lg hover:border-orange-400 transition-colors bg-orange-500/10 hover:bg-orange-500/20">
            <div className="text-center">
              <Upload className="mx-auto h-6 w-6 text-orange-400 mb-2" />
              <span className="text-sm text-orange-300 font-medium">Choose Files</span>
            </div>
          </div>
        </Label>
        <Input
          id="media-upload"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="text-xs text-slate-400 col-span-2">
          Supports images and videos up to 50MB. Max 4 files per post.
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {file.type.startsWith('image/') ? (
                      <Image className="text-blue-400" size={16} />
                    ) : (
                      <Video className="text-purple-400" size={16} />
                    )}
                    <span className="text-xs text-white truncate">
                      {file.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <X size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
