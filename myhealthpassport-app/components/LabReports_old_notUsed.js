import React from "react";
import Image from "next/image";

const labFindings = [
  {
    label: "Complete Blood Count (CBC):",
    description:
      "1. Low RBC Count (4.21 mill/L) and pale nail beds indicate possible iron deficiency anemia.\n2. High RDW (15.4%) suggests variability in RBC size, often associated with nutritional deficiencies like Iron or Vitamin B12.",
    status: "check",
  },
  {
    label: "Biochemical Profile:",
    description:
      "1. Vitamin D Deficiency (18.7 ng/mL): Confirmed deficiency requiring immediate intervention.\n2. Elevated TSH (7.950 μIU/mL): Suggests hypothyroidism that warrants further thyroid evaluation and management.",
    status: "check",
  },
];

const analysisItems = [
  {
    description:
      "The combination of low RBC, high RDW, and pale nail beds points to nutritional deficiencies in iron and possibly Vitamin B12.",
    status: "check",
  },
  {
    description:
      "Elevated TSH suggests hypothyroidism, which may contribute to symptoms like fatigue or weight fluctuations.",
    status: "check",
  },
  {
    description:
      "Vitamin D deficiency is evident and may lead to muscle weakness, bone pain, or growth concerns if untreated.",
    status: "check",
  },
  {
    description:
      "Elevated glucose and lipid levels indicate a potential risk for metabolic syndrome, emphasizing the need for lifestyle and dietary changes.",
    status: "check",
  },
];

const LabReports = () => {
  return (
    <div className="w-full flex flex-col gap-10 p-8 rounded-bl-lg rounded-br-lg border-t-0 border-r border-b border-l border-solid border-gray-200">
      <div className="space-y-10">
        {/* A. Lab Reports Section */}
        <h2 className="font-semibold text-[16px] leading-[100%] tracking-normal text-[#5389FF]">
          A. Lab Reports
        </h2>
        <div className="space-y-4">
          {[
            "Blood Test Report - Devansh Aurora - XXXXXXXX6789",
            "Urinalysis Report - Devansh Aurora - XXXXXXXX6789",
            "Serology Report - Devansh Aurora - XXXXXXXX6789",
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center w-[1039px] h-[50px] gap-[16px] rounded-[10px] border border-[#BDD2FF] p-[10px] bg-[#FAFBFF]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5389FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="font-medium text-[14px] leading-[24px] tracking-normal">
                {report}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* B. Findings Section */}

      <h2 className="font-semibold text-[16px] leading-[100%] tracking-normal text-[#5389FF]">
        B. Findings
      </h2>

      {/* Key Findings */}
      <div className="space-y-7">
        <div className="w-full flex justify-between items-start">
          <div className="w-2/5 flex flex-col gap-5">
            <div>
              <Image
                src="/emotional-health/general.svg"
                alt="emotional"
                width={22}
                height={22}
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">
                Key Findings
              </h3>
            </div>
          </div>
          <div className="w-3/5">
            <div className="flex flex-col gap-3">
              {labFindings.map((finding, index) => (
                <div key={index} className="flex items-start gap-3 p-3">
                  <div className="pt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="#5389FF"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-sm">
                      {finding.label}{" "}
                    </span>
                    <span className="text-sm font-normal">
                      {finding.description.split("\n").map((item, i) => (
                        <div key={i} className="ml-4 mt-1">
                          {item}
                        </div>
                      ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-t border-gray-300" />

        {/* Analysis Section */}
        <div className="w-full flex justify-between items-start">
          <div className="w-2/5 flex flex-col gap-5">
            <div>
              <Image
                src="/emotional-health/general.svg"
                alt="emotional"
                width={22}
                height={22}
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Analysis</h3>
            </div>
          </div>
          <div className="w-3/5">
            <div className="flex flex-col gap-3">
              {analysisItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="pt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="#5389FF"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-normal">
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-t border-gray-300" />
      </div>
    </div>
  );
};

export default LabReports;
