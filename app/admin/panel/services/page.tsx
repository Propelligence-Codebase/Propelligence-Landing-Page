"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, FileText, X, CheckCircle, AlertCircle, Loader2, Eye, Share2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth";
import BlogEditor from "@/app/components/BlogEditor";
import { BlogBlock } from "@/app/components/BlogEditor";
import { generateUniqueSlug } from "@/lib/utils";

interface Service {
  _id?: string;
  title: string;
  shortDescription: string;
  keywords?: string[];
  blocks?: BlogBlock[];
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to show static content immediately
  const [showEditor, setShowEditor] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingService, setDeletingService] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(false);

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    const newNotification = { id, type, message };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/services");
      if (res.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
      if (error instanceof Error && error.message === 'Authentication token not available') {
        window.location.href = '/admin/login';
        return;
      }
      addNotification('error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    // Start API call after component mounts (showing static content first)
    const timer = setTimeout(() => {
      fetchServices();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchServices]);

  async function handleSave(data: { 
    title: string; 
    shortDescription: string; 
    keywords: string[]; 
    blocks: BlogBlock[]; 
    slug: string 
  }) {
    console.log('Services admin handleSave called with data:', data);
    setIsSubmitting(true);
    
    try {
      let finalSlug;
      if (editingService?._id) {
        // Only regenerate slug if title has changed
        const titleChanged = editingService.title !== data.title;
        if (titleChanged) {
          finalSlug = await generateUniqueSlug(data.title, 'services', editingService._id);
        } else {
          finalSlug = editingService.slug;
        }
        const serviceData = {
          ...data,
          slug: finalSlug,
        };
        const response = await authenticatedFetch(`/api/services/${editingService._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Update failed');
        }
        addNotification('success', titleChanged ? `Service updated! New slug: ${finalSlug}` : 'Service updated successfully!');
        fetchServices();
        return;
      } else {
        finalSlug = await generateUniqueSlug(data.title, 'services');
      }
      
      console.log('Generated SEO-friendly slug:', finalSlug);

      const serviceData = {
        ...data,
        slug: finalSlug, // Use the generated or existing slug
      };
      
      console.log('Service data to save:', serviceData);

      if (editingService?._id) {
        // Update existing service
        console.log('Updating existing service:', editingService._id);
        const response = await authenticatedFetch(`/api/services/${editingService._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        });

        console.log('Update response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update error data:', errorData);
          throw new Error(errorData.error || 'Update failed');
        }

        const responseData = await response.json();
        console.log('Update response data:', responseData);
        
        // If the slug changed, show notification and redirect
        if (responseData.slugChanged && responseData.slug) {
          addNotification('success', `Service updated successfully! Slug changed from "${responseData.oldSlug}" to "${responseData.slug}".`);
          // Removed redirect to rendered service page
          return;
        }

        addNotification('success', 'Service updated successfully!');
      } else {
        // Create new service
        console.log('Creating new service');
        const response = await authenticatedFetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        });

        console.log('Create response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Create error data:', errorData);
          throw new Error(errorData.error || 'Creation failed');
        }

        addNotification('success', 'Service created successfully!');
        console.log('Service saved with slug:', finalSlug);
      }
      
      fetchServices();
    } catch (error) {
      console.error('Service operation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', editingService ? 'Failed to update service' : `Failed to create service: ${errorMessage}`);
    } finally {
      setShowEditor(false);
      setEditingService(null);
      setIsSubmitting(false);
    }
  }

  function handleEdit(service: Service) {
    setShowLoader(true);
    setTimeout(() => {
      setEditingService(service);
      setShowEditor(true);
      setShowLoader(false);
    }, 100); // Simulate instant redirect, then show loader, then open editor
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    setDeletingService(id);
    
    try {
      await authenticatedFetch(`/api/services/${id}`, { method: "DELETE" });
      addNotification('success', 'Service deleted successfully!');
      fetchServices();
    } catch {
      addNotification('error', 'Failed to delete service');
    } finally {
      setDeletingService(null);
    }
  }

  function handleCancel() {
    setShowEditor(false);
    setEditingService(null);
  }

  function handleView(service: Service) {
    if (service.slug) {
      window.open(`/service/${service.slug}`, '_blank');
    }
  }

  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (showEditor) {
    return (
      <div className="space-y-8">
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border-2 transform transition-all duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <AlertCircle size={20} className="text-red-600" />
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-[#022d58]">
            {editingService ? 'Edit Service' : 'Create New Service'}
          </h1>
          <button
            onClick={handleCancel}
            className="px-6 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300"
          >
            Cancel
          </button>
        </div>

        {/* Save button and loader removed */}

        <BlogEditor
          initialTitle={editingService?.title || ''}
          initialShortDescription={editingService?.shortDescription || ''}
          initialKeywords={editingService?.keywords || []}
          initialBlocks={editingService?.blocks || []}
          onSave={handleSave}
          onCancel={handleCancel}
          type="service"
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showLoader && (
        <div className="loader-fullscreen">
          <div className="loader-spinner"></div>
        </div>
      )}
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border-2 transform transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Header - Always visible */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#022d58] mb-2">
            Manage Services
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage your financial services
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Service
        </button>
      </div>

      {/* Services List - Shows loading only for this area */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="loader-spinner"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No services yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first service to get started
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Create Your First Service
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-white card-animated-border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full group overflow-hidden"
            >
              {/* Animated border sides */}
              <div className="border-top border-side" />
              <div className="border-bottom border-side" />
              <div className="border-left border-side" />
              <div className="border-right border-side" />
              <div className="flex-1 flex flex-col p-6">
                <h3 className="text-xl font-bold text-[#022d58] mb-2 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors">
                  {service.title}
                </h3>
                {service.shortDescription && (
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {service.shortDescription}
                  </p>
                )}
                {service.keywords && service.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mb-3">
                    <span className="text-xs text-gray-500 mr-2">Keywords:</span>
                    {service.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs break-words">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                  <span>Date: <span className="font-medium">{service.updatedAt ? formatDate(service.updatedAt) : formatDate(service.createdAt)}</span></span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-4 pb-4">
                {service.slug && (
                  <button
                    onClick={() => handleView(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                    title="View Service"
                  >
                    <Eye size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Edit Service"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(service._id!)}
                  disabled={deletingService === service._id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                  title="Delete Service"
                >
                  {deletingService === service._id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                                </button>
                {/* Share button */}
                {service.slug && (
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/service/${service.slug}`;
                      const shareText = `${service.title} - Check out this service from Propelligence\n\n${shareUrl}`;
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(shareText);
                      } else {
                        const textarea = document.createElement("textarea");
                        textarea.value = shareText;
                        textarea.style.position = "fixed";
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();
                        try {
                          document.execCommand('copy');
                        } catch {
                          // Optionally handle error
                        }
                        document.body.removeChild(textarea);
                      }
                      addNotification('success', 'Service link copied to clipboard!');
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                    title="Copy Service Link"
                  >
                    <Share2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
