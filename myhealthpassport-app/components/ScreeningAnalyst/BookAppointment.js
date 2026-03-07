import { useEffect, useState } from 'react';
import Image from 'next/image';

import NoAppointmentsView from './NoAppointmentsView';
import AppointmentDetails from './AppointmentDetails';
import { getAppointmentsByStudentId } from '@/services/secureApis';
import InlineSpinner from '../UI/InlineSpinner';

const ViewAppointments = ({ studentId, roleType, toggleAccordion }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointmentsByStudentId = async () => {
    try {
      const response = await getAppointmentsByStudentId(parseInt(studentId.studentId));
      const result = await JSON.parse(response);
      if (result.status === true) {
        const appointmentData = result?.data?.appointments.filter(appointment => appointment.doctor_user_role === roleType);
        setAppointments(appointmentData);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Something Went Wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsByStudentId();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-4">
        <InlineSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center mt-4">{error}</div>;
  }

  return (
    <div>
      {appointments.length === 0 ? (
        <NoAppointmentsView roleType={roleType} toggleAccordion={toggleAccordion} />
      ) : (
        <AppointmentDetails appointments={appointments} />
      )}
    </div>
  );
};

const BookAppointment = (studentId, academicYear = null) => {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = index => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  // Define the accordion items with associated components
  const accordionItems = [
    {
      icon: '/detailed-reports-icons/physical-screening.svg',
      title: 'Pediatrician',
      // component: <NoAppointmentsView roleType="Pediatrician" />,
      component: <ViewAppointments studentId={studentId} roleType="PEDIATRICIAN" toggleAccordion={toggleAccordion} />,
    },
    {
      icon: '/detailed-reports-icons/vision.svg',
      title: 'Ophthalmologist',
      // component: <AppointmentDetails studentId={studentId} roleType="Ophthalmologist" />,
      component: <ViewAppointments studentId={studentId} roleType="EYE_SPECIALIST" toggleAccordion={toggleAccordion} />,
    },
    {
      icon: '/detailed-reports-icons/teeth.svg',
      title: 'Dentist',
      component: <ViewAppointments studentId={studentId} roleType="DENTIST" toggleAccordion={toggleAccordion} />,
    },
    {
      icon: '/detailed-reports-icons/apple.svg',
      title: 'Nutritionist',
      component: <ViewAppointments studentId={studentId} roleType="NUTRITIONIST" toggleAccordion={toggleAccordion} />,
    },
    {
      icon: '/detailed-reports-icons/imoji-face.svg',
      title: 'Therapist/Psychologist',
      component: <ViewAppointments studentId={studentId} roleType="PSYCHOLOGIST" toggleAccordion={toggleAccordion} />,
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      {accordionItems.map((item, index) => (
        <div key={index} className="w-full">
          {/* Accordion Header */}
          <div
            className="w-full h-11 flex justify-between items-center rounded-lg px-6 py-2.5 bg-[#ECF2FF] cursor-pointer"
            onClick={() => toggleAccordion(index)}
          >
            <div className="flex items-center gap-4">
              <Image src={item.icon} alt="phy" width={20} height={20} />
              <span className="font-Inter font-medium text-sm leading-6 text-center">{item.title}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 transition-transform ${openAccordion === index ? 'transform rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {/* Accordion Content */}
          {openAccordion === index && <div className="mx-4">{item.component}</div>}
        </div>
      ))}
    </div>
  );
};

export default BookAppointment;
