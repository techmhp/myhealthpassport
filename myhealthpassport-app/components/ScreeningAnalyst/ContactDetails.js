import React from 'react';

const ContactDetails = ({ parentDetails }) => {
  const primaryContact = {
    name: [parentDetails?.primary_first_name, parentDetails?.primary_middle_name, parentDetails?.primary_last_name].filter(Boolean).join(' ') || 'N/A',
    mobile: parentDetails?.primary_mobile || 'N/A',
    email: parentDetails?.primary_email || 'N/A',
  };

  const secondaryContact = {
    name: [parentDetails?.secondary_first_name, parentDetails?.secondary_middle_name, parentDetails?.secondary_last_name].filter(Boolean).join(' ') || 'N/A',
    mobile: parentDetails?.secondary_mobile || 'N/A',
    email: parentDetails?.secondary_email || 'N/A',
  };

  const hasSecondaryContact = parentDetails?.secondary_first_name || parentDetails?.secondary_mobile || parentDetails?.secondary_email;

  return (
    <div className="w-full flex flex-col gap-11">
      {/* Contact Cards */}
      <div className="flex w-full justify-between gap-5">
        {/* Primary Contact */}
        <div className="relative w-full max-w-lg rounded-lg border border-[#B3CBFF] flex justify-between items-center p-5">
          <div className="absolute -top-3 left-4 px-2 bg-white text-sm font-medium">Primary Contact</div>
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-3.5">
              <div className="bg-blue-400 rounded-full w-10 h-10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="size-10">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-base">{primaryContact.name}</h3>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                  <path
                    fillRule="evenodd"
                    d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-700">{primaryContact.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                  <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                  <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                </svg>
                <span className="text-sm text-gray-700">{primaryContact.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Contact */}
        {hasSecondaryContact && (
          <div className="relative w-full max-w-lg rounded-lg border border-[#B3CBFF] flex justify-between items-center p-5">
            <div className="absolute -top-3 left-4 px-2 bg-white text-sm font-medium">Secondary Contact</div>
            <div className="flex w-full justify-between items-center">
              <div className="flex items-center gap-3.5">
                <div className="bg-blue-400 rounded-full w-10 h-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="size-10">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base">{secondaryContact.name}</h3>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                    <path
                      fillRule="evenodd"
                      d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{secondaryContact.mobile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
                    <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                    <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                  </svg>
                  <span className="text-sm text-gray-700">{secondaryContact.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      {/* <hr className="border-t border-[#B7B7B7]" /> */}

      {/* Form Section */}
      {/* <div className="flex w-full justify-between items-center gap-30">
        <div className="flex flex-col gap-[23px]">
          <div className="flex flex-col gap-[15px]">
            <span className="font-medium text-sm leading-[100%]">Who are you contacting?</span>
            <input
              type="select"
              placeholder="Your input here"
              className="w-[360px] h-[44px] min-w-[298px] px-4 py-[10px] border border-[#D5D9E2] rounded-[8px] text-sm leading-[24px] font-[Inter] font-normal text-gray-900 focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center">
            <button className="px-5 py-3 bg-[#5465FF] rounded-md font-normal text-sm text-[#FFFFFF]">Start Recording</button>
            <button className="px-5 py-3 rounded-md font-normal text-sm text-[#FF5454] bg-transparent border border-[#FF5454]">Stop Recording</button>
          </div>
        </div>
        <div className="w-full">
          <div className="w-full flex flex-col gap-5">
            <p className="font-medium text-sm leading-6 mb-0">Additional Notes</p>
            <textarea
              placeholder="Enter your text"
              className="min-w-[298px] border border-gray-300 rounded-[8px] px-4 py-[10px] text-sm leading-6 focus:outline-none resize-none"
              rows="6"
            ></textarea>
          </div>
        </div>
      </div> */}

      {/* <hr className="border-t border-[#B7B7B7]" />
      <div className="mb-[50px] flex justify-center items-center gap-5">
        <button className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap">Close</button>
        <button
          type="button"
          className="rounded-[5px] bg-indigo-500 h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 whitespace-nowrap"
        >
          Save changes
        </button>
      </div> */}
    </div>
  );
};

export default ContactDetails;
