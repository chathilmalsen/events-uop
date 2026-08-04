import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Trophy,
  Music,
  Laptop,
  Flame,
  Megaphone,
  PartyPopper,
  Heart,
  Microscope,
  Sprout,
  Handshake,
  Briefcase,
  Bus,
  Theater,
  Award,
  Brain,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Bookmark,
  Share2,
  CalendarPlus,
  Filter,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  ThumbsUp,
  User,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Pin,
  QrCode,
  Send,
  ExternalLink,
  Users,
  CheckCircle,
  AlertCircle,
  Copy,
  ChevronDown
} from 'lucide-react';

// ==========================================
// 1. TYPES & DATA STRUCTURES
// ==========================================

export type CategoryKey = 
  | 'Academic' | 'Sports' | 'Musical' | 'Workshop' | 'Competition' 
  | 'Notice' | 'Social' | 'Charity' | 'Research' | 'Environmental' 
  | 'Volunteer' | 'Career Fair' | 'Industrial Visit' | 'Cultural' 
  | 'Awards' | 'Seminar' | 'Exam & Academic';

export interface EventComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  replies?: EventComment[];
  isOrganizer?: boolean;
}

export interface UniversityEvent {
  id: string;
  title: string;
  category: CategoryKey;
  faculty: string;
  department: string;
  poster: string;
  organizer: string;
  organizerContact: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  isOnline: boolean;
  shortDescription: string;
  detailedDescription: string;
  views: number;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  isApproved: boolean;
  isRegistrationAvailable: boolean;
  isFree: boolean;
  price?: string;
  gallery: string[];
  speakers: string[];
  tags: string[];
  comments: EventComment[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

// ==========================================
// 2. CATEGORY CONFIGURATION (Section 15)
// ==========================================

export const CATEGORY_CONFIG: Record<CategoryKey, { icon: React.ElementType; color: string; bg: string }> = {
  'Academic': { icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  'Sports': { icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Musical': { icon: Music, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  'Workshop': { icon: Laptop, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  'Competition': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  'Notice': { icon: Megaphone, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  'Social': { icon: PartyPopper, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/30' },
  'Charity': { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30' },
  'Research': { icon: Microscope, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  'Environmental': { icon: Sprout, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
  'Volunteer': { icon: Handshake, color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/30' },
  'Career Fair': { icon: Briefcase, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/30' },
  'Industrial Visit': { icon: Bus, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  'Cultural': { icon: Theater, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/30' },
  'Awards': { icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  'Seminar': { icon: Brain, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30' },
  'Exam & Academic': { icon: BookOpen, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
};

// ==========================================
// MOCK DATA
// ==========================================

const SAMPLE_EVENTS: UniversityEvent[] = [
  {
    id: 'evt-1',
    title: 'Annual AI & Quantum Computing Symposium 2026',
    category: 'Academic',
    faculty: 'Faculty of Engineering',
    department: 'Computer Science & Software Engineering',
    poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    organizer: 'IEEE Student Branch',
    organizerContact: 'ieee@university.edu',
    date: '2026-08-15',
    time: '09:00 AM - 04:30 PM',
    venue: 'Grand Auditorium, Main Campus',
    isOnline: false,
    shortDescription: 'Join industry pioneers and researchers as we explore cutting-edge quantum algorithms and deep neural networks.',
    detailedDescription: 'The Annual AI & Quantum Computing Symposium brings together lead researchers from academics and top technology companies. Topics include Large Multimodal Models, Quantum Error Correction, and AI Ethics.',
    views: 1420,
    likes: 389,
    isLiked: false,
    isBookmarked: true,
    isTrending: true,
    isFeatured: true,
    isApproved: true,
    isRegistrationAvailable: true,
    isFree: true,
    gallery: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80'
    ],
    speakers: ['Dr. Aris Thorne (MIT)', 'Prof. Ellen Zhang (Google AI)'],
    tags: ['AI', 'Quantum', 'Tech', 'Research'],
    comments: [
      {
        id: 'c1',
        author: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        text: 'Will certificates be provided for attendees?',
        timestamp: '2 hours ago',
        likes: 4,
        replies: [
          {
            id: 'c1-r1',
            author: 'IEEE Student Branch',
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
            text: 'Yes! E-certificates of participation will be issued to registered attendees.',
            timestamp: '1 hour ago',
            likes: 8,
            isOrganizer: true
          }
        ]
      }
    ]
  },
  {
    id: 'evt-2',
    title: 'Inter-Faculty Battle of the Bands & Music Fest',
    category: 'Musical',
    faculty: 'Faculty of Arts & Humanities',
    department: 'Performing Arts',
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    organizer: 'University Music Society',
    organizerContact: 'music.soc@university.edu',
    date: '2026-08-20',
    time: '06:00 PM - 11:00 PM',
    venue: 'Open Air Amphitheater',
    isOnline: false,
    shortDescription: 'Witness 12 student bands compete for the coveted trophy along with special guest guest performances!',
    detailedDescription: 'Get ready for an explosive night of rock, indie, jazz, and pop! Food stalls, merchandise booths, and light shows will be set up around the arena floor.',
    views: 2980,
    likes: 812,
    isLiked: true,
    isBookmarked: false,
    isTrending: true,
    isFeatured: false,
    isApproved: true,
    isRegistrationAvailable: true,
    isFree: false,
    price: '$5 USD',
    gallery: [
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80'
    ],
    speakers: ['Guest Judge: Sarah Vance'],
    tags: ['Music', 'Concert', 'Student Life', 'Entertainment'],
    comments: []
  },
  {
    id: 'evt-3',
    title: 'Career Connect Expo 2026: Tech & Business',
    category: 'Career Fair',
    faculty: 'School of Business',
    department: 'Career Guidance Unit',
    poster: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    organizer: 'Career Services Center',
    organizerContact: 'careers@university.edu',
    date: '2026-08-25',
    time: '10:00 AM - 03:30 PM',
    venue: 'Student Activity Complex',
    isOnline: false,
    shortDescription: 'Meet over 50 top national and international recruiters hiring for internships and full-time roles.',
    detailedDescription: 'Bring printed resumes and dress in formal attire. On-site interviews and instant CV reviews available at booth 12.',
    views: 890,
    likes: 240,
    isLiked: false,
    isBookmarked: true,
    isTrending: false,
    isFeatured: true,
    isApproved: true,
    isRegistrationAvailable: true,
    isFree: true,
    gallery: [],
    speakers: [],
    tags: ['Career', 'Jobs', 'Internships', 'Networking'],
    comments: []
  }
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const addToGoogleCalendar = (event: UniversityEvent) => {
  const startDate = event.date.replace(/-/g, '') + 'T090000Z';
  const endDate = event.date.replace(/-/g, '') + 'T170000Z';
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.shortDescription)}&location=${encodeURIComponent(event.venue)}`;
  window.open(url, '_blank');
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function UniversityEventsPlatform() {
  // Theme State
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'admin'>('all');

  // Events State
  const [events, setEvents] = useState<UniversityEvent[]>(SAMPLE_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<UniversityEvent | null>(null);
  const [shareEvent, setShareEvent] = useState<UniversityEvent | null>(null);
  const [notificationEvent, setNotificationEvent] = useState<UniversityEvent | null>(null);

  // Search & Filters State (Section 14)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Saved View Sub-states
  const [savedSortBy, setSavedSortBy] = useState<'date' | 'title'>('date');
  const [savedViewMode, setSavedViewMode] = useState<'grid' | 'calendar'>('grid');

  // Apply dark mode class to html document based on theme selection
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else if (themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      // System default
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [themeMode]);

  // Handle Event Likes
  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEvents(prev => prev.map(evt => {
      if (evt.id === id) {
        const isLiked = !evt.isLiked;
        return {
          ...evt,
          isLiked,
          likes: isLiked ? evt.likes + 1 : evt.likes - 1
        };
      }
      return evt;
    }));
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(prev => prev ? {
        ...prev,
        isLiked: !prev.isLiked,
        likes: !prev.isLiked ? prev.likes + 1 : prev.likes - 1
      } : null);
    }
  };

  // Handle Bookmarks (Save Events Section 9)
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEvents(prev => prev.map(evt => {
      if (evt.id === id) {
        return { ...evt, isBookmarked: !evt.isBookmarked };
      }
      return evt;
    }));
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
  };

  // Open Detailed Event Page & Increment Views
  const handleOpenDetails = (evt: UniversityEvent) => {
    setEvents(prev => prev.map(item => item.id === evt.id ? { ...item, views: item.views + 1 } : item));
    setSelectedEvent({ ...evt, views: evt.views + 1 });
  };

  // Filtered Events Logic (Section 14)
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (!evt.isApproved && activeTab !== 'admin') return false;

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesDept = evt.department.toLowerCase().includes(q);
        const matchesVenue = evt.venue.toLowerCase().includes(q);
        const matchesOrganizer = evt.organizer.toLowerCase().includes(q);
        const matchesTags = evt.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDept && !matchesVenue && !matchesOrganizer && !matchesTags) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && evt.category !== selectedCategory) return false;

      // Faculty filter
      if (selectedFaculty !== 'All' && evt.faculty !== selectedFaculty) return false;

      // Type filter (Free, Online)
      if (typeFilter === 'Free' && !evt.free) return false;
      if (typeFilter === 'Online' && !evt.isOnline) return false;
      if (typeFilter === 'Offline' && evt.isOnline) return false;

      return true;
    });
  }, [events, searchQuery, selectedCategory, selectedFaculty, typeFilter, activeTab]);

  const savedEventsList = useMemo(() => {
    const list = events.filter(e => e.isBookmarked);
    if (savedSortBy === 'date') {
      return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, [events, savedSortBy]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans pb-16">
      
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('all')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                UniEvents
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Campus Hub</p>
            </div>
          </div>

          {/* Quick Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Explore Events
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved ({events.filter(e => e.isBookmarked).length})
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </button>
          </nav>

          {/* Theme Switcher (Section 18) */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                title="Light Mode"
                onClick={() => setThemeMode('light')}
                className={`p-1.5 rounded-lg transition-all ${themeMode === 'light' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-400'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                title="Dark Mode"
                onClick={() => setThemeMode('dark')}
                className={`p-1.5 rounded-lg transition-all ${themeMode === 'dark' ? 'bg-slate-900 text-indigo-400 shadow-sm' : 'text-slate-400'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                title="System Theme"
                onClick={() => setThemeMode('system')}
                className={`p-1.5 rounded-lg transition-all ${themeMode === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SUB-HEADER SEARCH & FILTERS (SECTION 14) */}
      {activeTab === 'all' && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-4 transition-colors">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by event title, keywords, faculty, venue, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full md:w-auto">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                  }`}
                >
                  All Categories
                </button>
                {Object.keys(CATEGORY_CONFIG).map((catKey) => {
                  const cat = CATEGORY_CONFIG[catKey as CategoryKey];
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.color}`} />
                      {catKey}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Filters Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter by:</span>
                </div>
                
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Faculties</option>
                  <option value="Faculty of Engineering">Faculty of Engineering</option>
                  <option value="Faculty of Arts & Humanities">Faculty of Arts & Humanities</option>
                  <option value="School of Business">School of Business</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Formats</option>
                  <option value="Free">Free Events</option>
                  <option value="Online">Online / Virtual</option>
                  <option value="Offline">On-Campus / Venue</option>
                </select>
              </div>

              <div className="text-slate-400 font-medium">
                Showing <span className="text-slate-800 dark:text-slate-200 font-bold">{filteredEvents.length}</span> events
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* VIEW 1: EXPLORE / FEATURED & CARDS GRID (SECTION 5) */}
        {activeTab === 'all' && (
          <div className="space-y-8">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold">No Events Found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your keywords or category filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedFaculty('All'); setTypeFilter('All'); }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onOpenDetails={() => handleOpenDetails(event)}
                    onToggleLike={(e) => handleToggleLike(event.id, e)}
                    onToggleBookmark={(e) => handleToggleBookmark(event.id, e)}
                    onShare={(e) => { e.stopPropagation(); setShareEvent(event); }}
                    onNotify={(e) => { e.stopPropagation(); setNotificationEvent(event); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SAVED EVENTS / MY EVENTS (SECTION 9) */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-indigo-500 fill-indigo-500" />
                  My Saved Events
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage your bookmarked campus activities and export to your calendar.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={savedSortBy}
                  onChange={(e) => setSavedSortBy(e.target.value as 'date' | 'title')}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="date">Sort by Upcoming Date</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
            </div>

            {savedEventsList.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-lg font-bold">No Saved Events Yet</h3>
                <p className="text-slate-500 text-sm mt-1">Click the bookmark icon on any event card to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEventsList.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onOpenDetails={() => handleOpenDetails(event)}
                    onToggleLike={(e) => handleToggleLike(event.id, e)}
                    onToggleBookmark={(e) => handleToggleBookmark(event.id, e)}
                    onShare={(e) => { e.stopPropagation(); setShareEvent(event); }}
                    onNotify={(e) => { e.stopPropagation(); setNotificationEvent(event); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ADMIN DASHBOARD (SECTION 12) */}
        {activeTab === 'admin' && (
          <AdminDashboardView events={events} setEvents={setEvents} />
        )}

      </main>

      {/* MODAL 1: EVENT DETAILS PAGE (SECTION 6 & 16) */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onToggleLike={() => handleToggleLike(selectedEvent.id)}
          onToggleBookmark={() => handleToggleBookmark(selectedEvent.id)}
          onShare={() => setShareEvent(selectedEvent)}
          onNotify={() => setNotificationEvent(selectedEvent)}
        />
      )}

      {/* MODAL 2: SOCIAL SHARING MODAL (SECTION 17) */}
      {shareEvent && (
        <SocialShareModal event={shareEvent} onClose={() => setShareEvent(null)} />
      )}

      {/* MODAL 3: EVENT NOTIFICATIONS MODAL (SECTION 8) */}
      {notificationEvent && (
        <NotificationReminderModal event={notificationEvent} onClose={() => setNotificationEvent(null)} />
      )}

    </div>
  );
}

// ==========================================
// COMPONENT: ENHANCED EVENT CARD (SECTION 5)
// ==========================================

interface EventCardProps {
  event: UniversityEvent;
  onOpenDetails: () => void;
  onToggleLike: (e: React.MouseEvent) => void;
  onToggleBookmark: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  onNotify: (e: React.MouseEvent) => void;
}

function EventCard({ event, onOpenDetails, onToggleLike, onToggleBookmark, onShare, onNotify }: EventCardProps) {
  const CatConfig = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG['Academic'];
  const CategoryIcon = CatConfig.icon;

  return (
    <div
      onClick={onOpenDetails}
      className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Thumbnail Header */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={event.poster}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Category Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-white/90 dark:bg-slate-900/90 ${CatConfig.color} shadow-sm border ${CatConfig.bg}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
            {event.category}
          </span>

          {/* Action Buttons Top Right */}
          <div className="flex items-center gap-1.5">
            {event.isTrending && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex items-center gap-1 uppercase">
                <Flame className="w-3 h-3 fill-white" /> Trending
              </span>
            )}
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-full backdrop-blur-md transition ${
                event.isBookmarked
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-900/60 text-white hover:bg-slate-900/80'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${event.isBookmarked ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg font-medium border border-white/10 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {event.date}
          </span>
          <span className="bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg font-medium border border-white/10 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {event.time.split('-')[0]}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Faculty Badge */}
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            {event.faculty}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {event.title}
          </h3>

          {/* Venue & Organizer */}
          <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>By {event.organizer}</span>
            </p>
          </div>

          {/* Short Description */}
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.shortDescription}
          </p>
        </div>

        {/* Footer Stats & Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          
          {/* Views & Likes */}
          <div className="flex items-center gap-3 text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {event.views}
            </span>
            <button
              onClick={onToggleLike}
              className={`flex items-center gap-1 transition ${event.isLiked ? 'text-rose-500 font-bold' : 'hover:text-slate-600'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${event.isLiked ? 'fill-rose-500' : ''}`} />
              {event.likes}
            </button>
          </div>

          {/* Card Direct Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onNotify}
              title="Set Notification"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={onShare}
              title="Share Event"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); addToGoogleCalendar(event); }}
              title="Add to Google Calendar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
            >
              <CalendarPlus className="w-4 h-4" />
            </button>

            {event.isRegistrationAvailable && (
              <span className="ml-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm transition">
                Register
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: DETAILED EVENT MODAL / PAGE (SECTION 6 & 16)
// ==========================================

interface EventDetailsModalProps {
  event: UniversityEvent;
  onClose: () => void;
  onToggleLike: () => void;
  onToggleBookmark: () => void;
  onShare: () => void;
  onNotify: () => void;
}

function EventDetailsModal({ event, onClose, onToggleLike, onToggleBookmark, onShare, onNotify }: EventDetailsModalProps) {
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<EventComment[]>(event.comments);

  const CatConfig = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG['Academic'];
  const CategoryIcon = CatConfig.icon;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newC: EventComment = {
      id: Date.now().toString(),
      author: 'Current Student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      text: commentText,
      timestamp: 'Just now',
      likes: 0
    };
    setCommentsList([newC, ...commentsList]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative my-8">
        
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Full Banner Header Image */}
        <div className="relative h-72 sm:h-96 w-full bg-slate-800">
          <img src={event.poster} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-white/90 text-slate-900 shadow-sm`}>
                <CategoryIcon className={`w-3.5 h-3.5 ${CatConfig.color}`} />
                {event.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 backdrop-blur-md border border-white/20">
                {event.faculty}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-100 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {event.views} Views</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500" /> {event.likes} Likes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                event.isLiked
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${event.isLiked ? 'fill-white' : ''}`} />
              {event.isLiked ? 'Liked' : 'Like'}
            </button>

            <button
              onClick={onToggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                event.isBookmarked
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${event.isBookmarked ? 'fill-white' : ''}`} />
              {event.isBookmarked ? 'Saved' : 'Save'}
            </button>

            <button
              onClick={onNotify}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
            >
              <Bell className="w-4 h-4" /> Remind
            </button>

            <button
              onClick={onShare}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Countdown Banner Demo */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Event Starts In</p>
                <div className="flex gap-3 text-lg font-black text-slate-900 dark:text-white mt-1">
                  <span>09 <span className="text-xs font-normal text-slate-400">Days</span></span>
                  <span>14 <span className="text-xs font-normal text-slate-400">Hours</span></span>
                  <span>22 <span className="text-xs font-normal text-slate-400">Mins</span></span>
                </div>
              </div>
              <button
                onClick={() => addToGoogleCalendar(event)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <CalendarPlus className="w-4 h-4" /> Add to Calendar
              </button>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold mb-2">About this Event</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.detailedDescription}
              </p>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Gallery (Section 6) */}
            {event.gallery.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold">Event Gallery & Teasers</h3>
                <div className="grid grid-cols-2 gap-3">
                  {event.gallery.map((img, idx) => (
                    <img key={idx} src={img} alt="Gallery" className="w-full h-36 object-cover rounded-2xl border border-slate-200 dark:border-slate-800" />
                  ))}
                </div>
              </div>
            )}

            {/* Comments & Discussion Section (Section 16) */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Comments & Discussion ({commentsList.length})
              </h3>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="flex items-start gap-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User" className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Ask a question or join the discussion..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Comment Thread List */}
              <div className="space-y-4 pt-2">
                {commentsList.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex gap-3">
                      <img src={c.avatar} alt={c.author} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{c.author}</span>
                          {c.isOrganizer && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-bold">Organizer</span>
                          )}
                          <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{c.text}</p>
                      </div>
                    </div>

                    {/* Nested Replies */}
                    {c.replies?.map(r => (
                      <div key={r.id} className="ml-8 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl flex gap-3 border-l-2 border-indigo-500">
                        <img src={r.avatar} alt={r.author} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{r.author}</span>
                            {r.isOrganizer && <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-600 text-white font-bold">Organizer</span>}
                            <span className="text-[10px] text-slate-400">{r.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Sidebar Information Column */}
          <div className="space-y-6">
            
            {/* Registration Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Admission</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {event.isFree ? 'FREE' : event.price}
                </span>
              </div>

              {event.isRegistrationAvailable ? (
                <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition">
                  Register Now
                </button>
              ) : (
                <button disabled className="w-full py-3 bg-slate-300 text-slate-500 font-bold rounded-xl text-sm cursor-not-allowed">
                  Registration Closed
                </button>
              )}
            </div>

            {/* Quick Details Box */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
                Logistics & Details
              </h4>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Date</p>
                  <p className="text-slate-500 dark:text-slate-400">{event.date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Time</p>
                  <p className="text-slate-500 dark:text-slate-400">{event.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Venue</p>
                  <p className="text-slate-500 dark:text-slate-400">{event.venue}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Organizer Contact</p>
                  <p className="text-slate-500 dark:text-slate-400">{event.organizer} ({event.organizerContact})</p>
                </div>
              </div>
            </div>

            {/* Google Maps Preview Integration Placeholder */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" /> Map Directions
              </p>
              <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500 font-medium">
                [ Interactive Google Map Integration ]
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: SOCIAL SHARING MODAL (SECTION 17)
// ==========================================

function SocialShareModal({ event, onClose }: { event: UniversityEvent; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { name: 'WhatsApp', color: 'bg-emerald-500' },
    { name: 'Facebook', color: 'bg-blue-600' },
    { name: 'Telegram', color: 'bg-sky-500' },
    { name: 'LinkedIn', color: 'bg-blue-700' },
    { name: 'X (Twitter)', color: 'bg-slate-900 dark:bg-slate-700' },
    { name: 'Email', color: 'bg-indigo-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-500" /> Share Event
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-3 gap-3">
          {shareOptions.map((platform) => (
            <button
              key={platform.name}
              onClick={() => alert(`Sharing to ${platform.name}...`)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className={`w-10 h-10 rounded-full ${platform.color} text-white flex items-center justify-center font-bold text-xs shadow-md`}>
                {platform.name[0]}
              </div>
              <span className="text-[11px] font-medium">{platform.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link Bar */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-500">Copy Direct Link</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shrink-0 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code Quick Share */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-indigo-500" />
            <span className="text-xs font-semibold">QR Code Share</span>
          </div>
          <button onClick={() => alert('Opening printable QR code...')} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            View QR
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: EVENT NOTIFICATIONS REMINDER (SECTION 8)
// ==========================================

function NotificationReminderModal({ event, onClose }: { event: UniversityEvent; onClose: () => void }) {
  const [selectedReminder, setSelectedReminder] = useState('1 Day Before');
  const [channel, setChannel] = useState('Browser Notifications');

  const reminderOptions = ['1 Week Before', '1 Day Before', '12 Hours Before', '1 Hour Before', '15 Minutes Before'];
  const channelOptions = ['Browser Notifications', 'Email Notifications', 'Push Notifications (Mobile App)', 'In-App Notifications'];

  const handleSaveReminder = () => {
    alert(`Reminder set for "${event.title}" (${selectedReminder} via ${channel})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" /> Set Reminder
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-2">When should we remind you?</label>
            <div className="space-y-1.5">
              {reminderOptions.map(option => (
                <label key={option} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100">
                  <input
                    type="radio"
                    name="reminderTime"
                    checked={selectedReminder === option}
                    onChange={() => setSelectedReminder(option)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-2">Notification Method</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-none font-medium text-slate-700 dark:text-slate-200"
            >
              {channelOptions.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveReminder}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          Confirm Reminder
        </button>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: ADMIN DASHBOARD (SECTION 12)
// ==========================================

function AdminDashboardView({ events, setEvents }: { events: UniversityEvent[]; setEvents: React.Dispatch<React.SetStateAction<UniversityEvent[]>> }) {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'analytics' | 'moderation'>('approvals');

  const pendingEvents = events.filter(e => !e.isApproved);

  const handleApprove = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isApproved: true } : e));
  };

  const handleReject = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isFeatured: !e.isFeatured } : e));
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Centralized Admin Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage approvals, faculty statistics, event content moderation, and metrics.
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('approvals')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'approvals' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Approvals ({pendingEvents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'analytics' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* SUB VIEW 1: EVENT APPROVALS */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base">Pending Approvals</h3>

          {pendingEvents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No pending event submissions at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map(evt => (
                <div key={evt.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase">{evt.category}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{evt.title}</h4>
                    <p className="text-xs text-slate-400">Organized by {evt.organizer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleApprove(evt.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                      Approve
                    </button>
                    <button onClick={() => handleReject(evt.id)} className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="font-bold text-base pt-6">All Active Events Management</h3>
          <div className="space-y-3">
            {events.map(evt => (
              <div key={evt.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={evt.poster} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{evt.title}</h4>
                    <p className="text-[11px] text-slate-400">{evt.date} • {evt.faculty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(evt.id)}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      evt.isFeatured ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                    title="Pin Featured Event"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleReject(evt.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB VIEW 2: ANALYTICS DASHBOARD */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400">Total Events</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{events.length}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400">Total Event Views</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {events.reduce((acc, curr) => acc + curr.views, 0)}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400">Total Engagement (Likes)</p>
            <p className="text-2xl font-black text-rose-500 mt-1">
              {events.reduce((acc, curr) => acc + curr.likes, 0)}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400">Active Organizers</p>
            <p className="text-2xl font-black text-emerald-500 mt-1">18</p>
          </div>
        </div>
      )}
    </div>
  );
}