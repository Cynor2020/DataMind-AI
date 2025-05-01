import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        alert(`Processing prompt: ${prompt}. Redirecting to build... (Simulated)`);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f1c3a 50%, #0a0f24 100%)',
          opacity: 0.95,
        }}
      ></div>

      {/* Glowing Wave Pattern at Bottom */}
      <div
        className="absolute bottom-0 left-0 w-full h-1/2"
        style={{
          background: 'linear-gradient(90deg, #3b82f6 0%, #a855f7 50%, #3b82f6 100%)',
          opacity: 0.15,
          filter: 'blur(20px)',
          clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)',
        }}
      ></div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 sm:p-6 z-10">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">CYNOR</h1>
        <button
          onClick={handleGetStarted}
          className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          Get Started
        </button>
      </header>

      {/* Main Content */}
      <div className="text-center z-10 px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 sm:mb-4">
          DataMind-AI
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-6 sm:mb-8">
          Prompt, run, edit, and deploy full-stack web and mobile apps.
        </p>

        {/* Prompt Input */}
        <form onSubmit={handlePromptSubmit} className="mb-6 sm:mb-8 flex justify-center">
          <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="How can DataMind-AI help you today?"
              className="w-full p-3 sm:p-4 rounded-lg bg-gray-800 bg-opacity-50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-sm sm:text-base"
            />
            {/* Icons inside input (simulating the paperclip and sparkles) */}
            <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656L5.758 10.757a6 6 0 008.486 8.486L21 12"></path>
              </svg>
            </div>
            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </form>

        {/* Suggestion Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 sm:mt-4">
          {[
            'Import from Figma',
            'Create a doc site with Vitepress',
            'Build a mobile app with Expo',
            'Scaffold UI with shadcn',
            'Start a blog with Astro',
            'Draft a presentation with Slidev',
          ].map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-700 bg-opacity-50 text-gray-300 rounded-full border border-gray-600 hover:bg-gray-600 hover:text-white transition-all duration-300 text-xs sm:text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;