"use client";
import { useEffect, useState, useCallback } from "react";
import Image from 'next/image';
import { Edit, Trash2, FileText, X, CheckCircle, AlertCircle, Loader2, Star } from "lucide-react";
import { authenticatedFetch } from "../../../../lib/auth";
import { Testimonial } from "../../../../lib/testimonialSchema";
import { Statistics } from "../../../../lib/statisticsSchema";
import { Founder } from "../../../../lib/founderSchema";
import { AboutCompany } from "../../../../lib/aboutCompanySchema";
import Cropper from 'react-easy-crop';
import { useRef } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to show static content immediately
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(false);

  // Statistics state and logic
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statsForm, setStatsForm] = useState({ yearsExperience: 0, clientsServed: 0, assetsManaged: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsEditMode, setStatsEditMode] = useState(false);
  const [statsError, setStatsError] = useState("");

  // About Company state and logic
  const [aboutCompany, setAboutCompany] = useState<AboutCompany | null>(null);
  const [aboutForm, setAboutForm] = useState({ aboutText: "" });
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutEditMode, setAboutEditMode] = useState(false);
  const [aboutError, setAboutError] = useState("");

  // Founders state and logic
  const [founders, setFounders] = useState<Founder[]>([]);
  // In founderForm state, use imageBase64 instead of imagepath
  const [founderForm, setFounderForm] = useState<Omit<Founder, "_id">>({ name: "", title: "", desc: "", imageBase64: "", insta_link: "", x_link: "", linkdin_link: "" });
  const [founderEditId, setFounderEditId] = useState<string | null>(null);
  const [foundersLoading, setFoundersLoading] = useState(false);
  const [founderError, setFounderError] = useState("");
  const [showFounderForm, setShowFounderForm] = useState(false);

  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const [form, setForm] = useState<Omit<Testimonial, "_id">>({
    name: "",
    role: "",
    star: 5,
    testimonial: "",
  });

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    const newNotification = { id, type, message };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/testimonials");
      if (res.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
      if (error instanceof Error && error.message === 'Authentication token not available') {
        window.location.href = '/admin/login';
        return;
      }
      addNotification('error', 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await authenticatedFetch("/api/statistics");
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setStatistics(data[0] || null);
      if (data[0]) {
        setStatsForm({
          yearsExperience: data[0].yearsExperience,
          clientsServed: data[0].clientsServed,
          assetsManaged: data[0].assetsManaged,
        });
      }
    } catch {
      addNotification('error', 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [addNotification]);

  const fetchAboutCompany = useCallback(async () => {
    setAboutLoading(true);
    try {
      const res = await authenticatedFetch("/api/about-company");
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setAboutCompany(data[0] || null);
      if (data[0]) {
        setAboutForm({ aboutText: data[0].aboutText });
      }
    } catch {
      addNotification('error', 'Failed to load about company info');
    } finally {
      setAboutLoading(false);
    }
  }, [addNotification]);

  const fetchFounders = useCallback(async () => {
    setFoundersLoading(true);
    try {
      const res = await authenticatedFetch("/api/founders");
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setFounders(data);
    } catch {
      addNotification('error', 'Failed to load founders');
    } finally {
      setFoundersLoading(false);
    }
  }, [addNotification]);

  // Fetch testimonials
  useEffect(() => {
    // Start API call after component mounts (showing static content first)
    const timer = setTimeout(() => {
      fetchTestimonials();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchTestimonials]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchAboutCompany();
  }, [fetchAboutCompany]);

  useEffect(() => {
    fetchFounders();
  }, [fetchFounders]);

  // Handle form input
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "star" ? Number(value) : value }));
  }

  function handleStatsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setStatsForm(f => ({ ...f, [name]: Number(value) }));
  }

  function handleAboutChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setAboutForm({ aboutText: e.target.value });
  }

  function handleFounderChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFounderForm(f => ({ ...f, [name]: value }));
  }

  function handleFounderImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }

  const onCropComplete = (_: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  async function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }) {
    const createImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const diameter = Math.min(crop.width, crop.height);
    canvas.width = diameter;
    canvas.height = diameter;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter
    );
    ctx.restore();
    return canvas.toDataURL('image/jpeg');
  }

  async function handleCropConfirm() {
    if (imageSrc && croppedAreaPixels) {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (cropped) {
        setFounderForm(f => ({ ...f, imageBase64: cropped }));
      }
      setShowCropper(false);
      setImageSrc(null);
      setCroppedAreaPixels(null);
    }
  }

  // Create or update testimonial
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.role || !form.testimonial) {
      setError("All fields are required.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editId) {
        // Update
        await authenticatedFetch(`/api/testimonials/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        addNotification('success', 'Testimonial updated successfully!');
      } else {
        // Create
        await authenticatedFetch("/api/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        addNotification('success', 'Testimonial created successfully!');
      }
      setForm({ name: "", role: "", star: 5, testimonial: "" });
      setEditId(null);
      setShowForm(false);
      fetchTestimonials();
    } catch {
      addNotification('error', editId ? 'Failed to update testimonial' : 'Failed to create testimonial');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatsError("");
    setStatsLoading(true);
    try {
      if (statistics && statistics._id) {
        // Update
        await authenticatedFetch("/api/statistics", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: statistics._id, ...statsForm }),
        });
        addNotification('success', 'Statistics updated successfully!');
      } else {
        // Create
        await authenticatedFetch("/api/statistics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(statsForm),
        });
        addNotification('success', 'Statistics created successfully!');
      }
      setStatsEditMode(false);
      fetchStatistics();
    } catch {
      setStatsError("Failed to save statistics");
      addNotification('error', 'Failed to save statistics');
    } finally {
      setStatsLoading(false);
    }
  }

  async function handleStatsDelete() {
    if (!statistics || !statistics._id) return;
    if (!confirm("Are you sure you want to delete the statistics?")) return;
    setStatsLoading(true);
    try {
      await authenticatedFetch("/api/statistics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: statistics._id }),
      });
      setStatistics(null);
      setStatsForm({ yearsExperience: 0, clientsServed: 0, assetsManaged: 0 });
      addNotification('success', 'Statistics deleted successfully!');
    } catch {
      addNotification('error', 'Failed to delete statistics');
    } finally {
      setStatsLoading(false);
    }
  }

  async function handleAboutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAboutError("");
    setAboutLoading(true);
    try {
      if (aboutCompany && aboutCompany._id) {
        // Update
        await authenticatedFetch("/api/about-company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: aboutCompany._id, ...aboutForm }),
        });
        addNotification('success', 'About company updated successfully!');
      } else {
        // Create
        await authenticatedFetch("/api/about-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aboutForm),
        });
        addNotification('success', 'About company created successfully!');
      }
      setAboutEditMode(false);
      fetchAboutCompany();
    } catch {
      setAboutError("Failed to save about company info");
      addNotification('error', 'Failed to save about company info');
    } finally {
      setAboutLoading(false);
    }
  }

  async function handleAboutDelete() {
    if (!aboutCompany || !aboutCompany._id) return;
    if (!confirm("Are you sure you want to delete the about company info?")) return;
    setAboutLoading(true);
    try {
      await authenticatedFetch("/api/about-company", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: aboutCompany._id }),
      });
      setAboutCompany(null);
      setAboutForm({ aboutText: "" });
      addNotification('success', 'About company info deleted successfully!');
    } catch {
      addNotification('error', 'Failed to delete about company info');
    } finally {
      setAboutLoading(false);
    }
  }

  async function handleFounderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFounderError("");
    
    // Validate required fields
    if (!founderForm.name || !founderForm.title || !founderForm.desc) {
      setFounderError("Name, title, and description are required fields.");
      return;
    }
    
    setFoundersLoading(true);
    try {
      // Prepare the data to submit
      const dataToSubmit = { 
        ...founderForm,
        ...(founderEditId && !founderForm.imageBase64 ? {
          imageBase64: founders.find(f => f._id === founderEditId)?.imageBase64 || ""
        } : {})
      };
      
      if (founderEditId) {
        // Update
        await authenticatedFetch("/api/founders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: founderEditId, ...dataToSubmit }),
        });
        addNotification('success', 'Founder updated successfully!');
      } else {
        // Create
        await authenticatedFetch("/api/founders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSubmit),
        });
        addNotification('success', 'Founder created successfully!');
      }
      setFounderForm({ name: "", title: "", desc: "", imageBase64: "", insta_link: "", x_link: "", linkdin_link: "" });
      setFounderEditId(null);
      setShowFounderForm(false);
      fetchFounders();
    } catch {
      setFounderError(founderEditId ? 'Failed to update founder' : 'Failed to create founder');
    } finally {
      setFoundersLoading(false);
    }
  }

  function handleFounderEdit(f: Founder) {
    setFounderForm({
      name: f.name,
      title: f.title,
      desc: f.desc,
      imageBase64: f.imageBase64 || "",
      insta_link: f.insta_link || "",
      x_link: f.x_link || "",
      linkdin_link: f.linkdin_link || "",
    });
    setFounderEditId(f._id!);
    setShowFounderForm(true);
  }

  async function handleFounderDelete(id: string) {
    if (!confirm("Are you sure you want to delete this founder?")) return;
    setFoundersLoading(true);
    try {
      await authenticatedFetch("/api/founders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id }),
      });
      addNotification('success', 'Founder deleted successfully!');
      fetchFounders();
    } catch {
      addNotification('error', 'Failed to delete founder');
    } finally {
      setFoundersLoading(false);
    }
  }

  // Edit testimonial
  function handleEdit(t: Testimonial) {
    setShowLoader(true);
    setTimeout(() => {
      setForm({ name: t.name, role: t.role, star: t.star, testimonial: t.testimonial });
      setEditId(t._id!);
      setShowForm(true);
      setShowLoader(false);
    }, 100); // Simulate instant redirect, then show loader, then open form
  }

  // Delete testimonial
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    
    setDeletingTestimonial(id);
    
    try {
      await authenticatedFetch(`/api/testimonials/${id}`, { method: "DELETE" });
      addNotification('success', 'Testimonial deleted successfully!');
      fetchTestimonials();
    } catch {
      addNotification('error', 'Failed to delete testimonial');
    } finally {
      setDeletingTestimonial(null);
    }
  }

  function resetForm() {
    setForm({ name: "", role: "", star: 5, testimonial: "" });
    setEditId(null);
    setError("");
  }



  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

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

      {/* Website Content Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#022d58] mb-2">
            Website Content
          </h1>
          <p className="text-gray-600">
            Manage company statistics and client testimonials displayed on your website
          </p>
        </div>
      </div>

      {/* About Company Management Section */}
      <div className="bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 p-6 rounded-3xl border-2 border-[#022d58]/20 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#022d58]">About Company</h2>
          {aboutCompany && !aboutEditMode && (
            <button
              onClick={() => setAboutEditMode(true)}
              className="px-6 py-2 bg-[#022d58] text-white rounded-xl font-semibold shadow hover:bg-[#003c96] transition-all"
            >
              Edit
            </button>
          )}
        </div>
        {aboutLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="loader-spinner"></div>
          </div>
        ) : aboutEditMode || !aboutCompany ? (
          <form onSubmit={handleAboutSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#022d58] mb-2">About Company Text</label>
              <textarea
                name="aboutText"
                value={aboutForm.aboutText}
                onChange={handleAboutChange}
                rows={5}
                className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                required
              />
            </div>
            {aboutError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-center font-medium">
                {aboutError}
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={aboutLoading}
                className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {aboutLoading ? 'Saving...' : (aboutCompany ? 'Update' : 'Create')}
              </button>
              {aboutCompany && (
                <button
                  type="button"
                  onClick={() => setAboutEditMode(false)}
                  disabled={aboutLoading}
                  className="px-8 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              {aboutCompany && (
                <button
                  type="button"
                  onClick={handleAboutDelete}
                  disabled={aboutLoading}
                  className="px-8 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="p-6 bg-white rounded-xl shadow text-center">
            <div className="text-xl text-[#022d58] whitespace-pre-line">{aboutCompany.aboutText}</div>
          </div>
        )}
      </div>

      {/* Founders (Board Members) Management Section */}
      <div className="bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 p-6 rounded-3xl border-2 border-[#022d58]/20 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#022d58]">Board Members</h2>
          <button
            onClick={() => { setFounderForm({ name: "", title: "", desc: "", imageBase64: "", insta_link: "", x_link: "", linkdin_link: "" }); setFounderEditId(null); setShowFounderForm(true); }}
            className="px-6 py-2 bg-[#022d58] text-white rounded-xl font-semibold shadow hover:bg-[#003c96] transition-all"
          >
            Add New
          </button>
        </div>
        {showFounderForm ? (
          <form onSubmit={handleFounderSubmit} className="space-y-6 mb-8 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 p-6 rounded-3xl border-2 border-[#022d58]/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Name</label>
                <input
                  name="name"
                  value={founderForm.name}
                  onChange={handleFounderChange}
                  placeholder="Enter name"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Title</label>
                <input
                  name="title"
                  value={founderForm.title}
                  onChange={handleFounderChange}
                  placeholder="Enter title"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Description</label>
                <textarea
                  name="desc"
                  value={founderForm.desc}
                  onChange={handleFounderChange}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFounderImageChange}
                  ref={fileInputRef}
                  className="w-full p-2 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                />
                {showCropper && imageSrc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full flex flex-col items-center">
                      <div className="relative w-64 h-64 bg-gray-100 rounded-full overflow-hidden">
                        <Cropper
                          image={imageSrc}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button 
                          type="button"
                          onClick={handleCropConfirm} 
                          className="bg-[#022d58] text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-[#003c96] transition-all"
                        >
                          Crop & Save
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setShowCropper(false); setImageSrc(null); setCroppedAreaPixels(null); }} 
                          className="px-6 py-2 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {founderForm.imageBase64 && (
                  <div className="mt-2">
                    <div className="w-24 h-24 bg-white rounded-full border-2 border-[#022d58] shadow-lg overflow-hidden">
                      <Image src={founderForm.imageBase64} alt="Founder Preview" width={96} height={96} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFounderForm(f => ({ ...f, imageBase64: "" }))}
                      className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Instagram Link</label>
                <input
                  name="insta_link"
                  value={founderForm.insta_link || ""}
                  onChange={handleFounderChange}
                  placeholder="https://instagram.com/"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">X (Twitter) Link</label>
                <input
                  name="x_link"
                  value={founderForm.x_link || ""}
                  onChange={handleFounderChange}
                  placeholder="https://twitter.com/"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">LinkedIn Link</label>
                <input
                  name="linkdin_link"
                  value={founderForm.linkdin_link || ""}
                  onChange={handleFounderChange}
                  placeholder="https://linkedin.com/"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                />
              </div>
            </div>
            {founderError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-center font-medium">
                {founderError}
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={foundersLoading}
                className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {foundersLoading ? (founderEditId ? 'Updating...' : 'Creating...') : (founderEditId ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={() => { setFounderForm({ name: "", title: "", desc: "", imageBase64: "", insta_link: "", x_link: "", linkdin_link: "" }); setFounderEditId(null); setShowFounderForm(false); }}
                disabled={foundersLoading}
                className="px-8 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {founders.map((founder) => (
              <div
                key={founder._id}
                className="bg-white card-animated-border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full group overflow-hidden"
              >
                {/* Animated border sides */}
                <div className="border-top border-side" />
                <div className="border-bottom border-side" />
                <div className="border-left border-side" />
                <div className="border-right border-side" />
                
                <div className="flex-1 flex flex-col p-6">
                  {/* Founder Image */}
                  {founder.imageBase64 && (
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 bg-white rounded-full border-2 border-[#022d58] shadow-lg overflow-hidden">
                        <Image 
                          src={founder.imageBase64} 
                          alt={`${founder.name}`} 
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide on error to avoid broken preview
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#022d58] mb-2 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors">
                      {founder.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{founder.title}</p>
                  </div>
                  <div className="flex-1 mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 italic">
                      {founder.desc}
                    </p>
                  </div>
                  <div className="flex space-x-4 mb-4">
                    {founder.insta_link && (
                      <a href={founder.insta_link} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <svg className="w-6 h-6 text-[#E4405F] hover:text-[#C13584] transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.775.131 4.602.425 3.635 1.392 2.668 2.359 2.374 3.532 2.315 4.809.013 8.332 0 8.741 0 12c0 3.259.013 3.668.072 4.948.059 1.277.353 2.45 1.32 3.417.967.967 2.14 1.261 3.417 1.32C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.277-.059 2.45-.353 3.417-1.32.967-.967 1.261-2.14 1.32-3.417.059-1.28.072-1.689.072-4.948s-.013-3.668-.072-4.948c-.059-1.277-.353-2.45-1.32-3.417-.967-.967-2.14-1.261-3.417-1.32C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      </a>
                    )}
                    {founder.x_link && (
                      <a href={founder.x_link} target="_blank" rel="noopener noreferrer" aria-label="X">
                        <svg className="w-6 h-6 text-black hover:text-[#1DA1F2] transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                    {founder.linkdin_link && (
                      <a href={founder.linkdin_link} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <svg className="w-6 h-6 text-[#0077B5] hover:text-[#005983] transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M22.23 0H1.77C.792 0 0 .771 0 1.723v20.549C0 23.229.792 24 1.77 24h20.459C23.208 24 24 23.229 24 22.271V1.723C24 .771 23.208 0 22.23 0zM7.12 20.452H3.56V9.034h3.56v11.418zM5.34 7.433a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm15.09 13.019h-3.56v-5.604c0-1.336-.025-3.057-1.864-3.057-1.864 0-2.15 1.454-2.15 2.957v5.704h-3.56V9.034h3.5v1.561h.05c.487-.922 1.676-1.892 3.45-1.892 3.692 0 4.372 2.43 4.372 5.59v6.159z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-4 pb-4">
                  <button
                    onClick={() => handleFounderEdit(founder)}
                    disabled={foundersLoading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit Founder"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleFounderDelete(founder._id!)}
                    disabled={foundersLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                    title="Delete Founder"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!showFounderForm && founders.length === 0 && !foundersLoading && (
          <div className="text-center py-8 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 rounded-3xl border-2 border-[#022d58]/20">
            <FileText size={32} className="text-[#022d58]/50 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-[#022d58] mb-1">No Board Members Found</h3>
            <p className="text-gray-600">Add your first board member above.</p>
          </div>
        )}
      </div>

      {/* Statistics Management Section */}
      <div className="bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 p-6 rounded-3xl border-2 border-[#022d58]/20 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#022d58]">Company Statistics</h2>
          {statistics && !statsEditMode && (
            <button
              onClick={() => setStatsEditMode(true)}
              className="px-6 py-2 bg-[#022d58] text-white rounded-xl font-semibold shadow hover:bg-[#003c96] transition-all"
            >
              Edit
            </button>
          )}
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="loader-spinner"></div>
          </div>
        ) : statsEditMode || !statistics ? (
          <form onSubmit={handleStatsSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Years Experience</label>
                <input
                  name="yearsExperience"
                  type="number"
                  min={0}
                  value={statsForm.yearsExperience}
                  onChange={handleStatsChange}
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Clients Served</label>
                <input
                  name="clientsServed"
                  type="number"
                  min={0}
                  value={statsForm.clientsServed}
                  onChange={handleStatsChange}
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Assets Managed</label>
                <input
                  name="assetsManaged"
                  type="number"
                  min={0}
                  value={statsForm.assetsManaged}
                  onChange={handleStatsChange}
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
            </div>
            {statsError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-center font-medium">
                {statsError}
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={statsLoading}
                className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {statsLoading ? 'Saving...' : (statistics ? 'Update' : 'Create')}
              </button>
              {statistics && (
                <button
                  type="button"
                  onClick={() => setStatsEditMode(false)}
                  disabled={statsLoading}
                  className="px-8 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              {statistics && (
                <button
                  type="button"
                  onClick={handleStatsDelete}
                  disabled={statsLoading}
                  className="px-8 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl shadow text-center">
              <div className="text-4xl font-bold text-[#022d58]">{statistics.yearsExperience}</div>
              <div className="text-gray-600 mt-2">Years Experience</div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow text-center">
              <div className="text-4xl font-bold text-[#022d58]">{statistics.clientsServed}</div>
              <div className="text-gray-600 mt-2">Clients Served</div>
            </div>
            <div className="p-6 bg-white rounded-xl shadow text-center">
              <div className="text-4xl font-bold text-[#022d58]">{statistics.assetsManaged}</div>
              <div className="text-gray-600 mt-2">Assets Managed</div>
            </div>
          </div>
        )}
      </div>

      {/* Testimonials Management Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#022d58]">Manage Testimonials</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-6 py-2 bg-[#022d58] text-white rounded-xl font-semibold shadow hover:bg-[#003c96] transition-all"
          >
            Add New
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 mb-8 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 p-6 rounded-3xl border-2 border-[#022d58]/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Client Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter client name"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Client Role/Company</label>
                <input
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g., CFO at ACME Corp"
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Rating</label>
                <select
                  name="star"
                  value={form.star}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                >
                  {[5,4,3,2,1].map((n) => (
                    <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#022d58] mb-2">Testimonial</label>
                <textarea
                  name="testimonial"
                  value={form.testimonial}
                  onChange={handleChange}
                  placeholder="Write the client's feedback"
                  rows={4}
                  className="w-full p-4 border-2 border-[#022d58]/20 rounded-xl bg-white/50 focus:border-[#022d58] focus:outline-none transition-all text-[#022d58]"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-center font-medium">
                {error}
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (editId ? 'Updating...' : 'Creating...') : (editId ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                disabled={isSubmitting}
                className="px-8 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="loader-spinner"></div>
        </div>
      ) : testimonials.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-[#022d58]/5 to-[#003c96]/5 rounded-3xl border-2 border-[#022d58]/20">
            <FileText size={48} className="text-[#022d58]/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#022d58] mb-2">No Testimonials Found</h3>
            <p className="text-gray-600">Get started by adding your first client testimonial.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(testimonials || []).map((testimonial) => (
              <div
                key={testimonial._id}
                className="bg-white card-animated-border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full group overflow-hidden"
              >
                {/* Animated border sides */}
                <div className="border-top border-side" />
                <div className="border-bottom border-side" />
                <div className="border-left border-side" />
                <div className="border-right border-side" />
                
                <div className="flex-1 flex flex-col p-6">
                  {/* Client Name and Role */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#022d58] mb-2 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors">
                      {testimonial.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{testimonial.role}</p>
                    <div className="flex gap-1">
                      {renderStars(testimonial.star)}
                    </div>
                  </div>
                  
                  {/* Testimonial Content */}
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 italic">
                      &ldquo;{testimonial.testimonial}&rdquo;
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 px-4 pb-4">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    disabled={isSubmitting || deletingTestimonial === testimonial._id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit Testimonial"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial._id!)}
                    disabled={isSubmitting || deletingTestimonial === testimonial._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                    title="Delete Testimonial"
                  >
                    {deletingTestimonial === testimonial._id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
                

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
