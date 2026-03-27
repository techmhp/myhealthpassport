'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createSchool } from '@/services/secureApis';
import nookies from 'nookies';
import { toastMessage } from '@/helpers/utilities';

export default function SchoolProfileForm() {
  const router = useRouter();
  const cookies = nookies.get();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [root, setRoot] = React.useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({}); // State for validation errors
  const [formData, setFormData] = useState({
    school_name: '',
    school_fullname: '',
    school_location_link: '',
    school_code: '',
    school_logo: '',
    primary_contact_fullname: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    admin_contact_fullname: '',
    admin_contact_email: '',
    admin_contact_phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    street: '',
    state: '',
    pincode: '',
    phone: '',
    country: '',
    country_code: '',
    registration_no: '',
    location: '',
  });

  // Required fields based on StudentCreate model
  const requiredFields = ['school_name', 'primary_contact_email', 'primary_contact_phone'];

  useEffect(() => {
    setRoot(cookies.root);
  }, []);

  const validateField = (name, value) => {
    let error = '';
    if (requiredFields.includes(name) && !value) {
      error = `${name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} is required`;
    } else if (name === 'pincode' && value && !/^\d{6}$/.test(value)) {
      error = 'Pincode must be a 6-digit number';
    } else if (name === 'phone' && value && !/^\+?1?\d{10,15}$/.test(value)) {
      error = 'Invalid phone number format';
    } else if (name === 'country_code' && value && !/^\+\d{1,3}$/.test(value)) {
      error = 'Invalid country code (e.g., +91)';
    }
    return error;
  };

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) {
      setErrors(prev => ({ ...prev, school_logo: 'School logo is required' }));
      return;
    } else if (file) {
      const sizeInKB = (file.size / 1024).toFixed(2);
      if (sizeInKB > 500) {
        toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFormData({ ...formData, ['school_logo']: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async e => {
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

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
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
    setErrors(newErrors);
    if (hasErrors) {
      toastMessage('Please fill in all required fields correctly', 'error');
      setIsSubmitting(false);
      return;
    }

    if (formData.school_logo === '') {
      toastMessage('Please choose the school logo', 'error');
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await createSchool(JSON.stringify(formData));
      if (response.status === true) {
        toastMessage(response.message, 'success');
        router.push(`/${root}/schools`);
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
      }
      // console.log(response)
    } catch (err) {
      toastMessage(err, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form method="POST" onSubmit={handleSubmit} encType="multipart/form-data">
      <div className="px-0 sm:px-1">
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-[70px] items-center">
            <div className="flex flex-col">
              <label className="text-xs font-medium my-2">
                School Logo <span className="text-red-600"> * </span>
              </label>
              <div onClick={handleImageClick} className="flex cursor-pointer items-center justify-center rounded-[10px] bg-[#F3F7FA] w-[100px] h-[85px]">
                {preview ? <img src={preview} alt="Profile" className="w-full h-full rounded-[10px]" /> : <Plus className="w-6 h-6 text-gray-500" />}
                <input type="file" id="school_logo" name="school_logo" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                {errors.school_logo && <p className="mt-1 text-xs text-red-600">{errors.school_logo}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-[15px] items-start">
              <h3 className="font-semibold text-[14px] leading-[100%] tracking-[0]">--</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col items-start">
                  <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Location</p>
                  <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0]">--</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Strength</p>
                  <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0] text-center">--</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Onboarding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
        <div className="w-full">
          <div className="bg-white rounded-lg">
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-[30px]">
                <h2 className="text-base/7 font-semibold text-gray-900">Basic Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  {/* School Name */}
                  <div className="max-w-sm">
                    <label htmlFor="school-name" className="block text-xs/4 font-normal text-[#656565]">
                      School Name <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_name"
                        name="school_name"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                      {errors.school_name && <p className="mt-1 text-xs text-red-600">{errors.school_name}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="school_fullname" className="block text-xs/4 font-normal text-[#656565]">
                      School Full Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_fullname"
                        name="school_fullname"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.school_fullname && <p className="mt-1 text-xs text-red-600">{errors.school_fullname}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="school_code" className="block text-xs/4 font-normal text-[#656565]">
                      School Code
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_code"
                        name="school_code"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.school_code && <p className="mt-1 text-xs text-red-600">{errors.school_code}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="registration_no" className="block text-xs/4 font-normal text-[#656565]">
                      Registration Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="registration_no"
                        name="registration_no"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.registration_no && <p className="mt-1 text-xs text-red-600">{errors.registration_no}</p>}
                    </div>
                  </div>

                  {/* Google Map Location Link */}
                  <div className="max-w-sm">
                    <label htmlFor="school_location_link" className="block text-xs/4 font-normal text-[#656565]">
                      Google Map Location Link
                    </label>
                    <div className="mt-2">
                      <input
                        id="school_location_link"
                        name="school_location_link"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.school_location_link && <p className="mt-1 text-xs text-red-600">{errors.school_location_link}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px] mt">
                <h2 className="text-base/7 font-semibold text-gray-900">Contact Details</h2>
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  {/* Primary Contact Full Name */}
                  <div className="max-w-sm">
                    <label htmlFor="primary_contact_fullname" className="block text-xs/4 font-normal text-[#656565]">
                      Primary Contact Full Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="primary_contact_fullname"
                        name="primary_contact_fullname"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.primary_contact_fullname && <p className="mt-1 text-xs text-red-600">{errors.primary_contact_fullname}</p>}
                    </div>
                  </div>

                  {/* Primary Contact Email */}
                  <div className="max-w-sm">
                    <label htmlFor="primary_contact_email" className="block text-xs/4 font-normal text-[#656565]">
                      Primary Contact Email <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="primary_contact_email"
                        name="primary_contact_email"
                        type="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                      {errors.primary_contact_email && <p className="mt-1 text-xs text-red-600">{errors.primary_contact_email}</p>}
                    </div>
                  </div>

                  {/* Primary Contact Phone Number */}
                  <div className="max-w-sm">
                    <label htmlFor="primary_contact_phone" className="block text-xs/4 font-normal text-[#656565]">
                      Primary Contact Phone Number <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="primary_contact_phone"
                        name="primary_contact_phone"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        required
                      />
                      {errors.primary_contact_phone && <p className="mt-1 text-xs text-red-600">{errors.primary_contact_phone}</p>}
                    </div>
                  </div>

                  {/* Administrator Contact Full Name */}
                  <div className="max-w-sm">
                    <label htmlFor="admin_contact_fullname" className="block text-xs/4 font-normal text-[#656565]">
                      Administrator Contact Full Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="admin_contact_fullname"
                        name="admin_contact_fullname"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.admin_contact_fullname && <p className="mt-1 text-xs text-red-600">{errors.admin_contact_fullname}</p>}
                    </div>
                  </div>

                  {/* Administrator Contact Email */}
                  <div className="max-w-sm">
                    <label htmlFor="admin_contact_email" className="block text-xs/4 font-normal text-[#656565]">
                      Administrator Contact Email
                    </label>
                    <div className="mt-2">
                      <input
                        id="admin_contact_email"
                        name="admin_contact_email"
                        type="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.admin_contact_email && <p className="mt-1 text-xs text-red-600">{errors.admin_contact_email}</p>}
                    </div>
                  </div>

                  {/* Administrator Contact Phone Number */}
                  <div className="max-w-sm">
                    <label htmlFor="admin_contact_phone" className="block text-xs/4 font-normal text-[#656565]">
                      Administrator Contact Phone Number
                    </label>
                    <div className="mt-2">
                      <input
                        id="admin_contact_phone"
                        name="admin_contact_phone"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.admin_contact_phone && <p className="mt-1 text-xs text-red-600">{errors.admin_contact_phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-900/10 pb-[30px] mt">
                <h2 className="text-base/7 font-semibold text-gray-900">Correspondence Details</h2>
                {/* Updated grid: 1 column on small screens, 2 on medium, 3 on large */}
                <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[25px] gap-y-[26px]">
                  <div className="max-w-sm">
                    <label htmlFor="address_line1" className="block text-xs/4 font-normal text-[#656565]">
                      Address Line 1
                    </label>
                    <div className="mt-2">
                      <input
                        id="address_line1"
                        name="address_line1"
                        type="text"
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
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.landmark && <p className="mt-1 text-xs text-red-600">{errors.landmark}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="street" className="block text-xs/4 font-normal text-[#656565]">
                      Street Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="street"
                        name="street"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street}</p>}
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
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
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
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
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
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="country_code" className="block text-xs/4 font-normal text-[#656565]">
                      Country Calling Code
                    </label>
                    <div className="mt-2">
                      <input
                        id="country_code"
                        name="country_code"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.country_code && <p className="mt-1 text-xs text-red-600">{errors.country_code}</p>}
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label htmlFor="phone" className="block text-xs/4 font-normal text-[#656565]">
                      Phone
                    </label>
                    <div className="mt-2">
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
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
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
                <button type="button" onClick={() => router.back()} className="font-normal py-2 px-5  border border-[#5465FF]  rounded-[5px] whitespace-nowrap">
                  Close
                </button>
                <button
                  type="submit"
                  name="submit"
                  className="rounded-[5px] bg-indigo-500  px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Save & Generate Username Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
