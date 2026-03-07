// HealthiansPackages.jsx
const HealthiansPackages = ({ products = [] }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No Healthians packages available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((pkg, i) => (
        <div key={pkg.deal_id || i} className="flex flex-col gap-[5px] rounded-[5px] border border-[#B5CCFF] p-[10px]">
          <div className="w-full flex justify-between items-start">
            <span className="font-normal text-[14px] leading-[24px] flex-1">{pkg.test_name}</span>
            <div className="flex flex-col items-end ml-2">
              <span className="font-medium text-[14px] leading-[24px]">₹{pkg.price}</span>
              {pkg.mrp !== pkg.price && <span className="text-[10px] text-gray-500 line-through">₹{pkg.mrp}</span>}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-600">
            <span className="capitalize">{pkg.product_type.replace('_', ' ')}</span>
            {/* <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">{Math.round(((pkg.mrp - pkg.price) / pkg.mrp) * 100)}% off</span> */}
          </div>

          {/* <div className="text-[10px] text-gray-500 mt-1">City: {pkg.city_name}</div> */}
        </div>
      ))}
    </div>
  );
};

export default HealthiansPackages;
