"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, FileText, X, CheckCircle, AlertCircle, Search, ArrowUpDown, Loader2, Eye, Share2 } from "lucide-react";
import { authenticatedFetch } from "../../../../lib/auth";
import BlogEditor from "@/app/components/BlogEditor";
import { BlogBlock, EditorInfo } from "@/app/components/BlogEditor";
import { generateUniqueSlug } from "@/lib/utils";

interface Blog {
  _id?: string;
  title: string;
  shortDescription: string;
  keywords?: string[];
  blocks?: BlogBlock[];
  editor?: EditorInfo;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

type SortOrder = 'newest' | 'oldest';

export default function BlogsAdminPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to show static content immediately
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingBlog, setDeletingBlog] = useState<string | null>(null);

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    const newNotification = { id, type, message };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/blogs?sort=${sortOrder}`);
      if (res.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error('Failed to load blogs:', error);
      if (error instanceof Error && error.message === 'Authentication token not available') {
        window.location.href = '/admin/login';
        return;
      }
      addNotification('error', 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, [sortOrder, addNotification]);

  useEffect(() => {
    // Start API call after component mounts (showing static content first)
    const timer = setTimeout(() => {
      fetchBlogs();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchBlogs]);

  async function handleSave(data: { 
    title: string; 
    shortDescription: string; 
    keywords: string[]; 
    blocks: BlogBlock[]; 
    editor?: EditorInfo; 
    slug: string 
  }) {
    setIsSubmitting(true);
    
    try {
      // Generate SEO-friendly unique slug from title
      console.log('Generating SEO-friendly slug for title:', data.title);
      
      let finalSlug;
      if (editingBlog?._id) {
        finalSlug = await generateUniqueSlug(data.title, 'blogs', editingBlog._id);
      } else {
        finalSlug = await generateUniqueSlug(data.title, 'blogs');
      }
      
      console.log('Generated SEO-friendly slug:', finalSlug);

      const blogData = {
        ...data,
        slug: finalSlug, // Use the generated slug, not the one from data
      };

      if (editingBlog?._id) {
        // Update existing blog
        const response = await authenticatedFetch(`/api/blogs/${editingBlog._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blogData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Update failed');
        }

        const responseData = await response.json();
        console.log('Blog update response data:', responseData);
        
        // If the slug changed, show notification and redirect
        if (responseData.slugChanged && responseData.slug) {
          addNotification('success', `Blog updated successfully! Slug changed from "${responseData.oldSlug}" to "${responseData.slug}". Redirecting...`);
          
          // Wait a moment for the notification to show, then redirect
          setTimeout(() => {
            window.location.href = `/blog/${responseData.slug}`;
          }, 2000);
          return;
        }

        addNotification('success', 'Blog updated successfully!');
      } else {
        // Create new blog
        const response = await authenticatedFetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blogData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Creation failed');
        }

        addNotification('success', 'Blog created successfully!');
      }
      
      setShowEditor(false);
      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      console.error('Blog operation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification('error', editingBlog ? 'Failed to update blog' : `Failed to create blog: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(blog: Blog) {
    setEditingBlog(blog);
    setShowEditor(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    setDeletingBlog(id);
    
    try {
      await authenticatedFetch(`/api/blogs/${id}`, { method: "DELETE" });
      addNotification('success', 'Blog deleted successfully!');
      fetchBlogs();
    } catch {
      addNotification('error', 'Failed to delete blog');
    } finally {
      setDeletingBlog(null);
    }
  }

  function handleCancel() {
    setShowEditor(false);
    setEditingBlog(null);
  }

  function handleView(blog: Blog) {
    if (blog.slug) {
      window.open(`/blog/${blog.slug}`, '_blank');
    }
  }

  // Filter blogs by search
  const filteredBlogs = (blogs || []).filter((b) =>
    search.trim()
      ? (b.keywords || []).some((k) =>
          k.toLowerCase().includes(search.toLowerCase())
        ) ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.shortDescription.toLowerCase().includes(search.toLowerCase())
      : true
  );

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
            {editingBlog ? 'Edit Blog' : 'Create New Blog'}
          </h1>
          <button
            onClick={handleCancel}
            className="px-6 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300"
          >
            Cancel
          </button>
        </div>

        <BlogEditor
          initialTitle={editingBlog?.title || ''}
          initialShortDescription={editingBlog?.shortDescription || ''}
          initialKeywords={editingBlog?.keywords || []}
          initialBlocks={editingBlog?.blocks || []}
          initialEditor={editingBlog?.editor}
          onSave={handleSave}
          onCancel={handleCancel}
          type="blog"
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

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

      {/* Header - Always visible */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#022d58] mb-2">
            Manage Blogs
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage your blog posts
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Blog
        </button>
      </div>

      {/* Search and Sort - Always visible */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search blogs by title, description, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-[#022d58]/20 rounded-xl bg-white/50 backdrop-blur-sm focus:border-[#022d58] focus:outline-none transition-all duration-300 text-[#022d58]"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-4 py-3 border-2 border-[#022d58]/20 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-[#022d58]/5 transition-all duration-300 text-[#022d58] font-medium"
          >
            <ArrowUpDown size={18} />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

          {/* Blogs List - Shows loading only for this area */}
    {loading ? (
      <div className="flex items-center justify-center py-12">
        <div className="loader-spinner"></div>
      </div>
    ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {search ? 'No blogs found' : 'No blogs yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search ? 'Try adjusting your search terms' : 'Create your first blog post to get started'}
          </p>
          {!search && (
            <button
              onClick={() => setShowEditor(true)}
              className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Create Your First Blog
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white card-animated-border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full group overflow-hidden"
            >
              {/* Animated border sides */}
              <div className="border-top border-side" />
              <div className="border-bottom border-side" />
              <div className="border-left border-side" />
              <div className="border-right border-side" />
              <div className="flex-1 flex flex-col p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-[#022d58] mb-2 break-words line-clamp-2 group-hover:text-[#003c96] transition-colors">
                  {blog.title}
                </h3>
                
                {/* Blog Content */}
                {blog.shortDescription && (
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {blog.shortDescription}
                  </p>
                )}
                
                {/* Keywords */}
                {blog.keywords && blog.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mb-3">
                    <span className="text-xs text-gray-500 mr-2">Keywords:</span>
                    {blog.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs break-words">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                  <span>Date: <span className="font-medium">{blog.updatedAt ? formatDate(blog.updatedAt) : formatDate(blog.createdAt)}</span></span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 px-4 pb-4">
                {blog.slug && (
                  <button
                    onClick={() => handleView(blog)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                    title="View Blog"
                  >
                    <Eye size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(blog)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Edit Blog"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(blog._id!)}
                  disabled={deletingBlog === blog._id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                  title="Delete Blog"
                >
                  {deletingBlog === blog._id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
                {/* Share button */}
                {blog.slug && (
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/blog/${blog.slug}`;
                      const shareText = `${blog.title} - Check out this article from Propelligence\n\n${shareUrl}`;
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
                      addNotification('success', 'Blog link copied to clipboard!');
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                    title="Copy Blog Link"
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
