'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ExpertHeader from '@/components/ExpertHeader';
import Header from '@/components/Header';
import { useRouter, useParams } from 'next/navigation';
import { getExpertDetails, studentDetails } from '@/services/secureApis';
import { toastMessage, formatFullName } from '@/helpers/utilities';
import InlineSpinner from '@/components/UI/InlineSpinner';
import ConsultationBooking from '@/components/ConsultationBooking';

const BookAConsultation = () => {
  const router = useRouter();
  const { studentId, expertId } = useParams();
  const [loading, setLoading] = useState(true);
  const [expertDetails, setExpertDetails] = useState({});
  const [children, setChildren] = useState([]);

  const fetchExpertData = async () => {
    try {
      const response = await getExpertDetails(expertId);
      const result = await JSON.parse(response);
      if (result.status === true) {
        setExpertDetails(result.data);
      } else if (result.status === false) {
        toastMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildrenData = async () => {
    setLoading(true);
    try {
      const response = await studentDetails(studentId);
      const result = await JSON.parse(response);
      if (result.status === true) {
        const { id, ...rest } = result.data.student_details;
        const updatedStudent = { student_id: id, ...rest };
        setChildren([updatedStudent]);
      } else if (result.status === false) {
        toastMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpertData();
    fetchChildrenData();
  }, []);

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <InlineSpinner />
      </div>
    );

  return (
    <main>
      <Header />
      <div className="p-3 sm:p-4 md:p-[28px] md:px-8 lg:px-12 xl:px-18">
        <div className="p-2 grid gap-4 md:gap-6 lg:gap-8 xl:gap-13">
          <Breadcrumbs
            items={[
              { name: 'Expert Consultation', href: '/parent/book/expert-consultation' },
              { name: expertDetails ? formatFullName(expertDetails) : '', href: '#', current: true },
            ]}
            homeLabel="Book"
            homeHref="/parent/book/expert-consultation"
          />
          <div className="px-0 sm:px-1">
            <ExpertHeader expertDetails={expertDetails} />
          </div>
          <ConsultationBooking children={children} expertDetails={expertDetails} />
        </div>
      </div>
    </main>
  );
};

export default BookAConsultation;
