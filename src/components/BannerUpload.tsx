
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BannerUploadProps {
  onBannerUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
}

const BannerUpload = ({ onBannerUploaded, currentImageUrl }: BannerUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://babydoge20.com');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadBanner = async (file: File) => {
    try {
      setUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(fileName);

      onBannerUploaded(publicUrl);
      
      toast({
        title: "Success",
        description: "Banner image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast({
        title: "Error",
        description: "Failed to upload banner image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, GIF, or WebP image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      uploadBanner(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeBanner = () => {
    onBannerUploaded('');
    toast({
      title: "Banner removed",
      description: "Banner image has been removed",
    });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Banner Management</h3>
        {currentImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={removeBanner}
            className="text-red-400 border-red-400/50 hover:bg-red-400/10"
          >
            <Trash2 size={16} className="mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Current banner preview */}
      {currentImageUrl && (
        <div className="space-y-2">
          <Label className="text-slate-300">Current Banner Preview:</Label>
          <div className="border border-slate-600 rounded-lg overflow-hidden">
            <img
              src={currentImageUrl}
              alt="Current banner"
              className="w-full h-20 object-cover"
            />
          </div>
        </div>
      )}

      {/* Upload new banner */}
      <div className="space-y-2">
        <Label className="text-slate-300">
          Upload New Banner Image
        </Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <Button
            onClick={handleUploadClick}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Choose & Upload Image
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Recommended: 728x90px for desktop, 320x50px for mobile. Max 10MB. Formats: JPEG, PNG, GIF, WebP
        </p>
      </div>

      {/* Link URL */}
      <div className="space-y-2">
        <Label htmlFor="banner-link" className="text-slate-300">
          Banner Click URL
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="banner-link"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-slate-700 border-slate-600 text-white"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(linkUrl, '_blank')}
            className="border-slate-600"
          >
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BannerUpload;
