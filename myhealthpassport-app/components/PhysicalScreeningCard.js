import Image from 'next/image';

const PhysicalScreeningCard = () => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/physical-screening.svg" alt="phy" width={30} height={27} />
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Physical Screening</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
              <Image src="/health-records/right-symbol.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">Normal</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[#60A5FA] bg-[#EFF6FF] px-2 py-1">
              <Image src="/health-records/pulse.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#007AFF]">Normal</span>
            </div>
          </div>

          {/* Content */}
          <p className="font-inter font-normal text-[14px] leading-[24px] tracking-[0%]">
            Your child has a healthy BMI of 17.8, with well-balanced muscle and fat composition. No concerns were noted in general physical development. Regular
            physical activity is encouraged to maintain good health.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/apple.svg" alt="nutrition" width={30} height={30} />
          </div>
          <p className="font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Nutritional Report</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
              <Image src="/health-records/right-symbol.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">Normal</span>
            </div>
          </div>

          {/* Content */}
          <p className="font-inter font-normal text-[14px] leading-[24px] tracking-[0%]">
            Your child has a balanced diet, with adequate protein and hydration levels. However, a slight deficiency in calcium intake was noted. Adding dairy
            products or calcium-rich foods will help support bone health.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/imoji-face.svg" alt="emotional" width={30} height={30} />
          </div>
          <p className="font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">
            Developmental & <br /> Emotional Assessment
          </p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
              <Image src="/health-records/right-symbol.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">Normal</span>
            </div>
          </div>

          {/* Content */}
          <p className="font-inter font-normal text-[14px] leading-[24px] tracking-[0%]">
            No significant behavioral or emotional concerns detected. Your child demonstrates good cognitive and social skills, with healthy emotional
            regulation. Encouraging creative play and social interaction will support continued development.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/vision.svg" alt="vision" width={30} height={30} />
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Vision Screening</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex items-center gap-1 rounded-full border border-[#CA8A04] bg-[#FEFCE8] px-2 py-1">
              <Image src="/health-records/warning.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#CA8A04]">Needs Monitoring</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
              <Image src="/health-records/right-symbol.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">Normal</span>
            </div>
          </div>

          {/* Content */}
          <p className="font-inter font-normal text-[14px] leading-[24px] tracking-[0%]">
            Mild astigmatism detected in the right eye. No immediate correction is required, but we recommend a follow-up with an optometrist in the next 3-6
            months for further assessment.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/teeth.svg" alt="dental" width={30} height={30} />
          </div>
          <p className="font-inter font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Dental Screening</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex items-center gap-1 rounded-full border border-[#DC2626] bg-[#FEF2F2] px-2 py-1">
              <Image src="/health-records/alert.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#DC2626]">Needs Attention</span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
              <Image src="/health-records/right-symbol.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">Normal</span>
            </div>
          </div>
          {/* Content */}
          <p className="font-inter font-normal text-[14px] leading-[24px] tracking-[0%]">
            Cavities detected in three molars (37, 47, 46) with signs of early enamel erosion. A dental check-up is recommended to prevent further decay.
            Regular flossing and limiting sugary foods can help improve oral health.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row rounded-[10px] border border-[#BDD2FF] bg-white p-7">
        {/* Left container with fixed width */}
        <div className="flex flex-col md:w-[200px] items-start justify-center gap-[15px]">
          <div>
            <Image src="/detailed-reports-icons/microscope.svg" alt="lab" width={30} height={30} />
          </div>
          <p className="font-medium text-[14px] leading-[24px] text-left whitespace-nowrap">Lab Reports</p>
        </div>

        {/* Divider with fixed position */}
        <div className="w-full h-[1.5px] md:h-auto md:w-[1.5px] my-4 md:my-0 bg-[#BDD2FF]"></div>

        {/* Right container with badges and content */}
        <div className="flex flex-col gap-[15px] mt-4 md:mt-0 md:pl-6 md:flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex items-center gap-1 rounded-full border border-[#4ADE80] bg-[#F0FDF4] px-2 py-1">
              <Image src="/health-records/right-symbol.svg" alt="warning" width={16} height={16} />
              <span className="font-normal text-[12px] leading-[22px] tracking-[0] text-[#16A34A]">Normal</span>
            </div>
          </div>

          {/* Content */}
          <p className="font-inter font-normal text-[14px] leading-[24px] tracking-[0%]">
            All standard lab parameters are within normal range. No signs of infection, anemia, or nutritional deficiencies were detected. Continued monitoring
            through annual checkups is advised to ensure sustained good health.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhysicalScreeningCard;
