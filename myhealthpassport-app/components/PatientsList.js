import Link from 'next/link';
import { formatFullName } from '@/helpers/utilities';


const PatientsList = ({ patients }) => {
  return (
    <div className="w-full flex flex-col gap-8 ">
      <div className="w-full overflow-x-auto">
        <table
          className="w-full border border-solid border-[#B5CCFF] rounded"
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: '4px',
          }}
        >
          <thead>
            <tr className="bg-[#ECF2FF]">
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Serial No.
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Name
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Phone Number
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Gender
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF]">
                Age
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(patients).length > 0 ?
              patients.map((patient, index) => (
                <tr key={index} className="bg-white">
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {patient.serial_no}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    <Link href={`/expert/patients/${patient.id}`}>{formatFullName(patient)}</Link>
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    +91 {patient.phone}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {patient.gender}
                  </td>
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {patient.age}
                  </td>
                </tr>
              ))
              : <tr>
                <td colSpan={5} className='text-center text-gray-500 text-sm font-normal'>No data found</td>
              </tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientsList;
