'use client';

import { useState, useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import { ChevronDownIcon, CalendarIcon, PlusCircleIcon } from '@heroicons/react/16/solid';
import { createStudent } from '@/services/secureApis';
import { useRouter, useParams } from 'next/navigation';
import { toastMessage } from '@/helpers/utilities';

export default function StudentForm() {
  const { schoolid } = useParams();
  const router = useRouter();
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [file, setFile] = useState(null);
  const [school_id, setSchool_id] = useState(schoolid);
  const [errors, setErrors] = useState({}); // State for validation errors
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    dob: '',
    blood_group: '',
    class_room: '', // Maps to backend 'klass'
    section: '',
    roll_no: '',
    aadhaar_no: '',
    abha_id: '',
    mp_uhid: '',
    food_preferences: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    street: '',
    pincode: '',
    country_code: '',
    phone: '',
    country: '',
    primary_first_name: '',
    primary_middle_name: '',
    primary_last_name: '',
    primary_country_calling_code: '',
    primary_phone: '',
    primary_email: '',
    secondary_first_name: '',
    secondary_middle_name: '',
    secondary_last_name: '',
    secondary_country_calling_code: '',
    secondary_phone: '',
    secondary_email: '',
    profile_image: '',
    parent_pincode: '',
  });

  // Required fields based on StudentCreate model
  const requiredFields = ['first_name', 'last_name', 'gender', 'phone', 'class_room', 'section', 'dob', 'roll_no'];

  useEffect(() => {
    if (typeof schoolid === 'undefined') {
      const base64User = localStorage.getItem('user_info');
      const user_info = JSON.parse(atob(base64User));
      if (user_info && user_info.school_id) {
        setSchool_id(user_info.school_id);
      }
    }
  }, [schoolid]);

  const validateField = (name, value) => {
    let error = '';
    if (requiredFields.includes(name) && !value) {
      error = `${name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} is required`;
    } else if (name === 'aadhaar_no' && value && !/^\d{12}$/.test(value)) {
      error = 'Aadhaar number must be 12 digits';
    } else if (name === 'pincode' && value && !/^\d{6}$/.test(value)) {
      error = 'Pincode must be a 6-digit number';
    } else if (name === 'phone' && value && !/^\+?1?\d{10,15}$/.test(value)) {
      error = 'Invalid phone number format';
    } else if (name === 'country_code' && value && !/^\+\d{1,3}$/.test(value)) {
      error = 'Invalid country code (e.g., +91)';
    } else if (name === 'gender' && value && !['MALE', 'FEMALE', 'OTHERS'].includes(value)) {
      error = 'Gender must be Male, Female, or Others';
    } else if (name === 'class_room' && value === '') {
      error = 'Please select class room';
    } else if (name === 'section' && value === '') {
      error = 'Please select class section';
    }
    // else if (name === 'parent_pincode' && value && !/^\d{6}$/.test(value)) {
    //   error = 'Pincode must be a 6-digit number';
    // }
    return error;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Validate on change
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const calculateAge = date => {
    if (!date) {
      setAge('');
      setDob('');
      setFormData({ ...formData, dob: '' });
      setErrors(prev => ({ ...prev, dob: 'Date of Birth is required' }));
      return;
    }
    const birthDate = dayjs(date);
    const today = dayjs();
    const years = today.diff(birthDate, 'year');
    const months = today.diff(birthDate.add(years, 'year'), 'month');
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    setDob(formattedDate);
    setAge(`${years} Years ${months} Months`);
    setFormData({ ...formData, dob: formattedDate });
    setErrors(prev => ({ ...prev, dob: '' }));
  };

  const handleFileChange = async event => {
    const selectedFile = event.target.files[0];
    const sizeInKB = (selectedFile.size / 1024).toFixed(2);
    if (sizeInKB > 500) {
      toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
      return;
    }
    if (!selectedFile) {
      setErrors(prev => ({ ...prev, profile_image: 'Profile photo is required' }));
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      setFormData({ ...formData, profile_image: base64String });
      setErrors(prev => ({ ...prev, profile_image: '' }));
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = {};
    let hasErrors = false;

    // Validate all required fields
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    // if (!formData.profile_image) {
    //   newErrors.profile_image = 'Profile photo is required';
    //   hasErrors = true;
    // }

    setErrors(newErrors);

    if (hasErrors) {
      toastMessage('Please fill in all required fields correctly', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
      };

      const response = await createStudent(school_id, JSON.stringify(payload));
      if (response.status === true) {
        toastMessage(response.message || 'Student created successfully', 'success');
        router.back();
      } else if (response.status === false) {
        toastMessage(response?.message || 'Failed to create student', 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'An error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form method="POST" encType="multipart/form-data" onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">{'Personal Details'}</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
                First Name <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
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
                  value={formData.middle_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.middle_name && <p className="mt-1 text-xs text-red-600">{errors.middle_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="last_name" className="block text-xs/4 font-normal text-[#656565]">
                Last Name (Family Name) <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="gender" className="block text-xs/4 font-normal text-[#656565]">
                Gender <span className="text-red-600">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHERS">Others</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
                {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="dob" className="block text-xs/4 font-normal text-[#656565]">
                Date of Birth <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <DatePicker
                  id="dob"
                  name="dob"
                  format="YYYY-MM-DD"
                  placeholder="YYYY-MM-DD"
                  value={dob ? dayjs(dob) : null}
                  onChange={calculateAge}
                  suffixIcon={<CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                  className="custom-datepicker block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
              </div>
            </div>
            <div className="max-w-sm">
              <label className="block text-xs/4 font-normal text-[#656565]">Age</label>
              <div className="mt-2 text-gray-900 text-base px-3 py-1.5 sm:text-sm/6">{age || '--'}</div>
            </div>
            <div className="max-w-sm">
              <label htmlFor="blood_group" className="block text-xs/4 font-normal text-[#656565]">
                Blood Group <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="blood_group"
                  name="blood_group"
                  type="text"
                  value={formData.blood_group}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.blood_group && <p className="mt-1 text-xs text-red-600">{errors.blood_group}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="upload_photo" className="block text-xs/4 font-normal text-[#656565]">
                Upload Portrait <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg" />
                <label htmlFor="fileInput">
                  <a type="button" className="rounded-full bg-blue-100 p-2 text-blue-500">
                    <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </a>
                  {file ? file.name : ''}
                </label>
                {errors.profile_image && <p className="mt-1 text-xs text-red-600">{errors.profile_image}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Identity Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="aadhaar_no" className="block text-xs/4 font-normal text-[#656565]">
                Aadhaar Number <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="aadhaar_no"
                  name="aadhaar_no"
                  type="text"
                  value={formData.aadhaar_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.aadhaar_no && <p className="mt-1 text-xs text-red-600">{errors.aadhaar_no}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="mp_uhid" className="block text-xs/4 font-normal text-[#656565]">
                MP UHID
              </label>
              <div className="mt-2">
                <input
                  id="mp_uhid"
                  name="mp_uhid"
                  type="text"
                  value={formData.mp_uhid}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.mp_uhid && <p className="mt-1 text-xs text-red-600">{errors.mp_uhid}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="abha_id" className="block text-xs/4 font-normal text-[#656565]">
                Abha ID <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="abha_id"
                  name="abha_id"
                  type="text"
                  value={formData.abha_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.abha_id && <p className="mt-1 text-xs text-red-600">{errors.abha_id}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="class_room" className="block text-xs/4 font-normal text-[#656565]">
                Class Room <span className="text-red-600">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="class_room"
                  name="class_room"
                  value={formData.class_room}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option value="">Select Class Room</option>
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
                {errors.class_room && <p className="mt-1 text-xs text-red-600">{errors.class_room}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="section" className="block text-xs/4 font-normal text-[#656565]">
                Section <span className="text-red-600">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option value="">Select Section</option>
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
                {errors.section && <p className="mt-1 text-xs text-red-600">{errors.section}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="roll_no" className="block text-xs/4 font-normal text-[#656565]">
                Roll Number <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="roll_no"
                  name="roll_no"
                  type="text"
                  value={formData.roll_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="1234"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.roll_no && <p className="mt-1 text-xs text-red-600">{errors.roll_no}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-900/10 pb-[30px]">
          <h2 className="text-base/7 font-semibold text-gray-900">Food Preferences</h2>
          <div className="mt-[30px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="food_preferences" className="block text-xs/4 font-normal text-[#656565]">
                Diet Preference <span className="text-red-600">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="food_preferences"
                  name="food_preferences"
                  value={formData.food_preferences}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option value="">Select Diet Preference</option>
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
                {errors.food_preferences && <p className="mt-1 text-xs text-red-600">{errors.food_preferences}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="address_line1" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 1 <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="address_line1"
                  name="address_line1"
                  type="text"
                  value={formData.address_line1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.address_line1 && <p className="mt-1 text-xs text-red-600">{errors.address_line1}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="address_line2" className="block text-xs/4 font-normal text-[#656565]">
                Address Line 2
              </label>
              <div className="mt-2">
                <input
                  id="address_line2"
                  name="address_line2"
                  type="text"
                  value={formData.address_line2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.address_line2 && <p className="mt-1 text-xs text-red-600">{errors.address_line2}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="landmark" className="block text-xs/4 font-normal text-[#656565]">
                Landmark
              </label>
              <div className="mt-2">
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  value={formData.landmark}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.landmark && <p className="mt-1 text-xs text-red-600">{errors.landmark}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="street" className="block text-xs/4 font-normal text-[#656565]">
                Street Name <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="street"
                  name="street"
                  type="text"
                  value={formData.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="pincode" className="block text-xs/4 font-normal text-[#656565]">
                Pincode <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
              </div>
            </div>
            <div className="max-w-sm">
              <label htmlFor="country_code" className="block text-xs/4 font-normal text-[#656565]">
                Country Calling Code <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="country_code"
                  name="country_code"
                  type="text"
                  value={formData.country_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.country_code && <p className="mt-1 text-xs text-red-600">{errors.country_code}</p>}
              </div>
            </div>
            <div className="max-w-sm">
              <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
                Phone/Mobile <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="country" className="block text-xs/4 font-normal text-[#656565]">
                Country <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-900/10 pb-[30px] mt">
          <h2 className="text-base/7 font-semibold text-gray-900">Parent’s Details</h2>
          <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
            <div className="max-w-sm">
              <label htmlFor="primary_first_name" className="block text-xs/4 font-normal text-[#656565]">
                Father's First Name <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="primary_first_name"
                  name="primary_first_name"
                  type="text"
                  value={formData.primary_first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.primary_first_name && <p className="mt-1 text-xs text-red-600">{errors.primary_first_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_middle_name" className="block text-xs/4 font-normal text-[#656565]">
                Father's Middle Name <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="primary_middle_name"
                  name="primary_middle_name"
                  type="text"
                  value={formData.primary_middle_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.primary_middle_name && <p className="mt-1 text-xs text-red-600">{errors.primary_middle_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_last_name" className="block text-xs/4 font-normal text-[#656565]">
                Father's Last Name (Family Name) <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="primary_last_name"
                  name="primary_last_name"
                  type="text"
                  value={formData.primary_last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.primary_last_name && <p className="mt-1 text-xs text-red-600">{errors.primary_last_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_country_calling_code" className="block text-xs/4 font-normal text-[#656565]">
                Father's Phone (Country Code) <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="primary_country_calling_code"
                  name="primary_country_calling_code"
                  type="text"
                  value={formData.primary_country_calling_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_phone" className="block text-xs/4 font-normal text-[#656565]">
                Father Phone Number <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="primary_phone"
                  name="primary_phone"
                  type="text"
                  value={formData.primary_phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.primary_phone && <p className="mt-1 text-xs text-red-600">{errors.primary_phone}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="primary_email" className="block text-xs/4 font-normal text-[#656565]">
                Father Email <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="primary_email"
                  name="primary_email"
                  type="email"
                  value={formData.primary_email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.primary_email && <p className="mt-1 text-xs text-red-600">{errors.primary_email}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_first_name" className="block text-xs/4 font-normal text-[#656565]">
                Mother's First Name <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="secondary_first_name"
                  name="secondary_first_name"
                  type="text"
                  value={formData.secondary_first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.secondary_first_name && <p className="mt-1 text-xs text-red-600">{errors.secondary_first_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_middle_name" className="block text-xs/4 font-normal text-[#656565]">
                Mother's Middle Name <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="secondary_middle_name"
                  name="secondary_middle_name"
                  type="text"
                  value={formData.secondary_middle_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.secondary_middle_name && <p className="mt-1 text-xs text-red-600">{errors.secondary_middle_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_last_name" className="block text-xs/4 font-normal text-[#656565]">
                Mother's Last Name (Family Name) <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="secondary_last_name"
                  name="secondary_last_name"
                  type="text"
                  value={formData.secondary_last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.secondary_last_name && <p className="mt-1 text-xs text-red-600">{errors.secondary_last_name}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_country_calling_code" className="block text-xs/4 font-normal text-[#656565]">
                Mother's Phone (Country Code) <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="secondary_country_calling_code"
                  name="secondary_country_calling_code"
                  type="text"
                  value={formData.secondary_country_calling_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_phone" className="block text-xs/4 font-normal text-[#656565]">
                Mother Phone Number <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="secondary_phone"
                  name="secondary_phone"
                  type="text"
                  value={formData.secondary_phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.secondary_phone && <p className="mt-1 text-xs text-red-600">{errors.secondary_phone}</p>}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="secondary_email" className="block text-xs/4 font-normal text-[#656565]">
                Mother Email <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="secondary_email"
                  name="secondary_email"
                  type="email"
                  value={formData.secondary_email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.secondary_email && <p className="mt-1 text-xs text-red-600">{errors.secondary_email}</p>}
              </div>
            </div>
            {/* Add after Father Email field */}
            <div className="max-w-sm">
              <label htmlFor="parent_pincode" className="block text-xs/4 font-normal text-[#656565]">
                Parent’s Pincode <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="parent_pincode"
                  name="parent_pincode"
                  type="text"
                  maxLength="6"
                  value={formData.parent_pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter 6-digit pincode"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                {errors.parent_pincode && <p className="mt-1 text-xs text-red-600">{errors.parent_pincode}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button
            onClick={() => router.back()}
            type="button"
            className="cursor-pointer font-normal py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap"
            disabled={isSubmitting}
          >
            Close
          </button>
          <button
            type="submit"
            className="rounded-[5px] bg-indigo-500 px-5 py-2 text-sm font-normal whitespace-nowrap text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
}
