'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BaseURL = process.env.NEXT_PUBLIC_API_URL;

// const UatBaseURL = process.env.NEXT_PUBLIC_API_URL_UAT;

const Headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

class V1SecureApi {
  constructor(url = BaseURL, headers = Headers) {
    this.url = url;
    this.headers = headers;
  }

  GetCall = async endpoint => {
    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value;
    this.headers['Authorization'] = 'Bearer ' + access_token;
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'GET',
      headers: this.headers,
      mode: this.mode,
      cache: 'no-store',
    });
    if (result.status === 401) {
      redirect('/login?reason=session_expired');
    }
    const response = await result.text();
    return response;
  };

  GetCallBinary = async endpoint => {
    try {
      const cookieStore = await cookies();
      const access_token = cookieStore.get('access_token')?.value;
      this.headers['Authorization'] = 'Bearer ' + access_token;
      const endpoint_url = this.url + endpoint;
      const result = await fetch(endpoint_url, {
        method: 'GET',
        headers: this.headers,
        cache: 'no-store',
      });
      if (result.status === 401) {
        redirect('/login?reason=session_expired');
      }
      if (!result.ok) {
        let message = `HTTP ${result.status}: Request failed`;
        try {
          const errorData = await result.json();
          message = errorData?.detail || errorData?.message || message;
        } catch {}
        return { error: true, message };
      }
      const arrayBuffer = await result.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = result.headers.get('content-type') || 'application/pdf';
      const contentDisposition = result.headers.get('content-disposition') || '';
      return { data: base64, contentType, contentDisposition };
    } catch (err) {
      return { error: true, message: err?.message || 'Unexpected error' };
    }
  };

  GetCallBlob = async endpoint => {
    try {
      const cookieStore = await cookies();
      const access_token = cookieStore.get('access_token')?.value;
      this.headers['Authorization'] = 'Bearer ' + access_token;
      const endpoint_url = this.url + endpoint;
      const result = await fetch(endpoint_url, {
        method: 'GET',
        headers: this.headers,
        cache: 'no-store',
      });
      if (result.status === 401) {
        redirect('/login?reason=session_expired');
      }
      if (!result.ok) {
        let message = `HTTP ${result.status}: Request failed`;
        try {
          const errorData = await result.json();
          message = errorData?.detail || errorData?.message || message;
        } catch {}
        return { error: true, message };
      }
      // Return CSV as plain text so it can be serialised through server action
      const text = await result.text();
      const contentDisposition = result.headers.get('content-disposition') || '';
      return { data: text, contentDisposition, status: result.status };
    } catch (err) {
      return { error: true, message: err?.message || 'Unexpected error' };
    }
  };

  FormPostCall = async (endpoint, data) => {
    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value;
    const endpoint_url = this.url + endpoint;

    if (access_token !== 'undefined') {
      const result = await fetch(endpoint_url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + access_token },
        body: data,
        mode: this.mode,
      });
      const response = await result.json();
      return response;
    }
  };

  PostCall = async (endpoint, data) => {
    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value;
    this.headers['Authorization'] = 'Bearer ' + access_token;
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'POST',
      headers: this.headers,
      body: data,
    });
    if (result.status === 401) {
      redirect('/login?reason=session_expired');
    }
    const response = await result.json();
    return response;
  };

  PutCall = async (endpoint, data) => {
    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value;
    this.headers['Authorization'] = 'Bearer ' + access_token;
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'PUT',
      headers: this.headers,
      body: data,
    });
    if (result.status === 401) {
      redirect('/login?reason=session_expired');
    }
    const response = await result.json();
    return response;
  };

  PostCallBlob = async (endpoint, data) => {
    try {
      const cookieStore = await cookies();
      const access_token = cookieStore.get('access_token')?.value;
      this.headers['Authorization'] = 'Bearer ' + access_token;

      const endpoint_url = this.url + endpoint;

      const result = await fetch(endpoint_url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
      });

      const contentType = result.headers.get('content-type') || '';

      if (!result.ok) {
        let message = `HTTP ${result.status}: Request failed`;

        if (contentType.includes('application/json')) {
          const errorData = await result.json();
          message = errorData?.detail || message;
        }

        return { error: true, message };
      }

      if (!contentType.includes('application/pdf')) {
        return {
          error: true,
          message: 'Expected PDF but got different content',
        };
      }

      const blob = await result.blob();
      return {
        data: blob,
        status: result.status,
        headers: result.headers,
      };
    } catch (err) {
      return {
        error: true,
        message: err?.message || 'Unexpected error',
      };
    }
  };

  // In your secureApis file, add this method to V1SecureApi class

  // GetBlobCall = async endpoint => {
  //   const cookieStore = await cookies();
  //   const access_token = cookieStore.get('access_token')?.value;
  //   this.headers['Authorization'] = 'Bearer ' + access_token;
  //   const endpoint_url = this.url + endpoint;
  //   const result = await fetch(endpoint_url, {
  //     method: 'GET',
  //     headers: this.headers,
  //     mode: this.mode,
  //     cache: 'no-store',
  //   });

  //   // Return the blob directly for PDF downloads
  //   const blob = await result.blob();
  //   return blob;
  // };
}

//***** SCHOOL-ADMIN DASHBOARD APIS START */

// 5.1. Import Student Data
export const importStudentsData = async (school_id, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const call = new V1SecureApi();
  const response = await call.FormPostCall(`/school/import-students-data?school_id=${school_id}`, formData);
  return response;

  // if (school_id) {
  //   const response = await call.FormPostCall(`/school/import-students-data?school_id=${school_id}`, formData);
  //   return response;
  // } else {
  //   const response = await call.FormPostCall(`/school/import-students-data`, formData);
  //   return response;
  // }
};

// 5.2. Import Student Data Confirm
export const importStudentsDataConfirm = async (school_id, data) => {
  const call = new V1SecureApi();
  if (school_id) {
    const response = await call.PostCall(`/school/import-students-data-confirm?school_id=${school_id}`, data);
    return response;
  } else {
    const response = await call.PostCall(`/school/import-students-data-confirm?`, data);
    return response;
  }
};

// 9.1. Create Teacher
export const createTeacher = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/school/create-school-teacher`, data);
  return response;
};

// 9.2. Update Teacher
export const updateTeacher = async (teacherId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/school/teacher/${teacherId}/update`, data);
  return response;
};

// 9.3. Teachers List
export const teachersList = async schoolid => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/teachers-list?school_id=${schoolid}`);
  return response;
};

// 9.4. Teachers Details
export const getTeacherDetails = async teacherId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/teacher/${teacherId}`);
  return response;
};

// 9.5.Bulk Import Teachers Preview
export const importTeachersData = async file => {
  const formData = new FormData();
  formData.append('file', file);

  const call = new V1SecureApi();
  const response = await call.FormPostCall(`/school/import-teachers-data`, formData);
  return response;
};

// 9.6.Bulk Import Teachers confirm
export const importTeachersDataConfirm = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/school/import-teachers-data-confirm`, data);
  return response;
};

//***** SUPER-ADMIN & PROGRAM COORDINATOR DASHBOARD APIS START */

// 4.1. Create School
export const createSchool = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/users/create-school`, data);
  return response;
};

// 4.2. School List
export const schoolList = async (limit = 500, skip = 0) => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/list?limit=${limit}&skip=${skip}`);
  return response;
};

// 4.3. School Details Update
export const updateSchool = async (id, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/school/${id}`, data);
  return response;
};

// 12.1 Assign school to staff member
export const assignSchool = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/school/assign-school`, data);
  return response;
};

// 3.1.create admin team user a/c
// 3.2. create-screening-team-account
// 3.3. create-on-ground-team-account
// 3.4. create-analyst-team-account
export const createStaffMember = async (role_type, data) => {
  let endpoint;
  if (role_type === 'ON_GROUND_TEAM') {
    endpoint = '/users/create-on-ground-team-account';
  } else if (role_type === 'SCREENING_TEAM') {
    endpoint = '/users/create-screening-team-account';
  } else if (role_type === 'ANALYST_TEAM') {
    endpoint = '/users/create-analyst-team-account';
  } else {
    endpoint = '/users/create-admin-team-account';
  }
  const call = new V1SecureApi();
  const response = await call.PostCall(endpoint, data);
  return response;
};

// 11.3 Teacher Dashboard nutritional questionnerie
export const nutritionalQuestionsTeacher = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/teacher-nutritional-questions/${studentId}`);
  return response;
};

// 11.1 Teacher Dashboard developmental questionnerie
export const developmentalQuestionsTeacher = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/teacher-emotional-questions/${studentId}`);
  return response;
};

// 11.4 Parent Dashboard update student nutritional questionnerie
export const updateTeacherNutritionalQuestionnaire = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/submit-teacher-nutritional-answers', data);
  return response;
};

// 11.2 Parent Dashboard update student developmental questionnerie
export const updateTeacherDevelopmentalQuestionnarie = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/submit-teacher-emotional-answers`, data);
  return response;
};

//***** PARENT DASHBOARD APIS START */

// 6.3. Childs List
export const childrenList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/parent/childrens`);
  return response;
};

// 10.1. Student Vaccination List
export const studentVaccinationList = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/student/vaccination-status/${studentId}`);
  return response;
};

// 10.1. Student Vaccination List
export const studentVaccinationListUpdate = async (studentId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/student/vaccination-status/${studentId}`, data);
  return response;
};

// 10.2. Student Vaccination Update
export const StudentDevelopmentalQuestionnarie = async (studentId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/student/vaccination-status/${studentId}`, data);
  return response;
};

// 11.1 Parent Dashboard developmental questionnerie
export const developmentalQuestions = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/parent/parent-emotional-questions/${studentId}`);
  return response;
};

// 11.2 Parent Dashboard update student developmental questionnerie
export const updateStudentDevelopmentalQuestionnarie = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/parent/submit-parent-emotional-answers`, data);
  return response;
};

// 11.3 Parent Dashboard nutritional questionnerie
// export const nutritionalQuestions = async studentId => {
//   const call = new V1SecureApi();
//   const response = await call.GetCall(`/student/${studentId}/nutritional-questions`);
//   return response;
// };

export const nutritionalQuestions = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/parent/parent-nutritional-questions/${studentId}`);
  return response;
};

// 11.4 Parent Dashboard update student nutritional questionnerie
export const updateStudentNutritionalQuestionnaire = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/parent/submit-parent-nutritional-answers', data);
  return response;
};

//***** SCREENING TEAM APIS START */

// 13.1 Student smart scale file-upload
export const importSmartScaleData = async (file, studentId, schoolid) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('school_id', schoolid);

  const call = new V1SecureApi();
  const response = await call.FormPostCall(`/school/upload-smart-scale-data/${studentId}`, formData);
  return response;
};

// 13.2 Confirm smart scale file-upload data confirm
export const confirmSmartScaleData = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/school/confirm-smart-scale-data`, data);
  return response;
};

// 13.3 Get smart scale data of student
export const getSmartScaleData = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/get-smart-scale-data/${studentId}`);
  return response;
};

//***** ANALYST TEAM APIS START */

// 21.1 get clinical recomendations nutritional analyst
export const nutritionalAnalystRecomendations = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/nutritional-analyst/${studentId}`);
  return response;
};

// 21.3 create clinical recomendations nutritional analyst
export const createNutritionalAnalystRecomendations = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/screening/nutritional-analyst`, data);
  return response;
};

// 21.2 update clinical recomendations nutritional analyst
export const updateNutritionalAnalystRecomendations = async data => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/screening/nutritional-analyst`, data);
  return response;
};

// 24.1 get clinical recomendations psychological anayst
export const psychologicalAnalystRecomendations = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/psychological-analyst/${studentId}`);
  return response;
};

// 21.3 create clinical recomendations nutritional analyst
export const createPsychologicalAnalystRecomendations = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/screening/psychological-analyst`, data);
  return response;
};

// 21.2 update clinical recomendations nutritional analyst
export const updatePsychologicalAnalystRecomendations = async data => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/screening/psychological-analyst`, data);
  return response;
};

//***** COMMON APIS START */

// 4.3. School Details
export const schoolDetails = async id => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/details/${id}`);
  return response;
};

// 7.1. Student Details
export const studentDetails = async (studentId, academicYear) => {
  const call = new V1SecureApi();
  if (academicYear) {
    const response = await call.GetCall(`/student/${studentId}/basic?academic_year=${academicYear}`);
    return response;
  } else {
    const response = await call.GetCall(`/student/${studentId}/basic`);
    return response;
  }
};

// 7.2. Student Update
export const updateStudentDetails = async (studentId, data) => {
  const call = new V1SecureApi();
  if (data.school_id) {
    const response = await call.PutCall(`/student/${studentId}/basic?school_id=${data.school_id}`, JSON.stringify(data));
    return response;
  } else {
    const response = await call.PutCall(`/student/${studentId}/basic`, JSON.stringify(data));
    return response;
  }
};

// 7.3. Create Students
export const createStudent = async (school_id, data) => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/school/create-student?school_id=${school_id}`, data);
  return response;
};

// 8.0 Students List by Category
export const studentListByCategory = async schoolId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/${schoolId}/students-list-by-category`);
  return response;
};

// 8.1. Students List
export const studentList = async (schoolId, search = '') => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/${schoolId}/students-list?search=${search}`);
  return response;
};

// 8.2. Students List by class & section
export const studentListByClassAndSection = async (schoolId, classroom = null, section = null, search = null) => {
  const call = new V1SecureApi();
  const parts = [];
  if (classroom) parts.push(`classroom=${encodeURIComponent(classroom)}`);
  if (section) parts.push(`section=${encodeURIComponent(section)}`);
  if (search) parts.push(`search=${encodeURIComponent(search)}`);
  const response = await call.GetCall(`/school/${schoolId}/students-list-by-class?${parts.join('&')}`);
  return response;
};

// update payment status
export const updatePaymentStatus = async payload => {
  const call = new V1SecureApi();
  const response = await call.PutCall('/school/school-payment/update', payload);
  return response;
};

// 5. Users List (SCHOOL_STAFF/ON_GROUND_TEAM/SCREENING_TEAM/ANALYST_TEAM/ADMIN_TEAM/CONSULTANT_TEAM)
export const usersList = async params => {
  const call = new V1SecureApi();
  const response = await call.GetCall(
    `/users?team_type=${params.team_type}&role=${params.role}&is_active=${params.is_active}&search=${params.search}&skip=0&limit=500&school_id=${params.school_id}`
  );
  return response;
};

// 14.1 User change password
export const changePassword = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/users/change-password`, data);
  return response;
};

// 14.4 Get my profile information
export const getProfile = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/users/profile`);
  return response;
};

// 14.5 Get user profile information
export const getUserProfile = async (role_type, user_id) => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/users/user-profile/${user_id}?role_type=${role_type}`);
  return response;
};

// 15.1.1. Update My Profile  #Others
// 15.1.2. Update My Profile  # Teacher
// 15.1.3.Update My Profile  # Parent
// 15.1.4. Update My Profile  # Consultanats
export const updateMyProfile = async data => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/users/profile`, data);
  return response;
};

// 15.1.1. Update Profile  #Others
// 15.1.2. Update Profile  # Teacher
// 15.1.3.Update Profile  # Parent
// 15.1.4. Update Profile  # Consultanats
export const updateProfile = async (userId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/users/user-profile-update/${userId}`, data);
  return response;
};

// 16.1. Dental Screening Options
export const dentalScreeningDropdownOptions = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/dental-screening-dropdown-options`);
  return response;
};

// 16.2. Create Dental Screening
export const storeDentalScreening = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/screening/dental-screening`, data);
  return response;
};

// 16.3. Dental Screening Update
export const updateDentalScreening = async (recordId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/screening/dental-screening/${recordId}`, data);
  return response;
};

// 16.4.Get Dental Screening Details
export const getDentalScreening = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/students/${studentId}/dental-screening`);
  return response;
};

// 16.5. Get Student Dental Screening Report
export const getDentalScreeningReport = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/students/${studentId}/dental-screening`);
  return response;
};

// 17.1. Create Eye Screening
export const storeEyeScreening = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/screening/eye-screening`, data);
  return response;
};

// 17.2. Get Eye Screening Data
export const getEyeScreening = async recordId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/eye-screening/${recordId}`);
  return response;
};

// 17.3. Update Eye Screening
export const updateEyeScreening = async (recordId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/screening/eye-screening/${recordId}`, data);
  return response;
};

// 17.4. Get Student Eye Screening Report
export const getEyeScreeningReport = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/students/${studentId}/eye-screening`);
  return response;
};

// 18.1.Assigned Schools
export const getAssignedSchools = async (user_id, role_type) => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/assigned-schools?user_id=${user_id}&role_type=${role_type}`);
  return response;
};

// 18.2. User Events  # Dashboard - Screening, On Ground, Analyst
export const getEvents = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/users/events`);
  return response;
};

// 19.1.get nutritional screening
export const getNutritionalScreening = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/students/${studentId}/nutritional`);
  return response;
};

// 19.2.update nutritional screening
export const updateNutritionalScreening = async (studentId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/students/${studentId}/nutritional`, data);
  return response;
};

// 20.1.get behavioural screening
export const getBehaviouralScreening = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/students/${studentId}/behavioural`);
  return response;
};

// 20.2.update behavioural screening
export const updateBehaviouralScreening = async (studentId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/students/${studentId}/behavioural`, data);
  return response;
};

// 22.2.update attendance
export const updateStudentAttendance = async (schoolId, studentId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/school/${schoolId}/attendance/${studentId}`, data);
  return response;
};

// 23.2.screening status
export const screeningStatus = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/screening-status`);
  return response;
};

// 25.2.Teacher dashboard students questionnaire status
export const teacherQuestionnaireStatus = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/teacher-answers-status`);
  return response;
};

// 261.1 Student screening overall summary
export const screeningOverallSummary = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/screening-overall-summary/${studentId}?academic_year=${academicYear}`);
  return response;
};

// 28.1.Close assigned school event
export const updateOverallScreeningStatus = async (studentId, schoolId, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/screening/${studentId}/overall-screening-status?school_id=${schoolId}`, data);
  return response;
};

// 29.1.Close assigned school event
export const closeEvent = async (eventid, schoolId) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/screening/${eventid}/close-event?school_id=${schoolId}`);
  return response;
};

// 30.1 Student Detailed Reports summary
export const studentDetailedReportSummary = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  if (academicYear) {
    const response = await call.GetCall(`/screening/screening-detailed-summary/${studentId}?academic_year=${academicYear}`);
    return response;
  } else {
    const response = await call.GetCall(`/screening/screening-detailed-summary/${studentId}`);
    return response;
  }
};

// 30.1. Update medical report status
export const updateMedicalReportStatus = async data => {
  const call = new V1SecureApi();
  const response = await call.PutCall('/screening/medical-screening-status', data);
  return response;
};

// 30.2. Get medical report statuses
export const getMedicalReportStatus = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  if (academicYear) {
    const response = await call.GetCall(`/screening/medical-screening-status/${studentId}?academic_year=${academicYear}`);
    return response;
  } else {
    const response = await call.GetCall(`/screening/medical-screening-status/${studentId}`);
    return response;
  }
};

// 30.5. Download student report
// export const downloadStudentReport = async studentId => {
//   const call = new V1SecureApi();
//   const response = await call.GetCall(`/report/${studentId}/download`);
//   return await response.blob();
// };

/************************
 *
 *  PHASE 2 APIS START
 *
 ************************/

// 50.0. Create Expert Account
export const createExpert = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/users/create-consultation-team-account', data);
  return response;
};

// 50.0.1 fetch expert information
export const getExpertDetails = async expert_id => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/expert-profile/${expert_id}`);
  return response;
};

// 50.0.2 Create Expert Account
export const updateExpert = async (expert_id, data) => {
  const call = new V1SecureApi();
  const response = await call.PutCall(`/update-expert/${expert_id}`, data);
  return response;
};

// 50.0.3. Fetch Experts List
export const getExpertsList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/experts`);
  return response;
};

// 50.0.4. Fetch Experts List Near by you
export const getExpertsListNearByYou = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/nearest-by-location-experts`);
  return response;
};

// 50.0.5. Fetch Preffered Experts List
export const getPrefferedExpertsList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/prefered-experts`);
  return response;
};

// 50.1. consultation dashboard
export const getConsultationsDashbaord = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/expert/consultation-dashboard`);
  return response;
};

// 50.2. consultations-list
export const getConsultationsList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/expert/consultations-list`);
  return response;
};

// 50.3. Store transaction information
export const storeTransaction = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/payment/do-payment`, data);
  return response;
};

export const storeLabTestTransaction = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/do-labtest-payment`, data);
  return response;
};

// 50.4. consultation booking
export const bookAConsultation = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/payment/consultations-book`, data);
  return response;
};

// 50.5.Lab Test Booking
export const labTestBooking = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`labtests/book`, data);
  return response;
};

// 50.6. Create Lab Tests List
export const createLabTestsList = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`labtests/create`, data);
  return response;
};

// 50.7. Fetch Lab Tests Types
export const getLabTestsList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/labtests/list`);
  return response;
};

// 50.2.1 consultations-list
export const getPatientsList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/expert/patient-list`);
  return response;
};

//50.10
export const getCaseHistory = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/screening/${studentId}/case-history`);
  return response;
};

// 50.15 Get Dental prescription
export const getDentalPrescription = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  const url = academicYear ? `/dental-prescriptions/${studentId}?academic_year=${academicYear}` : `/dental-prescriptions/${studentId}`;
  const response = await call.GetCall(url);
  return response;
};

// 50.14 Create Dental prescription
export const createDentalPrescription = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/dental-prescription', data);
  return response;
};

// 50.15 Get Eye prescription
export const getEyePrescription = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  const url = academicYear ? `/eye-prescriptions/${studentId}?academic_year=${academicYear}` : `/eye-prescriptions/${studentId}`;
  const response = await call.GetCall(url);
  return response;
};

// 50.21 Create Eye prescription
export const createEyePrescription = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/eye-prescription', data);
  return response;
};

// 50.15 Get pediatrician  prescription
export const getPediatricianPrescription = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  const url = academicYear ? `/pediatrician-prescriptions/${studentId}?academic_year=${academicYear}` : `/pediatrician-prescriptions/${studentId}`;
  const response = await call.GetCall(url);
  return response;
};

// 50.21 Create pediatrician prescription
export const createPediatricianPrescription = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/pediatrician-prescription', data);
  return response;
};

// 50.15 Get nutritionist prescription
export const getNutritionistPrescription = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/nutritionist-prescriptions/${studentId}`);
  return response;
};

// 50.21 Create nutritionist prescription
export const createNutritionistPrescription = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/nutritionist-prescription', data);
  return response;
};

// 50.17 Create psychologist prescription
export const createPsychologistPrescription = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/psychologist-prescription', data);
  return response;
};

// 50.18 Get psychologist prescription
export const getPsychologistPrescription = async (studentId, academicYear = null) => {
  const call = new V1SecureApi();
  const url = academicYear ? `/psychologist-prescriptions/${studentId}?academic_year=${academicYear}` : `/psychologist-prescriptions/${studentId}`;
  const response = await call.GetCall(url);
  return response;
};

// Get Appointments details by student id
export const getAppointmentsByStudentId = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/appointments-bystudent/${studentId}`);
  return response;
};

// store the Appointment Status
export const rescheduleAppointment = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/appointments/reschedule', data);
  return response;
};

// store the Appointment Status
export const storeAppointmentDecision = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/appointment-decision', data);
  return response;
};

// Get Appointment Status
export const getAppointmentDecision = async studentId => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/appointment-decision/${studentId}`);
  return response;
};

// Get Slots by Expert id
export const getSlotsByExpertId = async (expertId, date) => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/consultations/${expertId}/available-slots?slot_date=${date}`);
  return response;
};

// Block the slot
export const blockSlot = async data => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/consultations-select-slot', data);
  return response;
};

// In your API file
export const downloadStudentReport = async studentId => {
  const response = await fetch(`${BaseURL}/report/${studentId}/download`);
  if (response.status === 200) {
    return await response.blob();
  } else {
    return await response.json();
  }
};

// export const startPDFGeneration = async studentId => {
//   const call = new V1SecureApi();
//   const response = await call.GetCall(`/report/${studentId}/start-download`);
//   return response;
// };

// export const checkPDFStatus = async studentId => {
//   const call = new V1SecureApi();
//   const response = await call.GetCall(`/report/${studentId}/status`);
// };

// Update the downloadPDF function
// export const downloadPDF = async studentId => {
//   const call = new V1SecureApi();
//   const response = await call.GetCall(`/report/${studentId}/download-ready`);
//   return response;
// };

// start the pdf generation
export const startPDFGenerationSelected = async (studentId, data, academicYear) => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/report/${studentId}/start-download-selected?academic_year=${academicYear}`, data);
  return response;
};

export const downloadPDFSelected = async (studentId, queryParameter, academicYear) => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/report/${studentId}/download-selected?key=${queryParameter}&academic_year=${academicYear}`);
  return response;
};

export const downloadPDFFileAsBase64 = async (studentId, key, academicYear) => {
  const call = new V1SecureApi();
  return await call.GetCallBinary(`/report/${studentId}/download-selected?key=${key}&academic_year=${academicYear}&direct=true`);
};

// Add new function for downloading the actual PDF file
// export const downloadPDFFile = async downloadUrl => {
//   const call = new V1SecureApi();
//   // Extract path from full URL
//   const path = downloadUrl.replace('https://uat-api.myhealthpassport.in/api/v1', '');
//   const blob = await call.GetBlobCall(path);
//   return blob;
// };

// lab test Apis || Admin
export const productsList = async () => {
  const call = new V1SecureApi();
  const response = await call.GetCall('/thyrocare/products/all');
  return response;
};
export const schoolsList = async () => {
  // schools are same for both thyrocare and healthians
  const call = new V1SecureApi();
  const response = await call.GetCall('/thyrocare/schools');
  return response;
};

export const saveTyrocarePackage = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/thyrocare/select-products', payload);
  return response;
};

export const saveHealthianPackage = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/select-packages', payload);
  return response;
};

export const healthiansProductsList = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/fetch-healthians-products', payload);
  return response;
};

// lab test Apis || Parent
export const schoolsPackagesHealthians = async id => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/school/${id}/packages`);
  return response;
};

export const schoolsPackagesThyrocare = async id => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/thyrocare/school/${id}/products`);
  return response;
};

export const tyrocareServiceability = async pincode => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/thyrocare/pincodes/serviceability?pincode=${pincode}`);
  return response;
};

export const tyrocareGetSlots = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/thyrocare/slots/search', payload);
  return response;
};

export const labTestOrderCreate = async (school_id, payload) => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/thyrocare/create-order-from-cart/${school_id}`, payload);
  return response;
};

export const addProductToCart = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/thyrocare/add-to-cart', payload);
  return response;
};

// healthians labtest parent

export const healthiansCheckServiceability = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/check-serviceability', payload);
  return response;
};

export const healthiansGetSlots = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/get-slots', payload);
  return response;
};

export const healthiansFreezeSlot = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCall('/freeze-slot', payload);
  return response;
};

export const healthiansCreateBooking = async (studentId, payload) => {
  const call = new V1SecureApi();
  const response = await call.PostCall(`/create-booking/${studentId}`, payload);
  return response;
};

// lab reports
export const healthiansLabReportDownload = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCallBlob('/healthians/student-report-download', payload);
  return response;
};

export const thyrocareLabReportDownload = async payload => {
  const call = new V1SecureApi();
  const response = await call.PostCallBlob('/thyrocare/student-report-download', payload);
  return response;
};

// lab reports
export const healthiansLabReports = async payload => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/healthians/student-bookings?student_id=${payload.student_id}`);
  return response;
};

export const thyrocareLabReports = async payload => {
  const call = new V1SecureApi();
  const response = await call.GetCall(`/thyrocare/student-orders?student_id=${payload.student_id}`);
  return response;
};

// ─── CSV EXPORT FUNCTIONS ────────────────────────────────────────────────────

export const exportNutritionChecklist = async (schoolId, className, section) => {
  const call = new V1SecureApi();
  const params = new URLSearchParams({ school_id: schoolId });
  if (className) params.append('class_name', className);
  if (section) params.append('section', section);
  return await call.GetCallBlob(`/screening/export/nutrition-checklist?${params.toString()}`);
};

export const exportNutritionAnalysis = async (schoolId, className, section) => {
  const call = new V1SecureApi();
  const params = new URLSearchParams({ school_id: schoolId });
  if (className) params.append('class_name', className);
  if (section) params.append('section', section);
  return await call.GetCallBlob(`/screening/export/nutrition-analysis?${params.toString()}`);
};

export const exportPsychologyAnalysis = async (schoolId, className, section) => {
  const call = new V1SecureApi();
  const params = new URLSearchParams({ school_id: schoolId });
  if (className) params.append('class_name', className);
  if (section) params.append('section', section);
  return await call.GetCallBlob(`/screening/export/psychology-analysis?${params.toString()}`);
};

export const exportSmartScale = async (schoolId, className, section) => {
  const call = new V1SecureApi();
  const params = new URLSearchParams({ school_id: schoolId });
  if (className) params.append('class_name', className);
  if (section) params.append('section', section);
  return await call.GetCallBlob(`/screening/export/smart-scale?${params.toString()}`);
};

export const exportPsychologyChecklist = async (schoolId, className, section) => {
  const call = new V1SecureApi();
  const params = new URLSearchParams({ school_id: schoolId });
  if (className) params.append('class_name', className);
  if (section) params.append('section', section);
  return await call.GetCallBlob(`/screening/export/psychology-checklist?${params.toString()}`);
};

export const createPDFDownloadToken = async (studentId, key, academicYear) => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get('access_token')?.value;
  const params = new URLSearchParams({ key });
  if (academicYear) params.append('academic_year', academicYear);
  const res = await fetch(
    `${BaseURL}/report/${studentId}/create-download-token?${params.toString()}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );
  const data = await res.json();
  if (!data.status || !data.token) throw new Error('Failed to create download token');
  return data.token;
};
