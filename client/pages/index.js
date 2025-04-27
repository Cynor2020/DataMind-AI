'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login'); // Redirect to login page
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <header className="hero-section">
        <h1>DataMind-AI</h1>
        <p>
          Transform your data into actionable insights with our cutting-edge AI-powered platform.
        </p>
        <button className="get-started-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      </header>

      {/* Features Section */}
      {/* <section className="features-section">
        <h2>Our Core Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>Seamless Uploads</h3>
            <p>Upload CSV, TXT, or PDF files with ease and speed.</p>
          </div>
          <div className="feature-item">
            <h3>Advanced Analytics</h3>
            <p>Leverage AI to uncover deep insights from your data.</p>
          </div>
          <div className="feature-item">
            <h3>Secure Platform</h3>
            <p>Your data is protected with enterprise-grade security.</p>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      {/* <section className="cta-section">
        <h2>Join the Data Revolution</h2>
        <p>Start analyzing your data today with DataMind-AI’s intuitive tools.</p>
        <button className="get-started-btn" onClick={handleGetStarted}>
          Start Now
        </button>
      </section> */}
    </div>
  );
};

export default Home;