import { useState, useEffect } from 'react';
import Image from 'next/image';
import { dentalScreeningDropdownOptions, createDentalPrescription, getDentalPrescription, getMedicalReportStatus } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useRouter, useParams } from 'next/navigation';
import InlineSpinner from '@/components/UI/InlineSpinner';

export default function Dentist() {
  const router = useRouter();
  const { id } = useParams();

  // Form state - always start empty
  const [selectedTooth, setSelectedTooth] = useState('');
  const [selectedRemark, setSelectedRemark] = useState('');
  const [findings, setFindings] = useState([]);
  const [checkedTeeth, setCheckedTeeth] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);

  // API dropdown options state
  const [dropdownOptions, setDropdownOptions] = useState({
    'Patient Concern': [],
    'Oral Examination Findings': [],
    Diagnosis: [],
    Recommendations: [],
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Selected states for dynamic dropdowns
  const [selectedPatientConcerns, setSelectedPatientConcerns] = useState([]);
  const [selectedPatientConcern, setSelectedPatientConcern] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [diagnosisRemarks, setDiagnosisRemarks] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [treatmentRemarks, setTreatmentRemarks] = useState('');

  const [examinationNote, setExaminationNote] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [recommendationsNote, setRecommendationsNote] = useState('');
  const [medicalOfficerDentalScreeningReport, setMedicalOfficerDentalScreeningReport] = useState({});

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);

  // Edit mode states
  const [editingPatientConcern, setEditingPatientConcern] = useState(null);
  const [editingFinding, setEditingFinding] = useState(null);
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);
  const [editingRecommendation, setEditingRecommendation] = useState(null);

  // Temporary edit values
  const [tempEditValue, setTempEditValue] = useState('');
  const [tempEditTooth, setTempEditTooth] = useState('');
  const [tempEditRemark, setTempEditRemark] = useState('');
  const [tempEditRemarks, setTempEditRemarks] = useState('');

  useEffect(() => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        // Fetch dropdown options
        const optionsResponse = await dentalScreeningDropdownOptions();
        const optionsResults = await JSON.parse(optionsResponse);
        if (optionsResults.status === true && optionsResults.data && optionsResults.data.dropdown_options) {
          setDropdownOptions(optionsResults.data.dropdown_options);
        } else {
          setApiError(optionsResults.message || 'Failed to fetch dropdown options.');
          console.error('Dropdown API Error:', optionsResults.message);
        }

        // Fetch doctor info only (not form data)
        const reportResponse = await getDentalPrescription(id);
        const reportResults = await JSON.parse(reportResponse);

        if (reportResults.status === true && reportResults.data) {
          const reportData = reportResults.data;
          // Only store doctor info, NOT form data
          setDoctorInfo({
            clinicName: reportData?.clinic_name,
            consultantFullName: reportData?.consultant_full_name,
            education: reportData?.education,
            specialty: reportData?.specialty,
          });
        }
      } catch (err) {
        setApiError(err.message || 'An error occurred while fetching data.');
        console.error('Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    getMedicalReportStatus(id)
      .then(res => {
        const response = JSON.parse(res);
        const dental_screening_report = response.data.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'dental_screening_status');
        setMedicalOfficerDentalScreeningReport(dental_screening_report);
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  // Tooth options following the dental chart numbering
  const toothOptions = [
    // Upper teeth (right to left)
    '18',
    '17',
    '16',
    '15',
    '14',
    '13',
    '12',
    '11',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    // Lower teeth (left to right)
    '48',
    '47',
    '46',
    '45',
    '44',
    '43',
    '42',
    '41',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
  ];

  const handleAddFinding = () => {
    if (selectedTooth && selectedRemark) {
      const newFinding = {
        id: Date.now(),
        tooth: selectedTooth,
        remark: selectedRemark,
      };
      setFindings([...findings, newFinding]);

      // Add tooth to checked teeth if not already checked
      if (!checkedTeeth.includes(selectedTooth)) {
        setCheckedTeeth([...checkedTeeth, selectedTooth]);
      }

      // Reset selections
      setSelectedTooth('');
      setSelectedRemark('');
    }
  };

  const handleAddPatientConcern = () => {
    if (selectedPatientConcern && !selectedPatientConcerns.includes(selectedPatientConcern)) {
      setSelectedPatientConcerns([...selectedPatientConcerns, selectedPatientConcern]);
      setSelectedPatientConcern('');
    }
  };

  const handleRemovePatientConcern = indexToRemove => {
    setSelectedPatientConcerns(selectedPatientConcerns.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveFinding = id => {
    const findingToRemove = findings.find(f => f.id === id);
    const updatedFindings = findings.filter(f => f.id !== id);
    setFindings(updatedFindings);

    // Remove tooth from checked teeth if no other findings exist for it
    if (findingToRemove && !updatedFindings.some(f => f.tooth === findingToRemove.tooth)) {
      setCheckedTeeth(checkedTeeth.filter(tooth => tooth !== findingToRemove.tooth));
    }
  };

  const handleToothSelect = tooth => {
    setSelectedTooth(tooth);
    if (!checkedTeeth.includes(tooth)) {
      setCheckedTeeth([...checkedTeeth, tooth]);
    }
  };

  const handleCheckboxChange = tooth => {
    setSelectedTooth(tooth);
    if (checkedTeeth.includes(tooth)) {
      setCheckedTeeth(checkedTeeth.filter(t => t !== tooth));
    } else {
      setCheckedTeeth([...checkedTeeth, tooth]);
    }
  };

  const handleAddRecommendation = () => {
    if (selectedTreatment) {
      const newRecommendation = {
        id: Date.now(),
        treatment: selectedTreatment,
        remarks: treatmentRemarks,
      };
      setRecommendations([...recommendations, newRecommendation]);
      setSelectedTreatment('');
      setTreatmentRemarks('');
    }
  };

  const handleRemoveRecommendation = id => {
    setRecommendations(recommendations.filter(r => r.id !== id));
  };

  const handleAddDiagnosis = () => {
    if (selectedDiagnosis) {
      const newDiagnosis = {
        id: Date.now(),
        note: selectedDiagnosis,
        remarks: diagnosisRemarks,
      };
      setSelectedDiagnoses([...selectedDiagnoses, newDiagnosis]);
      setSelectedDiagnosis('');
      setDiagnosisRemarks('');
    }
  };

  const handleRemoveDiagnosis = indexToRemove => {
    setSelectedDiagnoses(selectedDiagnoses.filter((_, index) => index !== indexToRemove));
  };

  // Edit handlers
  const handleEditPatientConcern = index => {
    setEditingPatientConcern(index);
    setTempEditValue(selectedPatientConcerns[index]);
  };

  const handleSavePatientConcern = index => {
    if (tempEditValue.trim()) {
      const updated = [...selectedPatientConcerns];
      updated[index] = tempEditValue;
      setSelectedPatientConcerns(updated);
    }
    setEditingPatientConcern(null);
    setTempEditValue('');
  };

  const handleCancelEditPatientConcern = () => {
    setEditingPatientConcern(null);
    setTempEditValue('');
  };

  const handleEditFinding = id => {
    const finding = findings.find(f => f.id === id);
    setEditingFinding(id);
    setTempEditTooth(finding.tooth);
    setTempEditRemark(finding.remark);
  };

  const handleSaveFinding = id => {
    if (tempEditTooth && tempEditRemark) {
      const updated = findings.map(f => (f.id === id ? { ...f, tooth: tempEditTooth, remark: tempEditRemark } : f));
      setFindings(updated);

      // Update checked teeth
      const oldFinding = findings.find(f => f.id === id);
      const newChecked = checkedTeeth.filter(t => t !== oldFinding.tooth);
      if (!newChecked.includes(tempEditTooth)) {
        newChecked.push(tempEditTooth);
      }
      setCheckedTeeth(newChecked);
    }
    setEditingFinding(null);
    setTempEditTooth('');
    setTempEditRemark('');
  };

  const handleCancelEditFinding = () => {
    setEditingFinding(null);
    setTempEditTooth('');
    setTempEditRemark('');
  };

  const handleEditDiagnosis = index => {
    const diagnosis = selectedDiagnoses[index];
    setEditingDiagnosis(index);
    setTempEditValue(diagnosis.note);
    setTempEditRemarks(diagnosis.remarks);
  };

  const handleSaveDiagnosis = index => {
    if (tempEditValue) {
      const updated = [...selectedDiagnoses];
      updated[index] = { ...updated[index], note: tempEditValue, remarks: tempEditRemarks };
      setSelectedDiagnoses(updated);
    }
    setEditingDiagnosis(null);
    setTempEditValue('');
    setTempEditRemarks('');
  };

  const handleCancelEditDiagnosis = () => {
    setEditingDiagnosis(null);
    setTempEditValue('');
    setTempEditRemarks('');
  };

  const handleEditRecommendation = id => {
    const recommendation = recommendations.find(r => r.id === id);
    setEditingRecommendation(id);
    setTempEditValue(recommendation.treatment);
    setTempEditRemarks(recommendation.remarks);
  };

  const handleSaveRecommendation = id => {
    if (tempEditValue) {
      const updated = recommendations.map(r => (r.id === id ? { ...r, treatment: tempEditValue, remarks: tempEditRemarks } : r));
      setRecommendations(updated);
    }
    setEditingRecommendation(null);
    setTempEditValue('');
    setTempEditRemarks('');
  };

  const handleCancelEditRecommendation = () => {
    setEditingRecommendation(null);
    setTempEditValue('');
    setTempEditRemarks('');
  };

  // Tooth data for the dental chart
  const upperTeeth = [
    { number: '18', image: '/teeths/teeth-18.svg' },
    { number: '17', image: '/teeths/teeth-17.svg' },
    { number: '16', image: '/teeths/teeth-16.svg' },
    { number: '15', image: '/teeths/teeth-15.svg' },
    { number: '14', image: '/teeths/teeth-14.svg' },
    { number: '13', image: '/teeths/teeth-13.svg' },
    { number: '12', image: '/teeths/teeth-12.svg' },
    { number: '11', image: '/teeths/teeth-11.svg' },
    { number: '21', image: '/teeths/teeth-21.svg' },
    { number: '22', image: '/teeths/teeth-22.svg' },
    { number: '23', image: '/teeths/teeth-23.svg' },
    { number: '24', image: '/teeths/teeth-24.svg' },
    { number: '25', image: '/teeths/teeth-25.svg' },
    { number: '26', image: '/teeths/teeth-26.svg' },
    { number: '27', image: '/teeths/teeth-27.svg' },
    { number: '28', image: '/teeths/teeth-28.svg' },
  ];

  const lowerTeeth = [
    { number: '48', image: '/teeths/teeth-48.svg' },
    { number: '47', image: '/teeths/teeth-47.svg' },
    { number: '46', image: '/teeths/teeth-46.svg' },
    { number: '45', image: '/teeths/teeth-45.svg' },
    { number: '44', image: '/teeths/teeth-44.svg' },
    { number: '43', image: '/teeths/teeth-43.svg' },
    { number: '42', image: '/teeths/teeth-42.svg' },
    { number: '41', image: '/teeths/teeth-41.svg' },
    { number: '31', image: '/teeths/teeth-31.svg' },
    { number: '32', image: '/teeths/teeth-32.svg' },
    { number: '33', image: '/teeths/teeth-33.svg' },
    { number: '34', image: '/teeths/teeth-34.svg' },
    { number: '35', image: '/teeths/teeth-35.svg' },
    { number: '36', image: '/teeths/teeth-36.svg' },
    { number: '37', image: '/teeths/teeth-37.svg' },
    { number: '38', image: '/teeths/teeth-38.svg' },
  ];

  if (isLoading) {
    return <InlineSpinner />;
  }

  if (apiError) {
    return (
      <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex justify-center items-center">
        <div className="text-center text-red-500">
          <p>Error loading dropdown options: {apiError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const buildRequestPayload = () => {
    const patientConcernArray = selectedPatientConcerns.length > 0 ? selectedPatientConcerns : [];
    const diagnosisArray = selectedDiagnoses.map(rec => `${rec.note}${rec.remarks ? `: ${rec.remarks}` : ''}`);
    const treatmentRecommendationsArray = recommendations.map(rec => `${rec.treatment}${rec.remarks ? `: ${rec.remarks}` : ''}`);
    const oralExaminationArray = findings.map(finding => ({
      tooth_numbers: [finding.tooth],
      remarks: finding.remark,
    }));

    return {
      student_id: id,
      consultant_user_id: userInfo?.user_id?.toString(),
      patient_concern: patientConcernArray,
      oral_examination: oralExaminationArray,
      examination_note: examinationNote || '',
      diagnosis: diagnosisArray,
      treatment_recommendations: treatmentRecommendationsArray,
      next_followup: nextFollowup || '',
      treatment_recommendations_note: recommendationsNote || '',
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const requestBody = buildRequestPayload();

      const response = await createDentalPrescription(JSON.stringify(requestBody));

      if (response.status === true) {
        toastMessage(response.message || 'Dental prescription saved successfully!', 'success');
        router.back();
      } else {
        toastMessage(response.message || 'Failed to save dental prescription.', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      toastMessage(err.message || 'An error occurred while saving data.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex flex-col gap-10">
      {medicalOfficerDentalScreeningReport?.remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className="flex gap-5">
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className="text-red-500 font-normal text-sm">{medicalOfficerDentalScreeningReport.remarks}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-10">
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="flex left">
              <Image src="/iconx/school.svg" alt="school logo" width={36} height={36} className="flex-col" />
              <span className="leading-[24px] p-4 flex-col font-semibold text-[14px]">{doctorInfo?.clinicName || 'Dental Clinic'}</span>
            </div>
            <div className="flex right">
              <Image src="/iconx/profile-image.svg" alt="profile" width={36} height={36} className="size-10 sm:size-12 md:size-14 rounded-full" />
              <div className="flex-col p-2">
                <span className="leading-[10px] font-semibold text-[14px]">
                  Dr. {userInfo?.first_name && userInfo?.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : 'Doctor Name'}
                </span>
                <br />
                <span className=" leading-[10px] text-[14px]">
                  {userInfo?.education || 'MBBS'} | {userInfo?.specialty || 'Dental Specialist'}
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
              <div className="flex-1 flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Add Notes</p>
                {/* Display selected concerns */}
                {selectedPatientConcerns.map((concern, index) => (
                  <div key={index} className="w-full flex items-center justify-between">
                    {editingPatientConcern === index ? (
                      <>
                        <div className="flex-1 flex gap-3 items-center">
                          <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                          <select
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                            value={tempEditValue}
                            onChange={e => setTempEditValue(e.target.value)}
                            autoFocus
                          >
                            <option value="">Select a condition...</option>
                            {dropdownOptions['Patient Concern']?.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 items-center ml-3">
                          <button onClick={() => handleSavePatientConcern(index)} className="text-green-600 hover:text-green-700" title="Save">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button onClick={handleCancelEditPatientConcern} className="text-red-600 hover:text-red-700" title="Cancel">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-3 items-center">
                          <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                          <p className="mb-0 font-normal text-sm leading-6">{concern}</p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="#5389FF"
                            className="size-6 cursor-pointer"
                            onClick={() => handleRemovePatientConcern(index)}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <button className="cursor-pointer" title="Edit" onClick={() => handleEditPatientConcern(index)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                              <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div className="w-full flex gap-4 items-center justify-between">
                  <select
                    className="min-w-[298px] w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                    value={selectedPatientConcern}
                    onChange={e => setSelectedPatientConcern(e.target.value)}
                  >
                    <option value="">Select a condition...</option>
                    {dropdownOptions['Patient Concern']?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="w-[22px] h-[22px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="#5389FF"
                      className="size-5 cursor-pointer"
                      onClick={handleAddPatientConcern}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Oral Examination Findings */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Oral Examination Findings</h1>
            <div className="flex-1 flex flex-col gap-7">
              {/* Display existing findings */}
              {findings.map(finding => (
                <div key={finding.id} className="w-full flex items-center justify-between">
                  {editingFinding === finding.id ? (
                    <>
                      <div className="flex-1 flex gap-3 items-center">
                        <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                        <div className="flex-1 flex gap-2">
                          <select
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                            value={tempEditTooth}
                            onChange={e => setTempEditTooth(e.target.value)}
                          >
                            <option value="">Select Tooth</option>
                            {toothOptions.map(tooth => (
                              <option key={tooth} value={tooth}>
                                Tooth {tooth}
                              </option>
                            ))}
                          </select>
                          <select
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                            value={tempEditRemark}
                            onChange={e => setTempEditRemark(e.target.value)}
                          >
                            <option value="">Select Remark</option>
                            {dropdownOptions['Oral Examination Findings']?.map((remark, index) => (
                              <option key={index} value={remark}>
                                {remark}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center ml-3">
                        <button onClick={() => handleSaveFinding(finding.id)} className="text-green-600 hover:text-green-700" title="Save">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button onClick={handleCancelEditFinding} className="text-red-600 hover:text-red-700" title="Cancel">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3 items-center">
                        <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                        <p className="mb-0 font-normal text-sm leading-6">
                          <span className="font-medium text-sm leading-6">Tooth {finding.tooth}:</span> {finding.remark}
                        </p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                          onClick={() => handleRemoveFinding(finding.id)}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <button className="cursor-pointer" title="Edit" onClick={() => handleEditFinding(finding.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new finding form */}
              <div className="w-full flex gap-4 items-center justify-between">
                <div className="relative inline-block w-full">
                  <select
                    className="appearance-none w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] cursor-pointer"
                    value={selectedTooth}
                    onChange={e => handleToothSelect(e.target.value)}
                  >
                    <option value="">Select Tooth</option>
                    {toothOptions.map(tooth => (
                      <option key={tooth} value={tooth}>
                        Tooth {tooth}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="relative inline-block w-full">
                  <select
                    className="appearance-none w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] cursor-pointer"
                    value={selectedRemark}
                    onChange={e => setSelectedRemark(e.target.value)}
                  >
                    <option value="">Select Remark</option>
                    {dropdownOptions['Oral Examination Findings']?.map((remark, index) => (
                      <option key={index} value={remark}>
                        {remark}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="w-[22px] h-[22px]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer" onClick={handleAddFinding}>
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Dental Chart */}
          <div className="space-y-18 px-10">
            {/* Upper teeth */}
            <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={tooth.number} className="flex flex-col items-center gap-3">
                  <div className="w-11 h-24">
                    <img src={tooth.image} alt={`tooth ${tooth.number}`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-sm font-medium leading-6 tracking-normal text-center mb-0">{tooth.number}</p>
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 border-2 border-[#526077]"
                    checked={checkedTeeth.includes(tooth.number)}
                    onChange={() => handleCheckboxChange(tooth.number)}
                  />
                </div>
              ))}
            </div>

            {/* Lower teeth */}
            <div className="grid grid-cols-8 md:grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={tooth.number} className="flex flex-col items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-2 border-[#526077]"
                    checked={checkedTeeth.includes(tooth.number)}
                    onChange={() => handleCheckboxChange(tooth.number)}
                  />
                  <p className="text-sm font-medium leading-6 tracking-normal text-center mb-0">{tooth.number}</p>
                  <div className="w-11 h-24">
                    <Image src={tooth.image} alt={`tooth ${tooth.number}`} className="w-full h-full object-contain" height={96} width={44} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Diagnosis */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Diagnosis</h1>
            <div className="flex-1 flex flex-col gap-5">
              <p className="font-medium text-sm leading-6 mb-0">Add Notes</p>
              {/* Display selected diagnoses */}
              {selectedDiagnoses.map((diagnosis, index) => (
                <div key={index} className="w-full flex items-center justify-between">
                  {editingDiagnosis === index ? (
                    <>
                      <div className="flex-1 flex gap-3 items-center">
                        <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                        <div className="flex-1 flex gap-2">
                          <select
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                            value={tempEditValue}
                            onChange={e => setTempEditValue(e.target.value)}
                          >
                            <option value="">Select diagnosis</option>
                            {dropdownOptions['Diagnosis']?.map((diag, idx) => (
                              <option key={idx} value={diag}>
                                {diag}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Remarks"
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none"
                            value={tempEditRemarks}
                            onChange={e => setTempEditRemarks(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 items-center ml-3">
                        <button onClick={() => handleSaveDiagnosis(index)} className="text-green-600 hover:text-green-700" title="Save">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button onClick={handleCancelEditDiagnosis} className="text-red-600 hover:text-red-700" title="Cancel">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3 items-center">
                        <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF]"></div>
                        <p className="mb-0 font-normal text-sm leading-6">
                          <span className="font-medium text-sm leading-6">{diagnosis.note}:</span> {diagnosis.remarks}
                        </p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                          onClick={() => handleRemoveDiagnosis(index)}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <button className="cursor-pointer" title="Edit" onClick={() => handleEditDiagnosis(index)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="w-full flex gap-4 items-center justify-between">
                <div className="relative inline-block w-full">
                  <select
                    className="appearance-none w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] cursor-pointer"
                    value={selectedDiagnosis}
                    onChange={e => setSelectedDiagnosis(e.target.value)}
                  >
                    <option value="">Select diagnosis</option>
                    {dropdownOptions['Diagnosis']?.map((diagnosis, index) => (
                      <option key={index} value={diagnosis}>
                        {diagnosis}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Remarks"
                  className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                  value={diagnosisRemarks}
                  onChange={e => setDiagnosisRemarks(e.target.value)}
                />
                <div className="w-[22px] h-[22px]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer" onClick={handleAddDiagnosis}>
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-t border-[#B7B7B7]" />
        </div>

        {/* Recommendations */}
        <div className="w-full space-y-[11px]">
          <div className="flex justify-between">
            <div className="w-[35%]">
              <span className="bg-green-400 px-3 py-1 font-semibold text-[14px] leading-[100%] tracking-[0%] text-white rounded">
                Treatment Plan & Recommendations
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-7">
              {/* Display existing recommendations */}
              {recommendations.map(recommendation => (
                <div key={recommendation.id} className="w-full flex items-center justify-between">
                  {editingRecommendation === recommendation.id ? (
                    <>
                      <div className="flex-1 flex gap-3 items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 mr-2">
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1 flex gap-2">
                          <select
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none bg-white"
                            value={tempEditValue}
                            onChange={e => setTempEditValue(e.target.value)}
                          >
                            <option value="">Select Treatment</option>
                            {dropdownOptions['Recommendations']?.map((treatment, idx) => (
                              <option key={idx} value={treatment}>
                                {treatment}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Remarks"
                            className="flex-1 border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none"
                            value={tempEditRemarks}
                            onChange={e => setTempEditRemarks(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 items-center ml-3">
                        <button onClick={() => handleSaveRecommendation(recommendation.id)} className="text-green-600 hover:text-green-700" title="Save">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button onClick={handleCancelEditRecommendation} className="text-red-600 hover:text-red-700" title="Cancel">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3 items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#363AF5" className="size-4 mr-2">
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="mb-0 font-normal text-sm leading-6">
                          <span className="font-medium text-sm leading-6">{recommendation.treatment}:</span> {recommendation.remarks}
                        </p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="#5389FF"
                          className="size-6 cursor-pointer"
                          onClick={() => handleRemoveRecommendation(recommendation.id)}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <button className="cursor-pointer" title="Edit" onClick={() => handleEditRecommendation(recommendation.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new recommendation form */}
              <div className="w-full flex gap-4 items-center justify-between">
                <div className="relative inline-block w-full">
                  <select
                    className="appearance-none w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] cursor-pointer"
                    value={selectedTreatment}
                    onChange={e => setSelectedTreatment(e.target.value)}
                  >
                    <option value="">Select Treatment</option>
                    {dropdownOptions['Recommendations']?.map((treatment, index) => (
                      <option key={index} value={treatment}>
                        {treatment}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Remarks"
                  className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                  value={treatmentRemarks}
                  onChange={e => setTreatmentRemarks(e.target.value)}
                />
                <div className="w-[22px] h-[22px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="#5389FF"
                    className="size-5 cursor-pointer"
                    onClick={handleAddRecommendation}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
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
                  className="w-full border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                  rows="6"
                  value={nextFollowup}
                  onChange={e => setNextFollowup(e.target.value)}
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
                <span className="leading-[10px] font-semibold text-[14px]">
                  Dr. {userInfo?.first_name && userInfo?.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : 'Doctor Name'}
                </span>
                <br />
                <span className="leading-[24px] text-[14px]">
                  {doctorInfo?.education || userInfo?.education || 'MBBS'} | {doctorInfo?.specialty || userInfo?.specialty || 'Dental Specialist'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-[50px] flex justify-center items-center gap-5 ">
        <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap" onClick={() => router.back()}>
          Close
        </button>
        <button
          type="button"
          className="rounded-[5px] bg-indigo-500  h-[37px] px-5 py-2 text-sm font-normal text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
