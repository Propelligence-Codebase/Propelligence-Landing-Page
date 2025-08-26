"use client";

import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-24 sm:pt-24 pb-8 sm:pb-12">
        <div className="h-8 sm:h-6 lg:h-8"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content Skeleton */}
            <article className="xl:col-span-3 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="animate-pulse">
                <div className="h-8 sm:h-10 bg-gray-200 rounded w-2/3 mx-auto mb-6"></div>
                <div className="flex justify-center mb-6">
                  <div className="h-4 bg-gray-100 rounded w-28"></div>
                </div>
                <div className="border-t border-gray-200 my-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-11/12"></div>
                  <div className="h-4 bg-gray-100 rounded w-10/12"></div>
                  <div className="h-4 bg-gray-100 rounded w-9/12"></div>
                </div>
              </div>
            </article>

            {/* Sidebar Skeleton */}
            <aside className="xl:col-span-1 space-y-4 sm:space-y-6">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


