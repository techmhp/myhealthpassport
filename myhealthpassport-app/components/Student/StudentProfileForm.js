'use client';

import React, { useState, useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import { ChevronDownIcon, CalendarIcon, PlusCircleIcon } from '@heroicons/react/16/solid';
import { updateStudentDetails, updateStudentAttendance } from '@/services/secureApis';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { toastMessage } from '@/helpers/utilities';
import { useParams } from 'next/navigation';

const initialStudentData = {
  id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  blood_group: '',
  age: '',
  dob: '',
  identity_details: {
    aadhaar_no: '',
    mp_uhid: '',
    abha_id: '',
    class_room: '',
    section: '',
    roll_no: '',
  },
  food: {
    food_preferences: '',
  },
  address_details: {
    address_line1: '',
    address_line2: '',
    street: '',
    landmark: '',
    state: '',
    country: '',
    pincode: '',
    country_code: '',
    phone: '',
  },
};

const initialParentData = {
  id: '',
  primary_country_calling_code: '',
  primary_email: '',
  primary_first_name: '',
  primary_last_name: '',
  primary_middle_name: '',
  primary_mobile: '',
  secondary_country_calling_code: '',
  secondary_email: '',
  secondary_first_name: '',
  secondary_last_name: '',
  secondary_middle_name: '',
  secondary_mobile: '',
  parent_pincode: '',
};

export default function StudentProfileForm({ details }) {
  const router = useRouter();
  const cookies = nookies.get();
  const { schoolid } = useParams();
  const [edit_status, setEdit_status] = useState(false);
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [root, setRoot] = useState(null);
  const [role, setRole] = useState(null);
  const [file, setFile] = React.useState(null);
  const [base64Image, setBase64Image] = useState('');
  const [student, setStudent] = useState(initialStudentData);
  const [parent, setParent] = useState({ ...initialParentData });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRoot(cookies.root);
    setRole(cookies.role);
    if (cookies.root === 'parent') {
      setEdit_status(true);
    }
    if (details.status && details.data) {
      const { student_details, parent_details } = details.data;

      setStudent(prevStudent => ({
        ...prevStudent,
        ...student_details,
        identity_details: { ...prevStudent.identity_details, ...student_details.identity_details },
        food: { ...prevStudent.food, ...student_details.food },
        address_details: { ...prevStudent.address_details, ...student_details.address_details },
      }));

      setParent(parent_details);
    }
  }, [details]);

  const calculateAge = date => {
    if (!date) {
      setAge('');
      setDob('');
      setErrors(prev => ({ ...prev, dob: 'Date of birth is required' }));
      return;
    }
    const birthDate = dayjs(date);
    const today = dayjs();
    const years = today.diff(birthDate, 'year');
    const months = today.diff(birthDate.add(years, 'year'), 'month');
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    setDob(formattedDate);
    setAge(`${years} years ${months} months`);
    setStudent(s => ({ ...s, ['dob']: formattedDate }));
    setStudent(s => ({ ...s, ['age']: `${years} years` }));
    setErrors(prev => ({ ...prev, dob: '' }));
  };

  const validateField = (name, value) => {
    let error = '';

    if (name === 'first_name') {
      if (!value) {
        error = 'First name is required';
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        error = 'First name must contain only letters and spaces';
      } else if (value.length > 50) {
        error = 'First name must be 50 characters or less';
      }
    }

    if (name === 'last_name') {
      if (!value) {
        error = 'Last name is required';
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        error = 'Last name must contain only letters and spaces';
      } else if (value.length > 50) {
        error = 'Last name must be 50 characters or less';
      }
    }

    if (name === 'gender') {
      if (!value || value === 'Select Gender') {
        error = 'Gender is required';
      } else if (!['MALE', 'FEMALE', 'OTHERS'].includes(value)) {
        error = 'Gender must be Male, Female, or Others';
      }
    }

    if (name === 'dob') {
      if (!value) {
        error = 'Date of birth is required';
      }
    }

    if (name === 'identity_class_room') {
      const val = value || student.identity_details.class_room;
      if (!val) {
        error = 'Class is required';
      }
      // else {
      //   const classNum = parseInt(val, 10);
      //   if (isNaN(classNum) || classNum < 1 || classNum > 12) {
      //     error = 'Class must be between 1 and 12';
      //   }
      // }
    }

    if (name === 'identity_section') {
      const val = value || student.identity_details.section;
      if (!val) {
        error = 'Section is required';
      } else if (val.length > 10) {
        error = 'Section must be 2 characters or less';
      }
    }

    if (name === 'identity_roll_no') {
      const val = value || student.identity_details.roll_no;
      if (!val) {
        error = 'Roll number is required';
      } else if (val.length > 20) {
        error = 'Roll number must be 20 characters or less';
      }
    }

    if (name === 'identity_aadhaar_no') {
      const val = value || student.identity_details.aadhaar_no;
      if (!val) {
        error = 'Aadhaar number is required';
      } else if (!/^\d{12}$/.test(val)) {
        error = 'Aadhaar number must be exactly 12 digits';
      }
    }

    if (name === 'identity_abha_id') {
      const val = value || student.identity_details.abha_id;
      if (!val) {
        error = 'Abha ID is required';
      } else if (val.length > 20) {
        error = 'Abha ID must be 20 characters or less';
      }
    }

    if (name === 'address_address_line1') {
      const val = value || student.address_details.address_line1;
      if (!val) {
        error = 'Address line 1 is required';
      } else if (val.length > 200) {
        error = 'Address line 1 must be 200 characters or less';
      }
    }

    if (name === 'address_street') {
      const val = value || student.address_details.street;
      if (!val) {
        error = 'Street name is required';
      } else if (val.length > 100) {
        error = 'Street name must be 100 characters or less';
      }
    }

    if (name === 'address_state') {
      const val = value || student.address_details.state;
      if (!val) {
        error = 'State is required';
      } else if (val.length > 100) {
        error = 'State must be 100 characters or less';
      }
    }

    if (name === 'address_pincode') {
      const val = value || student.address_details.pincode;
      if (!val) {
        error = 'Pincode is required';
      } else {
        const pinNum = parseInt(val, 10);
        if (isNaN(pinNum) || pinNum < 100000 || pinNum > 999999) {
          error = 'Pincode must be a 6-digit number';
        }
      }
    }

    if (name === 'parent_pincode') {
      const val = value || parent.parent_pincode;
      if (!val) {
        error = 'Pincode is required';
      } else {
        const pinNum = parseInt(val, 10);
        if (isNaN(pinNum) || pinNum < 100000 || pinNum > 999999) {
          error = 'Pincode must be a 6-digit number';
        }
      }
    }

    if (name === 'address_country_code') {
      const val = value || student.address_details.country_code;
      if (!val) {
        error = 'Country calling code is required';
      } else if (val.length > 10) {
        error = 'Country calling code must be 10 characters or less';
      }
    }

    if (name === 'address_phone') {
      const val = value || student.address_details.phone;
      if (!val) {
        error = 'Phone number is required';
      } else if (!/^\+?1?\d{10,15}$/.test(val)) {
        error = 'Phone number must be 10-15 digits, optionally starting with + or 1';
      }
    }

    if (name === 'address_country') {
      const val = value || student.address_details.country;
      if (!val) {
        error = 'Country is required';
      } else if (val.length > 100) {
        error = 'Country must be 100 characters or less';
      }
    }

    return error;
  };

  const handleStudentChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('identity_')) {
      setStudent(s => ({ ...s, identity_details: { ...s.identity_details, [name.replace('identity_', '')]: value } }));
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    } else if (name.startsWith('food_')) {
      setStudent(s => ({ ...s, food: { ...s.food, [name]: value } }));
    } else if (name.startsWith('address_')) {
      setStudent(s => ({ ...s, address_details: { ...s.address_details, [name.replace('address_', '')]: value } }));
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    } else {
      setStudent(s => ({ ...s, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleParentChange = e => {
    const { name, value } = e.target;
    if (name === 'parent_pincode') {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    setParent(p => ({ ...p, [name]: value }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      const sizeInKB = (file.size / 1024).toFixed(2);
      if (sizeInKB > 500) {
        toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result);
        setStudent(s => ({ ...s, ['profile_image']: reader.result }));
      };
      reader.readAsDataURL(file);
      setFile(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const dataToSend = {
      student_details: student,
      parent_details: parent,
      school_id: schoolid ? schoolid : null,
    };

    try {
      const response = await updateStudentDetails(student.id, dataToSend);

      if (response.status === true) {
        if (role === 'REGISTRATION_TEAM') {
          handleConfirmAction();
        }
        toastMessage(response.message, 'success');
        router.back();
      } else if (response.status === false) {
        toastMessage(response?.errors?.error_details || response?.message, 'error');
        // toastMessage(response?.message, 'error');
      }
    } catch (err) {
      console.log(err);

      toastMessage(err, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    try {
      const postObj = {
        attendance_status: true,
      };
      const response = await updateStudentAttendance(schoolid, student.id, JSON.stringify(postObj));
      if (response.status === true) {
        toastMessage(response.message, 'success');
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'An error occurred while updating data', 'error');
    }
  };

  return (
    <form method="POST" encType="multipart/form-data" onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Personal Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={student.first_name}
                  onChange={handleStudentChange}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.first_name ? 'border border-red-500' : ''
                  }`}
                  disabled={edit_status}
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="middle_name" className="block text-xs/4 font-normal text-[#656565]">
                Middle Name
              </label>
              <div className="mt-2">
                <input
                  id="middle_name"
                  name="middle_name"
                  type="text"
                  value={student.middle_name}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="last_name" className="block text-xs/4 font-normal text-[#656565]">
                Last Name (Family Name) <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={student.last_name}
                  disabled={edit_status}
                  onChange={handleStudentChange}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.last_name ? 'border border-red-500' : ''
                  }`}
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="gender" className="block text-xs/4 font-normal text-[#656565]">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="gender"
                  name="gender"
                  value={student.gender}
                  onChange={handleStudentChange}
                  className={`col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.gender ? 'border border-red-500' : ''
                  }`}
                  disabled={edit_status}
                >
                  <option>Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHERS">Others</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="dob" className="block text-xs/4 font-normal text-[#656565]">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <DatePicker
                  id="dob"
                  name="dob"
                  format="DD/MM/YYYY"
                  placeholder="DD/MM/YYYY"
                  defaultValue={dayjs(details?.data?.student_details.dob)}
                  onChange={date => calculateAge(date)}
                  suffixIcon={<CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                  className={`custom-datepicker block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.dob ? 'border border-red-500' : ''
                  }`}
                  disabled={edit_status}
                />
                {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs/4 font-normal text-[#656565]">Age</label>
              <div className="mt-2 text-gray-900 text-base px-3 py-1.5 sm:text-sm/6">{age ? age : student.age || '--'}</div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="blood_group" className="block text-xs/4 font-normal text-[#656565]">
                Blood Group
              </label>
              <div className="mt-2">
                <input
                  id="blood_group"
                  name="blood_group"
                  type="text"
                  value={student.blood_group}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="upload_photo" className="block text-xs/4 font-normal text-[#656565]">
                Upload Portrait
              </label>
              <div className="mt-2">
                <input id="fileInput" type="file" className="hidden" onChange={handleImageChange} disabled={edit_status} hidden />
                <label htmlFor="fileInput">
                  <a type="button" className="rounded-full bg-blue-100 p-2 text-blue-500">
                    <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </a>
                  {file ? file.name : ''}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Identity Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="identity_aadhaar_no" className="block text-xs/4 font-normal text-[#656565]">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="identity_aadhaar_no"
                  name="identity_aadhaar_no"
                  type="text"
                  value={student.identity_details.aadhaar_no}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.identity_aadhaar_no ? 'border border-red-500' : ''
                  }`}
                />
                {errors.identity_aadhaar_no && <p className="text-red-500 text-xs mt-1">{errors.identity_aadhaar_no}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="identity_mp_uhid" className="block text-xs/4 font-normal text-[#656565]">
                MP UHID
              </label>
              <div className="mt-2">
                <input
                  id="identity_mp_uhid"
                  name="identity_mp_uhid"
                  type="text"
                  value={student.identity_details.mp_uhid}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="identity_abha_id" className="block text-xs/4 font-normal text-[#656565]">
                Abha ID <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="identity_abha_id"
                  name="identity_abha_id"
                  type="text"
                  value={student.identity_details.abha_id}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.identity_abha_id ? 'border border-red-500' : ''
                  }`}
                />
                {errors.identity_abha_id && <p className="text-red-500 text-xs mt-1">{errors.identity_abha_id}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="identity_class_room" className="block text-xs/4 font-normal text-[#656565]">
                Class Room <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="identity_class_room"
                  name="identity_class_room"
                  value={student.identity_details.class_room}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option>Select Class Room</option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
                {errors.identity_class_room && <p className="text-red-500 text-xs mt-1">{errors.identity_class_room}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="identity_section" className="block text-xs/4 font-normal text-[#656565]">
                Section <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="identity_section"
                  name="identity_section"
                  value={student.identity_details.section}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option>Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                  <option value="H">H</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
                {errors.identity_section && <p className="text-red-500 text-xs mt-1">{errors.identity_section}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="identity_roll_no" className="block text-xs/4 font-normal text-[#656565]">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="identity_roll_no"
                  name="identity_roll_no"
                  type="text"
                  value={student.identity_details.roll_no}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.identity_roll_no ? 'border border-red-500' : ''
                  }`}
                />
                {errors.identity_roll_no && <p className="text-red-500 text-xs mt-1">{errors.identity_roll_no}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Food Preferences</h2>
          <div className="mt-[30px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="food_preferences" className="block text-xs/4 font-normal text-[#656565]">
                Diet Preference
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="food_preferences"
                  name="food_preferences"
                  value={student.food.food_preferences}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option>Select Diet Preference</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                  <option value="NON VEGETARIAN">Non vegetarian</option>
                  <option value="KETO">Keto</option>
                  <option value="HALAL">Halal</option>
                  <option value="LACTO VEGETARIAN">Lacto vegetarian</option>
                  <option value="OTHERS">Others</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="address_address_line1" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_address_line1"
                  name="address_address_line1"
                  type="text"
                  value={student.address_details.address_line1}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_address_line1 ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_address_line1 && <p className="text-red-500 text-xs mt-1">{errors.address_address_line1}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_address_line2" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 2
              </label>
              <div className="mt-2">
                <input
                  id="address_address_line2"
                  name="address_address_line2"
                  type="text"
                  value={student.address_details.address_line2}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_landmark" className="block text-xs/4 font-normal text-[#656565]">
                Landmark
              </label>
              <div className="mt-2">
                <input
                  id="address_landmark"
                  name="address_landmark"
                  type="text"
                  value={student.address_details.landmark}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_street" className="block text-xs/4 font-normal text-[#656565]">
                Street Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_street"
                  name="address_street"
                  type="text"
                  value={student.address_details.street}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_street ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_street && <p className="text-red-500 text-xs mt-1">{errors.address_street}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_state" className="block text-xs/4 font-normal text-[#656565]">
                State <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_state"
                  name="address_state"
                  type="text"
                  value={student.address_details.state}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_state ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_state && <p className="text-red-500 text-xs mt-1">{errors.address_state}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_pincode" className="block text-xs/4 font-normal text-[#656565]">
                Pincode <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_pincode"
                  name="address_pincode"
                  type="number"
                  value={student.address_details.pincode}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_pincode ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_pincode && <p className="text-red-500 text-xs mt-1">{errors.address_pincode}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_country_code" className="block text-xs/4 font-normal text-[#656565]">
                Country Calling Code <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_country_code"
                  name="address_country_code"
                  type="text"
                  value={student.address_details.country_code}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_country_code ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_country_code && <p className="text-red-500 text-xs mt-1">{errors.address_country_code}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_phone" className="block text-xs/4 font-normal text-[#656565]">
                Phone/Mobile <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_phone"
                  name="address_phone"
                  type="text"
                  value={student.address_details.phone}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_phone ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_phone && <p className="text-red-500 text-xs mt-1">{errors.address_phone}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_country" className="block text-xs/4 font-normal text-[#656565]">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_country"
                  name="address_country"
                  type="text"
                  value={student.address_details.country}
                  onChange={handleStudentChange}
                  disabled={edit_status}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    errors.address_country ? 'border border-red-500' : ''
                  }`}
                />
                {errors.address_country && <p className="text-red-500 text-xs mt-1">{errors.address_country}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Parent’s Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <input type="hidden" name="id" value={parent?.id} />
              <label htmlFor="primary_first_name" className="block text-xs/4 font-normal text-[#656565]">
                Father's First Name
              </label>
              <div className="mt-2">
                <input
                  id="primary_first_name"
                  name="primary_first_name"
                  type="text"
                  value={parent.primary_first_name}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_middle_name" className="block text-xs/4 font-normal text-[#656565]">
                Father's Middle Name
              </label>
              <div className="mt-2">
                <input
                  id="primary_middle_name"
                  name="primary_middle_name"
                  type="text"
                  value={parent.primary_middle_name}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_last_name" className="block text-xs/4 font-normal text-[#656565]">
                Father's Last Name (Family Name)
              </label>
              <div className="mt-2">
                <input
                  id="primary_last_name"
                  name="primary_last_name"
                  type="text"
                  value={parent.primary_last_name}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_country_calling_code" className="block text-xs/4 font-normal text-[#656565]">
                Father's Phone (Country Code)
              </label>
              <div className="mt-2">
                <input
                  id="primary_country_calling_code"
                  name="primary_country_calling_code"
                  type="text"
                  value={parent.primary_country_calling_code}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_mobile" className="block text-xs/4 font-normal text-[#656565]">
                Father Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="primary_mobile"
                  name="primary_mobile"
                  type="text"
                  value={parent.primary_mobile}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_email" className="block text-xs/4 font-normal text-[#656565]">
                Father Email
              </label>
              <div className="mt-2">
                <input
                  id="primary_email"
                  name="primary_email"
                  type="email"
                  value={parent.primary_email}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_first_name" className="block text-xs/4 font-normal text-[#656565]">
                Mother's First Name
              </label>
              <div className="mt-2">
                <input
                  id="secondary_first_name"
                  name="secondary_first_name"
                  type="text"
                  value={parent.secondary_first_name}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_middle_name" className="block text-xs/4 font-normal text-[#656565]">
                Mother's Middle Name
              </label>
              <div className="mt-2">
                <input
                  id="secondary_middle_name"
                  name="secondary_middle_name"
                  type="text"
                  value={parent.secondary_middle_name}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_last_name" className="block text-xs/4 font-normal text-[#656565]">
                Mother's Last Name (Family Name)
              </label>
              <div className="mt-2">
                <input
                  id="secondary_last_name"
                  name="secondary_last_name"
                  type="text"
                  value={parent.secondary_last_name}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_country_calling_code" className="block text-xs/4 font-normal text-[#656565]">
                Mother's Phone (Country Code)
              </label>
              <div className="mt-2">
                <input
                  id="secondary_country_calling_code"
                  name="secondary_country_calling_code"
                  type="text"
                  value={parent.secondary_country_calling_code}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_mobile" className="block text-xs/4 font-normal text-[#656565]">
                Mother Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="secondary_mobile"
                  name="secondary_mobile"
                  type="text"
                  value={parent.secondary_mobile}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_email" className="block text-xs/4 font-normal text-[#656565]">
                Mother Email
              </label>
              <div className="mt-2">
                <input
                  id="secondary_email"
                  name="secondary_email"
                  type="email"
                  value={parent.secondary_email}
                  onChange={handleParentChange}
                  disabled={edit_status}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
            <div className="max-w-sm">
              <label htmlFor="parent_pincode" className="block text-xs/4 font-normal text-[#656565]">
                Parent’s Pincode <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="parent_pincode"
                  name="parent_pincode"
                  type="number"
                  maxLength="6"
                  value={parent?.parent_pincode}
                  onChange={handleParentChange}
                  placeholder="Enter 6-digit pincode"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.parent_pincode && <p className="mt-1 text-xs text-red-600">{errors.parent_pincode}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button onClick={() => router.back()} type="button" className="font-normal py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">
            Close
          </button>
          {/* <button
            type="button"
            className="rounded-[5px] border border-[#FF5454] px-5 py-2 text-sm font-normal whitespace-nowrap text-[#FF5454] shadow-xs"
            
          >
            Deactivate Profile
          </button> */}
          <button
            type="submit"
            disabled={edit_status}
            onClick={() => setIsSubmitting(true)}
            className="rounded-[5px] bg-indigo-500 px-5 py-2 text-sm font-normal whitespace-nowrap text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            {isSubmitting ? 'Submitting...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
