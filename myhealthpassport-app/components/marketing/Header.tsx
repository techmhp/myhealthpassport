'use client';
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Menu, X, ChevronDown, User, GraduationCap, Stethoscope, Shield } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
const logo = "/marketing-assets/logo.png";

const loginOptions = [
  { label: "Parent Login", icon: User, href: "/parent-login" },
  { label: "School Login", icon: GraduationCap, href: "/school-login" },
  { label: "Expert Login", icon: Stethoscope, href: "/expert-login" },
  { label: "Admin Login", icon: Shield, href: "/login" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // TODO: Integrate with Next.js auth when available
  // Previously used useAuth() from @/contexts/AuthContext and getRoleDashboardPath from auth utils

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src={logo} alt="My Health Passport" className="h-12 md:h-16 w-auto mix-blend-multiply dark:mix-blend-screen" style={{ backgroundColor: 'transparent' }} />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/parents">
                  <span className="mr-2">👨‍👩‍👧</span>
                  For Parents
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/schools">
                  <span className="mr-2">🏫</span>
                  For Schools
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/resources">
                  <span className="mr-2">📚</span>
                  Resources
                </Link>
              </Button>

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
                      <Link href={option.href} className="flex items-center gap-3 cursor-pointer">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <Link href="/parents" onClick={() => setIsMenuOpen(false)}>
                    <span className="mr-2">👨‍👩‍👧</span>
                    For Parents
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full justify-start">
                  <Link href="/schools" onClick={() => setIsMenuOpen(false)}>
                    <span className="mr-2">🏫</span>
                    For Schools
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full justify-start">
                  <Link href="/resources" onClick={() => setIsMenuOpen(false)}>
                    <span className="mr-2">📚</span>
                    Resources
                  </Link>
                </Button>

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
                        <Link href={option.href} onClick={() => setIsMenuOpen(false)}>
                          <option.icon className="h-4 w-4 mr-2" />
                          {option.label.replace(" Login", "")}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
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
