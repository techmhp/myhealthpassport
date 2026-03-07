import React from 'react';
import { formatString } from '@/helpers/utilities';
import InlineSpinner from '../UI/InlineSpinner';

const Footer = ({ userInfo }) => {

  return (
    <div className="mt-14">
      <footer className="bg-white fixed bottom-0 left-0 w-full py-2 px-2 flex justify-between items-center border-t border-[#B3CBFF] shadow-[0px_-1px_5px_0px_rgba(85,85,85,0.25)] z-50">
        <div></div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] leading-[25px] tracking-[0]">{userInfo && userInfo.first_name ? formatString(`${userInfo.first_name} ${userInfo.last_name}`?.toLowerCase()) : <InlineSpinner />}</span>
          <span className="text-gray-500">|</span>
          <span className="font-normal text-[14px] leading-[100%] tracking-[0]">{userInfo.user_role ? formatString(userInfo.user_role?.toLowerCase()) : <InlineSpinner />}</span>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
