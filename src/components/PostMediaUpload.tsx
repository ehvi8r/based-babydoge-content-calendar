
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Video, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PostMediaUploadProps {
  onMediaChange: (urls: string[]) => void;
  initialFiles?: string[];
}

const PostMediaUpload = ({ onMediaChange, initialFiles = [] }: PostMediaUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Update internal state when initialFiles prop changes
  useEffect(() => {
    const arraysEqual = initialFiles.length === uploadedFiles.length && 
      initialFiles.every((file, index) => file === uploadedFiles[index]);
    
    if (!arraysEqual) {
      console.log('PostMediaUpload: Updating uploadedFiles from initialFiles:', initialFiles);
      setUploadedFiles(initialFiles);
    }
  }, [initialFiles.length, initialFiles.join(',')]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('PostMediaUpload: Files selected for upload:', files.length);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload only images or videos for posts",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 50MB for posts",
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

      console.log('PostMediaUpload: Starting upload for', validFiles.length, 'files');

      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `post-${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        console.log('PostMediaUpload: Uploading file:', fileName);
        
        const { data, error } = await supabase.storage
          .from('media-uploads')
          .upload(fileName, file);

        if (error) {
          console.error('PostMediaUpload: Upload error:', error);
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media-uploads')
          .getPublicUrl(fileName);

        console.log('PostMediaUpload: Upload successful, public URL:', publicUrl);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newFiles = [...uploadedFiles, ...uploadedUrls];
      
      console.log('PostMediaUpload: All uploads complete. New files array:', newFiles);
      
      setUploadedFiles(newFiles);
      onMediaChange(newFiles);

      toast({
        title: "Upload successful",
        description: `${validFiles.length} file(s) uploaded successfully`,
      });

    } catch (error) {
      console.error('PostMediaUpload: Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const removeFile = async (index: number) => {
    const fileUrl = uploadedFiles[index];
    console.log('PostMediaUpload: Removing file:', fileUrl);
    
    try {
      // Extract file path from URL to delete from storage
      const urlParts = fileUrl.split('/storage/v1/object/public/media-uploads/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('media-uploads').remove([filePath]);
      }
    } catch (error) {
      console.error('PostMediaUpload: Error deleting file:', error);
    }

    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onMediaChange(newFiles);
  };

  console.log('PostMediaUpload render - uploadedFiles:', uploadedFiles);

  return (
    <div className="space-y-3">
      <Label className="text-blue-200">Media Upload for Post</Label>
      
      <div className="grid grid-cols-2 gap-2">
        <Label htmlFor="post-media-upload" className="cursor-pointer">
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-slate-300/50 rounded-lg hover:border-slate-200 transition-colors bg-slate-50/10 hover:bg-slate-50/20">
            <div className="text-center">
              {uploading ? (
                <Loader2 className="mx-auto h-6 w-6 text-slate-300 mb-2 animate-spin" />
              ) : (
                <Upload className="mx-auto h-6 w-6 text-slate-300 mb-2" />
              )}
              <span className="text-sm text-slate-200 font-medium">
                {uploading ? 'Uploading...' : 'Choose Files'}
              </span>
            </div>
          </div>
        </Label>
        <Input
          id="post-media-upload"
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
            <Card key={`post-media-${fileUrl}-${index}`} className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {fileUrl.includes('video') || fileUrl.toLowerCase().includes('.mp4') || fileUrl.toLowerCase().includes('.mov') ? (
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
                
                {/* Show thumbnail for images */}
                {(!fileUrl.includes('video') && !fileUrl.toLowerCase().includes('.mp4') && !fileUrl.toLowerCase().includes('.mov')) && (
                  <div className="mt-2">
                    <img 
                      src={fileUrl} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-16 object-cover rounded"
                      onLoad={() => console.log('PostMediaUpload: Image loaded successfully:', fileUrl)}
                      onError={(e) => {
                        console.error('PostMediaUpload: Error loading image:', fileUrl, e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Show video thumbnail/placeholder */}
                {(fileUrl.includes('video') || fileUrl.toLowerCase().includes('.mp4') || fileUrl.toLowerCase().includes('.mov')) && (
                  <div className="mt-2 bg-slate-600 rounded flex items-center justify-center h-16">
                    <Video className="text-purple-400" size={24} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostMediaUpload;
