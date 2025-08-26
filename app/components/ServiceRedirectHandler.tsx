"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ServiceRedirectHandlerProps {
  slug: string;
}

export default function ServiceRedirectHandler({ slug }: ServiceRedirectHandlerProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [redirectInfo, setRedirectInfo] = useState<{
    found: boolean;
    redirect: boolean;
    newSlug?: string;
    oldSlug?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkRedirect() {
      try {
        console.log('Checking for service redirect:', slug);
        const response = await fetch(`/api/services/redirect/${slug}`);
        const data = await response.json();
        
        console.log('Redirect check response:', data);
        
        if (data.found && data.redirect && data.newSlug) {
          console.log('Redirecting from', data.oldSlug, 'to', data.newSlug);
          setRedirectInfo(data);
          
          // Wait a moment to show the redirect message, then redirect
          setTimeout(() => {
            router.push(`/service/${data.newSlug}`);
          }, 2000);
        } else if (!data.found) {
          setError('Service not found');
        }
      } catch (error) {
        console.error('Error checking redirect:', error);
        setError('Failed to check service redirect');
      } finally {
        setIsChecking(false);
      }
    }

    checkRedirect();
  }, [slug, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#022d58] mx-auto mb-4" size={32} />
          <p className="text-gray-600">Checking service availability...</p>
        </div>
      </div>
    );
  }

  if (redirectInfo?.redirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="text-blue-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Service Moved
          </h2>
          <p className="text-gray-600 mb-4">
            This service has been moved to a new URL. You will be redirected automatically.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              <strong>Old URL:</strong> {redirectInfo.oldSlug}
            </p>
            <p className="text-blue-800">
              <strong>New URL:</strong> {redirectInfo.newSlug}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Service Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The service youre looking for could not be found. It may have been moved or deleted.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#022d58] text-white px-6 py-2 rounded-lg hover:bg-[#003c96] transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
} 