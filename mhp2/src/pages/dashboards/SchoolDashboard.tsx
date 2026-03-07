import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Activity
} from 'lucide-react';

const schoolNavLinks = [
  { label: 'Dashboard', href: '/school-dashboard' },
  { label: 'Students', href: '/school-dashboard/students' },
  { label: 'Health Programs', href: '/school-dashboard/programs' },
  { label: 'Reports', href: '/school-dashboard/reports' },
  { label: 'Analytics', href: '/school-dashboard/analytics' },
];

const SchoolDashboard = () => {
  const { profile } = useAuth();

  const quickStats = [
    { label: 'Total Students', value: '1,248', icon: Users, color: 'text-lavender', bg: 'bg-lavender/10' },
    { label: 'Assessments', value: '856', icon: ClipboardList, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Avg Health Score', value: '78%', icon: Activity, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Programs Active', value: '4', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <DashboardLayout 
      title={profile?.organization_name || 'School Dashboard'}
      subtitle="Monitor student wellness and health programs"
      navLinks={schoolNavLinks}
      roleColor="bg-lavender"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Programs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-lavender" />
              Active Health Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium">Annual Health Checkup</p>
                    <p className="text-sm text-muted-foreground">Grade 1-5 • 620 students</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">72% Complete</p>
                  <p className="text-xs text-muted-foreground">Due: Mar 15</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-lavender/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-lavender" />
                  </div>
                  <div>
                    <p className="font-medium">Mental Wellness Workshop</p>
                    <p className="text-sm text-muted-foreground">Grade 6-10 • 420 students</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600">45% Complete</p>
                  <p className="text-xs text-muted-foreground">Due: Apr 1</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nutrition Assessment</p>
                    <p className="text-sm text-muted-foreground">All grades • 1,248 students</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand">28% Complete</p>
                  <p className="text-xs text-muted-foreground">Due: May 1</p>
                </div>
              </div>
            </div>
            <Button className="w-full mt-6" variant="outline">
              View All Programs
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-lavender" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Users className="w-4 h-4" />
              View Student List
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <Calendar className="w-4 h-4" />
              Schedule Health Camp
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <FileText className="w-4 h-4" />
              Generate Reports
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <ClipboardList className="w-4 h-4" />
              New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchoolDashboard;
