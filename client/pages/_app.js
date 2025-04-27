'use client';

import '../styles/globals.css'; // ✅ Import global styles
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';

function MyApp({ Component, pageProps }) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  // Pass theme state and toggle function to all components via pageProps
  const pagePropsWithTheme = {
    ...pageProps,
    isDarkTheme,
    toggleTheme,
  };

  return (
    <div className={isDarkTheme ? 'dark-theme' : 'light-theme'}>
      <Component {...pagePropsWithTheme} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default MyApp;