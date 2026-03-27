"use client";
import { useState } from 'react';
import Grainient from '../components/Grainient';
import StaggeredMenu from '../components/StaggeredMenu';
import Preloader from '../components/Preloader';
import Hero from '../components/Hero';
import Feature from '../components/Feature';
import ScrollVelocity from '../components/ScrollVelocity';
import WhatWeDo from '../components/About';
import ScrollMarquee from '../components/ScrollMarquee';
import FeaturedProjectsSection from '../components/FeaturedProjects';
import ScrollCards from '../components/ScrollCards';
import Footer from '../components/Footer';
import SmoothScroll from '../components/SmoothScroll';

const menuItems = [
  { label: 'Home',     ariaLabel: 'Go to home page',  link: '/' },
  { label: 'About',    ariaLabel: 'Learn about us',    link: '#about' },
  { label: 'Features', ariaLabel: 'View our services', link: '#features' },
  { label: 'Contact',  ariaLabel: 'Get in touch',      link: '#contact' },
];

const socialItems = [
  { label: 'Instagram',  link: 'https://www.instagram.com/blusteak/' },
  { label: 'LinkedIn', link: 'https://in.linkedin.com/company/blusteak' },
];

export default function Home() {
  const [done, setDone] = useState(false);

  return (
    <SmoothScroll>
      {!done && <Preloader onComplete={() => setDone(true)} />}

      {/* Fixed background grain */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Grainient
          color1="#0F2854"
          color2="#1C4D8D"
          color3="#4988C4"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      <StaggeredMenu
        isFixed={true}
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        changeMenuColorOnOpen={true}
        colors={['#1C4D8D', '#0F2854']}
        accentColor="#4988C4"
      />

      {/* Hero */}
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <Hero />
      </div>

      {/* Feature */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div className="feature-section-wrap">
          <Feature />
        </div>
      </div>

      {/* ScrollVelocity */}
      <div style={{
        overflowX: 'clip', width: '100vw',
        position: 'relative', left: '50%',
        transform: 'translateX(-50%)', zIndex: 2,
      }}>
        <ScrollVelocity
          texts={['EYES OPEN ✦ ALWAYS WATCHING ✦ BRAND SAFE ✦ ZERO MISSES ✦ BUILT DIFFERENT ✦ STAYS SHARP ✦ NEVER SLEEPS ✦', 'Every Project ✦ Your Stack ✦ Your Rules ✦']}
          velocity={60}
          numCopies={10}
          className="scroll-velocity-text"
        />
      </div>

      {/* About */}
      <div id="about" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <WhatWeDo />
      </div>

      {/* ScrollMarquee */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <ScrollMarquee />
      </div>

      {/* FeaturedProjects */}
      <div id="features" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <FeaturedProjectsSection />
      </div>

      {/* ScrollMarquee */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <ScrollMarquee />
      </div>

      {/* ScrollCards */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <ScrollCards />
      </div>

      {/* ScrollMarquee */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <ScrollMarquee />
      </div>

      <Footer />
    </SmoothScroll>
  );
}