// 'use client';

// import Breadcrumbs from '@/components/Breadcrumbs';
// import SchoolProfileForm from '@/components/School/SchoolProfileForm';
// import Header from '@/components/Header';
// import { useRouter } from 'next/navigation';

// import Image from 'next/image';
// import Link from 'next/link';

// function Profile() {
//   const router = useRouter();
//   return (
//     <>
//       <Header />
//       <div className="p-4 sm:p-6 md:p-[26px] md:px-12 lg:px-18">
//         <div className="px-2 sm:px-6 md:px-10 lg:px-14 grid gap-4 md:gap-8 lg:gap-13">
//           <Breadcrumbs
//             items={[
//               {
//                 name: 'International School of India',
//                 href: '#',
//                 current: true,
//               },
//             ]}
//             homeLabel="Schools"
//             homeHref="/admin/schools"
//           />
//           <div className="px-0 sm:px-1">
//             <div className="w-full flex justify-between items-center">
//               <div className="flex gap-[70px] items-center">
//                 <div className="flex items-center justify-center rounded-[10px] p-[20px] bg-[#F3F7FA] w-[100px] h-[85px]">
//                   <Image src="/iconx/school.svg" alt="school logo" width={42} height={62} className="w-[42px] h-[62px]" />
//                 </div>
//                 <div className="flex flex-col gap-[15px] items-start">
//                   <h3 className="font-semibold text-[14px] leading-[100%] tracking-[0]">International School of India</h3>
//                   <div className="grid grid-cols-3 gap-6">
//                     <div className="flex flex-col items-start">
//                       <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Location</p>
//                       <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0]">HYD</p>
//                     </div>

//                     <div className="flex flex-col items-center">
//                       <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Strength</p>
//                       <p className="mb-0 font-medium text-[14px] leading-[100%] tracking-[0] text-center">4,200</p>
//                     </div>

//                     <div className="flex flex-col items-center">
//                       <p className="font-normal text-[12px] leading-[100%] tracking-[0]">Onboarding</p>
//                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#89E382" className="size-5">
//                         <path
//                           fillRule="evenodd"
//                           d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <Link href="/admin/schools/1" legacyBehavior>
//                 <button className="rounded-[5px] pt-[10px] pr-[20px] pb-[10px] pl-[20px] bg-[#5465FF] text-[#FFFFFF]">
//                   <span className="font-normal text-sm leading-[14px] tracking-normal">View Student List</span>
//                 </button>
//               </Link>
//             </div>
//           </div>
//           <div className="flex justify-center items-center mt-4 sm:mt-[22px]">
//             <div className="w-full">
//               <div className="relative flex items-center justify-center mb-[30px] sm:mb-[18px]">
//                 {/* Edit Icon - Absolutely positioned to the right */}
//                 <div className="absolute right-0">
//                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#5389FF" className="size-5">
//                     <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
//                     <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
//                   </svg>
//                 </div>
//               </div>
//               <div className="bg-white rounded-lg">
//                 <SchoolProfileForm />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default Profile;
