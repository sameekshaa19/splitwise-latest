import { Platform } from 'react-native';

// Use localhost for Android emulator, 10.0.2.2 for Android emulator to localhost, or your machine's IP for physical devices
const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:5000/api',
      ios: 'http://localhost:5000/api',
      default: 'http://localhost:5000/api',
    })
  : 'https://your-production-api.com/api';

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
