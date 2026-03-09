'use client';

import { useRouter } from 'next/navigation';
import { Input, ConfigProvider } from 'antd';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { loginWithMobile, verifyOTP } from '@/services/authApi';
import nookies from 'nookies';
import { toastMessage } from '@/helpers/utilities';
import Spinner from '@/components/UI/Spinner';

export default function ParentLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [counter, setCounter] = useState(0); // Timer

  useEffect(() => {
    counter <= 0 ? setTransactionId(null) : '';
    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const onChangeOTP = value => {
    setOtpValue(value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const phone = e.target.phone.value;
    try {
      let formData = JSON.stringify({
        mobile: phone,
      });
      const response = await loginWithMobile(formData);
      if (response.status === true) {
        setError(null);
        const msg = response.data?.test_otp
          ? `${response.message} (Test OTP: ${response.data.test_otp})`
          : response.message;
        toastMessage(msg, 'success');
        setCounter(119);
        setTransactionId(response.data.transaction_id);
      } else {
        setError(response.message || 'Login failed. Please check your phone number.');
      }
    } catch (err) {
      toastMessage(err || 'An error occurred during login. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const VerifyOTP = async () => {
    setLoading(true);
    try {
      let formData = JSON.stringify({
        transaction_id: transactionId,
        otp: otpValue,
      });

      const response = await verifyOTP(formData);
      if (response.status === true) {
        toastMessage(response.message, 'success');
        nookies.set(null, 'access_token', response.data.access_token, {
          path: '/',
          sameSite: true,
          secure: true,
          maxAge: 86400, // one day
        });

        nookies.set(null, 'role', response.data.user_role, {
          path: '/',
          sameSite: true,
          secure: true,
          maxAge: 86400, // one day
        });

        nookies.set(null, 'root', 'parent', {
          path: '/',
          sameSite: true,
          secure: true,
          maxAge: 86400, // one day
        });

        localStorage.setItem('user_info', btoa(JSON.stringify(response.data)));
        router.push(`/parent/home`);
      } else {
        setError(response.message || 'Login failed. Please check your credentials.', 'error');
      }
    } catch (err) {
      toastMessage(err || 'An error occurred during login. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <>
      <div className={classNames(loading ? 'opacity-20' : '', 'min-h-full')}>
        <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-5 lg:px-8">
          <div className="flex lg:flex-1"></div>
        </nav>
        <div className="flex flex-col justify-center px-6 md:px-2 lg:px-8 ">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center gap-[24px]">
            <div>
              <Image alt="company logo" src="/iconx/primary-logo.svg" className="h-60px w-180px" width={180} height={60} />
            </div>
            <h2 className="font-inter font-semibold text-[20px] leading-[25px] tracking-[0] text-gray-900">Hi, Welcome to My Health Passport!</h2>
          </div>
          <div className="mt-[35px] sm:mx-auto sm:w-full sm:max-w-sm">
            {transactionId === null ? (
              <div className=" mt-4">
                <p className="font-inter font-normal text-[14px] leading-[100%] tracking-[0%] text-center mb-4">Please Send OTP</p>
                <form action="#" method="POST" onSubmit={handleSubmit} className="gap-[24px] flex flex-col">
                  <div className="relative">
                    <input
                      id="phone-input"
                      name="phone"
                      type="number"
                      required
                      aria-describedby="helper-text-explanation"
                      autoComplete="phone"
                      placeholder="Enter Phone Number"
                      className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      autoFocus
                    />
                  </div>
                  {error !== null ? <p className="text-red-500 text-sm m-2">{error}</p> : ''}
                  <div className="">
                    <button
                      type="submit"
                      className="flex w-full mt-2 cursor-pointer justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      disabled={counter > 0 ? true : false}
                    >
                      Get OTP{' '}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              ''
            )}
            {transactionId !== null ? (
              <div className="flex flex-col items-center p-[10px] w-full gap-5 mt-4">
                <p className="font-inter font-normal text-[14px] leading-[100%] tracking-[0%] text-center mb-4">Please Enter OTP</p>
                <ConfigProvider
                  theme={{
                    components: {
                      InputOTP: {
                        inputWidth: 40,
                        inputHeight: 40,
                        borderRadius: 4,
                        borderColor: '#D5D9E2',
                        activeBorderColor: '#3B82F6',
                      },
                    },
                  }}
                >
                  <Input.OTP
                    value={otpValue}
                    onChange={onChangeOTP}
                    length={6}
                    size="large"
                    className="custom-otp-input"
                    inputClassName="text-center text-lg font-medium"
                    inputStyle={{
                      width: 40,
                      height: 40,
                      fontSize: 18,
                      fontWeight: 500,
                      borderColor: '#D5D9E2',
                    }}
                    autoFocus
                    formatter={value => value.replace(/\D/g, '')}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </ConfigProvider>
                {error !== null ? <p className="text-red-500 text-sm m-2">{error}</p> : ''}
                <button
                  type="button"
                  className="flex w-full mt-2 cursor-pointer justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={VerifyOTP}
                  disabled={counter > 0 ? false : true}
                >
                  Login
                </button>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
      {loading && <Spinner status={loading} />}
    </>
  );
}
