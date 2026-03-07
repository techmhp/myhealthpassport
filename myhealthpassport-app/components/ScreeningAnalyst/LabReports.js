// src/components/LabReports.jsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { healthiansLabReports, thyrocareLabReports, healthiansLabReportDownload, thyrocareLabReportDownload } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';

const LabReports = ({ studentId = null }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [healthiansBookings, setHealthiansBookings] = useState([]);
  const [thyrocareOrders, setThyrocareOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const formatMonthYear = isoDate => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Fetch both vendors' reports
  useEffect(() => {
    if (!studentId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);

        // Healthians
        const hResponse = await healthiansLabReports({ student_id: studentId });
        const hRes = JSON.parse(hResponse);
        console.log('hRes raw', hRes);
        const hData = hRes?.data?.bookings || [];
        console.log('hData', hData);
        setHealthiansBookings(hData);

        // Thyrocare
        const tResponse = await thyrocareLabReports({ student_id: studentId });
        const tRes = JSON.parse(tResponse);
        console.log('tRes raw', tRes);
        const tData = tRes?.data?.orders || [];
        console.log('tData', tData);
        setThyrocareOrders(tData);
      } catch (err) {
        console.error('Error fetching lab reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [studentId]);

  // Generic helper to trigger browser download from API that returns PDF blob
  const downloadBlobPdf = (blob, filename = 'report.pdf') => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };

  // Healthians download
  const handleHealthiansDownload = async booking => {
    if (!studentId || !booking?.vendor_booking_id) return;
    try {
      setDownloadingId(`healthians-${booking.booking_id}`);

      const res = await healthiansLabReportDownload({
        student_id: studentId,
        vendor_booking_id: booking.vendor_booking_id,
      });

      console.log('res handleHealthiansDownload', res);

      if (res?.error) {
        toastMessage(res.message, 'error');
        return;
      }

      // If we reach here, it's a successful PDF response
      downloadBlobPdf(res.data, `healthians-${booking.vendor_booking_id}.pdf`);
    } catch (err) {
      console.error('Error downloading Healthians report', err);
      // Show the error message from backend
      toastMessage(err?.message || err?.detail || 'Failed to download report', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Thyrocare download
  const handleThyrocareDownload = async order => {
    if (!studentId || !order?.thyrocare_order_id) return;
    if (!order.can_download) return;
    try {
      setDownloadingId(`thyrocare-${order.order_id}`);

      const res = await thyrocareLabReportDownload({
        student_id: studentId,
        thyrocare_order_id: order.thyrocare_order_id,
      });

      console.log('res handleThyrocareDownload', res);

      // If we reach here, it's a successful PDF response
      downloadBlobPdf(res.data, `thyrocare-${order.thyrocare_order_id}.pdf`);
    } catch (err) {
      console.error('Error downloading Thyrocare report', err);
      // Show the error message from backend
      toastMessage(err?.message || err?.detail || 'Failed to download report', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
        {loading && <div className="text-sm text-center text-gray-500">Loading lab reports...</div>}

        {/* Healthians Reports */}
        {healthiansBookings.length > 0 && (
          <div className="w-full flex flex-col gap-[20px] sm:gap-[30px]">
            {healthiansBookings.map(booking => (
              <div key={`healthians-${booking.booking_id}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                  {/* Left Div */}
                  <div className="flex flex-col gap-3  mb-4 sm:mb-0">
                    <img src="/detailed-reports-icons/document2.svg" alt="icon" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px]" />
                    <span className="font-inter font-semibold text-sm leading-[100%] tracking-[0%] text-[#000000]">
                      {booking.tests?.[0]?.name || 'Blood Test Report'} - {formatMonthYear(booking.created_at)}
                    </span>
                    <span className="m-0 text-xs text-gray-500">Vendor: Healthians</span>
                  </div>

                  {/* Right Div */}
                  <div className="flex flex-col items-center gap-[11px] w-full sm:w-auto">
                    <button
                      className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] bg-[#5465FF] rounded-[5px] disabled:opacity-60"
                      disabled={!booking.can_download || downloadingId === `healthians-${booking.booking_id}`}
                      onClick={() => handleHealthiansDownload(booking)}
                    >
                      <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#FFFFFF]">
                        {downloadingId === `healthians-${booking.booking_id}` ? 'Downloading...' : booking.can_download ? 'View Report' : 'Not Available'}
                      </span>
                    </button>
                  </div>
                </div>
                <hr className="border border-solid border-[#B7B7B7] mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Thyrocare Reports */}
        {thyrocareOrders.length > 0 && (
          <div className="w-full flex flex-col gap-[20px] sm:gap-[30px]">
            {thyrocareOrders.map(order => (
              <div key={`thyrocare-${order.order_id}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                  {/* Left Div */}
                  <div className="flex flex-col gap-3 mb-4 sm:mb-0">
                    <img src="/detailed-reports-icons/document2.svg" alt="icon" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px]" />
                    <span className="font-inter font-semibold text-sm leading-[100%] tracking-[0%] text-[#000000]">
                      {order.tests?.[0]?.product_name || 'Blood Test Report'} - {formatMonthYear(order.created_at)}
                    </span>
                    {/* <span className="text-xs text-gray-500">Vendor: Thyrocare • Status: {order.status}</span> */}
                    <span className="m-0 text-xs text-gray-500">Vendor: Thyrocare </span>
                  </div>

                  {/* Right Div */}
                  <div className="flex flex-col items-center gap-[11px] w-full sm:w-auto">
                    {/* <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] border border-[#5465FF] rounded-[5px]">
                    <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#000000]" onClick={openModal}>
                      View Key Findings
                    </span>
                  </button> */}

                    <button
                      className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] bg-[#5465FF] rounded-[5px] disabled:opacity-60"
                      disabled={!order.can_download || downloadingId === `thyrocare-${order.order_id}`}
                      onClick={() => handleThyrocareDownload(order)}
                    >
                      <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#FFFFFF]">
                        {downloadingId === `thyrocare-${order.order_id}` ? 'Downloading...' : order.can_download ? 'View Report' : 'Not Available'}
                      </span>
                    </button>
                  </div>
                </div>
                <hr className="border border-solid border-[#B7B7B7] mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* If no reports */}
        {!loading && healthiansBookings.length === 0 && thyrocareOrders.length === 0 && (
          <div className="text-sm text-center text-gray-500">No lab reports found for this student.</div>
        )}
      </div>

      {/* Key Findings Modal */}
      {/* {isModalOpen && (
        <div className="fixed inset-0 bg-[#2423239e] bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-xl shadow-lg relative my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6 relative">
                <div className="flex gap-2 sm:gap-3 items-center">
                  <Image src="/detailed-reports-icons/apple.svg" alt="icon" width={20} height={20} />
                  <h2 className="text-sm sm:text-md font-semibold m-0 p-0">Key Findings</h2>
                </div>

                <div onClick={closeModal} className="cursor-pointer">
                  <Image src="/health-records/cross-red.svg" width={16} height={16} alt="cross" />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="check" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Skin:</strong> Dry, scaly skin suggests deficiencies in essential fatty acids, Vitamin A, or Zinc.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="check" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Hair:</strong> Dull, brittle hair points to deficiencies in Protein, Zinc, or essential fatty acids.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="check" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Nails:</strong> Beau&apos;s lines are linked to Protein or Zinc deficiency, while pale nail beds indicate Iron or Vitamin B12
                    deficiency.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="Warning" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Teeth:</strong> Bleeding gums are consistent with a Vitamin C deficiency.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="Warning" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>General Signs:</strong> Weakness and fatigue are commonly associated with Iron, Vitamin B12, Folate, or overall calorie deficiency.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/check.svg" width={18} height={18} alt="Warning" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Bone and Muscle:</strong> Muscle cramps suggest Magnesium deficiency or dehydration.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/warning.svg" width={18} height={18} alt="Warning" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Skin:</strong> Dry, scaly skin suggests deficiencies in essential fatty acids, Vitamin A, or Zinc.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/warning.svg" width={18} height={18} alt="Warning" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Mouth and Lips:</strong> Glossitis and tongue fissures are indicative of deficiencies in Vitamin B12, Vitamin B2, Niacin (B3), or
                    Iron.
                  </p>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <Image src="/health-records/warning.svg" width={18} height={18} alt="Warning" />
                  </div>
                  <p className="text-xs sm:text-sm">
                    <strong>Hair:</strong> Dull, brittle hair points to deficiencies in Protein, Zinc, or essential fatty acids.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default LabReports;
