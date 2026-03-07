'use client';
import React, { useState } from 'react';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import AddTeacherForm from '@/components/Teacher/AddTeacherForm';
import BulkImport from '@/components/Teacher/BulkImport';

const AddTeacher = () => {
  const tabs = [
    { name: 'Bulk Import', href: '#', id: 'Bulk-Import' },
    { name: 'Individual Teacher', href: '#', id: 'Individual-Teacher' },
  ];

  const [activeTab, setActiveTab] = useState('Bulk-Import');

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Bulk-Import':
        return (
          <div className="bg-white rounded-lg">
            <BulkImport />
          </div>
        );
      case 'Individual-Teacher':
        return (
          <div className="bg-white rounded-lg">
            <AddTeacherForm />
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <Header />
      <div className="px-[90px] py-[27px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: 'Add Teacher',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Teachers"
            homeHref="/school-admin/teachers"
          />
        </div>
        <div className="flex items-center justify-center mt-[17px] mb-[27px]">
          <div className="flex space-x-1 overflow-x-auto gap-2.5 rounded-lg border border-[#ECF2FF] p-1.5">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={classNames(
                  activeTab === tab.id ? 'text-[#000000] bg-[#ECF2FF]' : 'text-gray-500 hover:text-gray-700',
                  'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer'
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        {renderTabContent()}
      </div>
    </>
  );
};

export default AddTeacher;
