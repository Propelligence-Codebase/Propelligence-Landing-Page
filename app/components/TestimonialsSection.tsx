"use client";
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  _id?: string;
  name: string;
  role: string;
  star: number;
  testimonial: string;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        setLoading(true);
        const res = await fetch('/api/public/testimonials');
        if (res.ok) {
          const data = await res.json();
          setTestimonials(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch testimonials:', res.status);
          setTestimonials([]);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (testimonials.length > 0 ? (prev + 1) % testimonials.length : 0));
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (testimonials.length > 0 ? (prev - 1 + testimonials.length) % testimonials.length : 0));
  }, [testimonials.length]);

  // Auto-rotate carousel
  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, testimonials.length]);

  // No early return: header renders immediately; card skeleton shows while loading

  const hasTestimonials = testimonials.length > 0;

  return (
    <section id="testimonials" className="bg-white py-4 relative overflow-hidden">
      {/* Decorative Navy Blue Squares - Hidden on mobile */}
      <div className="hidden md:block absolute top-8 right-8 w-16 h-16 bg-[#022d58] rounded-lg opacity-20 transform rotate-12"></div>
      <div className="hidden md:block absolute top-16 right-20 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform -rotate-6"></div>
      <div className="hidden md:block absolute top-24 right-12 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform rotate-45"></div>
      <div className="hidden md:block absolute bottom-8 left-8 w-16 h-16 bg-[#022d58] rounded-lg opacity-20 transform -rotate-12"></div>
      <div className="hidden md:block absolute bottom-16 left-20 w-12 h-12 bg-[#022d58] rounded-lg opacity-15 transform rotate-6"></div>
      <div className="hidden md:block absolute bottom-24 left-12 w-8 h-8 bg-[#022d58] rounded-lg opacity-10 transform -rotate-45"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-[#022d58] mb-4 bg-gradient-to-r from-[#022d58] to-[#003c96] bg-clip-text">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trusted by leading financial institutions and businesses worldwide.
          </p>
        </div>
        
        <div className="relative max-w-2xl mx-auto">
          {/* Navigation Buttons */}
          {hasTestimonials && !loading && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-[#022d58] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#022d58]"
                title="Previous testimonial"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-[#022d58] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#022d58]"
                title="Next testimonial"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel Indicators removed as requested */}

          {/* Main Testimonial Card */}
          {loading || !hasTestimonials ? (
            <div
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
                  <div className="h-7 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto mb-6"></div>
                  <div className="flex justify-center mb-6 space-x-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-5 w-5 bg-yellow-100 rounded"></div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-11/12 mx-auto"></div>
                    <div className="h-4 bg-gray-100 rounded w-10/12 mx-auto"></div>
                    <div className="h-4 bg-gray-100 rounded w-9/12 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
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
                {/* Client Info */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-[#022d58] mb-2">
                    {testimonials[currentSlide].name}
                  </h3>
                  <p className="text-gray-600 text-lg">{testimonials[currentSlide].role}</p>
                </div>
                
                {/* Star Rating */}
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentSlide].star)].map((_, i) => (
                    <Star
                      key={i}
                      className="fill-current text-yellow-400 stroke-yellow-400 mx-1"
                      size={24}
                    />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <div className="flex-1">
                  <blockquote className="text-gray-700 text-xl leading-relaxed text-center italic">
                    &quot;{testimonials[currentSlide].testimonial}&quot;
                  </blockquote>
                </div>
              </div>
            </div>
          )}






        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
