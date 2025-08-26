"use client";

import * as React from "react";
import { useState } from "react";
import {
  CheckCircle,
  BookOpen,
  Share2,
  User,
  Calendar as CalendarIcon,
  Loader2,
  Play,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import Image from 'next/image';

export type BlogBlock =
  | { type: "heading"; content: string; level?: 1 | 2 | 3 | 4 | 5 }
  | { type: "paragraph"; content: string }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "hr" }
  | { type: "video"; src: string }
  | { type: "checklist"; items: { text: string; checked: boolean }[] }

interface Blog {
  _id?: string;
  slug: string;
  title: string;
  shortDescription?: string;
  keywords?: string[];
  editor?: {
    name?: string;
    date?: string | Date;
    avatar?: string;
    socialMedia?: {
      x?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  similarityScore?: number;
  // Add other fields as needed
}

interface Service {
  _id?: string;
  slug: string;
  title: string;
  shortDescription?: string;
  keywords?: string[];
  similarityScore?: number;
  // Add other fields as needed
}

interface BlogRendererProps {
  blocks: BlogBlock[];
  title: string;
  shortDescription?: string;
  keywords?: string[];
  editor?: {
    name?: string;
    date?: string | Date;
    avatar?: string;
    socialMedia?: {
      x?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  type?: "blog" | "service";
  slug?: string;
}

export default function BlogRenderer({
  blocks,
  title,
  keywords = [],
  editor,
  type = "blog",
  slug,
}: BlogRendererProps) {
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(false);

  // Load related content
  React.useEffect(() => {
    const loadRelatedContent = async () => {
      if (!slug || !type) return;

      setLoadingRelated(true);
      try {
        // Load services based on keywords matching
        const servicesRes = await fetch("/api/public/services");
        const servicesData = await servicesRes.json();
        
        if (keywords && keywords.length > 0) {
          // Score services based on keyword similarity count
          const scoredServices = servicesData
            .filter((service: Service) => service.slug !== slug) // Exclude current service
            .map((service: Service) => {
              if (!service.keywords || service.keywords.length === 0) {
                return { ...service, similarityScore: 0 };
              }
              
              // Count how many keywords match
              let similarityScore = 0;
              const currentKeywords = keywords.map(k => k.toLowerCase());
              const serviceKeywords = service.keywords.map(k => k.toLowerCase());
              
              // Check for exact matches and partial matches
              currentKeywords.forEach(currentKeyword => {
                serviceKeywords.forEach(serviceKeyword => {
                  // Exact match gets highest score
                  if (currentKeyword === serviceKeyword) {
                    similarityScore += 5; // Increased weight for exact matches
                  }
                  // Partial match (one contains the other) gets medium score
                  else if (currentKeyword.includes(serviceKeyword) || serviceKeyword.includes(currentKeyword)) {
                    similarityScore += 2;
                  }
                  // Word similarity (shared words) gets lower score
                  else {
                    const currentWords = currentKeyword.split(/\s+/);
                    const serviceWords = serviceKeyword.split(/\s+/);
                    const commonWords = currentWords.filter(word => 
                      serviceWords.some(sw => sw.includes(word) || word.includes(sw))
                    );
                    similarityScore += commonWords.length * 0.5;
                  }
                });
              });
              
              // Bonus for having more matching keywords (quality over quantity)
              const matchingKeywords = currentKeywords.filter(currentKeyword =>
                serviceKeywords.some(serviceKeyword =>
                  currentKeyword === serviceKeyword ||
                  currentKeyword.includes(serviceKeyword) ||
                  serviceKeyword.includes(currentKeyword)
                )
              );
              
              // Add bonus score for percentage of keywords that match
              const matchPercentage = matchingKeywords.length / currentKeywords.length;
              similarityScore += matchPercentage * 3;
              
              return { ...service, similarityScore };
            })
            .filter((service: Service) => (service.similarityScore || 0) >= 2) // Higher threshold - only show items with meaningful similarity
            .sort((a: Service, b: Service) => (b.similarityScore || 0) - (a.similarityScore || 0)) // Sort by score descending
            .slice(0, 5); // Get top 5
          
          setRelatedServices(scoredServices);
        } else {
          // If no keywords, show recent services except current one
          const filteredServices = servicesData.filter(
            (service: Service) => service.slug !== slug
          );
          setRelatedServices(filteredServices.slice(0, 5));
        }

        // Load related blogs based on keywords
        if (keywords && keywords.length > 0) {
          const blogsRes = await fetch("/api/public/blogs");
          const blogsData = await blogsRes.json();

          // Score blogs based on keyword similarity count
          const scoredBlogs = blogsData
            .filter((blog: Blog) => blog.slug !== slug) // Exclude current blog
            .map((blog: Blog) => {
              if (!blog.keywords || blog.keywords.length === 0) {
                return { ...blog, similarityScore: 0 };
              }
              
              // Count how many keywords match
              let similarityScore = 0;
              const currentKeywords = keywords.map(k => k.toLowerCase());
              const blogKeywords = blog.keywords.map(k => k.toLowerCase());
              
              // Check for exact matches and partial matches
              currentKeywords.forEach(currentKeyword => {
                blogKeywords.forEach(blogKeyword => {
                  // Exact match gets highest score
                  if (currentKeyword === blogKeyword) {
                    similarityScore += 5; // Increased weight for exact matches
                  }
                  // Partial match (one contains the other) gets medium score
                  else if (currentKeyword.includes(blogKeyword) || blogKeyword.includes(currentKeyword)) {
                    similarityScore += 2;
                  }
                  // Word similarity (shared words) gets lower score
                  else {
                    const currentWords = currentKeyword.split(/\s+/);
                    const blogWords = blogKeyword.split(/\s+/);
                    const commonWords = currentWords.filter(word => 
                      blogWords.some(bw => bw.includes(word) || word.includes(bw))
                    );
                    similarityScore += commonWords.length * 0.5;
                  }
                });
              });
              
              // Bonus for having more matching keywords (quality over quantity)
              const matchingKeywords = currentKeywords.filter(currentKeyword =>
                blogKeywords.some(blogKeyword =>
                  currentKeyword === blogKeyword ||
                  currentKeyword.includes(blogKeyword) ||
                  blogKeyword.includes(currentKeyword)
                )
              );
              
              // Add bonus score for percentage of keywords that match
              const matchPercentage = matchingKeywords.length / currentKeywords.length;
              similarityScore += matchPercentage * 3;
              
              return { ...blog, similarityScore };
            })
            .filter((blog: Blog) => (blog.similarityScore || 0) >= 2) // Higher threshold - only show items with meaningful similarity
            .sort((a: Blog, b: Blog) => (b.similarityScore || 0) - (a.similarityScore || 0)) // Sort by score descending
            .slice(0, 5); // Get top 5

          setRelatedBlogs(scoredBlogs);
        } else {
          // If no keywords, show recent blogs excluding current blog
          const blogsRes = await fetch("/api/public/blogs");
          const blogsData = await blogsRes.json();
          const filteredBlogs = blogsData.filter((blog: Blog) => blog.slug !== slug);
          setRelatedBlogs(filteredBlogs.slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading related content:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    loadRelatedContent();
    }, [slug, type, keywords]);

  const handleShare = async () => {
    if (!slug || !type) return;

    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/${type === "blog" ? "blog" : "service"}/${slug}`;
      const shareText = `${title} - Check out this ${type === "blog" ? "article" : "service"} from Propelligence`;
      const textToCopy = `${shareText}\n\n${shareUrl}`;

      if (navigator.clipboard && window.isSecureContext) {
        // Modern API, only works on HTTPS or localhost
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for insecure context or unsupported browsers
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
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

      // Show success state
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000); // Reset after 3 seconds
    } catch (error) {
      console.error("Error handling share:", error);
    }
  };

 

  const renderBlock = (block: BlogBlock, index: number) => {
    switch (block.type) {
      case "heading":
        const safeLevel = [1, 2, 3, 4, 5, 6].includes(block.level as number)
          ? String(block.level)
          : "2";
        const HeadingTag = `h${safeLevel}`;
        return React.createElement(
          HeadingTag,
          {
            key: index,
            className: `font-bold text-[#022d58] mb-4 sm:mb-6 text-justify ${
              safeLevel === "1"
                ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                : safeLevel === "2"
                ? "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                : safeLevel === "3"
                ? "text-lg sm:text-xl md:text-2xl lg:text-3xl"
                : safeLevel === "4"
                ? "text-base sm:text-lg md:text-xl lg:text-2xl"
                : "text-sm sm:text-base md:text-lg lg:text-xl"
            } leading-tight`,
          },
          block.content
        );

      case "paragraph":
        return (
          <div key={index} className="mb-4 sm:mb-6">
            <span
              className="text-gray-700 leading-relaxed text-base sm:text-lg text-justify"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(block.content) }}
            />
          </div>
        );

      case "image":
        return (
          <div key={index} className="my-8 sm:my-12">
            <Image
              src={block.src}
              alt=""
              width={800}
              height={480}
              style={{ width: '100%', height: 'auto', maxWidth: '100%', borderRadius: '0.5rem', border: '1px solid #022d58', objectFit: 'contain', background: '#ffffff' }}
              unoptimized
            />
            {block.caption && (
              <p className="text-sm text-gray-500 text-center mt-4 italic">
                {block.caption}
              </p>
            )}
          </div>
        );

      case "ul":
        return (
          <ul
            key={index}
            className="list-disc list-inside space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-gray-700 text-base sm:text-lg"
          >
            {block.items.map((item, i) => (
              <li
                key={i}
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(item) }}
              />
            ))}
          </ul>
        );

      case "ol":
        return (
          <ol
            key={index}
            className="list-decimal list-inside space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-gray-700 text-base sm:text-lg"
          >
            {block.items.map((item, i) => (
              <li
                key={i}
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(item) }}
              />
            ))}
          </ol>
        );

      case "checklist":
        return (
          <div key={index} className="space-y-4 mb-8">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    item.checked
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {item.checked && <CheckCircle size={16} />}
                </div>
                <span
                  className={`text-gray-700 text-lg leading-relaxed ${
                    item.checked ? "line-through text-gray-500" : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(item.text) }}
                />
              </div>
            ))}
          </div>
        );

      case "video":
        const getYouTubeVideoId = (url: string) => {
          const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
            /youtu\.be\/([^&\n?#]+)/,
          ];

          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
          }
          return null;
        };

        const videoId = getYouTubeVideoId(block.src);

        return (
          <div key={index} className="my-6">
            {videoId ? (
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={"YouTube video"}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-gray-900 aspect-video rounded-xl flex items-center justify-center">
                <div className="text-center text-white text-lg">
                  <Play size={56} className="mx-auto mb-3" />
                  <p className="text-lg font-semibold">Video</p>
                  <p className="text-sm text-gray-400">Invalid video URL</p>
                  <a
                    href={block.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
                  >
                    Open Video
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      case "hr":
        return <hr key={index} className="my-12 border-black" />;

      default:
        return null;
    }
  };

  const parseMarkdown = (text: string) => {
    if (!text) return "";
    let formattedText = text;

    // Handle markdown formatting first
    // Bold: **text** or __text__
    formattedText = formattedText.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );
    formattedText = formattedText.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

    // Underline: ~~text~~
    formattedText = formattedText.replace(/~~(.*?)~~/g, "<u>$1</u>");

    // Strikethrough: ~~text~~
    formattedText = formattedText.replace(/~~(.*?)~~/g, "<del>$1</del>");

    // Superscript: ^text^
    formattedText = formattedText.replace(/\^(.*?)\^/g, "<sup>$1</sup>");

    // Subscript: ~text~
    formattedText = formattedText.replace(/~(.*?)~/g, "<sub>$1</sub>");

    // Highlight: ==text==
    formattedText = formattedText.replace(
      /==(.*?)==/g,
      '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
    );

    // Handle markdown links: [text](url)
    formattedText = formattedText.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      function (match, text, url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline transition-colors">${text}</a>`;
      }
    );

    // Handle plain URLs (not already inside an anchor tag)
    // This regex avoids replacing URLs that are already inside <a href="...">...</a>
    formattedText = formattedText.replace(
      /(^|\s)(https?:\/\/[^\s<]+)(?![^<]*?>)/g,
      function (match, space, url) {
        return `${space}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline transition-colors">${url}</a>`;
      }
    );

    // Ensure all <a> tags have the correct classes and attributes
    formattedText = formattedText.replace(
      /<a\s+([^>]*href=["'][^"']+["'][^>]*)>/g,
      function (match, attrs) {
        // If class or rel or target already present, don't duplicate
        let newAttrs = attrs;
        if (!/class=/.test(newAttrs)) {
          newAttrs +=
            ' class="text-blue-600 hover:text-blue-800 underline transition-colors"';
        }
        if (!/target=/.test(newAttrs)) {
          newAttrs += ' target="_blank"';
        }
        if (!/rel=/.test(newAttrs)) {
          newAttrs += ' rel="noopener noreferrer"';
        }
        return `<a ${newAttrs}>`;
      }
    );

    return formattedText;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-24 sm:pt-24 pb-8 sm:pb-12">
        {/* Add extra padding for better spacing */}
        <div className="h-8 sm:h-6 lg:h-8"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <article className="xl:col-span-3 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
              {/* Hero Section */}
              {title && (
                <div className="mb-4 sm:mb-6 text-center">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#022d58] mb-3 sm:mb-4 leading-tight">
                    {title}
                  </h1>
                  
                  {(type as "blog" | "service") === "blog" ? (
                    /* Blog Layout */
                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      {/* Editorial Information */}
                      <div className="space-y-2 sm:space-y-3">
                        {/* Name and Date on one line */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base text-gray-600">
                          {editor && (
                            <div className="flex items-center gap-2">
                              <User size={16} />
                              <span className="font-medium">{editor.name}</span>
                            </div>
                          )}
                          {editor?.date && (
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={16} />
                              <span>
                                {new Date(editor.date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  timeZone: "UTC",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Social Media Links on next line */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 text-sm">
                          {editor?.socialMedia?.linkedin && (
                            <a 
                              href={editor.socialMedia.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                            >
                              <Linkedin size={18} />
                            </a>
                          )}
                          {editor?.socialMedia?.x && (
                            <a 
                              href={editor.socialMedia.x} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-600 transition-colors font-medium"
                            >
                              <Twitter size={18} />
                            </a>
                          )}
                          {editor?.socialMedia?.instagram && (
                            <a 
                              href={editor.socialMedia.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-pink-600 hover:text-pink-800 transition-colors font-medium"
                            >
                              <Instagram size={18} />
                            </a>
                          )}
                        </div>

                        {/* Share Button on next line */}
                        <div className="flex justify-center">
                          <button
                            onClick={handleShare}
                            className="flex items-center gap-2 text-[#022d58] hover:text-[#003c96] transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                            title="Share this page"
                          >
                            <Share2 size={18} />
                            <span className="text-sm">Share</span>
                            {shareCopied && (
                              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                <CheckCircle size={14} />
                                Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Horizontal Line */}
                      <div className="border-t border-gray-200"></div>
                    </div>
                  ) : (
                    /* Service Layout - Keep existing structure */
                    <>
                      {/* Share Button */}
                      <div className="flex justify-center mb-4 sm:mb-6">
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-2 text-[#022d58] hover:text-[#003c96] transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                          title="Share this page"
                        >
                          <Share2 size={18} />
                          <span className="text-sm">Share</span>
                          {shareCopied && (
                            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                              <CheckCircle size={14} />
                              Copied!
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 border-t border-gray-200 pt-3 sm:pt-4">
                        {type === "blog" && (
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            <span>Blog Post</span>
                          </div>
                        )}

                        {editor && (
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>By {editor.name}</span>
                          </div>
                        )}
                        {editor?.date && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={16} />
                            <span>
                              {new Date(editor.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: "UTC",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none -mb-4 sm:-mb-6">
                {blocks.map((block, index) => renderBlock(block, index))}
              </div>

              {/* Footer section removed */}
            </article>

            {/* Sidebar for Related Content */}
            <aside className="xl:col-span-1 space-y-4 sm:space-y-6">
              {/* Related Blog Posts - Show first for services */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-[#022d58] mb-3 sm:mb-4">
                  {type && type === "service" ? "Related Work" : "Our Other Work"}
                </h3>
                {loadingRelated ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2
                      className="animate-spin text-[#022d58]"
                      size={24}
                    />
                  </div>
                ) : relatedBlogs.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {relatedBlogs.map((blog, index) => (
                      <a
                        key={blog._id || index}
                        href={`/blog/${blog.slug}`}
                        className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <h4 className="font-semibold text-[#022d58] mb-1 sm:mb-2 text-sm sm:text-base">
                          {blog.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {blog.shortDescription}
                        </p>
                        {blog.editor?.date && (
                          <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                            {new Date(blog.editor.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "UTC",
                              }
                            )}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>
                      {type && type === "service" ? "No related work found" : "No articles available"}
                    </p>
                  </div>
                )}
              </div>

              {/* Services Used in Blog - Show second for services */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-[#022d58] mb-3 sm:mb-4">
                  {type === "blog" && keywords && keywords.length > 0
                    ? "Services Used in Blog"
                    : "Other Services"}
                </h3>
                {loadingRelated ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2
                      className="animate-spin text-[#022d58]"
                      size={24}
                    />
                  </div>
                ) : relatedServices.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {relatedServices.map((service, index) => (
                      <a
                        key={service._id || index}
                        href={`/service/${service.slug}`}
                        className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <h4 className="font-semibold text-[#022d58] mb-1 sm:mb-2 text-sm sm:text-base">
                          {service.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {service.shortDescription}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>
                      {type === "blog" && keywords && keywords.length > 0
                        ? "No related services found"
                        : "No other services available"}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
