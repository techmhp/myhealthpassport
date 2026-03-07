import { useState } from 'react';

const LabPartnerContent = ({ products = [], type = 'thyrocare' }) => {
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = pkgId => {
    setExpandedCards(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId],
    }));
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No packages available</p>
      </div>
    );
  }

  // Normalize data based on type
  const normalizedProducts = products.map((pkg, index) => {
    if (type === 'healthians') {
      return {
        id: pkg.deal_id || `healthians-${index}`,
        name: pkg.test_name,
        price: pkg.price,
        mrp: pkg.mrp,
        tests: [], // Healthians doesn't have test breakdown
        noOfTests: 0,
      };
    } else {
      // Thyrocare format
      return {
        id: pkg.id || `thyrocare-${index}`,
        name: pkg.name,
        price: pkg.rate?.sellingPrice || pkg.rate?.listingPrice,
        mrp: pkg.rate?.listingPrice,
        tests: pkg.testsIncluded || [],
        noOfTests: pkg.noOfTestsIncluded || 0,
      };
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {normalizedProducts.map((pkg, i) => {
        const isExpanded = expandedCards[pkg.id];
        const testsToShow = isExpanded ? pkg.tests : pkg.tests?.slice(0, 5);

        return (
          <div key={pkg.id || i} className="flex flex-col gap-[5px] rounded-[5px] border border-[#B5CCFF] p-[10px]">
            {/* Package Header */}
            <div className="w-full flex justify-between items-center">
              <span className="font-normal text-[14px] leading-[24px]">{pkg.name}</span>
              <div className="flex flex-col items-end">
                <span className="font-medium text-[14px] leading-[24px]">₹{pkg.price || 'N/A'}</span>
                {pkg.mrp && pkg.mrp !== pkg.price && <span className="text-[10px] text-gray-500 line-through">₹{pkg.mrp}</span>}
              </div>
            </div>

            {/* For Thyrocare - Show tests count and list */}
            {type === 'thyrocare' && (
              <>
                {/* Tests Count */}
                {pkg.noOfTests > 0 && <div className="text-xs text-gray-600 mb-1">{pkg.noOfTests} tests included</div>}

                {/* Test List */}
                <ul className={`list-none text-sm flex flex-col gap-[5px] pl-[15px] ${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
                  {testsToShow && testsToShow.length > 0 ? (
                    testsToShow.map((test, idx) => (
                      <li key={idx} className="font-normal text-[12px] leading-[20px] text-gray-700">
                        • {test.name}
                      </li>
                    ))
                  ) : (
                    <li className="font-normal text-[12px] leading-[20px] text-gray-500">No test details available</li>
                  )}
                </ul>

                {/* Expand/Collapse Button */}
                {pkg.tests && pkg.tests.length > 5 && (
                  <button
                    onClick={() => toggleExpand(pkg.id)}
                    className="mt-2 text-[#5465FF] text-[12px] font-medium hover:underline cursor-pointer text-left flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>+ {pkg.tests.length - 5} more tests • View All</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {/* For Healthians - Just show product type */}
            {type === 'healthians' && <div className="text-xs text-gray-600 capitalize">{products[i].product_type.replace('_', ' ')}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default LabPartnerContent;
