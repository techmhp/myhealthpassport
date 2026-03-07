'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input, ConfigProvider } from 'antd';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { roleConstancts } from '@/services/generalApis';
import { forgotPassword, resetPassword } from '@/services/authApi';
import { formatString } from '@/helpers/utilities';
import { toastMessage } from '@/helpers/utilities';
import Spinner from '@/components/UI/Spinner';
import { ChevronDownIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';

export default function VerifyOTP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role_type = searchParams.get('role_type');
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState({});
  const [otpValue, setOtpValue] = useState('');
  const [counter, setCounter] = useState(0);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [otpJson, setOtpJson] = useState({ role_type: role_type || '', username: '' });
  const [otpSentTo, setOtpSentTo] = useState(''); // To show where OTP was sent

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Fetch roles
    roleConstancts()
      .then(res => {
        if (res.status === true) {
          setRoles(res);
        }
      })
      .catch(err => {
        console.error('Error fetching roles:', err);
      });
  }, []);

  useEffect(() => {
    // Timer logic
    if (counter <= 0 && transactionId) {
      // Don't reset transaction_id, just disable resend
      return;
    }

    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  // Password validation
  useEffect(() => {
    if (newPassword) {
      setPasswordValidation({
        minLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
      });
    }
  }, [newPassword]);

  const onChangeForm1 = e => {
    const { name, value } = e.target;
    setOtpJson({ ...otpJson, [name]: value });
    setError('');
  };

  const onChangeOTP = value => {
    setOtpValue(value);
    setError('');
  };

  const togglePasswordVisibility = field => {
    if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else if (field === 'confirm') {
      setShowConfirmNewPassword(!showConfirmNewPassword);
    }
  };

  const formatTimer = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOTPSubmit = async e => {
    e.preventDefault();
    setError('');

    // Validation
    if (!otpJson.role_type) {
      setError('Please select your role');
      return;
    }

    if (!otpJson.username || otpJson.username.trim() === '') {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(JSON.stringify(otpJson));

      if (response.status === true) {
        setCounter(179); // 2 minutes 59 seconds
        setTransactionId(response.data.transaction_id);

        // Show where OTP was sent (from API message)
        const message = response.message || 'OTP sent successfully';
        setOtpSentTo(message);

        // Show success toast
        toastMessage(message, 'success');
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
        toastMessage(response.message || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err?.message || 'Failed to send OTP. Please check your connection and try again.');
      toastMessage('Failed to send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtpValue('');
    setCounter(179); // Reset timer

    setLoading(true);
    try {
      const response = await forgotPassword(JSON.stringify(otpJson));

      if (response.status === true) {
        setTransactionId(response.data.transaction_id);
        const message = response.message || 'OTP resent successfully';
        setOtpSentTo(message);
        toastMessage(message, 'success');
      } else {
        setError(response.message || 'Failed to resend OTP');
        toastMessage(response.message || 'Failed to resend OTP', 'error');
        setCounter(0); // Stop timer on error
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('Failed to resend OTP. Please try again.');
      toastMessage('Failed to resend OTP', 'error');
      setCounter(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Validation
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!passwordValidation.hasUpperCase || !passwordValidation.hasLowerCase || !passwordValidation.hasNumber) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    setLoading(true);
    try {
      const resetPayload = {
        transaction_id: transactionId,
        otp: otpValue,
        new_password: newPassword,
      };

      const response = await resetPassword(JSON.stringify(resetPayload));

      if (response.status === true) {
        toastMessage('Password reset successfully! Redirecting to login...', 'success');

        // Clear form
        setOtpValue('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTransactionId(null);
        setCounter(0);

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
        toastMessage(response.message || 'Failed to reset password', 'error');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      toastMessage('Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setTransactionId(null);
    setCounter(0);
    setOtpValue('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
  };

  return (
    <>
      <div className="min-h-screen">
        {/* <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-3 lg:px-8 bg-white shadow-sm">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5">
              <Image alt="company logo" src="/iconx/company-logo.svg" className="h-8 w-auto" width={118} height={40} />
            </a>
          </div>
        </nav> */}

        <div className="flex flex-col justify-center px-6 py-10 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex flex-col items-center gap-4 mb-4">
              <Image alt="Site logo" src="/iconx/primary-logo.svg" width={200} height={90} />
              <div className="text-center mt-2">
                <h2 className=" text-[24px] font-[800] text-gray-900">Forgot Password?</h2>
                <p className="mt-0 text-sm text-gray-600">
                  {transactionId ? 'Enter the OTP and set your new password' : "No worries! We'll send you reset instructions"}
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="mb-0">
              <div className="flex items-center justify-center">
                <div className={`flex items-center ${transactionId === null ? 'text-indigo-600' : 'text-green-600'}`}>
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full ${
                      transactionId === null ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'
                    }`}
                  >
                    {transactionId === null ? '1' : '✓'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Enter Details</span>
                </div>
                <div className={`w-16 h-0.5 mx-4 ${transactionId ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${transactionId !== null ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full ${
                      transactionId !== null ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Reset Password</span>
                </div>
              </div>
            </div>

            <div className="py-8 px-6 sm:px-10">
              {transactionId === null ? (
                <form onSubmit={handleOTPSubmit} className="space-y-6">
                  {!['SCHOOL_STAFF', 'CONSULTANT_TEAM'].includes(role_type) && (
                    <div>
                      <label htmlFor="role_type" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Your Role <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="role_type"
                          name="role_type"
                          value={otpJson.role_type}
                          onChange={onChangeForm1}
                          required
                          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        >
                          <option value="">Select Your Role</option>
                          {roles.status === true &&
                            roles.data?.roles_details?.map((role, index) =>
                              !['PARENT', 'SCHOOL_STAFF', 'CONSULTANT_TEAM'].includes(role.role_type) ? (
                                <option key={index} value={role.role_type}>
                                  {formatString(role.role_type.toLowerCase())}
                                </option>
                              ) : null
                            )}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={otpJson.username}
                      onChange={onChangeForm1}
                      required
                      placeholder="Enter your username"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>

                  <div className="text-center mt-2">
                    <button type="button" onClick={() => router.back()} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      ← Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* OTP Info */}
                  {/* <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-900 font-medium">{otpSentTo}</p>
                  </div> */}

                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-Digit OTP</label>
                    <div className="flex justify-center">
                      <ConfigProvider
                        theme={{
                          components: {
                            InputOTP: {
                              inputWidth: 48,
                              inputHeight: 56,
                              borderRadius: 8,
                              borderColor: '#D1D5DB',
                              activeBorderColor: '#4F46E5',
                            },
                          },
                        }}
                      >
                        <Input.OTP
                          value={otpValue}
                          onChange={onChangeOTP}
                          length={6}
                          size="large"
                          inputStyle={{
                            fontSize: 20,
                            fontWeight: 600,
                            textAlign: 'center',
                          }}
                        />
                      </ConfigProvider>
                    </div>
                  </div>

                  {/* Timer and Resend */}
                  <div className="text-center">
                    {counter > 0 ? (
                      <p className="text-sm text-gray-600">
                        Resend OTP in <span className="font-semibold text-indigo-600">{formatTimer(counter)}</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Didn't receive OTP? Resend
                      </button>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        placeholder="Enter new password"
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Requirements */}
                    {newPassword && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-700">Password must contain:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            8+ characters
                          </div>
                          <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Uppercase
                          </div>
                          <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Lowercase
                          </div>
                          <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Number
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && <p className="mt-2 text-xs text-red-600">Passwords do not match</p>}
                    {confirmNewPassword && newPassword === confirmNewPassword && (
                      <p className="mt-2 text-xs text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Passwords match
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || newPassword !== confirmNewPassword || !otpValue || otpValue.length !== 6}
                    className="w-full flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  <div className="text-center">
                    <button type="button" onClick={handleBackToForm} className="text-sm font-medium text-gray-600 hover:text-gray-800">
                      ← Change Username
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      {loading && <Spinner status={loading} />}
    </>
  );
}
