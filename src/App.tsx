/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue } from 'motion/react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, getDocFromServer, doc } from 'firebase/firestore';
import { ArrowUpRight, Mail, ChevronDown, Menu, X, Loader2, Droplets, ReceiptText, Sparkles, Compass } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Animation Variants ---
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.2, delayChildren: 0.3 }
};

const slowReveal = {
  initial: { opacity: 0, filter: 'blur(10px)' },
  whileInView: { opacity: 1, filter: 'blur(0px)' },
  viewport: { once: true },
  transition: { duration: 2, ease: [0.22, 1, 0.36, 1] }
};

// --- Components ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const isHome = location.pathname === '/';

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'bg-bazaar-black/60 backdrop-blur-lg py-5 border-b border-bazaar-paper/5' 
          : 'bg-transparent py-8 border-b border-transparent'
      }`}
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="h-4 block" aria-label="Star Bazaar Home">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="h-full"
          >
            <img 
              src="/images/starbazaar-wordmark.svg" 
              alt="" 
              className="h-full w-auto"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </Link>
        
        <div className="hidden md:flex space-x-12">
          <Link 
            to="/why-we-exist"
            className="text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/60 hover:text-bazaar-gold focus-visible:text-bazaar-gold transition-colors duration-300"
          >
            Why We Exist
          </Link>
          {['Manifesto', 'Principles', 'Apply'].map((item) => (
            <a 
              key={item} 
              href={isHome ? `#${item.toLowerCase()}` : `/#${item.toLowerCase()}`}
              className="text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/60 hover:text-bazaar-gold focus-visible:text-bazaar-gold transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </div>

        <button 
          ref={menuButtonRef}
          className="md:hidden text-bazaar-paper p-2 -mr-2" 
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-bazaar-black/60 backdrop-blur-md z-[-1] md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            id="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-bazaar-black/95 backdrop-blur-xl border-b border-bazaar-paper/5 py-12 px-6 flex flex-col space-y-8 md:hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <Link 
              to="/why-we-exist"
              onClick={() => setIsOpen(false)}
              className="text-lg uppercase tracking-[0.3em] text-bazaar-paper/60 hover:text-bazaar-gold transition-all duration-300"
            >
              Why We Exist
            </Link>
            {['Manifesto', 'Principles', 'Apply'].map((item) => (
              <motion.a 
                key={item} 
                href={isHome ? `#${item.toLowerCase()}` : `/#${item.toLowerCase()}`}
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.02, x: 10 }}
                className="text-lg uppercase tracking-[0.3em] text-bazaar-paper/60 hover:text-bazaar-gold transition-all duration-300"
              >
                {item}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Enhanced parallax: text moves up slightly, background moves down more significantly
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 250]); 
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  // Background specific transforms - start at 85% of scroll out
  const bgOpacity = useTransform(scrollYProgress, [0.85, 1], [0.5, 0]);
  const bgBlur = useTransform(scrollYProgress, [0.85, 1], ["blur(0px)", "blur(40px)"]);

  return (
    <section ref={ref} className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background Image Layer */}
      <motion.div 
        style={{ y: y2, scale: 1.1, opacity: bgOpacity, filter: bgBlur }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="/images/sb-tigereye.png" 
          alt="" 
          className="w-full h-full object-cover object-center mix-blend-screen"
          referrerPolicy="no-referrer"
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
        />
      </motion.div>

      {/* Background Ambient Light */}
      <motion.div 
        style={{ y: y2, opacity: bgOpacity }}
        className="absolute inset-0 z-0 flex items-center justify-center"
      >
        <motion.div 
          animate={{ 
            opacity: [0.08, 0.18, 0.08],
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ 
            opacity: { duration: 12, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 15, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 60, repeat: Infinity, ease: "linear" }
          }}
          className="w-[100vw] h-[100vw] bg-gradient-to-tr from-bazaar-gold/10 via-aura-start/5 to-transparent rounded-full blur-[150px]"
        />
      </motion.div>

      <motion.div 
        style={{ y: y1, opacity, scale }}
        className="relative z-10 text-center max-w-5xl"
      >
        <motion.span 
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="block text-bazaar-gold text-[10px] md:text-xs uppercase mb-8"
        >
          The Living Market · Now Forming
        </motion.span>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-7xl lg:text-8xl font-serif leading-[0.9] mb-12"
        >
          Belong to a <br />
          <span className="aura-headline">collective</span> <br />
          made by makers, <br />
          for makers.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1.5 }}
        >
          <a 
            href="#apply"
            className="group relative inline-flex items-center px-10 py-4 border border-bazaar-paper/20 rounded-full overflow-hidden transition-all duration-500 hover:border-bazaar-gold focus-visible:border-bazaar-gold"
          >
            <span className="relative z-10 text-[10px] uppercase tracking-[0.2em] group-hover:text-bazaar-paper group-focus-visible:text-bazaar-paper transition-colors duration-500">
              Join the Bazaar
            </span>
            <div className="absolute inset-0 bg-bazaar-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]" />
          </a>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4"
      >
        <span className="text-[9px] uppercase tracking-[0.3em] vertical-rl">Scroll</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={14} className="text-bazaar-paper/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

const ValueProp = () => {
  return (
    <section className="py-32 md:py-64 px-6 md:px-12 bg-bazaar-black relative z-10 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 flex justify-center relative"
        >
          {/* Aura Glow behind brandmark */}
          <motion.div 
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-aura-start/20 blur-3xl rounded-full"
          />

          <motion.div 
            className="h-32 w-32 relative z-10"
            style={{ 
              backgroundImage: "linear-gradient(25deg, var(--color-aura-start) 20%, var(--color-bazaar-gold) 50%, transparent 100%)",
              backgroundSize: "200% 200%",
              maskImage: "url('/images/starbazaar-brandmark.svg')",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url('/images/starbazaar-brandmark.svg')",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center"
            }}
            animate={{ 
              rotate: 360,
              backgroundPosition: ["0% 50%", "100% 0%", "50% 100%", "0% 100%", "0% 50%"],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              rotate: { duration: 40, repeat: Infinity, ease: "linear" },
              backgroundPosition: { duration: 20, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </motion.div>
        <motion.h2 
          {...fadeInUp}
          className="text-3xl md:text-5xl lg:text-6xl font-serif leading-[1.1] text-bazaar-paper mb-16"
        >
          <span className="aura-headline">Star Bazaar</span> is a mythic marketplace for independent makers committed to sustainable materials and ethical labor.
        </motion.h2>
        <motion.p 
          {...fadeInUp}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base text-bazaar-paper/40 uppercase tracking-[0.2em] font-sans"
        >
          We are building the exit from the economy of disposability.
        </motion.p>
      </div>
    </section>
  );
};

const WhyWeExist = () => {
  const blockRef = useRef(null);
  const brandmarkRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start end", "end start"]
  });

  const { scrollYProgress: brandmarkScroll } = useScroll({
    target: brandmarkRef,
    offset: ["start end", "end start"]
  });

  const blockY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const brandmarkRotate = useTransform(brandmarkScroll, [0, 1], [0, 360]);
  const brandmarkScale = useTransform(brandmarkScroll, [0, 0.5, 1], [0.8, 1.2, 0.8]);

  return (
    <div id="why-we-exist" className="relative bg-bazaar-black min-h-screen pt-32">
      {/* Page Hero */}
      <section className="relative py-32 md:py-48 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="/images/SB-flowers-hero.png" 
            alt="" 
            className="w-full h-full object-cover object-center mix-blend-luminosity"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bazaar-black via-transparent to-bazaar-black" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="text-bazaar-gold text-[11px] font-medium tracking-[0.4em] uppercase mb-12">
              THE WORLD WE FACE
            </p>
            <h1 className="text-5xl md:text-9xl font-serif leading-[0.9] tracking-tighter mb-12">
              Why We <br />
              <span className="aura-headline italic">Exist.</span>
            </h1>
            <div className="w-px h-24 bg-gradient-to-b from-bazaar-gold/60 to-transparent mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="relative py-32 px-6 md:px-12 border-b border-bazaar-paper/5">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            {...fadeInUp}
            className="space-y-12"
          >
            <div className="flex items-center space-x-6">
              <div className="w-12 h-px bg-bazaar-gold/40" />
              <span className="text-bazaar-gold text-[10px] uppercase tracking-[0.4em]">The Mission</span>
            </div>
            
            <h2 className="text-3xl md:text-6xl font-serif leading-[1.1] tracking-tight">
              To restore the <span className="aura-headline">sacred bond</span> between maker and material.
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="space-y-6">
                <h3 className="text-bazaar-gold text-[11px] uppercase tracking-[0.2em] font-medium">Sustainable Materials</h3>
                <p className="text-lg leading-relaxed text-bazaar-paper/70 font-light">
                  We exist to provide a sanctuary for those who refuse the petrochemical pipeline. Our commitment is absolute: we exclusively support natural, biodegradable fibres—hemp, linen, organic cotton, and TENCEL™—ensuring that every garment can eventually return to the earth without leaving a trace of plastic.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-bazaar-gold text-[11px] uppercase tracking-[0.2em] font-medium">Ethical Labor</h3>
                <p className="text-lg leading-relaxed text-bazaar-paper/70 font-light">
                  By honoring the labor of independent makers and ensuring every hand is fairly compensated, we are weaving a new economy. We reject the race to the bottom, instead prioritizing radical transparency and long-term relationships with artisans who are masters of their craft.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Refusal */}
      <section className="relative py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            {...fadeInUp}
            className="text-3xl md:text-6xl font-serif leading-[1.1] tracking-tight mb-16"
          >
            We are not just a <span className="aura-headline">marketplace.</span><br />
            We are a collective refusal of the disposable.
          </motion.h2>

          <motion.p 
            {...fadeInUp}
            className="text-xl md:text-3xl font-serif leading-relaxed text-bazaar-paper/80 mb-16"
          >
            Star Bazaar is the opening move in a much larger construction: the assembly of an alternative to an economy that has been quietly poisoning us for generations.
          </motion.p>
          
          <motion.div 
            {...fadeInUp}
            className="w-full h-px bg-bazaar-paper/10"
          />
        </div>
      </section>

      {/* The Crisis */}
      <section className="relative py-32 px-6 md:px-12 bg-bazaar-charcoal/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <motion.p 
                {...fadeInUp}
                className="text-bazaar-gold text-[10px] font-medium tracking-[0.3em] uppercase mb-6"
              >
                The Crisis
              </motion.p>
              <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-8">
                The industry is a <span className="aura-headline">pipeline.</span>
              </h2>
              <p className="text-bazaar-paper/50 font-light leading-relaxed">
                The fashion industry has never been held accountable for what it leaves behind. We are living in the predictable outcome of a system that prioritizes margin over life.
              </p>
            </div>

            <div className="lg:col-span-7 lg:col-start-6 space-y-12">
              <motion.div 
                {...fadeInUp}
                whileHover={{ y: -5 }}
                className="group relative bg-bazaar-charcoal/40 border border-bazaar-paper/5 p-10 md:p-16 rounded-sm transition-all duration-500 hover:border-bazaar-gold/20"
              >
                <div className="flex items-center space-x-4 mb-10">
                  <div className="p-3 bg-bazaar-gold/5 rounded-full border border-bazaar-gold/10">
                    <Droplets size={20} className="text-bazaar-gold" />
                  </div>
                  <p className="text-[10px] font-medium tracking-[0.3em] text-bazaar-gold uppercase">The Problem</p>
                </div>

                <h3 className="text-2xl md:text-3xl font-serif leading-tight mb-8">
                  Synthetic fibres are <span className="aura-headline">petroleum products.</span>
                </h3>
                
                <div className="space-y-8">
                  <p className="text-lg leading-relaxed text-bazaar-paper/70 font-light">
                    60% of all garments made today are synthetic — polyester, nylon, acrylic. Every wash sheds microscopic particles into the water supply. Every wear puts them against your skin.
                  </p>
                  <div className="relative p-8 bg-bazaar-black/40 border-l-2 border-bazaar-gold/40 rounded-r-sm">
                    <p className="text-[15px] leading-relaxed text-bazaar-paper/60 font-light italic">
                      "Scientists have now found microplastics in human blood, breast milk, placentas, and arterial plaque. The 2024 New England Journal of Medicine linked microplastics in arteries to significantly higher risk of heart attack and death."
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                {...fadeInUp} 
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="group relative bg-bazaar-charcoal/40 border border-bazaar-paper/5 p-10 md:p-16 rounded-sm transition-all duration-500 hover:border-bazaar-gold/20"
              >
                <div className="flex items-center space-x-4 mb-10">
                  <div className="p-3 bg-bazaar-gold/5 rounded-full border border-bazaar-gold/10">
                    <ReceiptText size={20} className="text-bazaar-gold" />
                  </div>
                  <p className="text-[10px] font-medium tracking-[0.3em] text-bazaar-gold uppercase">The System</p>
                </div>

                <h3 className="text-2xl md:text-3xl font-serif leading-tight mb-8">
                  Cheap clothes are <span className="aura-headline">not cheap.</span>
                </h3>

                <div className="space-y-8">
                  <p className="text-lg leading-relaxed text-bazaar-paper/70 font-light">
                    The true cost is paid by garment workers, by communities downstream from dye houses, and by the ecosystems dismantled to protect the petrochemical supply chain.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-bazaar-black/40 border border-bazaar-paper/5 rounded-sm">
                    <div>
                      <p className="text-2xl font-serif text-bazaar-gold mb-2">6,000+</p>
                      <p className="text-[11px] uppercase tracking-wider text-bazaar-paper/40">New styles daily by Shein</p>
                    </div>
                    <div>
                      <p className="text-2xl font-serif text-bazaar-gold mb-2">Millions</p>
                      <p className="text-[11px] uppercase tracking-wider text-bazaar-paper/40">Spent on lobbying vs rights</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* The Data Altar */}
      <section className="relative py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-bazaar-paper/10 border border-bazaar-paper/10">
            {[
              { value: "5g", label: "plastic ingested per person every week — equivalent weight of a credit card" },
              { value: "16,325", label: "chemicals found in plastic products. More than 3,600 completely unregulated." },
              { value: "79%", label: "of all plastic ever produced is now discarded somewhere in the environment" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="bg-bazaar-black p-12 md:p-16 flex flex-col justify-center items-center text-center group hover:bg-bazaar-charcoal/20 transition-colors duration-500"
              >
                <div className="text-5xl md:text-7xl font-serif aura-headline mb-6 group-hover:scale-110 transition-transform duration-700">{stat.value}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] leading-relaxed text-bazaar-paper/40 font-light max-w-[200px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Ethos */}
      <section ref={brandmarkRef} className="py-48 md:py-64 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
          <img src="/images/sb-triangle-tear.png" alt="" className="w-full h-full object-contain" loading="lazy" decoding="async" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div {...slowReveal}>
            <motion.img 
              src="/images/starbazaar-brandmark.svg" 
              alt="" 
              className="w-12 h-12 mx-auto mb-12 opacity-50" 
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              style={{ rotate: brandmarkRotate, scale: brandmarkScale }}
            />
            <blockquote className="text-3xl md:text-6xl font-serif italic leading-[1.2] text-bazaar-paper mb-16">
              "Star Bazaar is a place where the maker is known, the material is honest, and the money stays close."
            </blockquote>
            <div className="w-24 h-px bg-bazaar-gold/40 mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* The Roadmap */}
      <section className="relative py-32 px-6 md:px-12 bg-bazaar-charcoal/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
            <div className="lg:col-span-5">
              <motion.p 
                {...fadeInUp}
                className="text-bazaar-gold text-[10px] font-medium tracking-[0.3em] uppercase mb-6"
              >
                The Roadmap
              </motion.p>
              <h2 className="text-4xl md:text-6xl font-serif leading-tight mb-8">
                Commerce first.<br />
                Legislation next.<br />
                <span className="aura-headline">Industry transformed.</span>
              </h2>
            </div>
            
            <div className="lg:col-span-7 space-y-px bg-bazaar-paper/5 border border-bazaar-paper/5">
              {[
                { num: "01", title: "Build the market", body: "Star Bazaar proves the ethical alternative works commercially. Every maker who earns a living here is proof that integrity and commerce are not opposites." },
                { num: "02", title: "Build the supply chain", body: "Astraea House is developing relationships with certified natural fibre producers — hemp, linen, TENCEL — so that ethical materials are genuinely available." },
                { num: "03", title: "Change the law", body: "We are building toward the legislative coalitions that will pass mandatory material disclosure and extended producer responsibility." },
                { num: "04", title: "Make natural the default", body: "The endpoint is a world where sustainable fibres are not the niche option — where the burden of proof is on synthetics, not on natural materials." }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  {...fadeInUp}
                  className="bg-bazaar-black p-10 md:p-12 group hover:bg-bazaar-charcoal/30 transition-colors duration-500"
                >
                  <div className="flex gap-8">
                    <div className="text-2xl font-serif text-bazaar-gold/30 group-hover:text-bazaar-gold transition-colors duration-500">{step.num}</div>
                    <div>
                      <h4 className="text-xl font-serif text-bazaar-paper mb-4">{step.title}</h4>
                      <p className="text-[15px] leading-relaxed text-bazaar-paper/50 font-light">{step.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Institution */}
      <section className="relative py-48 px-6 md:px-12 border-t border-bazaar-paper/5">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            ref={blockRef}
            style={{ y: blockY }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-bazaar-charcoal border border-bazaar-gold/25 rounded-sm p-12 md:p-20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <img 
                src="/images/starbazaar-brandmark.svg" 
                alt="" 
                className="w-32 h-32" 
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
            
            <p className="text-[10px] font-medium tracking-[0.3em] text-bazaar-gold uppercase mb-10">Astraea House · The Institution</p>
            <p className="text-xl md:text-3xl font-serif leading-relaxed text-bazaar-paper/90 mb-12">
              Astraea House exists to prove that the alternative to the extractive economy is not only possible but beautiful.
            </p>
            <p className="text-lg leading-relaxed text-bazaar-paper/60 font-light">
              Star Bazaar is its first and most visible expression. Everything sold through the market, every maker who joins, every material disclosed is a data point in the argument that the industry is making choices — not obeying laws of nature. And choices can be changed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Back to Home CTA */}
      <section className="py-32 text-center">
        <Link 
          to="/"
          className="group inline-flex flex-col items-center space-y-6"
        >
          <div className="w-12 h-12 rounded-full border border-bazaar-gold/30 flex items-center justify-center group-hover:border-bazaar-gold transition-colors duration-500">
            <ChevronDown size={20} className="text-bazaar-gold rotate-180 group-hover:-translate-y-1 transition-transform duration-500" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-bazaar-paper/40 group-hover:text-bazaar-gold transition-colors duration-500">Return to the Market</span>
        </Link>
      </section>
    </div>
  );
};

const Manifesto = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [-15, 15]);
  const smoothRotate = useSpring(rotate, { stiffness: 50, damping: 20 });

  return (
    <section ref={ref} id="manifesto" className="relative py-32 md:py-64 px-6 md:px-12 border-y border-bazaar-paper/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-4">
          <motion.span 
            {...fadeInUp}
            className="text-bazaar-gold text-[10px] uppercase tracking-[0.3em] block mb-8"
          >
            The Manifesto
          </motion.span>
          <motion.h2 
            {...fadeInUp}
            className="text-3xl md:text-5xl font-serif leading-tight"
          >
            Step into <br />
            <span className="aura-headline">maker sovereignty.</span>
          </motion.h2>

          <motion.div
            className="hidden lg:block mt-24"
            style={{ rotate: smoothRotate }}
            initial={{ opacity: 0, x: -80, filter: 'blur(20px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <img 
              src="/images/sb-triangle-tear.png" 
              alt="" 
              className="w-[500px] h-auto mix-blend-screen"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </div>
        
        <div className="lg:col-span-7 lg:col-start-6 space-y-12">
          <motion.div {...fadeInUp} className="space-y-8">
            <p className="text-xl md:text-2xl font-sans leading-relaxed text-bazaar-paper/70">
              There is a system that has been quietly extracting the value of your craft for generations — taking the margin, hiding the supply chain, racing the price to the floor until the only thing left standing is the machine while the maker is made invisible.
            </p>
            <p className="text-xl md:text-2xl font-sans leading-relaxed text-bazaar-paper/70">
              This is a world that breathes — where the maker is known, the material is honest, and every purchase is an act of withdrawal from the economy of disposability.
            </p>
          </motion.div>
          
          <motion.blockquote 
            {...slowReveal}
            className="border-l border-bazaar-gold/30 pl-8 py-4"
          >
            <p className="text-3xl md:text-5xl font-serif text-bazaar-paper leading-tight">
              "Every fibre, every dye, every input is traceable, biodegradable, and chosen because it returns to the earth."
            </p>
          </motion.blockquote>

          <motion.div {...fadeInUp} className="pt-8">
            <Link 
              to="/why-we-exist"
              className="group inline-flex items-center space-x-3 text-bazaar-gold hover:text-bazaar-paper transition-colors duration-300"
            >
              <span className="text-[11px] uppercase tracking-[0.3em]">Read why we exist</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const PrincipleCard = ({ number, title, description, index }: { number: string, title: string, description: string, index: number }) => {
  // Tailored animations based on index
  const variants = {
    initial: { 
      opacity: 0, 
      x: index === 0 ? -60 : index === 1 ? 60 : 0,
      y: index === 2 ? 60 : 0
    },
    whileInView: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: { 
        duration: 1.4, 
        ease: [0.22, 1, 0.36, 1], 
        delay: index * 0.1,
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const childVariants = {
    initial: { opacity: 0, y: 20 },
    whileInView: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div 
      variants={variants}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, margin: "-100px" }}
      className="group border-b border-bazaar-paper/5 py-24 md:py-32 flex flex-col md:grid md:grid-cols-12 gap-8 items-start"
    >
      <div className="md:col-span-2">
        <motion.span 
          variants={childVariants}
          className="text-bazaar-gold/40 font-serif text-6xl md:text-8xl leading-none block"
        >
          {number}
        </motion.span>
      </div>
      <div className="md:col-span-5">
        <motion.h3 
          variants={childVariants}
          className="text-2xl md:text-4xl font-serif mb-6 group-hover:aura-headline transition-colors duration-500"
        >
          {title}
        </motion.h3>
      </div>
      <div className="md:col-span-5">
        <motion.p 
          variants={childVariants}
          className="text-lg text-bazaar-paper/50 leading-relaxed max-w-md"
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
};

const Principles = () => {
  return (
    <section id="principles" className="relative py-32 md:py-64 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp} className="mb-24">
          <span className="text-bazaar-gold text-[10px] uppercase tracking-[0.3em] block mb-8">What this is built on</span>
          <h2 className="text-4xl md:text-6xl font-serif">Three principles. <br /> No exceptions.</h2>
        </motion.div>

        <div className="flex flex-col">
          <PrincipleCard 
            index={0}
            number="01" 
            title="The maker is sacred." 
            description="Your hands carry knowledge that took years to build. This market was designed around what you know — not around how cheaply you can be made to sell it."
          />
          <PrincipleCard 
            index={1}
            number="02" 
            title="The material is honest." 
            description="No plastic. No synthetic substitutes dressed in sustainability language. Every fibre, every dye, every input is traceable and biodegradable."
          />
          <PrincipleCard 
            index={2}
            number="03" 
            title="The money stays close." 
            description="Revenue circulates within the community — not upward to shareholders of corporations that fund the wars that protect the industry we are replacing."
          />
        </div>
      </div>
    </section>
  );
};

const WhoThisIsFor = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Header blur/fade transforms
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0, 1, 1, 0.5, 0]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [20, 0, 0, 10, 30]);
  const headerY = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [100, 0, 0, -50, -150]);

  const items = [
    {
      title: "The Extracted Maker",
      desc: "Who has been selling on platforms that take 30% and return nothing to the community.",
      icon: "01"
    },
    {
      title: "The Deep Weaver",
      desc: "Whose knowledge is centuries deep and whose market has been made artificially small.",
      icon: "02"
    },
    {
      title: "The Ethical Designer",
      desc: "Who sources with care and refuses to compete with five-dollar disposable dresses.",
      icon: "03"
    },
    {
      title: "The Indigenous Craftsperson",
      desc: "Whose traditions deserve a market that honours knowledge rather than extracting it.",
      icon: "04"
    }
  ];

  return (
    <section ref={sectionRef} id="who-it-is-for" className="relative py-32 md:py-64 px-6 md:px-12 bg-bazaar-black overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-aura-start/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-bazaar-gold/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          style={{ opacity: headerOpacity, filter: useTransform(headerBlur, (b) => `blur(${b}px)`), y: headerY }}
          className="text-center mb-32"
        >
          <span className="text-bazaar-gold text-[10px] uppercase tracking-[0.4em] block mb-8">The Archetypes</span>
          <h2 className="text-5xl md:text-8xl font-serif leading-tight">You already know <br /> <span className="aura-headline">who you are.</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-bazaar-paper/10 border border-bazaar-paper/10">
          {items.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="group relative bg-bazaar-black p-12 md:p-24 overflow-hidden"
            >
              {/* Subtle card background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-aura-start/0 to-aura-start/0 group-hover:from-aura-start/5 group-hover:to-transparent transition-all duration-1000" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="text-bazaar-gold/20 font-serif text-6xl md:text-8xl block mb-12 group-hover:text-bazaar-gold/40 transition-colors duration-700">
                    {item.icon}
                  </span>
                  <h3 className="text-3xl md:text-5xl font-serif mb-8 group-hover:aura-headline transition-all duration-700">
                    {item.title}
                  </h3>
                  <p className="text-xl text-bazaar-paper/50 leading-relaxed max-w-md group-hover:text-bazaar-paper/70 transition-colors duration-700">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-16 flex items-center space-x-4">
                  <div className="h-px w-12 bg-bazaar-gold/30 group-hover:w-24 transition-all duration-700" />
                  <motion.img 
                    src="/images/starbazaar-brandmark.svg" 
                    alt="" 
                    className="h-4 w-4 opacity-20 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-700"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Final Statement Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="mt-32 p-12 md:p-32 bg-bazaar-charcoal/20 border border-bazaar-paper/5 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-aura-start/5 via-transparent to-bazaar-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.div 
              className="text-4xl text-bazaar-paper/40 mx-auto mb-16 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              ✴︎
            </motion.div>
            <h3 className="text-3xl md:text-5xl font-serif text-bazaar-paper/90 leading-tight">
              <span className="aura-headline italic">Anyone</span> who makes things to last <br className="hidden md:block" /> and is tired of competing with things <br className="hidden md:block" /> <span className="text-bazaar-gold/60">made to break.</span>
            </h3>
            
            <div className="mt-20 flex flex-col items-center">
              <div className="h-24 w-px bg-gradient-to-b from-bazaar-gold/40 to-transparent" />
              <span className="mt-8 text-[10px] uppercase tracking-[0.5em] text-bazaar-gold/40">The invitation is open</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const SocialBelonging = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.8]);

  return (
    <section ref={containerRef} className="py-64 px-6 md:px-12 relative overflow-hidden flex items-center justify-center min-h-[80vh]">
      {/* Background Image Layer */}
      <motion.div 
        style={{ scale, opacity }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="/images/sb-bazaarroom.png" 
          alt="" 
          className="w-full h-full object-cover brightness-[0.6] contrast-110"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-10">
        <motion.h2 
          style={{ x }}
          className="text-[30vw] font-serif whitespace-nowrap"
        >
          Star Bazaar
        </motion.h2>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-20">
        <motion.div {...slowReveal}>
          <p className="text-2xl md:text-4xl font-serif leading-tight mb-12 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            "Star Bazaar is not just a place to sell your work. It is a place to belong to something that is building its way free — one maker, one garment, one honest material at a time."
          </p>
          <span className="text-xs uppercase tracking-[0.4em] text-bazaar-paper/40">— The Astraea Ethos</span>
        </motion.div>
      </div>
    </section>
  );
};

const GeneratedIcon = ({ prompt, angle, index, fallbackIcon: FallbackIcon }: { prompt: string; angle: string; index: number; fallbackIcon: React.ElementType }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Create a unique cache key based on prompt and angle
  const cacheKey = `bazaar_icon_${prompt.replace(/\s+/g, '_')}_${angle.replace(/\s+/g, '_')}`;

  const removeBackground = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r < 20 && g < 20 && b < 20) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const generateIcon = async (currentRetry = 0) => {
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached && currentRetry === 0) {
      setImageUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    setRetryCount(currentRetry);

    try {
      if (currentRetry === 0) {
        await new Promise(resolve => setTimeout(resolve, index * 3000));
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.0-flash', // Using a stable model name
          contents: {
            parts: [
              {
                text: `A single, high-end 3D metallic object in the shape of a stylized six-point scalloped star (matching the Star Bazaar brandmark shape). The object is made of deep glossy purple chrome material. The object is viewed from a ${angle} perspective. Embossed on the face of the star is a clean white minimalist symbol of ${prompt}. The object has sharp edges, high reflections, and a luxurious jewelry-like finish. The object is perfectly centered and isolated on a solid, pure black background. No other objects, no shadows on the floor. 1:1 aspect ratio.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.statusText}`);
      }

      const data = await response.json();

      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          const processedBase64 = await removeBackground(rawBase64);
          
          // Save to cache
          try {
            localStorage.setItem(cacheKey, processedBase64);
          } catch (e) {
            console.warn("Failed to cache icon in localStorage (likely quota exceeded)", e);
          }
          
          setImageUrl(processedBase64);
          setLoading(false);
          return;
        }
      }
      throw new Error("No image part found");
    } catch (err: any) {
      console.error(`Icon generation failed (attempt ${currentRetry + 1}):`, err);
      
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      const maxRetries = 3;
      
      if (isRateLimit && currentRetry < maxRetries) {
        const delay = 5000 * Math.pow(2, currentRetry) + Math.random() * 2000;
        console.log(`Rate limited. Retrying in ${Math.round(delay)}ms...`);
        setTimeout(() => generateIcon(currentRetry + 1), delay);
      } else {
        setError(true);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    generateIcon();
  }, [prompt, angle, index]);

  if (loading) {
    return (
      <div className="w-40 h-40 mb-8 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-aura-start/5 blur-3xl rounded-full animate-pulse" />
        <div className="w-32 h-32 bg-bazaar-charcoal/10 border border-bazaar-paper/5 flex flex-col items-center justify-center rounded-full">
          <Loader2 className="w-8 h-8 text-aura-start/30 animate-spin mb-2" />
          {retryCount > 0 && <span className="text-[8px] text-bazaar-paper/30 uppercase tracking-widest">Retry {retryCount}</span>}
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-40 h-40 mb-8 relative flex items-center justify-center group cursor-pointer"
        onClick={() => generateIcon(0)}
      >
        <div className="absolute inset-0 bg-aura-start/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="w-32 h-32 bg-bazaar-charcoal/20 border border-purple-500/20 flex flex-col items-center justify-center rounded-full backdrop-blur-sm group-hover:border-purple-500/40 transition-colors">
          <FallbackIcon className="w-10 h-10 text-purple-400/60 mb-2" />
          <span className="text-[8px] text-purple-300/40 uppercase tracking-widest group-hover:text-purple-300/60">Mint Icon</span>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <span className="text-[9px] text-bazaar-gold uppercase tracking-[0.2em]">Click to retry minting</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -10, 0],
      }}
      transition={{
        opacity: { duration: 1 },
        scale: { duration: 1 },
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className="w-40 h-40 mb-8 relative group-hover:scale-110 transition-transform duration-700 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-aura-start/10 blur-3xl rounded-full scale-75 pointer-events-none" />
      
      <img 
        src={imageUrl} 
        alt="" 
        className="w-full h-full object-contain brightness-110 contrast-125 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};

const FoundingMakers = () => {
  const benefits = [
    {
      title: "Zero Commission",
      desc: "Pay 0% commission for your first six months as a founding member.",
      image: "/images/ic3D-percentage.png"
    },
    {
      title: "Direct Influence",
      desc: "Shape the platform's roadmap and help define the future of the Bazaar.",
      image: "/images/ic3D-direction.png"
    },
    {
      title: "Founding Status",
      desc: "Carry the 'Founding Maker' mark on your profile and lore forever.",
      image: "/images/ic3D-status.png"
    }
  ];

  return (
    <section className="relative py-32 md:py-64 px-6 md:px-12 bg-bazaar-black border-t border-bazaar-paper/5">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp} className="text-center mb-32">
          <span className="text-bazaar-gold text-[10px] uppercase tracking-[0.3em] block mb-8">The Invitation</span>
          <h2 className="text-4xl md:text-7xl font-serif">Become a <br /> <span className="aura-headline">founding maker.</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24">
          {benefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: idx * 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col group items-center text-center md:items-start md:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -10, 0],
                }}
                transition={{
                  opacity: { duration: 1 },
                  scale: { duration: 1 },
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="w-28 h-28 mb-8 relative group-hover:scale-110 transition-transform duration-700 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-aura-start/10 blur-3xl rounded-full scale-75 pointer-events-none" />
                
                <img 
                  src={benefit.image} 
                  alt={benefit.title} 
                  className="w-full h-full object-contain brightness-110 contrast-125 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <h4 className="text-sm uppercase tracking-[0.2em] text-bazaar-gold mb-6">{benefit.title}</h4>
              <p className="text-xl md:text-2xl font-serif text-bazaar-paper/80 leading-relaxed">
                {benefit.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FabricParallax = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-150, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
  
  // Photo is unblurred for a longer duration (from 0.3 to 0.7)
  const blurValue = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [25, 0, 0, 25]);
  // Photo becomes brighter as it blurs
  const brightnessValue = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1.8, 1, 1, 1.8]);
  
  const filter = useTransform(
    [blurValue, brightnessValue], 
    ([b, br]) => `blur(${b as number}px) brightness(${br as number})`
  );

  return (
    <section ref={ref} className="relative h-[50vh] md:h-[80vh] overflow-hidden bg-bazaar-black border-y border-bazaar-paper/5">
      <motion.div 
        style={{ y, opacity, filter, scale }}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/images/sb-starfabric.png" 
          alt="Fabric texture" 
          className="w-full h-full object-cover opacity-50 mix-blend-luminosity"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
      
      {/* Reduced vignette/gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-bazaar-black/40 via-transparent to-bazaar-black/40 pointer-events-none" />
      
      {/* Decorative line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bazaar-paper/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-bazaar-paper/10 to-transparent" />
    </section>
  );
};

const HandsMedallionParallax = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
  const blurValue = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [20, 5, 0, 5, 20]);
  const filter = useTransform(blurValue, (b) => `blur(${b}px)`);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden bg-bazaar-black border-y border-bazaar-paper/5">
      <motion.div 
        style={{ y, opacity, filter, scale }}
        className="absolute inset-0 w-full h-full flex items-center justify-center"
      >
        <img 
          src="/images/sb-hands-medallion.png" 
          alt="Hands Medallion" 
          className="w-full h-full object-cover opacity-60 md:opacity-80"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
      
      {/* Gradient fades to blend with sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-bazaar-black via-transparent to-bazaar-black pointer-events-none" />
    </section>
  );
};

const InvitationRitualSection = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Magnetic effect values
  const buttonX = useMotionValue(0);
  const buttonY = useMotionValue(0);
  const smoothButtonX = useSpring(buttonX, { stiffness: 150, damping: 15 });
  const smoothButtonY = useSpring(buttonY, { stiffness: 150, damping: 15 });

  const [revealed, setRevealed] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isIdle, setIsIdle] = useState(true);
  const [clickSignal, setClickSignal] = useState<{ x: number, y: number, id: number } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  // Pulse value for idle state
  const pulseScale = useMotionValue(1);
  const smoothPulseScale = useSpring(pulseScale, { stiffness: 30, damping: 20 });

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      setIsIdle(false);
      
      // Reset idle timer
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 5000);

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        mouseX.set(localX);
        mouseY.set(localY);

        // Reveal Zone Check: Center of the screen
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const distToCenter = Math.hypot(localX - centerX, localY - centerY);
        
        // If user hovers near the center, reveal faster
        const increment = distToCenter < 150 ? 2 : 0.5;
        setInteractionCount((prev) => {
          const next = prev + increment;
          if (next > 150) setRevealed(true);
          return next;
        });

        // Magnetic effect calculation
        if (buttonRef.current && revealed) {
          const btnRect = buttonRef.current.getBoundingClientRect();
          const btnCenterX = btnRect.left + btnRect.width / 2;
          const btnCenterY = btnRect.top + btnRect.height / 2;
          const distToBtn = Math.hypot(clientX - btnCenterX, clientY - btnCenterY);

          if (distToBtn < 180) {
            const angle = Math.atan2(clientY - btnCenterY, clientX - btnCenterX);
            // Increased strength from 6 to 15 for a more noticeable magnetic pull
            const strength = (180 - distToBtn) / 180 * 15; 
            buttonX.set(Math.cos(angle) * strength);
            buttonY.set(Math.sin(angle) * strength);
          } else {
            buttonX.set(0);
            buttonY.set(0);
          }
        }
      }
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener("mousemove", handleMove);
      section.addEventListener("touchmove", handleMove);
    }
    
    // Global fallback reveal (slower)
    const timer = setTimeout(() => setRevealed(true), 15000);

    return () => {
      if (section) {
        section.removeEventListener("mousemove", handleMove);
        section.removeEventListener("touchmove", handleMove);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearTimeout(timer);
    };
  }, [mouseX, mouseY, revealed]);

  // Mobile/Idle fallback: Reveal if idle for 3 seconds
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    if (isIdle && !revealed) {
      idleTimer = setTimeout(() => {
        setRevealed(true);
      }, 3000);
    }
    return () => clearTimeout(idleTimer);
  }, [isIdle, revealed]);

  // Idle pulse animation for the light
  useEffect(() => {
    if (isIdle) {
      const centerX = sectionRef.current?.clientWidth ? sectionRef.current.clientWidth / 2 : 0;
      const centerY = sectionRef.current?.clientHeight ? sectionRef.current.clientHeight / 2 : 0;
      mouseX.set(centerX);
      mouseY.set(centerY);

      const interval = setInterval(() => {
        const time = Date.now() / 1000;
        pulseScale.set(1 + Math.sin(time * 2) * 0.15);
      }, 16);
      return () => clearInterval(interval);
    } else {
      pulseScale.set(1);
    }
  }, [isIdle, mouseX, mouseY, pulseScale]);

  const handleButtonClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setClickSignal({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now()
    });
    // Reset signal after animation
    setTimeout(() => setClickSignal(null), 2000);
  };

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen w-full bg-bazaar-black overflow-hidden flex items-center justify-center py-24"
    >
      {/* Moving Ambient Noise Layer */}
      <motion.div 
        animate={{ 
          x: [0, 20, -20, 0],
          y: [0, -20, 20, 0]
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ffilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]"
      />

      {/* Cursor light mask */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          WebkitMaskImage: useTransform(
            [smoothX, smoothY, smoothPulseScale],
            ([x, y, s]) => `radial-gradient(${250 * (s as number)}px at ${x}px ${y}px, black 0%, transparent 100%)`
          ),
          maskImage: useTransform(
            [smoothX, smoothY, smoothPulseScale],
            ([x, y, s]) => `radial-gradient(${250 * (s as number)}px at ${x}px ${y}px, black 0%, transparent 100%)`
          ),
          background: "rgba(242, 236, 226, 0.03)",
        }}
      />

      {/* Hidden content */}
      <div className="relative z-10 max-w-3xl text-center px-6 space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          whileInView={{ opacity: 0.4, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 3 }}
          className="mb-16 flex justify-center"
        >
          <motion.div 
            className="h-24 w-24"
            style={{ 
              backgroundImage: "linear-gradient(25deg, var(--color-aura-start) 20%, transparent 100%)",
              backgroundSize: "200% 200%",
              maskImage: "url('/images/starbazaar-brandmark.svg')",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url('/images/starbazaar-brandmark.svg')",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center"
            }}
            animate={{ 
              rotate: 360,
              backgroundPosition: ["0% 50%", "100% 0%", "50% 100%", "0% 100%", "0% 50%"]
            }}
            transition={{ 
              rotate: { duration: 40, repeat: Infinity, ease: "linear" },
              backgroundPosition: { duration: 25, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0.1, filter: "blur(8px)" }}
          whileInView={{ opacity: 0.3, filter: "blur(2px)" }}
          transition={{ duration: 3 }}
          className="text-bazaar-paper/40 text-lg tracking-[0.2em] font-serif"
        >
          Not everyone is meant to find this.
        </motion.p>

        <div className="space-y-8 text-bazaar-paper/60 text-2xl md:text-3xl font-serif">
          {[
            "Objects without plastic.",
            "Made by hand.",
            "Not mass.",
            "Not for everyone."
          ].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              whileInView={{ opacity: 0.6, y: 0, filter: "blur(0px)" }}
              transition={{ delay: i * 0.5, duration: 1.5 }}
            >
              {line}
            </motion.p>
          ))}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 0.4, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 2.5, duration: 1.5 }}
            className="text-sm md:text-base tracking-[0.2em] not-italic uppercase mt-12 max-w-xl mx-auto leading-relaxed"
          >
            This is an exclusive opportunity to shape the future of ethical fashion. We are looking for makers who value craftsmanship, sustainability, and community.
          </motion.p>
        </div>

        {/* CTA Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: revealed ? 1 : 0,
            y: revealed ? 0 : 20,
          }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="pt-16"
        >
          <motion.a
            ref={buttonRef}
            href="#apply"
            style={{ x: smoothButtonX, y: smoothButtonY }}
            whileHover={{ 
              scale: 1.08,
              backgroundColor: "rgba(155, 82, 164, 0.15)", // Subtle color shift to bazaar-purple
              borderColor: "rgba(155, 82, 164, 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleButtonClick}
            className="group relative inline-flex items-center px-12 py-5 border border-bazaar-gold/60 text-bazaar-paper tracking-[0.3em] text-[10px] uppercase overflow-hidden transition-all duration-700 hover:border-bazaar-gold bg-bazaar-gold/5"
          >
            <span className="relative z-10">Request an Invitation</span>
            <div className="absolute inset-0 bg-bazaar-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
            
            {/* Click Signal Effect */}
            <AnimatePresence>
              {clickSignal && (
                <motion.div 
                  key={clickSignal.id}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ 
                    position: 'absolute',
                    left: clickSignal.x,
                    top: clickSignal.y,
                    width: '100px',
                    height: '100px',
                    marginLeft: '-50px',
                    marginTop: '-50px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(187, 133, 14, 0.6) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                />
              )}
            </AnimatePresence>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  const [email, setEmail] = useState('');
  const [makerName, setMakerName] = useState('');
  const [website, setWebsite] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  // Firestore Error Handling
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId: string | undefined;
      email: string | null | undefined;
      emailVerified: boolean | undefined;
      isAnonymous: boolean | undefined;
      tenantId: string | null | undefined;
      providerInfo: {
        providerId: string;
        displayName: string | null;
        email: string | null;
        photoUrl: string | null;
      }[];
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!makerName) {
      setError('Please enter your maker or brand name.');
      return;
    }

    if (!website) {
      setError('Please enter your website or portfolio URL.');
      return;
    }

    setLoading(true);
    
    try {
      // Real Firebase call
      const path = 'applications';
      const applicationData: any = {
        email: email.toLowerCase(),
        makerName,
        website,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      if (socialHandle.trim()) {
        applicationData.socialHandle = socialHandle.trim();
      }

      await addDoc(collection(db, path), applicationData);

      setLoading(false);
      setSubmitted(true);
      setShowConfirmation(true);
      setEmail('');
      setMakerName('');
      setWebsite('');
      setSocialHandle('');
      
      setTimeout(() => {
        setSubmitted(false);
        setShowConfirmation(false);
      }, 5000);
    } catch (err) {
      setLoading(false);
      setError('Something went wrong. Please try again later.');
      handleFirestoreError(err, OperationType.WRITE, 'applications');
    }
  };

  return (
    <section id="apply" className="py-32 md:py-64 px-6 md:px-12 bg-bazaar-black border-t border-bazaar-paper/5">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Background Brandmark */}
        <motion.div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none z-0"
          style={{ 
            backgroundColor: "var(--color-bazaar-paper)",
            maskImage: "url('/images/starbazaar-brandmark.svg')",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: "url('/images/starbazaar-brandmark.svg')",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
          animate={{ 
            scale: [1, 1.08, 1],
            opacity: [0.04, 0.12, 0.04],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div {...fadeInUp} className="relative z-10">
          <span className="text-bazaar-gold text-[10px] uppercase tracking-[0.3em] block mb-8">Founding Makers</span>
          <h2 className="text-4xl md:text-7xl font-serif mb-12">The market <br /> opens <span className="aura-headline">with you.</span></h2>
          <p className="text-lg md:text-xl text-bazaar-paper/60 mb-16 max-w-2xl mx-auto leading-relaxed">
            We are accepting applications from founding independent makers now. Founding members shape the market, carry its earliest lore, and pay zero commission for the first six months.
          </p>

          <form onSubmit={handleSubmit} noValidate className="relative max-w-xl mx-auto text-left">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/40 ml-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading || submitted}
                  className={`w-full bg-transparent border-b ${error && error.includes('email') ? 'border-bazaar-gold/50' : 'border-bazaar-paper/20'} py-4 px-2 text-lg focus:outline-none focus:border-bazaar-gold focus-visible:ring-0 transition-colors duration-500 placeholder:text-bazaar-paper/10 disabled:opacity-50`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/40 ml-2">Maker / Brand Name</label>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={makerName}
                  onChange={(e) => {
                    setMakerName(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading || submitted}
                  className={`w-full bg-transparent border-b ${error && error.includes('maker') ? 'border-bazaar-gold/50' : 'border-bazaar-paper/20'} py-4 px-2 text-lg focus:outline-none focus:border-bazaar-gold focus-visible:ring-0 transition-colors duration-500 placeholder:text-bazaar-paper/10 disabled:opacity-50`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/40 ml-2">Website / Portfolio</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading || submitted}
                  className={`w-full bg-transparent border-b ${error && error.includes('website') ? 'border-bazaar-gold/50' : 'border-bazaar-paper/20'} py-4 px-2 text-lg focus:outline-none focus:border-bazaar-gold focus-visible:ring-0 transition-colors duration-500 placeholder:text-bazaar-paper/10 disabled:opacity-50`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/40 ml-2">Social Handle (Optional)</label>
                <input 
                  type="text" 
                  placeholder="@handle" 
                  value={socialHandle}
                  onChange={(e) => {
                    setSocialHandle(e.target.value);
                  }}
                  disabled={loading || submitted}
                  className={`w-full bg-transparent border-b border-bazaar-paper/20 py-4 px-2 text-lg focus:outline-none focus:border-bazaar-gold focus-visible:ring-0 transition-colors duration-500 placeholder:text-bazaar-paper/10 disabled:opacity-50`}
                />
              </div>
            </motion.div>

            <div className="mt-16 flex flex-col items-center space-y-8">
              <button 
                type="submit"
                disabled={loading || submitted}
                className="group flex flex-col items-center space-y-4 text-bazaar-gold hover:text-bazaar-paper transition-colors duration-500 disabled:opacity-50"
                aria-label="Submit application"
              >
                <div className="relative h-16 w-16 border border-bazaar-gold/30 rounded-full flex items-center justify-center group-hover:border-bazaar-paper transition-colors duration-500">
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <ArrowUpRight size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-medium">
                  {loading ? 'Processing' : 'Submit Application'}
                </span>
              </button>

              <motion.a 
                href="https://www.instagram.com/starbazaar.collective"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-bazaar-paper/40 hover:text-bazaar-gold transition-colors duration-300"
                whileHover={{ x: 5 }}
              >
                <span className="text-[9px] uppercase tracking-[0.3em]">Follow the collective</span>
                <ArrowUpRight size={14} />
              </motion.a>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                  className="absolute left-0 -bottom-10 flex items-center space-x-2"
                >
                  <motion.div 
                    className="text-[10px] text-bazaar-gold/40 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  >
                    ✴︎
                  </motion.div>
                  <p className="text-bazaar-gold text-[10px] uppercase tracking-[0.2em]">
                    {error}
                  </p>
                </motion.div>
              )}
              {submitted && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-bazaar-gold text-sm"
                >
                  Application received. We will reach out within 7 days.
                </motion.p>
              )}
            </AnimatePresence>
          </form>
          
          <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-bazaar-paper/30">
            Applications reviewed by hand · Response within 7 days
          </p>
        </motion.div>
      </div>

      {/* Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bazaar-black"
          >
            {/* Background Image Layer */}
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.7 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute inset-0 z-0"
            >
              <img 
                src="/images/SB-flowers-hero.png" 
                alt="" 
                className="w-full h-full object-cover brightness-[0.7] contrast-125"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -40, opacity: 0, filter: 'blur(20px)' }}
              transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center px-6"
            >
              <motion.div 
                className="h-24 w-24 mb-16"
                style={{ 
                  backgroundImage: "linear-gradient(25deg, var(--color-aura-start) 20%, transparent 100%)",
                  backgroundSize: "200% 200%",
                  maskImage: "url('/images/starbazaar-brandmark.svg')",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskImage: "url('/images/starbazaar-brandmark.svg')",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat"
                }}
                animate={{ 
                  rotate: 360,
                  backgroundPosition: ["0% 50%", "100% 0%", "50% 100%", "0% 100%", "0% 50%"]
                }}
                transition={{ 
                  rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                  backgroundPosition: { duration: 25, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              
              {/* Horizontal Line */}
              <div className="w-full max-w-xs h-px bg-bazaar-paper/10" />
              
              <div className="font-serif text-3xl md:text-5xl text-center mt-12">
                <span className="text-bazaar-paper">Invitation request </span>
                <span className="aura-headline">received</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-48 px-6 bg-bazaar-black border-t border-bazaar-paper/5">
      <div className="max-w-4xl mx-auto flex flex-col items-center space-y-20">
        {/* The Silent Observer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 4 }}
          className="relative"
        >
          <motion.div 
            className="text-3xl text-bazaar-paper/10 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            ✴︎
          </motion.div>
          <div className="absolute inset-0 bg-bazaar-gold/5 blur-3xl rounded-full" />
        </motion.div>
        
        <div className="text-center space-y-8">
          <p className="text-[10px] uppercase tracking-[0.6em] text-bazaar-paper/20 font-serif italic max-w-sm mx-auto leading-loose">
            "The machine has no memory. We exist for the hand that remembers the earth."
          </p>
          
          <div className="flex justify-center space-x-20 pt-12">
            <a 
              href="https://www.instagram.com/starbazaar.collective" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group relative text-[8px] uppercase tracking-[0.5em] text-bazaar-paper/10 hover:text-bazaar-gold transition-colors duration-1000"
            >
              <span className="relative z-10">The Connection</span>
              <motion.div 
                className="absolute -bottom-2 left-0 w-0 h-[1px] bg-bazaar-gold/30 group-hover:w-full transition-all duration-1000"
              />
            </a>
            <Link 
              to="/why-we-exist"
              className="group relative text-[8px] uppercase tracking-[0.5em] text-bazaar-paper/10 hover:text-bazaar-gold transition-colors duration-1000"
            >
              <span className="relative z-10">The Lore</span>
              <motion.div 
                className="absolute -bottom-2 left-0 w-0 h-[1px] bg-bazaar-gold/30 group-hover:w-full transition-all duration-1000"
              />
            </Link>
            <a 
              href="#apply"
              className="group relative text-[8px] uppercase tracking-[0.5em] text-bazaar-paper/10 hover:text-bazaar-gold transition-colors duration-1000"
            >
              <span className="relative z-10">The Invitation</span>
              <motion.div 
                className="absolute -bottom-2 left-0 w-0 h-[1px] bg-bazaar-gold/30 group-hover:w-full transition-all duration-1000"
              />
            </a>
          </div>
        </div>

        <div className="pt-24">
          <p className="text-[7px] uppercase tracking-[1em] text-bazaar-paper/5 select-none">
            Astraea House · Astraea Remains
          </p>
        </div>
      </div>
    </footer>
  );
};

// --- Main App ---

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const LandingPage = () => (
  <>
    <Hero />
    <ValueProp />
    <FabricParallax />
    <Manifesto />
    <Principles />
    <HandsMedallionParallax />
    <WhoThisIsFor />
    <SocialBelonging />
    <FoundingMakers />
    <InvitationRitualSection />
    <FinalCTA />
  </>
);

const WhyWeExistPage = () => (
  <WhyWeExist />
);

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <main className="relative bg-bazaar-black selection:bg-bazaar-gold selection:text-bazaar-black overflow-x-hidden">
        <div className="grain-overlay" />
        
        <Navbar />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/why-we-exist" element={<WhyWeExistPage />} />
        </Routes>
        
        <Footer />
      </main>
    </Router>
  );
}
