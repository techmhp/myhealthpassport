"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import StudentProfileForm from "@/components/Student/StudentProfileForm";
import { schoolDetails, studentDetails } from "@/services/secureApis";


const StudentProfile = () => {
    const { schoolid, studentId } = useParams();
    const [student, setStudent] = useState({});
    const [student_details, setStudent_details] = useState({});
    const [school, setSchool] = useState({});

    useEffect(() => {
        schoolDetails(schoolid).then(res => {
            const response = JSON.parse(res);
            if (response.status === true) {
                setSchool(response.data.school);
            }
        }).catch(err => {
            toastMessage(err, "error");
        });
        studentDetails(studentId).then(res => {
            const response = JSON.parse(res);
            if (response.status === true) {
                setStudent(response);
                setStudent_details(response.data.student_details)
            }
        }).catch(err => {
            toastMessage(err, "error");
        });
    }, []);

    return (
        <>
            <Header />
            <div className="px-[90px] py-[27px]">
                <div className="mb-5">
                    <Breadcrumbs
                        items={[
                            {
                                name: school?.school_full_name ? school?.school_full_name : school?.school_name,
                                href: `/admin/schools/${school.school_id}`,
                                current: false,
                            },
                            {
                                name: student_details?.identity_details ? `Class ${student_details?.identity_details?.class_room}${student_details?.identity_details?.section}` : '',
                                href: `/admin/schools/${school.school_id}/class/${student_details?.identity_details?.class_room}-${student_details?.identity_details?.section}`,
                                current: true,
                            },
                            {
                                name: student_details?.id ? `${student_details?.first_name} ${student_details?.last_name}` : '',
                                href: "#",
                                current: true,
                            },
                        ]}
                        homeLabel="Schools"
                        homeHref={`/admin/schools/${school.school_id}`}
                    />
                </div>
                <div className="bg-white rounded-lg">
                    {student.status ? <StudentProfileForm details={student} /> : ''}
                </div>
            </div>
        </>
    );
};

export default StudentProfile;
