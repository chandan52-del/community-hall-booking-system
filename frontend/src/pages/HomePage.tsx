import React from 'react';
import { HeroSection } from '../components/HeroSection';
import {
  CallToActionSection,
  FacilitiesSection,
  FeaturedVenuesSection,
  HowItWorksSection,
  TestimonialsSection,
  WhyChooseUsSection,
} from '../components/HomeSections';

export const HomePage: React.FC = () => (
  <>
    <HeroSection />
    <FeaturedVenuesSection />
    <HowItWorksSection />
    <WhyChooseUsSection />
    <FacilitiesSection />
    <TestimonialsSection />
    <CallToActionSection />
  </>
);

export default HomePage;
