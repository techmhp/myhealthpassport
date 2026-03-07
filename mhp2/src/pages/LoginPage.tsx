import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User, GraduationCap, Stethoscope, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const loginPortals = [
  {
    role: 'parent',
    label: 'Parents',
    icon: User,
    path: '/login/parent',
    description: 'Access your child\'s health passport',
    color: 'brand',
  },
  {
    role: 'school',
    label: 'School',
    icon: GraduationCap,
    path: '/login/school',
    description: 'Manage student health programs',
    color: 'lavender',
  },
  {
    role: 'admin',
    label: 'Admin & Staff',
    icon: Shield,
    path: '/login/admin',
    description: 'System administration access',
    color: 'mint',
  },
  {
    role: 'expert',
    label: 'Experts',
    icon: Stethoscope,
    path: '/login/expert',
    description: 'Health professional portal',
    color: 'coral',
  },
];

const colorClasses: Record<string, { bg: string; border: string; iconBg: string; iconText: string }> = {
  brand: { 
    bg: 'bg-brand/5 hover:bg-brand/10', 
    border: 'border-brand/20 hover:border-brand/40',
    iconBg: 'bg-brand/10',
    iconText: 'text-brand'
  },
  lavender: { 
    bg: 'bg-lavender/5 hover:bg-lavender/10', 
    border: 'border-lavender/20 hover:border-lavender/40',
    iconBg: 'bg-lavender/10',
    iconText: 'text-lavender'
  },
  mint: { 
    bg: 'bg-mint/5 hover:bg-mint/10', 
    border: 'border-mint/20 hover:border-mint/40',
    iconBg: 'bg-mint/10',
    iconText: 'text-mint'
  },
  coral: { 
    bg: 'bg-coral/5 hover:bg-coral/10', 
    border: 'border-coral/20 hover:border-coral/40',
    iconBg: 'bg-coral/10',
    iconText: 'text-coral'
  },
};

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-lg">
              Select your portal to sign in
            </p>
          </div>

          <Card className="shadow-xl border-border/50">
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-4">
                {loginPortals.map((portal) => {
                  const colors = colorClasses[portal.color];
                  return (
                    <Link
                      key={portal.role}
                      to={portal.path}
                      className={`group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border-2 transition-all duration-300 ${colors.bg} ${colors.border} hover:shadow-lg hover:scale-[1.02]`}
                    >
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${colors.iconBg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <portal.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.iconText}`} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground text-center">
                        {portal.label}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1 hidden sm:block">
                        {portal.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need help? <a href="mailto:support@myhealthpassport.in" className="text-brand hover:underline">Contact Support</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
