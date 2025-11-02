import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

export function useFrameworkReady() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Framework ready - you can add any initialization logic here
    console.log('Framework ready!');

    // Example: Redirect logic based on authentication state
    // if (!isAuthenticated && segments[0] !== 'auth') {
    //   router.replace('/auth');
    // }

  }, [segments]);
}
