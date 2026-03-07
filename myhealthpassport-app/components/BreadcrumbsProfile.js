const pages = [
  { name: 'Gender: Male', href: '#', current: true },
  { name: 'Blood Group: B+', href: '#', current: true },
];

const BreadcrumbsProfile = ({ profile }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex justify-center sm:justify-start w-full overflow-x-auto">
      <ol role="list" className="flex items-center gap-x-2 sm:gap-x-4">
        <li>
          <div>
            <a href="#" className="text-sm font-medium text-gray-900 hover:text-gray-700 whitespace-nowrap">
              Age: {profile?.age ? profile.age : ''}
            </a>
          </div>
        </li>
        <li className="flex items-center whitespace-nowrap">
          <div className="mx-1 sm:mx-2 h-5 border-l border-gray-900"></div>
          <a href='#' aria-current='page' className="text-sm font-medium text-gray-900 hover:text-gray-700">
            Gender: {profile?.gender ? profile.gender : ''}
          </a>
        </li>
        <li className="flex items-center whitespace-nowrap">
          <div className="mx-1 sm:mx-2 h-5 border-l border-gray-900"></div>
          <a href='#' aria-current='page' className="text-sm font-medium text-gray-900 hover:text-gray-700">
            Blood Group: {profile?.blood_group ? profile.blood_group : ''}
          </a>
        </li>
      </ol>
    </nav>
  );
};

export default BreadcrumbsProfile;
