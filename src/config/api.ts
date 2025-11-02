import { Platform } from 'react-native';

const REPLIT_DOMAIN = process.env.EXPO_PUBLIC_REPLIT_DOMAIN || 'df572f05-a1de-446e-88e9-36ba39e31ed4-00-1ampnsphfoddl.pike.replit.dev';

const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:3000/api',
      ios: 'http://localhost:3000/api',
      default: `https://${REPLIT_DOMAIN}/api`,
    })
  : `https://${REPLIT_DOMAIN}/api`;

export const API_ENDPOINTS = {
  TEST: `${API_BASE_URL}/test`,
  // Add more endpoints as needed
};

export const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
