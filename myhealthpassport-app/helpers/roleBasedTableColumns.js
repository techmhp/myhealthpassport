// Column configurations for different roles
const ROLE_COLUMNS = (root, userRole, page = null) => {
  if (root === 'school-admin' && page === 'accounts') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'school_payment_status', header: 'Payment Status', type: 'complete_status' },
      { key: 'invoice', header: 'Invoice', type: 'invoice' },
    ];
  }

  if (root === 'school-admin') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'section', header: 'Section', type: 'text' },
      { key: 'completed_status', header: 'Screening Status', type: 'status' },
      { key: 'school_payment_status', header: 'Payment Status', type: 'complete_status' },
      { key: 'action', header: 'Action', type: 'action' },
    ];
  }

  if (root === 'teacher' && page === 'accounts') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'payment_status', header: 'Payment', type: 'status' },
      { key: 'parent_questions_status', header: 'Invoice', type: 'invoice' },
    ];
  }

  if (root === 'teacher') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'phone', header: 'Phone Number', type: 'phone' },
      { key: 'parent_questionnaire_status', header: 'Parent Questionnaire Status', type: 'status' },
      { key: 'teacher_questionnaire_status', header: 'Teacher Questionnaire Status', type: 'status' },
      { key: 'school_payment_status', header: 'Payment Status', type: 'status' },
    ];
  }

  if (root === 'expert') {
    return [
      { key: 'serial', header: 'Serial No.', type: 'serial' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'phone', header: 'Phone Number', type: 'phone' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
    ];
  }

  if (root === 'screening') {
    const columns = [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'section', header: 'Section', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'screening_status', header: 'Screening Status', type: 'status' },
    ];
    if (userRole === 'DENTIST') {
      columns.push({ key: 'dental_screening_status', header: 'Medical Officer Status', type: 'status' });
    } else if (userRole === 'EYE_SPECIALIST') {
      columns.push({ key: 'vision_screening_status', header: 'Medical Officer Status', type: 'status' });
    }

    return columns;
  }

  if (root === 'analyst' && userRole === 'MEDICAL_OFFICER') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'physical_screening_status', header: 'Physical Screening', type: 'status' },
      { key: 'nutritional_report_status', header: 'Nutritional Analyst', type: 'status' },
      { key: 'psychological_report_status', header: 'Psychological Analyst', type: 'status' },
      { key: 'vision_screening_status', header: 'Vision Screening', type: 'status' },
      { key: 'dental_screening_status', header: 'Dental Screening', type: 'status' },
      { key: 'lab_report_status', header: 'Lab Report', type: 'status' },
      { key: 'medical_report_status', header: 'Report Status', type: 'status' },
    ];
  }
  if (root === 'analyst') {
    const columns = [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'section', header: 'Section', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'analysis_status', header: 'Analyst Status', type: 'status' },
    ];
    if (userRole === 'NUTRITIONIST') {
      columns.push({ key: 'nutritional_report_status', header: 'Medical Officer Status', type: 'medical_officer_status' });
    } else if (userRole === 'PSYCHOLOGIST') {
      columns.push({ key: 'psychological_report_status', header: 'Medical Officer Status', type: 'status' });
    }

    return columns;
  }
  if (root === 'onground' && userRole === 'REGISTRATION_TEAM') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'phone', header: 'Phone Number', type: 'phone' },
      { key: 'registration_status', header: 'Attandance Status', type: 'status' },
      { key: 'school_payment_status', header: 'Payment Status', type: 'complete_status' },
    ];
  }

  if (root === 'onground' && userRole === 'CAMP_COORDINATOR') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'registration_status', header: 'Registration', type: 'status' },
      { key: 'smart_scale_status', header: 'Physical Screening', type: 'status' },
      { key: 'eye_screening_status', header: 'Eye Specialist', type: 'status' },
      { key: 'dental_screening_status', header: 'Dentist', type: 'status' },
      { key: 'nutrition_screening_status', header: 'Nutritionist', type: 'status' },
      { key: 'behavioural_screening_status', header: 'Behavioural', type: 'status' },
      { key: 'completed_status', header: 'All Completed', type: 'complete_status' },
    ];
  }

  if (root === 'admin' && page === 'accounts') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'school_payment_status', header: 'Payment Status', type: 'complete_status' },
      { key: 'invoice', header: 'Invoice', type: 'invoice' },
    ];
  }

  if (root === 'admin' && userRole === 'SUPER_ADMIN') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'completed_status', header: 'Screening Status', type: 'all_completed_status' },
      { key: 'nutrition_analysis_status', header: 'Nutrition Analysis', type: 'status' },
      { key: 'psychological_analysis_status', header: 'Emotional Analysis', type: 'status' },
      { key: 'medical_officer_analysis_status', header: 'Medical Officer', type: 'status' },
    ];
  }

  if (root === 'admin' && userRole === 'PROGRAM_COORDINATOR') {
    return [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'section', header: 'Section', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'school_payment_status', header: 'Payment Status', type: 'complete_status' },
      { key: 'completed_status', header: 'Screening Status', type: 'all_completed_status' },
      { key: 'nutrition_analysis_status', header: 'Nutrition Analysis', type: 'status' },
      { key: 'psychological_analysis_status', header: 'Emotional Analysis', type: 'status' },
      { key: 'medical_officer_analysis_status', header: 'Medical Officer', type: 'status' },
      { key: 'generated_report_status', header: 'Report Status', type: 'status' },
      { key: 'health_buddy', header: 'Health Buddy', type: 'status' },
    ];
  }

  if (root === 'health-buddy') {
    const columns = [
      { key: 'roll_no', header: 'Roll No.', type: 'text' },
      { key: 'name', header: 'Name', type: 'fullName' },
      { key: 'class_room', header: 'Class', type: 'text' },
      { key: 'section', header: 'Section', type: 'text' },
      { key: 'gender', header: 'Gender', type: 'text' },
      { key: 'age', header: 'Age', type: 'text' },
      { key: 'completed_status', header: 'Screening Status', type: 'all_completed_status' },
    ];
    if (userRole === 'DENTIST') {
      columns.push({ key: 'dental_screening_status', header: 'Medical Officer Status', type: 'status' });
    } else if (userRole === 'EYE_SPECIALIST') {
      columns.push({ key: 'vision_screening_status', header: 'Medical Officer Status', type: 'status' });
    }

    return columns;
  }

  return [];
};

export default ROLE_COLUMNS;
