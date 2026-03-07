'use client';

import React, { useState, useEffect } from 'react';
import nookies from 'nookies';
import { useRouter, useParams } from 'next/navigation';
import { ChevronDownIcon, CalendarIcon, PlusCircleIcon } from '@heroicons/react/16/solid';
import { updateTeacher } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import InlineSpinner from '../UI/InlineSpinner';
dayjs.extend(duration);

const initialData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  country_calling_code: '+91',
  phone: '',
  dob: '',
  gender: 'Male',
  address_line_1: '',
  address_line_2: '',
  landmark: '',
  location: '',
  street: '',
  state: '',
  pincode: '',
  country: 'India',
  class_room: '',
  section: '',
}

export default function UpdateTeacherForm({ details }) {
  const { id } = useParams();
  const router = useRouter();
  const cookies = nookies.get();
  const [root, setRoot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cookies.root && cookies.root !== 'undefined') {
      setRoot(cookies.root);
    }
    if (details.status === true) {
      const teacher = details.data.teacher;
      setFormData(prev => ({
        ...prev,
        ...teacher,
      }));
      setLoading(false);
    }

  }, [details]);

  const handleFileChange = async event => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    const sizeInKB = (selectedFile.size / 1024).toFixed(2);
    if (sizeInKB > 500) {
      toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      setFormData({ ...formData, profile_image: base64String });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (name === 'dob') {
      const formattedDate = dayjs(value).format("YYYY-MM-DD");
      setFormData(prev => ({
        ...prev,
        [name]: formattedDate,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const changeDobFormat = date => {
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    setFormData(prev => ({ ...prev, ['dob']: formattedDate }));
  }

  // Basic form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.class_room.trim()) {
      newErrors.class_room = 'Class is required';
    }

    if (!formData.section.trim()) {
      newErrors.section = 'Section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await updateTeacher(id, JSON.stringify(formData));
      if (response.status === true) {
        const successMessage = response.message || 'Teacher updated successfully';
        toastMessage(successMessage, 'success');
        router.back();
      } else {
        toastMessage(response.message || 'An error occurred while updating teacher', 'error');
      }
    } catch (err) {
      toastMessage(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 justify-center items-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <form method="POST" onSubmit={handleSubmit}>
      <div className="space-y-12">
        <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
        <div className="mt-[30px] grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
          <div className="max-w-sm">
            <label htmlFor="first_name" className="block text-xs/4 font-normal text-[#656565]">
              First Name *
            </label>
            <div className="mt-2">
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleInputChange}
                autoComplete="first-name"
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.first_name ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
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
                onChange={handleInputChange}
                autoComplete="middle-name"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="last_name" className="block text-xs/4 font-normal text-[#656565]">
              Last Name (Family Name) *
            </label>
            <div className="mt-2">
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleInputChange}
                autoComplete="last-name"
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.last_name ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
            </div>
          </div>

          <div className='max-w-sm'>
            <label htmlFor="dob" className="block text-xs/4 font-normal text-[#656565]">
              Date of Birth
            </label>
            <div className="mt-2">
              <DatePicker
                id="dob"
                name="dob"
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
                defaultValue={dayjs(details?.data?.teacher.dob)}
                onChange={date => changeDobFormat(date)}
                suffixIcon={<CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                className="custom-datepicker block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-base text-gray-900 
                                        outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="email" className="block text-xs/4 font-normal text-[#656565]">
              Email *
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.last_name ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="gender" className="block text-xs/4 font-normal text-[#656565]">
              Gender
            </label>
            <div className="mt-2 grid grid-cols-1">
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                autoComplete="gender"
                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
              <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
              />
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="country_calling_code" className="block text-xs/4 font-normal text-[#656565]">
              Country Code *
            </label>
            <div className="mt-2">
              <input
                id="country_calling_code"
                name="country_calling_code"
                type="text"
                value={formData.country_calling_code}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.last_name ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.country_calling_code && <p className="mt-1 text-xs text-red-600">{errors.country_calling_code}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
              Phone/Mobile *
            </label>
            <div className="mt-2">
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="upload_photo" className="block text-xs/4 font-normal text-[#656565]">
              Upload Portrait *
            </label>
            <div className="mt-2">
              <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg" />
              <label htmlFor="fileInput">
                <a type="button" className="rounded-full bg-blue-100 p-2 text-blue-500">
                  <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
                </a>
                {file ? file.name : ''}
              </label>
            </div>
          </div>
        </div>

        <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
        <div className="mt-[30px] grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
          <div className="max-w-sm">
            <label htmlFor="class_room" className="block text-xs/4 font-normal text-[#656565]">
              Class *
            </label>
            <div className="mt-2 grid grid-cols-1">
              <select
                id="class_room"
                name="class_room"
                value={formData.class_room}
                onChange={handleInputChange}
                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              >
                <option value="">Select class</option>
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
              Section *
            </label>
            <div className="mt-2 grid grid-cols-1">
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              >
                <option value="">Select section</option>
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
            <label htmlFor="address_line_1" className="block text-xs/4 font-normal text-[#656565]">
              Address Line 1
            </label>
            <div className="mt-2">
              <input
                id="address_line_1"
                name="address_line_1"
                type="text"
                value={formData.address_line_1}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.address_line_1 && <p className="mt-1 text-xs text-red-600">{errors.address_line_1}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="address_line_2" className="block text-xs/4 font-normal text-[#656565]">
              Address Line 2
            </label>
            <div className="mt-2">
              <input
                id="address_line_2"
                name="address_line_2"
                type="text"
                value={formData.address_line_2}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.address_line_2 && <p className="mt-1 text-xs text-red-600">{errors.address_line_2}</p>}
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
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.landmark && <p className="mt-1 text-xs text-red-600">{errors.landmark}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="location" className="block text-xs/4 font-normal text-[#656565]">
              Location
            </label>
            <div className="mt-2">
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="street" className="block text-xs/4 font-normal text-[#656565]">
              Street
            </label>
            <div className="mt-2">
              <input
                id="street"
                name="street"
                type="text"
                value={formData.street}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street}</p>}
            </div>
          </div>
          <div className="max-w-sm">
            <label htmlFor="state" className="block text-xs/4 font-normal text-[#656565]">
              State
            </label>
            <div className="mt-2">
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="country" className="block text-xs/4 font-normal text-[#656565]">
              Country
            </label>
            <div className="mt-2">
              <input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="pincode" className="block text-xs/4 font-normal text-[#656565]">
              Pincode
            </label>
            <div className="mt-2">
              <input
                id="pincode"
                name="pincode"
                type="text"
                value={formData.pincode}
                onChange={handleInputChange}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.phone ? 'outline-red-500' : 'outline-gray-300'
                  } placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
              />
              {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
            </div>
          </div>

        </div>

        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="font-normal cursor-pointer w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[5px] cursor-pointer bg-indigo-500 w-[135px] h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
}
