import { useState } from "react";
import { Search, User, Menu } from "lucide-react";

export default function NavigationHeader() {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-prime-dark px-6 py-3">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left Section */}
        <div className="flex items-center space-x-8">
          <div className="text-white text-xl font-bold">prime video</div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-white hover:text-prime-blue transition-colors">Home</a>
            <a href="#" className="text-white hover:text-prime-blue transition-colors">Movies</a>
            <a href="#" className="text-white hover:text-prime-blue transition-colors">TV shows</a>
            <a href="#" className="text-white hover:text-prime-blue transition-colors">Sports</a>
            <a href="#" className="text-white hover:text-prime-blue transition-colors">Live TV</a>
          </div>
        </div>

        {/* Center - Prime Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:block">
          <div className="text-white text-sm font-medium">prime</div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <Search className="text-white w-5 h-5 cursor-pointer hover:text-prime-blue transition-colors" />
            <button className="text-white text-sm hover:text-prime-blue transition-colors">Subscriptions</button>
            <button className="bg-prime-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors">
              Join Prime
            </button>
          </div>
          <User className="text-white w-6 h-6 cursor-pointer hover:text-prime-blue transition-colors" />
          <Menu className="md:hidden text-white w-6 h-6 cursor-pointer" />
        </div>
      </div>
    </nav>
  );
}
