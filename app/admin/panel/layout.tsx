"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

const sidebarLinks = [
  { name: "Services", href: "/admin/panel/services" },
  { name: "Blogs", href: "/admin/panel/blogs" },
  { name: "Website Content", href: "/admin/panel/testimonials" },
  { name: "Contact", href: "/admin/panel/contact-submissions" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGoingToWebsite, setIsGoingToWebsite] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check authentication status
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      }
    }
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear the authentication cookie
      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authenticated: false }),
      });
      
      router.push("/admin/login");
    } catch (error) {
      console.error('Logout failed:', error);
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGoToWebsite = () => {
    setIsGoingToWebsite(true);
    router.push("/");
  };

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#ee800227] to-[#01ff5a49] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#022d58]"></div>
      </div>
    );
  }

    return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#ee800227] to-[#01ff5a49]">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-[#022d58]/20 flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Image
            src="/Company-logo-svg.svg"
            alt="Propelligence Logo"
            width={40}
            height={40}
            className="w-8 h-8 rounded-lg object-contain drop-shadow-lg"
            priority
            draggable={false}
          />
          <span className="font-bold text-[#022d58] text-base">Admin Panel</span>
        </div>
        <button 
          onClick={() => setSidebarOpen((v) => !v)} 
          className="p-2 rounded-lg hover:bg-[#022d58]/10 transition-colors"
        >
          <Menu className="w-6 h-6 text-[#022d58]" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed z-40 top-0 left-0 h-screen w-80 max-w-[85vw] bg-white/95 backdrop-blur-md border-r-2 border-[#022d58]/20 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 md:top-0 md:w-64 md:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Close button on mobile */}
        <button 
          className="md:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#022d58] text-xl bg-white/80 rounded-full shadow-lg hover:bg-white transition-colors" 
          onClick={() => setSidebarOpen(false)}
        >
          ×
        </button>

        {/* Company Logo and Title */}
        <div className="flex flex-col items-center space-y-2 mb-6 mt-8 md:mt-6 px-4">
          <Image
            src="/Company-logo-svg.svg"
            alt="Propelligence Logo"
            width={80}
            height={80}
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-contain drop-shadow-lg"
            priority
            draggable={false}
          />
          <div className="text-center">
            <h1 className="text-base md:text-lg font-bold text-[#022d58] leading-tight">Propelligence</h1>
            <p className="text-xs md:text-sm font-semibold text-[#022d58]">Advisors Private Limited</p>
          </div>
        </div>

        {/* Admin Panel Title */}
        <div className="text-center mb-6 px-4">
          <Link href="/admin/panel" className="block" onClick={() => setSidebarOpen(false)}>
            <h2 className="text-lg md:text-xl font-bold text-[#022d58] mb-2 hover:text-[#003c96] transition-colors duration-300 cursor-pointer">Admin Panel</h2>
            <div className="w-12 md:w-16 h-1 bg-gradient-to-r from-[#022d58] to-[#003c96] mx-auto rounded-full"></div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-4 flex-1">
          {sidebarLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="hover:bg-gradient-to-r hover:from-[#022d58] hover:to-[#003c96] hover:text-white rounded-xl px-3 py-2.5 md:px-4 md:py-3 transition-all duration-300 font-semibold text-[#022d58] border-2 border-transparent hover:border-[#022d58]/20 text-sm md:text-base"
              onClick={() => setSidebarOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="w-full flex flex-col gap-2 p-4">
          <button 
            onClick={handleGoToWebsite}
            disabled={isGoingToWebsite}
            className="w-full bg-gradient-to-r from-[#022d58] to-[#003c96] text-white py-2.5 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {isGoingToWebsite ? (
              <div className="loader-spinner"></div>
            ) : (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18m-6-6l6 6-6 6" />
              </svg>
            )}
            {isGoingToWebsite ? "Going..." : "Go to Website"}
          </button>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {isLoggingOut ? (
              <div className="loader-spinner"></div>
            ) : (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pt-16 md:pt-0 p-2 md:p-6 lg:p-8 bg-transparent">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-2xl border-2 border-[#022d58]/20 p-3 md:p-6 lg:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
