import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar, List as ListIcon, Search, Plus, X, MapPin, Clock,
  MessageCircle, ChevronLeft, ChevronRight, Trash2, Upload,
  Users, CalendarDays, AlertCircle, Edit, ShieldCheck, LogOut, User,
  CalendarPlus, Download, Heart, Bookmark, Share2, Eye, Flame,
  ExternalLink, Sun, Moon, Monitor, Copy, Check, Reply, Bell,
  SlidersHorizontal, Ticket, Globe, MapPinned, Timer, QrCode,
  PackageSearch, Wrench, ClipboardList, LogIn, UserPlus, Send,
  CheckCircle2, CircleDot, Loader2, Home
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { db, auth } from "./firebase";
// Posters/photos are compressed client-side and stored as base64 directly in
// the Firestore document (Firebase Storage isn't used in this build — see
// compressImage()/handlePosterFile() below).
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

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

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
function pad2(n) { return String(n).padStart(2, "0"); }
function sameYMD(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function fileToDataUrl(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

// Resizes + re-encodes an image client-side before it ever leaves the
// browser, so a 6000x4000 phone photo doesn't turn into a multi-MB upload.
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

function msUntil(ev, minutesBefore) {
  return eventDateTime(ev).getTime() - minutesBefore * 60 * 1000 - Date.now();
}
function scheduleLocalReminder(ev, minutesBefore) {
  const delay = msUntil(ev, minutesBefore);
  if (delay <= 0 || delay > 2 ** 31 - 1) return;
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(`Starting soon: ${ev.title}`, {
        body: `${ev.location} • ${formatTime(ev.startTime)}`,
      });
    }
  }, delay);
}
function getReminders() {
  try { return JSON.parse(localStorage.getItem("cg_reminders") || "{}"); } catch { return {}; }
}
function saveReminders(obj) { localStorage.setItem("cg_reminders", JSON.stringify(obj)); }

function getBookmarks() {
  try { return JSON.parse(localStorage.getItem("cg_bookmarks") || "[]"); } catch { return []; }
}
function saveBookmarks(arr) { localStorage.setItem("cg_bookmarks", JSON.stringify(arr)); }

function shareUrlFor(ev) {
  const url = new URL(window.location.href);
  url.searchParams.set("event", ev.id);
  return url.toString();
}

function isLikelyUrl(str) {
  if (!str) return true; // empty is allowed, it's optional
  return /^https?:\/\/.+/i.test(str.trim());
}

// --- Duplicate-event detection helpers -------------------------------------
// Lightweight, dependency-free "is this probably the same event" check:
// normalize both titles to a bag of words and compare word overlap
// (Jaccard similarity), then require the dates to match (when both are
// set) before calling it a likely duplicate. This deliberately stays
// conservative — it's meant to catch accidental re-posts and near-identical
// titles ("AI Workshop" vs "AI Workshop 2.0"), not to block genuinely
// different events that happen to share a date.
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
function findLikelyDuplicates(form, events, excludeId) {
  const title = (form.title || "").trim();
  if (title.length < 3) return [];
  const normTitle = normalizeTitleForCompare(title);
  return (events || []).filter((e) => {
    if (!e || !e.title) return false;
    if (excludeId && e.id === excludeId) return false;
    // If both events have a date set, require them to match — different
    // dates almost always mean a different occurrence, not a duplicate.
    if (form.date && e.date && form.date !== e.date) return false;
    const sim = titleSimilarity(title, e.title);
    return normalizeTitleForCompare(e.title) === normTitle || sim >= 0.55;
  });
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
  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: ev.title, url }); onClose(); } catch {}
    }
  };
  return (
    <div
      className="absolute right-0 top-full mt-2 z-20 rounded-2xl p-3 w-64"
      style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}`, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {typeof navigator !== "undefined" && navigator.share && (
        <button onClick={nativeShare} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold mb-1" style={{ color: THEME.ink, backgroundColor: THEME.gold + "22" }}>
          <Share2 size={13} /> Share via device…
        </button>
      )}
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
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${THEME.line}` }}>
        <img
          alt="QR code linking to this event"
          className="rounded-md"
          style={{ border: `1px solid ${THEME.line}` }}
          width={64} height={64}
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encUrl}`}
        />
        <p className="text-[10px] flex items-center gap-1" style={{ color: THEME.inkSoft }}><QrCode size={12} /> Scan to open on another device</p>
      </div>
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
              {past && (
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wide font-semibold" style={{ color: THEME.inkSoft }}>Past</span>
              )}
            </div>
            <h3 className="font-semibold leading-tight truncate pb-0.5" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif", fontSize: 16 }}>
              {ev.title}
            </h3>
            <p className="text-xs sm:text-sm mt-1 line-clamp-2" style={{ color: THEME.inkSoft }}>{ev.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs" style={{ color: THEME.inkSoft }}>
              <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}</span>
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
          aria-label={isLiked ? "Unlike this event" : "Like this event"}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
          style={{ color: isLiked ? THEME.danger : THEME.inkSoft, backgroundColor: isLiked ? THEME.danger + "14" : "transparent" }}
        >
          <Heart size={13} fill={isLiked ? THEME.danger : "none"} /> {likeCount}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(ev.id); }}
          aria-label={isBookmarked ? "Remove from saved events" : "Save event"}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
          style={{ color: isBookmarked ? THEME.goldDeep : THEME.inkSoft, backgroundColor: isBookmarked ? THEME.gold + "22" : "transparent" }}
        >
          <Bookmark size={13} fill={isBookmarked ? THEME.goldDeep : "none"} /> {isBookmarked ? "Saved" : "Save"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShareOpen((v) => !v); }}
          aria-label="Share event"
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

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full p-1 w-full sm:w-auto justify-between sm:justify-start" style={{ backgroundColor: "#EFE9D822" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors text-center flex items-center justify-center gap-1"
          style={{
            backgroundColor: value === opt.value ? THEME.ink : "transparent",
            color: value === opt.value ? THEME.cream : THEME.inkSoft,
          }}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
}

// Accessible modal: closes on Escape, traps Tab focus inside itself, and
// restores focus to whatever triggered it on close.
function Modal({ onClose, children, wide }) {
  const modalRef = useRef(null);
  const previouslyFocused = useRef(null);
  // Keep a ref to the latest onClose so the mount-only effect below can
  // always call the current handler without needing onClose in its
  // dependency array (see note below).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusFirst = () => {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelector(focusableSelector);
      if (focusable) focusable.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = Array.from(modalRef.current.querySelectorAll(focusableSelector));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
    // Intentionally run this once on mount/unmount only. The parent
    // components below pass an inline onClose/requestClose function that
    // gets recreated on every render (e.g. every keystroke while typing in
    // a form field). If onClose were in this dependency array, that would
    // re-run this effect on every keystroke, re-stealing focus to the
    // first focusable element in the modal — which is what was causing the
    // mobile on-screen keyboard to flicker open/closed while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(10,14,22,0.6)", animation: "fadeIn 0.15s ease-out" }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: THEME.card, animation: "riseIn 0.18s ease-out", boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}
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

function SetUserModal({ onClose, onSave, currentName }) {
  const [name, setName] = useState(currentName || "");
  const inputStyle = inputStyleFn();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }} className="flex items-center gap-2">
            <User size={20} color={THEME.gold} /> Set Author Name
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: THEME.inkSoft }}>
          Set your author name below to enable editing and deleting your posts.
        </p>
        <Field label="Your Author Name / ID" required>
          <input
            type="text"
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Perera"
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>Save Name</button>
        </div>
      </form>
    </Modal>
  );
}

function LoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputStyle = inputStyleFn();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setError("This account is not authorized as admin.");
        setSubmitting(false);
        return;
      }
      onLoginSuccess();
      onClose();
    } catch (err) {
      setError("Invalid admin email or password.");
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleLogin} className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }} className="flex items-center gap-2">
            <ShieldCheck size={20} color={THEME.gold} /> Admin Sign In
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: THEME.danger + "14", color: THEME.danger }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <Field label="Admin Email" required>
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Admin Password" required>
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
        </Field>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddOrEditEventModal({ onClose, onSubmit, initialData, currentUser, events }) {
  const inputStyle = inputStyleFn();
  const initialForm = initialData || {
    title: "",
    faculty: "",
    category: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    contact: "",
    postedBy: currentUser || "",
    posterUrl: "",
    description: "",
    tags: [],
    registrationLink: "",
    priceType: "free",
    mode: "offline",
  };
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const initialSnapshotRef = useRef(JSON.stringify(initialForm));

  // --- Duplicate-event detection state ---
  // `duplicates` holds any existing events that look like the same event as
  // what's currently in the form. Submitting shows the warning instead of
  // saving; the user can then edit the details or explicitly acknowledge
  // and post anyway. Editing the title/date after acknowledging resets the
  // acknowledgement so a real change is re-checked.
  const [duplicates, setDuplicates] = useState([]);
  const [dupAcknowledged, setDupAcknowledged] = useState(false);

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if ((k === "title" || k === "date") && dupAcknowledged) {
      setDupAcknowledged(false);
    }
  };

  const isDirty = () => JSON.stringify(form) !== initialSnapshotRef.current;

  const requestClose = () => {
    if (isDirty() && !window.confirm("Discard unsaved changes to this event?")) return;
    onClose();
  };

  const TAG_OPTIONS = ["Free food", "Certificates", "Open to all faculties", "Registration required"];
  const toggleTag = (tag) => {
    setForm((f) => {
      const tags = f.tags || [];
      return { ...f, tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] };
    });
  };

  const handlePosterFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Poster image must be under 8MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      // Resize + re-encode the image client-side, then store it as base64
      // directly on the event document (no Firebase Storage in this build).
      const compressed = await compressImage(file);
      const dataUrl = await fileToDataUrl(compressed);
      setForm((f) => ({ ...f, posterUrl: dataUrl }));
    } catch (err) {
      setError("Error processing image file. Please try a different image.");
    }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    // Only the registration link (if the user chose to enter one) is
    // validated for format. Every other field is optional — post with
    // whatever details are available and fill the rest in later.
    if (!isLikelyUrl(form.registrationLink)) {
      setError("Registration link should start with http:// or https://");
      return;
    }
    setError("");

    if (!dupAcknowledged) {
      const found = findLikelyDuplicates(form, events, initialData?.id);
      if (found.length > 0) {
        setDuplicates(found);
        return;
      }
    }
    setDuplicates([]);
    onSubmit(form);
  };

  const postAnyway = () => {
    setDupAcknowledged(true);
    setDuplicates([]);
    onSubmit(form);
  };

  return (
    <Modal onClose={requestClose} wide>
      <form onSubmit={submit} className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }}>
            {initialData ? "Edit Event" : "Post Event"}
          </h2>
          <button type="button" onClick={requestClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>
        <div className="px-4 sm:px-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: THEME.danger + "14", color: THEME.danger }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {duplicates.length > 0 && (
            <div
              className="mb-3 px-3 py-3 rounded-xl"
              style={{ backgroundColor: THEME.goldDeep + "16", border: `1px solid ${THEME.goldDeep}55` }}
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: THEME.goldDeep }}>
                <AlertCircle size={14} /> This looks similar to {duplicates.length === 1 ? "an event" : "events"} already posted
              </p>
              <div className="mt-2 space-y-1.5">
                {duplicates.slice(0, 3).map((d) => (
                  <div key={d.id} className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: THEME.ink }}>
                    <span className="font-semibold">{d.title}</span>
                    <span style={{ color: THEME.inkSoft }}>
                      {d.date ? formatDateLabel(d.date) : "no date"}{d.startTime ? ` · ${formatTime(d.startTime)}` : ""}{d.location ? ` · ${d.location}` : ""}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-2" style={{ color: THEME.inkSoft }}>
                If this is a genuinely different event, you can post it anyway. Otherwise, consider editing the existing post instead.
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={postAnyway}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: THEME.ink, color: THEME.cream }}
                >
                  It's different — post anyway
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicates([])}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ color: THEME.inkSoft, border: `1px solid ${THEME.line}` }}
                >
                  Let me edit it
                </button>
              </div>
            </div>
          )}
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: THEME.inkSoft }}>
            <AlertCircle size={13} /> Nothing below is required — fill in whatever details you have and post. You (or an admin) can always edit it later to add the rest.
          </p>
          <Field label="Event Title">
            <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="e.g. Annual Tech Symposium" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Faculty">
              <select style={inputStyle} value={form.faculty} onChange={set("faculty")}>
                <option value="">Select faculty</option>
                {FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select style={inputStyle} value={form.category} onChange={set("category")}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" style={inputStyle} value={form.date} onChange={set("date")} />
            </Field>
            <Field label="Organiser / Society">
              <input style={inputStyle} value={form.organizer} onChange={set("organizer")} placeholder="e.g. Students' Union" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time">
              <input type="time" style={inputStyle} value={form.startTime} onChange={set("startTime")} />
            </Field>
            <Field label="End Time">
              <input type="time" style={inputStyle} value={form.endTime} onChange={set("endTime")} />
            </Field>
          </div>
          <Field label="Location">
            <input style={inputStyle} value={form.location} onChange={set("location")} placeholder="e.g. Faculty of Arts – Lecture Hall 2" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Your Author Name">
              <input style={inputStyle} value={form.postedBy} onChange={set("postedBy")} placeholder="Your name (for edits)" />
            </Field>
            <Field label="Contact Details">
              <input style={inputStyle} value={form.contact || ""} onChange={set("contact")} placeholder="Email or phone (optional)" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Registration Link">
              <input style={inputStyle} value={form.registrationLink || ""} onChange={set("registrationLink")} placeholder="https://…" />
            </Field>
            <Field label="Pricing & Mode">
              <div className="flex gap-2">
                <select style={inputStyle} value={form.priceType || "free"} onChange={set("priceType")}>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                <select style={inputStyle} value={form.mode || "offline"} onChange={set("mode")}>
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </Field>
          </div>
          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const active = (form.tags || []).includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: active ? THEME.ink : "transparent",
                      color: active ? THEME.cream : THEME.inkSoft,
                      borderColor: active ? THEME.ink : THEME.line,
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Event Poster">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
                style={{ backgroundColor: THEME.line, color: THEME.ink }}
              >
                <Upload size={13} /> {uploading ? "Uploading…" : "Choose Image"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePosterFile} className="hidden" />
              {form.posterUrl && (
                <img src={form.posterUrl} alt="Poster preview" className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${THEME.line}` }} />
              )}
              {form.posterUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, posterUrl: "" }))} className="text-xs font-semibold" style={{ color: THEME.danger }}>
                  Remove
                </button>
              )}
            </div>
            <input
              style={{ ...inputStyle, marginTop: 8 }}
              value={form.posterUrl.startsWith("data:") ? "" : form.posterUrl}
              onChange={set("posterUrl")}
              placeholder="…or paste image link"
            />
          </Field>
          <Field label="Details">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="What should people know before coming?" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 sm:px-6" style={{ borderTop: `1px solid ${THEME.line}` }}>
          <button type="button" onClick={requestClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" disabled={uploading} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
            {initialData ? "Save Changes" : "Post Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReminderMenu({ ev, onClose }) {
  const [granted, setGranted] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const reminders = getReminders();
  const active = reminders[ev.id] || [];

  const OPTIONS = [
    { label: "1 Week Before", minutes: 7 * 24 * 60 },
    { label: "1 Day Before", minutes: 24 * 60 },
    { label: "12 Hours Before", minutes: 12 * 60 },
    { label: "1 Hour Before", minutes: 60 },
    { label: "15 Minutes Before", minutes: 15 },
  ];

  const toggle = async (minutes) => {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      setGranted(perm === "granted");
      if (perm !== "granted") return;
    }
    const all = getReminders();
    const set = new Set(all[ev.id] || []);
    if (set.has(minutes)) set.delete(minutes); else { set.add(minutes); scheduleLocalReminder(ev, minutes); }
    all[ev.id] = Array.from(set);
    saveReminders(all);
    onClose(Array.from(set));
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 z-20 rounded-2xl p-3 w-56"
      style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}`, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: THEME.inkSoft }}>Remind me</p>
      {!granted && (
        <p className="text-[10px] mb-2 flex items-center gap-1" style={{ color: THEME.inkSoft }}>
          <AlertCircle size={11} /> Browser notifications, tab must stay open
        </p>
      )}
      <div className="flex flex-col gap-1">
        {OPTIONS.map((o) => {
          const isOn = active.includes(o.minutes);
          return (
            <button
              key={o.minutes}
              onClick={() => toggle(o.minutes)}
              aria-pressed={isOn}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: isOn ? THEME.gold + "22" : "transparent", color: isOn ? THEME.goldDeep : THEME.ink }}
            >
              {o.label} {isOn && <Check size={13} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommentItem({ c, replies, onReply, onReact, anonId }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyName, setReplyName] = useState("");
  const reactions = c.reactions || {};

  return (
    <div className="mb-3">
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
          {(c.author || "A").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 text-xs flex-1">
          <p><span className="font-semibold" style={{ color: THEME.ink }}>{c.author}</span></p>
          <p style={{ color: THEME.ink }}>{c.text}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {REACTION_EMOJIS.map((emo) => {
              const list = reactions[emo] || [];
              const active = list.includes(anonId);
              return (
                <button
                  key={emo}
                  onClick={() => onReact(c.id, emo)}
                  aria-label={`React with ${emo}`}
                  aria-pressed={active}
                  className="text-[11px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ backgroundColor: active ? THEME.gold + "2a" : "transparent", border: `1px solid ${active ? THEME.goldDeep : THEME.line}` }}
                >
                  {emo} {list.length > 0 && <span style={{ color: THEME.inkSoft, fontSize: 10 }}>{list.length}</span>}
                </button>
              );
            })}
            <button onClick={() => setShowReply((v) => !v)} className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: THEME.inkSoft }}>
              <Reply size={11} /> Reply
            </button>
          </div>
          {showReply && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (!replyName.trim() || !replyText.trim()) return; onReply(c.id, replyName.trim(), replyText.trim()); setReplyText(""); setShowReply(false); }}
              className="flex flex-col sm:flex-row gap-1.5 mt-2"
            >
              <input value={replyName} onChange={(e) => setReplyName(e.target.value)} placeholder="Your name" style={{ ...inputStyleFn(), fontSize: 12, padding: "6px 10px" }} />
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Reply to ${c.author}…`} style={{ ...inputStyleFn(), fontSize: 12, padding: "6px 10px" }} />
              <button type="submit" className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>Reply</button>
            </form>
          )}
          {replies.length > 0 && (
            <div className="mt-2 pl-3 space-y-2" style={{ borderLeft: `2px solid ${THEME.line}` }}>
              {replies.map((r) => (
                <div key={r.id} className="text-xs">
                  <span className="font-semibold" style={{ color: THEME.ink }}>{r.author}</span>{" "}
                  <span style={{ color: THEME.ink }}>{r.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({ ev, onClose, onComment, onReact, onDelete, onEdit, isAdmin, currentUser, onPromptSetUser, isBookmarked, onToggleBookmark, isLiked, onToggleLike }) {
  const [name, setName] = useState(currentUser || "");
  const [text, setText] = useState("");
  const [commentSort, setCommentSort] = useState("newest");
  const [shareOpen, setShareOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const anonId = getAnonId();
  const f = facultyOf(ev.faculty);
  const c = categoryOf(ev.category);
  const allComments = ev.comments || [];
  const topLevel = allComments.filter((cm) => !cm.parentId);
  const repliesOf = (id) => allComments.filter((cm) => cm.parentId === id);
  const sortedTop = [...topLevel].sort((a, b) => {
    if (commentSort === "popular") {
      const score = (x) => Object.values(x.reactions || {}).reduce((s, arr) => s + arr.length, 0);
      return score(b) - score(a);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  const tags = ev.tags || [];

  const isAuthor = Boolean(currentUser && ev.postedBy && currentUser.trim().toLowerCase() === ev.postedBy.trim().toLowerCase());
  const canModify = isAdmin || isAuthor;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onComment(ev.id, { id: uid(), author: name.trim(), text: text.trim(), createdAt: Date.now(), parentId: null, reactions: {} });
    setText("");
  };
  const submitReply = (parentId, author, replyText) => {
    onComment(ev.id, { id: uid(), author, text: replyText, createdAt: Date.now(), parentId, reactions: {} });
  };
  const react = (commentId, emoji) => onReact(ev.id, commentId, emoji, anonId);

  return (
    <Modal onClose={onClose} wide>
      <div className="overflow-y-auto max-h-[85vh]">
        <div style={{ background: `linear-gradient(135deg, ${f.color}20, ${THEME.card})` }} className="p-4 sm:p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <FacultySeal faculty={ev.faculty} size="sm" />
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: f.color, fontFamily: "'IBM Plex Mono', monospace" }} title={f.name}>{f.name}</span>
              {c && <CategoryBadge category={ev.category} />}
            </div>
            <div className="flex items-center gap-1">
              {canModify ? (
                <>
                  <button onClick={() => onEdit(ev)} className="p-1.5 rounded-full hover:bg-black/5" aria-label="Edit event" title="Edit event">
                    <Edit size={16} color={THEME.ink} />
                  </button>
                  <button onClick={() => onDelete(ev.id)} className="p-1.5 rounded-full hover:bg-black/5" aria-label="Delete event" title="Remove event">
                    <Trash2 size={16} color={THEME.danger} />
                  </button>
                </>
              ) : (
                <button
                  onClick={onPromptSetUser}
                  className="text-[11px] px-2 py-1 rounded-full border border-dashed flex items-center gap-1"
                  style={{ borderColor: THEME.line, color: THEME.inkSoft }}
                >
                  <User size={11} /> Edit
                </button>
              )}
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
                <X size={18} color={THEME.inkSoft} />
              </button>
            </div>
          </div>
          <h2 className="mt-3 pb-1" style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{ev.title}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs" style={{ color: THEME.inkSoft }}>
            <span className="flex items-center gap-1"><Calendar size={13} /> {formatDateLabel(ev.date)}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}</span>
            <span className="flex items-center gap-1"><MapPin size={13} /> {ev.location}</span>
            <span className="flex items-center gap-1"><Users size={13} /> {ev.organizer}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {ev.views || 0} views</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {ev.priceType && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: THEME.ink + "0d", color: THEME.ink }}>
                <Ticket size={11} /> {ev.priceType === "paid" ? "Paid" : "Free"}
              </span>
            )}
            {ev.mode && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: THEME.ink + "0d", color: THEME.ink }}>
                {ev.mode === "online" ? <Globe size={11} /> : <MapPinned size={11} />} {ev.mode === "online" ? "Online" : "In person"}
              </span>
            )}
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: THEME.ink + "0d", color: THEME.ink }}>
                {tag}
              </span>
            ))}
          </div>

          {!isPastEvent(ev) && <CountdownTimer ev={ev} />}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={() => onToggleLike(ev)}
              aria-label={isLiked ? "Unlike this event" : "Like this event"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ color: isLiked ? "#fff" : THEME.danger, backgroundColor: isLiked ? THEME.danger : THEME.danger + "14" }}
            >
              <Heart size={13} fill={isLiked ? "#fff" : "none"} /> {(ev.likes || []).length} Like{(ev.likes || []).length !== 1 ? "s" : ""}
            </button>
            <button
              onClick={() => onToggleBookmark(ev.id)}
              aria-label={isBookmarked ? "Remove from saved events" : "Save event"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ color: isBookmarked ? THEME.ink : THEME.goldDeep, backgroundColor: isBookmarked ? THEME.gold : THEME.gold + "22" }}
            >
              <Bookmark size={13} fill={isBookmarked ? THEME.ink : "none"} /> {isBookmarked ? "Saved" : "Save"}
            </button>
            <button onClick={() => downloadIcsForEvent(ev)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: THEME.line, color: THEME.ink }}>
              <Download size={13} /> Add to Calendar
            </button>
            <div className="relative">
              <button onClick={() => setReminderOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: THEME.line, color: THEME.ink }}>
                <Bell size={13} /> Remind Me
              </button>
              {reminderOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setReminderOpen(false)} />
                  <ReminderMenu ev={ev} onClose={() => setReminderOpen(false)} />
                </>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShareOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: THEME.line, color: THEME.ink }}>
                <Share2 size={13} /> Share
              </button>
              {shareOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
                  <ShareMenu ev={ev} onClose={() => setShareOpen(false)} />
                </>
              )}
            </div>
            {ev.registrationLink && (
              <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-auto" style={{ backgroundColor: f.color, color: "#fff" }}>
                <Ticket size={13} /> Register Now
              </a>
            )}
          </div>
        </div>

        {ev.posterUrl && (
          <div className="w-full bg-black/20 flex items-center justify-center p-2">
            <img src={ev.posterUrl} alt={`Poster for ${ev.title}`} className="w-full max-h-[400px] object-contain rounded-lg" onError={(e) => { e.target.style.display = "none"; }} />
          </div>
        )}

        <div className="p-4 sm:p-6">
          <p style={{ color: THEME.ink, lineHeight: 1.5, fontSize: 14 }}>{ev.description || "No further details provided."}</p>
          <p className="text-xs mt-3" style={{ color: THEME.inkSoft }}>Posted by <strong style={{ color: THEME.ink }}>{ev.postedBy}</strong></p>
          {ev.contact && <p className="text-xs mt-1" style={{ color: THEME.inkSoft }}>Contact: <strong style={{ color: THEME.ink }}>{ev.contact}</strong></p>}
          {ev.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
              style={{ color: THEME.goldDeep }}
            >
              <MapPinned size={13} /> View on Google Maps
            </a>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-6" style={{ borderTop: `1px solid ${THEME.line}` }}>
          <div className="flex items-center justify-between mt-4 mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: THEME.inkSoft }}>
              <MessageCircle size={13} /> {topLevel.length} comment{topLevel.length !== 1 ? "s" : ""}
            </h3>
            <button
              onClick={() => setCommentSort((s) => (s === "newest" ? "popular" : "newest"))}
              className="text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ color: THEME.inkSoft, border: `1px solid ${THEME.line}` }}
            >
              <SlidersHorizontal size={11} /> {commentSort === "newest" ? "Newest" : "Most liked"}
            </button>
          </div>
          <div className="space-y-1 mb-4 max-h-56 overflow-y-auto pr-1">
            {sortedTop.length === 0 && (
              <p className="text-xs" style={{ color: THEME.inkSoft }}>No comments yet.</p>
            )}
            {sortedTop.map((cm) => (
              <CommentItem key={cm.id} c={cm} replies={repliesOf(cm.id)} onReply={submitReply} onReact={react} anonId={anonId} />
            ))}
          </div>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <input style={{ ...inputStyleFn(), fontSize: 13 }} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={{ ...inputStyleFn(), fontSize: 13 }} placeholder="Add a comment" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>Post</button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

function CalendarView({ events, month, setMonth, year, setYear, onOpen }) {
  const cells = monthMatrix(year, month);
  const [selectedDate, setSelectedDate] = useState(null);

  const byDate = useMemo(() => {
    const map = {};
    events.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }, [events]);

  const goMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y); setSelectedDate(null);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const dayList = selectedDate ? (byDate[selectedDate] || []).sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: THEME.ink, fontWeight: 600 }}>
          {new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => goMonth(-1)} aria-label="Previous month" className="p-1.5 rounded-full hover:bg-black/5"><ChevronLeft size={16} color={THEME.ink} /></button>
          <button onClick={() => goMonth(1)} aria-label="Next month" className="p-1.5 rounded-full hover:bg-black/5"><ChevronRight size={16} color={THEME.ink} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-semibold uppercase tracking-wide" style={{ color: THEME.inkSoft }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;
          const dayEvents = byDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateStr)}
              aria-label={`${dateStr}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}` : ""}`}
              className="aspect-square rounded-lg flex flex-col items-center justify-start pt-1 gap-0.5 transition-colors"
              style={{
                backgroundColor: isSelected ? THEME.ink : isToday ? THEME.gold + "22" : "transparent",
                border: `1px solid ${isSelected ? THEME.ink : THEME.line}`,
              }}
            >
              <span className="text-xs font-medium" style={{ color: isSelected ? THEME.cream : THEME.ink }}>{d}</span>
              <div className="flex flex-wrap gap-0.5 justify-center px-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span key={e.id} style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: facultyOf(e.faculty).color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: THEME.inkSoft }}>
            {formatDateLabel(selectedDate)}
          </h4>
          {dayList.length === 0 ? (
            <p className="text-xs" style={{ color: THEME.inkSoft }}>No events on this day.</p>
          ) : (
            <div className="space-y-2">
              {dayList.map((e) => <EventCard key={e.id} ev={e} onOpen={onOpen} isBookmarked={false} onToggleBookmark={() => {}} isLiked={false} onToggleLike={() => {}} isTrending={false} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Optimized Header Background with Lighter, Vastu Area Animations and Periodic Shiny Sparkle Effects
function HeaderGlow() {
  const desktopLaserBeams = [
    { angle: 12, top: "-30%", left: "-10%", width: "150%", coreThickness: 2, coneWidth: 120, opacity: 0.35, duration: "12s", delay: "0s" },
    { angle: 22, top: "-40%", left: "-20%", width: "160%", coreThickness: 2.5, coneWidth: 140, opacity: 0.4, duration: "15s", delay: "-4s" },
  ];

  const mobileLaserBeams = [
    { angle: 15, top: "-25%", left: "-15%", width: "140%", coreThickness: 1.5, coneWidth: 90, opacity: 0.3, duration: "10s", delay: "0s" },
  ];

  const shinySparkles = [
    { top: "25%", left: "18%", size: "4px", duration: "4s", delay: "0s" },
    { top: "65%", left: "45%", size: "5px", duration: "5s", delay: "1.5s" },
    { top: "35%", left: "75%", size: "4px", duration: "4.5s", delay: "0.8s" },
    { top: "70%", left: "88%", size: "6px", duration: "6s", delay: "2s" },
    { top: "20%", left: "55%", size: "3.5px", duration: "3.8s", delay: "2.5s" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Dark Ambient Background Gradient */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 20% -20%, #02233b 0%, #05080e 70%, #030509 100%)",
        }}
      />

      {/* Atmospheric Soft Cyan Bloom */}
      <div
        style={{
          position: "absolute",
          top: "-80px", left: "-60px",
          width: "450px", height: "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, rgba(0, 119, 255, 0.08) 50%, transparent 80%)",
          filter: "blur(45px)",
          animation: "cyanPointPulse 7s ease-in-out infinite alternate",
        }}
      />

      {/* DESKTOP LIGHTER WIDE LASER BEAMS */}
      <div className="hidden sm:block absolute inset-0">
        {desktopLaserBeams.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              width: b.width,
              transformOrigin: "0% 0%",
              transform: `rotate(${b.angle}deg)`,
              animation: `laserSweep ${b.duration} ease-in-out ${b.delay} infinite alternate`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: `-${b.coneWidth / 2}px`,
                left: 0,
                width: "100%",
                height: `${b.coneWidth}px`,
                background: "linear-gradient(90deg, rgba(0,212,255,0.3) 0%, rgba(0,183,255,0.1) 35%, rgba(0,102,255,0.02) 70%, transparent 100%)",
                filter: "blur(25px)",
                opacity: b.opacity,
                clipPath: "polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: `-${b.coreThickness / 2}px`,
                left: 0,
                width: "100%",
                height: `${b.coreThickness}px`,
                background: "linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(0,229,255,0.4) 30%, transparent 90%)",
                boxShadow: "0 0 8px rgba(0,229,255,0.3)",
              }}
            />
          </div>
        ))}
      </div>

      {/* MOBILE LIGHTER WIDE LASER BEAMS */}
      <div className="block sm:hidden absolute inset-0">
        {mobileLaserBeams.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              width: b.width,
              transformOrigin: "0% 0%",
              transform: `rotate(${b.angle}deg)`,
              animation: `laserSweep ${b.duration} ease-in-out ${b.delay} infinite alternate`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: `-${b.coneWidth / 2}px`,
                left: 0,
                width: "100%",
                height: `${b.coneWidth}px`,
                background: "linear-gradient(90deg, rgba(0,212,255,0.25) 0%, rgba(0,183,255,0.08) 40%, transparent 100%)",
                filter: "blur(20px)",
                opacity: b.opacity,
                clipPath: "polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: `-${b.coreThickness / 2}px`,
                left: 0,
                width: "100%",
                height: `${b.coreThickness}px`,
                background: "linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(0,229,255,0.3) 35%, transparent 85%)",
              }}
            />
          </div>
        ))}
      </div>

      {/* TIME-TO-TIME SHINY SPARKLES */}
      {shinySparkles.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "0 0 8px 2px rgba(0, 229, 255, 0.8), 0 0 15px 4px rgba(255, 255, 255, 0.6)",
            animation: `shinySparkleAnimation ${s.duration} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}

      {/* Atmospheric Smoke Particle Flow Layer */}
      <div
        className="cyan-volumetric-haze"
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 20% 10%, rgba(0, 229, 255, 0.08) 0%, transparent 65%)",
          animation: "hazeFlow 12s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

function ThemeToggle({ mode, setMode }) {
  const opts = [
    { m: "light", icon: <Sun size={13} />, label: "Light theme" },
    { m: "dark", icon: <Moon size={13} />, label: "Dark theme" },
    { m: "system", icon: <Monitor size={13} />, label: "Match system theme" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-full p-1" style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
      {opts.map((o) => (
        <button
          key={o.m}
          onClick={() => setMode(o.m)}
          aria-label={o.label}
          aria-pressed={mode === o.m}
          className="p-1.5 rounded-full transition-colors"
          style={{ backgroundColor: mode === o.m ? THEME.gold : "transparent", color: mode === o.m ? "#1B2740" : "#E2E8F0" }}
          title={o.m}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

// Small, unobtrusive copyright mark pinned to the bottom-right of the
// viewport across every view (list, calendar, saved).
function CopyrightBadge() {
  return (
    <div
      className="fixed bottom-14 sm:bottom-3 right-3 z-30 select-none pointer-events-none"
      style={{
        fontSize: 10,
        fontFamily: "'IBM Plex Mono', monospace",
        color: THEME.inkSoft,
        backgroundColor: THEME.card + "d9",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${THEME.line}`,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      © {new Date().getFullYear()} Chathil Malsen
    </div>
  );
}

// Shiny metallic "Campus Connect" wordmark to match the printed banner —
// silver "Campus" + gold "Connect", with a diagonal light sweep.
function ShinyLogoText({ sizeClass }) {
  return (
    <span className={`inline-flex items-baseline ${sizeClass}`} style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>
      <span className="shiny-word shiny-silver">Campus</span>
      <span className="shiny-word shiny-gold" style={{ marginLeft: 4 }}>Connect</span>
    </span>
  );
}

// Regular-user sign in / sign up, using the SAME Firebase Auth project as
// the admin login above — this just isn't restricted to ADMIN_EMAIL. Any
// student can create an account here to file or track Lost & Found /
// Facility Issue reports.
function UserAuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputStyle = inputStyleFn();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter an email and password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const map = {
        "auth/email-already-in-use": "That email is already registered — try signing in instead.",
        "auth/invalid-email": "That doesn't look like a valid email address.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      setError(map[err.code] || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }} className="flex items-center gap-2">
            {mode === "login" ? <LogIn size={20} color={THEME.gold} /> : <UserPlus size={20} color={THEME.gold} />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: THEME.inkSoft }}>
          Sign in to report or track Lost &amp; Found and Facility Issue tickets.
        </p>
        {error && (
          <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: THEME.danger + "14", color: THEME.danger }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {mode === "signup" && (
          <Field label="Full Name" required>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chath Perera" />
          </Field>
        )}
        <Field label="Email" required>
          <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" />
        </Field>
        <Field label="Password" required>
          <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </Field>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: THEME.inkSoft }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="font-semibold" style={{ color: THEME.goldDeep }}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </form>
    </Modal>
  );
}

function ReportTicketModal({ onClose, onSubmit, authUser, defaultType }) {
  const inputStyle = inputStyleFn();
  const [form, setForm] = useState({
    type: defaultType || "lost",
    title: "",
    description: "",
    location: "",
    contact: "",
    photoUrl: "",
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhotoFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Photo must be under 8MB."); return; }
    setUploading(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      const dataUrl = await fileToDataUrl(compressed);
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } catch {
      setError("Error processing image file. Please try a different image.");
    }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    // Report type always has a default, but title/location/description/
    // contact/photo are all optional — submit with whatever is filled in.
    setError("");
    onSubmit(form);
  };

  const typeInfo = ticketTypeOf(form.type);

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }}>
            New Report
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>
        <div className="px-4 sm:px-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: THEME.danger + "14", color: THEME.danger }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: THEME.inkSoft }}>
            <AlertCircle size={13} /> Nothing below is required — submit with whatever details you have.
          </p>
          <Field label="Report Type">
            <div className="flex flex-wrap gap-2">
              {TICKET_TYPES.map((t) => {
                const active = form.type === t.id;
                const Icon = t.icon;
                return (
                  <button
                    type="button" key={t.id}
                    onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                    aria-pressed={active}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={{ backgroundColor: active ? t.color : t.color + "14", color: active ? "#fff" : t.color, borderColor: active ? t.color : "transparent" }}
                  >
                    <Icon size={13} /> {t.name}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={form.type === "facility" ? "Issue Title" : "Item Title"}>
            <input style={inputStyle} value={form.title} onChange={set("title")} placeholder={form.type === "facility" ? "e.g. Broken AC in Lecture Hall 3" : "e.g. Student ID card"} />
          </Field>
          <Field label="Location">
            <input style={inputStyle} value={form.location} onChange={set("location")} placeholder="e.g. Common room, Faculty of Engineering" />
          </Field>
          <Field label="Contact Details">
            <input style={inputStyle} value={form.contact} onChange={set("contact")} placeholder="Email or phone so people can reach you (optional)" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Any extra detail that helps identify the item or issue" />
          </Field>
          <Field label="Photo">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
                style={{ backgroundColor: THEME.line, color: THEME.ink }}
              >
                <Upload size={13} /> {uploading ? "Uploading…" : "Choose Image"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
              {form.photoUrl && <img src={form.photoUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${THEME.line}` }} />}
              {form.photoUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))} className="text-xs font-semibold" style={{ color: THEME.danger }}>Remove</button>
              )}
            </div>
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 sm:px-6" style={{ borderTop: `1px solid ${THEME.line}` }}>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" disabled={uploading} className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: typeInfo.color, color: "#fff" }}>
            <Send size={14} /> Submit Report
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TicketCard({ t, onOpen }) {
  const type = ticketTypeOf(t.type);
  const status = ticketStatusOf(t.status);
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;
  return (
    <button
      onClick={() => onOpen(t)}
      className="text-left w-full rounded-2xl overflow-hidden p-3.5 sm:p-4 flex gap-3 sm:gap-4 items-start sm:items-center active:scale-[0.99] hover:-translate-y-0.5 transition-transform"
      style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}`, borderLeft: `5px solid ${type.color}` }}
    >
      {t.photoUrl ? (
        <img src={t.photoUrl} alt={`Photo for ${t.title}`} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid ${THEME.line}` }} loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
      ) : (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${type.color}22, ${type.color}0a)` }}>
          <TypeIcon size={22} color={type.color} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ color: type.color, backgroundColor: type.color + "14" }}>{type.name}</span>
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1" style={{ color: status.color, backgroundColor: status.color + "14" }}>
            <StatusIcon size={10} /> {status.name}
          </span>
        </div>
        <h3 className="font-semibold leading-tight truncate" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif", fontSize: 15 }}>{t.title || "(untitled report)"}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] sm:text-xs" style={{ color: THEME.inkSoft }}>
          <span className="flex items-center gap-1"><MapPin size={12} /> {t.location || "Location not specified"}</span>
          <span>Reported by {t.reportedBy || "Anonymous"}</span>
          <span>{formatTicketDate(t.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

function TicketDetailModal({ t, onClose, onUpdateStatus, onDelete, isAdmin, authUser }) {
  const type = ticketTypeOf(t.type);
  const status = ticketStatusOf(t.status);
  const TypeIcon = type.icon;
  const isOwner = Boolean(authUser && t.reporterUid && authUser.uid === t.reporterUid);
  const canModify = isAdmin || isOwner;

  return (
    <Modal onClose={onClose} wide>
      <div className="overflow-y-auto max-h-[85vh]">
        <div style={{ background: `linear-gradient(135deg, ${type.color}20, ${THEME.card})` }} className="p-4 sm:p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color + "18" }}><TypeIcon size={17} color={type.color} /></span>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: type.color }}>{type.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {canModify && (
                <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-full hover:bg-black/5" aria-label="Delete report" title="Delete report">
                  <Trash2 size={16} color={THEME.danger} />
                </button>
              )}
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={THEME.inkSoft} /></button>
            </div>
          </div>
          <h2 className="mt-3 pb-1" style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{t.title || "(untitled report)"}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs" style={{ color: THEME.inkSoft }}>
            <span className="flex items-center gap-1"><MapPin size={13} /> {t.location || "Location not specified"}</span>
            <span className="flex items-center gap-1"><Users size={13} /> {t.reportedBy || "Anonymous"}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {formatTicketDate(t.createdAt)}</span>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: THEME.inkSoft }}>Status</p>
            {canModify ? (
              <div className="flex flex-wrap gap-1.5">
                {TICKET_STATUSES.map((s) => {
                  const active = t.status === s.id;
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => onUpdateStatus(t.id, s.id)} aria-pressed={active} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: active ? s.color : s.color + "14", color: active ? "#fff" : s.color }}>
                      <Icon size={13} /> {s.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: status.color + "14", color: status.color }}>
                <status.icon size={13} /> {status.name}
              </span>
            )}
          </div>
        </div>

        {t.photoUrl && (
          <div className="w-full bg-black/20 flex items-center justify-center p-2">
            <img src={t.photoUrl} alt={`Photo for ${t.title}`} className="w-full max-h-[400px] object-contain rounded-lg" onError={(e) => { e.target.style.display = "none"; }} />
          </div>
        )}

        <div className="p-4 sm:p-6">
          <p style={{ color: THEME.ink, lineHeight: 1.5, fontSize: 14 }}>{t.description || "No further details provided."}</p>
          {t.contact && <p className="text-xs mt-3" style={{ color: THEME.inkSoft }}>Contact: <strong style={{ color: THEME.ink }}>{t.contact}</strong></p>}
          {!canModify && !t.contact && (
            <p className="text-xs mt-3" style={{ color: THEME.inkSoft }}>No contact details were shared. Reach out via the admin if you think this matches something of yours.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function LostFoundSection({ tickets, loading, authUser, isAdmin, onOpenTicket, onRequestAuth, onOpenReport, onSignOut }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = { total: tickets.length, open: 0, in_progress: 0, resolved: 0 };
    tickets.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${t.title} ${t.description} ${t.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [tickets, typeFilter, statusFilter, search]);

  const startReport = (type) => {
    if (!authUser) { onRequestAuth(); return; }
    onOpenReport(type);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest" style={{ color: THEME.goldDeep, fontFamily: "'IBM Plex Mono', monospace" }}>
          LOST &amp; FOUND · FACILITY ISSUES
        </p>
        {authUser ? (
          <button onClick={onSignOut} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: THEME.inkSoft, border: `1px solid ${THEME.line}` }}>
            <User size={12} /> {authUser.displayName || authUser.email} <LogOut size={12} />
          </button>
        ) : (
          <button onClick={onRequestAuth} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: THEME.ink, border: `1px solid ${THEME.line}` }}>
            <LogIn size={12} /> Sign in
          </button>
        )}
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4.5vw, 34px)", color: THEME.ink, fontWeight: 600, lineHeight: 1.15, maxWidth: 720 }}>
        Lost something? Found something? Something broken on campus?
      </h1>
      <p className="mt-2.5 max-w-xl text-xs sm:text-sm" style={{ color: THEME.inkSoft, lineHeight: 1.5 }}>
        One portal for Lost &amp; Found and facility/equipment issues, right inside Campus Connect.
      </p>

      <div className="flex flex-wrap gap-2 mt-5">
        <button onClick={() => startReport("lost")} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: "#B0334D", color: "#fff" }}>
          <PackageSearch size={15} /> Report Lost Item
        </button>
        <button onClick={() => startReport("found")} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: "#1E8A5C", color: "#fff" }}>
          <PackageSearch size={15} /> Report Found Item
        </button>
        <button onClick={() => startReport("facility")} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: "#A9820F", color: "#fff" }}>
          <Wrench size={15} /> Report Facility Issue
        </button>
      </div>

      <div className="flex flex-wrap gap-5 mt-5">
        <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: THEME.ink, fontWeight: 600 }}>{counts.total}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>total reports</span></div>
        <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#B0334D", fontWeight: 600 }}>{counts.open || 0}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>open</span></div>
        <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#A9820F", fontWeight: 600 }}>{counts.in_progress || 0}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>in progress</span></div>
        <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#1E8A5C", fontWeight: 600 }}>{counts.resolved || 0}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>resolved</span></div>
      </div>

      <div className="mt-6">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={THEME.inkSoft} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" aria-label="Search reports" style={{ ...inputStyleFn(), paddingLeft: 32 }} />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
          <button onClick={() => setTypeFilter("all")} aria-pressed={typeFilter === "all"} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ backgroundColor: typeFilter === "all" ? THEME.ink : THEME.line + "88", color: typeFilter === "all" ? THEME.cream : THEME.inkSoft }}>All types</button>
          {TICKET_TYPES.map((t) => (
            <button key={t.id} onClick={() => setTypeFilter(t.id)} aria-pressed={typeFilter === t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ backgroundColor: typeFilter === t.id ? t.color : t.color + "14", color: typeFilter === t.id ? "#fff" : t.color }}>
              {t.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4">
          <button onClick={() => setStatusFilter("all")} aria-pressed={statusFilter === "all"} className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0" style={{ backgroundColor: statusFilter === "all" ? THEME.goldDeep : THEME.line + "88", color: statusFilter === "all" ? "#fff" : THEME.inkSoft }}>All statuses</button>
          {TICKET_STATUSES.map((s) => (
            <button key={s.id} onClick={() => setStatusFilter(s.id)} aria-pressed={statusFilter === s.id} className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0" style={{ backgroundColor: statusFilter === s.id ? s.color : s.color + "14", color: statusFilter === s.id ? "#fff" : s.color }}>
              {s.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs py-10 text-center" style={{ color: THEME.inkSoft }}>Loading reports…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={28} color={THEME.inkSoft} className="mx-auto mb-2" />
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: THEME.ink }}>Nothing here yet</p>
            <p className="text-xs mt-1" style={{ color: THEME.inkSoft }}>Be the first to file a report, or adjust your filters.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((t) => <TicketCard key={t.id} t={t} onOpen={onOpenTicket} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// Persistent bottom navigation bar, visible at every viewport size, so
// switching between the Events board and Lost & Found / Facility Issues
// feels like one app instead of two.
function BottomNav({ section, setSection, isAdmin }) {
  const items = [
    { id: "events", label: "Events", icon: Home },
    { id: "lostfound", label: "Lost & Found", icon: PackageSearch },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        backgroundColor: THEME.headerBg,
        borderTop: `1px solid rgba(255,255,255,0.1)`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.35)",
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = section === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setSection(it.id)}
            aria-pressed={active}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: active ? "#00e5ff" : "#94A3B8" }}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-semibold">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [section, setSection] = useState("events"); // "events" | "lostfound"

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null); // any signed-in Firebase user (regular or admin)
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showReportTicket, setShowReportTicket] = useState(false);
  const [reportDefaultType, setReportDefaultType] = useState("lost");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [quickDate, setQuickDate] = useState("any");
  const [priceFilter, setPriceFilter] = useState("any");
  const [modeFilter, setModeFilter] = useState("any");
  const [regOnly, setRegOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("cg_user_name") || "");
  const [bookmarks, setBookmarks] = useState(getBookmarks());

  const [themeMode, setThemeModeState] = useState(localStorage.getItem("cg_theme_mode") || "light");
  const [systemDark, setSystemDark] = useState(
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );

  // Debounce search so every keystroke doesn't re-filter the whole list.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
  }, []);

  const setThemeMode = (m) => { localStorage.setItem("cg_theme_mode", m); setThemeModeState(m); };
  const effectiveDark = themeMode === "dark" || (themeMode === "system" && systemDark);
  THEME = effectiveDark ? DARK_THEME : LIGHT_THEME;

  const anonId = getAnonId();
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const handleSaveUserName = (name) => {
    localStorage.setItem("cg_user_name", name);
    setCurrentUser(name);
  };

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveBookmarks(next);
      return next;
    });
  };

  const toggleLike = async (ev) => {
    try {
      const eventRef = doc(db, "events", ev.id);
      const liked = (ev.likes || []).includes(anonId);
      await updateDoc(eventRef, { likes: liked ? arrayRemove(anonId) : arrayUnion(anonId) });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const recordView = async (ev) => {
    try {
      const seen = JSON.parse(sessionStorage.getItem("cg_viewed") || "[]");
      if (seen.includes(ev.id)) return;
      seen.push(ev.id);
      sessionStorage.setItem("cg_viewed", JSON.stringify(seen));
      await updateDoc(doc(db, "events", ev.id), { views: increment(1) });
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const openEvent = (ev) => {
    setSelectedEvent(ev);
    recordView(ev);
  };

  useEffect(() => {
    if (loading || events.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("event");
    if (id) {
      const ev = events.find((e) => e.id === id);
      if (ev) openEvent(ev);
    }
  }, [loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(Boolean(user && user.email === ADMIN_EMAIL));
      setAuthUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  const handleUserSignOut = async () => {
    await signOut(auth);
    setAuthUser(null);
  };

  // Live Lost & Found / Facility Issue tickets, same Firestore project as events.
  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTicketsLoading(false);
    }, (error) => {
      console.error("Firestore error (tickets):", error);
      setTicketsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addTicket = async (form) => {
    try {
      await addDoc(collection(db, "tickets"), {
        ...form,
        status: "open",
        reportedBy: authUser?.displayName || authUser?.email || "Anonymous",
        reporterUid: authUser?.uid || null,
        reporterEmail: authUser?.email || null,
        createdAt: Date.now(),
      });
      setShowReportTicket(false);
    } catch (error) {
      console.error("Error adding ticket:", error);
      alert("Could not submit report. Please try again.");
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), { status });
      setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, status } : prev));
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const deleteTicket = async (ticketId) => {
    const t = tickets.find((x) => x.id === ticketId);
    if (!window.confirm(`Delete "${t ? t.title : "this report"}"?`)) return;
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addEvent = async (ev) => {
    try {
      // postedBy is now optional too — only remember it as the author name
      // for next time if the user actually filled it in.
      if (ev.postedBy) handleSaveUserName(ev.postedBy);
      await addDoc(collection(db, "events"), {
        ...ev,
        views: 0,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });
      setShowAdd(false);
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Could not save event. Please try again.");
    }
  };

  const updateEvent = async (ev) => {
    try {
      const eventRef = doc(db, "events", ev.id);
      await updateDoc(eventRef, ev);
      setEditingEvent(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const addComment = async (eventId, comment) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        comments: arrayUnion(comment)
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Runs as a Firestore transaction so two people reacting to the same
  // comment at nearly the same instant can't silently overwrite each other.
  const reactToComment = async (eventId, commentId, emoji, uidStr) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(eventRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const comments = (data.comments || []).map((c) => {
          if (c.id !== commentId) return c;
          const reactions = { ...(c.reactions || {}) };
          const list = new Set(reactions[emoji] || []);
          if (list.has(uidStr)) list.delete(uidStr); else list.add(uidStr);
          reactions[emoji] = Array.from(list);
          return { ...c, reactions };
        });
        transaction.update(eventRef, { comments });
      });
    } catch (error) {
      console.error("Error reacting to comment:", error);
    }
  };

  const deleteEvent = async (eventId) => {
    const ev = events.find((e) => e.id === eventId);
    if (!window.confirm(`Delete "${ev ? ev.title : "this event"}"?`)) return;
    try {
      await deleteDoc(doc(db, "events", eventId));
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const filtered = useMemo(() => {
    const today = new Date();
    return events.filter((e) => {
      if (view === "saved" && !bookmarks.includes(e.id)) return false;
      if (facultyFilter !== "all" && e.faculty !== facultyFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (timeFilter === "upcoming" && isPastEvent(e)) return false;
      if (timeFilter === "past" && !isPastEvent(e)) return false;
      if (priceFilter !== "any" && (e.priceType || "free") !== priceFilter) return false;
      if (modeFilter !== "any" && (e.mode || "offline") !== modeFilter) return false;
      if (regOnly && !e.registrationLink) return false;
      if (quickDate !== "any") {
        const d = eventDateTime(e);
        if (quickDate === "today" && !sameYMD(d, today)) return false;
        if (quickDate === "tomorrow") {
          const t = new Date(today); t.setDate(t.getDate() + 1);
          if (!sameYMD(d, t)) return false;
        }
        if (quickDate === "week") {
          const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (d < today || d > weekAhead) return false;
        }
        if (quickDate === "month") {
          if (d.getFullYear() !== today.getFullYear() || d.getMonth() !== today.getMonth()) return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${e.title} ${e.description} ${e.organizer} ${e.location} ${categoryOf(e.category)?.name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => eventDateTime(a) - eventDateTime(b));
  }, [events, facultyFilter, categoryFilter, timeFilter, search, view, bookmarks, priceFilter, modeFilter, regOnly, quickDate]);

  const grouped = useMemo(() => {
    const months = [];
    let curMonth = null, curDay = null;
    filtered.forEach((e) => {
      const mLabel = formatMonthLabel(e.date);
      if (!curMonth || curMonth.label !== mLabel) {
        curMonth = { label: mLabel, days: [] };
        months.push(curMonth);
        curDay = null;
      }
      if (!curDay || curDay.date !== e.date) {
        curDay = { date: e.date, label: formatDateLabel(e.date), events: [] };
        curMonth.days.push(curDay);
      }
      curDay.events.push(e);
    });
    return months;
  }, [filtered]);

  const thisWeekCount = useMemo(() => {
    const weekAhead = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return events.filter((e) => {
      const t = eventDateTime(e).getTime();
      return t >= Date.now() && t <= weekAhead;
    }).length;
  }, [events]);

  const upcomingCount = useMemo(() => events.filter((e) => !isPastEvent(e)).length, [events]);

  const trendingIds = useMemo(() => {
    const scored = events.map((e) => ({ id: e.id, score: (e.views || 0) + (e.likes || []).length * 5 }));
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    // Scale the trending shortlist with how many events exist, instead of a
    // fixed constant that ignores collection size.
    const cutoff = Math.max(3, Math.floor(events.length * 0.1));
    return new Set(sorted.filter((s) => s.score > 0).slice(0, cutoff).map((s) => s.id));
  }, [events]);

  // Hero stats: only show a stat once it has real data behind it, so the
  // hero never advertises "0 this week" / "0 saved" before there's
  // anything to show.
  const heroStats = [
    { value: upcomingCount, label: "upcoming" },
    { value: thisWeekCount, label: "this week" },
    { value: FACULTIES.length, label: "faculties" },
    { value: bookmarks.length, label: "saved by you" },
  ].filter((s) => s.value > 0);

  return (
    <div style={{ backgroundColor: THEME.cream, minHeight: "100vh", fontFamily: "'Inter', sans-serif", transition: "background-color 0.2s ease" }}>
      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        
        @keyframes laserSweep {
          0%   { transform: rotate(12deg) scaleY(0.95); }
          50%  { transform: rotate(20deg) scaleY(1.05); }
          100% { transform: rotate(16deg) scaleY(0.98); }
        }
        @keyframes cyanPointPulse {
          0%   { transform: scale(0.95); opacity: 0.6; }
          100% { transform: scale(1.1); opacity: 0.9; }
        }
        @keyframes hazeFlow {
          0%   { opacity: 0.2; transform: scale(1); }
          100% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes shinySparkleAnimation {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.3); opacity: 0; }
        }
        @keyframes shineSweep {
          0%   { background-position: -150% 0; }
          60%  { background-position: 250% 0; }
          100% { background-position: 250% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cyan-volumetric-haze { animation: none !important; opacity: 0.4 !important; }
          .shiny-word { animation: none !important; }
        }
        select, input, textarea, button { font-family: 'Inter', sans-serif; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid #00b8d4;
          outline-offset: 2px;
        }

        /* Shiny metallic wordmark, matching the printed banner: a brushed
           silver "Campus" and a brushed gold "Connect", each with a soft
           diagonal light sweep animating across the letters. */
        .shiny-word {
          background-repeat: no-repeat;
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shineSweep 4.5s ease-in-out infinite;
        }
        .shiny-silver {
          background-image: linear-gradient(100deg, #c7cdd6 0%, #eef2f6 15%, #ffffff 25%, #eef2f6 35%, #aab2bd 50%, #eef2f6 65%, #ffffff 75%, #eef2f6 85%, #c7cdd6 100%);
          text-shadow: 0 1px 2px rgba(0,0,0,0.35);
        }
        .shiny-gold {
          background-image: linear-gradient(100deg, #a9820f 0%, #f0ce72 15%, #fff6da 25%, #f0ce72 35%, #c9a227 50%, #f0ce72 65%, #fff6da 75%, #f0ce72 85%, #a9820f 100%);
          text-shadow: 0 1px 2px rgba(0,0,0,0.35);
          animation-delay: 0.4s;
        }
      `}</style>

      {/* Header with High-Contrast Text & Lighter Wide Laser Effect with Sparkles */}
      <header
        className="sticky top-0 z-40 backdrop-blur relative overflow-hidden transition-colors"
        style={{
          backgroundColor: THEME.headerBg,
          borderBottom: `1px solid ${THEME.line}`,
          boxShadow: "0 4px 25px rgba(0,0,0,0.4)"
        }}
      >
        <HeaderGlow />

        {/* DESKTOP HEADER */}
        <div className="hidden sm:flex max-w-6xl mx-auto px-6 py-3.5 items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/uop-logo.png"
              alt="University of Peradeniya logo"
              className="w-11 h-11 object-contain flex-shrink-0 drop-shadow-md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold truncate leading-snug tracking-tight" style={{ lineHeight: 1.2 }}>
                  <ShinyLogoText sizeClass="text-xl" />
                </h1>
                <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border" style={{ backgroundColor: "rgba(0, 212, 255, 0.15)", borderColor: "#00d4ff", color: "#00d4ff", fontFamily: "'IBM Plex Mono', monospace" }}>
                  THE CAMPUS NOTICE BOARD
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs leading-tight mt-0.5" style={{ color: THEME.headerSoft }}>
                <span>By Chathil Malsen</span>
                <span>•</span>
                <a href="https://www.linkedin.com/in/chathilmalsen" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: "#38bdf8" }}>
                  LinkedIn
                </a>
                <span>•</span>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: "#38bdf8" }}>
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <ThemeToggle mode={themeMode} setMode={setThemeMode} />
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors hover:bg-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)", color: THEME.headerText }}
            >
              <User size={14} color={THEME.headerText} />
              <span className="max-w-[100px] truncate">{currentUser ? currentUser : "Author ID"}</span>
            </button>

            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#E5657F26", color: "#FF9DB0" }}
              >
                <LogOut size={13} />
                <span>Admin Active</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 border hover:bg-white/10"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)", color: THEME.headerText }}
                title="Admin Login"
              >
                <ShieldCheck size={14} />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-transform active:scale-95 shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#00e5ff", color: "#05080e" }}
            >
              <CalendarPlus size={16} />
              <span>Post Event</span>
            </button>
          </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="flex sm:hidden flex-col px-3.5 py-3 gap-2.5 max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/uop-logo.png"
                alt="University of Peradeniya logo"
                className="w-9 h-9 object-contain flex-shrink-0"
              />
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-base font-bold truncate leading-snug">
                  <ShinyLogoText sizeClass="text-base" />
                </h1>
                <span className="inline-block text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border" style={{ backgroundColor: "rgba(0, 212, 255, 0.15)", borderColor: "#00d4ff", color: "#00d4ff", fontFamily: "'IBM Plex Mono', monospace", width: "fit-content" }}>
                  THE CAMPUS NOTICE BOARD
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95 shadow-sm flex-shrink-0"
              style={{ backgroundColor: "#00e5ff", color: "#05080e" }}
            >
              <CalendarPlus size={14} />
              <span>Post Event</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1.5 text-[10px]" style={{ borderTop: `1px dashed rgba(255,255,255,0.15)`, color: THEME.headerSoft }}>
            <div className="flex items-center gap-1.5 truncate">
              <span>By Chathil Malsen</span>
              <span>•</span>
              <a href="https://www.linkedin.com/in/chathilmalsen" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: "#38bdf8" }}>
                LinkedIn
              </a>
              <span>•</span>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: "#38bdf8" }}>
                Instagram
              </a>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ThemeToggle mode={themeMode} setMode={setThemeMode} />
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)", color: THEME.headerText }}
              >
                <User size={10} color={THEME.headerText} />
                <span className="max-w-[55px] truncate">{currentUser ? currentUser : "Author ID"}</span>
              </button>

              {isAdmin ? (
                <button
                  onClick={handleAdminLogout}
                  aria-label="Log out of admin"
                  className="p-1 rounded-full text-[10px]"
                  style={{ backgroundColor: "#E5657F26", color: "#FF9DB0" }}
                >
                  <LogOut size={11} />
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  aria-label="Admin login"
                  className="p-1 rounded-full border"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)", color: THEME.headerText }}
                  title="Admin Login"
                >
                  <ShieldCheck size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {section === "lostfound" ? (
        <LostFoundSection
          tickets={tickets}
          loading={ticketsLoading}
          authUser={authUser}
          isAdmin={isAdmin}
          onOpenTicket={setSelectedTicket}
          onRequestAuth={() => setShowUserAuth(true)}
          onOpenReport={(type) => { setReportDefaultType(type); setShowReportTicket(true); }}
          onSignOut={handleUserSignOut}
        />
      ) : (
      <>
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: THEME.goldDeep, fontFamily: "'IBM Plex Mono', monospace" }}>
          ALL FACULTIES · ONE BOARD
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(24px, 5vw, 42px)", color: THEME.ink, fontWeight: 600, lineHeight: 1.15, maxWidth: 720 }}>
          What's happening across campus, all in one place.
        </h1>
        <p className="mt-2.5 max-w-xl text-xs sm:text-sm" style={{ color: THEME.inkSoft, lineHeight: 1.5 }}>
          Every faculty posts here — talks, camps, festivals, and finals. Browse by day or month, and add your own event with a poster in a minute.
        </p>
        {heroStats.length > 0 && (
          <div className="flex flex-wrap gap-5 mt-4">
            {heroStats.map((s) => (
              <div key={s.label}><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: THEME.ink, fontWeight: 600 }}>{s.value}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>{s.label}</span></div>
            ))}
          </div>
        )}
      </section>

      {/* Filter Controls */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setFacultyFilter("all")}
            aria-pressed={facultyFilter === "all"}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: facultyFilter === "all" ? THEME.ink : THEME.line + "88", color: facultyFilter === "all" ? THEME.cream : THEME.inkSoft }}
          >
            All faculties
          </button>
          {FACULTIES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFacultyFilter(f.id)}
              aria-pressed={facultyFilter === f.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: facultyFilter === f.id ? f.color : f.color + "14",
                color: facultyFilter === f.id ? "#FFFFFF" : f.color,
              }}
              title={f.name}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: facultyFilter === f.id ? "#FFFFFF" : f.color }} />
              {f.short}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setCategoryFilter("all")}
            aria-pressed={categoryFilter === "all"}
            className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: categoryFilter === "all" ? THEME.goldDeep : THEME.line + "88", color: categoryFilter === "all" ? "#fff" : THEME.inkSoft }}
          >
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              aria-pressed={categoryFilter === c.id}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: categoryFilter === c.id ? c.color : c.color + "14",
                color: categoryFilter === c.id ? "#FFFFFF" : c.color,
              }}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={THEME.inkSoft} />
            <input
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search events, venues, categories..."
              aria-label="Search events, venues, categories"
              style={{ ...inputStyleFn(), paddingLeft: 32 }}
            />
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
            <Segmented
              value={timeFilter}
              onChange={setTimeFilter}
              options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "all", label: "All" }]}
            />
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-pressed={showFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: showFilters ? THEME.ink : THEME.line + "88", color: showFilters ? THEME.cream : THEME.inkSoft }}
            >
              <SlidersHorizontal size={13} /> Filters
            </button>
            <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: THEME.line + "88" }}>
              <button onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: view === "list" ? THEME.ink : "transparent", color: view === "list" ? THEME.cream : THEME.inkSoft }}>
                <ListIcon size={14} />
              </button>
              <button onClick={() => setView("calendar")} aria-label="Calendar view" aria-pressed={view === "calendar"} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: view === "calendar" ? THEME.ink : "transparent", color: view === "calendar" ? THEME.cream : THEME.inkSoft }}>
                <CalendarDays size={14} />
              </button>
              <button onClick={() => setView("saved")} aria-label="Saved events" aria-pressed={view === "saved"} className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{ backgroundColor: view === "saved" ? THEME.ink : "transparent", color: view === "saved" ? THEME.cream : THEME.inkSoft }}>
                <Bookmark size={14} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 p-3.5 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}` }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: THEME.inkSoft }}>When</p>
              <div className="flex flex-wrap gap-1.5">
                {[["any", "Any time"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["week", "This Week"], ["month", "This Month"]].map(([v, l]) => (
                  <button key={v} onClick={() => setQuickDate(v)} aria-pressed={quickDate === v} className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: quickDate === v ? THEME.ink : THEME.line + "88", color: quickDate === v ? THEME.cream : THEME.inkSoft }}>{l}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: THEME.inkSoft }}>Price</p>
                <div className="flex gap-1.5">
                  {[["any", "Any"], ["free", "Free"], ["paid", "Paid"]].map(([v, l]) => (
                    <button key={v} onClick={() => setPriceFilter(v)} aria-pressed={priceFilter === v} className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: priceFilter === v ? THEME.ink : THEME.line + "88", color: priceFilter === v ? THEME.cream : THEME.inkSoft }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: THEME.inkSoft }}>Mode</p>
                <div className="flex gap-1.5">
                  {[["any", "Any"], ["offline", "In person"], ["online", "Online"]].map(([v, l]) => (
                    <button key={v} onClick={() => setModeFilter(v)} aria-pressed={modeFilter === v} className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: modeFilter === v ? THEME.ink : THEME.line + "88", color: modeFilter === v ? THEME.cream : THEME.inkSoft }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: THEME.inkSoft }}>Registration</p>
                <button onClick={() => setRegOnly((v) => !v)} aria-pressed={regOnly} className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: regOnly ? THEME.ink : THEME.line + "88", color: regOnly ? THEME.cream : THEME.inkSoft }}>
                  {regOnly ? "Registration open ✓" : "Registration open"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Events Feed */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <p className="text-xs py-10 text-center" style={{ color: THEME.inkSoft }}>Loading live events from cloud database…</p>
        ) : view === "calendar" ? (
          <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}` }}>
            <CalendarView events={filtered} month={calMonth} setMonth={setCalMonth} year={calYear} setYear={setCalYear} onOpen={openEvent} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: THEME.ink }}>{view === "saved" ? "No saved events yet" : "Nothing found"}</p>
            <p className="text-xs mt-1" style={{ color: THEME.inkSoft }}>{view === "saved" ? "Tap the Save button on any event to bookmark it." : "Try adjusting your filters or search."}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((m) => (
              <div key={m.label}>
                <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: THEME.goldDeep, fontFamily: "'IBM Plex Mono', monospace" }}>{m.label}</h2>
                <div className="space-y-5">
                  {m.days.map((d) => (
                    <div key={d.date} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <div className="sm:w-28 flex-shrink-0">
                        <p className="text-xs sm:text-sm font-semibold" style={{ color: THEME.ink }}>{d.label}</p>
                      </div>
                      <div className="flex-1 space-y-2.5">
                        {d.events.map((e) => (
                          <EventCard
                            key={e.id} ev={e} onOpen={openEvent}
                            isBookmarked={bookmarks.includes(e.id)} onToggleBookmark={toggleBookmark}
                            isLiked={(e.likes || []).includes(anonId)} onToggleLike={toggleLike}
                            isTrending={trendingIds.has(e.id) && !isPastEvent(e)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-[11px] px-4 pb-24 sm:pb-24" style={{ color: THEME.inkSoft, borderTop: `1px solid ${THEME.line}` }}>
        CAMPUS CONNECT · THE CAMPUS NOTICE BOARD
        <br />
        Created by Chathil Malsen, Mechanical Engineering Undergraduate, University of Peradeniya
      </footer>
      </>
      )}

      <CopyrightBadge />
      <BottomNav section={section} setSection={setSection} isAdmin={isAdmin} />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={() => setIsAdmin(true)} />}
      {showUserModal && <SetUserModal onClose={() => setShowUserModal(false)} onSave={handleSaveUserName} currentName={currentUser} />}
      {showAdd && <AddOrEditEventModal onClose={() => setShowAdd(false)} onSubmit={addEvent} currentUser={currentUser} events={events} />}
      {editingEvent && <AddOrEditEventModal onClose={() => setEditingEvent(null)} onSubmit={updateEvent} initialData={editingEvent} currentUser={currentUser} events={events} />}

      {selectedEvent && (
        <EventDetailModal
          ev={events.find((e) => e.id === selectedEvent.id) || selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComment={addComment}
          onReact={reactToComment}
          onDelete={deleteEvent}
          onEdit={(ev) => setEditingEvent(ev)}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onPromptSetUser={() => setShowUserModal(true)}
          isBookmarked={bookmarks.includes(selectedEvent.id)}
          onToggleBookmark={toggleBookmark}
          isLiked={((events.find((e) => e.id === selectedEvent.id) || selectedEvent).likes || []).includes(anonId)}
          onToggleLike={toggleLike}
        />
      )}

      {showUserAuth && <UserAuthModal onClose={() => setShowUserAuth(false)} onSuccess={() => {}} />}
      {showReportTicket && (
        <ReportTicketModal
          onClose={() => setShowReportTicket(false)}
          onSubmit={addTicket}
          authUser={authUser}
          defaultType={reportDefaultType}
        />
      )}
      {selectedTicket && (
        <TicketDetailModal
          t={tickets.find((x) => x.id === selectedTicket.id) || selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={updateTicketStatus}
          onDelete={deleteTicket}
          isAdmin={isAdmin}
          authUser={authUser}
        />
      )}
    </div>
  );
}
