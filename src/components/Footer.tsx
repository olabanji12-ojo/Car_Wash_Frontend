import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Carwash App</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Your trusted platform for finding and booking premium car wash services. Making car care effortless, one booking at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  Find Carwash
                </Link>
              </li>
              <li>
                <Link to="/signup" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  Join as Business
                </Link>
              </li>
              <li>
                <Link to="/login" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h4 className="font-semibold mb-4">For Businesses</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/signup" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  List Your Business
                </Link>
              </li>
              <li>
                <Link to="/business-dashboard" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  Business Dashboard
                </Link>
              </li>
              <li>
                <Link to="/signup" className="opacity-90 hover:opacity-100 transition-opacity hover:underline">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <div className="flex gap-3 mb-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm opacity-90">
              Questions? Reach out anytime
            </p>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-sm opacity-90">
          <p>&copy; {currentYear} Carwash App. All rights reserved. Built with ❤️ for car enthusiasts.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
