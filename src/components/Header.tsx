import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext"; // Adjust the path as needed

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b bg-background py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="text-2xl font-bold text-primary">QueueLess</div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Services
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            // Show when logged in
            <Button onClick={logout} variant="default" className="bg-hero-gradient">
              Logout
            </Button>
          ) : (
            // Show when logged out
            <>
              <Button onClick={() => navigate("/signup")} variant="ghost" className="text-foreground hover:text-primary">
                Sign Up
              </Button>
              <Button onClick={() => navigate("/login")} variant="default" className="bg-hero-gradient">
                Login
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <nav className="flex flex-col gap-6 mt-8">
              <Link to="/" className="text-lg text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/" className="text-lg text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/" className="text-lg text-foreground hover:text-primary transition-colors">
                Services
              </Link>
              <div className="flex flex-col gap-3 mt-6 pt-6 border-t">
                {user ? (
                  // Show when logged in (mobile)
                  <Button onClick={logout} variant="default" className="bg-hero-gradient w-full">
                    Logout
                  </Button>
                ) : (
                  // Show when logged out (mobile)
                  <>
                    <Button onClick={() => navigate("/signup")} variant="ghost" className="text-foreground hover:text-primary w-full">
                      Sign Up
                    </Button>
                    <Button onClick={() => navigate("/login")} variant="default" className="bg-hero-gradient w-full">
                      Login
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;