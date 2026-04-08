import React, { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { PlusCircleIcon } from '@heroicons/react/16/solid';
import { updateExpert } from '@/services/secureApis';
import { isValidUrl, toastMessage } from '@/helpers/utilities';
import { useRouter, useParams } from 'next/navigation';
import BreadcrumbsProfile from '../BreadcrumbsProfile';
import Image from 'next/image';

export default function UpdateExpertForm({ data }) {
  // Form state
  const { id } = useParams();
  const [formData, setFormData] = useState(data);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Dynamic availability
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const timeSlots = [
    { label: '8AM - 12PM', start: '08:00', end: '12:00' },
    { label: '12PM - 4PM', start: '12:00', end: '16:00' },
    { label: '4PM - 8PM', start: '16:00', end: '20:00' },
  ];
  const [availability, setAvailability] = useState(data?.available_time_slots || []);

  const handleSlotChange = (day, slot) => {
    setAvailability(prev => {
      const existingDay = prev.find(d => d.day === day);

      if (existingDay) {
        const hasSlot = existingDay.slots.some(s => s.start === slot.start && s.end === slot.end);

        let updatedSlots;
        if (hasSlot) {
          updatedSlots = existingDay.slots.filter(s => !(s.start === slot.start && s.end === slot.end));
        } else {
          updatedSlots = [...existingDay.slots, slot];
        }

        if (updatedSlots.length === 0) {
          return prev.filter(d => d.day !== day);
        }

        return prev.map(d => (d.day === day ? { ...d, slots: updatedSlots } : d));
      } else {
        return [...prev, { day, slots: [slot] }];
      }
    });
  };

  // Form fields configuration based on ExpertUserCreateSchema
  const formFields = [
    {
      section: 'Basic Details',
      fields: [
        { id: 'first_name', name: 'first_name', label: 'First Name', type: 'text', required: true },
        { id: 'middle_name', name: 'middle_name', label: 'Middle Name', type: 'text', required: false },
        { id: 'last_name', name: 'last_name', label: 'Last Name', type: 'text', required: true },
        {
          id: 'gender',
          name: 'gender',
          label: 'Gender',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select Gender' },
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Others', label: 'Others' },
          ],
        },
        { id: 'dob', name: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { id: 'profile_image', name: 'profile_image', label: 'Upload Portrait', type: 'file', required: true, accept: 'image/jpeg,image/png' },
      ],
    },
    {
      section: 'Identity Details',
      fields: [
        { id: 'phone', name: 'phone', label: 'Phone/Mobile', type: 'text', required: true },
        { id: 'email', name: 'email', label: 'Email', type: 'email', required: false },
      ],
    },
    {
      section: 'Clinic Details',
      fields: [
        { id: 'clinic_name', name: 'clinic_name', label: 'Clinic Name', type: 'text', required: false },
        { id: 'location', name: 'location', label: 'Location', type: 'text', required: false },
        { id: 'address_line_1', name: 'address_line_1', label: 'Address Line 1', type: 'text', required: true },
        { id: 'address_line_2', name: 'address_line_2', label: 'Address Line 2', type: 'text', required: false },
        { id: 'state', name: 'state', label: 'State', type: 'text', required: true },
        { id: 'landmark', name: 'landmark', label: 'Landmark', type: 'text', required: false },
        { id: 'location_link', name: 'location_link', label: 'Location Link', type: 'text', required: false },
        { id: 'street_name', name: 'street_name', label: 'Street Name', type: 'text', required: false },
        { id: 'pincode', name: 'pincode', label: 'Pincode', type: 'text', required: true },
        { id: 'country_calling_code', name: 'country_calling_code', label: 'Country Calling Code', type: 'text', required: true },
        { id: 'country', name: 'country', label: 'Country', type: 'text', required: true },
      ],
    },
    {
      section: 'Department Details',
      fields: [
        {
          id: 'specialty',
          name: 'specialty',
          label: 'Select Specialisation',
          type: 'select',
          required: true,
          placeholder: 'E.g. EYE_SPECIALIST',
          options: [
            { value: '', label: 'Select Specialisation' },
            { value: 'PEDIATRICIAN', label: 'Pediatrician' },
            { value: 'DENTIST', label: 'Dentist' },
            { value: 'EYE_SPECIALIST', label: 'Eye Specialist' },
            { value: 'NUTRITIONIST', label: 'Nutritionist' },
            { value: 'PSYCHOLOGIST', label: 'Psychologist' },
          ],
        },
        { id: 'education', name: 'education', label: 'Designation', type: 'text', required: true }, // Mapped designation to education
        { id: 'experience', name: 'experience', label: 'Years of Experience', type: 'text', required: true },
        { id: 'consultation_duration', name: 'consultation_duration', label: 'Consultation Duration (mins)', type: 'number', required: true },
        { id: 'max_consultations_per_day', name: 'max_consultations_per_day', label: 'Max Consultations Per Day', type: 'number', required: false },
        { id: 'consultation_charges', name: 'consultation_charges', label: 'Consultation Charges / Commission', type: 'number', step: '0.01', required: true },
        { id: 'license_number', name: 'license_number', label: 'License / Registration Number', type: 'text', required: true },
        { id: 'languages_spoken', name: 'languages_spoken', label: 'Languages Spoken', type: 'text', required: true, placeholder: 'E.g. English, Hindi' },
      ],
    },
  ];

  // Validation function
  const validateField = (name, value) => {
    if (name === 'profile_image' && !value) return 'File is required';
    // if (name === 'profile_image' && value) {
    //   const validTypes = ['image/jpeg', 'image/png'];
    //   if (!validTypes.includes(value.type)) return 'Only JPEG or PNG files are allowed';
    //   if (value.size > 2 * 1024 * 1024) return 'File size must be less than 2MB';
    // }
    if (
      [
        'first_name',
        'last_name',
        'user_role',
        'education',
        'gender',
        'address_line_1',
        'state',
        'pincode',
        'experience',
        'specialty',
        'country_calling_code',
        'country',
        'consultation_duration',
        'consultation_charges',
        'brief_bio',
        'license_number',
        'languages_spoken',
        'phone',
      ].includes(name) &&
      !value
    ) {
      return `${name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')} is required`;
    }
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    if (name === 'phone' && value && !/^\d{10}$/.test(value)) {
      return 'Phone number must be 10 digits';
    }
    if (name === 'country_calling_code' && value && !/^\+\d{1,3}$/.test(value)) {
      return 'Invalid country code (e.g., +1)';
    }
    if (name === 'pincode' && value && !/^\d{5,6}$/.test(value)) {
      return 'Pincode must be 5 or 6 digits';
    }
    if (name === 'dob' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'Invalid date format (YYYY-MM-DD)';
    }
    if (name === 'consultation_duration' && value && (value < 1 || value > 120)) {
      return 'Consultation duration must be between 1 and 120 minutes';
    }
    if (name === 'consultation_charges' && value && value < 0) {
      return 'Consultation charges cannot be negative';
    }
    return '';
  };

  // Handle input changes
  const handleChange = e => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Handle file change
  const handleFileChange = async e => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setErrors(prev => ({ ...prev, profile_image: 'File is required' }));
      setFormData(prev => ({ ...prev, profile_image: null }));
      return;
    }
    const sizeInKB = (selectedFile.size / 1024).toFixed(2);
    if (sizeInKB > 500) {
      toastMessage('The upload file size must be less than or equal to 500KB.', 'error');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      setFormData(prev => ({ ...prev, profile_image: base64String }));
      setErrors(prev => ({ ...prev, profile_image: validateField('profile_image', selectedFile) }));
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle blur for validation
  const handleBlur = e => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    // console.log('newErrors', newErrors);
    setErrors(newErrors);

    // If no errors, make API call
    if (Object.keys(newErrors).length === 0) {
      try {
        // Prepare API payload
        const payload = {
          ...formData,
          user_role: formData.specialty,
          languages_spoken:
            typeof formData.languages_spoken !== 'object' ? formData.languages_spoken.split(',').map(lang => lang.trim()) : formData.languages_spoken,
          consultation_duration: parseInt(formData.consultation_duration, 10),
          consultation_charges: parseFloat(formData.consultation_charges),
          max_consultations_per_day: formData.max_consultations_per_day ? parseInt(formData.max_consultations_per_day, 10) : null,
          available_time_slots: availability.map(dayObj => ({
            ...dayObj,
            slots: [...dayObj.slots].sort(
              (a, b) => Number(a.start.split(':')[0]) - Number(b.start.split(':')[0]) || Number(a.start.split(':')[1]) - Number(b.start.split(':')[1])
            ),
          })),
        };

        const response = await updateExpert(id, JSON.stringify(payload));
        if (response.status === true) {
          toastMessage(response.message || 'Expert created successfully', 'success');
          router.back();
        } else if (response.status === false) {
          toastMessage(response?.message || 'Failed to create expert', 'error');
        }
      } catch (error) {
        // console.error('Error creating expert:', error);
        toastMessage(error.message || 'Failed to create expert. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Render input field
  const renderInput = field => {
    const commonProps = {
      id: field.id,
      name: field.name,
      value: field.type === 'file' ? undefined : formData[field.name] || '',
      onChange: field.type === 'file' ? handleFileChange : handleChange,
      onBlur: handleBlur,
      className:
        'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
      placeholder: field.placeholder || `Enter ${field.label}`,
    };

    if (field.type === 'select') {
      return (
        <div className="relative">
          <select {...commonProps} className={`${commonProps.className} appearance-none pr-10`}>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      );
    }

    if (field.type === 'date') {
      return (
        <div className="relative">
          <input {...commonProps} type="date" />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      );
    }

    if (field.type === 'file') {
      return (
        <div className="mt-2">
          <input id={field.id} name={field.name} type="file" className="hidden" onChange={handleFileChange} accept={field.accept} />
          <label htmlFor={field.id}>
            <a type="button" className="rounded-full bg-blue-100 p-2 text-blue-500">
              <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
            </a>
            {file ? file.name : ''}
          </label>
          {/* {errors[field.name] && <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>} */}
        </div>
      );
    }
    return <input {...commonProps} type={field.type} step={field.step} />;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <form onSubmit={handleSubmit} method="POST" encType="multipart/form-data">
        <div className="px-0 sm:px-1  mb-5 flex justify-between items-center gap-6">
          <div className="flex flex-col w-full space-y-4 sm:space-y-6">
            <ul role="list" className="w-full space-y-4">
              {Object.keys(data).length > 0 ? (
                <li className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-4 md:gap-x-6 w-full">
                    {/* Profile Image */}
                    <Image
                      alt="profile"
                      src={file !== null ? URL.createObjectURL(file) : isValidUrl(data.profile_image_url) ? data.profile_image_url : '/iconx/profile-image.svg'}
                      className="size-16 sm:size-20 md:size-24 rounded-full mx-auto sm:mx-0"
                      width={102}
                      height={102}
                      unoptimized={file !== null || isValidUrl(data.profile_image_url)}
                    />
                    {/* Name and breadcrumbs */}
                    <div className="flex flex-col gap-y-1.5 text-center sm:text-left w-full">
                      <span className="text-sm sm:text-base font-semibold tracking-tight text-gray-900">{`${data?.first_name} ${data?.middle_name} ${data?.last_name}`}</span>
                      <BreadcrumbsProfile profile={data} />
                    </div>
                  </div>
                </li>
              ) : (
                ''
              )}
            </ul>
          </div>
        </div>
        <div className="space-y-12">
          {formFields.map(section => (
            <div key={section.section} className="border-b border-gray-200 pb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{section.section}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {section.fields.map(field => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-600 mb-2">
                      {field.label} {field.required && <span className="text-red-600">*</span>}
                    </label>
                    {renderInput(field)}
                    {errors[field.name] && <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Expert Experience Summary</h2>
            <div className="relative gap-6">
              <label htmlFor="brief_bio" className="block text-sm font-medium text-gray-600 mb-2">
                Experience Summary<span className="text-red-600">*</span>
              </label>
              <textarea
                rows={6}
                value={formData.brief_bio}
                onChange={handleChange}
                onBlur={handleBlur}
                name="brief_bio"
                id="brief_bio"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Experience Summary"
              ></textarea>
            </div>
          </div>
        </div>
        {/* Availability Section */}
        <div className="w-full flex justify-between border-b border-gray-900/10 pb-[30px] mt-12">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Availability</h1>
          <div className="flex gap-6">
            <div className="flex flex-col gap-2.5">
              {days.map(day => (
                <div key={day} className="flex items-center gap-2.5">
                  <div className="w-32 font-medium font-normal text-[14px] leading-[24px]">{day}</div>
                  <div className="flex gap-6">
                    {timeSlots.map(slot => (
                      <label key={slot.label} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600"
                          checked={availability.find(d => d.day === day)?.slots.some(s => s.start === slot.start && s.end === slot.end) || false}
                          onChange={() => handleSlotChange(day, slot)}
                        />
                        {slot.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Error */}
        {errors.form && <p className="mt-4 text-sm text-red-600">{errors.form}</p>}
        {/* Buttons */}
        <div className="flex justify-center items-center gap-4 pt-8">
          <button
            type="button"
            className="px-6 py-2 border border-blue-500 text-blue-500 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => router.back()}
          >
            Close
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
