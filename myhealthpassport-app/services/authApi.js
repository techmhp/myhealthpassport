'use server';

const BaseURL = process.env.NEXT_PUBLIC_API_URL;
// const UatBaseURL = process.env.NEXT_PUBLIC_API_URL_UAT;

const Headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

class V1AuthApi {
  constructor(url = BaseURL, headers = Headers) {
    this.url = url;
    this.headers = headers;
  }

  GetCall = async endpoint => {
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'GET',
      headers: this.headers,
      mode: this.mode,
    });
    const response = await result.text();
    return response;
  };

  FormPostCall = async (endpoint, data) => {
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'POST',
      body: data,
      mode: this.mode,
    });
    const response = await result.json();
    return response;
  };

  PostCall = async (endpoint, data) => {
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'POST',
      headers: this.headers,
      body: data,
    });
    const response = await result.json();
    return response;
  };
}

// For UAT Base Url

class UatAuthApi {
  constructor(url = BaseURL, headers = Headers) {
    this.url = url;
    this.headers = headers;
  }

  GetCall = async endpoint => {
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'GET',
      headers: this.headers,
      mode: this.mode,
    });
    const response = await result.text();
    return response;
  };

  FormPostCall = async (endpoint, data) => {
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'POST',
      body: data,
      mode: this.mode,
    });
    const response = await result.json();
    return response;
  };

  PostCall = async (endpoint, data) => {
    const endpoint_url = this.url + endpoint;
    const result = await fetch(endpoint_url, {
      method: 'POST',
      headers: this.headers,
      body: data,
    });
    const response = await result.json();
    return response;
  };
}

// 2.1.Regular Login
export const loginWithPassword = async (data) => {
  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }

  const call = new V1AuthApi();
  const response = await call.FormPostCall(`/general/regular-login`, formData);
  return response;
};

// 6.1.Parent Login with Mobile
export const loginWithMobile = async (data) => {
  const call = new V1AuthApi();
  const response = await call.PostCall(`/general/login-mobile`, data);
  return response;
};

// 6.2.Parent Login Verify - Otp
export const verifyOTP = async (data) => {
  const call = new V1AuthApi();
  const response = await call.PostCall(`/general/verify-otp`, data);
  return response;
};

// 14.2 User forgot password
export const forgotPassword = async (data) => {
  const call = new V1AuthApi();
  const response = await call.PostCall(`/general/forgot-password`, data);
  return response;
};

// 14.3 User reset password
export const resetPassword = async (data) => {
  const call = new V1AuthApi();
  const response = await call.PostCall(`/general/reset-password`, data);
  return response;
};
