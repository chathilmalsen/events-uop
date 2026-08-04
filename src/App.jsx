import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar, List as ListIcon, Search, Plus, X, MapPin, Clock,
  MessageCircle, ChevronLeft, ChevronRight, Trash2, Upload,
  Users, CalendarDays, AlertCircle, Edit, ShieldCheck, LogOut, User,
  CalendarPlus
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc, 
  arrayUnion 
} from "firebase/firestore";

const ADMIN_EMAIL = "ktchathilmalsencm@gmail.com";
const ADMIN_PASS = "kt1234@CM";
const INSTAGRAM_URL = "https://www.instagram.com/chathilmkt?igsh=MTgwZGdlbnVwMzQzeA%3D%3D&utm_source=qr";

const FACULTIES = [
  { id: "engineering", name: "Faculty of Engineering", short: "ENG", color: "#2E5C8A" },
  { id: "medicine",    name: "Faculty of Medicine",    short: "MED", color: "#B0334D" },
  { id: "management",  name: "Faculty of Management",  short: "MANAGEMENT", color: "#B8860B" },
  { id: "arts",        name: "Faculty of Arts",        short: "ARTS", color: "#7A4FA3" },
  { id: "science",     name: "Faculty of Science",     short: "SCIENCE", color: "#6B2D3C" },
  { id: "dental",      name: "Faculty of Dental Science", short: "DENTAL", color: "#1E8A8A" },
  { id: "agriculture", name: "Faculty of Agriculture", short: "AGRI", color: "#7A4FA3" },
  { id: "allied health sciences", name: "Faculty of Allied Health", short: "Allied", color: "#6B2D3C" },
  { id: "veterniary and animal medicine", name: "Faculty of Veterinary Medicine", short: "VET", color: "#1E8A8A" },
];

const facultyOf = (id) => FACULTIES.find((f) => f.id === id) || { name: "General", short: "GEN", color: "#5B6472" };

const THEME = {
  cream: "#FAF6EC",
  card: "#FFFDF8",
  ink: "#1B2740",
  inkSoft: "#5B6472",
  gold: "#C9A227",
  goldDeep: "#A9820F",
  line: "#E6DFCD",
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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

function EventCard({ ev, onOpen }) {
  const f = facultyOf(ev.faculty);
  const past = isPastEvent(ev);
  return (
    <button
      onClick={() => onOpen(ev)}
      className="text-left w-full rounded-2xl overflow-hidden transition-transform duration-150 active:scale-[0.99] hover:-translate-y-0.5"
      style={{
        backgroundColor: THEME.card, border: `1px solid ${THEME.line}`,
        borderLeft: `5px solid ${f.color}`, boxShadow: "0 1px 3px rgba(27,39,64,0.05)",
        opacity: past ? 0.62 : 1,
      }}
    >
      <div className="flex flex-row gap-3 sm:gap-4 p-3.5 sm:p-4 items-start sm:items-center">
        {ev.posterUrl ? (
          <img
            src={ev.posterUrl} alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0"
            style={{ border: `1px solid ${THEME.line}` }}
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
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full truncate max-w-[180px]"
              style={{ color: f.color, backgroundColor: f.color + "14", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {f.name}
            </span>
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
          </div>
        </div>
      </div>
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full p-1 w-full sm:w-auto justify-between sm:justify-start" style={{ backgroundColor: "#EFE9D8" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors text-center"
          style={{
            backgroundColor: value === opt.value ? THEME.ink : "transparent",
            color: value === opt.value ? "#FAF6EC" : THEME.inkSoft,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(27,39,64,0.55)", animation: "fadeIn 0.15s ease-out" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: THEME.card, animation: "riseIn 0.18s ease-out", boxShadow: "0 20px 60px rgba(27,39,64,0.35)" }}
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
        {label}{required && <span style={{ color: "#B0334D" }}> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: `1px solid ${THEME.line}`, backgroundColor: "#FFFFFF",
  color: THEME.ink, fontSize: 14, outline: "none",
};

function SetUserModal({ onClose, onSave, currentName }) {
  const [name, setName] = useState(currentName || "");

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
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
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
          <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: THEME.ink, color: "#FAF6EC" }}>Save Name</button>
        </div>
      </form>
    </Modal>
  );
}

function LoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASS) {
      onLoginSuccess();
      onClose();
    } else {
      setError("Invalid admin email or password.");
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleLogin} className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }} className="flex items-center gap-2">
            <ShieldCheck size={20} color={THEME.gold} /> Admin Sign In
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "#B0334D14", color: "#B0334D" }}>
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
          <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: THEME.ink, color: "#FAF6EC" }}>Sign In</button>
        </div>
      </form>
    </Modal>
  );
}

function AddOrEditEventModal({ onClose, onSubmit, initialData, currentUser }) {
  const [form, setForm] = useState(
    initialData || {
      title: "",
      faculty: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      organizer: "",
      postedBy: currentUser || "",
      posterUrl: "",
      description: "",
    }
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePosterFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setError("Poster image must be under 1MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, posterUrl: dataUrl }));
    } catch (err) {
      setError("Error reading image file.");
    }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.faculty || !form.date || !form.startTime || !form.location || !form.postedBy) {
      setError("Please fill in all required fields.");
      return;
    }
    onSubmit(form);
  };

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 20, fontWeight: 600 }}>
            {initialData ? "Edit Event" : "Post Event"}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>
        <div className="px-4 sm:px-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "#B0334D14", color: "#B0334D" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <Field label="Event Title" required>
            <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="e.g. Annual Tech Symposium" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Faculty" required>
              <select style={inputStyle} value={form.faculty} onChange={set("faculty")}>
                <option value="">Select faculty</option>
                {FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" style={inputStyle} value={form.date} onChange={set("date")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time" required>
              <input type="time" style={inputStyle} value={form.startTime} onChange={set("startTime")} />
            </Field>
            <Field label="End Time">
              <input type="time" style={inputStyle} value={form.endTime} onChange={set("endTime")} />
            </Field>
          </div>
          <Field label="Location" required>
            <input style={inputStyle} value={form.location} onChange={set("location")} placeholder="e.g. Faculty of Arts – Lecture Hall 2" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Organiser / Society" required>
              <input style={inputStyle} value={form.organizer} onChange={set("organizer")} placeholder="e.g. Students' Union" />
            </Field>
            <Field label="Your Author Name" required>
              <input style={inputStyle} value={form.postedBy} onChange={set("postedBy")} placeholder="Your name (for edits)" />
            </Field>
          </div>
          <Field label="Event Poster">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#EFE9D8", color: THEME.ink }}
              >
                <Upload size={13} /> {uploading ? "Uploading…" : "Choose Image"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePosterFile} className="hidden" />
              {form.posterUrl && (
                <img src={form.posterUrl} alt="Poster preview" className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${THEME.line}` }} />
              )}
              {form.posterUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, posterUrl: "" }))} className="text-xs font-semibold" style={{ color: "#B0334D" }}>
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
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: THEME.ink, color: "#FAF6EC" }}>
            {initialData ? "Save Changes" : "Post Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EventDetailModal({ ev, onClose, onComment, onDelete, onEdit, isAdmin, currentUser, onPromptSetUser }) {
  const [name, setName] = useState(currentUser || "");
  const [text, setText] = useState("");
  const f = facultyOf(ev.faculty);
  const comments = ev.comments || [];

  const isAuthor = Boolean(currentUser && ev.postedBy && currentUser.trim().toLowerCase() === ev.postedBy.trim().toLowerCase());
  const canModify = isAdmin || isAuthor;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onComment(ev.id, { id: uid(), author: name.trim(), text: text.trim(), createdAt: Date.now() });
    setText("");
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="overflow-y-auto max-h-[85vh]">
        <div style={{ background: `linear-gradient(135deg, ${f.color}20, ${THEME.card})` }} className="p-4 sm:p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FacultySeal faculty={ev.faculty} size="sm" />
              <span className="text-[11px] font-semibold uppercase tracking-wide truncate max-w-[200px]" style={{ color: f.color, fontFamily: "'IBM Plex Mono', monospace" }}>{f.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {canModify ? (
                <>
                  <button onClick={() => onEdit(ev)} className="p-1.5 rounded-full hover:bg-black/5" title="Edit event">
                    <Edit size={16} color={THEME.ink} />
                  </button>
                  <button onClick={() => onDelete(ev.id)} className="p-1.5 rounded-full hover:bg-black/5" title="Remove event">
                    <Trash2 size={16} color="#B0334D" />
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
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
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
          </div>
        </div>

        {ev.posterUrl && (
          <div className="w-full bg-black/5 flex items-center justify-center p-2">
            <img src={ev.posterUrl} alt="" className="w-full max-h-[400px] object-contain rounded-lg" onError={(e) => { e.target.style.display = "none"; }} />
          </div>
        )}

        <div className="p-4 sm:p-6">
          <p style={{ color: THEME.ink, lineHeight: 1.5, fontSize: 14 }}>{ev.description || "No further details provided."}</p>
          <p className="text-xs mt-3" style={{ color: THEME.inkSoft }}>Posted by <strong style={{ color: THEME.ink }}>{ev.postedBy}</strong></p>
        </div>

        <div className="px-4 sm:px-6 pb-6" style={{ borderTop: `1px solid ${THEME.line}` }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mt-4 mb-3 flex items-center gap-1.5" style={{ color: THEME.inkSoft }}>
            <MessageCircle size={13} /> {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </h3>
          <div className="space-y-2.5 mb-4 max-h-40 overflow-y-auto">
            {comments.length === 0 && (
              <p className="text-xs" style={{ color: THEME.inkSoft }}>No comments yet.</p>
            )}
            {comments.map((c) => (
              <div key={c.id || uid()} className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
                  {(c.author || "A").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 text-xs">
                  <p><span className="font-semibold" style={{ color: THEME.ink }}>{c.author}</span></p>
                  <p style={{ color: THEME.ink }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <input style={{ ...inputStyle, fontSize: 13 }} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={{ ...inputStyle, fontSize: 13 }} placeholder="Add a comment" value={text} onChange={(e) => setText(e.target.value)} />
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
          <button onClick={() => goMonth(-1)} className="p-1.5 rounded-full hover:bg-black/5"><ChevronLeft size={16} color={THEME.ink} /></button>
          <button onClick={() => goMonth(1)} className="p-1.5 rounded-full hover:bg-black/5"><ChevronRight size={16} color={THEME.ink} /></button>
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
              className="aspect-square rounded-lg flex flex-col items-center justify-start pt-1 gap-0.5 transition-colors"
              style={{
                backgroundColor: isSelected ? THEME.ink : isToday ? "#EFE9D8" : "transparent",
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
              {dayList.map((e) => <EventCard key={e.id} ev={e} onOpen={onOpen} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [search, setSearch] = useState("");
  
  const [showAdd, setShowAdd] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("cg_user_name") || "");

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const handleSaveUserName = (name) => {
    localStorage.setItem("cg_user_name", name);
    setCurrentUser(name);
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
      handleSaveUserName(ev.postedBy);
      await addDoc(collection(db, "events"), {
        ...ev,
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
    return events.filter((e) => {
      if (facultyFilter !== "all" && e.faculty !== facultyFilter) return false;
      if (timeFilter === "upcoming" && isPastEvent(e)) return false;
      if (timeFilter === "past" && !isPastEvent(e)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${e.title} ${e.description} ${e.organizer} ${e.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => eventDateTime(a) - eventDateTime(b));
  }, [events, facultyFilter, timeFilter, search]);

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

  return (
    <div style={{ backgroundColor: THEME.cream, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        select, input, textarea, button { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur" style={{ backgroundColor: THEME.cream, borderBottom: `1px solid ${THEME.line}` }}>
        
        {/* DESKTOP HEADER (sm and up) */}
        <div className="hidden sm:flex max-w-6xl mx-auto px-6 py-3 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src="/uop-logo.png" 
              alt="Logo" 
              className="w-11 h-11 object-contain flex-shrink-0" 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate leading-snug tracking-tight pb-0.5" style={{ fontFamily: "'Fraunces', serif", color: THEME.ink }}>
                  University Events
                </h1>
                <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md" style={{ backgroundColor: THEME.ink, color: THEME.cream, fontFamily: "'IBM Plex Mono', monospace" }}>
                  THE CAMPUS NOTICE BOARD
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs leading-tight mt-0.5" style={{ color: THEME.inkSoft }}>
                <span>By Chathil Malsen</span>
                <span>•</span>
                <a href="https://www.linkedin.com/in/chathilmalsen" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: THEME.goldDeep }}>
                  LinkedIn
                </a>
                <span>•</span>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: THEME.goldDeep }}>
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors hover:bg-black/5"
              style={{ backgroundColor: THEME.card, borderColor: THEME.line, color: THEME.ink }}
            >
              <User size={14} color={THEME.ink} />
              <span className="max-w-[100px] truncate">{currentUser ? currentUser : "Author ID"}</span>
            </button>

            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#B0334D14", color: "#B0334D" }}
              >
                <LogOut size={13} />
                <span>Admin Active</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 border hover:bg-black/5"
                style={{ backgroundColor: THEME.card, borderColor: THEME.line, color: THEME.ink }}
                title="Admin Login"
              >
                <ShieldCheck size={14} />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-transform active:scale-95 shadow-sm hover:shadow"
              style={{ backgroundColor: THEME.gold, color: THEME.ink }}
            >
              <CalendarPlus size={16} />
              <span>Post Event</span>
            </button>
          </div>
        </div>

        {/* MOBILE HEADER (xs screens) */}
        <div className="flex sm:hidden flex-col px-3 py-2.5 gap-2 max-w-6xl mx-auto">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img 
                src="/uop-logo.png" 
                alt="Logo" 
                className="w-8 h-8 object-contain flex-shrink-0" 
              />
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-sm font-bold truncate leading-snug pb-1" style={{ fontFamily: "'Fraunces', serif", color: THEME.ink }}>
                  University Events
                </h1>
                <span className="inline-block text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.ink, color: THEME.cream, fontFamily: "'IBM Plex Mono', monospace", width: "fit-content" }}>
                  THE CAMPUS NOTICE BOARD
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95 shadow-sm flex-shrink-0"
              style={{ backgroundColor: THEME.gold, color: THEME.ink }}
            >
              <CalendarPlus size={14} />
              <span>Post Event</span>
            </button>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-1 text-[10px]" style={{ borderTop: `1px border-dashed ${THEME.line}`, color: THEME.inkSoft }}>
            <div className="flex items-center gap-1.5 truncate">
              <span>By Chathil Malsen</span>
              <span>•</span>
              <a href="https://www.linkedin.com/in/chathilmalsen" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: THEME.goldDeep }}>
                LinkedIn
              </a>
              <span>•</span>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: THEME.goldDeep }}>
                Instagram
              </a>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{ backgroundColor: THEME.card, borderColor: THEME.line, color: THEME.ink }}
              >
                <User size={10} color={THEME.ink} />
                <span className="max-w-[55px] truncate">{currentUser ? currentUser : "Author ID"}</span>
              </button>

              {isAdmin ? (
                <button
                  onClick={() => setIsAdmin(false)}
                  className="p-1 rounded-full text-[10px]"
                  style={{ backgroundColor: "#B0334D14", color: "#B0334D" }}
                >
                  <LogOut size={11} />
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="p-1 rounded-full border"
                  style={{ backgroundColor: THEME.card, borderColor: THEME.line, color: THEME.ink }}
                  title="Admin Login"
                >
                  <ShieldCheck size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

      </header>

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
        <div className="flex flex-wrap gap-5 mt-4">
          <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: THEME.ink, fontWeight: 600 }}>{upcomingCount}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>upcoming</span></div>
          <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: THEME.ink, fontWeight: 600 }}>{thisWeekCount}</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>this week</span></div>
          <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: THEME.ink, fontWeight: 600 }}>9</span> <span className="text-xs" style={{ color: THEME.inkSoft }}>faculties</span></div>
        </div>
      </section>

      {/* Filter Controls */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setFacultyFilter("all")}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: facultyFilter === "all" ? THEME.ink : "#EFE9D8", color: facultyFilter === "all" ? THEME.cream : THEME.inkSoft }}
          >
            All faculties
          </button>
          {FACULTIES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFacultyFilter(f.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: facultyFilter === f.id ? f.color : f.color + "14",
                color: facultyFilter === f.id ? "#FFFFFF" : f.color,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: facultyFilter === f.id ? "#FFFFFF" : f.color }} />
              {f.short}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={THEME.inkSoft} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, venues..."
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            <Segmented
              value={timeFilter}
              onChange={setTimeFilter}
              options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "all", label: "All" }]}
            />
            <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: "#EFE9D8" }}>
              <button onClick={() => setView("list")} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: view === "list" ? THEME.ink : "transparent", color: view === "list" ? THEME.cream : THEME.inkSoft }}>
                <ListIcon size={14} />
              </button>
              <button onClick={() => setView("calendar")} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: view === "calendar" ? THEME.ink : "transparent", color: view === "calendar" ? THEME.cream : THEME.inkSoft }}>
                <CalendarDays size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Events Feed */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <p className="text-xs py-10 text-center" style={{ color: THEME.inkSoft }}>Loading live events from cloud database…</p>
        ) : view === "calendar" ? (
          <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}` }}>
            <CalendarView events={filtered} month={calMonth} setMonth={setCalMonth} year={calYear} setYear={setCalYear} onOpen={setSelectedEvent} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: THEME.ink }}>Nothing found</p>
            <p className="text-xs mt-1" style={{ color: THEME.inkSoft }}>Try adjusting your filters or search.</p>
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
                        {d.events.map((e) => <EventCard key={e.id} ev={e} onOpen={setSelectedEvent} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-[11px] px-4" style={{ color: THEME.inkSoft, borderTop: `1px solid ${THEME.line}` }}>
        University Events · Campus Notice Board
        <br />
        Created by Chathil Malsen, Mechanical Engineering Undergraduate, University of Peradeniya
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={() => setIsAdmin(true)} />}
      {showUserModal && <SetUserModal onClose={() => setShowUserModal(false)} onSave={handleSaveUserName} currentName={currentUser} />}
      {showAdd && <AddOrEditEventModal onClose={() => setShowAdd(false)} onSubmit={addEvent} currentUser={currentUser} />}
      {editingEvent && <AddOrEditEventModal onClose={() => setEditingEvent(null)} onSubmit={updateEvent} initialData={editingEvent} currentUser={currentUser} />}
      
      {selectedEvent && (
        <EventDetailModal
          ev={events.find((e) => e.id === selectedEvent.id) || selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComment={addComment}
          onDelete={deleteEvent}
          onEdit={(ev) => setEditingEvent(ev)}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onPromptSetUser={() => setShowUserModal(true)}
        />
      )}
    </div>
  );
}