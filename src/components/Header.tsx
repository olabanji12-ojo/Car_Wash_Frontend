import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold text-primary hover:opacity-90 transition-opacity">
          QueueLess
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            About
          </Link>
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Services
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border bg-muted/50 hover:bg-muted">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button onClick={() => navigate("/signup")} variant="ghost" className="text-sm font-medium text-foreground hover:text-primary">
                Sign Up
              </Button>
              <Button onClick={() => navigate("/login")} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
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
              <Link to="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                Services
              </Link>
              <div className="flex flex-col gap-3 mt-6 pt-6 border-t">
                {user ? (
                  <>
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button onClick={logout} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => navigate("/signup")} variant="ghost" className="text-foreground hover:text-primary w-full">
                      Sign Up
                    </Button>
                    <Button onClick={() => navigate("/login")} variant="default" className="bg-primary w-full shadow-sm">
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