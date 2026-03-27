'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import HealthScoreGauge from '../HealthScoreGauge';
import Image from 'next/image';
import CommentsModal from '../UI/CommentsModal';
import nookies from 'nookies'
import { updateMedicalReportStatus } from '@/services/secureApis';
import { useParams, useRouter } from 'next/navigation';
import { stringToArray, toastMessage } from '@/helpers/utilities';


const PhysicalScreeningReport = ({ data, medical_data = {} }) => {
  const router = useRouter();
  const cookies = nookies.get();
  const results = data ? data : {};
  const medicalResults = medical_data ? medical_data : {};
  const { schoolid, studentId } = useParams();
  const [userRole, setUserRole] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState(medicalResults?.remarks || '');
  const ignoreKeys = ["status", "overall_summary", "physical_screening_report", "id", "student_id", "school_id"];
  const isEmpty =
    Object.entries(results).filter(([key]) => !ignoreKeys.includes(key)).every(([_, value]) => {
      return value === 0 || value === null || value === "";
    });

  useEffect(() => {
    setUserRole(cookies.role);
  }, []);

  // Medical Officer add remarks section start
  const handleModelOpenAction = () => {
    setIsModalOpen(true);
  };

  // Close the modal if cancelled
  const handleCancelAction = () => {
    setIsModalOpen(false);
  };

  const saveAndVerifyAction = async (e) => {
    e.preventDefault();
    const status = 'verified';
    updateMedicalReport(status);
  }

  const handleConfirmAction = async (e) => {
    const status = 'remarks';
    updateMedicalReport(status);
  }

  const updateMedicalReport = async (status) => {
    setIsSubmitting(true);

    const postObj = {
      student_id: parseInt(studentId),
      school_id: parseInt(schoolid),
      medical_screening_statuses: {
        medical_officer_status_type: 'physical_screening_status',
        status: status,
        remarks: status === 'remarks' ? remarks : ''
      }
    }
    try {
      const response = await updateMedicalReportStatus(JSON.stringify(postObj));
      if (response.status === true) {
        toastMessage(response.message, 'success');
      } else if (response.status === false) {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      toastMessage(err.message || 'An error occurred while updating data', 'error');
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      router.refresh();
    }
  };
  // Medical Officer add remarks section end

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'check':
        return (
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#5389FF" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <Image src="/health-records/warning.svg" width={16} height={16} alt="Warning" className="w-4 h-4" />
          </div>
        );
      case 'star':
        return (
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#88D993" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {Object.keys(results).length > 0 ? (
        <>
          <div className="flex flex-col mt-5 md:flex-row rounded-[10px] border border-white bg-[#FFF3F5] p-7">
            {/* Left container with fixed width */}
            <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
              <div>
                <Image src="/detailed-reports-icons/physical-screening-report.svg" alt="phy" width={30} height={27} />
              </div>
              <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Overall Summary</p>
            </div>

            {/* Divider with fixed position */}
            <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#FF7F95]"></div>

            {/* Right container with badges and content */}
            <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-[20px]">
                {results.status !== null ?
                  results.status === "need_attention" ?
                    <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
                      <Image src="/health-records/alert.svg" alt={results.status} width={16} height={16} />
                      <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Need Attention</span>
                    </div>
                    : results.status === "all_good" ?
                      <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
                        <Image src="/health-records/right-symbol.svg" alt={results.status} width={16} height={16} />
                        <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">All Good</span>
                      </div>
                      : results.status === 'need_monitoring' ?
                        <div className="flex items-center gap-1 rounded-full border border-[#FB923C] bg-[#FEF2F2] px-2 py-1">
                          <Image src="/health-records/warning.svg" alt={results.status} width={16} height={16} />
                          <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#CA8A04]">Need Monitoring</span>
                        </div>
                        : ''
                  : ''
                }
              </div>
              {/* Content */}
              <div className='leading-[26px]'>
                {results.overall_summary ?
                  stringToArray(results.overall_summary).map((item, index) => (
                    <p key={index} className="font-inter font-normal text-[14px] tracking-[0%] mb-2">{item}.</p>
                  ))
                  : "N/A"}
              </div>
            </div>
          </div>
          {isEmpty === false ?
            <div className="w-full flex flex-col gap-6 md:gap-8 lg:gap-10 p-4 md:p-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-8 rounded-bl-lg rounded-br-lg ">
              <div className="flex flex-col gap-3 md:gap-4 lg:gap-5">
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Health Score</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                    <p>{results.physical_score}/100</p>
                  </div>
                  <HealthScoreGauge score={results.physical_score} />
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 1.Basic Anthropometrics */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Basic Anthropometrics</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.height_cm} cm</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Height (cm)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.age_years} years</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Age (years)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{dayjs(results.weighing_time).format('DD/MM/YYYY HH:mm:ss')}</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Weighing time</p>
                    </div>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.body_weight_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body weight (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.bmi}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">BMI</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.physical_age} years</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Physical age</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.body_type}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body type</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.standard_body_weight}</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Standard body weight</p>
                    </div>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.ideal_weight}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Ideal Weight</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 2.Body Composition Analysis */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Body Composition Analysis</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  {userRole !== 'PARENT' ?
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.body_fat_rate_percent}%</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body fat rate (%)</p>
                    </div>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.fat_content_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Fat content (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.lean_body_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Lean body mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Muscle mass (kg)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.muscle_rate_percent}%</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Muscle rate (%)</p>
                    </div>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.skeletal_muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Skeletal muscle mass (Kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.skeletal_muscle_mass_index}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Skeletal muscle mass index</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.bone_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Bone mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.protein_content_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Protein content (kg)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.internal_protein_rate_percent}%</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Internal protein rate (%)</p>
                    </div>
                    : ''}
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 3.Fat Distribution & Regional Composition */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Fat Distribution & Regional Composition</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.subcutaneous_fat_volume_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Subcutaneous fat volume (kg)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.subcutaneous_fat_rate}%</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Subcutaneous fat rate</p>
                    </div>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.visceral_fat_level}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Visceral fat level</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_fat_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left Hand Fat Mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_fat_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right Hand Fat Mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_foot_fat_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left Foot Fat Mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_fat_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right Foot Fat Mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_fat_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk Fat Mass (kg)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_fat_rate_percent}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left hand fat rate (%)</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_fat_rate_percent}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right hand fat rate (%)</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.left_foot_fat_rate_percent}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left foot fat rate (%)</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_fat_rate_percent}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right foot fat rate (%)</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_fat_rate_percent}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk fat rate (%)</p>
                      </div>
                    </>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.whr}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">WHR (Waist-Hip Ratio)</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>


              {/* 4.Muscle Mass & Strength Distribution */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Muscle Mass & Strength Distribution</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left hand muscle mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right hand muscle mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.left_foot_muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left foot muscle mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right foot muscle mass (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_muscle_mass_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk muscle mass (kg)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.left_hand_muscle_rate}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left hand muscle rate</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.right_hand_muscle_rate}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right hand muscle rate</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.left_leg_muscle_rate}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Left leg muscle rate</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.right_foot_muscle_rate}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Right foot muscle rate</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.trunk_muscle_rate}%</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Trunk muscle rate</p>
                      </div>
                    </>
                    : ''}
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.skeletal_muscle_rate_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Skeletal muscle rate (%)</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 5.Hydration & Cellular Health */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Hydration & Cellular Health</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.water_content_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Water content (kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.body_moisture_content_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body moisture content (%)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.inorganic_salt_content_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Inorganic salt content (Kg)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.body_cell_volume_kg} kg</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Body cell volume (kg)</p>
                  </div>
                  {userRole !== 'PARENT' ?
                    <>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.extracellular_water_volume_kg} kg</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Extracellular water volume (kg)</p>
                      </div>
                      <div className="space-y-[10px]">
                        <p className="font-medium text-sm leading-none tracking-normal">{results.intracellular_water_volume_kg} kg</p>
                        <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Intracellular water volume (kg)</p>
                      </div>
                    </>
                    : ''}
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 6.Metabolic Health Indicators */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Metabolic Health Indicators</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.bmr}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">BMR (Basal Metabolic Rate)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.obesity_percent}%</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Obesity (%)</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.obesity_level}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Obesity level</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 7.Metabolic & Fitness Control Indicators */}
              {userRole !== 'PARENT' ?
                <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                  {/* Header */}
                  <div className="flex justify-between items-center h-[30px]">
                    <div className="flex gap-2.5">
                      <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Metabolic & Fitness Control Indicators</h2>
                      <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.fat_control_quantity}</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Fat control quantity</p>
                    </div>
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.weight_control_quantity}</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Weight control quantity</p>
                    </div>
                    <div className="space-y-[10px]">
                      <p className="font-medium text-sm leading-none tracking-normal">{results.muscle_control_quantity}</p>
                      <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Muscle control quantity</p>
                    </div>
                  </div>
                  <hr className="border-t border-[#B7B7B7]" />
                </div>
                : ''}

              {/* 8.Cardiovascular & Circulatory Indicators */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Cardiovascular & Circulatory Indicators</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.heart_rate_beats_min}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Heart rate (beats/min)</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>

              {/* 9.Overall Health Scores */}
              <div className="flex flex-col gap-4 md:gap-4 lg:gap-5">
                {/* Header */}
                <div className="flex justify-between items-center h-[30px]">
                  <div className="flex gap-2.5">
                    <h2 className="font-Inter font-semibold text-sm leading-none tracking-normal">Overall Health Scores</h2>
                    <span className="border border-gray-400 rounded-full w-[14px] h-[14px] flex items-center justify-center text-gray-500 text-xs">i</span>
                  </div>
                </div>
                {/* Body */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6 lg:gap-[60px]">
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.physical_score}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Physical score</p>
                  </div>
                  <div className="space-y-[10px]">
                    <p className="font-medium text-sm leading-none tracking-normal">{results.health_level}</p>
                    <p className="font-normal text-xs leading-none tracking-normal text-[#858585]">Health level</p>
                  </div>
                </div>
                <hr className="border-t border-[#B7B7B7]" />
              </div>
            </div>
            : <div className="w-full flex justify-center items-center h-[200px]">
              <p className="text-gray-500">No smart scale data available for this student.</p>
            </div>
          }
          {results.physical_screening_report && (
            <div className="space-y-5 sm:space-y-7.5">
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="w-full sm:w-2/5 flex flex-col gap-3 sm:gap-5 m-5">
                  <div>
                    <Image src="/detailed-reports-icons/physical-screening-analysis.svg" alt="nutritional" width={22} height={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Strengths</h3>
                  </div>
                </div>
                <div className="w-full sm:w-3/5">
                  <div className="flex flex-col gap-3">
                    {results.physical_screening_report.strengths.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status='check' />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="w-full sm:w-2/5 flex flex-col gap-3 sm:gap-5 m-5">
                  <div>
                    <Image src="/detailed-reports-icons/physical-screening-attantion.svg" alt="nutritional" width={22} height={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Need Attention</h3>
                  </div>
                </div>
                <div className="w-full sm:w-3/5">
                  <div className="flex flex-col gap-3">
                    {results.physical_screening_report.needs_attention.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start sm:items-center justify-start gap-3">
                        <StatusIcon status='warning' />
                        <div>
                          <span className="text-sm font-normal">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#B7B7B7]" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full flex justify-center items-center h-[200px]">
          <p className="text-gray-500">No smart scale data available for this student.</p>
        </div>
      )}
      {remarks && (
        <div className="w-full space-y-5 sm:space-y-7.5 pl-5 py-5 mt-5 bg-[#FFF3E5] rounded-[8px]">
          <div className='flex gap-5'>
            <h3 className="font-semibold text-sm text-gray-900">Medical Officer Remarks:</h3>
            <span className='text-red-500 text-sm font-normal'>{remarks}</span>
          </div>
        </div>
      )}
      {
        userRole === 'MEDICAL_OFFICER' ?
          <>
            <div className="mb-5 mt-5 flex justify-center items-center gap-5">
              <button
                type="button"
                onClick={handleModelOpenAction}
                className="font-normal cursor-pointer py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap disabled:opacity-50"
              >
                Add Remarks
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={saveAndVerifyAction}
                className="rounded-[5px] cursor-pointer bg-indigo-500 px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? 'Submitting...' : 'Verify & Save'}
              </button>
            </div>
            <CommentsModal
              isOpen={isModalOpen}
              onClose={handleCancelAction} // Use cancel handler for closing from overlay/X button
              onConfirm={handleConfirmAction}
              title="Add Remarks"
              remarks={remarks}
              setRemarks={setRemarks}
              confirmText="Sumbit"
              cancelText="Close"
            />
          </>
          : ''
      }
    </div >
  );
};

export default PhysicalScreeningReport;
