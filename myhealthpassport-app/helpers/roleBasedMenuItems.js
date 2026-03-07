export const MenuItems = [
  {
    name: 'Home',
    roots: ['parent', 'school-admin', 'teacher', 'expert', 'admin', 'program-coordinator', 'analyst', 'screening', 'onground', 'health-buddy'],
    href: '/home',
  },
  {
    name: 'Health Records',
    roots: ['parent'],
    href: '/health-records',
  },
  {
    name: 'Students',
    roots: ['school-admin', 'teacher'],
    href: '/students',
  },
  {
    name: 'Teachers',
    roots: ['school-admin'],
    href: '/teachers',
  },
  // Book a Consultation is Phase 2
  {
    name: 'Book',
    roots: ['parent'],
    href: '/book',
  },
  {
    name: 'Roster',
    roots: ['analyst', 'screening', 'onground', 'admin', 'health-buddy'],
    href: '/roster',
  },
  {
    name: 'Staff',
    roots: ['admin'],
    href: '/staff',
  },
  {
    name: 'Schools',
    roots: ['admin'],
    href: '/schools',
  },
  {
    name: 'Experts',
    roots: ['admin'],
    href: '/experts',
  },
  {
    name: 'My Patients',
    roots: ['expert'],
    href: '/patients',
  },
  {
    name: 'Accounts',
    roots: ['school-admin', 'teacher', 'admin'],
    href: '/accounts',
  },
  {
    name: 'Payments & Billing',
    roots: ['parent'],
    href: '/payments',
  },
  // Move to Login user Profile section
  // {
  //   name: 'Settings',
  //   roots: ['parent', 'school-admin', 'expert', 'program-coordinator', 'admin', 'analyst', 'screening', 'onground'],
  //   href: '/settings',
  // },
];
