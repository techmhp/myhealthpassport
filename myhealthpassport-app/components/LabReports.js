import { useState } from 'react';
import Image from 'next/image';

const LabReports = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-gray-200">
      <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
        <div className="w-full flex justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-2 h-auto sm:h-[44px]">
            <span className="font-inter font-normal text-xs leading-4 tracking-[0%] text-[#656565] mb-2 sm:mb-0">Select Month</span>
            <div className="relative w-full sm:w-auto">
              <select
                className="h-[44px] w-full min-w-[290px] px-4 py-[10px] border border-[#D5D9E2] rounded-lg appearance-none text-[#656565] font-inter font-normal text-xs leading-4 tracking-[0%]"
                defaultValue="March"
              >
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#656565]">
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Report Items */}
        <div className="w-full flex flex-col gap-[20px] sm:gap-[30px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
            {/* Left Div */}
            <div className="flex flex-col gap-3 sm:gap-5 mb-4 sm:mb-0">
              <img src="/detailed-reports-icons/document2.svg" alt="icon" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px]" />
              <span className="font-inter font-semibold text-sm leading-[100%] tracking-[0%] text-[#000000]">Blood Test Report - January 2025 </span>
            </div>

            {/* Right Div */}
            <div className="flex flex-col items-center gap-[11px] w-full sm:w-auto">
              {/* Button 1 */}
              <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] border border-[#5465FF] rounded-[5px]">
                <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#000000]" onClick={openModal}>
                  View Key Findings
                </span>
              </button>

              {/* Button 2 */}
              <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] bg-[#5465FF] rounded-[5px]">
                <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#FFFFFF]">View Report</span>
              </button>
            </div>
          </div>
          <hr className="border border-solid border-[#B7B7B7]" />
        </div>

        <div className="w-full flex flex-col gap-[20px] sm:gap-[30px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
            {/* Left Div */}
            <div className="flex flex-col gap-3 sm:gap-5 mb-4 sm:mb-0">
              <img src="/detailed-reports-icons/document2.svg" alt="icon" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px]" />
              <span className="font-inter font-semibold text-sm leading-[100%] tracking-[0%] text-[#000000]">Blood Test Report - January 2025 </span>
            </div>

            {/* Right Div */}
            <div className="flex flex-col items-center gap-[11px] w-full sm:w-auto">
              {/* Button 1 */}
              <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] border border-[#5465FF] rounded-[5px]">
                <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#000000]" onClick={openModal}>
                  View Key Findings
                </span>
              </button>

              {/* Button 2 */}
              <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] bg-[#5465FF] rounded-[5px]">
                <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#FFFFFF]">View Report</span>
              </button>
            </div>
          </div>
          <hr className="border border-solid border-[#B7B7B7]" />
        </div>

        <div className="w-full flex flex-col gap-[20px] sm:gap-[30px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
            {/* Left Div */}
            <div className="flex flex-col gap-3 sm:gap-5 mb-4 sm:mb-0">
              <img src="/detailed-reports-icons/document2.svg" alt="icon" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px]" />
              <span className="font-inter font-semibold text-sm leading-[100%] tracking-[0%] text-[#000000]">Blood Test Report - January 2025 </span>
            </div>

            {/* Right Div */}
            <div className="flex flex-col items-center gap-[11px] w-full sm:w-auto">
              {/* Button 1 */}
              <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] border border-[#5465FF] rounded-[5px]">
                <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#000000]" onClick={openModal}>
                  View Key Findings
                </span>
              </button>

              {/* Button 2 */}
              <button className="w-full sm:w-[214px] h-[37px] px-4 sm:px-5 py-[10px] flex items-center justify-center gap-[10px] bg-[#5465FF] rounded-[5px]">
                <span className="font-normal text-sm leading-[100%] tracking-[0%] text-center text-[#FFFFFF]">View Report</span>
              </button>
            </div>
          </div>
          <hr className="border border-solid border-[#B7B7B7]" />
        </div>
      </div>

      {/* Key Findings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#2423239e] bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-xl shadow-lg relative my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {/* Modal Header with more visible close button */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 relative">
                <div className="flex gap-2 sm:gap-3 items-center">
                  <Image src="/detailed-reports-icons/apple.svg" alt="icon" width={20} height={20} />
                  <h2 className="text-sm sm:text-md font-semibold m-0 p-0">Key Findings</h2>
                </div>

                <div onClick={closeModal} className="cursor-pointer">
                  <Image src="/health-records/cross-red.svg" width={16} height={16} alt="cross" />
                </div>
              </div>

              {/* Modal Body - Key Findings List */}
              <div className="space-y-3 sm:space-y-4">
                {/* Blue checkmark items */}
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
                    <strong>Nails:</strong> Beau's lines are linked to Protein or Zinc deficiency, while pale nail beds indicate Iron or Vitamin B12 deficiency.
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

                {/* Orange warning items */}
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
      )}
    </div>
  );
};

export default LabReports;
