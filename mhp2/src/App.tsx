import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import ParentPage from "./pages/ParentPage";
import SchoolPage from "./pages/SchoolPage";
import HealthBuddyCentrePage from "./pages/HealthBuddyCentrePage";
import HealthCampPage from "./pages/HealthCampPage";
import HealthTalksPage from "./pages/HealthTalksPage";
import InvestorPage from "./pages/InvestorPage";
import CSRPage from "./pages/CSRPage";
import ResourcesPage from "./pages/ResourcesPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import SchoolPitchPage from "./pages/SchoolPitchPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import LoginPage from "./pages/LoginPage";
import RoleLoginPage from "./pages/RoleLoginPage";
import ParentOTPLoginPage from "./pages/ParentOTPLoginPage";
import ParentDashboard from "./pages/dashboards/ParentDashboard";
import SchoolDashboard from "./pages/dashboards/SchoolDashboard";
import ExpertDashboard from "./pages/dashboards/ExpertDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/parents" element={<ParentPage />} />
            <Route path="/schools" element={<SchoolPage />} />
            <Route path="/schools/health-buddy-centre" element={<HealthBuddyCentrePage />} />
            <Route path="/schools/health-camp" element={<HealthCampPage />} />
            <Route path="/schools/health-talks" element={<HealthTalksPage />} />
            <Route path="/investors" element={<InvestorPage />} />
            <Route path="/csr" element={<CSRPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/school-pitch" element={<SchoolPitchPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/parent" element={<ParentOTPLoginPage />} />
            <Route path="/login/:role" element={<RoleLoginPage />} />
            
            {/* Protected Dashboard Routes */}
            <Route
              path="/parent-dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['school']}>
                  <SchoolDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expert-dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['expert']}>
                  <ExpertDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppButton />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
