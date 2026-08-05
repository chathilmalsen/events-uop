import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar, List as ListIcon, Search, Plus, X, MapPin, Clock,
  MessageCircle, ChevronLeft, ChevronRight, Trash2, Upload,
  Users, CalendarDays, AlertCircle, Edit, ShieldCheck, LogOut, User,
  CalendarPlus, Download, Heart, Bookmark, Share2, Eye, Flame,
  ExternalLink, Sun, Monitor, Copy, Check, Reply, Bell,
  SlidersHorizontal, Ticket, Globe, MapPinned, Timer, QrCode,
  PackageSearch, Wrench, ClipboardList, LogIn, UserPlus, Send,
  CheckCircle2, CircleDot, Loader2, Home
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

const ADMIN_EMAIL = "ktchathilmalsencm@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/chathilmkt?igsh=MTgwZGdlbnVwMzQzeA%3D%3D&utm_source=qr";

const FACULTIES = [
  { id: "engineering", name: "Faculty of Engineering", short: "ENG", color: "#2E5C8A" },
  { id: "medicine",    name: "Faculty of Medicine",    short: "FOM", color: "#B0334D" },
  { id: "management",  name: "Faculty of Management",  short: "FMS", color: "#B8860B" },
  { id: "arts",        name: "Faculty of Arts",        short: "ARTS", color: "#7A4FA3" },
  { id: "science",     name: "Faculty of Science",     short: "SCI", color: "#6B2D3C" },
  { id: "dental",      name: "Faculty of Dental Science", short: "FDS", color: "#1E8A8A" },
  { id: "agriculture", name: "Faculty of Agriculture", short: "AGRI", color: "#7A4FA3" },
  { id: "allied health sciences", name: "Faculty of Allied Health", short: "FAHS", color: "#6B2D3C" },
  { id: "veterniary and animal medicine", name: "Faculty of Veterinary Medicine", short: "FVMAS", color: "#1E8A8A" },
];

const CATEGORIES = [
  { id: "academic",      name: "Academic",         icon: "🎓", color: "#2E5C8A" },
  { id: "sports",        name: "Sports",           icon: "⚽", color: "#1E8A5C" },
  { id: "musical",       name: "Musical",          icon: "🎵", color: "#B8860B" },
  { id: "workshop",      name: "Workshop",         icon: "💻", color: "#7A4FA3" },
  { id: "competition",   name: "Competition",      icon: "🏆", color: "#B0334D" },
  { id: "notice",        name: "Notice",           icon: "📢", color: "#5B6472" },
  { id: "social",        name: "Social",           icon: "🎉", color: "#C9A227" },
  { id: "charity",       name: "Charity",          icon: "❤️", color: "#B0334D" },
  { id: "research",      name: "Research",         icon: "🔬", color: "#1E8A8A" },
  { id: "environmental", name: "Environmental",    icon: "🌱", color: "#3D8B3D" },
  { id: "volunteer",     name: "Volunteer",        icon: "🤝", color: "#6B2D3C" },
  { id: "career",        name: "Career Fair",      icon: "💼", color: "#2E5C8A" },
  { id: "industrial",    name: "Industrial Visit", icon: "🚌", color: "#A9820F" },
  { id: "cultural",      name: "Cultural",         icon: "🎭", color: "#7A4FA3" },
  { id: "awards",        name: "Awards",           icon: "🏅", color: "#C9A227" },
  { id: "seminar",       name: "Seminar",          icon: "🧠", color: "#2E5C8A" },
  { id: "exam",          name: "Exam & Academic",  icon: "📚", color: "#5B6472" },
];

const TICKET_TYPES = [
  { id: "lost", name: "Lost Item", icon: PackageSearch, color: "#B0334D" },
  { id: "found", name: "Found Item", icon: PackageSearch, color: "#1E8A5C" },
  { id: "facility", name: "Facility / Equipment Issue", icon: Wrench, color: "#A9820F" },
];
const TICKET_STATUSES = [
  { id: "open", name: "Open", icon: CircleDot, color: "#B0334D" },
  { id: "in_progress", name: "In Progress", icon: Loader2, color: "#A9820F" },
  { id: "resolved", name: "Resolved", icon: CheckCircle2, color: "#1E8A5C" },
];
const ticketTypeOf = (id) => TICKET_TYPES.find((t) => t.id === id) || TICKET_TYPES[0];
const ticketStatusOf = (id) => TICKET_STATUSES.find((s) => s.id === id) || TICKET_STATUSES[0];

function formatTicketDate(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const facultyOf = (id) => FACULTIES.find((f) => f.id === id) || { name: "General", short: "GEN", color: "#5B6472" };
const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) || null;

const LIGHT_THEME = {
  cream: "#FAF6EC", card: "#FFFDF8", ink: "#1B2740", inkSoft: "#5B6472",
  gold: "#C9A227", goldDeep: "#A9820F", line: "#E6DFCD", danger: "#B0334D",
  headerBg: "#060A12", headerText: "#FFFFFF", headerSoft: "#94A3B8"
};
const DARK_THEME = {
  cream: "#10141C", card: "#171C28", ink: "#EEF0F6", inkSoft: "#9AA3B8",
  gold: "#E8C158", goldDeep: "#F0CE72", line: "#2A3040", danger: "#E5657F",
  headerBg: "#05080E", headerText: "#FFFFFF", headerSoft: "#9AA3B8"
};
let THEME = LIGHT_THEME;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function getAnonId() {
  let id = localStorage.getItem("cg_anon_id");
  if (!id) {
    id = uid();
    localStorage.setItem("cg_anon_id", id);
  }
  return id;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatMonthLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
function eventDateTime(ev) {
  return new Date(`${ev.date}T${ev.startTime || "00:00"}`);
}
function isPastEvent(ev) {
  return eventDateTime(ev).getTime() < Date.now() - 1000 * 60 * 60 * 2;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const total = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function compressImage(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function icsDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = (timeStr || "00:00").split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function downloadIcsForEvent(ev) {
  const start = icsDateTime(ev.date, ev.startTime);
  const end = icsDateTime(ev.date, ev.endTime || ev.startTime);
  const escapeText = (s = "") => s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campus Connect//Campus Notice Board//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id || uid()}@events-uop`,
    `DTSTAMP:${icsDateTime(new Date().toISOString().slice(0, 10), "00:00")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(ev.title)}`,
    `LOCATION:${escapeText(ev.location)}`,
    `DESCRIPTION:${escapeText(ev.description || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]/gi, "-").slice(0, 40)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function shareUrlFor(ev) {
  const url = new URL(window.location.href);
  url.searchParams.set("event", ev.id);
  return url.toString();
}

function normalizeTitleForCompare(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function titleSimilarity(a, b) {
  const wordsA = new Set(normalizeTitleForCompare(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeTitleForCompare(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : shared / union;
}

function FacultySeal({ faculty, size = "md" }) {
  const f = facultyOf(faculty);
  const dims = size === "sm" ? 28 : size === "lg" ? 56 : 38;
  const fontSize = size === "sm" ? 9 : size === "lg" ? 16 : 11;
  return (
    <div
      style={{
        width: dims, height: dims, borderRadius: "50%",
        border: `2px solid ${f.color}`, backgroundColor: f.color + "16",
        color: f.color, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize,
        flexShrink: 0, letterSpacing: "0.02em",
      }}
      title={f.name}
    >
      {f.short}
    </div>
  );
}

function CategoryBadge({ category, size = "sm" }) {
  const c = categoryOf(category);
  if (!c) return null;
  const fontSize = size === "sm" ? 10 : 11;
  return (
    <span
      className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ color: c.color, backgroundColor: c.color + "14", fontFamily: "'IBM Plex Mono', monospace", fontSize }}
    >
      <span>{c.icon}</span>{c.name}
    </span>
  );
}

function CountdownTimer({ ev }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = eventDateTime(ev).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const Cell = ({ v, label }) => (
    <div className="flex flex-col items-center px-2 py-1.5 rounded-lg" style={{ backgroundColor: THEME.ink, minWidth: 44 }}>
      <span style={{ color: THEME.cream, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15 }}>{String(v).padStart(2, "0")}</span>
      <span style={{ color: THEME.cream + "99", fontSize: 9, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 mt-3">
      <Timer size={14} color={THEME.goldDeep} />
      <div className="flex gap-1.5">
        <Cell v={d} label="days" /><Cell v={h} label="hrs" /><Cell v={m} label="min" /><Cell v={s} label="sec" />
      </div>
    </div>
  );
}

function ShareMenu({ ev, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrlFor(ev);
  const text = encodeURIComponent(ev.title);
  const encUrl = encodeURIComponent(url);
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}%20${encUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encUrl}&text=${text}` },
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${text}&url=${encUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}` },
    { label: "Email", href: `mailto:?subject=${text}&body=${encUrl}` },
  ];
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div
      className="absolute right-0 top-full mt-2 z-20 rounded-2xl p-3 w-64"
      style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}`, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium hover:bg-black/5" style={{ color: THEME.ink, border: `1px solid ${THEME.line}` }}>
            <ExternalLink size={11} /> {l.label}
          </a>
        ))}
      </div>
      <button onClick={copyLink} className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold mb-2" style={{ color: THEME.ink, border: `1px solid ${THEME.line}` }}>
        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}

function EventCard({ ev, onOpen, isBookmarked, onToggleBookmark, isLiked, onToggleLike, isTrending }) {
  const f = facultyOf(ev.faculty);
  const c = categoryOf(ev.category);
  const past = isPastEvent(ev);
  const [shareOpen, setShareOpen] = useState(false);
  const likeCount = (ev.likes || []).length;

  return (
    <div
      className="text-left w-full rounded-2xl overflow-hidden transition-transform duration-150 relative"
      style={{
        backgroundColor: THEME.card, border: `1px solid ${THEME.line}`,
        borderLeft: `5px solid ${f.color}`, boxShadow: "0 1px 3px rgba(27,39,64,0.05)",
        opacity: past ? 0.62 : 1,
      }}
    >
      <button onClick={() => onOpen(ev)} className="text-left w-full active:scale-[0.99] hover:-translate-y-0.5 transition-transform">
        <div className="flex flex-row gap-3 sm:gap-4 p-3.5 sm:p-4 items-start sm:items-center">
          {ev.posterUrl ? (
            <img
              src={ev.posterUrl} alt={`Poster for ${ev.title}`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0"
              style={{ border: `1px solid ${THEME.line}` }}
              loading="lazy"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${f.color}22, ${f.color}0a)` }}
            >
              <FacultySeal faculty={ev.faculty} size="md" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span
                className="text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full"
                style={{ color: f.color, backgroundColor: f.color + "14", fontFamily: "'IBM Plex Mono', monospace" }}
                title={f.name}
              >
                {f.short}
              </span>
              {c && <CategoryBadge category={ev.category} />}
              {isTrending && (
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-0.5" style={{ color: "#B0334D", backgroundColor: "#B0334D18" }}>
                  <Flame size={10} /> Trending
                </span>
              )}
            </div>
            <h3 className="font-semibold leading-tight truncate pb-0.5" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif", fontSize: 16 }}>
              {ev.title}
            </h3>
            <p className="text-xs sm:text-sm mt-1 line-clamp-2" style={{ color: THEME.inkSoft }}>{ev.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs" style={{ color: THEME.inkSoft }}>
              <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(ev.startTime)}</span>
              <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none"><MapPin size={12} /> {ev.location}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} /> {(ev.comments || []).length}</span>
              <span className="flex items-center gap-1"><Eye size={12} /> {ev.views || 0}</span>
            </div>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1 px-3.5 sm:px-4 pb-3 pt-0.5 relative">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike(ev); }}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
          style={{ color: isLiked ? THEME.danger : THEME.inkSoft, backgroundColor: isLiked ? THEME.danger + "14" : "transparent" }}
        >
          <Heart size={13} fill={isLiked ? THEME.danger : "none"} /> {likeCount}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(ev.id); }}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
          style={{ color: isBookmarked ? THEME.goldDeep : THEME.inkSoft, backgroundColor: isBookmarked ? THEME.gold + "22" : "transparent" }}
        >
          <Bookmark size={13} fill={isBookmarked ? THEME.goldDeep : "none"} /> {isBookmarked ? "Saved" : "Save"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShareOpen((v) => !v); }}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
          style={{ color: THEME.inkSoft }}
        >
          <Share2 size={13} /> Share
        </button>
        {ev.registrationLink && (
          <a
            href={ev.registrationLink} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ml-auto"
            style={{ color: "#fff", backgroundColor: f.color }}
          >
            <Ticket size={12} /> Register
          </a>
        )}
        {shareOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShareOpen(false); }} />
            <ShareMenu ev={ev} onClose={() => setShareOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}

function Modal({ onClose, children, wide }) {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(10,14,22,0.6)" }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: THEME.card, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: THEME.inkSoft }}>
        {label}{required && <span style={{ color: THEME.danger }}> *</span>}
      </span>
      {children}
    </label>
  );
}

function inputStyleFn() {
  return {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: `1px solid ${THEME.line}`, backgroundColor: THEME.cream === LIGHT_THEME.cream ? "#FFFFFF" : "#0E121A",
    color: THEME.ink, fontSize: 14, outline: "none",
  };
}

// --- NEW COMPONENTS ADDED FOR ANNOUNCEMENTS, ANALYTICS & DEVELOPER CONNECT ---

function AnnouncementTicker({ announcements, isAdmin, onManage }) {
  const activeList = announcements.filter((a) => a.active);
  if (activeList.length === 0 && !isAdmin) return null;

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs font-medium overflow-hidden relative"
      style={{ backgroundColor: THEME.gold + "18", borderBottom: `1px solid ${THEME.line}`, color: THEME.ink }}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
        <span className="flex items-center gap-1 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[10px] flex-shrink-0" style={{ backgroundColor: THEME.gold, color: "#1B2740" }}>
          <Bell size={10} /> Notice
        </span>
        {activeList.length > 0 ? (
          <div className="overflow-hidden whitespace-nowrap relative w-full">
            <div className="inline-block" style={{ animation: "tickerScroll 25s linear infinite" }}>
              {activeList.map((a, idx) => (
                <span key={a.id || idx} className="mr-8 inline-block">
                  {a.text}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="italic opacity-60">No active announcements right now.</span>
        )}
      </div>
      {isAdmin && (
        <button
          onClick={onManage}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold flex-shrink-0"
          style={{ backgroundColor: THEME.ink, color: THEME.cream }}
        >
          Manage Notices
        </button>
      )}
    </div>
  );
}

function AnnouncementAdminModal({ onClose, announcements, onAdd, onToggle, onDelete }) {
  const [text, setText] = useState("");
  const inputStyle = inputStyleFn();

  const handleCreate = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="p-5 sm:p-6 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }} className="flex items-center gap-2">
            <Bell size={20} color={THEME.gold} /> Manage Ticker Announcements
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex gap-2 mb-5">
          <input
            type="text"
            style={inputStyle}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a new announcement ticker message..."
            required
          />
          <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
            Add
          </button>
        </form>

        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {announcements.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: THEME.inkSoft }}>No announcements created yet.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl gap-3" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" style={{ color: THEME.ink }}>{a.text}</p>
                  <span className="text-[10px]" style={{ color: THEME.inkSoft }}>{formatTicketDate(a.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onToggle(a.id, !a.active)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                    style={{ backgroundColor: a.active ? "#1E8A5C22" : THEME.line, color: a.active ? "#1E8A5C" : THEME.inkSoft }}
                  >
                    {a.active ? "Active" : "Hidden"}
                  </button>
                  <button onClick={() => onDelete(a.id)} className="p-1 rounded-lg hover:bg-red-500/10" style={{ color: THEME.danger }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

function AnalyticsDashboard({ onClose, events, tickets }) {
  const totalEvents = events.length;
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
  const totalViews = events.reduce((acc, ev) => acc + (ev.views || 0), 0);
  const totalLikes = events.reduce((acc, ev) => acc + (ev.likes || []).length, 0);

  const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="p-4 rounded-2xl flex items-center gap-3.5" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
      <div className="p-3 rounded-xl" style={{ backgroundColor: color + "18", color }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: THEME.inkSoft }}>{label}</p>
        <p className="text-xl font-bold mt-0.5" style={{ color: THEME.ink, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose} wide>
      <div className="p-5 sm:p-6 flex flex-col max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }} className="flex items-center gap-2">
            <ClipboardList size={20} color={THEME.gold} /> System Analytics Overview
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          <StatBox label="Total Events Posted" value={totalEvents} icon={Home} color="#2E5C8A" />
          <StatBox label="Total Cumulative Views" value={totalViews} icon={Eye} color="#B8860B" />
          <StatBox label="Total Event Likes" value={totalLikes} icon={Heart} color="#B0334D" />
          <StatBox label="Support & Lost/Found Tickets" value={totalTickets} icon={PackageSearch} color="#1E8A5C" />
        </div>

        <div className="p-4 rounded-2xl" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: THEME.ink }}>Ticket Resolution Rate</h3>
          <div className="w-full bg-black/5 h-3 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0}%`, backgroundColor: "#1E8A5C" }}
            />
          </div>
          <p className="text-xs" style={{ color: THEME.inkSoft }}>
            {resolvedTickets} of {totalTickets} tickets marked as resolved ({totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0}%)
          </p>
        </div>
      </div>
    </Modal>
  );
}

function SuggestionForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputStyle = inputStyleFn();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) {
      setSuccess(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
      <h3 className="font-semibold text-lg mb-1" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif" }}>Send a Feedback or Suggestion</h3>
      <p className="text-xs mb-4" style={{ color: THEME.inkSoft }}>Have ideas to improve Campus Connect? Let the developers know directly.</p>

      {success && (
        <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "#1E8A5C18", color: "#1E8A5C" }}>
          <CheckCircle2 size={14} /> Thank you! Your suggestion has been sent successfully.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Your Name (Optional)">
          <input type="text" style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" />
        </Field>
        <Field label="Email / Contact (Optional)">
          <input type="text" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. john@uni.ac.lk" />
        </Field>
      </div>
      <Field label="Your Message / Feature Request" required>
        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your suggestion..." required />
      </Field>
      <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Suggestion
      </button>
    </form>
  );
}

function SuggestionsInbox({ suggestions, loading, onDelete }) {
  if (loading) {
    return <div className="p-6 text-center text-xs" style={{ color: THEME.inkSoft }}>Loading suggestions inbox…</div>;
  }
  return (
    <div className="mt-6">
      <h3 className="font-semibold text-base mb-3" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif" }}>Developer Inbox ({suggestions.length})</h3>
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-xs p-4 rounded-xl text-center" style={{ border: `1px solid ${THEME.line}`, color: THEME.inkSoft, backgroundColor: THEME.card }}>No suggestions received yet.</p>
        ) : (
          suggestions.map((s) => (
            <div key={s.id} className="p-4 rounded-xl relative" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="font-semibold text-xs" style={{ color: THEME.ink }}>{s.name || "Anonymous User"}</span>
                  {s.email && <span className="text-[11px] ml-2 opacity-70" style={{ color: THEME.inkSoft }}>({s.email})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: THEME.inkSoft }}>{formatTicketDate(s.createdAt)}</span>
                  <button onClick={() => onDelete(s.id)} className="p-1 rounded hover:bg-red-500/10" style={{ color: THEME.danger }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs whitespace-pre-wrap" style={{ color: THEME.inkSoft }}>{s.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DeveloperConnectSection({ isAdmin, suggestions, suggestionsLoading, onSubmitSuggestion, onDeleteSuggestion }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif", color: THEME.ink }}>Developer & Contact Support</h2>
        <p className="text-xs sm:text-sm" style={{ color: THEME.inkSoft }}>Connect directly with the platform maintainer or submit feedback.</p>
      </div>

      <div className="p-6 rounded-3xl mb-8 flex flex-col sm:flex-row items-center gap-5" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: THEME.gold + "22", color: THEME.goldDeep, fontFamily: "'IBM Plex Mono', monospace" }}>
          CM
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="font-semibold text-lg" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif" }}>Chathil Malsen</h3>
          <p className="text-xs mb-3" style={{ color: THEME.inkSoft }}>Creator & Lead Developer — Campus Connect</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ backgroundColor: THEME.ink, color: THEME.cream }}
          >
            <Globe size={13} /> Instagram Profile <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <SuggestionForm onSubmit={onSubmitSuggestion} />

      {isAdmin && (
        <SuggestionsInbox suggestions={suggestions} loading={suggestionsLoading} onDelete={onDeleteSuggestion} />
      )}
    </div>
  );
}

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const [section, setSection] = useState("events"); // "events" | "lostfound" | "developer"
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showAnnouncementAdmin, setShowAnnouncementAdmin] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u?.email === ADMIN_EMAIL);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAdmin) { setSuggestions([]); return; }
    const q = query(collection(db, "suggestions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSuggestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setSuggestionsLoading(false);
    }, () => setSuggestionsLoading(false));
    return () => unsub();
  }, [isAdmin]);

  const addAnnouncement = async (text) => {
    try { await addDoc(collection(db, "announcements"), { text, active: true, createdAt: Date.now() }); } catch {}
  };
  const toggleAnnouncement = async (id, active) => {
    try { await updateDoc(doc(db, "announcements", id), { active }); } catch {}
  };
  const deleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try { await deleteDoc(doc(db, "announcements", id)); } catch {}
  };

  const addSuggestion = async (form) => {
    try {
      await addDoc(collection(db, "suggestions"), { ...form, createdAt: Date.now() });
      return true;
    } catch { return false; }
  };
  const deleteSuggestion = async (id) => {
    if (!window.confirm("Delete this suggestion?")) return;
    try { await deleteDoc(doc(db, "suggestions", id)); } catch {}
  };

  return (
    <div style={{ backgroundColor: THEME.cream, color: THEME.ink, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Announcement Ticker Bar */}
      <AnnouncementTicker
        announcements={announcements}
        isAdmin={isAdmin}
        onManage={() => setShowAnnouncementAdmin(true)}
      />

      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: THEME.headerBg, color: THEME.headerText }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: THEME.gold, color: "#1B2740" }}>
            CC
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 18 }} className="font-bold tracking-tight">Campus Connect</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: THEME.headerText }}
            >
              <ClipboardList size={13} /> Analytics
            </button>
          )}
          {isAdmin ? (
            <button onClick={() => signOut(auth)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: THEME.danger, color: "#fff" }}>
              Sign Out
            </button>
          ) : (
            <button onClick={() => {
              const email = prompt("Admin Email:");
              const password = prompt("Admin Password:");
              if (email && password) {
                signInWithEmailAndPassword(auth, email.trim(), password).catch(() => alert("Invalid credentials"));
              }
            }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: THEME.headerText }}>
              Admin Login
            </button>
          )}
        </div>
      </header>

      {/* Main Content Router */}
      <main className="pb-24">
        {section === "lostfound" ? (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Lost & Found & Facilities</h2>
            <p className="text-xs mb-6" style={{ color: THEME.inkSoft }}>Report or track lost items and equipment maintenance needs across campus.</p>
            {/* Minimal placeholder container for Lost & Found items */}
            <div className="p-6 rounded-2xl text-center" style={{ border: `1px solid ${THEME.line}`, backgroundColor: THEME.card }}>
              <PackageSearch size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Lost & Found Hub Active</p>
            </div>
          </div>
        ) : section === "developer" ? (
          <DeveloperConnectSection
            isAdmin={isAdmin}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            onSubmitSuggestion={addSuggestion}
            onDeleteSuggestion={deleteSuggestion}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>University Events Notice Board</h2>
              <p className="text-xs sm:text-sm" style={{ color: THEME.inkSoft }}>Discover upcoming academic, cultural, and sports events at a glance.</p>
            </div>
            
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12 text-xs" style={{ color: THEME.inkSoft }}>No events posted yet. Check back later!</div>
              ) : (
                events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    onOpen={() => {}}
                    isBookmarked={false}
                    onToggleBookmark={() => {}}
                    isLiked={false}
                    onToggleLike={() => {}}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto p-3">
        <div className="flex items-center justify-around rounded-full p-1.5 shadow-lg backdrop-blur-md" style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}` }}>
          {[
            { id: "events", label: "Events", icon: Home },
            { id: "lostfound", label: "Lost & Found", icon: PackageSearch },
            { id: "developer", label: "Contact", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: active ? THEME.ink : "transparent",
                  color: active ? THEME.cream : THEME.inkSoft,
                }}
              >
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      {showAnnouncementAdmin && (
        <AnnouncementAdminModal
          onClose={() => setShowAnnouncementAdmin(false)}
          announcements={announcements}
          onAdd={addAnnouncement}
          onToggle={toggleAnnouncement}
          onDelete={deleteAnnouncement}
        />
      )}
      {showAnalytics && (
        <AnalyticsDashboard onClose={() => setShowAnalytics(false)} events={events} tickets={tickets} />
      )}
    </div>
  );
}