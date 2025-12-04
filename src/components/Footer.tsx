import { Facebook, Twitter, Instagram, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Carwash App</h3>
            <p className="text-sm opacity-90">
              Your trusted platform for finding and booking premium car wash services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" className="opacity-90 hover:opacity-100 transition-opacity">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="opacity-90 hover:opacity-100 transition-opacity">
                  About Us
                </a>
              </li>
              <li>
                <a href="#services" className="opacity-90 hover:opacity-100 transition-opacity">
                  Services
                </a>
              </li>
              <li>
                <a href="#contact" className="opacity-90 hover:opacity-100 transition-opacity">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h4 className="font-semibold mb-4">For Businesses</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#join" className="opacity-90 hover:opacity-100 transition-opacity">
                  Join Our Platform
                </a>
              </li>
              <li>
                <a href="#pricing" className="opacity-90 hover:opacity-100 transition-opacity">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#resources" className="opacity-90 hover:opacity-100 transition-opacity">
                  Resources
                </a>
              </li>
              <li>
                <a href="#support" className="opacity-90 hover:opacity-100 transition-opacity">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <div className="flex gap-4 mb-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm opacity-90">
              support@carwashapp.com
            </p>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-sm opacity-90">
          <p>&copy; {new Date().getFullYear()} Carwash App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
