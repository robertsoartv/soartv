import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 tracking-wide italic" style={{ fontFamily: 'Brush Script MT, cursive, fantasy' }}>
              <span className="text-yellow-400" style={{ textShadow: '0 0 15px rgba(255, 235, 59, 0.8)' }}>Soar</span>
              <span className="text-red-500 ml-1" style={{ textShadow: '0 0 15px rgba(244, 67, 54, 0.8)' }}>TV</span>
            </h3>
            <p className="text-neutral-light opacity-70 text-sm leading-relaxed">
              Your ultimate destination for free streaming entertainment. 
              Watch thousands of movies and TV shows anytime, anywhere.
            </p>
          </div>
          
          <div>
            <h4 className="text-neutral-light font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">Movies</a></li>
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">TV Shows</a></li>
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">Documentaries</a></li>
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">New Releases</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-neutral-light font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm mb-6">
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">Help Center</a></li>
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">Contact Us</a></li>
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">Terms of Service</a></li>
            </ul>
            
            {/* Video Section */}
            <div className="flex justify-center">
              <div className="rounded-lg overflow-hidden">
                <video 
                  width="200" 
                  height="200" 
                  controls 
                  autoPlay
                  muted
                  loop
                  className="rounded-lg"
                >
                  <source src="/attached_assets/Fusion Atom_1753381995636.MOV" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-neutral-light font-semibold mb-4">Connect</h4>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-light opacity-70 hover:text-accent transition-colors duration-200">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            
            {/* QR Code underneath social icons */}
            <div className="flex justify-center mb-8">
              <div className="rounded-lg overflow-hidden">
                <img 
                  src="/attached_assets/FDTL Marketplace 2_1753381550788.PNG" 
                  alt="Fusion Marketplace QR Code"
                  className="w-56 h-auto rounded-lg"
                />
              </div>
            </div>
            

          </div>
        </div>
        

        <div className="border-t border-neutral-medium mt-8 pt-8 text-center">
          <p className="text-neutral-light opacity-70 text-sm">
            © 2024 Soar TV. All rights reserved. Built with modern web technologies.
          </p>
        </div>
      </div>
    </footer>
  );
}
