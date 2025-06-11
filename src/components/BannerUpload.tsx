
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BannerUploadProps {
  onBannerChange: (imageUrl: string) => void;
  initialBanner?: string;
}

const BannerUpload = ({ onBannerChange, initialBanner = '' }: BannerUploadProps) => {
  const [bannerUrl, setBannerUrl] = useState<string>(initialBanner);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setBannerUrl(initialBanner);
  }, [initialBanner]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('BannerUpload: File selected for upload:', file.name);
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload only image files for banners",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit for banners
      toast({
        title: "File too large",
        description: "Please upload banner images smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload banner images",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('BannerUpload: Uploading banner file:', fileName);
      
      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file);

      if (error) {
        console.error('BannerUpload: Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media-uploads')
        .getPublicUrl(fileName);

      console.log('BannerUpload: Upload successful, public URL:', publicUrl);
      
      setBannerUrl(publicUrl);
      onBannerChange(publicUrl);

      toast({
        title: "Banner uploaded successfully",
        description: "Your banner image has been uploaded",
      });

    } catch (error) {
      console.error('BannerUpload: Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload banner image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const removeBanner = async () => {
    if (bannerUrl) {
      try {
        // Extract file path from URL to delete from storage
        const urlParts = bannerUrl.split('/storage/v1/object/public/media-uploads/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('media-uploads').remove([filePath]);
        }
      } catch (error) {
        console.error('BannerUpload: Error deleting file:', error);
      }
    }

    setBannerUrl('');
    onBannerChange('');
    
    toast({
      title: "Banner removed",
      description: "Banner image has been removed",
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-slate-300">Banner Image</Label>
      
      <div className="grid grid-cols-1 gap-3">
        <Label htmlFor="banner-upload" className="cursor-pointer">
          <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300/50 rounded-lg hover:border-slate-200 transition-colors bg-slate-50/10 hover:bg-slate-50/20">
            <div className="text-center">
              {uploading ? (
                <Loader2 className="mx-auto h-8 w-8 text-slate-300 mb-2 animate-spin" />
              ) : (
                <Upload className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              )}
              <span className="text-sm text-slate-200 font-medium">
                {uploading ? 'Uploading Banner...' : 'Choose Banner Image'}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Recommended: 728x90px for desktop, 320x50px for mobile. Max 10MB.
              </p>
            </div>
          </div>
        </Label>
        <Input
          id="banner-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {bannerUrl && (
        <Card className="bg-slate-700/50 border-slate-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Image className="text-blue-400" size={16} />
                <span className="text-xs text-white">Banner Preview</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeBanner}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <X size={12} />
              </Button>
            </div>
            
            <div className="mt-2">
              <img 
                src={bannerUrl} 
                alt="Banner preview"
                className="w-full h-20 object-cover rounded border border-slate-600"
                onLoad={() => console.log('BannerUpload: Banner image loaded successfully:', bannerUrl)}
                onError={(e) => {
                  console.error('BannerUpload: Error loading banner image:', bannerUrl, e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BannerUpload;
