import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ParentBookingsTable from '@/components/dashboard/ParentBookingsTable';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  GraduationCap, 
  Stethoscope, 
  Shield,
  Settings,
  BarChart3,
  UserPlus,
  Building2,
  Activity,
  ClipboardList
} from 'lucide-react';

const adminNavLinks = [
  { label: 'Dashboard', href: '/admin-dashboard' },
  { label: 'Bookings', href: '/admin-dashboard/bookings' },
  { label: 'Users', href: '/admin-dashboard/users' },
  { label: 'Schools', href: '/admin-dashboard/schools' },
  { label: 'Experts', href: '/admin-dashboard/experts' },
  { label: 'Reports', href: '/admin-dashboard/reports' },
  { label: 'Settings', href: '/admin-dashboard/settings' },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const { profile } = useAuth();

  const quickStats = [
    { label: 'Total Users', value: '2,847', icon: Users, color: 'text-mint', bg: 'bg-mint/10' },
    { label: 'Schools', value: '45', icon: GraduationCap, color: 'text-lavender', bg: 'bg-lavender/10' },
    { label: 'Experts', value: '128', icon: Stethoscope, color: 'text-coral', bg: 'bg-coral/10' },
    { label: 'Parents', value: '2,674', icon: Users, color: 'text-brand', bg: 'bg-brand/10' },
  ];

  const recentActivity = [
    { action: 'New school registered', details: 'Delhi Public School - Mumbai', time: '2 hours ago', icon: Building2, color: 'text-lavender' },
    { action: 'Expert verified', details: 'Dr. Anika Sharma - Nutritionist', time: '4 hours ago', icon: Stethoscope, color: 'text-coral' },
    { action: 'User role updated', details: 'Rajesh Kumar → School Admin', time: '6 hours ago', icon: Shield, color: 'text-mint' },
    { action: 'Health camp completed', details: 'St. Mary\'s School - 450 students', time: '1 day ago', icon: Activity, color: 'text-brand' },
  ];

  return (
    <DashboardLayout 
      title="Admin Dashboard"
      subtitle={`Welcome, ${profile?.full_name || 'Administrator'}`}
      navLinks={adminNavLinks.map(link => ({
        ...link,
        href: link.label === 'Dashboard' ? '/admin-dashboard' : link.label === 'Bookings' ? '/admin-dashboard' : link.href,
      }))}
      roleColor="bg-mint"
    >
      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={activeSection === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('overview')}
        >
          <Activity className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeSection === 'bookings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('bookings')}
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Bookings
        </Button>
      </div>

      {activeSection === 'bookings' ? (
        <ParentBookingsTable />
      ) : (
        <>
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
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-mint" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className={`p-2 rounded-lg bg-background`}>
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-6" variant="outline">
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-mint" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <UserPlus className="w-4 h-4" />
                  Add New User
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Building2 className="w-4 h-4" />
                  Register School
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Stethoscope className="w-4 h-4" />
                  Verify Expert
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <BarChart3 className="w-4 h-4" />
                  System Reports
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Settings className="w-4 h-4" />
                  Platform Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
