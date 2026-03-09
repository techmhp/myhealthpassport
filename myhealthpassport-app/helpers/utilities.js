import moment from 'moment';
import Image from 'next/image';
import { toast } from 'react-toastify';

const date_format = 'YYYY-MM-DD';

export const formatString = str => {
  return str
    ?.replace(/_/g, ' ') // Remove underscores
    ?.split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' '); // Join back into a sentence
};

export const isNumber = n => {
  return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
};

// Function to format student name
export const formatFullName = user => {
  const firstName = user.first_name || '';
  const middleName = user.middle_name || '';
  const lastName = user.last_name || '';

  let fullName = firstName;
  if (middleName && middleName !== '-') {
    fullName += ` ${middleName}`;
  }
  if (lastName) {
    fullName += ` ${lastName}`;
  }

  return fullName.trim();
};

export function ChangeDateFormat(value, format) {
  if (value === '' || typeof value === 'undefined') {
    return null;
  }
  const date = value;
  const dateFormat = typeof format !== 'undefined' ? format : date_format;
  const formatedDate = moment(date, 'DD-MM-YYYY', true);
  if (formatedDate.isValid() === true) {
    return moment(new Date(date)).format(dateFormat);
  } else {
    return null;
  }
}

export const timeIn12HourFormat = time => {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(hours, minutes);
  const formattedTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return formattedTime;
};

export const getAge = birthDate => {
  const parts = birthDate.split('-');
  const formatedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
  const diff = Date.now() - new Date(formatedDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export const toastMessage = (message, type) => {
  if (type === 'error') {
    toast.error(message, {
      position: 'top-right',
      autoClose: true,
      pauseOnHover: true,
      newestOnTop: true,
      theme: 'colored',
    });
  } else if (type === 'success') {
    toast.success(message, {
      position: 'top-right',
      autoClose: true,
      pauseOnHover: true,
      newestOnTop: true,
      theme: 'colored',
    });
  } else if (type === 'warn') {
    toast.warn(message, {
      position: 'top-right',
      autoClose: true,
      pauseOnHover: true,
      newestOnTop: true,
      theme: 'colored',
    });
  }
};

export function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

// Function to render status icon
export const renderStatusIcon = status => {
  if (status === true || status === 'verified') {
    return <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />;
  } else if (status === false || status === 'not_verified') {
    return <Image alt="Warning" src="/iconx/minus-circle.svg" width={20} height={20} />;
  } else if (status === 'remarks') {
    return <Image alt="Remarks" src="/health-records/alert.svg" width={16} height={16} />;
  } else {
    return <Image alt="Warning" src="/iconx/minus-circle.svg" width={20} height={20} />;
  }
};

// Function to render status icon of medical officer
export const renderMedicalOfficerStatus = student => {
  const statuses = {
    physical_screening_status: student.physical_screening_status,
    nutritional_report_status: student.nutritional_report_status,
    lab_report_status: student.lab_report_status,
  };

  // Get unique + sorted values
  const sortedUniqueValues = [...new Set(Object.values(statuses))].sort();
  if (sortedUniqueValues.length === 1 && sortedUniqueValues[0] === 'verified') {
    return <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />;
  } else if (sortedUniqueValues.length === 1 && sortedUniqueValues[0] === 'remarks') {
    return <Image alt="Remarks" src="/health-records/alert.svg" width={16} height={16} />;
  } else if (sortedUniqueValues.length === 2 && sortedUniqueValues[0] === 'remarks' && sortedUniqueValues[1] === 'verified') {
    return <Image alt="Remarks" src="/health-records/alert.svg" width={16} height={16} />;
  } else {
    return <Image alt="Warning" src="/iconx/minus-circle.svg" width={20} height={20} />;
  }
};

export const stringToArray = text => {
  if (typeof text === 'string') {
    const lines = text
      .split('.')
      .map(line => line.trim())
      .filter(Boolean);
    return lines;
  } else {
    return text;
  }
};
