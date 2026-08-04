import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar, List as ListIcon, Search, Plus, X, MapPin, Clock,
  MessageCircle, ChevronLeft, ChevronRight, Trash2, Upload,
  Users, CalendarDays, AlertCircle
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

const FACULTIES = [
  { id: "engineering", name: "Faculty of Engineering", short: "ENG", color: "#2E5C8A" },
  { id: "medicine",    name: "Faculty of Medicine",    short: "MED", color: "#B0334D" },
  { id: "management",  name: "Faculty of Managements",  short: "MANAGEMENT", color: "#B8860B" },
  { id: "arts",        name: "Faculty of Arts",        short: "ARTS", color: "#7A4FA3" },
  { id: "science",     name: "Faculty of Science",     short: "SCIENCE", color: "#6B2D3C" },
  { id: "dental",      name: "Faculty of Dental Science", short: "DENTAL", color: "#1E8A8A" },
  { id: "agriculture", name: "Faculty of Agriculture", short: "AGRI", color: "#7A4FA3" },
  { id: "allied health sciences", name: "Faculty of Allied Health", short: "Allied", color: "#6B2D3C" },
  { id: "veterniary and animal medicine", name: "Faculty of Veterrinary medicine and Animal Science", short: "VET", color: "#1E8A8A" },
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
      className="text-left w-full rounded-2xl overflow-hidden transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: THEME.card, border: `1px solid ${THEME.line}`,
        borderLeft: `5px solid ${f.color}`, boxShadow: "0 1px 2px rgba(27,39,64,0.06)",
        opacity: past ? 0.62 : 1,
      }}
    >
      <div className="flex gap-4 p-4">
        {ev.posterUrl ? (
          <img
            src={ev.posterUrl} alt=""
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            style={{ border: `1px solid ${THEME.line}` }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${f.color}22, ${f.color}0a)` }}
          >
            <FacultySeal faculty={ev.faculty} size="lg" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full"
              style={{ color: f.color, backgroundColor: f.color + "14", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {f.name}
            </span>
            {past && (
              <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: THEME.inkSoft }}>Past</span>
            )}
          </div>
          <h3 className="font-semibold leading-snug truncate" style={{ color: THEME.ink, fontFamily: "'Fraunces', serif", fontSize: 17 }}>
            {ev.title}
          </h3>
          <p className="text-sm mt-1 line-clamp-2" style={{ color: THEME.inkSoft }}>{ev.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: THEME.inkSoft }}>
            <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}</span>
            <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {ev.location}</span>
            <span className="flex items-center gap-1"><MessageCircle size={12} /> {(ev.comments || []).length}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full p-1" style={{ backgroundColor: "#EFE9D8" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(27,39,64,0.55)", animation: "fadeIn 0.15s ease-out" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} my-6 rounded-3xl overflow-hidden`}
        style={{ backgroundColor: THEME.card, animation: "riseIn 0.18s ease-out", boxShadow: "0 20px 60px rgba(27,39,64,0.35)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: THEME.inkSoft }}>
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

function AddEventModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "", faculty: "", date: "", startTime: "", endTime: "",
    location: "", organizer: "", postedBy: "", posterUrl: "", description: "",
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePosterFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the poster.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setError("Poster image is too large — please use an image under 1MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, posterUrl: dataUrl }));
    } catch (err) {
      setError("Couldn't read that image — please try another file.");
    }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.faculty || !form.date || !form.startTime || !form.location || !form.postedBy) {
      setError("Please fill in all required fields.");
      return;
    }
    onSubmit({ ...form, comments: [] });
  };

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={submit} className="max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 22, fontWeight: 600 }}>Post an event</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
            <X size={18} color={THEME.inkSoft} />
          </button>
        </div>
        <div className="px-6 pb-2">
          <p className="text-sm mb-4" style={{ color: THEME.inkSoft }}>
            Let the campus know what's happening. This appears on the notice board for everyone right away.
          </p>
          {error && (
            <div className="flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "#B0334D14", color: "#B0334D" }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}
          <Field label="Event title" required>
            <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="e.g. Annual Tech Symposium" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Start time" required>
              <input type="time" style={inputStyle} value={form.startTime} onChange={set("startTime")} />
            </Field>
            <Field label="End time">
              <input type="time" style={inputStyle} value={form.endTime} onChange={set("endTime")} />
            </Field>
          </div>
          <Field label="Location" required>
            <input style={inputStyle} value={form.location} onChange={set("location")} placeholder="e.g. Faculty of Arts – Lecture Hall 2" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Organiser / society" required>
              <input style={inputStyle} value={form.organizer} onChange={set("organizer")} placeholder="e.g. Students' Union" />
            </Field>
            <Field label="Your name" required>
              <input style={inputStyle} value={form.postedBy} onChange={set("postedBy")} placeholder="Posted by" />
            </Field>
          </div>
          <Field label="Event poster">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#EFE9D8", color: THEME.ink }}
              >
                <Upload size={14} /> {uploading ? "Uploading…" : "Choose image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePosterFile}
                className="hidden"
              />
              {form.posterUrl && (
                <img src={form.posterUrl} alt="Poster preview" className="w-12 h-12 rounded-lg object-cover" style={{ border: `1px solid ${THEME.line}` }} />
              )}
              {form.posterUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, posterUrl: "" }))} className="text-xs font-semibold" style={{ color: "#B0334D" }}>
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs mt-1.5" style={{ color: THEME.inkSoft }}>Optional. JPG or PNG, up to 1MB. You can also paste a link below instead.</p>
            <input
              style={{ ...inputStyle, marginTop: 8 }}
              value={form.posterUrl.startsWith("data:") ? "" : form.posterUrl}
              onChange={set("posterUrl")}
              placeholder="…or paste a poster image link"
            />
          </Field>
          <Field label="Details">
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="What should people know before they come?" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${THEME.line}` }}>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium" style={{ color: THEME.inkSoft }}>Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: THEME.ink, color: "#FAF6EC" }}>Post event</button>
        </div>
      </form>
    </Modal>
  );
}

function EventDetailModal({ ev, onClose, onComment, onDelete }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const f = facultyOf(ev.faculty);
  const comments = ev.comments || [];

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onComment(ev.id, { id: uid(), author: name.trim(), text: text.trim(), createdAt: Date.now() });
    setText("");
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="max-h-[88vh] overflow-y-auto">
        <div style={{ background: `linear-gradient(135deg, ${f.color}20, ${THEME.card})` }} className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FacultySeal faculty={ev.faculty} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: f.color, fontFamily: "'IBM Plex Mono', monospace" }}>{f.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onDelete(ev.id)} className="p-1.5 rounded-full hover:bg-black/5" title="Remove event">
                <Trash2 size={17} color={THEME.inkSoft} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
                <X size={18} color={THEME.inkSoft} />
              </button>
            </div>
          </div>
          <h2 className="mt-3" style={{ fontFamily: "'Fraunces', serif", color: THEME.ink, fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>{ev.title}</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm" style={{ color: THEME.inkSoft }}>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateLabel(ev.date)}, {new Date(ev.date + "T00:00:00").getFullYear()}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {ev.location}</span>
            <span className="flex items-center gap-1.5"><Users size={14} /> {ev.organizer}</span>
          </div>
        </div>

        {ev.posterUrl && (
          <img src={ev.posterUrl} alt="" className="w-full max-h-72 object-cover" onError={(e) => { e.target.style.display = "none"; }} />
        )}

        <div className="px-6 py-5">
          <p style={{ color: THEME.ink, lineHeight: 1.6, fontSize: 15 }}>{ev.description || "No further details provided."}</p>
          <p className="text-xs mt-3" style={{ color: THEME.inkSoft }}>Posted by {ev.postedBy}</p>
        </div>

        <div className="px-6 pb-6" style={{ borderTop: `1px solid ${THEME.line}` }}>
          <h3 className="text-sm font-semibold uppercase tracking-wide mt-5 mb-3 flex items-center gap-2" style={{ color: THEME.inkSoft }}>
            <MessageCircle size={14} /> {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </h3>
          <div className="space-y-3 mb-4">
            {comments.length === 0 && (
              <p className="text-sm" style={{ color: THEME.inkSoft }}>No comments yet. Ask a question or share something useful for others going.</p>
            )}
            {comments.map((c) => (
              <div key={c.id || uid()} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>
                  {c.author.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm"><span className="font-semibold" style={{ color: THEME.ink }}>{c.author}</span></p>
                  <p className="text-sm" style={{ color: THEME.ink }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <input style={{ ...inputStyle, width: 140 }} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={inputStyle} placeholder="Add a comment" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap" style={{ backgroundColor: THEME.ink, color: THEME.cream }}>Post</button>
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
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: THEME.ink, fontWeight: 600 }}>
          {new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => goMonth(-1)} className="p-2 rounded-full hover:bg-black/5"><ChevronLeft size={18} color={THEME.ink} /></button>
          <button onClick={() => goMonth(1)} className="p-2 rounded-full hover:bg-black/5"><ChevronRight size={18} color={THEME.ink} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide py-1" style={{ color: THEME.inkSoft }}>{d}</div>
        ))}
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
              className="aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 gap-1 transition-colors"
              style={{
                backgroundColor: isSelected ? THEME.ink : isToday ? "#EFE9D8" : "transparent",
                border: `1px solid ${isSelected ? THEME.ink : THEME.line}`,
              }}
            >
              <span className="text-xs font-medium" style={{ color: isSelected ? THEME.cream : THEME.ink }}>{d}</span>
              <div className="flex flex-wrap gap-0.5 justify-center px-0.5">
                {dayEvents.slice(0, 4).map((e) => (
                  <span key={e.id} style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: facultyOf(e.faculty).color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: THEME.inkSoft }}>
            {formatDateLabel(selectedDate)}
          </h4>
          {dayList.length === 0 ? (
            <p className="text-sm" style={{ color: THEME.inkSoft }}>Nothing on the board for this day yet.</p>
          ) : (
            <div className="space-y-3">
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  // --- Real-time Firebase Sync ---
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
      await addDoc(collection(db, "events"), {
        ...ev,
        createdAt: Date.now(),
      });
      setShowAdd(false);
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Could not save event to cloud. Please try again.");
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
    if (!window.confirm(`Remove "${ev ? ev.title : "this event"}"? This can't be undone.`)) return;
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        select, input, textarea, button { font-family: 'Inter', sans-serif; }
        input:focus, select:focus, textarea:focus, button:focus-visible {
          outline: 2px solid #C9A227; outline-offset: 1px;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur" style={{ backgroundColor: THEME.cream + "E8", borderBottom: `1px solid ${THEME.line}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5">
              <img 
                src="/uop-logo.png" 
                alt="University Logo" 
                className="w-9 h-9 object-contain" 
              />
              <div>
                <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>University Events</p>
                <p style={{ fontSize: 10.5, color: THEME.inkSoft, letterSpacing: '0.05em' }}>THE CAMPUS NOTICE BOARD</p>
                <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: THEME.inkSoft }}>
                  <span>By Chathil Malsen</span>
                  <span>•</span>
                  <a 
                    href="https://www.linkedin.com/in/chathilmalsen" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline font-medium"
                    style={{ color: THEME.gold }}
                  >
                    LinkedIn
                  </a>
                  <span>•</span>
                  <a 
                    href="https://www.instagram.com/chathilmkt" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline font-medium"
                    style={{ color: THEME.gold }}
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: THEME.gold, color: THEME.ink }}
          >
            <Plus size={16} /> <span className="hidden sm:inline">Post event</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: THEME.goldDeep, fontFamily: "'IBM Plex Mono', monospace" }}>
          ALL FACULTIES · ONE BOARD
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 5vw, 44px)", color: THEME.ink, fontWeight: 600, lineHeight: 1.1, maxWidth: 720 }}>
          What's happening across campus, all in one place.
        </h1>
        <p className="mt-3 max-w-xl" style={{ color: THEME.inkSoft, fontSize: 15.5 }}>
          Every faculty posts here — talks, camps, festivals, and finals. Browse by day or month, and add your own event with a poster in a minute.
        </p>
        <div className="flex flex-wrap gap-6 mt-6">
          <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: THEME.ink, fontWeight: 600 }}>{upcomingCount}</span> <span className="text-sm" style={{ color: THEME.inkSoft }}>upcoming</span></div>
          <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: THEME.ink, fontWeight: 600 }}>{thisWeekCount}</span> <span className="text-sm" style={{ color: THEME.inkSoft }}>this week</span></div>
          <div><span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: THEME.ink, fontWeight: 600 }}>9</span> <span className="text-sm" style={{ color: THEME.inkSoft }}>faculties</span></div>
        </div>
      </section>

      {/* Controls */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setFacultyFilter("all")}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: facultyFilter === "all" ? THEME.ink : "#EFE9D8", color: facultyFilter === "all" ? THEME.cream : THEME.inkSoft }}
          >
            All faculties
          </button>
          {FACULTIES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFacultyFilter(f.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={THEME.inkSoft} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, venues, societies…"
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
            <Segmented
              value={timeFilter}
              onChange={setTimeFilter}
              options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "all", label: "All" }]}
            />
          </div>
          <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: "#EFE9D8" }}>
            <button onClick={() => setView("list")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: view === "list" ? THEME.ink : "transparent", color: view === "list" ? THEME.cream : THEME.inkSoft }}>
              <ListIcon size={14} /> List
            </button>
            <button onClick={() => setView("calendar")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: view === "calendar" ? THEME.ink : "transparent", color: view === "calendar" ? THEME.cream : THEME.inkSoft }}>
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <p className="text-sm py-10 text-center" style={{ color: THEME.inkSoft }}>Loading the board from cloud database…</p>
        ) : view === "calendar" ? (
          <div className="rounded-2xl p-5" style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.line}` }}>
            <CalendarView events={filtered} month={calMonth} setMonth={setCalMonth} year={calYear} setYear={setCalYear} onOpen={setSelectedEvent} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: THEME.ink }}>Nothing here yet</p>
            <p className="text-sm mt-1" style={{ color: THEME.inkSoft }}>Try a different faculty, clear your search, or post the first event.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map((m) => (
              <div key={m.label}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: THEME.goldDeep, fontFamily: "'IBM Plex Mono', monospace" }}>{m.label}</h2>
                <div className="space-y-6">
                  {m.days.map((d) => (
                    <div key={d.date} className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                      <div className="sm:w-28 flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: THEME.ink }}>{d.label}</p>
                      </div>
                      <div className="flex-1 space-y-3">
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

      <footer className="text-center py-8 text-xs" style={{ color: THEME.inkSoft, borderTop: `1px solid ${THEME.line}` }}>
        University Events · a shared notice board for every faculty
        <br />
        Created by Chathil Malsen , Mechanical Engineering Undergraduate, University of Peradeniya
      </footer>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onSubmit={addEvent} />}
      {selectedEvent && (
        <EventDetailModal
          ev={events.find((e) => e.id === selectedEvent.id) || selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComment={addComment}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}