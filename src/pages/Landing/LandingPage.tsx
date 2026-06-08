import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import ProblemsSection from './sections/ProblemsSection';
import SolutionSection from './sections/SolutionSection';
import FeaturesSection from './sections/FeaturesSection';
import PricingSection from './sections/PricingSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 font-sans">
      <HeroSection onGetStarted={handleGetStarted} />
      <ProblemsSection />
      <SolutionSection />
      <FeaturesSection />
      <PricingSection onGetStarted={handleGetStarted} />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
};

export default LandingPage;
