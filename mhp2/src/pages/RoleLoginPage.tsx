import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth, AppRole, mapUrlRoleToBackendRoleType } from '@/contexts/AuthContext';
import { getRoleDashboardPath } from '@/components/auth/ProtectedRoute';
import { User, GraduationCap, Stethoscope, Shield, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import logo from '@/assets/logo.png';

const adminTeamRoles = [
  'On Ground Team',
  'Screening Team',
  'Analyst Team',
  'Admin Team',
];

const getLoginSchema = (role?: string) => z.object({
  email: (role === 'school' || role === 'admin' || role === 'expert')
    ? z.string().trim().min(1, { message: 'Please enter your username or phone number' })
    : z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  teamRole: z.string().optional(),
});

type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;

const roleConfig: Record<string, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  description: string;
}> = {
  parent: { 
    label: 'Parent', 
    icon: User, 
    color: 'brand',
    description: 'Access your child\'s health passport and wellness reports'
  },
  school: { 
    label: 'School', 
    icon: GraduationCap, 
    color: 'lavender',
    description: 'Manage student health programs and view analytics'
  },
  admin: { 
    label: 'Admin & Staff', 
    icon: Shield, 
    color: 'mint',
    description: 'System administration and user management'
  },
  expert: { 
    label: 'Expert', 
    icon: Stethoscope, 
    color: 'coral',
    description: 'Access patient consultations and health assessments'
  },
};

const colorClasses: Record<string, { bg: string; text: string; border: string; button: string }> = {
  brand: { 
    bg: 'bg-brand/10', 
    text: 'text-brand', 
    border: 'border-brand/30',
    button: 'bg-brand hover:bg-brand/90'
  },
  lavender: { 
    bg: 'bg-lavender/10', 
    text: 'text-lavender', 
    border: 'border-lavender/30',
    button: 'bg-lavender hover:bg-lavender/90'
  },
  mint: { 
    bg: 'bg-mint/10', 
    text: 'text-mint', 
    border: 'border-mint/30',
    button: 'bg-mint hover:bg-mint/90'
  },
  coral: { 
    bg: 'bg-coral/10', 
    text: 'text-coral', 
    border: 'border-coral/30',
    button: 'bg-coral hover:bg-coral/90'
  },
};

const RoleLoginPage = () => {
  const { role: urlRole } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, backendUser, role: userRole, signIn, signInWithBackend, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const config = urlRole ? roleConfig[urlRole] : null;
  const colors = config ? colorClasses[config.color] : colorClasses.brand;
  const IconComponent = config?.icon || User;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(getLoginSchema(urlRole)),
    defaultValues: {
      email: '',
      password: '',
      teamRole: '',
    },
  });

  // Redirect if already logged in (Supabase or backend session)
  useEffect(() => {
    if ((user || backendUser) && userRole && !authLoading) {
      const dashboardPath = getRoleDashboardPath(userRole);
      navigate(dashboardPath, { replace: true });
    }
  }, [user, backendUser, userRole, authLoading, navigate]);

  // Handle invalid role in URL
  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header />
        <main className="pt-32 pb-16 px-4 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Invalid Login Portal</h2>
              <p className="text-muted-foreground mb-6">
                The portal you're trying to access doesn't exist.
              </p>
              <Button asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      // School/Expert/Admin → Durga's backend API
      if (urlRole === 'school' || urlRole === 'expert' || urlRole === 'admin') {
        const roleType = mapUrlRoleToBackendRoleType(urlRole, values.teamRole);
        const { error } = await signInWithBackend(
          values.email,
          values.password,
          roleType
        );

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: error.message || 'Invalid credentials. Please try again.',
          });
          return;
        }

        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });

        // Navigation will be handled by useEffect when userRole is set
        return;
      }

      // Default: Supabase Auth (email + password)
      const { error } = await signIn(values.email, values.password);

      if (error) {
        let errorMessage = 'An error occurred during sign in';

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        }

        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: errorMessage,
        });
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      // Navigation will be handled by useEffect when userRole is set
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // Minimal centered layout for school, admin, expert (matching parent login style)
  if (urlRole === 'school' || urlRole === 'admin' || urlRole === 'expert') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="My Health Passport" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground">
              Hi, Welcome to My Health Passport!
            </h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {urlRole === 'admin' && (
                <FormField
                  control={form.control}
                  name="teamRole"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select Your Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          {adminTeamRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="UserName/Phone Number"
                        className="h-12 text-base"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          className="h-12 text-base"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? 'hide' : 'show'}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base bg-brand hover:bg-brand/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-sm text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to all portals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all portals
          </Link>

          <Card className="shadow-xl border-border/50 overflow-hidden">
            <div className={`h-2 ${colors.button}`} />
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="My Health Passport" className="h-12 w-auto" />
              </div>
              <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
                <IconComponent className={`w-8 h-8 ${colors.text}`} />
              </div>
              <CardTitle className="text-2xl">{config.label} Login</CardTitle>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {urlRole === 'admin' && (
                    <FormField
                      control={form.control}
                      name="teamRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Your Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select Your Role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background z-50">
                              {adminTeamRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            autoComplete="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              {...field} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-brand hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full ${colors.button} text-white`}
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <span className="text-foreground">
                  Contact your administrator
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RoleLoginPage;
