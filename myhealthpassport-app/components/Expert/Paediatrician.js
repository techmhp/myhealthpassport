import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPediatricianPrescription, getMedicalReportStatus } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useRouter, useParams } from 'next/navigation';
import InlineSpinner from '../UI/InlineSpinner';

export default function PediatricianReport() {
  const router = useRouter();
  const { id } = useParams();

  // User and Report State
  const [userInfo, setUserInfo] = useState(null);
  const [medicalOfficerVisionScreeningReport, setMedicalOfficerVisionScreeningReport] = useState({});

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Data States (always start empty)
  const [patientConcerns, setPatientConcerns] = useState([]);
  const [newPatientConcern, setNewPatientConcern] = useState('');

  // Additional Findings State
  const additionalFindingOptions = [
    'History of Presenting Illness',
    'Past History',
    'Immunization History',
    'Family History',
    'Physical Examination',
    'Doctor Notes',
    'Diagnosis',
    'Investigations',
    'Treatment',
  ];

  const [additionalFindings, setAdditionalFindings] = useState([]);
  const [selectedAdditionalFinding, setSelectedAdditionalFinding] = useState('');
  const [additionalFindingRemarks, setAdditionalFindingRemarks] = useState('');

  // Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [newRecommendation, setNewRecommendation] = useState('');

  // Follow-up State
  const [nextFollowup, setNextFollowup] = useState('');

  // Effects
  useEffect(() => {
    initializeUserInfo();
    fetchMedicalReportStatus();
  }, [id]);

  // Initialize Functions
  const initializeUserInfo = () => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
    }
  };

  const fetchMedicalReportStatus = () => {
    getMedicalReportStatus(id)
      .then(res => {
        const response = JSON.parse(res);
        const visionScreeningReport = response.data.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'vision_screening_status');
        setMedicalOfficerVisionScreeningReport(visionScreeningReport || {});
      })
      .catch(err => {
        console.error('Medical Report Status Error:', err);
        toastMessage('Failed to fetch medical report status', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Patient Concern Handlers
  const handleAddPatientConcern = () => {
    const trimmed = newPatientConcern.trim();
    if (trimmed && !patientConcerns.includes(trimmed)) {
      setPatientConcerns([...patientConcerns, trimmed]);
      setNewPatientConcern('');
    }
  };

  const handleRemovePatientConcern = index => {
    setPatientConcerns(patientConcerns.filter((_, idx) => idx !== index));
  };

  // Additional Findings Handlers
  const handleAddAdditionalFinding = () => {
    if (selectedAdditionalFinding) {
      const newFinding = {
        id: Date.now(),
        note: selectedAdditionalFinding,
        remarks: additionalFindingRemarks,
      };
      setAdditionalFindings([...additionalFindings, newFinding]);
      setSelectedAdditionalFinding('');
      setAdditionalFindingRemarks('');
    }
  };

  const handleRemoveAdditionalFinding = indexToRemove => {
    setAdditionalFindings(additionalFindings.filter((_, index) => index !== indexToRemove));
  };

  // Recommendation Handlers
  const handleAddRecommendation = () => {
    if (newRecommendation.trim()) {
      setRecommendations(prev => [
        ...prev,
        {
          id: Date.now(),
          text: newRecommendation.trim(),
        },
      ]);
      setNewRecommendation('');
    }
  };

  const handleRemoveRecommendation = id => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  // Payload Building
  const buildRequestPayload = () => {
    const recommendationsArray = recommendations.map(rec => rec.text);
    const additionalFindingsArray = additionalFindings.map(finding => `${finding.note}${finding.remarks ? `: ${finding.remarks}` : ''}`);

    return {
      student_id: id,
      consultant_user_id: userInfo?.user_id?.toString(),
      patient_concern: patientConcerns,
      findings: additionalFindingsArray,
      treatment_recommendations: recommendationsArray,
      next_followup: nextFollowup || '',
    };
  };

  // Save Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const requestBody = buildRequestPayload();

      const response = await createPediatricianPrescription(JSON.stringify(requestBody));

      if (response.status === true) {
        toastMessage(response.message || 'Pediatrician prescription saved successfully!', 'success');
        router.back();
      } else {
        toastMessage(response.message || 'Failed to save pediatrician prescription.', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      toastMessage(err.message || 'An error occurred while saving data.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Render Loading State
  if (loading) {
    return <InlineSpinner />;
  }

  return (
    <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex flex-col gap-10">
      {/* Medical Officer Remarks */}
      {medicalOfficerVisionScreeningReport?.remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className="flex gap-5">
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className="text-red-500 text-sm font-normal">{medicalOfficerVisionScreeningReport.remarks}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="flex left">
              <Image src="/iconx/school.svg" alt="school logo" width={36} height={36} className="flex-col" />
              <span className="leading-[24px] p-4 flex-col font-semibold text-[14px]">{userInfo?.clinic_name || 'Pediatric Clinic'}</span>
            </div>
            <div className="flex right">
              <Image src="/iconx/profile-image.svg" alt="profile" width={36} height={36} className="size-10 sm:size-12 md:size-14 rounded-full" />
              <div className="flex-col p-2">
                <span className="leading-[10px] font-semibold text-[14px]">
                  Dr. {userInfo?.first_name && userInfo?.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : 'Doctor Name'}
                </span>

                <br />
                <span className="leading-[10px] text-[14px]">
                  {userInfo?.education || 'MBBS'} | {userInfo?.specialty || 'PEDIATRICIAN'}
                </span>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Patient Concern */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Patient Concern</h1>
            <div className="flex-1 flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Add Notes</p>

                {/* Display existing concerns */}
                {patientConcerns.map((concern, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]" />
                      <p className="mb-0 font-normal text-sm leading-6">{concern}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button type="button" onClick={() => handleRemovePatientConcern(index)} className="focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new concern */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <input
                    type="text"
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    placeholder="Remarks"
                    value={newPatientConcern}
                    onChange={e => setNewPatientConcern(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddPatientConcern();
                    }}
                  />
                  <button type="button" onClick={handleAddPatientConcern} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
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
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Additional Findings */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%] ">Additional Findings</h1>
            <div className="flex-1 flex flex-col gap-7">
              {additionalFindings.map((finding, index) => (
                <div key={index} className="w-full flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                    <p className="mb-0 font-normal text-sm leading-6">
                      <span className="font-medium text-sm leading-6">{finding.note}:</span> {finding.remarks}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button type="button" onClick={() => handleRemoveAdditionalFinding(index)} className="focus:outline-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="#5389FF"
                        className="size-6 cursor-pointer"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                        <circle cx="12" cy="12" r="9" stroke="#5389FF" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="w-full flex gap-4 items-center justify-between">
                <select
                  className="appearance-none w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm"
                  value={selectedAdditionalFinding}
                  onChange={e => setSelectedAdditionalFinding(e.target.value)}
                >
                  <option value="">Select Additional Finding</option>
                  {additionalFindingOptions.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Remarks"
                  value={additionalFindingRemarks}
                  onChange={e => setAdditionalFindingRemarks(e.target.value)}
                  className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm"
                />
                <button type="button" onClick={handleAddAdditionalFinding} className="w-[22px] h-[22px] flex items-center justify-center focus:outline-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              {/* <div className="w-full flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Additional Notes</p>
                <textarea
                  placeholder="Start Typing..."
                  className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6  focus:outline-none resize-none"
                  rows="6"
                ></textarea>
              </div> */}
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
                      <button onClick={() => handleRemoveRecommendation(recommendation.id)} className="hover:opacity-70 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add new recommendation */}
              <div className="w-full flex gap-4 items-center justify-between">
                <input
                  type="text"
                  placeholder="Remarks"
                  value={newRecommendation}
                  onChange={e => setNewRecommendation(e.target.value)}
                  className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                />
                <button onClick={handleAddRecommendation} className="w-[22px] h-[22px] hover:opacity-70 focus:outline-none">
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

        {/* Next Follow-Up */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Next Follow-Up</h1>
            <div className="flex-1">
              <div className="w-full flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Additional Notes</p>
                <textarea
                  placeholder="Start Typing..."
                  value={nextFollowup}
                  onChange={e => setNextFollowup(e.target.value)}
                  className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                  rows="6"
                ></textarea>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Doctor Signature */}
        <div className="w-full space-y-[11px]">
          <div className="flex pb-[11px]">
            <div className="w-full">
              <div className="flex-col p-2 float-right">
                {/* <Image src="/iconx/signature.svg" width={100} height={100} alt="signature" /> */}
                <span className="leading-[24px] font-semibold text-[14px]">
                  Dr. {userInfo?.first_name && userInfo?.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : 'Doctor Name'}
                </span>
                <br />
                <span className="leading-[24px] text-[14px]">
                  {userInfo?.education || 'MBBS'} | {userInfo?.specialty || 'PEDIATRICIAN'}
                </span>
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
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}
