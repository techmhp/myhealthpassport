// Column configurations for different roles
const ROLE_COLUMNS = {
    'school-admin': [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'section', header: 'Section', type: 'text' },
        { key: 'screening_status', header: 'Screening Status', type: 'status' },
        { key: 'payment_status', header: 'Payment Status', type: 'status' },
        { key: 'action', header: 'Action', type: 'action' },
    ],

    'school-admin-accounts': [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'payment_status', header: 'Payment', type: 'status' },
        { key: 'invoice', header: 'Invoice', type: 'invoice' },
    ],

    teacher: [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'phone', header: 'Phone Number', type: 'phone' },
        { key: 'parent_questions_status', header: 'Parent Questionnaire Status', type: 'status' },
        { key: 'teacher_questions_status', header: 'Teacher Questionnaire Status', type: 'status' },
        { key: 'payment_status', header: 'Payment Status', type: 'status' },
    ],

    expert: [
        { key: 'serial', header: 'Serial No.', type: 'serial' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'phone', header: 'Phone Number', type: 'phone' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
    ],

    screening: [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'section', header: 'Section', type: 'text' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'screening_status', header: 'Screening Status', type: 'status' },
    ],

    analyst: [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'section', header: 'Section', type: 'text' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'screening_status', header: 'Screening Status', type: 'status' },
    ],

    onground: [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'phone', header: 'Phone Number', type: 'phone' },
        { key: 'attandance_status', header: 'Attandance Status', type: 'status' },
    ],

    CAMP_COORDINATOR: [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'screening_status', header: 'Screening Status', type: 'status' },
    ],

    'admin': [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'screening_status', header: 'Screening Status', type: 'status' },
    ],

    'program-coordinator': [
        { key: 'roll_no', header: 'Roll No.', type: 'text' },
        { key: 'name', header: 'Name', type: 'fullName' },
        { key: 'class_room', header: 'Class', type: 'text' },
        { key: 'section', header: 'Section', type: 'text' },
        { key: 'gender', header: 'Gender', type: 'text' },
        { key: 'age', header: 'Age', type: 'text' },
        { key: 'payment_status', header: 'Payment Status', type: 'status' },
        { key: 'parent_questions_status', header: 'Parent Questionnaire Status', type: 'status' },
        { key: 'screening_status', header: 'Screening Status', type: 'status' },
        // { key: 'payment_status', header: 'Payment Status', type: 'status' },
    ],
};

export default ROLE_COLUMNS;