import React from 'react';

const FilterSection = ({ searchQuery = '', onSearchChange = () => {} }) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-[80%] flex gap-[70px] items-center justify-center">
        <div className="">
          {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg> */}
        </div>
        <div className="w-full flex gap-5 items-center">
          <div className="flex flex-1 gap-[10px]">
            <div className="w-full grid grid-cols-1">
              <input
                id="search"
                name="search"
                type="search"
                placeholder="search"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                autoComplete="off"
                className="w-full col-start-1 row-start-1 block rounded-[5px] p-[10px] bg-white pr-3 text-base text-gray-900 outline-1 -outline-offset-1 border-[#B5CCFF] outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#5389FF"
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 ml-3 size-4 self-center text-gray-400 sm:size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          {/* <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5389FF" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
            </svg>
          </div> */}
          {/* <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5389FF" className="size-6">
              <path d="M6 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 1 1 1.5 0v7.5A.75.75 0 0 1 6 12ZM18 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 18 12ZM6.75 20.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM18.75 18.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0ZM12.75 5.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM12 21a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 12 21ZM3.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM12 11.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM15.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
            </svg>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
