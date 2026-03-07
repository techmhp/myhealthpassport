'use client';
import { Heart, Mail, Phone, MapPin, Instagram, Linkedin, Facebook } from "lucide-react";
const logo = "/marketing-assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="sm:col-span-2">
            <img src={logo} alt="My Health Passport" className="h-16 sm:h-20 w-auto mb-4 sm:mb-6 mix-blend-screen" style={{ backgroundColor: 'transparent' }} />
            <p className="text-white/70 max-w-md mb-4 sm:mb-6 text-sm sm:text-base">
              Empowering schools and parents through proactive child health screening and continuous wellness support.
            </p>
            <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-coral fill-coral" />
              <span>for every child</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/my_health_passport_/?utm_source=ig_web_button_share_sheet" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/91198533/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61578963448009" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3 text-white/70 text-sm sm:text-base">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/#need" className="hover:text-white transition-colors">Why MHP</a></li>
              <li><a href="/parents" className="hover:text-white transition-colors">Parents</a></li>
              <li><a href="/schools" className="hover:text-white transition-colors">Schools</a></li>
              <li><a href="/resources" className="hover:text-white transition-colors">Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Contact</h4>
            <ul className="space-y-2 sm:space-y-3 text-white/70 text-sm sm:text-base">
              <li className="flex items-center gap-2 sm:gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="break-all">admin@myhealthpassport.in</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+91 7793925151</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Hyderabad, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-xs sm:text-sm text-center sm:text-left">
            © 2026 My Health Passport. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-white/50 text-xs sm:text-sm">
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
