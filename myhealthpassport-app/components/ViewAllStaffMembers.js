// This ViewAllStaffMembers is using only in admin pages
import Image from 'next/image';
import nookies from 'nookies';
import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { toastMessage } from '@/helpers/utilities';
import { assignSchool, schoolList, usersList } from '@/services/secureApis';
import PlusButton from '@/components/UI/PlusButton';
import FilterSection from './FilterSection';

const ViewAllStaffMembers = ({ school_Info }) => {
  const cookies = nookies.get();
  const school_details = school_Info ? school_Info : {};
  const { schoolid } = useParams();
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState({});
  const [results, setResults] = useState([]);
  const [selectedRole, setSelectedRole] = useState('ADMIN_TEAM');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [assignFormData, setAssignFormData] = useState({
    team_type: '',
    team_role: '',
    date_time: '',
    school_id: '',
    from_time: '',
    to_time: '',
    class_name: '',
    section: '',
    from_time: '',
    to_time: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const pathname = usePathname();
  const endsWithStaff = pathname.endsWith('staff');
  const [searchQuery, setSearchQuery] = useState('');

  const getFullName = staff => {
    const first = staff.first_name || '';
    const last = staff.last_name || '';
    return `${first} ${last}`.trim();
  };

  const filteredResults = results.filter(staff => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();

    const username = (staff.username || '').toLowerCase();
    const name = getFullName(staff).toLowerCase();
    const assignedSchool = (staff.assigned_schools || '').toLowerCase();

    return username.includes(q) || name.includes(q) || assignedSchool.includes(q);
  });

  useEffect(() => {
    if (cookies.role && cookies.role !== 'undefined') {
      // console.log('Role from cookies:', cookies.role);
      setRole(cookies.role);
    }

    schoolList()
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true) {
          setSchools(response.data.schools_list);
        } else {
          toastMessage(response.message || 'Unable to fetch the schools data', 'error');
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
    GetUsersList(selectedRole);
  }, [selectedRole]);

  const GetUsersList = async (teamType = 'ADMIN_TEAM') => {
    try {
      let filterObj = {
        team_type: teamType,
        role: '',
        is_active: 'true',
        search: '',
        school_id: schoolid || '',
      };

      const response = await usersList(filterObj);
      const result = await JSON.parse(response);
      if (result.status === true) {
        setResults(result.data.users || []);
      }
    } catch (err) {
      // console.log(err);
      toastMessage(err, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = staffMember => {
    setSelectedStaff(staffMember);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStaff(null);
  };

  const openDetailsModal = staffMember => {
    setSelectedStaff(staffMember);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedStaff(null);
  };

  const handleSelectChange = e => {
    setSelectedRole(e.target.value);
    // console.log('Selected Role:', e.target.value);
    GetUsersList(e.target.value);
  };

  const handleSearchChange = value => {
    setSearchQuery(value);
  };

  const handleAssignFormChange = (field, value) => {
    setAssignFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Validate form data
  const validateAssignForm = () => {
    const errors = {};

    if (!assignFormData.date_time) {
      errors.date = 'Date is required';
    }

    if (!assignFormData.school_id) {
      errors.school_id = 'School selection is required';
    }

    if (!assignFormData.from_time) {
      errors.from_time = 'Start Time selection is required';
    }

    if (!assignFormData.to_time) {
      errors.to_time = 'End Time selection is required';
    }

    // if (!assignFormData.class_name) {
    //   errors.class_name = 'Class Name is required';
    // }

    // if (!assignFormData.section) {
    //   errors.section = 'Section is required';
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAssignment = async () => {
    // Validate form first
    if (!validateAssignForm()) {
      toastMessage('Please fill all required fields', 'error');
      return;
    }
    setLoading(true);
    const requestBody = {
      date_time: `${assignFormData.date_time} 00:00:00`,
      user_id: selectedStaff.id,
      team_type: selectedStaff.role_type,
      team_role: selectedStaff.user_role,
      school_id: parseInt(assignFormData.school_id),
      class_name: assignFormData.class_name,
      section: assignFormData.section,
      from_time: assignFormData.from_time,
      to_time: assignFormData.to_time,
    };

    try {
      const response = await assignSchool(JSON.stringify(requestBody));
      // console.log('Assign school api res', response);
      if (response.status === true) {
        toastMessage(response.message, 'success');
        setShowAssignModal(false);
      }
    } catch (err) {
      // console.log('Assign school api error', err);
      toastMessage(err?.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Program Coordinator Table (New Layout)
  const renderProgramCoordinatorTable = () => (
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
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                Staff ID
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-40">
                Name
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-36">
                Role
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-36">
                Username
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-64">
                {endsWithStaff ? 'Phone Number' : 'Assigned School'}
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-32">
                Assignment <br /> Status
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-20">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((staff_member, index) => (
              <tr key={index} className="bg-white">
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.employee_id}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.first_name} {staff_member.last_name || ''}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.user_role}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.username}
                </td>
                {endsWithStaff ? (
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {staff_member.phone}
                  </td>
                ) : (
                  <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                    {staff_member?.assigned_schools_list?.length ? staff_member.assigned_schools_list.map(school => school.school_name).join(', ') : 'N/A'}
                  </td>
                )}
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => openAssignModal(staff_member)}
                      className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100"
                    >
                      {staff_member?.is_active == true ? (
                        <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />
                      ) : (
                        <Image alt="Inactive" src="/iconx/minus-circle.svg" width={20} height={20} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => openDetailsModal(staff_member)}
                      className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100"
                    >
                      <Image alt="View Details" src="/iconx/eye.svg" width={20} height={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Default Table (Original Layout)
  const renderDefaultTable = () => (
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
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-24">
                Staff ID
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-40">
                Name
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-36">
                Role
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-36">
                Username
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-64">
                Assigned School(s)
              </th>
              {/* <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-28">
                Date of Camp
              </th> */}
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-32">
                Assignment Status
              </th>
              <th className="bg-[#ECF2FF] border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 text-left font-inter font-medium text-sm leading-[130%] text-[#5389FF] w-20">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((staff_member, index) => (
              <tr key={index} className="bg-white">
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.employee_id}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.first_name}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.user_role}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member.username}
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member?.assigned_schools_list?.length ? staff_member.assigned_schools_list.map(school => school.school_name).join(', ') : 'N/A'}
                </td>
                {/* <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black">
                  {staff_member?.Assigned_date || '-'}
                </td> */}
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => openAssignModal(staff_member)}
                      className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100"
                    >
                      {staff_member?.is_completed == true ? (
                        <Image alt="Active" src="/iconx/check-circle.svg" width={20} height={20} />
                      ) : (
                        <Image alt="Inactive" src="/iconx/minus-circle.svg" width={20} height={20} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="bg-white border-t border-l border-solid border-[#B5CCFF] py-2.5 px-3 font-inter font-normal text-sm leading-[130%] text-black text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => openDetailsModal(staff_member)}
                      className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100"
                    >
                      <Image alt="View Details" src="/iconx/eye.svg" width={20} height={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="mt-2">
        <div className="mb-[20px] w-[80%] m-auto">
          <FilterSection searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        </div>
        <div className="flex items-center justify-center mb-3">
          <select
            value={selectedRole}
            onChange={handleSelectChange}
            className="w-full min-w-[320px] max-w-[440px] p-3 border border-gray-300 rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Role</option>
            <option value="ON_GROUND_TEAM">ON_GROUND_TEAM</option>
            <option value="SCREENING_TEAM">SCREENING_TEAM</option>
            <option value="ANALYST_TEAM">ANALYST_TEAM</option>
            <option value="ADMIN_TEAM">ADMIN_TEAM</option>
          </select>
        </div>
        {/* {role === 'PROGRAM_COORDINATOR' ? renderProgramCoordinatorTable() : renderDefaultTable()} */}
        {renderDefaultTable()}
        {/* {!endsWithStaff && (
          <button onClick={openAssignModal}>
            <PlusButton />
          </button>
        )} */}
        {/* Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-[#2423239e] bg-opacity-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-[20px] rounded-[10px] border border-[#B3CBFF] px-[30px] py-[38px] min-w-[360px] max-w-[400px] bg-white w-full max-h-[90vh] overflow-auto">
              {/* Title */}
              <h1 className="font-semibold text-[20px] leading-[100%] tracking-[0]">Assign School</h1>
              {/* <form method='POST' onSubmit={handleSaveAssignment}> */}
              {/* User Info */}
              <div className="flex justify-start items-center gap-3 w-full ">
                <Image
                  src={selectedStaff.profile_image || '/iconx/profile-image.svg'}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
                <span className="font-medium text-base text-[#000000]">
                  {selectedStaff ? `${selectedStaff.first_name} ${selectedStaff.last_name || ''}` : 'Staff Member'}
                </span>
              </div>

              {/* Select Date */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Select Date *</label>
                <input
                  type="date"
                  name="date_time"
                  value={assignFormData.date_time}
                  onChange={e => handleAssignFormChange('date_time', e.target.value)}
                  className={`w-full rounded-[8px] border ${
                    formErrors.date ? 'border-red-500' : 'border-[#D5D9E2]'
                  } px-4 py-[10px] outline-none text-[#464646]`}
                />
                {formErrors.date && <span className="text-red-500 text-xs">{formErrors.date}</span>}
              </div>

              {/* Assign School */}
              <div className="flex flex-col gap-2 w-full ">
                <label htmlFor="school_id" className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">
                  Assign School *
                </label>
                <select
                  name="school_id"
                  value={assignFormData.school_id}
                  onChange={e => handleAssignFormChange('school_id', e.target.value)}
                  className={`w-full rounded-[8px] border ${
                    formErrors.school_id ? 'border-red-500' : 'border-[#D5D9E2]'
                  } px-4 py-[10px] outline-none text-[#464646]`}
                >
                  <option value="">Select School</option>
                  {Object.keys(schools.items).length > 0
                    ? schools.items.map((school, index) => (
                        <option key={index} value={school.school_id}>
                          {school.school_full_name}
                        </option>
                      ))
                    : ''}
                </select>
                {formErrors.school_id && <span className="text-red-500 text-xs">{formErrors.school_id}</span>}
              </div>

              {/* Assign Start Time */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Assign Start Time *</label>
                <select
                  name="from_time"
                  value={assignFormData.from_time}
                  onChange={e => handleAssignFormChange('from_time', e.target.value)}
                  className={`w-full rounded-[8px] border ${
                    formErrors.from_time ? 'border-red-500' : 'border-[#D5D9E2]'
                  } px-4 py-[10px] outline-none text-[#464646]`}
                >
                  <option value="">Select Start Time</option>
                  <option value="08:00 AM">8:00 AM</option>
                  <option value="09:00 AM">9:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                </select>
                {formErrors.from_time && <span className="text-red-500 text-xs">{formErrors.from_time}</span>}
              </div>

              {/* Assign End Time */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Assign End Time *</label>
                <select
                  name="to_time"
                  value={assignFormData.to_time}
                  onChange={e => handleAssignFormChange('to_time', e.target.value)}
                  className={`w-full rounded-[8px] border ${
                    formErrors.to_time ? 'border-red-500' : 'border-[#D5D9E2]'
                  } px-4 py-[10px] outline-none text-[#464646]`}
                >
                  <option value="">Select End Time</option>
                  <option value="08:00 AM">8:00 AM</option>
                  <option value="09:00 AM">9:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                </select>
                {formErrors.to_time && <span className="text-red-500 text-xs">{formErrors.to_time}</span>}
              </div>

              {/* Class Name */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Class Name</label>
                <select
                  name="class_name"
                  value={assignFormData.class_name}
                  onChange={e => handleAssignFormChange('class_name', e.target.value)}
                  className={`w-full rounded-[8px] border border-[#D5D9E2]
                  } px-4 py-[10px] outline-none text-[#464646]`}
                >
                  <option value="">Select Class Name</option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
                {/* {formErrors.class_name && <span className="text-red-500 text-xs">{formErrors.class_name}</span>} */}
              </div>

              {/* Section */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Section</label>
                <select
                  name="section"
                  value={assignFormData.section}
                  onChange={e => handleAssignFormChange('section', e.target.value)}
                  className={`w-full rounded-[8px] border border-[#D5D9E2]
                  } px-4 py-[10px] outline-none text-[#464646]`}
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                  <option value="H">H</option>
                </select>
                {/* {formErrors.section && <span className="text-red-500 text-xs">{formErrors.section}</span>} */}
              </div>

              {/* Buttons */}
              <div className="flex justify-center items-center gap-4 mt-4 w-full">
                <button type="button" className="px-6 py-2 border border-[#5465FF] text-[#5465FF] rounded-[8px] font-medium text-sm" onClick={closeAssignModal}>
                  Close
                </button>
                <button type="submit" onClick={handleSaveAssignment} className="px-6 py-2 bg-[#5465FF] text-white rounded-[8px] font-medium text-sm">
                  Save Changes
                </button>
              </div>
              {/* </form> */}
            </div>
          </div>
        )}
        {/* Assignment Details Modal */}
        {showDetailsModal && selectedStaff && (
          <div className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-[20px] rounded-[10px] border border-[#B3CBFF] px-[30px] py-[30px] min-w-[400px] max-w-[500px] bg-white w-full max-h-[90vh] overflow-y-auto">
              {/* Title */}
              <h1 className="font-semibold text-[20px] leading-[100%] tracking-[0] text-center">Assignment Details</h1>

              {/* User Info */}
              <div className="flex items-center gap-3 w-full">
                <Image
                  src={selectedStaff.profile_image || '/iconx/profile-image.svg'}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-full object-cover"
                  width={48}
                  height={48}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-base text-[#000000]">{`${selectedStaff.first_name} ${selectedStaff.last_name || ''}`}</span>
                  <span className="text-xs text-gray-500">{selectedStaff.user_role}</span>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-[#E5E5E5] w-full" />

              {/* Overall Stats */}
              <div className="flex flex-col gap-2 w-full bg-[#F8F9FA] p-3 rounded-lg">
                <h3 className="font-medium text-sm text-[#000000]">Overall Statistics</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Total Students:</span>
                  <span className="font-medium text-[#000000]">{selectedStaff.total_students || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Screened Students:</span>
                  <span className="font-medium text-[#000000]">{selectedStaff.screened_students || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Progress:</span>
                  <span className="font-medium text-[#000000]">
                    {selectedStaff.total_students > 0 ? `${Math.round((selectedStaff.screened_students / selectedStaff.total_students) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-[#E5E5E5] w-full" />

              {/* Assigned Schools List */}
              <div className="flex flex-col gap-3 w-full">
                <h3 className="font-medium text-sm text-[#000000]">Assigned Schools ({selectedStaff.assigned_schools_list?.length || 0})</h3>

                {selectedStaff.assigned_schools_list && selectedStaff.assigned_schools_list.length > 0 ? (
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                    {selectedStaff.assigned_schools_list.map((school, index) => (
                      <div key={index} className="border border-[#E5E5E5] rounded-lg p-3 hover:border-[#5465FF] transition-colors">
                        {/* School Name */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2 flex-1">
                            <Image src="/iconx/school.svg" alt="School" width={16} height={16} className="mt-0.5" />
                            <span className="font-medium text-sm text-[#000000]">{school.school_name}</span>
                          </div>
                          {school.is_completed ? (
                            <Image src="/iconx/check-circle.svg" alt="Completed" width={18} height={18} />
                          ) : (
                            <Image src="/iconx/minus-circle.svg" alt="Pending" width={18} height={18} />
                          )}
                        </div>

                        {/* Assignment Date */}
                        <div className="flex items-center gap-2 text-xs text-[#666666] mb-2">
                          <Image src="/iconx/calendar.svg" alt="Calendar" width={14} height={14} />
                          <span>{school.assigned_date || 'Date not assigned'}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div
                            className="bg-[#5465FF] h-1.5 rounded-full transition-all"
                            style={{
                              width: `${school.total_students > 0 ? (school.screened_students / school.total_students) * 100 : 0}%`,
                            }}
                          />
                        </div>

                        {/* Students Count */}
                        <div className="flex justify-between text-xs">
                          <span className="text-[#666666]">
                            Screened: {school.screened_students}/{school.total_students}
                          </span>
                          <span className="text-[#666666]">
                            {school.total_students > 0 ? `${Math.round((school.screened_students / school.total_students) * 100)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">No schools assigned yet</div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-center items-center gap-4 mt-2 w-full">
                {/* <button
                  className="px-6 py-2 border border-[#5465FF] text-[#5465FF] rounded-[8px] font-medium text-sm hover:bg-[#5465FF] hover:text-white transition-colors"
                  onClick={() => {
                    closeDetailsModal();
                    openAssignModal(selectedStaff);
                  }}
                >
                  Edit Assignment
                </button> */}
                <button
                  className="px-6 py-2 bg-[#5465FF] text-white rounded-[8px] font-medium text-sm hover:bg-[#4356E8] transition-colors"
                  onClick={closeDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewAllStaffMembers;
