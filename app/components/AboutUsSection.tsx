"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FaInstagram, FaXTwitter, FaLinkedin } from "react-icons/fa6";
import { decompressAndVerify } from '../../lib/dataProcessor';
import type { Statistics } from "../../lib/statisticsSchema";
import type { Founder } from "../../lib/founderSchema";

const AboutUsSection = () => {
  const [aboutText, setAboutText] = useState<string>("");
  const [aboutLoading, setAboutLoading] = useState<boolean>(true);
  const [boardLoading, setBoardLoading] = useState<boolean>(true);
  const [boardMembers, setBoardMembers] = useState<Founder[]>([]);

  useEffect(() => {
    fetch("/api/about-company")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data[0] && data[0].aboutText) {
          setAboutText(data[0].aboutText);
        }
      })
      .catch(() => {})
      .finally(() => setAboutLoading(false));
    fetch("/api/founders")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBoardMembers(data);
        }
      })
      .catch(() => {})
      .finally(() => setBoardLoading(false));
  }, []);

  // Dynamic statistics state with fallback values
  const [stats, setStats] = useState<Statistics | null>(null);
  useEffect(() => {
    fetch("/api/statistics")
      .then(res => res.json())
      .then(async data => {
        console.log('Raw statistics API response:', data);
        // Gracefully handle empty array (no stats created yet)
        if (Array.isArray(data) && data.length === 0) {
          return; // keep null -> hide stats
        }
        if (Array.isArray(data) && data[0] && typeof data[0].yearsExperience === 'number') {
          setStats({
            yearsExperience: data[0].yearsExperience,
            clientsServed: data[0].clientsServed,
            assetsManaged: data[0].assetsManaged,
          });
        } else if (Array.isArray(data) && data[0] && data[0].compressedData && data[0].hash) {
          // Try to decompress and verify manually on the client for debugging
          try {
            const decompressed = await decompressAndVerify(data[0]);
            console.log('Decompressed statistics:', decompressed);
            setStats({
              yearsExperience: (decompressed as Statistics).yearsExperience,
              clientsServed: (decompressed as Statistics).clientsServed,
              assetsManaged: (decompressed as Statistics).assetsManaged,
            });
          } catch (err) {
            console.error('Failed to decompress statistics on client:', err);
            // keep null -> hide stats
          }
        } else {
          console.warn('Statistics API returned unexpected data shape. Using defaults.');
          // keep null -> hide stats
        }
      })
      .catch((err) => {
        console.error('Failed to fetch statistics:', err);
        // keep null -> hide stats
      });
  }, []);

  // Intersection Observer for triggering animation on scroll
  const statsRef = useRef<HTMLDivElement>(null);
  const [animateStats, setAnimateStats] = useState(false);
  useEffect(() => {
    const ref = statsRef.current;
    if (!ref) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateStats(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [stats]);

  // Animated counter hook
  function useCountUp(target: number, duration = 2200, start: boolean) {
    const [count, setCount] = React.useState(0);
    useEffect(() => {
      if (!start) return;
      if (!Number.isFinite(target) || target <= 0) {
        setCount(0);
        return;
      }
      let current = 0;
      const stepTime = Math.max(Math.floor(duration / target), 50); // slower animation
      const step = () => {
        current++;
        setCount(current);
        if (current < target) {
          setTimeout(step, stepTime);
        }
      };
      step();
    }, [target, duration, start]);
    return count;
  }

  // Animated values (only animate when in view)
  const animatedExperience = useCountUp(stats ? stats.yearsExperience : 0, 2200, animateStats && !!stats);
  const animatedClients = useCountUp(stats ? stats.clientsServed : 0, 2200, animateStats && !!stats);
  const animatedAssets = useCountUp(stats ? stats.assetsManaged : 0, 2200, animateStats && !!stats);

    return (
    <section id="about-us" className="bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="hidden md:block absolute top-12 right-12 w-20 h-20 bg-navy-primary/10 rounded-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="hidden md:block absolute top-32 right-32 w-12 h-12 bg-emerald-accent/20 rounded-2xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="hidden md:block absolute bottom-20 left-16 w-16 h-16 bg-navy-secondary/15 rounded-3xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="hidden md:block absolute bottom-40 left-40 w-8 h-8 bg-emerald-accent/25 rounded-xl animate-float" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <div className="pt-8"></div>
          {/* Company Info - Styled like service cards */}
          <div className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 w-full max-w-2xl mx-auto"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Animated Aura Effect - disappears on hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#022d58]/3 via-[#003c96]/3 to-[#022d58]/3 opacity-100 group-hover:opacity-0 transition-opacity duration-700 animate-aura-rotate" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-[#003c96]/3 to-transparent opacity-100 group-hover:opacity-0 transition-all duration-1000 animate-aura-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Glowing border effect - disappears on hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#022d58] via-[#003c96] to-[#022d58] opacity-3 group-hover:opacity-0 transition-opacity duration-500 blur-sm animate-aura-glow" />
            
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#022d58] to-[#003c96] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            
            <div className="relative flex-1 flex flex-col p-8">
              {aboutLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-100 rounded w-11/12 mx-auto"></div>
                    <div className="h-5 bg-gray-100 rounded w-10/12 mx-auto"></div>
                    <div className="h-5 bg-gray-100 rounded w-9/12 mx-auto"></div>
                    <div className="h-5 bg-gray-100 rounded w-8/12 mx-auto"></div>
                  </div>
                </div>
              ) : aboutText ? (
                <>
                  <h3 className="text-4xl font-bold text-[#022d58] mb-8 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors duration-300 leading-tight text-center">
                    About company
                  </h3>
                  
                  <div className="flex-1">
                    <p className="text-gray-600 text-xl leading-relaxed text-center">
                      {aboutText}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          
          <div className="h-12" />
     
          {/* Founder/Board Members Section */}
          {boardLoading ? (
            <div className="w-full flex flex-col items-center mt-4 relative">
              {/* Decorative Navy Blue Squares at Board Members Level (loading) */}
              <div className="hidden md:block absolute top-0 -left-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform rotate-30"></div>
              <div className="hidden md:block absolute top-8 -left-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform -rotate-15"></div>
              <div className="hidden md:block absolute top-16 -left-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform rotate-60"></div>
              <div className="hidden md:block absolute top-0 -right-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform -rotate-30"></div>
              <div className="hidden md:block absolute top-8 -right-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform rotate-15"></div>
              <div className="hidden md:block absolute top-16 -right-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform -rotate-60"></div>
              {/* Decorative Navy Blue Squares at Board Members Level (loading state) */}
              <div className="hidden md:block absolute top-0 -left-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform rotate-30"></div>
              <div className="hidden md:block absolute top-8 -left-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform -rotate-15"></div>
              <div className="hidden md:block absolute top-16 -left-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform rotate-60"></div>
              <div className="hidden md:block absolute top-0 -right-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform -rotate-30"></div>
              <div className="hidden md:block absolute top-8 -right-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform rotate-15"></div>
              <div className="hidden md:block absolute top-16 -right-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform -rotate-60"></div>
              {/* Decorative Navy Blue Squares at Board Members Level */}
              <div className="hidden md:block absolute top-0 -left-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform rotate-30"></div>
              <div className="hidden md:block absolute top-8 -left-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform -rotate-15"></div>
              <div className="hidden md:block absolute top-16 -left-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform rotate-60"></div>
              <div className="hidden md:block absolute top-0 -right-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform -rotate-30"></div>
              <div className="hidden md:block absolute top-8 -right-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform rotate-15"></div>
              <div className="hidden md:block absolute top-16 -right-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform -rotate-60"></div>
              <div className="text-center mb-6">
                <div className="h-7 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
              </div>
              <div className="w-full max-w-4xl mx-auto relative z-10">
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="group relative bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#022d58]/3 via-[#003c96]/3 to-[#022d58]/3 opacity-100 animate-aura-rotate" />
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-[#003c96]/5 to-transparent opacity-100 animate-aura-pulse" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#022d58] via-[#003c96] to-[#022d58] opacity-5 blur-sm animate-aura-glow" />
                      <div className="absolute inset-0 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 opacity-0" />
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#022d58] to-[#003c96]" />
                      <div className="relative flex-1 flex flex-col p-8">
                        <div className="animate-pulse">
                          <div className="w-28 h-28 rounded-full bg-gray-200 mx-auto mb-6"></div>
                          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                          <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto mb-4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-11/12 mx-auto"></div>
                            <div className="h-4 bg-gray-100 rounded w-10/12 mx-auto"></div>
                            <div className="h-4 bg-gray-100 rounded w-9/12 mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : boardMembers.length > 0 ? (
            <div className="w-full flex flex-col items-center mt-4 relative">
              {/* Decorative Navy Blue Squares at Board Members Level (loaded) */}
              <div className="hidden md:block absolute top-0 -left-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform rotate-30"></div>
              <div className="hidden md:block absolute top-8 -left-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform -rotate-15"></div>
              <div className="hidden md:block absolute top-16 -left-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform rotate-60"></div>
              <div className="hidden md:block absolute top-0 -right-8 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform -rotate-30"></div>
              <div className="hidden md:block absolute top-8 -right-20 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform rotate-15"></div>
              <div className="hidden md:block absolute top-16 -right-12 w-10 h-10 bg-[#022d58] rounded-lg opacity-12 transform -rotate-60"></div>
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#022d58] mb-2 drop-shadow-sm text-center">
                  Our Board Members
                </h2>
              </div>
              <div className="w-full max-w-4xl mx-auto relative z-10">
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                  {boardMembers.map((member, index) => (
                    <div key={index} className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {/* Animated Aura Effect - disappears on hover */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#022d58]/3 via-[#003c96]/3 to-[#022d58]/3 opacity-100 group-hover:opacity-0 transition-opacity duration-700 animate-aura-rotate" />
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-[#003c96]/3 to-transparent opacity-100 group-hover:opacity-0 transition-all duration-1000 animate-aura-pulse" style={{ animationDelay: '0.5s' }} />
                      
                      {/* Glowing border effect - disappears on hover */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#022d58] via-[#003c96] to-[#022d58] opacity-3 group-hover:opacity-0 transition-opacity duration-500 blur-sm animate-aura-glow" />
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#022d58] to-[#003c96] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      
                      <div className="relative flex-1 flex flex-col p-8">
                        {/* Image or Initial */}
                        <div className="text-center mb-6">
                          {member.imageBase64 ? (
                            <div className="w-28 h-28 bg-white rounded-full border-2 border-[#022d58] shadow-md mx-auto overflow-hidden">
                              <Image
                                src={member.imageBase64}
                                alt={member.name}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-28 h-28 flex items-center justify-center rounded-full border-2 border-[#022d58] shadow-md bg-gradient-to-br from-[#022d58] to-[#01ff5a] mx-auto">
                              <span className="text-white font-bold text-5xl">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Name */}
                        <h3 className="text-2xl font-bold text-[#022d58] mb-2 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors duration-300 leading-tight text-center">
                          {member.name}
                        </h3>
                        
                        {/* Title */}
                        <p className="text-lg text-[#022d58] font-semibold mb-4 text-center">
                          {member.title}
                        </p>
                        
                        {/* Description */}
                        <div className="flex-1 mb-6">
                          <p className="text-gray-600 text-base leading-relaxed text-center">
                            {member.desc}
                          </p>
                        </div>
                        
                        {/* Social Links */}
                        <div className="flex space-x-4 justify-center">
                          {member.insta_link && (
                            <a
                              href={member.insta_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                            >
                              <FaInstagram className="w-7 h-7 text-[#E4405F] hover:text-[#C13584] transition-colors" />
                            </a>
                          )}
                          {member.x_link && (
                            <a
                              href={member.x_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="X"
                            >
                              <FaXTwitter className="w-7 h-7 text-black hover:text-[#1DA1F2] transition-colors" />
                            </a>
                          )}
                          {member.linkdin_link && (
                            <a
                              href={member.linkdin_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="LinkedIn"
                            >
                              <FaLinkedin className="w-7 h-7 text-[#0077B5] hover:text-[#005983] transition-colors" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          
          <div className="h-16" />
          
          {/* Animated Stats - Horizontal Layout (render only when stats present) */}
          {stats ? (
            <div
              ref={statsRef}
              className="flex flex-row items-center justify-center mb-2 w-full text-center space-x-8 md:space-x-12"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold text-[#022d58]">
                  {animatedExperience}+
                </span>
                <span className="text-lg md:text-xl font-medium text-[#222] mt-1 text-center">
                  Years Experience
                </span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold text-[#022d58]">
                  {animatedClients}+
                </span>
                <span className="text-lg md:text-xl font-medium text-[#222] mt-1 text-center">
                  Clients Served
                </span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold text-[#022d58]">
                  ₹{animatedAssets} Cr+
                </span>
                <span className="text-lg md:text-xl font-medium text-[#222] mt-1 text-center">
                  Assets Managed
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default AboutUsSection;
