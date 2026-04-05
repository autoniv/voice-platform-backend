// pages/_app.js
import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);
    if (!token && !isPublic) {
      router.push('/login');
    }
    if (token && isPublic) {
      router.push('/dashboard');
    }
  }, [router.pathname]);

  return <Component {...pageProps} />;
}
