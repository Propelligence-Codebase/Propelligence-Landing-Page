"use client";
import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Blog {
  _id?: string;
  title: string;
  description: string;
  shortDescription?: string;
  pdfUrl?: string;
  keywords?: string[];
  slug?: string;
}

const OurWorkSection = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBlog, setLoadingBlog] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line
  }, [sort, search]);

  async function fetchBlogs() {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('sort', sort);
    if (search.trim()) params.append('search', search.trim());
    const res = await fetch(`/api/public/blogs?${params.toString()}`);
    const data = await res.json();
    setBlogs(Array.isArray(data) ? data : []);
    setVisibleCount(3);
    setLoading(false);
  }

  const handleReadMore = async (blog: Blog) => {
    if (blog.slug) {
      console.log('Starting navigation for blog:', blog.slug);
      setLoadingBlog(blog._id || blog.slug);
      try {
        console.log('Navigating to:', `/blog/${blog.slug}`);
        await router.push(`/blog/${blog.slug}`);
      } catch (error) {
        console.error('Navigation error:', error);
        // Keep spinner if navigation fails briefly, then clear
        setLoadingBlog(null);
      }
    }
  };

  // No early return: header and controls render immediately; only grid shows skeleton

  return (
    <section id="our-work" className="bg-white py-4 relative overflow-hidden">
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
            Our Work
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Case studies and blogs from our financial risk management expertise.
          </p>
        </div>
        
        {/* Search bar row */}
        <div className="w-full max-w-6xl mx-auto flex justify-center mb-6">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search blogs by keyword..."
              className="w-full px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#022d58] focus:border-[#022d58] transition-all duration-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchBlogs(); }}
            />
          </div>
        </div>
        
        {/* Sort buttons row */}
        <div className="w-full max-w-6xl mx-auto flex justify-center mb-8">
          <div className="flex gap-3">
            <button
              className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-300 hero-title transform hover:scale-105 ${sort === 'newest' ? 'bg-gradient-to-r from-[#022d58] to-[#003c96] text-white border-[#022d58] shadow-lg' : 'bg-white text-[#022d58] border-[#022d58] hover:bg-gray-50'}`}
              style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
              onClick={() => setSort('newest')}
            >
              <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Newest</span>
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-300 hero-title transform hover:scale-105 ${sort === 'oldest' ? 'bg-gradient-to-r from-[#022d58] to-[#003c96] text-white border-[#022d58] shadow-lg' : 'bg-white text-[#022d58] border-[#022d58] hover:bg-gray-50'}`}
              style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
              onClick={() => setSort('oldest')}
            >
              <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Oldest</span>
            </button>
          </div>
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
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No blogs found.</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.slice(0, visibleCount).map((blog, index) => (
              <div
                key={blog._id || index}
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
                    {blog.title}
                  </h3>
                  
                  <div className="flex-1 mb-6">
                    <p className="text-gray-600 text-base line-clamp-3 leading-relaxed flex-grow">
                      {blog.shortDescription || (blog.description && blog.description.length > 150 
                        ? blog.description.substring(0, 150) + '...' 
                        : blog.description) || 'No description available.'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {blog.slug ? (
                      <button
                        onClick={() => handleReadMore(blog)}
                        disabled={loadingBlog === (blog._id || blog.slug)}
                        className="w-full bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#003c96] hover:to-[#022d58] transition-all duration-300 flex items-center justify-center space-x-2 hero-title transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
                      >
                        {loadingBlog === (blog._id || blog.slug) ? (
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
                        title="Blog page not available"
                      >
                        <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Read More</span>
                        <ArrowRight size={18} />
                      </button>
                    )}
                    
                    {blog.pdfUrl && (
                      <a
                        href={blog.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white text-[#022d58] px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 hero-title border-2 border-gray-200 hover:border-[#022d58] transform hover:scale-105"
                        style={{ textDecoration: 'none', fontFamily: 'var(--font-oswald), Oswald, sans-serif' }}
                        title="View Blog PDF"
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
        
        {visibleCount < blogs.length && !loading && (
          <div className="text-center mt-8">
            <button
              className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#003c96] hover:to-[#022d58] transition-all duration-300 hero-title transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
              onClick={() => setVisibleCount(count => Math.min(count + 3, blogs.length))}
            >
              <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Load More Blogs</span>
            </button>
          </div>
        )}
        
        {visibleCount >= blogs.length && blogs.length > 3 && !loading && (
          <div className="text-center">
            <button
              className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#003c96] hover:to-[#022d58] transition-all duration-300 hero-title transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}
              onClick={() => {
                setVisibleCount(3);
                setTimeout(() => {
                  const firstBlog = document.querySelector('#our-work [role="button"]');
                  if (firstBlog) {
                    firstBlog.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
            >
              <span style={{fontFamily: 'var(--font-oswald), Oswald, sans-serif'}}>Collapse Blogs Section</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default OurWorkSection;