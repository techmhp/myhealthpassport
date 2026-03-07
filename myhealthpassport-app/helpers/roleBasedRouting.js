import nookies from 'nookies';

export const RoleBasedRouting = async (role_type, role) => {
  // Check the role and redirect based on the role
  switch (role_type) {
    case 'PARENT':
      // Add the paths that the parent can access here
      if (role == 'PARENT' && !window.location.pathname.startsWith('/parent')) {
        setRoot('parent');
        window.location.assign('/parent/home');
      }
      break;
    case 'SCHOOL_STAFF':
      // Add the paths that the school admin can access here
      if (role == 'SCHOOL_ADMIN' && !window.location.pathname.startsWith('/school-admin')) {
        setRoot('school-admin');
        window.location.assign('/school-admin/home');
      }
      // Add the paths that the teacher can access here
      if (role == 'TEACHER' && !window.location.pathname.startsWith('/teacher')) {
        setRoot('teacher');
        window.location.assign('/teacher/home');
      }
      break;
    case 'CONSULTANT_TEAM':
      // Add the paths that the teacher can access here
      if (!window.location.pathname.startsWith('/expert')) {
        setRoot('/expert');
        window.location.assign('/expert/home');
      }
      break;
    case 'SCREENING_TEAM':
      // Add the paths that the analysiscrew can access here
      if (!window.location.pathname.startsWith('/screening')) {
        setRoot('screening');
        window.location.assign('/screening/home');
      }
      break;
    case 'ANALYST_TEAM':
      // Add the paths that the registration team can access here
      if (!window.location.pathname.startsWith('/analyst')) {
        setRoot('analyst');
        window.location.assign('/analyst/home');
      }
      break;
    case 'ON_GROUND_TEAM':
      // Add the paths that the on ground team can access here
      if (!window.location.pathname.startsWith('/onground')) {
        setRoot('onground');
        window.location.assign('/onground/home');
      }
      break;
    case 'ADMIN_TEAM':
      // Add the paths that the super admin & program coordinator can access here
      if (role == 'HEALTH_BUDDY' && !window.location.pathname.startsWith('/health-buddy')) {
        setRoot('health-buddy');
        window.location.assign('/health-buddy/home');
      }
      if (role != 'HEALTH_BUDDY' && !window.location.pathname.startsWith('/admin')) {
        setRoot('admin');
        window.location.assign('/admin/home');
      }
      break;
    default:
      window.location.assign('/unauthorized');
  }
};

const setRoot = root => {
  nookies.set(null, 'root', root, {
    path: '/',
    sameSite: true,
    secure: true,
    maxAge: 86400, // one day
  });
};
