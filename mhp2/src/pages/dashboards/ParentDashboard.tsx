import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Calendar, 
  Bell, 
  Heart,
  TrendingUp,
  Activity,
  ClipboardList
} from 'lucide-react';

const parentNavLinks = [
  { label: 'Dashboard', href: '/parent-dashboard' },
  { label: 'Health Passport', href: '/parent-dashboard/passport' },
  { label: 'Appointments', href: '/parent-dashboard/appointments' },
  { label: 'Reports', href: '/parent-dashboard/reports' },
];

const ParentDashboard = () => {
  const { profile } = useAuth();

  const quickStats = [
    { label: 'Health Score', value: '85%', icon: Heart, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Tasks', value: '3', icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Upcoming', value: '2', icon: Calendar, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Reports Ready', value: '5', icon: FileText, color: 'text-lavender', bg: 'bg-lavender/10' },
  ];

  return (
    <DashboardLayout 
      title={`Welcome, ${profile?.full_name || 'Parent'}!`}
      subtitle="Your child's health journey at a glance"
      navLinks={parentNavLinks}
      roleColor="bg-brand"
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
        {/* Health Passport Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-brand" />
              Health Passport Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Physical Health</p>
                  <p className="text-sm text-muted-foreground">Last updated: 2 weeks ago</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-green-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">80%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Mental Wellness</p>
                  <p className="text-sm text-muted-foreground">Last updated: 1 week ago</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-[90%] h-full bg-brand rounded-full" />
                  </div>
                  <span className="text-sm font-medium">90%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Nutrition</p>
                  <p className="text-sm text-muted-foreground">Last updated: 3 days ago</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-amber-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
            </div>
            <Button className="w-full mt-6" variant="outline">
              View Full Health Passport
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">New health report available</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Vaccination reminder</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Appointment confirmed</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-brand">
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
