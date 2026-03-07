import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Calendar, 
  FileText, 
  Stethoscope,
  ClipboardList,
  Video,
  MessageSquare,
  Clock
} from 'lucide-react';

const expertNavLinks = [
  { label: 'Dashboard', href: '/expert-dashboard' },
  { label: 'Patients', href: '/expert-dashboard/patients' },
  { label: 'Appointments', href: '/expert-dashboard/appointments' },
  { label: 'Assessments', href: '/expert-dashboard/assessments' },
  { label: 'Reports', href: '/expert-dashboard/reports' },
];

const ExpertDashboard = () => {
  const { profile } = useAuth();

  const quickStats = [
    { label: 'Total Patients', value: '324', icon: Users, color: 'text-coral', bg: 'bg-coral/10' },
    { label: 'Today\'s Appts', value: '8', icon: Calendar, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Pending Reviews', value: '12', icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Reports Due', value: '5', icon: FileText, color: 'text-lavender', bg: 'bg-lavender/10' },
  ];

  const todaysAppointments = [
    { name: 'Arjun Sharma', time: '10:00 AM', type: 'Initial Consultation', status: 'upcoming' },
    { name: 'Priya Patel', time: '11:30 AM', type: 'Follow-up', status: 'upcoming' },
    { name: 'Rahul Verma', time: '2:00 PM', type: 'Assessment Review', status: 'upcoming' },
  ];

  return (
    <DashboardLayout 
      title={`Dr. ${profile?.full_name || 'Expert'}`}
      subtitle={profile?.specialization || 'Health Expert Dashboard'}
      navLinks={expertNavLinks}
      roleColor="bg-coral"
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
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-coral" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysAppointments.map((appt, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
                      <span className="text-coral font-semibold">
                        {appt.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{appt.name}</p>
                      <p className="text-sm text-muted-foreground">{appt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {appt.time}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Video className="w-3 h-3" />
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6" variant="outline">
              View Full Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-coral" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Users className="w-4 h-4" />
              Patient Directory
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <ClipboardList className="w-4 h-4" />
              New Assessment
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <FileText className="w-4 h-4" />
              Create Report
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <MessageSquare className="w-4 h-4" />
              Messages
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExpertDashboard;
