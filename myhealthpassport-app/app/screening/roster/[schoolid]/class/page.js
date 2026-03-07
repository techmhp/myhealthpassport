'use client';

import { useState } from 'react';

import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import CardView from '@/components/CardView';
import TableView from '@/components/TableView';

const Section = () => {
  const tabs = [
    { name: 'Table View', href: '#', id: 'Table View' },
    {
      name: 'Card View',
      href: '#',
      id: 'Card View',
    },
  ];

  const [activeTab, setActiveTab] = useState('Table View');

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Table View':
        return (
          <div className="bg-white rounded-lg">
            <TableView />
          </div>
        );
      case 'Card View':
        return (
          <div className="bg-white rounded-lg">
            <CardView />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-6.5 px-[146px]">
        <div className="">
          <Breadcrumbs
            items={[
              {
                name: 'View All Students',
                href: '#',
                current: true,
              },
            ]}
            homeLabel="Roster"
            homeHref="/analysiscrew/roster"
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

export default Section;
