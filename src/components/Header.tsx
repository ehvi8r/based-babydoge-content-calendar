
import { Clock, Globe } from 'lucide-react';
import TwitterApiConfig from './TwitterApiConfig';

const Header = () => {
  return (
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-blue-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">BD</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">BabyDoge</h2>
              <p className="text-blue-200 text-sm">babydoge20.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <TwitterApiConfig />
            
            <div className="flex items-center gap-6 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>UTC-5 (EST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <span>X/Twitter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
