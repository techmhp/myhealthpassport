import React, { useState, useEffect } from 'react';
import { storeEyeScreening, updateEyeScreening, getEyeScreeningReport, getMedicalReportStatus } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useRouter, useParams } from 'next/navigation';
import InlineSpinner from '../UI/InlineSpinner';

export default function OphthalmologistReport() {
  const router = useRouter();
  const { studentId } = useParams();
  const [userId, setUserId] = useState(null);
  const [patientConcern, setPatientConcern] = useState('');
  const [arReading, setArReading] = useState({
    leftEye: { sph: '', cyl: '', axis: '' },
    rightEye: { sph: '', cyl: '', axis: '' },
  });
  const [recommendations, setRecommendations] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [status, setStatus] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [existingReport, setExistingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicalOfficerVisionScreeningReport, setMedicalOfficerVisionScreeningReport] = useState({});

  // Check if we're in update mode
  const isUpdateMode = existingReport !== null;

  useEffect(() => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserId(userJson.user_id);
    }

    const fetchEyeScreeningReport = async () => {
      try {
        setLoading(true);
        const response = await getEyeScreeningReport(studentId);
        const responseData = await JSON.parse(response);
        if (responseData.status && responseData.data && responseData.data.eye_screening) {
          const eyeScreeningData = responseData.data.eye_screening;
          // Store the complete existing report for update operations
          setExistingReport(eyeScreeningData);
          // Populate form fields with existing data
          populateFormWithData(eyeScreeningData);
        }
      } catch (err) {
        // console.error('error in getEyeScreeningReport:', err);
        toastMessage(err.message || 'An error occurred while fetching data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEyeScreeningReport();
    getMedicalReportStatus(studentId)
      .then(res => {
        const response = JSON.parse(res);
        const vision_screening_report = response.data.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'vision_screening_status');
        setMedicalOfficerVisionScreeningReport(vision_screening_report);
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId]);

  const populateFormWithData = data => {
    // console.log('populating form with data:', data);
    // Populate patient concern
    if (data.patient_concern && data.patient_concern.length > 0) {
      setPatientConcern(data.patient_concern[0] || '');
    }

    // Populate AR Reading data
    setArReading({
      leftEye: {
        sph: data.vision_lefteye_res?.sph || '',
        cyl: data.vision_lefteye_res?.cyl || '',
        axis: data.vision_lefteye_res?.axis || '',
      },
      rightEye: {
        sph: data.vision_righteye_res?.sph || '',
        cyl: data.vision_righteye_res?.cyl || '',
        axis: data.vision_righteye_res?.axis || '',
      },
    });

    // Populate recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      const formattedRecommendations = data.recommendations.map((rec, index) => ({
        id: Date.now() + index,
        text: rec,
        remarks: '',
      }));
      setRecommendations(formattedRecommendations);
    }

    // Populate report summary
    setReportSummary(data.report_summary || '');

    // Populate status - pre-select the status dropdown
    setStatus(data.status || '');
  };

  const buildRequestPayload = () => {
    const patientConcernArray = patientConcern.trim() ? [patientConcern.trim()] : [];
    const recommendationsArray = recommendations.map(rec => rec.text);

    return {
      student_id: studentId,
      screening_user_id: userId?.toString(),
      patient_concern: patientConcernArray,
      vision_lefteye_res: {
        sph: arReading.leftEye.sph || '',
        cyl: arReading.leftEye.cyl || '',
        axis: arReading.leftEye.axis || '',
      },
      vision_righteye_res: {
        sph: arReading.rightEye.sph || '',
        cyl: arReading.rightEye.cyl || '',
        axis: arReading.rightEye.axis || '',
      },
      additional_find: '',
      report_summary: reportSummary || '',
      recommendations: recommendationsArray,
      next_followup: '',
      // Include status in the payload
      status: status,
    };
  };

  const handleArReadingChange = (eye, field, value) => {
    setArReading(prev => ({
      ...prev,
      [eye]: {
        ...prev[eye],
        [field]: value,
      },
    }));
  };

  const addRecommendation = () => {
    if (newRemark.trim()) {
      setRecommendations(prev => [
        ...prev,
        {
          id: Date.now(),
          text: newRemark,
          remarks: '',
        },
      ]);
      setNewRemark('');
    }
  };

  const removeRecommendation = id => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  const updateRecommendationRemark = (id, remark) => {
    setRecommendations(prev => prev.map(rec => (rec.id === id ? { ...rec, remarks: remark } : rec)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const requestBody = buildRequestPayload();

      let response;

      if (isUpdateMode) {
        const updatePayload = {
          ...requestBody,
        };
        response = await updateEyeScreening(existingReport.es_id, JSON.stringify(updatePayload));
      } else {
        response = await storeEyeScreening(JSON.stringify(requestBody));
      }

      if (response.status === true) {
        const successMessage = isUpdateMode ? 'Eye screening updated successfully!' : 'Eye screening saved successfully!';
        toastMessage(response.message || successMessage, 'success');
        router.back();
      } else {
        const errorMessage = isUpdateMode ? 'Failed to update eye screening.' : 'Failed to save eye screening.';
        toastMessage(response.message || errorMessage, 'error');
      }
    } catch (err) {
      // console.error(`${isUpdateMode ? 'Update' : 'Save'} error:`, err);
      const errorMessage = isUpdateMode ? 'An error occurred while updating data.' : 'An error occurred while saving data.';
      toastMessage(err.message || errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return <InlineSpinner />;
  }

  return (
    <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex flex-col gap-10">
      {medicalOfficerVisionScreeningReport?.remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className="flex gap-5">
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className="text-red-500 text-sm font-normal">{medicalOfficerVisionScreeningReport.remarks}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-10">
        {/* Patient Concern */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Patient Concern</h1>
            <div className="flex-1 flex flex-col gap-5">
              <p className="font-medium text-sm leading-6 mb-0">Add Notes</p>
              <textarea
                placeholder="Start Typing..."
                value={patientConcern}
                onChange={e => setPatientConcern(e.target.value)}
                className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                rows="6"
              ></textarea>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* AR Reading */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">AR Reading</h1>
            <div className="flex-1">
              <table className="w-full border border-[#B5CCFF] rounded-[4px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="h-10 border bg-[#ECF2FF] border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-left"></th>
                    <th className="h-10 border bg-[#ECF2FF] border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%]">
                      <div>SPH</div>
                      <div>Spherical</div>
                    </th>
                    <th className="h-10 border bg-[#ECF2FF] border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%]">
                      <div>CYL</div>
                      <div>Cyclical</div>
                    </th>
                    <th className="h-10 border bg-[#ECF2FF] border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%]">Axis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%]">Left Eye (OD)</td>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-center">
                      <input
                        type="text"
                        value={arReading.leftEye.sph}
                        onChange={e => handleArReadingChange('leftEye', 'sph', e.target.value)}
                        className="h-full w-full text-center border-none outline-none bg-transparent font-medium text-[12px] leading-[130%] tracking-[0%]"
                        placeholder="-0.50"
                      />
                    </td>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-center">
                      <input
                        type="text"
                        value={arReading.leftEye.cyl}
                        onChange={e => handleArReadingChange('leftEye', 'cyl', e.target.value)}
                        className="h-full w-full text-center border-none outline-none bg-transparent font-medium text-[12px] leading-[130%] tracking-[0%]"
                        placeholder="-0.75"
                      />
                    </td>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-center">
                      <input
                        type="text"
                        value={arReading.leftEye.axis}
                        onChange={e => handleArReadingChange('leftEye', 'axis', e.target.value)}
                        className="h-full w-full text-center border-none outline-none bg-transparent font-medium text-[12px] leading-[130%] tracking-[0%]"
                        placeholder="180°"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%]">Right Eye (OS)</td>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-center">
                      <input
                        type="text"
                        value={arReading.rightEye.sph}
                        onChange={e => handleArReadingChange('rightEye', 'sph', e.target.value)}
                        className="h-full w-full text-center border-none outline-none bg-transparent font-medium text-[12px] leading-[130%] tracking-[0%]"
                        placeholder="-0.25"
                      />
                    </td>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-center">
                      <input
                        type="text"
                        value={arReading.rightEye.cyl}
                        onChange={e => handleArReadingChange('rightEye', 'cyl', e.target.value)}
                        className="h-full w-full text-center border-none outline-none  font-medium text-[12px] leading-[130%] tracking-[0%]"
                        placeholder="0.50"
                      />
                    </td>
                    <td className="h-25 border border-[#B5CCFF] py-[10px] px-[12px] font-medium text-[12px] leading-[130%] tracking-[0%] text-center">
                      <input
                        type="text"
                        value={arReading.rightEye.axis}
                        onChange={e => handleArReadingChange('rightEye', 'axis', e.target.value)}
                        className="h-full w-full text-center border-none outline-none bg-transparent font-medium text-[12px] leading-[130%] tracking-[0%]"
                        placeholder="175°"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Recommendations */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="w-[35%]">
              <span className="bg-green-400 px-3 py-1 font-semibold text-[14px] leading-[100%] tracking-[0%] text-white rounded">Recommendations</span>
            </div>
            <div className="flex-1 flex flex-col gap-7">
              {recommendations.map(recommendation => (
                <div key={recommendation.id} className="flex flex-col gap-4">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 mr-2">
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="mb-0 font-normal text-sm leading-6">{recommendation.text}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button onClick={() => removeRecommendation(recommendation.id)} className="hover:opacity-70">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </button>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add new recommendation */}
              <div className="w-full flex gap-4 items-center justify-between">
                <input
                  type="text"
                  placeholder="Remarks"
                  value={newRemark}
                  onChange={e => setNewRemark(e.target.value)}
                  className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                />
                <button onClick={addRecommendation} className="w-[22px] h-[22px] hover:opacity-70">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Report Summary */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Report Summary</h1>
            <div className="flex-1">
              <div className="w-full flex flex-col gap-5">
                {/* Select Status */}
                <div className="w-full">
                  <label className="font-medium text-sm leading-6 mb-0">Select Status</label>
                  <select
                    className="block w-full rounded-[8px] px-4 py-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="">Choose an option</option>
                    <option value="all_good">All Good</option>
                    <option value="need_attention">Need Attention</option>
                  </select>
                </div>
                <textarea
                  placeholder="Start Typing..."
                  value={reportSummary}
                  onChange={e => setReportSummary(e.target.value)}
                  className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                  rows="6"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-[50px] flex justify-center items-center gap-5">
        <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap" onClick={() => router.back()}>
          Close
        </button>
        <button
          type="button"
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isUpdateMode ? 'Updating...' : 'Saving...'}
            </div>
          ) : isUpdateMode ? (
            'Update Changes'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}
