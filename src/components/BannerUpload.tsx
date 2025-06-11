
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, ExternalLink, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MediaUpload from '@/components/MediaUpload';

interface BannerUploadProps {
  onBannerUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onLinkUrlChange: (linkUrl: string) => void;
  currentLinkUrl: string;
}

const BannerUpload = ({ onBannerUploaded, currentImageUrl, onLinkUrlChange, currentLinkUrl }: BannerUploadProps) => {
  const [linkUrl, setLinkUrl] = useState(currentLinkUrl);
  const { toast } = useToast();

  useEffect(() => {
    setLinkUrl(currentLinkUrl);
  }, [currentLinkUrl]);

  const handleLinkUrlChange = (newUrl: string) => {
    setLinkUrl(newUrl);
    onLinkUrlChange(newUrl);
  };

  const handleMediaChange = (urls: string[]) => {
    if (urls.length > 0) {
      onBannerUploaded(urls[0]); // Use the first uploaded image as banner
    }
  };

  const removeBanner = () => {
    onBannerUploaded('');
    toast({
      title: "Banner removed",
      description: "Banner image has been removed",
    });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="banner-management" className="bg-slate-800/50 border-blue-500/20 rounded-lg">
        <AccordionTrigger className="px-6 py-4 text-white hover:no-underline">
          <div className="flex items-center gap-2">
            <Image className="text-blue-400" size={20} />
            Banner Management
            {currentImageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBanner();
                }}
                className="ml-auto text-red-400 border-red-400/50 hover:bg-red-400/10"
              >
                <Trash2 size={16} className="mr-2" />
                Remove
              </Button>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4">
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

            {/* Upload new banner using MediaUpload */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Upload New Banner Image
              </Label>
              <MediaUpload 
                onMediaChange={handleMediaChange}
                initialFiles={currentImageUrl ? [currentImageUrl] : []}
              />
              <p className="text-xs text-slate-400">
                Recommended: 728x90px for desktop, 320x50px for mobile. Max 50MB. Formats: Images and videos supported
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
                  onChange={(e) => handleLinkUrlChange(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(linkUrl, '_blank')}
                  className="border-slate-600"
                  disabled={!linkUrl}
                >
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default BannerUpload;
