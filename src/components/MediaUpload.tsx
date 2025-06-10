
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Video, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MediaUploadProps {
  onMediaChange: (urls: string[]) => void;
}

const MediaUpload = ({ onMediaChange }: MediaUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return;
      }

      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newFiles = [...uploadedFiles, ...uploadedUrls];
      
      setUploadedFiles(newFiles);
      onMediaChange(newFiles);

      toast({
        title: "Upload successful",
        description: `${validFiles.length} file(s) uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (index: number) => {
    const fileUrl = uploadedFiles[index];
    
    try {
      // Extract file path from URL to delete from storage
      const urlParts = fileUrl.split('/storage/v1/object/public/media/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('media').remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

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
              {uploading ? (
                <Loader2 className="mx-auto h-6 w-6 text-orange-400 mb-2 animate-spin" />
              ) : (
                <Upload className="mx-auto h-6 w-6 text-orange-400 mb-2" />
              )}
              <span className="text-sm text-orange-300 font-medium">
                {uploading ? 'Uploading...' : 'Choose Files'}
              </span>
            </div>
          </div>
        </Label>
        <Input
          id="media-upload"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        
        <div className="text-xs text-slate-400 col-span-2">
          Supports images and videos up to 50MB. Max 4 files per post.
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {uploadedFiles.map((fileUrl, index) => (
            <Card key={index} className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {fileUrl.includes('video') ? (
                      <Video className="text-purple-400" size={16} />
                    ) : (
                      <Image className="text-blue-400" size={16} />
                    )}
                    <span className="text-xs text-white truncate">
                      Media {index + 1}
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
                {fileUrl.includes('image') && (
                  <img 
                    src={fileUrl} 
                    alt={`Upload ${index + 1}`}
                    className="mt-2 w-full h-16 object-cover rounded"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
