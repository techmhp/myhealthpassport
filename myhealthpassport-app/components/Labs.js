import { useState, useEffect } from 'react';
import LabPartnerContent from './LabPartnerContent';
import HealthiansPackages from './HealthiansPackages';
import Image from 'next/image';
import { productsList, schoolsList, saveTyrocarePackage, healthiansProductsList, saveHealthianPackage } from '@/services/secureApis';
import { Select } from 'antd';
import { toastMessage } from '@/helpers/utilities';

const Labs = () => {
  const [addPackageModelOpen, setAddPackageModelOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(0);
  const [products, setProducts] = useState([]);
  const [healthiansProducts, setHealthiansProducts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedLabPartner, setSelectedLabPartner] = useState('');

  const toggleAccordion = index => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const accordionItems = [
    { title: 'Thyrocare', component: <LabPartnerContent products={products} />, labPartner: 'thyrocare' },
    { title: 'Healthians', component: <HealthiansPackages products={healthiansProducts} />, labPartner: 'healthians' },
  ];

  const fetchProductsList = async () => {
    try {
      const response = await productsList();
      const result = await JSON.parse(response);
      if (result.status === true) {
        setProducts(result.data.products);
      } else {
        // toastMessage(result.detail || 'Failed to fetch Thyrocare  packages', 'error');
      }
    } catch (error) {
      toastMessage(error.message || 'Failed to fetch Thyrocare  packages', 'error');
      console.log(error);
    }
  };

  const fetchHealthianProducts = async () => {
    const payload = {
      zipcode: '122006',
    };
    try {
      const response = await healthiansProductsList(JSON.stringify(payload));
      if (response.status === true) {
        setHealthiansProducts(response.data.products);
      } else {
        toastMessage(response.detail || 'Failed to fetch Healthian  packages', 'error');
      }
    } catch (error) {
      toastMessage(error.message || 'Failed to fetch Healthian  packages', 'error');
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProductsList();
    fetchHealthianProducts();
  }, []);

  const fetchSchoolsList = async () => {
    try {
      const response = await schoolsList();
      const result = await JSON.parse(response);
      if (result.status === true) {
        setSchools(result.data.schools);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openModal = labPartner => {
    setSelectedLabPartner(labPartner);
    fetchSchoolsList();
    setAddPackageModelOpen(true);
  };

  const closeModal = () => {
    setAddPackageModelOpen(false);
    setSelectedLabPartner('');
    // Reset form
    setSelectedProduct('');
    setCustomName('');
    setCustomPrice('');
    setSelectedSchools([]);
  };

  const savePackage = async () => {
    // Validation
    if (!selectedProduct) {
      toastMessage('Please select a package', 'error');
      return;
    }
    if (selectedSchools.length === 0) {
      toastMessage('Please select at least one school', 'error');
      return;
    }
    if (!customPrice || parseFloat(customPrice) <= 0) {
      toastMessage('Please enter a valid price', 'error');
      return;
    }

    try {
      let response;

      if (selectedLabPartner === 'thyrocare') {
        // Thyrocare payload format
        const payload = {
          school_ids: selectedSchools,
          products: [
            {
              product: selectedProduct,
              custom_name: customName,
              custom_price: parseFloat(customPrice),
            },
          ],
        };

        response = await saveTyrocarePackage(JSON.stringify(payload));
      } else if (selectedLabPartner === 'healthians') {
        // Healthians payload format
        const payload = {
          school_ids: selectedSchools,
          packages: [
            {
              package_id: selectedProduct,
              custom_name: customName || '',
              custom_price: parseFloat(customPrice),
            },
          ],
        };

        response = await saveHealthianPackage(JSON.stringify(payload));
      }
      console.log('saveHealthianPackage response', response);
      // Handle response
      if (response.status === true) {
        toastMessage(`${selectedLabPartner === 'thyrocare' ? 'Thyrocare' : 'Healthians'} package saved successfully!`, 'success');
        closeModal();

        // Optionally refresh the package lists
        if (selectedLabPartner === 'thyrocare') {
          fetchProductsList();
        } else {
          fetchHealthianProducts();
        }
      } else {
        toastMessage(response.message || response.detail || 'Failed to save package', 'error');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      toastMessage(error?.message || response.detail || 'Failed to save package', 'error');
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {accordionItems.map((item, index) => (
          <div key={index} className="w-full">
            <div
              className="w-full h-11 flex justify-between items-center rounded-lg px-6 py-2.5 bg-[#ECF2FF] cursor-pointer"
              onClick={() => toggleAccordion(index)}
            >
              <span className="font-medium text-sm text-gray-900">{item.title}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 transition-transform ${openAccordion === index ? 'rotate-180' : ''}`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {openAccordion === index && (
              <div className="p-4">
                {item.component}
                <div className="mt-4 flex items-center justify-center text-sm font-medium gap-2.5 cursor-pointer">
                  <Image src="/iconx/circle-plus.svg" width={20} height={20} alt="Add New" />
                  <span className="font-normal text-[14px] leading-[24px]" onClick={() => openModal(item.labPartner)}>
                    Add New Lab Package
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {addPackageModelOpen && (
        <div className="fixed inset-0 z-50 bg-transparent bg-opacity-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-[20px] rounded-[10px] border border-[#B3CBFF] px-[37px] py-[38px] max-w-[440px] bg-white">
            <h1 className="font-semibold text-[20px] leading-[100%] tracking-[0]">Add New Lab Package</h1>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Package Name</label>
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full rounded-[8px] border border-[#D5D9E2] px-4 py-[10px] outline-none text-[#464646] bg-white cursor-pointer"
              >
                <option value="" disabled>
                  Select a package
                </option>
                {selectedLabPartner === 'thyrocare' &&
                  products.map((product, index) => (
                    <option key={index} value={product.id}>
                      {product.name}
                    </option>
                  ))}

                {selectedLabPartner === 'healthians' &&
                  healthiansProducts.map((product, index) => (
                    <option key={index} value={product.product_type_id}>
                      {product.test_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Package custom name</label>
              <input
                type="text"
                placeholder="Custom name"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full rounded-[8px] border border-[#D5D9E2] px-4 py-[10px] outline-none text-[#464646]"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Price of Package</label>
              <input
                type="number"
                placeholder="₹ 1,200"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                className="w-full rounded-[8px] border border-[#D5D9E2] px-4 py-[10px] outline-none text-[#464646]"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-[#656565] font-normal text-xs leading-[16px] tracking-[0]">Select Schools</label>
              <Select
                mode="multiple"
                placeholder="Select schools..."
                value={selectedSchools}
                onChange={value => setSelectedSchools(value)}
                style={{ width: '100%', minHeight: '40px' }}
                maxTagCount="responsive"
                options={schools.map(school => ({
                  label: school.school_name,
                  value: school.school_id,
                }))}
                showSearch
              />
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button className="px-6 py-2 border border-[#5465FF] rounded-[8px] font-medium text-sm" onClick={closeModal}>
                Close
              </button>
              <button className="px-6 py-2 bg-[#5465FF] text-white rounded-[8px] font-medium text-sm" onClick={savePackage}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labs;
