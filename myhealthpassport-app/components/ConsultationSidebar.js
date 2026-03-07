"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatFullName, isValidUrl } from '@/helpers/utilities';


const ConsultationSidebar = ({ children, setPatient }) => {
  const [selected, setSelected] = useState(null);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const onSelectPatient = (child) => {
    setSelected(child.student_id);
    setPatient(child);
  }

  return (
    <div className="pr-0 lg:pr-4">
      <h2 className="font-medium text-sm leading-[100%] tracking-[0] mb-3 sm:mb-5">Select children</h2>
      <div className="flex flex-col gap-3 sm:gap-4">
        {Object.keys(children).length > 0 ?
          children.map((child, index) => (
            <div key={index} onClick={() => onSelectPatient(child)}
              className={classNames(selected === child.student_id ? "border-2 border-[#5389FF]" : "border border-gray-400", "flex items-center gap-x-2 p-3 sm:p-4 rounded-lg hover:border-2 hover:border-[#5389FF]")}>
              <Image alt="profile" src={isValidUrl(child.image) ? child.image : "/iconx/profile-image.svg"} className="size-10 sm:size-12 rounded-full" width={70} height={70} />
              <div>
                <h3 className="text-sm tracking-tight text-gray-900">{formatFullName(child)}</h3>
              </div>
            </div>
          ))
          : ''}
      </div>
    </div>
  );
};

export default ConsultationSidebar;
