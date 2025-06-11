
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
  imageUrl: string;
  linkUrl: string;
  altText: string;
  title?: string;
}

const AdBanner = ({ imageUrl, linkUrl, altText, title }: AdBannerProps) => {
  const handleClick = () => {
    window.open(linkUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full">
      <div 
        onClick={handleClick}
        className="relative group cursor-pointer overflow-hidden rounded-lg border border-blue-500/20 bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-300 hover:border-blue-400/40"
      >
        {/* Desktop Banner - 728x90 */}
        <div className="hidden md:block">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-[90px] object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ aspectRatio: '728/90' }}
          />
        </div>
        
        {/* Mobile Banner - 320x50 */}
        <div className="block md:hidden">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-[50px] object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ aspectRatio: '320/50' }}
          />
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <ExternalLink className="text-white/80" size={20} />
        </div>
        
        {/* Optional title */}
        {title && (
          <div className="absolute bottom-1 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
            {title}
          </div>
        )}
      </div>
      
      {/* Ad label for transparency */}
      <div className="text-center mt-1">
        <span className="text-xs text-slate-400">Advertisement</span>
      </div>
    </div>
  );
};

export default AdBanner;
