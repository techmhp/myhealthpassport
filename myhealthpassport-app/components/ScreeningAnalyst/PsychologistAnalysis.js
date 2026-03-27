import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  psychologicalAnalystRecomendations,
  createPsychologicalAnalystRecomendations,
  updatePsychologicalAnalystRecomendations,
  getMedicalReportStatus,
} from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import { useRouter } from 'next/navigation';
import InlineSpinner from '../UI/InlineSpinner';

export default function PsychologistAnalysis() {
  const { studentId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [editFindingValue, setEditFindingValue] = useState({
    findings: '',
    remarks: '',
  });

  const [medicalOfficerPsychologicalReport, setMedicalOfficerPsychologicalReport] = useState({});
  // Autosave state
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autoSaveIntervalRef = useRef(null);
  const formDataRef = useRef(null);
  const hasExistingDataRef = useRef(false);
  const userInfoRef = useRef(null);
  const apiDataRef = useRef(null);
  const [newRecomandationsValue, setNewRecomandationsValue] = useState('');
  const [editingRecomandations, setEditingRecomandations] = useState(null);
  const [editRecomandationsValue, setEditRecomandationsValue] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    goodStrengthsData: [],
    needAttentionData: [],
    clinicalNotes: [],
    summary: '',
    status: '',
  });

  // Temporary input states
  const [tempInputs, setTempInputs] = useState({
    goodOutcomesSelect: '',
    goodOutcomesRemarks: '',
    areaOfConcernSelect: '',
    areaOfConcernRemarks: '',
  });

  // Initialize form data
  const initializeFormData = () => ({
    goodStrengthsData: [],
    needAttentionData: [],
    clinicalNotes: [],
    summary: '',
    status: '',
  });

  // Fixed populateFormData function
  const populateFormData = apiResponse => {
    // Access the correct nested structure: apiResponse.data.data[0]
    const analysisData = apiResponse.data.data[0];
    return {
      goodStrengthsData: analysisData.good_strengths_data || [],
      needAttentionData: analysisData.need_attention_data || [],
      clinicalNotes: Array.isArray(analysisData.clinical_notes_recommendations)
        ? analysisData.clinical_notes_recommendations
        : [],
      summary: analysisData.summary || '',
      status: analysisData.status || '',
    };
  };

  // Updated fetchData function
  const fetchData = async () => {
    try {
      setLoading(true);
      const rawResponse = await psychologicalAnalystRecomendations(studentId);
      const results = JSON.parse(rawResponse);
      setApiData(results);

      // Check if data exists based on API response status
      if (results.status === true && results.data && results.data.data && results.data.data.length > 0) {
        setHasExistingData(true);
        setFormData(populateFormData(results));
      } else {
        setHasExistingData(false);
        setFormData(initializeFormData());
      }
    } catch (err) {
      console.log('Error fetching data:', err);
      setHasExistingData(false);
      setFormData(initializeFormData());
    } finally {
      setLoading(false);
    }
  };

  // Keep refs in sync so autosave interval reads latest state
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { hasExistingDataRef.current = hasExistingData; }, [hasExistingData]);
  useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);
  useEffect(() => { apiDataRef.current = apiData; }, [apiData]);

  // Autosave — 30-second interval
  const autoSave = useCallback(async () => {
    const currentFormData = formDataRef.current;
    const currentUserInfo = userInfoRef.current;
    const currentHasExisting = hasExistingDataRef.current;
    const currentApiData = apiDataRef.current;

    if (!currentUserInfo) return;

    // Skip blank saves when no data exists yet
    if (!currentHasExisting) {
      const hasContent =
        currentFormData?.goodStrengthsData?.length > 0 ||
        currentFormData?.needAttentionData?.length > 0 ||
        currentFormData?.clinicalNotes?.length > 0 ||
        currentFormData?.summary?.trim();
      if (!hasContent) return;
    }

    setAutoSaveStatus('saving');
    try {
      const requestData = {
        student_id: parseInt(studentId),
        role_type: currentUserInfo?.role_type || 'psychologist',
        role_name: currentUserInfo?.role_name || '',
        data: [
          {
            ...(currentHasExisting && currentApiData?.data?.data?.[0]?.id
              ? { id: currentApiData.data.data[0].id }
              : {}),
            good_strengths_data: currentFormData.goodStrengthsData,
            need_attention_data: currentFormData.needAttentionData,
            clinical_notes_recommendations: currentFormData.clinicalNotes,
            summary: currentFormData.summary,
            status: currentFormData.status || 'all_good',
          },
        ],
      };
      let result;
      if (currentHasExisting) {
        result = await updatePsychologicalAnalystRecomendations(JSON.stringify(requestData));
      } else {
        result = await createPsychologicalAnalystRecomendations(JSON.stringify(requestData));
      }
      if (result?.status) {
        setAutoSaveStatus('saved');
        setLastSavedAt(new Date());
        // After a CREATE, refresh apiData so the new record's ID is available
        // for subsequent UPDATE calls in both manual save and autosave
        if (!currentHasExisting) {
          apiDataRef.current = result;
          setApiData(result);
        }
        hasExistingDataRef.current = true;
        setHasExistingData(true);
      } else {
        setAutoSaveStatus('error');
      }
    } catch {
      setAutoSaveStatus('error');
    }
  }, [studentId]);

  // Start / stop autosave interval once loading is done
  useEffect(() => {
    if (loading) return;
    autoSaveIntervalRef.current = setInterval(autoSave, 30000);
    return () => clearInterval(autoSaveIntervalRef.current);
  }, [loading, autoSave]);

  useEffect(() => {
    if (localStorage.getItem('user_info')) {
      const userJson = JSON.parse(atob(localStorage.getItem('user_info')));
      setUserInfo(userJson);
    }
    fetchData();
    getMedicalReportStatus(studentId)
      .then(res => {
        const response = JSON.parse(res);
        const psychological_report = response.data.medical_screening_statuses?.find(item => item.medical_officer_status_type === 'psychological_report_status');
        setMedicalOfficerPsychologicalReport(psychological_report);
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Handle adding findings data
  const addFindingsData = type => {
    if (tempInputs.goodOutcomesSelect && tempInputs.goodOutcomesRemarks) {
      const newFinding = {
        findings: tempInputs.goodOutcomesSelect,
        remarks: tempInputs.goodOutcomesRemarks,
      };
      setFormData(prev => ({
        ...prev,
        goodStrengthsData: [...prev.goodStrengthsData, newFinding],
      }));
      setTempInputs(prev => ({
        ...prev,
        goodOutcomesSelect: '',
        goodOutcomesRemarks: '',
      }));
    } else if (tempInputs.areaOfConcernSelect && tempInputs.areaOfConcernRemarks) {
      const newFinding = {
        findings: tempInputs.areaOfConcernSelect,
        remarks: tempInputs.areaOfConcernRemarks,
      };
      setFormData(prev => ({
        ...prev,
        needAttentionData: [...prev.needAttentionData, newFinding],
      }));
      setTempInputs(prev => ({
        ...prev,
        areaOfConcernSelect: '',
        areaOfConcernRemarks: '',
      }));
    }
  };

  // Handle removing findings data
  const removeGoodStrengthsData = index => {
    setFormData(prev => ({
      ...prev,
      goodStrengthsData: prev.goodStrengthsData.filter((_, i) => i !== index),
    }));
  };

  // Handle removing findings data
  const removeNeedAttentionData = index => {
    setFormData(prev => ({
      ...prev,
      needAttentionData: prev.needAttentionData.filter((_, i) => i !== index),
    }));
  };

  const addRecomandations = () => {
    if (newRecomandationsValue.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        clinicalNotes: [...(Array.isArray(prev.clinicalNotes) ? prev.clinicalNotes : []), newRecomandationsValue.trim()],
      }));
      setNewRecomandationsValue('');
    }
  };

  // Remove Recommendations
  const removeRecomandations = indexToRemove => {
    setFormData(prev => ({
      ...prev,
      clinicalNotes: prev.clinicalNotes.filter((_, index) => index !== indexToRemove),
    }));
  };

  const cancelEditRecomandations = () => {
    setEditingRecomandations(null);
    setEditRecomandationsValue('');
  };

  const startEditRecomandations = (answerIndex, currentValue) => {
    setEditingRecomandations(answerIndex);
    setEditRecomandationsValue(currentValue);
  };

  const saveEditRecomandations = answerIndex => {
    if (editRecomandationsValue.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        clinicalNotes: prev.clinicalNotes.map((note, i) =>
          i === answerIndex ? editRecomandationsValue.trim() : note
        ),
      }));
    }
    setEditingRecomandations(null);
    setEditRecomandationsValue('');
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      const requestData = {
        student_id: parseInt(studentId),
        role_type: userInfo?.role_type || 'psychologist',
        role_name: userInfo?.role_name || 'Dr. John Doe',
        data: [
          {
            ...(hasExistingData && apiData?.data?.data?.[0]?.id ? { id: apiData.data.data[0].id } : {}),
            good_strengths_data: formData.goodStrengthsData,
            need_attention_data: formData.needAttentionData,
            clinical_notes_recommendations: formData.clinicalNotes,
            summary: formData.summary,
            status: formData.status || 'all_good',
          },
        ],
      };

      let response;
      if (hasExistingData) {
        response = await updatePsychologicalAnalystRecomendations(JSON.stringify(requestData));
      } else {
        response = await createPsychologicalAnalystRecomendations(JSON.stringify(requestData));
      }

      if (response.status) {
        toastMessage(response.message, 'success');
        setAutoSaveStatus('saved');
        setLastSavedAt(new Date());
        // After first CREATE, store new record's ID so next save can UPDATE correctly
        if (!hasExistingData) {
          setApiData(response);
          apiDataRef.current = response;
        }
        setHasExistingData(true);
        router.refresh();
      } else {
        toastMessage(response.message || 'Operation failed', 'error');
      }
    } catch (error) {
      toastMessage(error.message || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEditFinding = (type, index, currentFinding) => {
    const editKey = `${type}-${index}`;
    setEditingFinding(editKey);
    setEditFindingValue({
      findings: currentFinding.findings,
      remarks: currentFinding.remarks,
    });
  };

  // Function to save edited finding
  const saveEditFinding = (type, index) => {
    if (editFindingValue.findings.trim() !== '' && editFindingValue.remarks.trim() !== '') {
      setFormData(prev => {
        const newFormData = { ...prev };
        if (type === 'good') {
          newFormData.goodStrengthsData[index] = {
            findings: editFindingValue.findings.trim(),
            remarks: editFindingValue.remarks.trim(),
          };
        } else if (type === 'concern') {
          newFormData.needAttentionData[index] = {
            findings: editFindingValue.findings.trim(),
            remarks: editFindingValue.remarks.trim(),
          };
        }
        return newFormData;
      });

      // Clear edit state
      setEditingFinding(null);
      setEditFindingValue({ findings: '', remarks: '' });
    } else {
      toastMessage('Both findings and remarks are required', 'error');
    }
  };

  // Function to cancel edit
  const cancelEditFinding = () => {
    setEditingFinding(null);
    setEditFindingValue({ findings: '', remarks: '' });
  };

  if (loading) {
    return (
      <div className="w-full py-8 justify-center items-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="w-full pt-[35px] pr-[34px] pb-[60px] pl-[34px] flex flex-col gap-10">
      {/* Autosave status banner */}
      {autoSaveStatus === 'saving' && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          Auto-saving…
        </div>
      )}
      {autoSaveStatus === 'saved' && lastSavedAt && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <span className="text-green-500">●</span>
          Auto-saved at {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      {autoSaveStatus === 'error' && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
          <span>⚠</span> Auto-save failed — please save manually
        </div>
      )}
      {medicalOfficerPsychologicalReport?.remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 bg-[#FFF3E5] rounded-[8px]">
          <div className="flex gap-5">
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className="text-red-500 font-normal text-sm font-normal">{medicalOfficerPsychologicalReport.remarks}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-10">
        <div className="w-full flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Findings</h1>
            <div className="flex-1 flex flex-col gap-7">
              {/* Good Outcomes/Strengths */}
              <div className="flex flex-col gap-3">
                <h2 className="font-medium text-sm leading-6 mb-0">Good Outcomes/Strengths</h2>
                {/* Display existing findings */}
                {formData.goodStrengthsData.map((finding, index) => {
                  const editKey = `good-${index}`;
                  const isEditing = editingFinding === editKey;

                  return (
                    <div key={index} className="w-full flex items-start justify-between gap-3">
                      <div className="flex gap-3 items-start flex-1">
                        <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-1"></div>
                        {isEditing ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <select
                              value={editFindingValue.findings}
                              onChange={e => setEditFindingValue(prev => ({ ...prev, findings: e.target.value }))}
                              className="block w-full rounded-[8px] px-4 py-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="">Choose an option</option>
                              <option value="Emotional Well-being">Emotional Well-being</option>
                              <option value="Emotional Well-being & Social Skills">Emotional Well-being & Social Skills</option>
                              <option value="Language & Communication">Language & Communication</option>
                              <option value="Cognitive & Learning">Cognitive & Learning</option>
                              <option value="Behavioural Regulation">Behavioural Regulation</option>
                              <option value="Social Interactions">Social Interactions</option>
                              <option value="Adaptive/Self-help Skills">Adaptive/Self-help Skills</option>
                              <option value="Motor Skills (Gross & Fine)">Motor Skills (Gross & Fine)</option>
                              <option value="Work-related stress and Burnout">Work-related stress and Burnout</option>
                              <option value="Anxiety and Depression">Anxiety and Depression</option>
                              <option value="Resilience and coping">Resilience and coping</option>
                              <option value="Sleep quality and fatigue">Sleep quality and fatigue</option>
                              <option value="Job satisfaction & organisational support">Job satisfaction & organisational support</option>
                              <option value="Emotional regulation">Emotional regulation</option>
                              <option value="Empathy and emotional regulation">Empathy and emotional regulation</option>
                              <option value="Family environment and support">Family environment and support</option>
                              <option value="Social Relationships">Social Relationships</option>
                              <option value="Self-esteem">Self-esteem</option>
                              <option value="Academic Engagement">Academic Engagement</option>
                              <option value="Physical Well-being">Physical Well-being</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Remarks"
                              value={editFindingValue.remarks}
                              onChange={e => setEditFindingValue(prev => ({ ...prev, remarks: e.target.value }))}
                              className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                              onKeyPress={e => {
                                if (e.key === 'Enter') {
                                  saveEditFinding('good', index);
                                }
                                if (e.key === 'Escape') {
                                  cancelEditFinding();
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <p className="mb-0 font-normal text-sm leading-6 flex-1">
                            <span className="font-medium text-sm leading-6">{finding.findings}:</span> {finding.remarks}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 items-center">
                        {isEditing ? (
                          <>
                            {/* Save button */}
                            <button onClick={() => saveEditFinding('good', index)} className="cursor-pointer" title="Save">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#22c55e" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            </button>
                            {/* Cancel button */}
                            <button onClick={cancelEditFinding} className="cursor-pointer" title="Cancel">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Remove button */}
                            <button onClick={() => removeGoodStrengthsData(index)} className="cursor-pointer" title="Remove">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            </button>
                            {/* Edit button */}
                            <button onClick={() => startEditFinding('good', index, finding)} className="cursor-pointer" title="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add new findings */}
                <div className="w-full flex gap-4 items-center justify-center">
                  <div className="w-full">
                    <select
                      name="goodOutcomesSelect"
                      className="block w-full rounded-[8px] px-4 py-[14px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={tempInputs.goodOutcomesSelect}
                      onChange={e => setTempInputs(prev => ({ ...prev, goodOutcomesSelect: e.target.value }))}
                    >
                      <option value="">Choose an option</option>
                      <option value="Emotional Well-being">Emotional Well-being</option>
                      <option value="Emotional Well-being & Social Skills">Emotional Well-being & Social Skills</option>
                      <option value="Language & Communication">Language & Communication</option>
                      <option value="Cognitive & Learning">Cognitive & Learning</option>
                      <option value="Behavioural Regulation">Behavioural Regulation</option>
                      <option value="Social Interactions">Social Interactions</option>
                      <option value="Adaptive/Self-help Skills">Adaptive/Self-help Skills</option>
                      <option value="Motor Skills (Gross & Fine)">Motor Skills (Gross & Fine)</option>
                      <option value="Work-related stress and Burnout">Work-related stress and Burnout</option>
                      <option value="Anxiety and Depression">Anxiety and Depression</option>
                      <option value="Resilience and coping">Resilience and coping</option>
                      <option value="Sleep quality and fatigue">Sleep quality and fatigue</option>
                      <option value="Job satisfaction & organisational support">Job satisfaction & organisational support</option>
                      <option value="Emotional regulation">Emotional regulation</option>
                      <option value="Empathy and emotional regulation">Empathy and emotional regulation</option>
                      <option value="Family environment and support">Family environment and support</option>
                      <option value="Social Relationships">Social Relationships</option>
                      <option value="Self-esteem">Self-esteem</option>
                      <option value="Academic Engagement">Academic Engagement</option>
                      <option value="Physical Well-being">Physical Well-being</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    name="goodOutcomesRemarks"
                    placeholder="Remarks"
                    value={tempInputs.goodOutcomesRemarks}
                    onChange={e => setTempInputs(prev => ({ ...prev, goodOutcomesRemarks: e.target.value }))}
                    className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                  />
                  <div className="w-[22px] h-[22px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer" onClick={addFindingsData}>
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Areas of Concern/Needs Attention */}
              <div className="flex flex-col gap-3">
                <h2 className="font-medium text-sm leading-6 mb-0">Areas of Concern/Needs Attention</h2>
                {/* Display existing need attention items */}
                {formData?.needAttentionData &&
                  formData.needAttentionData.map((finding, index) => {
                    const editKey = `concern-${index}`;
                    const isEditing = editingFinding === editKey;

                    return (
                      <div key={index} className="w-full flex items-start justify-between gap-3">
                        <div className="flex gap-3 items-start flex-1">
                          <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-1"></div>
                          {isEditing ? (
                            <div className="flex-1 flex flex-col gap-2">
                              <select
                                value={editFindingValue.findings}
                                onChange={e => setEditFindingValue(prev => ({ ...prev, findings: e.target.value }))}
                                className="block w-full rounded-[8px] px-4 py-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              >
                                <option value="">Choose an option</option>
                                <option value="Emotional Well-being">Emotional Well-being</option>
                                <option value="Emotional Well-being & Social Skills">Emotional Well-being & Social Skills</option>
                                <option value="Language & Communication">Language & Communication</option>
                                <option value="Cognitive & Learning">Cognitive & Learning</option>
                                <option value="Behavioural Regulation">Behavioural Regulation</option>
                                <option value="Social Interactions">Social Interactions</option>
                                <option value="Adaptive/Self-help Skills">Adaptive/Self-help Skills</option>
                                <option value="Motor Skills (Gross & Fine)">Motor Skills (Gross & Fine)</option>
                                <option value="Work-related stress and Burnout">Work-related stress and Burnout</option>
                                <option value="Anxiety and Depression">Anxiety and Depression</option>
                                <option value="Resilience and coping">Resilience and coping</option>
                                <option value="Sleep quality and fatigue">Sleep quality and fatigue</option>
                                <option value="Job satisfaction & organisational support">Job satisfaction & organisational support</option>
                                <option value="Emotional regulation">Emotional regulation</option>
                                <option value="Empathy and emotional regulation">Empathy and emotional regulation</option>
                                <option value="Family environment and support">Family environment and support</option>
                                <option value="Social Relationships">Social Relationships</option>
                                <option value="Self-esteem">Self-esteem</option>
                                <option value="Academic Engagement">Academic Engagement</option>
                                <option value="Physical Well-being">Physical Well-being</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Remarks"
                                value={editFindingValue.remarks}
                                onChange={e => setEditFindingValue(prev => ({ ...prev, remarks: e.target.value }))}
                                className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                                onKeyPress={e => {
                                  if (e.key === 'Enter') {
                                    saveEditFinding('concern', index);
                                  }
                                  if (e.key === 'Escape') {
                                    cancelEditFinding();
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <p className="mb-0 font-normal text-sm leading-6 flex-1">
                              <span className="font-medium text-sm leading-6">{finding.findings}:</span> {finding.remarks}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3 items-center">
                          {isEditing ? (
                            <>
                              {/* Save button */}
                              <button onClick={() => saveEditFinding('concern', index)} className="cursor-pointer" title="Save">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#22c55e" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </button>
                              {/* Cancel button */}
                              <button onClick={cancelEditFinding} className="cursor-pointer" title="Cancel">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Remove button */}
                              <button onClick={() => removeNeedAttentionData(index)} className="cursor-pointer" title="Remove">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              </button>
                              {/* Edit button */}
                              <button onClick={() => startEditFinding('concern', index, finding)} className="cursor-pointer" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {/* Add new need attention */}
                <div className="w-full flex gap-4 items-center justify-between">
                  <div className="w-full">
                    <select
                      name="areaOfConcernSelect"
                      className="block w-full rounded-[8px] px-4 py-[14px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={tempInputs.areaOfConcernSelect}
                      onChange={e => setTempInputs(prev => ({ ...prev, areaOfConcernSelect: e.target.value }))}
                    >
                      <option value="">Choose an option</option>
                      <option value="Emotional Well-being">Emotional Well-being</option>
                      <option value="Emotional Well-being & Social Skills">Emotional Well-being & Social Skills</option>
                      <option value="Language & Communication">Language & Communication</option>
                      <option value="Cognitive & Learning">Cognitive & Learning</option>
                      <option value="Behavioural Regulation">Behavioural Regulation</option>
                      <option value="Social Interactions">Social Interactions</option>
                      <option value="Adaptive/Self-help Skills">Adaptive/Self-help Skills</option>
                      <option value="Motor Skills (Gross & Fine)">Motor Skills (Gross & Fine)</option>
                      <option value="Work-related stress and Burnout">Work-related stress and Burnout</option>
                      <option value="Anxiety and Depression">Anxiety and Depression</option>
                      <option value="Resilience and coping">Resilience and coping</option>
                      <option value="Sleep quality and fatigue">Sleep quality and fatigue</option>
                      <option value="Job satisfaction & organisational support">Job satisfaction & organisational support</option>
                      <option value="Emotional regulation">Emotional regulation</option>
                      <option value="Empathy and emotional regulation">Empathy and emotional regulation</option>
                      <option value="Family environment and support">Family environment and support</option>
                      <option value="Social Relationships">Social Relationships</option>
                      <option value="Self-esteem">Self-esteem</option>
                      <option value="Academic Engagement">Academic Engagement</option>
                      <option value="Physical Well-being">Physical Well-being</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    name="areaOfConcernRemarks"
                    placeholder="Remarks"
                    value={tempInputs.areaOfConcernRemarks}
                    onChange={e => setTempInputs(prev => ({ ...prev, areaOfConcernRemarks: e.target.value }))}
                    className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                  />
                  <div className="w-[22px] h-[22px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5 cursor-pointer" onClick={addFindingsData}>
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
        </div>
        <hr className="border-t border-[#B7B7B7]" />
        <div className="flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Report Summary</h1>
            <div className="flex-1 flex flex-col gap-7">
              {/* Select Status */}
              <div className="w-full">
                <label className="font-medium text-sm leading-6 mb-0">Status</label>
                <select
                  className="block w-full rounded-[8px] px-4 py-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Select Status</option>
                  <option value="all_good">All Good</option>
                  <option value="need_attention">Need Attention</option>
                  <option value="need_monitoring">Need Monitoring</option>
                </select>
              </div>

              {/* Summary */}
              <div className="w-full flex flex-col gap-5">
                <p className="font-medium text-sm leading-6 mb-0">Summary</p>
                <textarea
                  placeholder="Start Typing..."
                  value={formData.summary}
                  onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
                  rows="6"
                />
              </div>
            </div>
          </div>
        </div>
        <hr className="border-t border-[#B7B7B7]" />
        <div className="flex flex-col gap-5">
          <div className="flex justify-between">
            <h1 className="w-[35%] font-semibold text-[14px] leading-[100%] tracking-[0%]">Clinical Notes & Recommendations</h1>
            <div className="flex-1 flex flex-col gap-3">
              {/* Clinical Notes & Recommendations */}

              {/* Render existing notes */}
              {formData.clinicalNotes.map((answer, answerIndex) => {
                const editKey = answerIndex;
                const isEditing = editingRecomandations === editKey;
                return (
                  <div key={answerIndex} className="w-full flex items-start justify-between">
                    <div className="flex gap-3 items-start flex-1">
                      <div className="rounded-full w-[10px] h-[10px] bg-[#5389FF] mt-1"></div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editRecomandationsValue}
                          onChange={e => setEditRecomandationsValue(e.target.value)}
                          className="flex-1 border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] focus:outline-none"
                          onKeyPress={e => {
                            if (e.key === 'Enter') {
                              saveEditRecomandations(answerIndex);
                            }
                            if (e.key === 'Escape') {
                              cancelEditRecomandations();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <p className="mb-0 font-normal text-sm leading-6 flex-1">{answer}</p>
                      )}
                    </div>
                    <div className="flex gap-3 items-center">
                      {isEditing ? (
                        <>
                          {/* Save button */}
                          <button onClick={() => saveEditRecomandations(answerIndex)} className="cursor-pointer" title="Save">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#22c55e" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </button>
                          {/* Cancel button */}
                          <button onClick={cancelEditRecomandations} className="cursor-pointer" title="Cancel">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Remove button */}
                          <button onClick={() => removeRecomandations(answerIndex)} className="cursor-pointer" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </button>
                          {/* Edit button */}
                          <button onClick={() => startEditRecomandations(answerIndex, answer)} className="cursor-pointer" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                              <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Input for new notes - Always show */}
              <div className="w-full flex gap-4 items-center justify-between">
                <input
                  type="text"
                  placeholder="Add Notes"
                  value={newRecomandationsValue}
                  onChange={e => setNewRecomandationsValue(e.target.value)}
                  className="w-full border border-[#D5D9E2] rounded-[8px] px-4 py-[10px] text-sm leading-6 font-normal text-gray-900 font-[Inter] placeholder-gray-400 focus:outline-none"
                />
                <button onClick={() => addRecomandations()} className="w-[22px] h-[22px] cursor-pointer">
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
        </div>
      </div>

      <hr className="border-t border-[#B7B7B7]" />

      <div className="mb-[50px] flex justify-center items-center gap-5">
        <button
          type="button"
          className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap"
          onClick={() => router.back()}
        >
          Close
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveChanges}
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
