const DisplayNameWithRole = (user_info) => {

    switch (user_info.role_type) {
        case 'PARENT':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">PARENT</span><br />
                <sub>{`${user_info.first_name} ${user_info.last_name}`}</sub>
            </div>;
        case 'SCHOOL_STAFF':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">{user_info.user_role.replace(/_/g, ' ')}</span><br />
                <sub>{`${user_info.first_name} ${user_info.last_name}`}</sub>
            </div>;
        case 'ON_GROUND_TEAM':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">ON GROUND</span><br />
                <sub>{user_info.user_role.replace(/_/g, ' ')}</sub>
            </div>;
        case 'SCREENING_TEAM':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">SCREENING</span><br />
                <sub>{user_info.user_role.replace(/_/g, ' ')}</sub>
            </div>;
        case 'ANALYST_TEAM':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">ANALYST</span><br />
                <sub>{user_info.user_role.replace(/_/g, ' ')}</sub>
            </div>;
        case 'ADMIN_TEAM':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">{user_info.user_role.replace(/_/g, ' ')}</span><br />
                <sub>{`${user_info.first_name} ${user_info.last_name}`}</sub>
            </div>;
        case 'CONSULTANT_TEAM':
            return <div className="w-full leading-[14px]">
                <span className="text-xs">CONSULTANT</span><br />
                <sub>{user_info.user_role.replace(/_/g, ' ')}</sub>
            </div>;
        default:
            return null;
    }
}

export default DisplayNameWithRole;