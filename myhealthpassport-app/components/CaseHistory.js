'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getCaseHistory } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import InlineSpinner from './UI/InlineSpinner';
//experts
import EyePrescription from './Prescription/EyeSpecialist';
import Dentist from './Prescription/Dentist';
import Nutritionist from './Prescription/Nutritionist';
import Counsellor from './Prescription/Counsellor';
import Pediatrician from './Prescription/Pediatrician';

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative border-1  border-solid border-[#DCDCDC]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="sticky top-4 right-4 float-right z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="">{children}</div>
      </div>
    </div>
  );
};

const CaseHistory = () => {
  const { id } = useParams();
  const [caseHistory, setCaseHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchCaseHistory = async () => {
    try {
      const response = await getCaseHistory(id);
      const result = JSON.parse(response);
      if (result.status) {
        const data = result?.data?.case_history || [];
        setCaseHistory(data);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      toastMessage(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseHistory();
  }, []);

  const handleCaseClick = role => {
    setSelectedReport(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const renderReportComponent = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case 'EYE_SPECIALIST':
        return <EyePrescription />;
      case 'PEDIATRICIAN':
        return <Pediatrician />;
      case 'DENTIST':
        return <Dentist />;
      case 'PSYCHOLOGIST':
        return <Counsellor />;
      case 'NUTRITIONIST':
        return <Nutritionist />;
      default:
        return <div className="text-center py-10">Unsupported specialist role: {selectedReport.role}</div>;
    }
  };

  if (loading) {
    return <InlineSpinner />;
  }

  return (
    <>
      {caseHistory.length === 0 ? (
        <p className="text-center mt-10 text-gray-600">No case history found.</p>
      ) : (
        <ul className="list-none">
          {caseHistory.map(item => (
            <li key={item.report_id} className="flex border p-2 m-2 rounded-md border-[#BDD2FF]" onClick={() => handleCaseClick(item.role)}>
              <Image src="/iconx/document.svg" width={16} height={16} alt="document" className="size-6 mr-4" />
              <span className="w-full text-sm leading-[2] font-medium">
                {item.date} - {item.student_name} - {item.aadhaar_number ? item.aadhaar_number : 'N/A'}
              </span>
            </li>
          ))}
          {isModalOpen && (
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
              {renderReportComponent()}
            </Modal>
          )}
        </ul>
      )}
    </>
  );
};

export default CaseHistory;
