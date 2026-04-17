'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import nookies from 'nookies';
import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel, Popover, PopoverButton, PopoverGroup, PopoverPanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MenuItems } from '@/helpers/roleBasedMenuItems';
import { childrenList } from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import DisplayNameWithRole from '@/helpers/loginUserDisplayName';

const BookItems = [
  {
    name: 'Book Lab Tests',
    href: '/parent/book/lab-tests',
    description: 'Schedule laboratory tests and diagnostics',
  },
  {
    name: 'Expert Consultation',
    href: '/parent/book/expert-consultation',
    description: 'Book appointments with healthcare professionals',
  },
];

const ROSTER_NO_NAVIGATION_ROLES = ['REGISTRATION_TEAM', 'CAMP_COORDINATOR', 'HEALTH_BUDDY'];
// const ROSTER_WITH_NAVIGATION_ROLES = ['ADMIN_TEAM'];

export default function Header() {
  const cookies = nookies.get();
  const pathname = usePathname();
  const [childsList, setChildsList] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [root, setRoot] = useState('');
  const [loginUser, setLoginUser] = useState({});
  const isActive = href => pathname.startsWith(href);

  useEffect(() => {
    setRoot(cookies.root);
    const base64LoginUser = localStorage.getItem('user_info');
    if (base64LoginUser) {
      const loginUser = JSON.parse(atob(base64LoginUser));
      setLoginUser(loginUser);
      if (loginUser.role_type === 'PARENT') {
        childrenList()
          .then(res => {
            const response = JSON.parse(res);
            if (response.status === true) {
              setChildsList(response.data.childrens);
            }
          })
          .catch(err => {
            toastMessage('error', 'Failed to fetch children list');
          });
      }
    }
  }, []);

  const shouldRosterNavigate = () => {
    if (!loginUser?.user_role) return false;
    return !ROSTER_NO_NAVIGATION_ROLES.includes(loginUser.user_role);
  };

  return (
    <header className="bg-white header-width">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between px-[20px] pt-[10px] pb-[6px] ">
        <div className="flex lg:flex-1">
          <Link href={`/${root}/home`} className="-m-1.5 p-1.5">
            <Image alt="Logo" src="/iconx/primary-logo.svg" width={100} height={100} />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>

        <PopoverGroup className="hidden lg:flex lg:gap-x-10 lg:items-center">
          {MenuItems.map((tab, index) =>
            tab.roots.includes(root) && tab.name == 'Health Records' ? (
              <Popover key={index} className="relative">
                {({ open }) => (
                  <>
                    <PopoverButton
                      className={clsx(
                        'flex items-center gap-x-1 font-medium text-sm leading-6 tracking-normal text-center px-[15px] py-[5px]',
                        pathname.startsWith(`/${root}${tab.href}`) && 'rounded-[5px] border border-[#B5CCFF] bg-[#ECF2FF]'
                      )}
                    >
                      <span>{tab.name}</span>
                      <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-900" />
                    </PopoverButton>

                    {open && (
                      <PopoverPanel
                        static
                        className="absolute top-full -left-8 z-10 mt-2 w-screen max-w-[280px] overflow-hidden rounded-3xl bg-white ring-1 shadow-lg ring-gray-900/5 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                      >
                        <div className="p-3">
                          {Object.keys(childsList).length > 0
                            ? childsList.map(item => (
                                <div key={item.student_id} className="group relative flex items-center gap-x-4 rounded-lg p-2 text-sm/6 hover:bg-gray-50">
                                  <div className="flex-auto">
                                    <a href={`/${root}/health-records/${item.student_id}`} className="block font-[500] text-gray-900">
                                      {`${item.first_name} ${item.middle_name} ${item.last_name}`}
                                    </a>
                                  </div>
                                </div>
                              ))
                            : ''}
                        </div>
                      </PopoverPanel>
                    )}
                  </>
                )}
              </Popover>
            ) : tab.roots.includes(root) && tab.name == 'Book' ? (
              <Popover key={index} className="relative">
                {({ open }) => (
                  <>
                    <PopoverButton
                      className={clsx(
                        'flex items-center gap-x-1 font-medium text-sm leading-6 tracking-normal text-center px-[15px] py-[5px]',
                        pathname.startsWith(`/${root}${tab.href}`) && 'rounded-[5px] border border-[#B5CCFF] bg-[#ECF2FF]'
                      )}
                    >
                      <span>{tab.name}</span>
                      <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-900" />
                    </PopoverButton>

                    {open && (
                      <PopoverPanel
                        static
                        className="absolute top-full -left-8 z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white ring-1 shadow-lg ring-gray-900/5 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                      >
                        <div className="p-4">
                          {BookItems.map(item => (
                            <div key={item.name} className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50">
                              <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-6 text-gray-600 group-hover:text-indigo-600"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 0 5.25 9h13.5A2.25 2.25 0 0 0 21 11.25v7.5"
                                  />
                                </svg>
                              </div>
                              <div className="flex-auto">
                                <a href={item.href} className="block font-[500] text-gray-900">
                                  {item.name}
                                  <span className="absolute inset-0" />
                                </a>
                                <p className="mt-1 text-gray-600">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </PopoverPanel>
                    )}
                  </>
                )}
              </Popover>
            ) : tab.roots.includes(root) && tab.name === 'Roster' ? (
              // Roster: conditional navigation based on role
              shouldRosterNavigate() ? (
                <Link
                  key={index}
                  href={`/${root}${tab.href}`}
                  className={clsx(
                    'font-medium text-sm leading-6 tracking-normal text-center px-[15px] py-[5px]',
                    pathname.startsWith(`/${root}${tab.href}`) && 'rounded-[5px] border border-[#B5CCFF] bg-[#ECF2FF]'
                  )}
                >
                  {tab.name}
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={e => e.preventDefault()}
                  className={clsx(
                    'font-medium text-sm leading-6 tracking-normal text-center px-[15px] py-[5px]',
                    pathname.startsWith(`/${root}${tab.href}`) && 'rounded-[5px] border border-[#B5CCFF] bg-[#ECF2FF]'
                  )}
                >
                  {tab.name}
                </button>
              )
            ) : tab.roots.includes(root) ? (
              <Link
                key={index}
                href={`/${root}${tab.href}`}
                className={clsx(
                  'font-medium text-sm leading-6 tracking-normal text-center px-[15px] py-[5px]',
                  pathname.startsWith(`/${root}${tab.href}`) && 'rounded-[5px] border border-[#B5CCFF] bg-[#ECF2FF]'
                )}
              >
                {tab.name}
              </Link>
            ) : (
              ''
            )
          )}
        </PopoverGroup>

        {/* Profile */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <PopoverGroup className="hidden lg:flex lg:gap-x-10 lg:items-center">
            <Popover className="relative">
              <PopoverButton
                aria-hidden="true"
                className="flex items-center gap-x-3 font-medium text-sm leading-6 tracking-normal text-center px-[15px] py-[5px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-10 cursor-pointer">
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
                <span className="w-full text-left font-bold text-sm">{DisplayNameWithRole(loginUser)}</span>
              </PopoverButton>
              <PopoverPanel
                transition
                anchor="bottom start"
                className="absolute top-full w-max z-10 mt-3 overflow-hidden rounded-2xl bg-white ring-1 shadow-lg ring-gray-900/5 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
              >
                <div className="p-2">
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-2">
                    <div className="flex-auto">
                      <Link
                        href={loginUser?.role_type === 'PARENT' ? '/parent/home' : '#'}
                        className="block p-2 font-[500] border-b border-gray-300 text-gray-900 text-sm/6 hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      {loginUser?.role_type !== 'PARENT' && (
                        <Link href="/change-password" className="block p-2 font-[500] border-b border-gray-300 text-gray-900 text-sm/6 hover:bg-gray-50">
                          Change Password
                        </Link>
                      )}
                      <Link href="/logout" className="block p-2 font-[500] text-gray-900 text-sm/6 hover:bg-gray-50">
                        Logout
                      </Link>
                    </div>
                  </div>
                </div>
              </PopoverPanel>
            </Popover>
          </PopoverGroup>
        </div>
      </nav>

      {/* Mobile menu start */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href={`${root}`} className="-m-1.5 p-1.5">
              <Image alt="Logo" src="/iconx/primary-logo.svg" width={100} height={100} />
            </Link>
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-gray-700">
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {MenuItems.map((tab, index) =>
                  tab.roots.includes(root) && tab.name == 'Health Records' ? (
                    <Disclosure as="div" className="-mx-3" key={index}>
                      <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-[500] text-gray-900 hover:bg-gray-50">
                        <span>Health Records</span>
                        <ChevronDownIcon aria-hidden="true" className="size-5 flex-none group-data-open:rotate-180" />
                      </DisclosureButton>
                      <DisclosurePanel className="mt-2 space-y-2">
                        {Object.keys(childsList).length > 0
                          ? childsList.map((item, index) => (
                              <DisclosureButton
                                key={index}
                                as="a"
                                href={`/${root}/health-records/${item.student_id}`}
                                className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-[500] text-gray-900 hover:bg-gray-50"
                              >
                                {`${item.first_name} ${item.middle_name} ${item.last_name}`}
                              </DisclosureButton>
                            ))
                          : ''}
                      </DisclosurePanel>
                    </Disclosure>
                  ) : tab.roots.includes(root) && tab.name == 'Book' ? (
                    <Disclosure as="div" className="-mx-3" key={index}>
                      <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-[500] text-gray-900 hover:bg-gray-50">
                        <span>Book</span>
                        <ChevronDownIcon aria-hidden="true" className="size-5 flex-none group-data-open:rotate-180" />
                      </DisclosureButton>
                      <DisclosurePanel className="mt-2 space-y-2">
                        {BookItems.map(item => (
                          <DisclosureButton
                            key={item.name}
                            as="a"
                            href={item.href}
                            className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-[500] text-gray-900 hover:bg-gray-50"
                          >
                            {item.name}
                          </DisclosureButton>
                        ))}
                      </DisclosurePanel>
                    </Disclosure>
                  ) : tab.roots.includes(root) && tab.name === 'Roster' ? (
                    // Roster: conditional navigation based on role (mobile)
                    shouldRosterNavigate() ? (
                      <Link
                        key={index}
                        href={`/${root}${tab.href}`}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-[500] text-gray-900 hover:bg-gray-50"
                      >
                        {tab.name}
                      </Link>
                    ) : (
                      <button
                        key={index}
                        onClick={e => e.preventDefault()}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-[500] text-gray-900 hover:bg-gray-50 text-left w-full"
                      >
                        {tab.name}
                      </button>
                    )
                  ) : tab.roots.includes(root) ? (
                    <Link
                      key={index}
                      href={`/${root}${tab.href}`}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-[500] text-gray-900 hover:bg-gray-50"
                    >
                      {tab.name}
                    </Link>
                  ) : (
                    ''
                  )
                )}
                <Link
                  href="/logout"
                  className="-mx-3 group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-[500] text-gray-900 hover:bg-gray-50"
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
      {/* Mobile menu end */}
    </header>
  );
}
