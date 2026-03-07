import React from 'react';

const Breadcrumbs = ({ items = [], homeLabel = '', homeHref }) => {
  // If items is not an array or is undefined, default to empty array
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <nav aria-label="Breadcrumb" className="flex ">
      <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
        {/* Home/Home Link */}
        <li>
          <div>
            <a
              href={homeHref}
              className="flex items-center text-xs sm:text-sm font-medium leading-none tracking-normal text-gray-900 hover:text-gray-700 whitespace-nowrap"
            >
              {homeLabel}
            </a>
          </div>
        </li>

        {/* Dynamic Breadcrumb Items */}
        {safeItems.map((page, index) =>
          page && page.name ? (
            <React.Fragment key={page.name}>
              <li>
                <div className="flex items-center">
                  {/* Separator - before each item except the first */}
                  <div className=" mx-1 sm:mx-2 h-5 border-1 border-blue-500"></div>

                  {/* Page Link */}
                  <a
                    href={page.href || '#'}
                    aria-current={page.current ? 'page' : undefined}
                    className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-700 whitespace-nowrap"
                  >
                    {page.name}
                  </a>
                </div>
              </li>
            </React.Fragment>
          ) : null
        )}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
