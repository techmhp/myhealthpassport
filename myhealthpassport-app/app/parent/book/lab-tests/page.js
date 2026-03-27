'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Header from '@/components/Header';
import SlotBooking from '@/components/SlotBooking';
import {
  childrenList,
  schoolsPackagesThyrocare,
  schoolsPackagesHealthians,
  storeLabTestTransaction,
  addProductToCart,
  labTestOrderCreate,
  tyrocareServiceability,
  healthiansCheckServiceability,
  healthiansGetSlots,
  tyrocareGetSlots,
  healthiansFreezeSlot,
  healthiansCreateBooking,
} from '@/services/secureApis';
import { formatFullName, toastMessage } from '@/helpers/utilities';
import ErrorModal from '@/components/UI/ErrorModal';
import { useRouter } from 'next/navigation';

const labTests = () => {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [packages, setPackages] = useState([]);
  const [healthiansPackages, setHealthiansPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [userInfo, setUserInfo] = useState({});

  const [appointmentDate, setAppointmentDate] = useState(null);
  const [collectionType, setCollectionType] = useState('HOME_COLLECTION');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Healthians specific states
  const [healthiansZoneId, setHealthiansZoneId] = useState(null);
  const [selectedHealthiansSlot, setSelectedHealthiansSlot] = useState(null);
  const [healthiansServiceable, setHealthiansServiceable] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [healthiansCoordinates, setHealthiansCoordinates] = useState({
    lat: null,
    long: null,
  });

  const [selectedThyrocareSlot, setSelectedThyrocareSlot] = useState(null);
  const [thyrocareSlotTime, setThyrocareSlotTime] = useState(null);
  // Add a new state to store the combined date+time
  const [finalAppointmentDateTime, setFinalAppointmentDateTime] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    email: '',
    age: '',
    gender: 'MALE',
    fullAddress: '',
    landmark: '',
    pincode: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    contact: '',
    email: '',
    age: '',
    fullAddress: '',
    pincode: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
  });

  const [pincode, setPincode] = useState(null);

  const handlePatientSelect = patient => {
    setSelectedPatient(patient.student_id);
    setSelectedSchool(patient.school_id);

    setFormData({
      fullName: formatFullName(patient),
      contact: userInfo.primary_mobile || '',
      email: userInfo.primary_email || '',
      age: patient.age?.toString() || '',
      gender: patient.gender || 'MALE',
      fullAddress: patient.address || '',
      landmark: '',
      pincode: patient.pincode || '',
      houseNo: '',
      street: '',
      city: patient.city || '',
      state: patient.state || '',
    });
    setPincode(patient.pincode || '');
  };

  useEffect(() => {
    const userData = JSON.parse(atob(localStorage.getItem('user_info')));
    setUserInfo(userData);

    childrenList()
      .then(res => {
        const response = JSON.parse(res);
        if (response.status === true && response?.data?.childrens) {
          setResults(response.data.childrens);

          if (response.data.childrens.length > 0) {
            handlePatientSelect(response.data.childrens[0]);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching children:', err);
      });
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchPackages(selectedSchool);
      fetchHealthiansPackages(selectedSchool);
    }
  }, [selectedSchool]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.pincode && formData.pincode.length === 6 && selectedVendor) {
        checkPincodeServiceability(formData.pincode);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.pincode, selectedVendor]);

  // ✅ NEW: Auto-request location when Healthians is selected
  useEffect(() => {
    const requestLocationForHealthians = async () => {
      if (selectedVendor === 'Healthians' && !healthiansCoordinates?.lat) {
        console.log('🎯 Healthians selected - auto-requesting GPS location permission');
        toastMessage('Requesting location access...', 'info');

        const coords = await getUserLocation();

        if (coords) {
          setHealthiansCoordinates(coords);
          console.log('✅ GPS coordinates obtained:', coords);
          toastMessage('Location access granted', 'success');

          // Recheck serviceability with real coordinates if pincode is entered
          if (formData.pincode && formData.pincode.length === 6) {
            checkPincodeServiceability(formData.pincode);
          }
        } else {
          console.log('⚠️ User denied location or unavailable - will use fallback coordinates');
          toastMessage('Location denied. Using approximate location.', 'warning');
        }
      }
    };

    requestLocationForHealthians();
  }, [selectedVendor]);

  // Helper function to get user's GPS location with smart fallback
  const getUserLocation = () => {
    return new Promise(async resolve => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported by browser');
        resolve(null);
        return;
      }

      console.log('📍 Requesting user location...');

      // ✅ Try high accuracy first (GPS)
      const highAccuracyOptions = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds for GPS
        maximumAge: 60000,
      };

      // ✅ Fallback to low accuracy (network/IP-based)
      const lowAccuracyOptions = {
        enableHighAccuracy: false, // Use network location (faster)
        timeout: 10000, // 10 seconds
        maximumAge: 60000,
      };

      // Try high accuracy first
      try {
        const highAccuracyCoords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            position => {
              const coords = {
                lat: position.coords.latitude.toFixed(6),
                long: position.coords.longitude.toFixed(6),
                accuracy: position.coords.accuracy,
              };
              console.log('✅ High accuracy location obtained:', coords);
              console.log('📏 GPS Accuracy:', coords.accuracy, 'meters');
              resolve(coords);
            },
            error => {
              console.log('⚠️ High accuracy failed, trying network location...');
              reject(error);
            },
            highAccuracyOptions
          );
        });

        resolve(highAccuracyCoords);
        return;
      } catch (error) {
        console.log('🔄 Falling back to network-based location...');
      }

      // Fallback to low accuracy (network)
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude.toFixed(6),
            long: position.coords.longitude.toFixed(6),
            accuracy: position.coords.accuracy,
          };
          console.log('✅ Network location obtained:', coords);
          console.log('📏 Network Accuracy:', coords.accuracy, 'meters');
          resolve(coords);
        },
        error => {
          console.error('❌ Both location methods failed:', error.code, error.message);
          let errorMsg = '';
          switch (error.code) {
            case 1:
              errorMsg = 'Location access denied.';
              break;
            case 2:
              errorMsg = 'Location unavailable.';
              break;
            case 3:
              errorMsg = 'Location request timed out.';
              break;
          }
          console.log('⚠️', errorMsg);
          resolve(null);
        },
        lowAccuracyOptions
      );
    });
  };

  const checkPincodeServiceability = async pincode => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeServiceable(null);
      setHealthiansServiceable(null);
      return;
    }

    setPincodeChecking(true);
    setErrors(prev => ({ ...prev, pincode: '' }));

    try {
      if (selectedVendor === 'Healthians') {
        console.log('🔍 Checking Healthians serviceability for pincode:', pincode);

        // ✅ Use GPS coordinates if available, otherwise use static fallback
        const coords = healthiansCoordinates?.lat ? healthiansCoordinates : { lat: '17.385044', long: '78.486671' };

        console.log('📍 Using coordinates:', coords);

        const healthiansPayload = {
          lat: coords.lat,
          long: coords.long,
          zipcode: pincode,
        };

        const healthiansResponse = await healthiansCheckServiceability(JSON.stringify(healthiansPayload));

        if (healthiansResponse?.status === true && healthiansResponse?.data?.zone_id) {
          setHealthiansServiceable(true);
          setHealthiansZoneId(healthiansResponse.data.zone_id);
          setHealthiansCoordinates({ lat: coords.lat, long: coords.long });
          setErrors(prev => ({ ...prev, pincode: '' }));
          console.log('✅ Healthians serviceable - Zone:', healthiansResponse.data.zone_id);
        } else {
          setHealthiansServiceable(false);
          setHealthiansZoneId(null);
          setErrors(prev => ({
            ...prev,
            pincode: 'Healthians service not available in this area',
          }));
          console.log('❌ Healthians not serviceable');
        }
      } else if (selectedVendor === 'Thyrocare') {
        // Thyrocare serviceability check
        console.log('🔍 Checking Thyrocare serviceability for pincode:', pincode);

        const thyrocareRes = await tyrocareServiceability(pincode);
        // console.log('📥 Thyrocare thyrocareRes:', thyrocareRes);
        const thyrocareResponse = JSON.parse(thyrocareRes);
        // console.log('📥 Thyrocare response:', thyrocareResponse);

        if (thyrocareResponse?.status === true && thyrocareResponse?.data?.is_serviceable) {
          setPincodeServiceable(true);
          setErrors(prev => ({ ...prev, pincode: '' }));
        } else {
          setPincodeServiceable(false);
          setErrors(prev => ({
            ...prev,
            pincode: 'Thyrocare service not available in this area',
          }));
          console.log('❌ Thyrocare not serviceable');
        }
      }
    } catch (error) {
      console.error('Error checking serviceability:', error);
      if (selectedVendor === 'Healthians') {
        setHealthiansServiceable(false);
      } else if (selectedVendor === 'Thyrocare') {
        setPincodeServiceable(false);
      }
      setErrors(prev => ({
        ...prev,
        pincode: 'Unable to verify pincode. Please try again.',
      }));
    } finally {
      setPincodeChecking(false);
    }
  };

  const fetchPackages = async schoolId => {
    setLoading(true);
    try {
      const response = await schoolsPackagesThyrocare(schoolId);
      // console.log('response', response);
      const result = JSON.parse(response);

      if (result.status === true && result.data?.products) {
        const normalizedPackages = result.data.products.map(pkg => ({
          ...pkg,
          vendor: 'Thyrocare',
          uniqueId: `thyrocare-${pkg.internal_id}`,
          displayPrice: pkg.price,
        }));
        setPackages(normalizedPackages);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching Thyrocare packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthiansPackages = async schoolId => {
    setLoading(true);
    try {
      const response = await schoolsPackagesHealthians(schoolId);
      // console.log('Healthians packages response:', response);
      const result = JSON.parse(response);

      if (result.status === true && result.data?.packages) {
        const normalizedPackages = result.data.packages.map(pkg => ({
          ...pkg,
          vendor: 'Healthians',
          uniqueId: `healthians-${pkg.package_id}`,
          displayPrice: pkg.display_price,
        }));
        setHealthiansPackages(normalizedPackages);
      } else {
        setHealthiansPackages([]);
      }
    } catch (error) {
      console.error('Error fetching Healthians packages:', error);
      setHealthiansPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageToggle = pkg => {
    setSelectedPackages(prev => {
      const isSelected = prev.find(p => p.uniqueId === pkg.uniqueId);

      if (isSelected) {
        setSelectedVendor(null);
        setSelectedHealthiansSlot(null);
        setSelectedThyrocareSlot(null);
        setThyrocareSlotTime(null);
        return [];
      } else {
        if (selectedVendor && selectedVendor !== pkg.vendor) {
          setSelectedHealthiansSlot(null);
          setSelectedThyrocareSlot(null);
          setThyrocareSlotTime(null);
        }

        setSelectedVendor(pkg.vendor);
        // console.log('Selected vendor:', pkg.vendor);
        return [pkg];
      }
    });
  };

  const isPackageSelected = uniqueId => {
    return selectedPackages.some(p => p.uniqueId === uniqueId);
  };

  const toggleExpand = pkgId => {
    setExpandedCards(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contact.trim())) {
      newErrors.contact = 'Contact must be 10 digits';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Enter a valid age (1-120)';
    }

    if (!formData.fullAddress.trim()) {
      newErrors.fullAddress = 'Full address is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    } else if (selectedVendor === 'Thyrocare') {
      if (pincodeServiceable === false) {
        newErrors.pincode = 'Thyrocare service not available in this area';
      } else if (pincodeServiceable === null) {
        newErrors.pincode = 'Verifying pincode...';
      }
    } else if (selectedVendor === 'Healthians') {
      if (healthiansServiceable === false) {
        newErrors.pincode = 'Healthians service not available in this area';
      } else if (healthiansServiceable === null) {
        newErrors.pincode = 'Verifying pincode...';
      }
    }

    if (!formData.houseNo.trim()) {
      newErrors.houseNo = 'House/Flat number is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAddressLength = () => {
    const houseNo = formData.houseNo || '';
    const street = formData.street || '';
    const addressLine1 = formData.fullAddress || '';
    const addressLine2 = formData.state || '';
    const landmark = formData.landmark || '';
    const city = formData.city || '';
    const state = formData.state || '';
    const country = '';
    const pincode = formData.pincode || '';

    const totalLength =
      houseNo.length +
      street.length +
      addressLine1.length +
      addressLine2.length +
      landmark.length +
      city.length +
      state.length +
      country.length +
      pincode.length;

    return totalLength;
  };

  const loadRazorpay = () => {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const getTotalAmount = () => {
    return selectedPackages.reduce((sum, pkg) => sum + (pkg.displayPrice || pkg.price), 0);
  };

  const getSelectedProductCodes = () => {
    return selectedPackages.map(pkg => pkg.vendor_product_code || pkg.code);
  };

  const freezeHealthiansSlot = async slotId => {
    try {
      const payload = {
        slot_id: slotId,
        vendor_billing_user_id: '768443',
      };

      // console.log('Freezing Healthians slot with payload:', payload);
      const result = await healthiansFreezeSlot(JSON.stringify(payload));

      if (result.status === true) {
        // console.log('Healthians slot frozen successfully:', result);
        setSelectedHealthiansSlot(slotId);
        toastMessage('Time slot reserved', 'success');
        return true;
      } else {
        // console.error('Failed to freeze Healthians slot:', result);
        toastMessage(result.message || 'Failed to reserve slot', 'error');
        setSelectedHealthiansSlot(null);
        return false;
      }
    } catch (error) {
      console.error('Error freezing Healthians slot:', error);
      toastMessage('Failed to reserve slot', 'error');
      setSelectedHealthiansSlot(null);
      return false;
    }
  };

  const handleBookLabTest = async () => {
    if (!validateForm()) {
      return;
    }

    if (!appointmentDate) {
      toastMessage('Please select appointment date', 'error');
      return;
    }

    if (selectedPackages.length === 0) {
      toastMessage('Please select a lab test package', 'error');
      return;
    }

    // ✅ Check address length BEFORE payment
    const totalAddressLength = calculateAddressLength();
    if (totalAddressLength > 175) {
      toastMessage(
        `The maximum allowed address length is 175 characters. The total address length is calculated as: length of houseNo + street + addressLine1 + addressLine2 + landmark + city + state + country + pincode. Your total: ${totalAddressLength} characters.`,
        'error'
      );
      return;
    }

    if (selectedVendor === 'Thyrocare') {
      if (pincodeServiceable !== true) {
        toastMessage('Thyrocare service not available in this pincode', 'error');
        return;
      }

      if (!selectedThyrocareSlot || !thyrocareSlotTime) {
        toastMessage('Please select a time slot', 'error');
        return;
      }
    }

    if (selectedVendor === 'Healthians') {
      if (healthiansServiceable !== true) {
        toastMessage('Healthians service not available in this pincode', 'error');
        return;
      }

      if (!selectedHealthiansSlot) {
        toastMessage('Please select a time slot', 'error');
        return;
      }
    }

    // console.log('Selected vendor for booking:', selectedVendor);
    // console.log('Selected packages:', selectedPackages);

    const totalAmount = getTotalAmount();

    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Check your internet connection.');
      return;
    }

    const orderRes = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalAmount, currency: 'INR' }),
    });

    const order = await orderRes.json();
    // console.log('Razorpay order created:', order);

    if (!order.id) {
      alert('Unable to create order. Please try again.');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'My Health Passport',
      description: 'Book a Lab Test',
      order_id: order.id,
      handler: async function (response) {
        // console.log('Razorpay payment response:', response);
        verifyTransaction(response);
      },
      prefill: {
        name: formatFullName(userInfo),
        email: userInfo.primary_email,
        contact: userInfo.primary_mobile,
      },
      theme: {
        color: '#3399cc',
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const verifyTransaction = async response => {
    try {
      const verify = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      const verifyRes = await verify.json();
      // console.log('Payment verified:', verifyRes);
      saveTransaction(verifyRes.payment);
    } catch (err) {
      console.error('Error verifying payment:', err);
      toastMessage(err.message, 'error');
    }
  };

  const saveTransaction = async paymentInfo => {
    // console.log('paymentInfo', paymentInfo);
    try {
      const postObj = {
        vendor: selectedVendor.toLowerCase(),
        vendor_booking_id: paymentInfo.id,
        student_id: selectedPatient,
        invoice_id: paymentInfo.invoice_id || '',
        amount: paymentInfo.amount / 100,
        currency: paymentInfo.currency,
        status: paymentInfo.status === 'captured' ? 'success' : 'failed',
        order_id: paymentInfo.order_id,
        // mode: paymentInfo.method,
        // amount_refunded: paymentInfo.amount_refunded,
        description: paymentInfo.description,
        email: paymentInfo.email,
        contact: paymentInfo.contact,
        // error_description: paymentInfo.error_description,
        // error_reason: paymentInfo.error_reason,
      };

      // console.log('Storing transaction:', postObj);
      const response = await storeLabTestTransaction(JSON.stringify(postObj));
      // console.log('Transaction stored:', response);

      if (response.status === true) {
        if (selectedVendor === 'Thyrocare') {
          addToCart();
        } else if (selectedVendor === 'Healthians') {
          createHealthiansBooking();
        }
      } else {
        console.error('Transaction storage failed:', response);
        toastMessage(response.message || response.detail, 'error');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error storing transaction:', err);
      toastMessage(err.message, 'error');
      setShowErrorModal(true);
    }
  };

  const addToCart = async () => {
    const productCodes = getSelectedProductCodes();
    if (productCodes.length === 0 || productCodes.includes(null) || productCodes.includes(undefined)) {
      console.error('Invalid product codes:', productCodes);
      toastMessage('Invalid product codes. Please try again.', 'error');
      return;
    }

    const payload = {
      product_codes: productCodes,
    };

    try {
      // console.log('Adding to cart with payload:', payload);
      const response = await addProductToCart(JSON.stringify(payload));
      console.log('Add to cart response:', response);

      if (response.status === true) {
        console.log('Products added to cart successfully');
        createLabTestOrder();
      } else {
        console.error('Add to cart failed:', response);
        toastMessage(response.message || 'Failed to add products to cart', 'error');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toastMessage('Failed to add products to cart', 'error');
      setShowErrorModal(true);
    }
  };

  const createLabTestOrder = async () => {
    const payload = {
      patient: {
        name: formData.fullName,
        age: parseInt(formData.age) || 0,
        age_type: 'YEAR',
        gender: formData.gender,
        contact_number: formData.contact,
        email: formData.email || '',
        items: selectedPackages.map(pkg => ({
          id: pkg.vendor_product_code || pkg.code,
          type: 'SSKU',
          name: pkg.display_name || pkg.name,
          origin: {
            entered_by: '999',
            platform: 'web',
          },
        })),
      },
      appointment_date: finalAppointmentDateTime || new Date().toISOString(),
      address: formData.fullAddress || `${formData.houseNo}, ${formData.street}`,
      addressLine1: formData.fullAddress || `${formData.houseNo}, ${formData.street}`,
      house_no: formData.houseNo,
      street: formData.street,
      address2: formData.fullAddress || `${formData.houseNo}, ${formData.street}`,
      addressLine2: formData.fullAddress || `${formData.houseNo}, ${formData.street}`,
      landmark: formData.landmark,
      city: formData.city,
      state: formData.state,
      pincode: parseInt(formData.pincode),
      contact_number: formData.contact,
      email: formData.email || '',
      payment_type: 'POSTPAID',
      collection_type: collectionType,
      is_report_hard_copy_required: false,
      remarks: '',
      ref_order_no: `ORD-${Date.now()}-${selectedPatient}`,
      alert_message: [],
      referred_by: { doctor_id: '', doctor_name: '' },
      config: {
        communication: {
          share_report: true,
          share_receipt: true,
          share_modes: { whatsapp: true, email: true },
        },
      },
      is_pdpc_order: false,
    };

    console.log('Creating Thyrocare lab test order with payload:', payload);
    console.log('Selected patient:', selectedPatient);

    try {
      const response = await labTestOrderCreate(selectedPatient, JSON.stringify(payload));
      // console.log('Thyrocare lab test order response:', response);

      if (response.status === true) {
        console.log('Thyrocare booking successful');
        toastMessage('Lab test booked successfully!', 'success');

        setSelectedPackages([]);
        setSelectedVendor(null);
        router.push('/parent/home');
      } else {
        console.error('Thyrocare booking failed:', response);
        toastMessage(response?.detail || 'Failed to book lab test', 'error');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating Thyrocare lab test order:', error);
      toastMessage('Failed to book lab test', 'error');
      setShowErrorModal(true);
    }
  };

  const createHealthiansBooking = async () => {
    try {
      const selectedPackage = selectedPackages[0];

      const calculateDOB = age => {
        const today = new Date();
        const birthYear = today.getFullYear() - parseInt(age);
        const birthMonth = today.getMonth() + 1;
        const birthDay = today.getDate();

        const day = String(birthDay).padStart(2, '0');
        const month = String(birthMonth).padStart(2, '0');
        return `${day}/${month}/${birthYear}`;
      };

      // ✅ ONLY CHANGE: Use GPS coordinates if available, otherwise fallback
      const payload = {
        customer: [
          {
            customer_id: `CUST-${selectedPatient}-${Date.now()}`,
            customer_name: formData.fullName,
            relation: 'self',
            age: parseInt(formData.age) || 0,
            dob: calculateDOB(formData.age),
            gender: formData.gender === 'MALE' ? 'M' : formData.gender === 'FEMALE' ? 'F' : 'O',
            contact_number: formData.contact,
            email: formData.email || '',
            application_number: `APNO-${Date.now()}`,
          },
        ],
        slot: {
          slot_id: selectedHealthiansSlot || '',
        },
        package: [
          {
            deal_id: [selectedPackage.code],
          },
        ],
        customer_calling_number: formData.contact,
        billing_cust_name: formData.fullName,
        gender: formData.gender === 'MALE' ? 'M' : formData.gender === 'FEMALE' ? 'F' : 'O',
        mobile: formData.contact,
        email: formData.email || '',
        state: 26,
        cityId: 23,
        sub_locality: formData.fullAddress,
        latitude: healthiansCoordinates?.lat || '17.385044',
        longitude: healthiansCoordinates?.long || '78.486671',
        address: `${formData.houseNo}, ${formData.street}`,
        zipcode: formData.pincode,
        landmark: formData.landmark || '',
        altmobile: formData.contact,
        altemail: formData.email || '',
        hard_copy: 0,
        vendor_booking_id: `VB-${Date.now()}-${selectedPatient}`,
        vendor_billing_user_id: '768443',
        payment_option: 'prepaid',
        discounted_price: selectedPackage.displayPrice,
        zone_id: healthiansZoneId,
        client_id: '',
      };

      // console.log('Creating Healthians booking with payload:', payload);
      console.log('📍 Coordinates used:', {
        lat: healthiansCoordinates?.lat || '17.385044',
        long: healthiansCoordinates?.long || '78.486671',
        source: healthiansCoordinates?.lat ? 'GPS' : 'Fallback',
      });

      const result = await healthiansCreateBooking(selectedPatient, JSON.stringify(payload));

      console.log('Healthians booking response:', result);

      if (result.status === true) {
        console.log('Healthians booking successful:', result);
        toastMessage('Lab test booked successfully!', 'success');

        setSelectedPackages([]);
        setSelectedVendor(null);
        setSelectedHealthiansSlot(null);
        router.push('/parent/home');
      } else {
        console.error('Healthians booking failed:', result);
        toastMessage(result.message || 'Failed to book lab test', 'error');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating Healthians booking:', error);
      toastMessage('Failed to book lab test', 'error');
      setShowErrorModal(true);
    }
  };

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Header />
      <div className="p-4 sm:p-6 md:p-[26px] md:px-6 lg:px-12 xl:px-18">
        <div className="px-2 sm:px-4 md:px-6 lg:px-10 xl:px-14 grid gap-4 md:gap-6 lg:gap-8 xl:gap-13">
          <Breadcrumbs items={[{ name: 'Book Lab Tests', href: '', current: true }]} homeLabel="Book" homeHref="/parent/book" />
          <div className="flex flex-col gap-[60px]">
            {/* select patient container  */}
            <div className="flex flex-col gap-[23px]">
              <span className="font-medium text-sm leading-none tracking-normal text-black">Select Patient</span>
              <div className="flex gap-5">
                {results.map((patient, index) => (
                  <div
                    key={patient.student_id}
                    className={`flex items-center rounded-lg border-2 p-4 gap-[15px] bg-white cursor-pointer transition-colors ${
                      selectedPatient === patient.student_id ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div
                      className={`w-11 h-11 ${
                        index % 2 === 0 ? 'bg-blue-100' : 'bg-yellow-100'
                      } rounded-full flex items-center justify-center overflow-hidden rounded-10`}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                          fill={index % 2 === 0 ? '#6366F1' : '#F59E0B'}
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-sm leading-none tracking-normal text-black">
                      {patient.first_name} {patient.last_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* select lab test container */}
            <div className="flex flex-col gap-[33px]">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm leading-none tracking-normal text-black">Select Lab Test</span>
                {selectedPackages.length > 0 && <span className="text-sm text-gray-600">{selectedPackages.length} package selected</span>}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="mt-4 text-gray-600">Loading packages...</p>
                </div>
              ) : packages.length === 0 && healthiansPackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No packages available for the selected school</p>
                </div>
              ) : (
                <div className="flex flex-col gap-[40px]">
                  {/* Thyrocare Packages Section */}
                  {packages.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">Thyrocare</span>
                      </h3>
                      <div className="grid gap-[30px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {packages.map(pkg => {
                          const isExpanded = expandedCards[pkg.uniqueId];
                          const testsToShow = isExpanded ? pkg.tests : pkg.tests?.slice(0, 3);

                          return (
                            <div
                              key={pkg.uniqueId}
                              className={`flex flex-col gap-[5px] rounded-[5px] border-2 p-[10px] w-full transition-all ${
                                isPackageSelected(pkg.uniqueId) ? 'border-blue-500 ' : 'border-[#B5CCFF]'
                              }`}
                            >
                              <div className="flex justify-between">
                                <div className="flex gap-[15px] items-start">
                                  <input
                                    type="radio"
                                    name="package_selection"
                                    className="w-[20px] h-[20px] mt-0.5 border border-[#5389FF] text-[#5389FF] accent-[#5389FF] cursor-pointer"
                                    id={`package-${pkg.uniqueId}`}
                                    checked={isPackageSelected(pkg.uniqueId)}
                                    onChange={() => handlePackageToggle(pkg)}
                                  />
                                  <label htmlFor={`package-${pkg.uniqueId}`} className="text-sm cursor-pointer">
                                    {pkg.display_name || pkg.name}
                                  </label>
                                </div>
                                <span className="font-medium text-sm leading-none tracking-normal text-black whitespace-nowrap">₹{pkg.displayPrice}</span>
                              </div>

                              {pkg.tests && pkg.tests.length > 0 && (
                                <>
                                  <div className={`flex flex-col gap-[5px] pl-[35px] ${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
                                    {testsToShow.map((test, idx) => (
                                      <span key={idx} className="font-normal text-[12px] leading-[20px] tracking-[0] text-gray-700">
                                        • {test.name}
                                      </span>
                                    ))}
                                  </div>

                                  {pkg.tests.length > 3 && (
                                    <button
                                      onClick={() => toggleExpand(pkg.uniqueId)}
                                      className="mt-2 text-[#5465FF] text-[12px] font-medium hover:underline cursor-pointer text-left pl-[35px] flex items-center gap-1"
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
                                          <span>+ {pkg.tests.length - 3} more tests • View All</span>
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Healthians Packages Section */}
                  {healthiansPackages.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm">Healthians</span>
                      </h3>
                      <div className="grid gap-[30px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {healthiansPackages.map(pkg => {
                          const isExpanded = expandedCards[pkg.uniqueId];
                          const testsToShow = isExpanded ? pkg.tests : pkg.tests?.slice(0, 3);

                          return (
                            <div
                              key={pkg.uniqueId}
                              className={`flex flex-col gap-[5px] rounded-[5px] border-2 p-[10px] w-full transition-all ${
                                isPackageSelected(pkg.uniqueId) ? 'border-blue-500 ' : 'border-[#B5CCFF]'
                              }`}
                            >
                              <div className="flex justify-between">
                                <div className="flex gap-[15px] items-start">
                                  <input
                                    type="radio"
                                    name="package_selection"
                                    className="w-[20px] h-[20px] mt-0.5 border border-[#5389FF] text-[#5389FF] accent-[#5389FF] cursor-pointer"
                                    id={`package-${pkg.uniqueId}`}
                                    checked={isPackageSelected(pkg.uniqueId)}
                                    onChange={() => handlePackageToggle(pkg)}
                                  />
                                  <label htmlFor={`package-${pkg.uniqueId}`} className="text-sm cursor-pointer">
                                    {pkg.display_name}
                                  </label>
                                </div>
                                <span className="font-medium text-sm leading-none tracking-normal text-black whitespace-nowrap">₹{pkg.displayPrice}</span>
                              </div>

                              {pkg.tests && pkg.tests.length > 0 && (
                                <>
                                  <div className={`flex flex-col gap-[5px] pl-[35px] ${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
                                    {testsToShow.map((test, idx) => (
                                      <span key={idx} className="font-normal text-[12px] leading-[20px] tracking-[0] text-gray-700">
                                        • {test.name}
                                      </span>
                                    ))}
                                  </div>

                                  {pkg.tests.length > 3 && (
                                    <button
                                      onClick={() => toggleExpand(pkg.uniqueId)}
                                      className="mt-2 text-[#5465FF] text-[12px] font-medium hover:underline cursor-pointer text-left pl-[35px] flex items-center gap-1"
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
                                          <span>+ {pkg.tests.length - 3} more tests • View All</span>
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* form container */}
            <div className="flex flex-col gap-[20px]">
              <span className="font-medium text-sm leading-none tracking-normal text-black">Please Enter Address Details</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[25px]">
                {/* Full Name */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="full_name" className="text-xs text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={e => {
                      setFormData({ ...formData, fullName: e.target.value });
                      setErrors({ ...errors, fullName: '' });
                    }}
                    className={`block w-full rounded-md border ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
                </div>

                {/* Contact */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="contact" className="text-xs text-gray-700">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact"
                    name="contact"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={formData.contact}
                    onChange={e => {
                      setFormData({ ...formData, contact: e.target.value });
                      setErrors({ ...errors, contact: '' });
                    }}
                    className={`block w-full rounded-md border ${
                      errors.contact ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.contact && <span className="text-xs text-red-500">{errors.contact}</span>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-xs text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={e => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors({ ...errors, email: '' });
                    }}
                    className={`block w-full rounded-md border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                </div>

                {/* Age */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="age" className="text-xs text-gray-700">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={e => {
                      setFormData({ ...formData, age: e.target.value });
                      setErrors({ ...errors, age: '' });
                    }}
                    className={`block w-full rounded-md border ${
                      errors.age ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.age && <span className="text-xs text-red-500">{errors.age}</span>}
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="gender" className="text-xs text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* House/Flat Number */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="house_no" className="text-xs text-gray-700">
                    House/Flat Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="house_no"
                    name="house_no"
                    type="text"
                    value={formData.houseNo}
                    onChange={e => {
                      setFormData({ ...formData, houseNo: e.target.value });
                      setErrors({ ...errors, houseNo: '' });
                    }}
                    placeholder="Enter house/flat number"
                    className={`block w-full rounded-md border ${
                      errors.houseNo ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.houseNo && <span className="text-xs text-red-500">{errors.houseNo}</span>}
                </div>

                {/* Landmark */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="landmark" className="text-xs text-gray-700">
                    Landmark
                  </label>
                  <input
                    id="landmark"
                    name="landmark"
                    type="text"
                    value={formData.landmark}
                    onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Enter landmark"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Street */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="street" className="text-xs text-gray-700">
                    Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="street"
                    name="street"
                    type="text"
                    value={formData.street}
                    onChange={e => {
                      setFormData({ ...formData, street: e.target.value });
                      setErrors({ ...errors, street: '' });
                    }}
                    placeholder="Enter street"
                    className={`block w-full rounded-md border ${
                      errors.street ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.street && <span className="text-xs text-red-500">{errors.street}</span>}
                </div>

                {/* City */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="city" className="text-xs text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={e => {
                      setFormData({ ...formData, city: e.target.value });
                      setErrors({ ...errors, city: '' });
                    }}
                    placeholder="Enter city"
                    className={`block w-full rounded-md border ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
                </div>

                {/* State */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="state" className="text-xs text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={e => {
                      setFormData({ ...formData, state: e.target.value });
                      setErrors({ ...errors, state: '' });
                    }}
                    placeholder="Enter state"
                    className={`block w-full rounded-md border ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.state && <span className="text-xs text-red-500">{errors.state}</span>}
                </div>

                {/* Pincode */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="pincode" className="text-xs text-gray-700">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      maxLength="6"
                      value={formData.pincode}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, pincode: value });
                        setPincode(value);
                        setPincodeServiceable(null);
                        setHealthiansServiceable(null);
                        setErrors({ ...errors, pincode: '' });
                      }}
                      placeholder="Enter 6-digit pincode"
                      className={`block w-full rounded-md border ${
                        errors.pincode
                          ? 'border-red-500'
                          : (selectedVendor === 'Thyrocare' && pincodeServiceable === true) ||
                            (selectedVendor === 'Healthians' && healthiansServiceable === true)
                          ? 'border-green-500'
                          : 'border-gray-300'
                      } bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    />

                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {pincodeChecking && (
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}

                      {!pincodeChecking &&
                        ((selectedVendor === 'Thyrocare' && pincodeServiceable === true) ||
                          (selectedVendor === 'Healthians' && healthiansServiceable === true)) && (
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}

                      {!pincodeChecking &&
                        ((selectedVendor === 'Thyrocare' && pincodeServiceable === false) ||
                          (selectedVendor === 'Healthians' && healthiansServiceable === false)) && (
                          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                    </div>
                  </div>

                  {((selectedVendor === 'Thyrocare' && pincodeServiceable === true) || (selectedVendor === 'Healthians' && healthiansServiceable === true)) &&
                    !errors.pincode && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Service available in this area
                      </span>
                    )}

                  {errors.pincode && <span className="text-xs text-red-500">{errors.pincode}</span>}
                </div>

                {/* Full Address */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="full_address" className="text-xs text-gray-700">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_address"
                    name="full_address"
                    type="text"
                    value={formData.fullAddress}
                    onChange={e => {
                      setFormData({ ...formData, fullAddress: e.target.value });
                      setErrors({ ...errors, fullAddress: '' });
                    }}
                    placeholder="Enter full address"
                    className={`block w-full rounded-md border ${
                      errors.fullAddress ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {errors.fullAddress && <span className="text-xs text-red-500">{errors.fullAddress}</span>}
                </div>

                {/* Collection Type */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="collection_type" className="text-xs text-gray-700">
                    Collection Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="collection_type"
                    name="collection_type"
                    value={collectionType}
                    onChange={e => setCollectionType(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="HOME_COLLECTION">Home Collection</option>
                    <option value="LAB_VISIT">Lab Visit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SlotBooking Component */}
            {/* SlotBooking Component */}
            {selectedVendor &&
              formData.pincode &&
              formData.pincode.length === 6 &&
              ((selectedVendor === 'Thyrocare' && pincodeServiceable === true) || (selectedVendor === 'Healthians' && healthiansServiceable === true)) && (
                <div className="flex flex-col gap-[20px]">
                  <SlotBooking
                    patient={selectedPatient}
                    vendor={selectedVendor}
                    healthiansZoneId={healthiansZoneId}
                    healthiansPincode={formData.pincode}
                    thyrocarePincode={formData.pincode}
                    selectedPackages={selectedPackages}
                    patientData={formData}
                    healthiansCoordinates={healthiansCoordinates}
                    onDateTimeSelect={dateTime => {
                      setAppointmentDate(dateTime);
                      console.log('Date selected:', dateTime);
                    }}
                    onSlotSelect={(slotId, slotTime) => {
                      // console.log(`${selectedVendor} slot selected - ID: ${slotId}, Time: ${slotTime}`);

                      if (appointmentDate && slotTime) {
                        const combinedDateTime = new Date(appointmentDate);
                        const [hours, minutes] = slotTime.split(':');
                        combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                        // ✅ Format in IST: "2026-01-09T13:00:00" (NO .000Z)
                        const year = combinedDateTime.getFullYear();
                        const month = String(combinedDateTime.getMonth() + 1).padStart(2, '0');
                        const day = String(combinedDateTime.getDate()).padStart(2, '0');
                        const hrs = String(combinedDateTime.getHours()).padStart(2, '0');
                        const mins = String(combinedDateTime.getMinutes()).padStart(2, '0');
                        const secs = String(combinedDateTime.getSeconds()).padStart(2, '0');

                        const istDateTime = `${year}-${month}-${day}T${hrs}:${mins}:${secs}`;

                        setFinalAppointmentDateTime(istDateTime);
                      }

                      if (selectedVendor === 'Healthians') {
                        freezeHealthiansSlot(slotId);
                      } else if (selectedVendor === 'Thyrocare') {
                        setSelectedThyrocareSlot(slotId);
                        setThyrocareSlotTime(slotTime);
                        toastMessage('Time slot selected', 'success');
                      }
                    }}
                  />
                </div>
              )}

            {/* button */}
            <div className="flex justify-end mt-3 sm:mt-4 md:mt-[22px]">
              <button
                className="rounded-[5px] py-2 sm:pt-[10px] sm:pb-[10px] px-4 sm:pr-[20px] sm:pl-[20px] bg-[#5465FF] text-white flex items-center gap-2 whitespace-nowrap"
                onClick={handleBookLabTest}
              >
                <span className="text-xs sm:text-sm font-normal">Book Test</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 sm:size-5">
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Error Modal */}
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />
    </Suspense>
  );
};

export default labTests;
