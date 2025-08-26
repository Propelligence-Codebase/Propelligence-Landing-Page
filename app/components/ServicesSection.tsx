"use client";
import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Service {
  _id?: string;
  title: string;
  shortDescription: string;
  long_desc: string;
  pdfUrl?: string;
  slug?: string;
}

const ServicesSection = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const res = await fetch("/api/public/services");
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch services:', res.status);
          setServices([]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  // Ensure services is always an array
  const safeServices = Array.isArray(services) ? services : [];
  const visibleServices = safeServices.slice(0, visibleCount);

  const handleReadMore = async (service: Service) => {
    if (service.slug) {
      console.log('Starting navigation for service:', service.slug);
      setLoadingService(service._id || service.slug);
      try {
        console.log('Navigating to:', `/service/${service.slug}`);
        await router.push(`/service/${service.slug}`);
      } catch (error) {
        console.error('Navigation error:', error);
        // Clear if navigation fails
        setLoadingService(null);
      }
    }
  };

  // No early return: header renders immediately; only grid skeletonizes during loading

  return (
    <section id="services" className="bg-white py-4 relative overflow-hidden">
      {/* Decorative Navy Blue Squares - Hidden on mobile */}
      <div className="hidden md:block absolute top-8 right-8 w-16 h-16 bg-[#022d58] rounded-lg opacity-20 transform rotate-12"></div>
      <div className="hidden md:block absolute top-16 right-20 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform -rotate-6"></div>
      <div className="hidden md:block absolute top-24 right-12 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform rotate-45"></div>
      
      <div className="hidden md:block absolute bottom-8 left-8 w-16 h-16 bg-[#022d58] rounded-lg opacity-20 transform -rotate-12"></div>
      <div className="hidden md:block absolute bottom-16 left-20 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform rotate-6"></div>
      <div className="hidden md:block absolute bottom-24 left-12 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform -rotate-45"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-[#022d58] mb-4 bg-gradient-to-r from-[#022d58] to-[#003c96] bg-clip-text ">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive financial risk management solutions designed to protect and grow your business.
          </p>
        </div>
        
        {loading ? (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100"
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
                    <div className="h-7 bg-gray-200 rounded w-4/5 mb-3"></div>
                    <div className="space-y-2 mb-6">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-11/12"></div>
                      <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-11 bg-gray-200 rounded-xl w-full"></div>
                      <div className="h-11 bg-gray-100 rounded-xl w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : safeServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No services found.</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map((service, index) => (
              <div
                key={service._id || index}
                className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
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
                  <h3 className="text-2xl font-bold text-[#022d58] mb-4 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors duration-300 leading-tight">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 text-base mb-6 line-clamp-3 leading-relaxed flex-grow">
                    {service.shortDescription}
                  </p>
                  
                  <div className="space-y-3">
                    {service.slug ? (
                      <button
                        onClick={() => handleReadMore(service)}
                        disabled={loadingService === (service._id || service.slug)}
                        className="w-full bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#003c96] hover:to-[#022d58] transition-all duration-300 flex items-center justify-center space-x-2 hero-title transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
                      >
                        {loadingService === (service._id || service.slug) ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Read More</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 cursor-not-allowed opacity-70 hero-title"
                        style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
                        disabled
                        title="Service page not available"
                      >
                        <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Read More</span>
                        <ArrowRight size={18} />
                      </button>
                    )}
                    
                    {service.pdfUrl && (
                      <a
                        href={service.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white text-[#022d58] px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 hero-title border-2 border-gray-200 hover:border-[#022d58] transform hover:scale-105"
                        style={{ textDecoration: 'none', fontFamily: 'var(--font-oswald), Oswald, sans-serif' }}
                        title="View Service PDF"
                      >
                        <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>View PDF</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {visibleCount < safeServices.length && !loading && (
          <div className="text-center mt-8">
            <button
              className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#003c96] hover:to-[#022d58] transition-all duration-300 hero-title transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
              onClick={() => setVisibleCount(count => Math.min(count + 3, safeServices.length))}
            >
              <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Load More Services</span>
            </button>
          </div>
        )}
        
        {visibleCount >= safeServices.length && safeServices.length > 2 && !loading && (
          <div className="text-center">
            <button
              className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#003c96] hover:to-[#022d58] transition-all duration-300 hero-title transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
              onClick={() => {
                setVisibleCount(3);
                setTimeout(() => {
                  const firstService = document.querySelector('[role="button"]');
                  if (firstService) {
                    firstService.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
            >
              <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Collapse Service Section</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;


