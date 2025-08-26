import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading, Type, 
  FileText, CheckSquare, 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Loader2
} from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from 'next/image';


export type BlogBlock =
  | { type: 'heading'; content: string; level?: 1 | 2 | 3 | 4 | 5 }
  | { type: 'paragraph'; content: string }
  | { type: 'image'; src: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; content: string; author?: string }
  | { type: 'hr' }
  | { type: 'code'; content: string; language?: string }
  | { type: 'checklist'; items: { text: string; checked: boolean }[] }
  | { type: 'video'; src: string };



export interface EditorInfo {
  name: string;
  date?: Date;
  socialMedia?: {
    x?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface ApiItem {
  keywords?: string[];
  [key: string]: unknown;
}

interface BlogEditorProps {
  initialTitle?: string;
  initialShortDescription?: string;
  initialKeywords?: string[];
  initialBlocks?: BlogBlock[];
  initialEditor?: EditorInfo;
  onSave: (data: { title: string; shortDescription: string; keywords: string[]; blocks: BlogBlock[]; slug: string; editor?: EditorInfo }) => void;
  onCancel?: () => void;
  type: 'blog' | 'service';
  isSubmitting?: boolean;
}


const textFormattingOptions = [
  { type: 'bold', label: 'Bold', icon: <Bold size={18} /> },
  { type: 'italic', label: 'Italic', icon: <Italic size={18} /> },
  { type: 'underline', label: 'Underline', icon: <UnderlineIcon size={18} /> },
  { type: 'strikethrough', label: 'Strikethrough', icon: <Strikethrough size={18} /> },
  { type: 'link', label: 'Link', icon: <LinkIcon size={18} /> },

];


const ParagraphEditor = React.forwardRef<Editor | undefined, {
  content: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  className?: string;
}>(function ParagraphEditor({ content, onChange, onFocus, className }, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });
  React.useImperativeHandle(ref, () => editor ?? undefined, [editor]);
  return (
    <>
      <style>{`
        .tiptap-editor-content a {
          color: #2563eb; /* Tailwind blue-600 */
          text-decoration: underline;
        }
        /* .tiptap-editor-content mark[data-type="highlight"] {
          background-color: #fef08a; 
        } */
      `}</style>
      <EditorContent editor={editor} className={"tiptap-editor-content " + (className || "") } onFocus={onFocus} />
    </>
  );
});

export default function BlogEditor({
  initialTitle = '',
  initialShortDescription = '',
  initialKeywords = [],
  initialBlocks = [],
  initialEditor,
  onSave,
  onCancel,
  type,
  isSubmitting = false,
}: BlogEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [shortDescription, setShortDescription] = useState(initialShortDescription);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [blocks, setBlocks] = useState<BlogBlock[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedText, setSelectedText] = useState({ text: '', start: 0, end: 0, blockIndex: -1 });
  const [linkTooltip, setLinkTooltip] = useState('');
  const [activeTab, setActiveTab] = useState<'blocks' | 'formatting'>('blocks');
  
  const [editorName, setEditorName] = useState(initialEditor?.name || '');
  const [editorDate, setEditorDate] = useState(() => {
    if (initialEditor?.date) {
      // Handle both Date objects and date strings
      const date = typeof initialEditor.date === 'string' ? new Date(initialEditor.date) : initialEditor.date;
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [editorSocial, setEditorSocial] = useState({
    x: initialEditor?.socialMedia?.x || '',
    instagram: initialEditor?.socialMedia?.instagram || '',
    linkedin: initialEditor?.socialMedia?.linkedin || '',
  });
  
  // Keyword suggestions sourced from existing blogs and services
  const [allKeywordSuggestions, setAllKeywordSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  useEffect(() => {
    const loadKeywordSuggestions = async () => {
      try {
        const [blogsRes, servicesRes] = await Promise.all([
          fetch('/api/public/blogs'),
          fetch('/api/public/services')
        ]);
        const blogsData = blogsRes.ok ? await blogsRes.json() : [];
        const servicesData = servicesRes.ok ? await servicesRes.json() : [];
        const collect = (arr: ApiItem[]) => (Array.isArray(arr) ? arr.flatMap((item: ApiItem) => Array.isArray(item.keywords) ? item.keywords : []) : []);
        const combined = [...collect(blogsData as ApiItem[]), ...collect(servicesData as ApiItem[])]
          .map((k: string) => typeof k === 'string' ? k.trim() : '')
          .filter((k: string) => k.length > 0);
        const unique = Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b));
        setAllKeywordSuggestions(unique);
      } catch {
        // ignore failures
      }
    };
    loadKeywordSuggestions();
  }, []);
  const filteredSuggestions = allKeywordSuggestions
    .filter(k => !keywords.includes(k))
    .filter(k => newKeyword.trim() === '' || k.toLowerCase().includes(newKeyword.trim().toLowerCase()))
    .slice(0, 10);
  const handleAddSuggestion = (k: string) => {
    if (!k) return;
    if (!keywords.includes(k)) {
      setKeywords(prev => [...prev, k]);
    }
    setNewKeyword('');
    setShowSuggestions(false);
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paragraphEditorRefs = useRef<(Editor | undefined)[]>([]);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');


  useEffect(() => {
  }, [blocks.length]);

  function addBlock(type: string) {
    switch (type) {
      case 'heading':
        setBlocks([...blocks, { type: 'heading', content: '', level: 2 }]);
        break;
      case 'paragraph':
        setBlocks([...blocks, { type: 'paragraph', content: '' }]);
        break;
      case 'ul':
        setBlocks([...blocks, { type: 'ul', items: [''] }]);
        break;
      case 'ol':
        setBlocks([...blocks, { type: 'ol', items: [''] }]);
        break;
      case 'checklist':
        setBlocks([...blocks, { type: 'checklist', items: [{ text: '', checked: false }] }]);
        break;
      case 'image':
        if (fileInputRef.current) fileInputRef.current.click();
        break;
      case 'video':
        setShowVideoDialog(true);
        break;
      case 'hr':
        setBlocks([...blocks, { type: 'hr' }]);
        break;
    }
  }

  function handleBlockChange(idx: number, value: string | string[], extra?: unknown) {
    setBlocks(blocks =>
      blocks.map((b, i) => {
        if (i !== idx) return b;
        
        // Basic text blocks
        if (b.type === 'heading') return { ...b, content: value as string, level: extra as 1 | 2 | 3 | 4 | 5 };
        if (b.type === 'paragraph') return { ...b, content: value as string };
        if (b.type === 'ul' || b.type === 'ol') return { ...b, items: value as string[] };
        if (b.type === 'checklist') {
          if (Array.isArray(extra)) {
            return { ...b, items: extra as { text: string; checked: boolean }[] };
          } else if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
            return { ...b, items: (value as string[]).map(text => ({ text, checked: false })) };
          }
          return b;
        }
        
        // Media blocks
        if (b.type === 'image') {
          return { ...b, src: value as string };
        }
        
        // Code block
        if (b.type === 'code') return { ...b, content: value as string, language: (extra as string) || b.language };
        
        // Video block
        if (b.type === 'video') return { ...b, src: value as string };
        
        // HR block
        if (b.type === 'hr') return { type: 'hr' };
        
        return b;
      })
    );
  }

  function handleParagraphSelect(idx: number) {
    setSelectedBlock(idx);
  }

  function handleTextFormatting(formatType: string) {
    if (
      selectedBlock !== null &&
      blocks[selectedBlock]?.type === 'paragraph'
    ) {
      if (paragraphEditorRefs.current[selectedBlock]) {
        const editor = paragraphEditorRefs.current[selectedBlock];
        switch (formatType) {
          case 'bold':
            editor?.chain().focus().toggleBold().run();
            break;
          case 'italic':
            editor?.chain().focus().toggleItalic().run();
            break;
          case 'underline':
            editor?.chain().focus().toggleUnderline().run();
            break;
          case 'strikethrough':
            editor?.chain().focus().toggleStrike().run();
            break;
          // Remove highlight
          // case 'highlight':
          //   editor?.chain().focus().setHighlight({ color: 'yellow' }).run();
          //   break;
          case 'link':
            // Show the link dialog to get the URL
            setSelectedText({ text: '', start: 0, end: 0, blockIndex: selectedBlock });
            setShowLinkDialog(true);
            setLinkTooltip('');
            return;
          default:
            return;
        }
        return;
      }
    }
    setLinkTooltip('Select text in a paragraph to apply formatting');
    setTimeout(() => setLinkTooltip(''), 2000);
  }

  // Alignment functions removed


  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBlocks([...blocks, { type: 'image', src: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    if (idx + dir < 0 || idx + dir >= blocks.length) return;
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(idx, 1);
    newBlocks.splice(idx + dir, 0, removed);
    setBlocks(newBlocks);
  }

  function deleteBlock(idx: number) {
    setBlocks(blocks => blocks.filter((_, i) => i !== idx));
  }

  function handleListItemChange(idx: number, itemIdx: number, value: string) {
    setBlocks(blocks =>
      blocks.map((b, i) =>
        i === idx && (b.type === 'ul' || b.type === 'ol')
          ? { ...b, items: b.items.map((it, j) => (j === itemIdx ? value : it)) }
          : b
      )
    );
  }

  function addListItem(idx: number) {
    setBlocks(blocks =>
      blocks.map((b, i) =>
        i === idx && (b.type === 'ul' || b.type === 'ol')
          ? { ...b, items: [...b.items, ''] }
          : b
      )
    );
  }

  function removeListItem(idx: number, itemIdx: number) {
    setBlocks(blocks =>
      blocks.map((b, i) =>
        i === idx && (b.type === 'ul' || b.type === 'ol')
          ? { ...b, items: b.items.filter((_, j) => j !== itemIdx) }
          : b
      )
    );
  }

  function addKeyword() {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  }

  function removeKeyword(index: number) {
    setKeywords(keywords.filter((_, i) => i !== index));
  }

  function handleSave() {
    console.log('handleSave called');
    console.log('Title:', title);
    console.log('Short description:', shortDescription);
    console.log('Blocks:', blocks);
    console.log('Editor name:', editorName);
    
    // Simple validation test
    if (!title.trim()) {
      console.log('Title validation failed');
      alert('Title is required');
      return;
    }
    if (!shortDescription.trim()) {
      console.log('Short description validation failed');
      alert('Short description is required');
      return;
    }
    if (blocks.length === 0) {
      console.log('Blocks validation failed');
      alert('Add at least one block');
      return;
    }
    
    console.log('All validations passed!');
    
    const slug = generateSlug(title);
    
    console.log('Generated slug:', slug);
    console.log('Blocks:', blocks);
    
    const editorInfo: EditorInfo | undefined = type === 'blog' && editorName.trim() ? {
      name: editorName.trim(),
      date: new Date(editorDate),
      socialMedia: {
        x: editorSocial.x.trim() || undefined,
        instagram: editorSocial.instagram.trim() || undefined,
        linkedin: editorSocial.linkedin.trim() || undefined,
      }
    } : undefined;
    
    console.log('Editor info:', editorInfo);
    
    const saveData = { 
      title, 
      shortDescription, 
      keywords, 
      blocks: blocks, 
      editor: editorInfo,
      slug 
    };
    
    console.log('Calling onSave with data:', saveData);
    
    try {
      console.log('About to call onSave function...');
      onSave(saveData);
      console.log('onSave function called successfully');
    } catch (error) {
      console.error('Error in onSave:', error);
      alert('Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // In the link dialog, when adding a link, use the TipTap command to set the link
  function convertToLink() {
    if (selectedText.blockIndex >= 0 && linkUrl.trim()) {
      const editor = paragraphEditorRefs.current[selectedText.blockIndex];
      if (editor) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setSelectedText({ text: '', start: 0, end: 0, blockIndex: -1 });
  }

  return (
    <form 
      className="blog-editor" 
      style={{ fontFamily: 'inherit' }}
      onSubmit={(e) => {
        e.preventDefault();
        console.log('Form submitted!');
        handleSave();
      }}
    >
      <div className="mb-4">
        <input
          type="text"
          placeholder={`${type === 'blog' ? 'Blog' : 'Service'} Title`}
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-2xl font-bold p-3 border-b-2 border-[#e0e7ef] focus:border-[#022d58] outline-none mb-4 bg-transparent"
        />
        
        {/* Meta Information Section */}
        <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl p-4 mb-4 border border-green-200/60">
          <h3 className="text-lg font-semibold text-[#022d58] mb-4 flex items-center gap-2">
            <FileText size={20} />
            {type === 'blog' ? 'Blog' : 'Service'} Meta Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#022d58] mb-2">Short Description *</label>
              <textarea
                placeholder={`Enter a short description for the main landing page (max 150 characters)`}
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                maxLength={150}
                className="w-full p-3 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{shortDescription.length}/150 characters</p>
            </div>
          </div>
          
          {/* Keywords Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-[#022d58] mb-3 items-center gap-2">
              {/* Tag icon removed */}
              Keywords (for SEO and search)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 relative">
              <input
                type="text"
                placeholder="Add a keyword"
                value={newKeyword}
                onChange={e => { setNewKeyword(e.target.value); setShowSuggestions(true); }}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 p-2 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80 text-sm"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              />
              <button
                type="button"
                onClick={addKeyword}
                disabled={!newKeyword.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Add
              </button>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-56 overflow-auto">
                  <div className="text-xs text-gray-500 px-1 pb-1">Suggestions</div>
                  <div className="flex flex-wrap gap-2">
                    {filteredSuggestions.map(k => (
                      <button
                        key={k}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddSuggestion(k)}
                        className="px-2 py-1 text-xs rounded-full border border-gray-200 hover:border-[#022d58] hover:bg-gray-50 text-[#022d58]"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor Information Section - Only for blogs */}
        {type === 'blog' && (
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl p-4 mb-4 border border-blue-200/60">
            <h3 className="text-lg font-semibold text-[#022d58] mb-4 flex items-center gap-2">
              {/* User icon removed */}
              Editor Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#022d58] mb-2">Editor Name *</label>
                <input
                  type="text"
                  placeholder="Enter editor name"
                  value={editorName}
                  onChange={e => setEditorName(e.target.value)}
                  className="w-full p-3 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#022d58] mb-2 items-center gap-2">
                  {/* Calendar icon removed */}
                  Publication Date
                </label>
                <input
                  type="date"
                  value={editorDate}
                  onChange={e => setEditorDate(e.target.value)}
                  className="w-full p-3 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80"
                />
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#022d58] mb-3">Social Media Links</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#022d58] mb-1 items-center gap-1">
                    {/* Twitter icon removed */}
                    X (Twitter)
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/username"
                    value={editorSocial.x}
                    onChange={e => setEditorSocial(prev => ({ ...prev, x: e.target.value }))}
                    className="w-full p-2 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#022d58] mb-1 items-center gap-1">
                    {/* Instagram icon removed */}
                    Instagram
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/username"
                    value={editorSocial.instagram}
                    onChange={e => setEditorSocial(prev => ({ ...prev, instagram: e.target.value }))}
                    className="w-full p-2 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#022d58] mb-1 items-center gap-1">
                    {/* LinkedIn icon removed */}
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={editorSocial.linkedin}
                    onChange={e => setEditorSocial(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full p-2 border border-[#e0e7ef] rounded-lg focus:border-[#022d58] outline-none bg-white/80 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="toolbar mb-4 bg-[#f8fafc] rounded-xl border border-[#e0e7ef] shadow-sm">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#e0e7ef]">
            <button
              type="button"
              onClick={() => setActiveTab('blocks')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'blocks'
                  ? 'text-[#022d58] border-b-2 border-[#022d58] bg-white'
                  : 'text-gray-600 hover:text-[#022d58] hover:bg-gray-50'
              }`}
            >
              Block Elements
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formatting')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'formatting'
                  ? 'text-[#022d58] border-b-2 border-[#022d58] bg-white'
                  : 'text-gray-600 hover:text-[#022d58] hover:bg-gray-50'
              }`}
            >
              Text Formatting
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-3">
            {activeTab === 'blocks' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Heading"
                >
                  <Heading size={18} />
                  <span className="hidden sm:inline">Heading</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Paragraph"
                >
                  <Type size={18} />
                  <span className="hidden sm:inline">Paragraph</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('ul')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Bullet List"
                >
                  <List size={18} />
                  <span className="hidden sm:inline">Bullet List</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('ol')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Numbered List"
                >
                  <ListOrdered size={18} />
                  <span className="hidden sm:inline">Numbered List</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('checklist')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Checklist"
                >
                  <CheckSquare size={18} />
                  <span className="hidden sm:inline">Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Image"
                >
                  <ImageIcon size={18} />
                  <span className="hidden sm:inline">Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('video')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="YouTube Video"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="m10 9 5 3-5 3V9z"/></svg>
                  <span className="hidden sm:inline">YouTube Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('hr')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base"
                  title="Horizontal Rule"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><line x1="5" x2="19" y1="12" y2="12"/></svg>
                  <span className="hidden sm:inline">Horizontal Rule</span>
                </button>
              </div>
            )}
            
            {activeTab === 'formatting' && (
              <div className="space-y-4">
                {/* Text Formatting Options */}
                <div>
                  <div className="flex flex-wrap gap-2">
                    {textFormattingOptions.map(option => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => handleTextFormatting(option.type)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-[#e0e7ef] text-[#022d58] font-medium transition text-sm md:text-base relative"
                        title={option.label}
                      >
                        {option.icon}
                        <span className="hidden sm:inline">{option.label}</span>
                        {linkTooltip && option.type === 'link' && (
                          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-black text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">{linkTooltip}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Alignment sections removed */}
              </div>
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>
      </div>
      <div
        className="workspace relative space-y-10 border border-[#e0e7ef] rounded-3xl p-4 sm:p-8 min-h-[300px] shadow-2xl transition-all overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #f6f8fa 0%, #e0e7ef 100%)',
          boxShadow: '0 8px 40px 0 rgba(34, 60, 80, 0.12), 0 0 0 2px #e0e7ef',
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          maxHeight: '70vh',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'relative',
        }}
      >
        {blocks.map((block, idx) => (
          <div
            key={idx}
            className="relative group transition-all flex flex-col gap-2 mb-2 w-full"
            style={{
              zIndex: selectedBlock === idx ? 10 : 1,
            }}
            onClick={() => setSelectedBlock(idx)}
            tabIndex={0}
          >
            {/* Clear float code removed */}
            {/* Vertical colored bar for selected cell */}
            <div
              className={`absolute left-0 top-0 h-full w-1 rounded-l-xl transition-all ${selectedBlock === idx ? 'bg-blue-500' : 'bg-transparent'}`}
              style={{ boxShadow: selectedBlock === idx ? '0 0 8px #3b82f6' : 'none' }}
            />
            {/* Cell container */}
            <div
              className={`relative bg-white/70 border border-[#e0e7ef] rounded-2xl px-3 py-4 sm:px-6 sm:py-5 shadow-lg transition-all ${selectedBlock === idx ? 'ring-2 ring-blue-400 scale-[1.01] backdrop-blur-md' : 'hover:ring-1 hover:ring-blue-200 hover:scale-[1.01] backdrop-blur-sm'} flex flex-col gap-2`}
              style={{
                marginLeft: 12,
                boxShadow: selectedBlock === idx ? '0 8px 32px 0 rgba(59, 130, 246, 0.13)' : '0 2px 12px 0 rgba(34, 60, 80, 0.07)',
                minHeight: 60,
                fontSize: '1.08rem',
              }}
            >
              {/* Block Controls on the right */}
              <div
                className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all`}
                style={{ pointerEvents: 'auto' }}
              >
                <button type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="bg-white/80 border border-gray-200 rounded-full p-2 shadow hover:bg-blue-50 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Move up">↑</button>
                <button type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} className="bg-white/80 border border-gray-200 rounded-full p-2 shadow hover:bg-blue-50 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Move down">↓</button>
                <button type="button" onClick={() => deleteBlock(idx)} className="bg-white/80 border border-gray-200 rounded-full p-2 shadow hover:bg-red-50 text-red-600 transition-all" title="Delete">✕</button>
              </div>
              {/* Block Content */}
              {block.type === 'heading' && (
                <div className="flex items-center gap-2">
                  <select
                    value={block.level || 2}
                    onChange={e => handleBlockChange(idx, block.content, parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="border rounded p-1 text-sm"
                  >
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                    <option value={4}>H4</option>
                    <option value={5}>H5</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Heading text"
                    value={block.content}
                    onChange={e => handleBlockChange(idx, e.target.value, block.level)}
                    className={`flex-1 font-bold p-1 border-b focus:border-blue-400 outline-none ${
                      block.level === 1 ? 'text-3xl' : 
                      block.level === 2 ? 'text-2xl' : 
                      block.level === 3 ? 'text-xl' :
                      block.level === 4 ? 'text-lg' :
                      'text-base'
                    }`}
                  />
                </div>
              )}
              {block.type === 'paragraph' && (
                <ParagraphEditor
                  key={idx}
                  content={block.content}
                  onChange={(html: string) => handleBlockChange(idx, html)}
                  onFocus={() => handleParagraphSelect(idx)}
                  className="w-full p-2 border-b focus:border-blue-400 outline-none min-h-[40px] bg-white"
                  ref={el => { paragraphEditorRefs.current[idx] = el ?? undefined; }}
                />
              )}
              {block.type === 'image' && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-center w-full">
                    <Image
                      src={block.src}
                      alt=""
                      width={800}
                      height={480}
                      style={{ width: '100%', height: 'auto', maxWidth: '100%', maxHeight: '240px', borderRadius: '0.5rem', border: '1px solid #e0e7ef', objectFit: 'contain', background: '#ffffff' }}
                      unoptimized
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
              {(block.type === 'ul' || block.type === 'ol') && (
                <div>
                  <div className="flex flex-col gap-1">
                    {block.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2 mb-1">
                        {block.type === 'ul' ? <span>•</span> : <span>{itemIdx + 1}.</span>}
                        <input
                          type="text"
                          value={item}
                          onChange={e => handleListItemChange(idx, itemIdx, e.target.value)}
                          className="flex-1 p-1 border-b focus:border-blue-400 outline-none"
                          placeholder="List item"
                        />
                        <button type="button" onClick={() => removeListItem(idx, itemIdx)} className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addListItem(idx)} className="mt-1 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center gap-1"><Plus size={14} /> Add Item</button>
                </div>
              )}
              {block.type === 'blockquote' && (
                <textarea
                  placeholder="Quote text"
                  value={block.content}
                  onChange={e => handleBlockChange(idx, e.target.value)}
                  className="w-full italic border-l-4 border-blue-300 p-2 bg-blue-50 min-h-[40px]"
                />
              )}
              {block.type === 'hr' && (
                <div className="flex items-center justify-center py-4">
                  <hr className="w-full border-t-2 border-gray-300" />
                </div>
              )}
              
              {/* New block type renderers */}
              {block.type === 'code' && (
                <div className="flex flex-col gap-2 w-full">
                  <select
                    value={block.language || 'javascript'}
                    onChange={e => handleBlockChange(idx, block.content, e.target.value)}
                    className="border rounded p-1 text-sm w-32"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="sql">SQL</option>
                    <option value="bash">Bash</option>
                  </select>
                  <textarea
                    placeholder="Code content"
                    value={block.content}
                    onChange={e => handleBlockChange(idx, e.target.value, block.language)}
                    className="w-full p-2 border focus:border-blue-400 outline-none min-h-[100px] font-mono text-sm bg-gray-50 resize-x"
                    style={{ width: '100%', maxWidth: '100%' }}
                  />
                </div>
              )}
              
              {block.type === 'checklist' && (
                <div className="flex flex-col gap-2">
                  {block.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={e => {
                          const newItems = [...block.items];
                          newItems[itemIdx] = { ...item, checked: e.target.checked };
                          handleBlockChange(idx, '', newItems);
                        }}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={e => {
                          const newItems = [...block.items];
                          newItems[itemIdx] = { ...item, text: e.target.value };
                          handleBlockChange(idx, '', newItems);
                        }}
                        className="flex-1 p-1 border-b focus:border-blue-400 outline-none"
                        placeholder="Checklist item"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = block.items.filter((_, i) => i !== itemIdx);
                          handleBlockChange(idx, '', newItems);
                        }}
                        className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = [...block.items, { text: '', checked: false }];
                      handleBlockChange(idx, '', newItems);
                    }}
                    className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center gap-1 w-fit"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
              )}
              {block.type === 'video' && (
                <div className="flex flex-col gap-2 w-full">
                  <input
                    type="text"
                    value={block.src}
                    onChange={e => handleBlockChange(idx, e.target.value)}
                    className="w-full p-1 border-b focus:border-blue-400 outline-none"
                    placeholder="YouTube video URL"
                  />
                  <div className="aspect-video bg-black rounded-xl flex items-center justify-center w-full max-w-full">
                    {(() => {
                      const match = block.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                      const videoId = match ? match[1] : null;
                      return videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video preview"
                          className="w-full h-full rounded-xl"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ width: '100%', height: '100%', minHeight: 180 }}
                        />
                      ) : (
                        <span className="text-white text-sm">Paste a valid YouTube URL to preview</span>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="text-gray-400 text-center py-16 sm:py-24 text-lg sm:text-xl tracking-wide select-none">
            Add blocks to start writing your {type}...
          </div>
        )}

        {/* Link Dialog */}
        {showLinkDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Link</h3>
              <p className="text-sm text-gray-600 mb-2">Selected text: &quot;{selectedText.text}&quot;</p>
              <input
                type="text"
                placeholder="Enter URL (https://...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-400 outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={convertToLink}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                >
                  Add Link
                </button>
                <button
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl('');
                    setSelectedText({ text: '', start: 0, end: 0, blockIndex: -1 });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showVideoDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add YouTube Video</h3>
              <input
                type="text"
                placeholder="Paste YouTube video URL"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-400 outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (videoUrl.trim()) {
                      setBlocks([...blocks, { type: 'video', src: videoUrl.trim() }]);
                      setShowVideoDialog(false);
                      setVideoUrl('');
                    }
                  }}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                >
                  Add Video
                </button>
                <button
                  onClick={() => {
                    setShowVideoDialog(false);
                    setVideoUrl('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          className="bg-gradient-to-r from-[#022d58] to-[#003c96] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="animate-spin" size={20} />}
          Save {type === 'blog' ? 'Blog' : 'Service'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="px-8 py-3 border-2 border-[#022d58]/20 text-[#022d58] rounded-xl font-semibold hover:bg-[#022d58]/5 transition-all duration-300 w-full sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
} 