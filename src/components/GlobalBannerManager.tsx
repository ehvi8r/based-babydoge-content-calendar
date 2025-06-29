import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Eye, EyeOff, Image } from 'lucide-react';
import { useGlobalBanners } from '@/hooks/useGlobalBanners';
import { useUserRole } from '@/hooks/useUserRole';
import BannerUpload from '@/components/BannerUpload';

const GlobalBannerManager = () => {
  const { banners, createBanner, updateBanner, loading } = useGlobalBanners();
  const { isAdmin } = useUserRole();
  const [newBanner, setNewBanner] = useState({
    imageUrl: '',
    linkUrl: 'https://babydoge20.com',
    title: ''
  });

  if (!isAdmin) {
    return null; // Only admins can manage global banners
  }

  const handleCreateBanner = async () => {
    if (!newBanner.imageUrl.trim()) return;
    
    const success = await createBanner(
      newBanner.imageUrl,
      newBanner.linkUrl,
      newBanner.title || undefined
    );
    
    if (success) {
      setNewBanner({
        imageUrl: '',
        linkUrl: 'https://babydoge20.com',
        title: ''
      });
    }
  };

  const handleBannerChange = (imageUrl: string) => {
    console.log('GlobalBannerManager: Banner change callback received:', imageUrl);
    setNewBanner(prev => ({ ...prev, imageUrl }));
  };

  const toggleBannerActive = async (id: string, currentStatus: boolean) => {
    await updateBanner(id, { is_active: !currentStatus });
  };

  if (loading) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="global-banner-management" className="bg-slate-800/50 border-blue-500/20 rounded-lg">
          <AccordionTrigger className="px-6 py-4 text-white hover:no-underline">
            <div className="flex items-center gap-2">
              <Image className="text-blue-400" size={20} />
              Global Banner Management
              <Badge variant="secondary" className="bg-blue-600 text-white">
                Admin Only
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="text-center text-white">Loading banners...</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  console.log('GlobalBannerManager render - newBanner.imageUrl:', newBanner.imageUrl);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="global-banner-management" className="bg-slate-800/50 border-blue-500/20 rounded-lg">
        <AccordionTrigger className="px-6 py-4 text-white hover:no-underline">
          <div className="flex items-center gap-2">
            <Image className="text-blue-400" size={20} />
            Global Banner Management
            <Badge variant="secondary" className="bg-blue-600 text-white">
              Admin Only
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-6">
            {/* Create New Banner */}
            <div className="space-y-4 p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-white font-medium">Create New Banner</h3>
              <div className="space-y-3">
                <BannerUpload 
                  onBannerChange={handleBannerChange}
                  initialBanner={newBanner.imageUrl}
                />
                
                <div>
                  <Label htmlFor="bannerImageUrl" className="text-slate-300">Image URL (or upload above)</Label>
                  <Input
                    id="bannerImageUrl"
                    value={newBanner.imageUrl}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/banner.jpg"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="bannerLinkUrl" className="text-slate-300">Link URL</Label>
                  <Input
                    id="bannerLinkUrl"
                    value={newBanner.linkUrl}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://babydoge20.com"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="bannerTitle" className="text-slate-300">Title (Optional)</Label>
                  <Input
                    id="bannerTitle"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Banner title"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <Button 
                  onClick={handleCreateBanner}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!newBanner.imageUrl.trim()}
                >
                  <Plus size={16} className="mr-2" />
                  Create Banner
                </Button>
              </div>
            </div>

            {/* Existing Banners */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Existing Banners ({banners.length})</h3>
              {banners.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  No banners created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <div key={banner.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={banner.is_active ? "default" : "secondary"}
                            className={banner.is_active ? "bg-green-600" : "bg-gray-600"}
                          >
                            {banner.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {banner.title && (
                            <span className="text-white text-sm">{banner.title}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBannerActive(banner.id, banner.is_active)}
                            className="text-slate-300 hover:bg-slate-600"
                          >
                            {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-slate-400">Image URL:</div>
                        <div className="text-white text-sm bg-slate-600 p-2 rounded break-all">
                          {banner.image_url}
                        </div>
                        
                        <div className="text-xs text-slate-400">Link URL:</div>
                        <div className="text-white text-sm bg-slate-600 p-2 rounded break-all">
                          {banner.link_url}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mt-3">
                        <div className="text-xs text-slate-400 mb-2">Preview:</div>
                        <div className="border border-slate-600 rounded overflow-hidden">
                          <img 
                            src={banner.image_url} 
                            alt={banner.title || "Banner"} 
                            className="w-full h-16 object-cover"
                            onError={(e) => {
                              console.error('Error loading banner image:', e);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default GlobalBannerManager;
