'use server';

const BaseURL = process.env.NEXT_PUBLIC_API_URL;

const Headers = {
  'Content-Type': 'text/html',
  'Access-Control-Allow-Origin': '*',
};

// 1.1. Constants
export const roleConstancts = async () => {
  const response = await fetch(`${BaseURL}/general/constants`, {
    headers: Headers,
    method: 'GET',
    mode: 'cors',
  });
  const result = await response.json();
  return result;
};
