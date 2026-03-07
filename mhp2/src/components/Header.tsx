import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, GraduationCap, Stethoscope, Shield, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDashboardPath } from "@/components/auth/ProtectedRoute";
import logo from "@/assets/logo.png";

const loginOptions = [
  { label: "Parent Login", icon: User, href: "/login/parent" },
  { label: "School Login", icon: GraduationCap, href: "/login/school" },
  { label: "Expert Login", icon: Stethoscope, href: "/login/expert" },
  { label: "Admin Login", icon: Shield, href: "/login/admin" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, backendUser, role, signOut, loading } = useAuth();
  const isLoggedIn = !!user || !!backendUser;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardPath = getRoleDashboardPath(role);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="My Health Passport" className="h-12 md:h-16 w-auto mix-blend-multiply dark:mix-blend-screen" style={{ backgroundColor: 'transparent' }} />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-4">
              {/* ... keep existing code (desktop nav buttons and login dropdown) */}
              <Button asChild variant="outline" size="lg">
                <Link to="/parents">
                  <span className="mr-2">👨‍👩‍👧</span>
                  For Parents
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/schools">
                  <span className="mr-2">🏫</span>
                  For Schools
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/resources">
                  <span className="mr-2">📚</span>
                  Resources
                </Link>
              </Button>
              
              {isLoggedIn && !loading ? (
                <div className="flex items-center gap-2">
                  <Button asChild size="lg">
                    <Link to={dashboardPath}>
                      Dashboard
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="lg" className="gap-2">
                        <User className="h-4 w-4" />
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to={dashboardPath} className="flex items-center gap-3 cursor-pointer">
                          <User className="h-4 w-4" />
                          My Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 cursor-pointer text-destructive">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg" className="gap-2">
                      Login
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {loginOptions.map((option) => (
                      <DropdownMenuItem key={option.label} asChild>
                        <Link to={option.href} className="flex items-center gap-3 cursor-pointer">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border animate-slide-up bg-background relative z-[70]">
              <nav className="flex flex-col gap-3">
                <Button asChild variant="outline" size="lg" className="w-full justify-start">
                  <Link to="/parents" onClick={() => setIsMenuOpen(false)}>
                    <span className="mr-2">👨‍👩‍👧</span>
                    For Parents
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full justify-start">
                  <Link to="/schools" onClick={() => setIsMenuOpen(false)}>
                    <span className="mr-2">🏫</span>
                    For Schools
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full justify-start">
                  <Link to="/resources" onClick={() => setIsMenuOpen(false)}>
                    <span className="mr-2">📚</span>
                    Resources
                  </Link>
                </Button>
                
                {isLoggedIn && !loading ? (
                  <div className="pt-4 border-t border-border space-y-2">
                    <Button asChild variant="default" size="lg" className="w-full">
                      <Link to={dashboardPath} onClick={() => setIsMenuOpen(false)}>
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full text-destructive"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Login as:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {loginOptions.map((option) => (
                        <Button 
                          key={option.label} 
                          asChild 
                          variant="secondary" 
                          size="sm" 
                          className="justify-start"
                        >
                          <Link to={option.href} onClick={() => setIsMenuOpen(false)}>
                            <option.icon className="h-4 w-4 mr-2" />
                            {option.label.replace(" Login", "")}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Nav Backdrop - outside header for proper stacking */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[49] lg:hidden" onClick={() => setIsMenuOpen(false)} />
      )}
    </>
  );
};

export default Header;
