import { useState, useEffect, useCallback, useRef } from “react”;

const SUPABASE_URL = “https://fadpwmaumklbibnsoyft.supabase.co”;
const SUPABASE_KEY = “eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZHB3bWF1bWtsYmlibnNveWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDAxNzMsImV4cCI6MjA5MTM3NjE3M30.HElpazl-1eqBCrIG94ZlD_2fOB5bzVeMAWc4aozGAFI”;

const db = {
async get(table, params = “”) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, “Content-Type”: “application/json” }
});
return res.json();
},
async post(table, data) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
method: “POST”,
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, “Content-Type”: “application/json”, Prefer: “return=representation” },
body: JSON.stringify(data)
});
return res.json();
},
async patch(table, id, data) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
method: “PATCH”,
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, “Content-Type”: “application/json”, Prefer: “return=representation” },
body: JSON.stringify(data)
});
return res.json();
},
async delete(table, id) {
await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
method: “DELETE”,
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
}
};

const storage = {
async upload(file, taskId) {
const ext = file.name.split(”.”).pop();
const path = `task-${taskId}/${Date.now()}.${ext}`;
const res = await fetch(`${SUPABASE_URL}/storage/v1/object/task-photos/${path}`, {
method: “POST”,
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, “Content-Type”: file.type },
body: file
});
if (!res.ok) throw new Error(“Upload failed”);
return `${SUPABASE_URL}/storage/v1/object/public/task-photos/${path}`;
},
async list(taskId) {
const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/task-photos`, {
method: “POST”,
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, “Content-Type”: “application/json” },
body: JSON.stringify({ prefix: `task-${taskId}/`, limit: 50 })
});
const files = await res.json();
if (!Array.isArray(files)) return [];
return files.map(f => `${SUPABASE_URL}/storage/v1/object/public/task-photos/task-${taskId}/${f.name}`);
},
async remove(url) {
const path = url.replace(`${SUPABASE_URL}/storage/v1/object/public/task-photos/`, “”);
await fetch(`${SUPABASE_URL}/storage/v1/object/task-photos/${path}`, {
method: “DELETE”,
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
}
};

function PhotoUploader({ taskId, taskTitle }) {
const [photos, setPhotos] = useState([]);
const [uploading, setUploading] = useState(false);
const [lightbox, setLightbox] = useState(null);
const inputRef = useRef();

useEffect(() => {
if (taskId) loadPhotos();
}, [taskId]);

const loadPhotos = async () => {
const urls = await storage.list(taskId);
setPhotos(urls);
};

const handleUpload = async (e) => {
const files = Array.from(e.target.files);
if (!files.length) return;
setUploading(true);
try {
for (const file of files) {
await storage.upload(file, taskId);
}
await loadPhotos();
} catch (err) {
alert(“Upload failed: “ + err.message);
}
setUploading(false);
e.target.value = “”;
};

const handleDelete = async (url) => {
if (!confirm(“Delete this photo?”)) return;
await storage.remove(url);
setPhotos(prev => prev.filter(p => p !== url));
};

return (
<div>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 12 }}>
<div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>📸 Photos ({photos.length})</div>
<button onClick={() => inputRef.current?.click()} style={{ background: C.accent, color: “#fff”, border: “none”, borderRadius: 7, padding: “6px 14px”, fontWeight: 700, cursor: “pointer”, fontSize: 12, fontFamily: “inherit” }}>
{uploading ? “Uploading…” : “+ Add Photos”}
</button>
<input ref={inputRef} type=“file” accept=“image/*” multiple onChange={handleUpload} style={{ display: “none” }} />
</div>
{photos.length === 0 && (
<div onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: “30px 20px”, textAlign: “center”, cursor: “pointer”, color: C.muted, fontSize: 13 }}>
📷 Tap to upload before/after photos
</div>
)}
<div style={{ display: “grid”, gridTemplateColumns: “repeat(auto-fill, minmax(120px, 1fr))”, gap: 8 }}>
{photos.map((url, i) => (
<div key={i} style={{ position: “relative”, borderRadius: 8, overflow: “hidden”, aspectRatio: “1”, background: C.dim }}>
<img src={url} alt={`Photo ${i+1}`} onClick={() => setLightbox(url)} style={{ width: “100%”, height: “100%”, objectFit: “cover”, cursor: “pointer” }} />
<button onClick={() => handleDelete(url)} style={{ position: “absolute”, top: 4, right: 4, background: C.red, color: “#fff”, border: “none”, borderRadius: “50%”, width: 22, height: 22, cursor: “pointer”, fontSize: 12, fontWeight: 800, display: “flex”, alignItems: “center”, justifyContent: “center” }}>×</button>
</div>
))}
</div>
{lightbox && (
<div onClick={() => setLightbox(null)} style={{ position: “fixed”, inset: 0, background: “#000000cc”, zIndex: 200, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<div style={{ position: “relative”, maxWidth: “90vw”, maxHeight: “90vh” }}>
<img src={lightbox} alt=“Full size” style={{ maxWidth: “100%”, maxHeight: “90vh”, borderRadius: 12, objectFit: “contain” }} />
<button onClick={() => setLightbox(null)} style={{ position: “absolute”, top: -12, right: -12, background: C.red, color: “#fff”, border: “none”, borderRadius: “50%”, width: 32, height: 32, cursor: “pointer”, fontSize: 18, fontWeight: 800 }}>×</button>
</div>
</div>
)}
</div>
);
}

const getSettings = () => {
try { return { companyName: “VR365 PropFlow”, tagline: “Property Management”, accentColor: “#4f8ef7”, managerName: “Property Manager”, …JSON.parse(localStorage.getItem(“vr365_settings”) || “{}”) }; }
catch { return { companyName: “VR365 PropFlow”, tagline: “Property Management”, accentColor: “#4f8ef7”, managerName: “Property Manager” }; }
};

const C = { bg: “#0b0e17”, surface: “#131825”, surfaceAlt: “#1a2035”, border: “#1f2840”, accent: “#4f8ef7”, accentDim: “#4f8ef718”, green: “#34d399”, yellow: “#fbbf24”, red: “#f87171”, purple: “#a78bfa”, text: “#e2e8f8”, muted: “#5a6580”, dim: “#2a3350” };
const statusColor = s => ({ occupied: C.green, turnover: C.yellow, vacant: C.muted, maintenance: C.red }[s] || C.muted);
const priorityColor = p => ({ urgent: C.purple, high: C.red, medium: C.yellow, low: C.green }[p] || C.muted);
const taskStatusColor = s => ({ completed: C.green, “in-progress”: C.accent, pending: C.muted }[s] || C.muted);

function Badge({ label, color }) {
return <span style={{ background: color + “22”, color, border: `1px solid ${color}44`, borderRadius: 6, padding: “2px 8px”, fontSize: 11, fontWeight: 700, letterSpacing: “0.04em”, textTransform: “uppercase”, whiteSpace: “nowrap” }}>{label}</span>;
}
function Btn({ children, onClick, variant = “primary”, small }) {
const styles = { primary: { background: C.accent, color: “#fff”, border: “none” }, ghost: { background: “transparent”, color: C.muted, border: `1px solid ${C.border}` }, danger: { background: C.red + “22”, color: C.red, border: `1px solid ${C.red}44` } };
return <button onClick={onClick} style={{ …styles[variant], borderRadius: 8, padding: small ? “5px 12px” : “8px 16px”, fontWeight: 700, cursor: “pointer”, fontSize: small ? 12 : 13, fontFamily: “inherit” }}>{children}</button>;
}
function Input({ value, onChange, placeholder, type = “text” }) {
return <input type={type} value={value || “”} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: “8px 12px”, color: C.text, fontSize: 13, fontFamily: “inherit”, outline: “none”, width: “100%” }} />;
}
function Textarea({ value, onChange, placeholder, rows = 3 }) {
return <textarea value={value || “”} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: “8px 12px”, color: C.text, fontSize: 13, fontFamily: “inherit”, outline: “none”, width: “100%”, resize: “vertical” }} />;
}
function Select({ value, onChange, options }) {
return <select value={value || “”} onChange={e => onChange(e.target.value)} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: “8px 12px”, color: C.text, fontSize: 13, fontFamily: “inherit”, outline: “none”, width: “100%” }}>
{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>;
}
function Modal({ title, onClose, children }) {
return (
<div style={{ position: “fixed”, inset: 0, background: “#00000090”, zIndex: 100, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 16 }} onClick={onClose}>
<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: “100%”, maxWidth: 480, maxHeight: “92vh”, overflowY: “auto” }} onClick={e => e.stopPropagation()}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 20 }}>
<h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>{title}</h3>
<button onClick={onClose} style={{ background: “none”, border: “none”, color: C.muted, cursor: “pointer”, fontSize: 22 }}>×</button>
</div>
{children}
</div>
</div>
);
}
function Spinner() {
return <div style={{ display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 60 }}>
<div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: “50%”, animation: “spin 0.8s linear infinite” }} />
<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

  </div>;
}
function StatCard({ label, value, sub, color, icon }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 130, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -16, right: -8, fontSize: 64, opacity: 0.04 }}>{icon}</div>
    <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ color, fontSize: 30, fontWeight: 800, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
    {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
  </div>;
}
function Toggle({ value, onChange }) {
  return <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.green : C.dim, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s" }} />
  </div>;
}

function Dashboard({ properties, tasks, staff }) {
const s = getSettings();
const occupied = properties.filter(p => p.status === “occupied”).length;
const turnover = properties.filter(p => p.status === “turnover”).length;
const maintenance = properties.filter(p => p.status === “maintenance”).length;
const pendingHigh = tasks.filter(t => t.priority === “high” && t.status !== “completed”).length;
const recentTasks = tasks.filter(t => t.status !== “completed”).slice(0, 7);
return (
<div>
<div style={{ marginBottom: 28 }}>
<h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Good morning, {s.managerName} 👋</h1>
<p style={{ color: C.muted, margin: “6px 0 0”, fontSize: 14 }}>{new Date().toLocaleDateString(“en-US”, { weekday: “long”, year: “numeric”, month: “long”, day: “numeric” })}</p>
</div>
<div style={{ display: “flex”, gap: 12, marginBottom: 24, flexWrap: “wrap” }}>
<StatCard label="Properties" value={properties.length} sub="Total managed" color={C.accent} icon="⌂" />
<StatCard label=“Occupied” value={occupied} sub={properties.length ? `${Math.round(occupied/properties.length*100)}% occupancy` : “—”} color={C.green} icon=“⬤” />
<StatCard label="Turnovers" value={turnover} sub="Need attention" color={C.yellow} icon="↻" />
<StatCard label="Maintenance" value={maintenance} sub="Blocked units" color={C.red} icon="⚙" />
<StatCard label="High Priority" value={pendingHigh} sub="Action needed" color={C.purple} icon="!" />
</div>
<div style={{ display: “grid”, gridTemplateColumns: “1fr 360px”, gap: 16 }}>
<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 16 }}>
<h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Active Tasks</h3>
<Badge label={`${recentTasks.length} pending`} color={C.accent} />
</div>
{recentTasks.length === 0 && <div style={{ color: C.muted, textAlign: “center”, padding: 30 }}>No pending tasks 🎉</div>}
{recentTasks.map(t => (
<div key={t.id} style={{ display: “flex”, alignItems: “center”, gap: 12, padding: “10px 0”, borderBottom: `1px solid ${C.border}` }}>
<div style={{ width: 4, height: 36, borderRadius: 4, background: priorityColor(t.priority), flexShrink: 0 }} />
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ color: C.text, fontWeight: 600, fontSize: 13, whiteSpace: “nowrap”, overflow: “hidden”, textOverflow: “ellipsis” }}>{t.title}</div>
<div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{t.properties?.name} · {t.staff?.name || “Unassigned”}</div>
</div>
<Badge label={t.status} color={taskStatusColor(t.status)} />
</div>
))}
</div>
<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
<h3 style={{ margin: “0 0 16px”, fontSize: 15, fontWeight: 700, color: C.text }}>Property Status</h3>
{properties.length === 0 && <div style={{ color: C.muted, textAlign: “center”, padding: 30 }}>No properties yet</div>}
{properties.map(p => (
<div key={p.id} style={{ display: “flex”, alignItems: “center”, gap: 10, padding: “8px 0”, borderBottom: `1px solid ${C.border}` }}>
<div style={{ width: 8, height: 8, borderRadius: “50%”, background: statusColor(p.status), flexShrink: 0 }} />
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: “nowrap”, overflow: “hidden”, textOverflow: “ellipsis” }}>{p.name}</div>
<div style={{ color: C.muted, fontSize: 11 }}>{p.location}</div>
</div>
<Badge label={p.status} color={statusColor(p.status)} />
</div>
))}
</div>
</div>
</div>
);
}

function Properties({ properties, onRefresh }) {
const [filter, setFilter] = useState(“all”);
const [showModal, setShowModal] = useState(false);
const [saving, setSaving] = useState(false);
const [form, setForm] = useState({ name: “”, location: “”, type: “Villa”, beds: 1, status: “vacant”, guest_name: “”, check_out: “”, notes: “” });
const filtered = filter === “all” ? properties : properties.filter(p => p.status === filter);
const handleSave = async () => {
if (!form.name) return alert(“Property name is required”);
setSaving(true);
await db.post(“properties”, { …form, beds: parseInt(form.beds) || 1 });
setSaving(false); setShowModal(false);
setForm({ name: “”, location: “”, type: “Villa”, beds: 1, status: “vacant”, guest_name: “”, check_out: “”, notes: “” });
onRefresh();
};
return (
<div>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 24 }}>
<h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Properties</h2>
<Btn onClick={() => setShowModal(true)}>+ Add Property</Btn>
</div>
<div style={{ display: “flex”, gap: 8, marginBottom: 20, flexWrap: “wrap” }}>
{[“all”,“occupied”,“vacant”,“turnover”,“maintenance”].map(f => (
<button key={f} onClick={() => setFilter(f)} style={{ background: filter===f?C.accent:C.surface, color: filter===f?”#fff”:C.muted, border: `1px solid ${filter===f?C.accent:C.border}`, borderRadius: 8, padding: “6px 14px”, fontSize: 12, fontWeight: 600, cursor: “pointer”, textTransform: “capitalize”, fontFamily: “inherit” }}>{f}</button>
))}
</div>
{filtered.length === 0 && <div style={{ color: C.muted, textAlign: “center”, padding: 60, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>No properties found.</div>}
<div style={{ display: “grid”, gridTemplateColumns: “repeat(auto-fill, minmax(290px, 1fr))”, gap: 14 }}>
{filtered.map(p => (
<div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “flex-start”, marginBottom: 12 }}>
<div style={{ flex: 1, marginRight: 8 }}>
<div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
<div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{p.location}</div>
</div>
<Badge label={p.status} color={statusColor(p.status)} />
</div>
<div style={{ display: “flex”, gap: 14, marginBottom: 12 }}>
<div style={{ color: C.muted, fontSize: 12 }}>🛏 {p.beds} beds</div>
<div style={{ color: C.muted, fontSize: 12 }}>🏠 {p.type}</div>
{p.guest_name && <div style={{ color: C.muted, fontSize: 12 }}>👤 {p.guest_name}</div>}
</div>
{p.check_out && <div style={{ padding: “6px 10px”, background: C.accentDim, borderRadius: 6, fontSize: 12, color: C.accent, marginBottom: 12 }}>🗓 Checkout: {new Date(p.check_out).toLocaleDateString()}</div>}
<div style={{ display: “flex”, gap: 6, flexWrap: “wrap” }}>
{[“vacant”,“occupied”,“turnover”,“maintenance”].filter(s => s !== p.status).map(s => (
<Btn key={s} small variant=“ghost” onClick={async () => { await db.patch(“properties”, p.id, { status: s }); onRefresh(); }}>→ {s}</Btn>
))}
<Btn small variant=“danger” onClick={async () => { if(confirm(“Delete?”)) { await db.delete(“properties”, p.id); onRefresh(); } }}>Delete</Btn>
</div>
</div>
))}
</div>
{showModal && (
<Modal title=“Add Property” onClose={() => setShowModal(false)}>
<div style={{ display: “flex”, flexDirection: “column”, gap: 12 }}>
<Input value={form.name} onChange={v => setForm({…form,name:v})} placeholder=“Property name *” />
<Input value={form.location} onChange={v => setForm({…form,location:v})} placeholder=“Location (e.g. Malibu, CA)” />
<div style={{ display: “grid”, gridTemplateColumns: “1fr 1fr”, gap: 12 }}>
<Select value={form.type} onChange={v => setForm({…form,type:v})} options={[“Villa”,“Loft”,“Cottage”,“Suite”,“Cabin”,“House”,“Condo”,“Apartment”].map(t=>({value:t,label:t}))} />
<Input value={form.beds} onChange={v => setForm({…form,beds:v})} placeholder=“Beds” type=“number” />
</div>
<Select value={form.status} onChange={v => setForm({…form,status:v})} options={[“vacant”,“occupied”,“turnover”,“maintenance”].map(s=>({value:s,label:s}))} />
{form.status===“occupied” && <>
<Input value={form.guest_name} onChange={v => setForm({…form,guest_name:v})} placeholder=“Guest name” />
<Input value={form.check_out} onChange={v => setForm({…form,check_out:v})} type=“date” />
</>}
<Textarea value={form.notes} onChange={v => setForm({…form,notes:v})} placeholder=“Notes” rows={2} />
<div style={{ display: “flex”, gap: 8, justifyContent: “flex-end” }}>
<Btn variant=“ghost” onClick={() => setShowModal(false)}>Cancel</Btn>
<Btn onClick={handleSave}>{saving?“Saving…”:“Save Property”}</Btn>
</div>
</div>
</Modal>
)}
</div>
);
}

// =============================================
// TASK DETAIL PAGE - Breezeway Style
// =============================================
function TaskDetail({ task, properties, staff, onBack, onRefresh }) {
const [activeTab, setActiveTab] = useState(“requirements”);
const [requirements, setRequirements] = useState(
task.notes ? task.notes.split(”\n”).filter(Boolean).map((r, i) => ({ id: i, text: r, done: false })) : []
);
const [newReq, setNewReq] = useState(””);
const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState(””);
const [status, setStatus] = useState(task.status);
const [saving, setSaving] = useState(false);
const [timerRunning, setTimerRunning] = useState(false);
const [elapsed, setElapsed] = useState(0);
const [showReportIssue, setShowReportIssue] = useState(false);

useEffect(() => {
let interval;
if (timerRunning) {
interval = setInterval(() => setElapsed(e => e + 1), 1000);
}
return () => clearInterval(interval);
}, [timerRunning]);
const [issueForm, setIssueForm] = useState({ title:””, category:“General”, priority:“medium”, description:”” });
const [reportedIssues, setReportedIssues] = useState([]);
const [issueSaved, setIssueSaved] = useState(false);

const submitIssue = () => {
if (!issueForm.title.trim()) return alert(“Please describe the issue”);
const newIssue = {
id: Date.now(),
…issueForm,
property: property?.name || “Unknown”,
reported_by: “Staff”,
date: new Date().toISOString().split(“T”)[0],
status: “open”,
task: task.title,
photos: []
};
setReportedIssues(prev => […prev, newIssue]);
setIssueSaved(true);
setShowReportIssue(false);
setIssueForm({ title:””, category:“General”, priority:“medium”, description:”” });
setTimeout(() => setIssueSaved(false), 3000);
};
const property = properties.find(p => p.id === task.property_id);
const assignee = staff.find(s => s.id === task.assignee_id);
const doneCount = requirements.filter(r => r.done).length;
const pct = requirements.length > 0 ? Math.round(doneCount / requirements.length * 100) : 0;

const handleStatusChange = async (newStatus) => {
setStatus(newStatus);
await db.patch(“tasks”, task.id, { status: newStatus });
onRefresh();
};

const handleStartTask = async () => {
setSaving(true);
await db.patch(“tasks”, task.id, { status: “in-progress” });
setStatus(“in-progress”);
setSaving(false);
onRefresh();
};

const handleCompleteTask = async () => {
setSaving(true);
await db.patch(“tasks”, task.id, { status: “completed” });
setStatus(“completed”);
setSaving(false);
onRefresh();
};

const addRequirement = () => {
if (!newReq.trim()) return;
setRequirements(prev => […prev, { id: Date.now(), text: newReq.trim(), done: false }]);
setNewReq(””);
};

const toggleReq = (id) => setRequirements(prev => prev.map(r => r.id === id ? { …r, done: !r.done } : r));

const addComment = () => {
if (!newComment.trim()) return;
setComments(prev => […prev, { id: Date.now(), text: newComment.trim(), time: new Date().toLocaleTimeString([], { hour: “2-digit”, minute: “2-digit” }), author: “You” }]);
setNewComment(””);
};

const propBg = [
“https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80”,
“https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80”,
“https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80”,
“https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80”,
];
const bgImg = propBg[Math.abs((task.id || “”).charCodeAt(0) || 0) % propBg.length];

return (
<div style={{ maxWidth: 700, margin: “0 auto” }}>
{/* Back button */}
<button onClick={onBack} style={{ display:“flex”, alignItems:“center”, gap:6, background:“none”, border:“none”, color:C.muted, cursor:“pointer”, fontFamily:“inherit”, fontSize:13, fontWeight:600, marginBottom:16, padding:0 }}>
← Back to Tasks
</button>

```
  {/* Property Hero Image */}
  <div style={{ position:"relative", borderRadius:16, overflow:"hidden", height:200, marginBottom:20 }}>
    <img src={bgImg} alt="Property" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #000000cc, transparent)" }} />
    <div style={{ position:"absolute", bottom:0, left:0, padding:"16px 20px" }}>
      <div style={{ color:"#fff", fontWeight:800, fontSize:16, textTransform:"uppercase", letterSpacing:"0.05em" }}>{property?.name || "No Property"}</div>
      <div style={{ color:"#ffffffcc", fontSize:13, marginTop:2 }}>{property?.location || "Location not set"}</div>
    </div>
    <div style={{ position:"absolute", top:12, right:12 }}>
      <Badge label={task.priority} color={priorityColor(task.priority)} />
    </div>
  </div>

  {/* Timer + Action Bar */}
  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16 }}>
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
      <div style={{ fontFamily:"'DM Mono', monospace", fontSize:28, fontWeight:800, color:timerRunning?C.green:C.text, minWidth:90 }}>
        {String(Math.floor(elapsed/3600)).padStart(2,"0")}:{String(Math.floor((elapsed%3600)/60)).padStart(2,"0")}:{String(elapsed%60).padStart(2,"0")}
      </div>
      <div style={{ display:"flex", gap:8, flex:1 }}>
        {status !== "completed" && (
          <button onClick={()=>{if(!timerRunning){setTimerRunning(true);handleStatusChange("in-progress");}else{setTimerRunning(false);}}} style={{ flex:1, padding:"10px", background:timerRunning?"#e8821a":"#00aaff", color:"#fff", border:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {timerRunning ? "⏸ Pause" : status==="pending" ? "▶ Start" : "▶ Resume"}
          </button>
        )}
        <button onClick={handleCompleteTask} disabled={status==="completed"} style={{ flex:1, padding:"10px", background:status==="completed"?C.green+"22":C.green, color:status==="completed"?C.green:"#fff", border:status==="completed"?`1px solid ${C.green}44`:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:status==="completed"?"default":"pointer", fontFamily:"inherit" }}>
          {status==="completed" ? "✓ Done" : "Complete"}
        </button>
      </div>
    </div>

    <h2 style={{ margin:"0 0 10px", fontSize:17, fontWeight:800, color:C.text, lineHeight:1.3 }}>{task.title}</h2>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      <span style={{ color:C.muted, fontSize:12 }}>📅 {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : "No due date"}</span>
      <span style={{ color:C.muted, fontSize:12 }}>👤 {assignee?.name || "Unassigned"}</span>
      <span style={{ color:C.muted, fontSize:12, textTransform:"capitalize" }}>🏷️ {task.type}</span>
      {timerRunning && <span style={{ color:C.green, fontSize:12, fontWeight:700 }}>● Synced</span>}
    </div>
  </div>

  {/* Issue saved toast */}
  {issueSaved && (
    <div style={{ background:C.red+"22", border:`1px solid ${C.red}44`, borderRadius:10, padding:"10px 16px", marginBottom:12, color:C.red, fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
      ⚠️ Issue reported successfully! Check the Issues page.
    </div>
  )}

  {/* Tabs */}
  <div style={{ display:"flex", gap:8, marginBottom:16 }}>
    {[
      { id:"requirements", label:"Requirements", icon:"☑", count:requirements.length },
      { id:"photos", label:"Photos", icon:"📸", count:null },
      { id:"comments", label:"Comments", icon:"💬", count:comments.length },
      { id:"property", label:"Property", icon:"🏠", count:null },
      { id:"issues", label:"Issues", icon:"⚠️", count:reportedIssues.length||null },
    ].map(tab => (
      <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, padding:"10px 6px", borderRadius:10, border:`1px solid ${tab.id==="issues"?(activeTab===tab.id?C.red:C.red+"44"):(activeTab===tab.id?C.accent:C.border)}`, background:tab.id==="issues"?(activeTab===tab.id?C.red+"22":C.red+"0a"):(activeTab===tab.id?C.accentDim:C.surface), color:tab.id==="issues"?C.red:(activeTab===tab.id?C.accent:C.muted), fontWeight:activeTab===tab.id?700:500, fontSize:11, cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>
        <div style={{ fontSize:14 }}>{tab.icon}</div>
        <div style={{ marginTop:2 }}>{tab.label}</div>
        {tab.count !== null && tab.count > 0 && <div style={{ fontSize:10, marginTop:1, color:tab.id==="issues"?C.red:C.accent }}>{tab.count}</div>}
      </button>
    ))}
  </div>

  {/* Tab Content */}
  {activeTab === "requirements" && (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.text }}>Requirements</h3>
        <span style={{ color:C.muted, fontSize:13 }}>{doneCount}/{requirements.length} done</span>
      </div>
      {requirements.length > 0 && (
        <div style={{ height:6, background:C.dim, borderRadius:4, marginBottom:16, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:pct===100?C.green:C.accent, borderRadius:4, transition:"width 0.3s" }} />
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
        {requirements.length === 0 && <div style={{ color:C.muted, textAlign:"center", padding:20, fontSize:13 }}>No requirements yet. Add some below!</div>}
        {requirements.map(r => (
          <div key={r.id} onClick={()=>toggleReq(r.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, background:r.done?C.green+"10":C.surfaceAlt, border:`1px solid ${r.done?C.green+"40":C.border}`, cursor:"pointer" }}>
            <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${r.done?C.green:C.dim}`, background:r.done?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {r.done && <span style={{ color:"#fff", fontSize:13, fontWeight:800 }}>✓</span>}
            </div>
            <span style={{ color:r.done?C.muted:C.text, fontSize:13, textDecoration:r.done?"line-through":"none", flex:1 }}>{r.text}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Input value={newReq} onChange={setNewReq} placeholder="Add a requirement..." />
        <Btn onClick={addRequirement}>Add</Btn>
      </div>
    </div>
  )}

  {activeTab === "photos" && (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
      <PhotoUploader taskId={task.id} taskTitle={task.title} />
    </div>
  )}

  {activeTab === "comments" && (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
      <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:C.text }}>Comments</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {comments.length === 0 && <div style={{ color:C.muted, textAlign:"center", padding:20, fontSize:13 }}>No comments yet. Leave a note for your team!</div>}
        {comments.map(c => (
          <div key={c.id} style={{ background:C.surfaceAlt, borderRadius:10, padding:"10px 14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:C.accent, fontWeight:700, fontSize:12 }}>{c.author}</span>
              <span style={{ color:C.muted, fontSize:11 }}>{c.time}</span>
            </div>
            <div style={{ color:C.text, fontSize:13 }}>{c.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Input value={newComment} onChange={setNewComment} placeholder="Add a comment..." />
        <Btn onClick={addComment}>Post</Btn>
      </div>
    </div>
  )}

  {activeTab === "property" && (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
      <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:C.text }}>Property Details</h3>
      {[
        { icon:"🔒", label:"Access", value:property?.notes || "Check with manager" },
        { icon:"🛏️", label:"Beds", value:`${property?.beds || "—"} bedrooms` },
        { icon:"🏠", label:"Type", value:property?.type || "—" },
        { icon:"📍", label:"Location", value:property?.location || "—" },
        { icon:"👤", label:"Current Guest", value:property?.guest_name || "Vacant" },
        { icon:"🗓️", label:"Checkout", value:property?.check_out ? new Date(property.check_out).toLocaleDateString() : "—" },
      ].map(item => (
        <div key={item.label} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontSize:18, width:28 }}>{item.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{item.label}</div>
            <div style={{ color:C.text, fontSize:13, marginTop:2 }}>{item.value}</div>
          </div>
          <span style={{ color:C.dim }}>›</span>
        </div>
      ))}
    </div>
  )}

  {/* Issues Tab */}
  {activeTab === "issues" && (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.text }}>Reported Issues</h3>
          <p style={{ margin:"4px 0 0", color:C.muted, fontSize:12 }}>Issues found while working on this task</p>
        </div>
        <button onClick={()=>setShowReportIssue(true)} style={{ background:C.red+"22", color:C.red, border:`1px solid ${C.red}44`, borderRadius:8, padding:"8px 14px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
          ⚠️ Report Issue
        </button>
      </div>

      {reportedIssues.length === 0 && (
        <div style={{ textAlign:"center", padding:"30px 20px" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
          <div style={{ color:C.text, fontWeight:600, marginBottom:4 }}>No issues reported</div>
          <div style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Found something wrong? Report it so your manager knows!</div>
          <button onClick={()=>setShowReportIssue(true)} style={{ background:C.red, color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            ⚠️ Report an Issue
          </button>
        </div>
      )}

      {reportedIssues.map(issue => (
        <div key={issue.id} style={{ background:C.surfaceAlt, borderRadius:10, padding:14, marginBottom:8, border:`1px solid ${C.red}33` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{issue.title}</div>
            <Badge label={issue.priority} color={priorityColor(issue.priority)} />
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <span style={{ color:C.muted, fontSize:11 }}>🏷 {issue.category}</span>
            <span style={{ color:C.muted, fontSize:11 }}>📅 {issue.date}</span>
            <span style={{ color:C.red, fontSize:11, fontWeight:600 }}>● Open</span>
          </div>
          {issue.description && <div style={{ color:C.muted, fontSize:12, marginTop:6, lineHeight:1.5 }}>{issue.description}</div>}
        </div>
      ))}
    </div>
  )}

  {/* Report Issue Modal - Full Breezeway Style */}
  {showReportIssue && !issueForm.showSchedule && !issueForm.showAssignee && (
    <Modal title={property?.name || "Report an Issue"} onClose={()=>setShowReportIssue(false)}>
      {/* Priority visual buttons */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[
          {value:"lowest", label:"LOWEST", color:"#94a3b8", icon:"⬇⬇"},
          {value:"low", label:"LOW", color:C.green, icon:"⬇"},
          {value:"medium", label:"MEDIUM", color:C.yellow, icon:"◆"},
          {value:"high", label:"HIGH", color:"#fb923c", icon:"⬆"},
          {value:"urgent", label:"URGENT", color:C.red, icon:"⬆⬆"},
        ].map(p => (
          <button key={p.value} onClick={()=>setIssueForm({...issueForm,priority:p.value})} style={{ flex:1, padding:"7px 3px", borderRadius:20, border:`2px solid ${issueForm.priority===p.value?p.color:C.border}`, background:issueForm.priority===p.value?p.color:"transparent", color:issueForm.priority===p.value?"#fff":C.muted, fontWeight:700, fontSize:9, cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Department row */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18 }}>🔧</span>
        <select value={issueForm.category} onChange={e=>setIssueForm({...issueForm,category:e.target.value})} style={{ flex:1, background:"transparent", border:"none", color:C.text, fontSize:14, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          {["Maintenance","Housekeeping","Plumbing","HVAC","Electrical","Furniture","Appliance","Pool","Technology","Structural","Landscaping","General"].map(c=><option key={c} value={c} style={{background:C.surface}}>{c}</option>)}
        </select>
        <span style={{ color:C.muted }}>⌄</span>
      </div>

      {/* Template row */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18 }}>📋</span>
        <select value={issueForm.template||""} onChange={e=>setIssueForm({...issueForm,template:e.target.value})} style={{ flex:1, background:"transparent", border:"none", color:issueForm.template?C.text:C.muted, fontSize:14, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value="" style={{background:C.surface}}>Select template</option>
          <option value="plumbing_leak" style={{background:C.surface}}>Plumbing Leak</option>
          <option value="ac_issue" style={{background:C.surface}}>AC/HVAC Issue</option>
          <option value="appliance_broken" style={{background:C.surface}}>Appliance Broken</option>
          <option value="damage_reported" style={{background:C.surface}}>Damage Reported</option>
          <option value="pest_issue" style={{background:C.surface}}>Pest Issue</option>
        </select>
        <span style={{ color:C.muted }}>⌄</span>
      </div>

      {/* Subdepartment */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18 }}>⊞</span>
        <select value={issueForm.subdept||""} onChange={e=>setIssueForm({...issueForm,subdept:e.target.value})} style={{ flex:1, background:"transparent", border:"none", color:issueForm.subdept?C.text:C.muted, fontSize:14, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value="" style={{background:C.surface}}>Select subdepartment</option>
          <option value="Interior" style={{background:C.surface}}>Interior</option>
          <option value="Exterior" style={{background:C.surface}}>Exterior</option>
          <option value="Pool & Spa" style={{background:C.surface}}>Pool & Spa</option>
          <option value="Landscaping" style={{background:C.surface}}>Landscaping</option>
          <option value="Appliances" style={{background:C.surface}}>Appliances</option>
        </select>
        <span style={{ color:C.muted }}>⌄</span>
      </div>

      {/* Title */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18, color:issueForm.titleError?C.red:C.muted }}>⊙</span>
        <input value={issueForm.title} onChange={e=>setIssueForm({...issueForm,title:e.target.value,titleError:false})} placeholder="Title (required)" style={{ flex:1, background:"transparent", border:"none", color:C.text, fontSize:14, fontFamily:"inherit", outline:"none" }} />
      </div>
      {issueForm.titleError && <div style={{ color:C.red, fontSize:12, padding:"4px 0 8px 30px" }}>Task title is required.</div>}

      {/* Description */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18, color:C.muted, marginTop:2 }}>≡</span>
        <textarea value={issueForm.description} onChange={e=>setIssueForm({...issueForm,description:e.target.value})} placeholder="Description" rows={2} style={{ flex:1, background:"transparent", border:"none", color:C.text, fontSize:13, fontFamily:"inherit", outline:"none", resize:"none" }} />
      </div>

      {/* Select Element */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18 }}>⊞</span>
        <select value={issueForm.room||""} onChange={e=>setIssueForm({...issueForm,room:e.target.value})} style={{ flex:1, background:"transparent", border:"none", color:issueForm.room?C.text:C.muted, fontSize:14, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value="" style={{background:C.surface}}>Select element</option>
          {["Kitchen","Master Bedroom","Bathroom","Living Room","Backyard","Pool","Garage","Exterior","Roof","Basement","Other"].map(r=><option key={r} value={r} style={{background:C.surface}}>{r}</option>)}
        </select>
        <span style={{ color:C.muted }}>⌄</span>
      </div>

      {/* Add Attachment */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
        <span style={{ fontSize:18 }}>📎</span>
        <span style={{ color:C.muted, fontSize:14 }}>Add attachment</span>
      </div>

      {/* Select Tag */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:18 }}>🏷</span>
        <select value={issueForm.tag||""} onChange={e=>setIssueForm({...issueForm,tag:e.target.value})} style={{ flex:1, background:"transparent", border:"none", color:issueForm.tag?C.text:C.muted, fontSize:14, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value="" style={{background:C.surface}}>Select tag</option>
          {["Billable","Warranty","Owner Responsibility","Urgent Repair","Follow Up","Insurance Claim"].map(t=><option key={t} value={t} style={{background:C.surface}}>{t}</option>)}
        </select>
        <span style={{ color:C.muted }}>⌄</span>
      </div>

      {/* Select Requester */}
      <div onClick={()=>setIssueForm({...issueForm,showAssignee:true})} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
        <span style={{ fontSize:18 }}>👤</span>
        <span style={{ color:issueForm.assignee?C.text:C.muted, fontSize:14, flex:1 }}>{issueForm.assignee || "Select requester"}</span>
        <span style={{ color:C.muted }}>⌄</span>
      </div>

      {/* I completed this task */}
      <div onClick={()=>setIssueForm({...issueForm,completed:!issueForm.completed})} style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 0", cursor:"pointer" }}>
        <div style={{ width:22, height:22, borderRadius:4, border:`2px solid ${issueForm.completed?C.green:C.dim}`, background:issueForm.completed?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {issueForm.completed && <span style={{ color:"#fff", fontSize:13, fontWeight:800 }}>✓</span>}
        </div>
        <span style={{ color:C.text, fontSize:14 }}>I completed this task</span>
      </div>

      {/* Report + Schedule buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:8 }}>
        <button onClick={()=>{
          if(!issueForm.title.trim()){setIssueForm({...issueForm,titleError:true});return;}
          submitIssue();
        }} style={{ padding:"14px", background:C.surfaceAlt, color:C.text, border:`1px solid ${C.border}`, borderRadius:10, fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
          Report
        </button>
        <button onClick={()=>setIssueForm({...issueForm,showSchedule:true})} style={{ padding:"14px", background:C.surfaceAlt, color:C.text, border:`1px solid ${C.border}`, borderRadius:10, fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
          Schedule
        </button>
      </div>
    </Modal>
  )}

  {/* Schedule Picker Modal */}
  {showReportIssue && issueForm.showSchedule && (
    <Modal title="Schedule Issue" onClose={()=>setIssueForm({...issueForm,showSchedule:false})}>
      {/* Mini calendar */}
      <div style={{ background:"#1a4a6b", borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <button onClick={()=>{}} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", fontSize:18 }}>‹</button>
          <div style={{ color:"#fff", fontWeight:700, fontSize:16 }}>{new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
          <button onClick={()=>{}} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", fontSize:18 }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, textAlign:"center" }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
            <div key={d} style={{ color:"#ffffff88", fontSize:11, fontWeight:600, padding:"4px 0" }}>{d}</div>
          ))}
          {Array.from({length:30},(_,i)=>{
            const d = i+1;
            const today = new Date().getDate();
            const selected = issueForm.scheduleDay === d;
            return (
              <div key={d} onClick={()=>setIssueForm({...issueForm,scheduleDay:d})} style={{ padding:"6px 0", borderRadius:"50%", background:selected?"#00aaff":d===today?"rgba(255,255,255,0.2)":"transparent", color:selected?"#fff":d===today?"#fff":"#ffffffcc", fontSize:13, cursor:"pointer", fontWeight:selected||d===today?700:400 }}>{d}</div>
            );
          })}
        </div>
        <div style={{ marginTop:12, textAlign:"center" }}>
          <button style={{ background:"none", border:`1px solid #ffffff44`, borderRadius:8, color:"#fff", padding:"6px 16px", cursor:"pointer", fontSize:13 }}>+ Add time</button>
        </div>
      </div>

      {/* Property + task preview */}
      <div style={{ background:C.surface, borderRadius:10, padding:14, marginBottom:16, border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{property?.name}</div>
          <div style={{ color:C.muted, fontSize:12 }}>Today</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.green+"22", borderRadius:8, border:`1px solid ${C.green}44` }}>
          <div style={{ width:32, height:32, background:C.green, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🔧</div>
          <div>
            <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{issueForm.title || task.title}</div>
            <div style={{ color:C.muted, fontSize:11 }}>Time not specified</div>
          </div>
        </div>
      </div>

      <button onClick={()=>{
        if(!issueForm.title.trim()){setIssueForm({...issueForm,showSchedule:false,titleError:true});return;}
        submitIssue();
      }} style={{ width:"100%", padding:"14px", background:"#00aaff", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
        Next
      </button>
    </Modal>
  )}

  {/* Assignee Picker Modal */}
  {showReportIssue && issueForm.showAssignee && (
    <Modal title="Select Assignee" onClose={()=>setIssueForm({...issueForm,showAssignee:false})}>
      <div style={{ marginBottom:12 }}>
        <input placeholder="Search assignees" style={{ width:"100%", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
      </div>
      <div style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", padding:"8px 0 6px" }}>Suggested</div>
      <div onClick={()=>setIssueForm({...issueForm,assignee:"Assign to me",showAssignee:false})} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>👤</div>
        <span style={{ color:C.text, fontSize:14, fontWeight:600 }}>Assign to me</span>
      </div>
      {staff.map(s => (
        <div key={s.id} onClick={()=>setIssueForm({...issueForm,assignee:s.name,showAssignee:false})} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:s.color+"30", border:`2px solid ${s.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:s.color, flexShrink:0 }}>
            {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
          <div>
            <div style={{ color:C.text, fontSize:14 }}>{s.name}</div>
            <div style={{ color:C.muted, fontSize:11 }}>{s.role}</div>
          </div>
          {issueForm.assignee === s.name && <span style={{ marginLeft:"auto", color:C.accent, fontSize:18 }}>✓</span>}
        </div>
      ))}
      <button onClick={()=>{
        if(!issueForm.title.trim()){setIssueForm({...issueForm,showAssignee:false,titleError:true});return;}
        submitIssue();
      }} style={{ width:"100%", marginTop:16, padding:"14px", background:"#00aaff", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
        Create task
      </button>
    </Modal>
  )}

  {/* Bottom action bar - Issues + Delete */}
  <div style={{ marginTop:20, display:"flex", gap:12, padding:"12px 0", borderTop:`1px solid ${C.border}` }}>
    <button onClick={()=>{setActiveTab("issues");setShowReportIssue(true);}} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"none", border:"none", color:C.red, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
      🔧 Issues
    </button>
    <button onClick={()=>{}} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"none", border:"none", color:C.muted, fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
      ⊞ Collapse
    </button>
    <button onClick={async()=>{if(confirm("Delete this task?")){{await db.delete("tasks",task.id);onRefresh();onBack();}}}} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"none", border:"none", color:C.muted, fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
      🗑 Delete
    </button>
  </div>
</div>
```

);
}

// =============================================
// TASKS LIST
// =============================================
function Tasks({ tasks, properties, staff, onRefresh }) {
const [filter, setFilter] = useState(“all”);
const [typeFilter, setTypeFilter] = useState(“all”);
const [showModal, setShowModal] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);
const [saving, setSaving] = useState(false);
const [form, setForm] = useState({ title: “”, property_id: “”, assignee_id: “”, priority: “medium”, status: “pending”, type: “housekeeping”, due_date: “”, notes: “” });
const filtered = tasks.filter(t => (filter===“all”||t.status===filter)&&(typeFilter===“all”||t.type===typeFilter));

const handleSave = async () => {
if (!form.title) return alert(“Title required”);
setSaving(true);
await db.post(“tasks”, {…form, property_id:form.property_id||null, assignee_id:form.assignee_id||null, due_date:form.due_date||null});
setSaving(false); setShowModal(false);
setForm({ title:””,property_id:””,assignee_id:””,priority:“medium”,status:“pending”,type:“housekeeping”,due_date:””,notes:”” });
onRefresh();
};

if (selectedTask) {
return <TaskDetail task={selectedTask} properties={properties} staff={staff} onBack={()=>setSelectedTask(null)} onRefresh={()=>{onRefresh();setSelectedTask(tasks.find(t=>t.id===selectedTask.id)||null);}} />;
}

return (
<div>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 24 }}>
<h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Tasks & Work Orders</h2>
<Btn onClick={() => setShowModal(true)}>+ New Task</Btn>
</div>
<div style={{ display: “flex”, gap: 8, marginBottom: 16, flexWrap: “wrap” }}>
{[“all”,“pending”,“in-progress”,“completed”].map(f => (
<button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?C.accent:C.surface, color:filter===f?”#fff”:C.muted, border:`1px solid ${filter===f?C.accent:C.border}`, borderRadius:8, padding:“6px 14px”, fontSize:12, fontWeight:600, cursor:“pointer”, textTransform:“capitalize”, fontFamily:“inherit” }}>{f}</button>
))}
<div style={{ marginLeft: “auto”, display: “flex”, gap: 6 }}>
{[“all”,“housekeeping”,“maintenance”,“inspection”].map(f => (
<button key={f} onClick={()=>setTypeFilter(f)} style={{ background:typeFilter===f?C.surfaceAlt:“transparent”, color:typeFilter===f?C.text:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:“6px 12px”, fontSize:12, fontWeight:600, cursor:“pointer”, textTransform:“capitalize”, fontFamily:“inherit” }}>{f}</button>
))}
</div>
</div>

```
  {/* Task Cards */}
  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    {filtered.length===0 && <div style={{ color:C.muted, textAlign:"center", padding:60, background:C.surface, borderRadius:14, border:`1px solid ${C.border}` }}>No tasks found.</div>}
    {filtered.map(t => {
      const prop = properties.find(p=>p.id===t.property_id);
      return (
        <div key={t.id} onClick={()=>setSelectedTask(t)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:16, cursor:"pointer", transition:"border-color 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ flex:1, marginRight:12 }}>
              <div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:4 }}>{t.title}</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {prop && <span style={{ color:C.muted, fontSize:12 }}>🏠 {prop.name}</span>}
                {t.staff?.name && <span style={{ color:C.muted, fontSize:12 }}>👤 {t.staff.name}</span>}
                {t.due_date && <span style={{ color:C.muted, fontSize:12 }}>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
              <Badge label={t.priority} color={priorityColor(t.priority)} />
              <Badge label={t.status} color={taskStatusColor(t.status)} />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", gap:16 }}>
              <span style={{ color:C.muted, fontSize:12, textTransform:"capitalize" }}>🏷 {t.type}</span>
            </div>
            <span style={{ color:C.accent, fontSize:12, fontWeight:600 }}>View details →</span>
          </div>
        </div>
      );
    })}
  </div>

  {showModal && (
    <Modal title="New Task" onClose={()=>setShowModal(false)}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Department</label>
            <Select value={form.type} onChange={v=>setForm({...form,type:v})} options={["housekeeping","maintenance","inspection","other"].map(t=>({value:t,label:t.charAt(0).toUpperCase()+t.slice(1)}))} />
          </div>
          <div>
            <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Priority</label>
            <Select value={form.priority} onChange={v=>setForm({...form,priority:v})} options={[{value:"urgent",label:"🚨 Urgent"},{value:"high",label:"🔴 High"},{value:"medium",label:"🟡 Medium"},{value:"low",label:"🟢 Low"}]} />
          </div>
        </div>
        <Input value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="Task title *" />
        <Select value={form.property_id} onChange={v=>setForm({...form,property_id:v})} options={[{value:"",label:"Select property..."},...properties.map(p=>({value:p.id,label:p.name}))]} />
        <Select value={form.assignee_id} onChange={v=>setForm({...form,assignee_id:v})} options={[{value:"",label:"Assign to staff..."},...staff.map(s=>({value:s.id,label:`${s.name} — ${s.role}`}))]} />
        <Input value={form.due_date} onChange={v=>setForm({...form,due_date:v})} type="datetime-local" />
        <Textarea value={form.notes} onChange={v=>setForm({...form,notes:v})} placeholder="Requirements (one per line)" rows={3} />
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>{saving?"Saving...":"Create Task"}</Btn>
        </div>
      </div>
    </Modal>
  )}
</div>
```

);
}

const defaultChecklists = {
“Turnover Clean”: [“Strip all beds and remove linens”,“Clean all bathrooms — toilet, sink, shower, mirrors”,“Mop and vacuum all floors”,“Wipe down kitchen counters and appliances”,“Clean inside microwave and oven”,“Empty all trash cans”,“Restock toiletries and supplies”,“Make all beds with fresh linens”,“Dust all surfaces and ceiling fans”,“Check all lightbulbs working”,“Wipe down windows and doors”,“Stage living areas and fluff pillows”,“Check for guest left items”,“Final walkthrough and photos”],
“Inspection”: [“Check all appliances functioning”,“Test all door locks and keys”,“Inspect for any damage or wear”,“Check HVAC filters”,“Test smoke and CO detectors”,“Inspect plumbing for leaks”,“Check exterior and landscaping”,“Review guest manual”,“Verify all amenities stocked”,“Document condition with photos”],
“Maintenance Check”: [“Inspect HVAC system”,“Check water heater”,“Test all electrical outlets”,“Inspect roof and gutters”,“Check windows and seals”,“Inspect plumbing fixtures”,“Test garage doors”,“Check pool/spa equipment”,“Inspect exterior lighting”,“Review pest control”],
“Pre-Arrival”: [“Confirm fresh linens on all beds”,“Set thermostat to welcome temp”,“Place welcome basket”,“Ensure all supplies stocked”,“Check WiFi is working”,“Leave guest manual visible”,“Ensure parking is clear”,“Test all TVs and remotes”,“Verify access codes working”,“Final cleanliness check”],
};

function Checklists({ properties }) {
const [selectedTemplate, setSelectedTemplate] = useState(“Turnover Clean”);
const [checkedItems, setCheckedItems] = useState({});
const [selectedProperty, setSelectedProperty] = useState(””);
const [customItem, setCustomItem] = useState(””);
const [templates, setTemplates] = useState(defaultChecklists);
const [showNew, setShowNew] = useState(false);
const [newName, setNewName] = useState(””);
const items = templates[selectedTemplate] || [];
const key = `${selectedProperty}-${selectedTemplate}`;
const checked = checkedItems[key] || {};
const doneCount = Object.values(checked).filter(Boolean).length;
const pct = items.length > 0 ? Math.round(doneCount/items.length*100) : 0;
return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<div>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Checklists</h2>
<p style={{ margin:“4px 0 0”, color:C.muted, fontSize:13 }}>Room-by-room cleaning & inspection checklists</p>
</div>
<Btn onClick={()=>setShowNew(true)}>+ New Template</Btn>
</div>
<div style={{ display:“grid”, gridTemplateColumns:“220px 1fr”, gap:16 }}>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:12 }}>
<div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:“0.08em”, textTransform:“uppercase”, marginBottom:10, padding:“0 6px” }}>Templates</div>
{Object.keys(templates).map(t => (
<button key={t} onClick={()=>setSelectedTemplate(t)} style={{ display:“block”, width:“100%”, padding:“9px 10px”, borderRadius:8, background:selectedTemplate===t?C.accentDim:“transparent”, border:`1px solid ${selectedTemplate===t?C.accent+"40":"transparent"}`, color:selectedTemplate===t?C.accent:C.text, fontWeight:selectedTemplate===t?700:500, fontSize:13, cursor:“pointer”, textAlign:“left”, fontFamily:“inherit”, marginBottom:2 }}>{t}</button>
))}
</div>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:16 }}>
<div>
<h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>{selectedTemplate}</h3>
<div style={{ color:C.muted, fontSize:12, marginTop:3 }}>{doneCount}/{items.length} items complete</div>
</div>
<div style={{ display:“flex”, gap:8, alignItems:“center” }}>
<select value={selectedProperty} onChange={e=>setSelectedProperty(e.target.value)} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:“6px 10px”, color:C.text, fontSize:12, fontFamily:“inherit” }}>
<option value="">No property</option>
{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
</select>
<Btn small variant=“ghost” onClick={()=>setCheckedItems(prev=>({…prev,[key]:{}}))} >Reset</Btn>
</div>
</div>
<div style={{ marginBottom:20 }}>
<div style={{ height:8, background:C.dim, borderRadius:4, overflow:“hidden” }}>
<div style={{ height:“100%”, width:`${pct}%`, background:pct===100?C.green:C.accent, borderRadius:4, transition:“width 0.3s” }} />
</div>
<div style={{ display:“flex”, justifyContent:“space-between”, marginTop:4 }}>
<span style={{ color:C.muted, fontSize:11 }}>{pct}% complete</span>
{pct===100 && <span style={{ color:C.green, fontSize:11, fontWeight:700 }}>✓ All done!</span>}
</div>
</div>
<div style={{ display:“flex”, flexDirection:“column”, gap:4, marginBottom:16 }}>
{items.map((item,i) => (
<div key={i} onClick={()=>setCheckedItems(prev=>({…prev,[key]:{…prev[key],[i]:!prev[key]?.[i]}}))} style={{ display:“flex”, alignItems:“center”, gap:12, padding:“10px 12px”, borderRadius:8, background:checked[i]?C.green+“10”:C.surfaceAlt, border:`1px solid ${checked[i]?C.green+"40":C.border}`, cursor:“pointer” }}>
<div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${checked[i]?C.green:C.dim}`, background:checked[i]?C.green:“transparent”, display:“flex”, alignItems:“center”, justifyContent:“center”, flexShrink:0 }}>
{checked[i] && <span style={{ color:”#fff”, fontSize:12, fontWeight:800 }}>✓</span>}
</div>
<span style={{ color:checked[i]?C.muted:C.text, fontSize:13, textDecoration:checked[i]?“line-through”:“none” }}>{item}</span>
</div>
))}
</div>
<div style={{ display:“flex”, gap:8 }}>
<Input value={customItem} onChange={setCustomItem} placeholder="Add custom item..." />
<Btn onClick={()=>{if(!customItem.trim())return;setTemplates(prev=>({…prev,[selectedTemplate]:[…(prev[selectedTemplate]||[]),customItem.trim()]}));setCustomItem(””);}}>Add</Btn>
</div>
</div>
</div>
{showNew && (
<Modal title=“New Checklist Template” onClose={()=>setShowNew(false)}>
<div style={{ display:“flex”, flexDirection:“column”, gap:12 }}>
<Input value={newName} onChange={setNewName} placeholder="Template name" />
<div style={{ display:“flex”, gap:8, justifyContent:“flex-end” }}>
<Btn variant=“ghost” onClick={()=>setShowNew(false)}>Cancel</Btn>
<Btn onClick={()=>{if(!newName.trim())return;setTemplates(prev=>({…prev,[newName]:[“Add your first item…”]}));setSelectedTemplate(newName);setShowNew(false);setNewName(””);}}>Create</Btn>
</div>
</div>
</Modal>
)}
</div>
);
}

function Schedule({ tasks, properties, staff, onRefresh }) {
const [currentWeek, setCurrentWeek] = useState(0);
const [showModal, setShowModal] = useState(false);
const [saving, setSaving] = useState(false);
const [form, setForm] = useState({ title:””, property_id:””, assignee_id:””, type:“housekeeping”, priority:“medium”, due_date:””, notes:”” });
const getWeekDays = (offset=0) => {
const now = new Date(); const day = now.getDay();
const monday = new Date(now);
monday.setDate(now.getDate()-(day===0?6:day-1)+offset*7);
return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
};
const days = getWeekDays(currentWeek);
const typeColors = { housekeeping:C.yellow, maintenance:C.red, inspection:C.purple, other:C.accent };
const dayNames = [“Mon”,“Tue”,“Wed”,“Thu”,“Fri”,“Sat”,“Sun”];
const handleSave = async () => {
if(!form.title) return alert(“Title required”);
setSaving(true);
await db.post(“tasks”,{…form,property_id:form.property_id||null,assignee_id:form.assignee_id||null,due_date:form.due_date||null,status:“pending”});
setSaving(false); setShowModal(false);
setForm({title:””,property_id:””,assignee_id:””,type:“housekeeping”,priority:“medium”,due_date:””,notes:””});
onRefresh();
};
return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<div>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Schedule</h2>
<p style={{ margin:“4px 0 0”, color:C.muted, fontSize:13 }}>{days[0].toLocaleDateString(“en-US”,{month:“short”,day:“numeric”})} – {days[6].toLocaleDateString(“en-US”,{month:“short”,day:“numeric”,year:“numeric”})}</p>
</div>
<div style={{ display:“flex”, gap:8 }}>
<Btn variant=“ghost” onClick={()=>setCurrentWeek(w=>w-1)}>← Prev</Btn>
<Btn variant=“ghost” onClick={()=>setCurrentWeek(0)}>Today</Btn>
<Btn variant=“ghost” onClick={()=>setCurrentWeek(w=>w+1)}>Next →</Btn>
<Btn onClick={()=>setShowModal(true)}>+ Schedule</Btn>
</div>
</div>
<div style={{ display:“grid”, gridTemplateColumns:“repeat(7,1fr)”, gap:8 }}>
{days.map((day,i) => {
const dayTasks = tasks.filter(t=>t.due_date&&new Date(t.due_date).toDateString()===day.toDateString());
const isToday = day.toDateString()===new Date().toDateString();
return (
<div key={i} style={{ background:C.surface, border:`1px solid ${isToday?C.accent:C.border}`, borderRadius:12, overflow:“hidden”, minHeight:160 }}>
<div style={{ padding:“10px 12px”, background:isToday?C.accentDim:“transparent”, borderBottom:`1px solid ${C.border}` }}>
<div style={{ color:isToday?C.accent:C.muted, fontSize:11, fontWeight:700, textTransform:“uppercase” }}>{dayNames[i]}</div>
<div style={{ color:isToday?C.accent:C.text, fontSize:18, fontWeight:800 }}>{day.getDate()}</div>
</div>
<div style={{ padding:8, display:“flex”, flexDirection:“column”, gap:5 }}>
{dayTasks.length===0 && <div style={{ color:C.dim, fontSize:11, textAlign:“center”, padding:“12px 0” }}>—</div>}
{dayTasks.map(t => (
<div key={t.id} style={{ background:(typeColors[t.type]||C.accent)+“18”, border:`1px solid ${typeColors[t.type]||C.accent}35`, borderRadius:6, padding:“5px 8px” }}>
<div style={{ color:typeColors[t.type]||C.accent, fontSize:10, fontWeight:700, textTransform:“uppercase” }}>{t.type}</div>
<div style={{ color:C.text, fontSize:11, fontWeight:600, marginTop:1 }}>{t.title}</div>
<div style={{ color:C.muted, fontSize:10 }}>{t.properties?.name}</div>
{t.staff?.name && <div style={{ color:C.muted, fontSize:10 }}>👤 {t.staff.name}</div>}
</div>
))}
</div>
</div>
);
})}
</div>
{showModal && (
<Modal title=“Schedule a Task” onClose={()=>setShowModal(false)}>
<div style={{ display:“flex”, flexDirection:“column”, gap:12 }}>
<div style={{ display:“grid”, gridTemplateColumns:“1fr 1fr”, gap:12 }}>
<div>
<label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:“uppercase”, letterSpacing:“0.06em”, display:“block”, marginBottom:6 }}>Department</label>
<Select value={form.type} onChange={v=>setForm({…form,type:v})} options={[“housekeeping”,“maintenance”,“inspection”,“other”].map(t=>({value:t,label:t.charAt(0).toUpperCase()+t.slice(1)}))} />
</div>
<div>
<label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:“uppercase”, letterSpacing:“0.06em”, display:“block”, marginBottom:6 }}>Priority</label>
<Select value={form.priority} onChange={v=>setForm({…form,priority:v})} options={[{value:“urgent”,label:“🚨 Urgent”},{value:“high”,label:“🔴 High”},{value:“medium”,label:“🟡 Medium”},{value:“low”,label:“🟢 Low”}]} />
</div>
</div>
<Input value={form.title} onChange={v=>setForm({…form,title:v})} placeholder=“Task title *” />
<Select value={form.property_id} onChange={v=>setForm({…form,property_id:v})} options={[{value:””,label:“Select property…”},…properties.map(p=>({value:p.id,label:p.name}))]} />
<Select value={form.assignee_id} onChange={v=>setForm({…form,assignee_id:v})} options={[{value:””,label:“Assign to staff…”},…staff.map(s=>({value:s.id,label:`${s.name} — ${s.role}`}))]} />
<Input value={form.due_date} onChange={v=>setForm({…form,due_date:v})} type=“datetime-local” />
<Textarea value={form.notes} onChange={v=>setForm({…form,notes:v})} placeholder=“Notes” rows={2} />
<div style={{ display:“flex”, gap:8, justifyContent:“flex-end” }}>
<Btn variant=“ghost” onClick={()=>setShowModal(false)}>Cancel</Btn>
<Btn onClick={handleSave}>{saving?“Saving…”:“Schedule”}</Btn>
</div>
</div>
</Modal>
)}
</div>
);
}

const msgTemplates = [
{ id:1, name:“Welcome Message”, trigger:“Check-in Day”, subject:“Welcome to {property}!”, body:“Hi {guest},\n\nWelcome! We’re so excited to have you stay at {property}.\n\n📍 Address: {address}\n🔑 Access code: {code}\n📶 WiFi: {wifi}\n\nDon’t hesitate to reach out if you need anything!\n\nWarm regards,\n{host}” },
{ id:2, name:“Pre-Arrival”, trigger:“1 Day Before”, subject:“Your stay at {property} is tomorrow!”, body:“Hi {guest},\n\nWe’re looking forward to welcoming you tomorrow at {property}!\n\nCheck-in is from 3:00 PM.\n\nSafe travels,\n{host}” },
{ id:3, name:“Checkout Reminder”, trigger:“Checkout Day”, subject:“Checkout reminder — {property}”, body:“Hi {guest},\n\nCheckout is today by 11:00 AM. Please:\n✓ Leave keys as instructed\n✓ Turn off all lights and AC\n✓ Lock all doors\n\nThank you!\n{host}” },
{ id:4, name:“Mid-Stay Check-in”, trigger:“Day 2 of Stay”, subject:“How’s your stay at {property}?”, body:“Hi {guest},\n\nHope you’re enjoying your stay! Let us know if you need anything at all.\n\nBest,\n{host}” },
{ id:5, name:“Post-Stay Review”, trigger:“1 Day After Checkout”, subject:“Thank you for staying with us!”, body:“Hi {guest},\n\nThank you so much for your stay at {property}! We hope you had a wonderful time.\n\nA quick review means the world to us!\n\nWe hope to welcome you back soon.\n\nWarm regards,\n{host}” },
];

function GuestMessaging() {
const [selected, setSelected] = useState(msgTemplates[0]);
const [editing, setEditing] = useState(false);
const [editBody, setEditBody] = useState(””);
const [editSubject, setEditSubject] = useState(””);
const [templates, setTemplates] = useState(msgTemplates);
const [showNew, setShowNew] = useState(false);
const [newName, setNewName] = useState(””);
const triggerColors = { “Check-in Day”:C.green, “1 Day Before”:C.accent, “Checkout Day”:C.yellow, “Day 2 of Stay”:C.purple, “1 Day After Checkout”:C.muted };
return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<div>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Guest Messaging</h2>
<p style={{ margin:“4px 0 0”, color:C.muted, fontSize:13 }}>Automated message templates for your guests</p>
</div>
<Btn onClick={()=>setShowNew(true)}>+ New Template</Btn>
</div>
<div style={{ display:“grid”, gridTemplateColumns:“260px 1fr”, gap:16 }}>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:12 }}>
<div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:“0.08em”, textTransform:“uppercase”, marginBottom:10, padding:“0 6px” }}>Templates</div>
{templates.map(t => (
<button key={t.id} onClick={()=>{setSelected(t);setEditing(false);}} style={{ display:“block”, width:“100%”, padding:“10px 10px”, borderRadius:8, background:selected.id===t.id?C.accentDim:“transparent”, border:`1px solid ${selected.id===t.id?C.accent+"40":"transparent"}`, color:selected.id===t.id?C.accent:C.text, fontWeight:selected.id===t.id?700:500, fontSize:13, cursor:“pointer”, textAlign:“left”, fontFamily:“inherit”, marginBottom:2 }}>
<div>{t.name}</div>
<div style={{ fontSize:10, color:triggerColors[t.trigger]||C.muted, marginTop:2, fontWeight:600 }}>⚡ {t.trigger}</div>
</button>
))}
</div>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“flex-start”, marginBottom:20 }}>
<div>
<h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>{selected.name}</h3>
<div style={{ marginTop:6 }}><Badge label={`Trigger: ${selected.trigger}`} color={triggerColors[selected.trigger]||C.muted} /></div>
</div>
<div style={{ display:“flex”, gap:8 }}>
{editing ? <>
<Btn small variant=“ghost” onClick={()=>setEditing(false)}>Cancel</Btn>
<Btn small onClick={()=>{setTemplates(prev=>prev.map(t=>t.id===selected.id?{…t,body:editBody,subject:editSubject}:t));setSelected(prev=>({…prev,body:editBody,subject:editSubject}));setEditing(false);}}>Save</Btn>
</> : <Btn small variant=“ghost” onClick={()=>{setEditBody(selected.body);setEditSubject(selected.subject);setEditing(true);}}>✏ Edit</Btn>}
</div>
</div>
<div style={{ marginBottom:16 }}>
<label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Subject Line</label>
{editing ? <Input value={editSubject} onChange={setEditSubject} placeholder="Subject..." /> :
<div style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:“10px 12px”, color:C.text, fontSize:13 }}>{selected.subject}</div>}
</div>
<div style={{ marginBottom:16 }}>
<label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Message Body</label>
{editing ? <Textarea value={editBody} onChange={setEditBody} rows={10} /> :
<div style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:“12px 14px”, color:C.text, fontSize:13, whiteSpace:“pre-wrap”, lineHeight:1.6 }}>{selected.body}</div>}
</div>
<div style={{ background:C.accentDim, border:`1px solid ${C.accent}33`, borderRadius:8, padding:12 }}>
<div style={{ color:C.accent, fontSize:12, fontWeight:700, marginBottom:6 }}>📌 Variables</div>
<div style={{ display:“flex”, gap:8, flexWrap:“wrap” }}>
{[”{property}”,”{guest}”,”{address}”,”{code}”,”{wifi}”,”{host}”].map(v=>(
<span key={v} style={{ background:C.accent+“22”, color:C.accent, borderRadius:4, padding:“2px 8px”, fontSize:11, fontFamily:“monospace” }}>{v}</span>
))}
</div>
</div>
</div>
</div>
{showNew && (
<Modal title=“New Message Template” onClose={()=>setShowNew(false)}>
<div style={{ display:“flex”, flexDirection:“column”, gap:12 }}>
<Input value={newName} onChange={setNewName} placeholder="Template name" />
<div style={{ display:“flex”, gap:8, justifyContent:“flex-end” }}>
<Btn variant=“ghost” onClick={()=>setShowNew(false)}>Cancel</Btn>
<Btn onClick={()=>{if(!newName.trim())return;const t={id:Date.now(),name:newName,trigger:“Manual”,subject:“Message from {host}”,body:“Hi {guest},\n\n\n\nBest,\n{host}”};setTemplates(prev=>[…prev,t]);setSelected(t);setShowNew(false);setNewName(””);}}>Create</Btn>
</div>
</div>
</Modal>
)}
</div>
);
}

function StaffPage({ staff, tasks, onRefresh }) {
const [showModal, setShowModal] = useState(false);
const [saving, setSaving] = useState(false);
const [form, setForm] = useState({ name:””, role:“Housekeeper”, email:””, phone:””, color:”#4f8ef7” });
const colors = [”#f472b6”,”#60a5fa”,”#34d399”,”#fbbf24”,”#a78bfa”,”#fb923c”,”#e879f9”,”#2dd4bf”];
return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Staff & Assignments</h2>
<Btn onClick={()=>setShowModal(true)}>+ Add Staff</Btn>
</div>
<div style={{ display:“grid”, gridTemplateColumns:“repeat(auto-fill, minmax(260px, 1fr))”, gap:14 }}>
{staff.map(s => {
const mt = tasks.filter(t=>t.assignee_id===s.id);
const done = mt.filter(t=>t.status===“completed”).length;
const pct = mt.length>0?Math.round(done/mt.length*100):0;
return (
<div key={s.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
<div style={{ display:“flex”, alignItems:“center”, gap:12, marginBottom:16 }}>
<div style={{ width:44, height:44, borderRadius:“50%”, background:s.color+“30”, border:`2px solid ${s.color}`, display:“flex”, alignItems:“center”, justifyContent:“center”, fontWeight:800, fontSize:13, color:s.color, flexShrink:0 }}>
{s.name.split(” “).map(n=>n[0]).join(””).slice(0,2)}
</div>
<div style={{ flex:1 }}>
<div style={{ color:C.text, fontWeight:700, fontSize:14 }}>{s.name}</div>
<div style={{ color:C.muted, fontSize:12 }}>{s.role}</div>
{s.email && <div style={{ color:C.muted, fontSize:11 }}>{s.email}</div>}
</div>
<Btn small variant=“danger” onClick={async()=>{if(confirm(“Remove?”)){{await db.delete(“staff”,s.id);onRefresh();}}}}>✕</Btn>
</div>
<div style={{ display:“flex”, justifyContent:“space-between”, marginBottom:6 }}>
<span style={{ fontSize:12, color:C.muted }}>Tasks assigned</span>
<span style={{ fontSize:12, color:C.text, fontWeight:600 }}>{done}/{mt.length}</span>
</div>
<div style={{ height:6, background:C.dim, borderRadius:4 }}>
<div style={{ height:“100%”, width:`${pct}%`, background:s.color, borderRadius:4 }} />
</div>
<div style={{ display:“flex”, justifyContent:“space-between”, marginTop:5 }}>
<span style={{ fontSize:11, color:C.muted }}>{pct}% complete</span>
<span style={{ fontSize:11, color:mt.length-done>0?C.yellow:C.green }}>{mt.length-done} remaining</span>
</div>
</div>
);
})}
{staff.length===0 && <div style={{ gridColumn:“1/-1”, color:C.muted, textAlign:“center”, padding:60, background:C.surface, borderRadius:14, border:`1px solid ${C.border}` }}>No staff added yet.</div>}
</div>
{showModal && (
<Modal title=“Add Staff Member” onClose={()=>setShowModal(false)}>
<div style={{ display:“flex”, flexDirection:“column”, gap:12 }}>
<Input value={form.name} onChange={v=>setForm({…form,name:v})} placeholder=“Full name *” />
<Input value={form.email} onChange={v=>setForm({…form,email:v})} placeholder=“Email *” type=“email” />
<Input value={form.phone} onChange={v=>setForm({…form,phone:v})} placeholder=“Phone” />
<Select value={form.role} onChange={v=>setForm({…form,role:v})} options={[“Housekeeper”,“Maintenance Tech”,“Inspector”,“Groundskeeper”,“Property Manager”,“Supervisor”].map(r=>({value:r,label:r}))} />
<div>
<div style={{ color:C.muted, fontSize:12, marginBottom:8 }}>Profile color</div>
<div style={{ display:“flex”, gap:8, flexWrap:“wrap” }}>
{colors.map(c=><div key={c} onClick={()=>setForm({…form,color:c})} style={{ width:28, height:28, borderRadius:“50%”, background:c, cursor:“pointer”, border:form.color===c?“3px solid #fff”:“3px solid transparent” }} />)}
</div>
</div>
<div style={{ display:“flex”, gap:8, justifyContent:“flex-end” }}>
<Btn variant=“ghost” onClick={()=>setShowModal(false)}>Cancel</Btn>
<Btn onClick={async()=>{if(!form.name||!form.email)return alert(“Name and email required”);setSaving(true);await db.post(“staff”,form);setSaving(false);setShowModal(false);setForm({name:””,role:“Housekeeper”,email:””,phone:””,color:”#4f8ef7”});onRefresh();}}>{saving?“Saving…”:“Add Staff”}</Btn>
</div>
</div>
</Modal>
)}
</div>
);
}

function Reports({ tasks, properties, staff }) {
const total = tasks.length;
const completed = tasks.filter(t=>t.status===“completed”).length;
const rate = total>0?Math.round(completed/total*100):0;
const byType = [“housekeeping”,“maintenance”,“inspection”,“other”].map(type=>({type,count:tasks.filter(t=>t.type===type).length}));
const typeColors = { housekeeping:C.yellow, maintenance:C.red, inspection:C.purple, other:C.accent };
return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Reports & Analytics</h2>
</div>
<div style={{ display:“flex”, gap:12, marginBottom:20, flexWrap:“wrap” }}>
<StatCard label="Total Tasks" value={total} sub="All time" color={C.accent} icon="✓" />
<StatCard label=“Completed” value={completed} sub={`${rate}% completion`} color={C.green} icon=“▲” />
<StatCard label=“In Progress” value={tasks.filter(t=>t.status===“in-progress”).length} sub=“Active now” color={C.yellow} icon=“⟳” />
<StatCard label="Staff Active" value={staff.length} sub="Team members" color={C.purple} icon="⬤" />
</div>
<div style={{ display:“grid”, gridTemplateColumns:“1fr 1fr”, gap:14 }}>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
<h3 style={{ margin:“0 0 20px”, fontSize:15, fontWeight:700, color:C.text }}>Tasks by Type</h3>
{byType.map(({type,count})=>(
<div key={type} style={{ marginBottom:14 }}>
<div style={{ display:“flex”, justifyContent:“space-between”, marginBottom:6 }}>
<span style={{ color:C.text, fontSize:13, textTransform:“capitalize” }}>{type}</span>
<span style={{ color:C.muted, fontSize:13 }}>{count}</span>
</div>
<div style={{ height:6, background:C.dim, borderRadius:4 }}>
<div style={{ height:“100%”, width:total>0?`${count/total*100}%`:“0%”, background:typeColors[type], borderRadius:4 }} />
</div>
</div>
))}
</div>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
<h3 style={{ margin:“0 0 20px”, fontSize:15, fontWeight:700, color:C.text }}>Staff Performance</h3>
{staff.map(s=>{
const mt=tasks.filter(t=>t.assignee_id===s.id);
const done=mt.filter(t=>t.status===“completed”).length;
return (
<div key={s.id} style={{ display:“flex”, alignItems:“center”, gap:10, marginBottom:12 }}>
<div style={{ width:30, height:30, borderRadius:“50%”, background:s.color+“25”, border:`2px solid ${s.color}`, display:“flex”, alignItems:“center”, justifyContent:“center”, fontSize:10, fontWeight:800, color:s.color, flexShrink:0 }}>
{s.name.split(” “).map(n=>n[0]).join(””).slice(0,2)}
</div>
<div style={{ flex:1 }}>
<div style={{ color:C.text, fontSize:13 }}>{s.name}</div>
<div style={{ color:C.muted, fontSize:11 }}>{s.role}</div>
</div>
<div style={{ textAlign:“right” }}>
<div style={{ color:s.color, fontWeight:700, fontSize:13 }}>{done} done</div>
<div style={{ color:C.muted, fontSize:11 }}>{mt.length} total</div>
</div>
</div>
);
})}
{staff.length===0 && <div style={{ color:C.muted, textAlign:“center”, padding:20 }}>No staff yet</div>}
</div>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24, gridColumn:“1/-1” }}>
<h3 style={{ margin:“0 0 16px”, fontSize:15, fontWeight:700, color:C.text }}>Property Overview</h3>
<div style={{ display:“grid”, gridTemplateColumns:“repeat(auto-fill, minmax(200px, 1fr))”, gap:12 }}>
{properties.map(p=>{
const pt=tasks.filter(t=>t.property_id===p.id);
const pd=pt.filter(t=>t.status===“completed”).length;
return (
<div key={p.id} style={{ background:C.surfaceAlt, borderRadius:10, padding:14, border:`1px solid ${C.border}` }}>
<div style={{ color:C.text, fontWeight:600, fontSize:13, marginBottom:4 }}>{p.name}</div>
<div style={{ display:“flex”, alignItems:“center”, gap:6, marginBottom:8 }}>
<div style={{ width:8, height:8, borderRadius:“50%”, background:statusColor(p.status) }} />
<span style={{ color:C.muted, fontSize:11, textTransform:“capitalize” }}>{p.status}</span>
</div>
<div style={{ color:C.muted, fontSize:11 }}>{pd}/{pt.length} tasks done</div>
</div>
);
})}
</div>
</div>
</div>
</div>
);
}

function Settings() {
const [settings, setSettings] = useState(getSettings);
const [saved, setSaved] = useState(false);
const [activeTab, setActiveTab] = useState(“company”);
const accentColors = [”#4f8ef7”,”#34d399”,”#f472b6”,”#fbbf24”,”#a78bfa”,”#fb923c”,”#e879f9”,”#2dd4bf”,”#f87171”];
const save = () => { localStorage.setItem(“vr365_settings”, JSON.stringify(settings)); setSaved(true); setTimeout(()=>setSaved(false), 2500); };
const set = (key, val) => setSettings(s=>({…s,[key]:val}));
return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<div>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Settings</h2>
<p style={{ margin:“4px 0 0”, color:C.muted, fontSize:13 }}>Customize your VR365 PropFlow experience</p>
</div>
<button onClick={save} style={{ background:saved?C.green:C.accent, color:”#fff”, border:“none”, borderRadius:8, padding:“9px 20px”, fontWeight:700, cursor:“pointer”, fontSize:13, fontFamily:“inherit”, transition:“background 0.3s” }}>{saved?“✓ Saved!”:“Save Changes”}</button>
</div>
<div style={{ display:“flex”, gap:4, marginBottom:24, background:C.surface, padding:4, borderRadius:10, border:`1px solid ${C.border}`, width:“fit-content” }}>
{[“company”,“profile”,“notifications”,“preferences”].map(t=>(
<button key={t} onClick={()=>setActiveTab(t)} style={{ background:activeTab===t?C.accent:“transparent”, color:activeTab===t?”#fff”:C.muted, border:“none”, borderRadius:7, padding:“7px 16px”, fontWeight:600, fontSize:13, cursor:“pointer”, fontFamily:“inherit”, textTransform:“capitalize” }}>{t}</button>
))}
</div>
{activeTab===“company” && (
<div style={{ display:“grid”, gridTemplateColumns:“1fr 1fr”, gap:16 }}>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24, gridColumn:“1/-1” }}>
<h3 style={{ margin:“0 0 16px”, fontSize:15, fontWeight:700, color:C.text }}>🏢 Company Branding</h3>
<div style={{ display:“grid”, gridTemplateColumns:“1fr 1fr”, gap:14 }}>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Company / App Name</label><Input value={settings.companyName} onChange={v=>set(“companyName”,v)} placeholder=“VR365 PropFlow” /></div>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Tagline</label><Input value={settings.tagline} onChange={v=>set(“tagline”,v)} placeholder=“Property Management” /></div>
</div>
</div>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
<h3 style={{ margin:“0 0 16px”, fontSize:15, fontWeight:700, color:C.text }}>🎨 Brand Color</h3>
<div style={{ display:“flex”, gap:10, flexWrap:“wrap”, marginBottom:16 }}>
{accentColors.map(c=><div key={c} onClick={()=>set(“accentColor”,c)} style={{ width:36, height:36, borderRadius:“50%”, background:c, cursor:“pointer”, border:settings.accentColor===c?“3px solid #fff”:“3px solid transparent”, boxShadow:settings.accentColor===c?`0 0 0 2px ${c}`:“none” }} />)}
</div>
<div style={{ padding:12, background:settings.accentColor+“18”, borderRadius:8, border:`1px solid ${settings.accentColor}33` }}>
<span style={{ color:settings.accentColor, fontWeight:700, fontSize:13 }}>Preview color ●</span>
</div>
</div>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
<h3 style={{ margin:“0 0 16px”, fontSize:15, fontWeight:700, color:C.text }}>👁 Sidebar Preview</h3>
<div style={{ background:C.bg, borderRadius:10, padding:14, border:`1px solid ${C.border}` }}>
<div style={{ display:“flex”, alignItems:“center”, gap:10, marginBottom:12 }}>
<div style={{ width:32, height:32, background:settings.accentColor, borderRadius:8, display:“flex”, alignItems:“center”, justifyContent:“center”, fontSize:16 }}>⌂</div>
<div>
<div style={{ fontWeight:800, fontSize:14, color:C.text }}>{settings.companyName||“VR365 PropFlow”}</div>
<div style={{ fontSize:11, color:C.muted }}>{settings.tagline||“Property Management”}</div>
</div>
</div>
<div style={{ background:settings.accentColor+“22”, border:`1px solid ${settings.accentColor}44`, borderRadius:7, padding:“8px 12px”, fontSize:13, color:settings.accentColor, fontWeight:600 }}>⬡ Dashboard — Active</div>
</div>
</div>
</div>
)}
{activeTab===“profile” && (
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24, maxWidth:560 }}>
<h3 style={{ margin:“0 0 20px”, fontSize:15, fontWeight:700, color:C.text }}>👤 Manager Profile</h3>
<div style={{ display:“flex”, flexDirection:“column”, gap:14 }}>
<div style={{ display:“flex”, alignItems:“center”, gap:16, marginBottom:8 }}>
<div style={{ width:60, height:60, borderRadius:“50%”, background:settings.accentColor+“30”, border:`3px solid ${settings.accentColor}`, display:“flex”, alignItems:“center”, justifyContent:“center”, fontSize:22, color:settings.accentColor, fontWeight:800 }}>
{(settings.managerName||“PM”).split(” “).map(n=>n[0]).join(””).slice(0,2)}
</div>
<div>
<div style={{ color:C.text, fontWeight:700 }}>{settings.managerName||“Property Manager”}</div>
<div style={{ color:C.muted, fontSize:12 }}>Admin — Full Access</div>
</div>
</div>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Full Name</label><Input value={settings.managerName} onChange={v=>set(“managerName”,v)} placeholder=“Your name” /></div>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Email</label><Input value={settings.managerEmail} onChange={v=>set(“managerEmail”,v)} placeholder=“your@email.com” type=“email” /></div>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Phone</label><Input value={settings.managerPhone} onChange={v=>set(“managerPhone”,v)} placeholder=”+1 (555) 000-0000” /></div>
</div>
</div>
)}
{activeTab===“notifications” && (
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24, maxWidth:560 }}>
<h3 style={{ margin:“0 0 20px”, fontSize:15, fontWeight:700, color:C.text }}>🔔 Notifications</h3>
{[{key:“taskReminders”,label:“Task Reminders”,desc:“Notified when tasks are due soon”},{key:“checkoutAlerts”,label:“Checkout Alerts”,desc:“Alerts when guests check out”},{key:“maintenanceAlerts”,label:“Maintenance Alerts”,desc:“Urgent maintenance notifications”}].map(({key,label,desc})=>(
<div key={key} style={{ display:“flex”, alignItems:“center”, justifyContent:“space-between”, padding:“14px 0”, borderBottom:`1px solid ${C.border}` }}>
<div>
<div style={{ color:C.text, fontWeight:600, fontSize:14 }}>{label}</div>
<div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{desc}</div>
</div>
<Toggle value={settings[key]!==false} onChange={v=>set(key,v)} />
</div>
))}
</div>
)}
{activeTab===“preferences” && (
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:24, maxWidth:560 }}>
<h3 style={{ margin:“0 0 20px”, fontSize:15, fontWeight:700, color:C.text }}>⚙ Preferences</h3>
<div style={{ display:“flex”, flexDirection:“column”, gap:14 }}>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Timezone</label><Select value={settings.timezone||“America/Los_Angeles”} onChange={v=>set(“timezone”,v)} options={[{value:“America/Los_Angeles”,label:“Pacific Time (PT)”},{value:“America/Denver”,label:“Mountain Time (MT)”},{value:“America/Chicago”,label:“Central Time (CT)”},{value:“America/New_York”,label:“Eastern Time (ET)”}]} /></div>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Date Format</label><Select value={settings.dateFormat||“MM/DD/YYYY”} onChange={v=>set(“dateFormat”,v)} options={[{value:“MM/DD/YYYY”,label:“MM/DD/YYYY (US)”},{value:“DD/MM/YYYY”,label:“DD/MM/YYYY (EU)”},{value:“YYYY-MM-DD”,label:“YYYY-MM-DD (ISO)”}]} /></div>
<div><label style={{ color:C.muted, fontSize:12, fontWeight:600, display:“block”, marginBottom:6 }}>Currency</label><Select value={settings.currency||“USD”} onChange={v=>set(“currency”,v)} options={[{value:“USD”,label:“USD — US Dollar”},{value:“EUR”,label:“EUR — Euro”},{value:“GBP”,label:“GBP — British Pound”},{value:“CAD”,label:“CAD — Canadian Dollar”}]} /></div>
</div>
</div>
)}
</div>
);
}

// =============================================
// RESERVATIONS
// =============================================
const sampleReservations = [
{ id:1, guest:“Johnson Family”, property_id:null, property:“Ocean View Villa”, checkin:“2026-04-11”, checkout:“2026-04-14”, guests:4, status:“confirmed”, source:“Airbnb”, notes:“Late check-in requested” },
{ id:2, guest:“Williams, R.”, property_id:null, property:“Beachfront Suite”, checkin:“2026-04-10”, checkout:“2026-04-14”, guests:2, status:“active”, source:“VRBO”, notes:”” },
{ id:3, guest:“Chen Party”, property_id:null, property:“Palm Springs Casa”, checkin:“2026-04-09”, checkout:“2026-04-12”, guests:6, status:“active”, source:“Direct”, notes:“Pool heat requested” },
{ id:4, guest:“Martinez, J.”, property_id:null, property:“Sunset Cottage”, checkin:“2026-04-15”, checkout:“2026-04-18”, guests:3, status:“upcoming”, source:“Airbnb”, notes:”” },
{ id:5, guest:“Taylor Group”, property_id:null, property:“Mountain Retreat”, checkin:“2026-04-20”, checkout:“2026-04-25”, guests:8, status:“upcoming”, source:“VRBO”, notes:“Bachelor party — extra towels” },
{ id:6, guest:“Anderson, M.”, property_id:null, property:“Downtown Loft #3”, checkin:“2026-04-08”, checkout:“2026-04-10”, guests:2, status:“completed”, source:“Direct”, notes:”” },
];

function Reservations({ properties }) {
const [reservations, setReservations] = useState(sampleReservations);
const [showModal, setShowModal] = useState(false);
const [showFilters, setShowFilters] = useState(false);
const [selected, setSelected] = useState(null);
const [form, setForm] = useState({ guest:””, property:””, checkin:””, checkout:””, guests:1, status:“upcoming”, source:“Direct”, notes:”” });

// Filter states
const [search, setSearch] = useState(””);
const [filterStatus, setFilterStatus] = useState(“all”);
const [filterSource, setFilterSource] = useState(“all”);
const [filterProperty, setFilterProperty] = useState(“all”);
const [filterGuests, setFilterGuests] = useState(“all”);
const [filterDateFrom, setFilterDateFrom] = useState(””);
const [filterDateTo, setFilterDateTo] = useState(””);
const [filterNights, setFilterNights] = useState(“all”);
const [filterSpecial, setFilterSpecial] = useState(false);

const statusColor = s => ({ active:C.green, confirmed:C.accent, upcoming:C.yellow, completed:C.muted, cancelled:C.red }[s] || C.muted);
const nights = (checkin, checkout) => {
if (!checkin || !checkout) return 0;
return Math.round((new Date(checkout) - new Date(checkin)) / (1000*60*60*24));
};

const allProperties = […new Set(reservations.map(r => r.property))];
const allSources = [“all”,“Airbnb”,“VRBO”,“Booking.com”,“Direct”,“Expedia”,“TripAdvisor”,“Other”];

const activeFilterCount = [
filterStatus !== “all”,
filterSource !== “all”,
filterProperty !== “all”,
filterGuests !== “all”,
filterDateFrom !== “”,
filterDateTo !== “”,
filterNights !== “all”,
filterSpecial,
search !== “”,
].filter(Boolean).length;

const clearFilters = () => {
setSearch(””); setFilterStatus(“all”); setFilterSource(“all”);
setFilterProperty(“all”); setFilterGuests(“all”);
setFilterDateFrom(””); setFilterDateTo(””);
setFilterNights(“all”); setFilterSpecial(false);
};

const filtered = reservations.filter(r => {
if (search && !r.guest.toLowerCase().includes(search.toLowerCase()) && !r.property.toLowerCase().includes(search.toLowerCase())) return false;
if (filterStatus !== “all” && r.status !== filterStatus) return false;
if (filterSource !== “all” && r.source !== filterSource) return false;
if (filterProperty !== “all” && r.property !== filterProperty) return false;
if (filterGuests === “solo” && r.guests > 1) return false;
if (filterGuests === “couple” && (r.guests < 2 || r.guests > 2)) return false;
if (filterGuests === “group” && r.guests < 3) return false;
if (filterGuests === “large” && r.guests < 6) return false;
if (filterDateFrom && r.checkin < filterDateFrom) return false;
if (filterDateTo && r.checkout > filterDateTo) return false;
const n = nights(r.checkin, r.checkout);
if (filterNights === “short” && n > 3) return false;
if (filterNights === “week” && (n < 4 || n > 7)) return false;
if (filterNights === “long” && n < 8) return false;
if (filterSpecial && !r.notes) return false;
return true;
});

const handleSave = () => {
if (!form.guest || !form.property) return alert(“Guest name and property required”);
setReservations(prev => […prev, { …form, id: Date.now(), guests: parseInt(form.guests) || 1 }]);
setShowModal(false);
setForm({ guest:””, property:””, checkin:””, checkout:””, guests:1, status:“upcoming”, source:“Direct”, notes:”” });
};

const sourceColors = { Airbnb:”#ff5a5f”, VRBO:”#1a5fb4”, “Booking.com”:”#003580”, Direct:C.green, Expedia:”#fec600”, TripAdvisor:”#34e0a1”, Other:C.muted };

return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<div>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Reservations</h2>
<p style={{ margin:“4px 0 0”, color:C.muted, fontSize:13 }}>{filtered.length} of {reservations.length} reservations</p>
</div>
<div style={{ display:“flex”, gap:8 }}>
<button onClick={()=>setShowFilters(!showFilters)} style={{ background:activeFilterCount>0?C.accent+“22”:C.surface, color:activeFilterCount>0?C.accent:C.muted, border:`1px solid ${activeFilterCount>0?C.accent:C.border}`, borderRadius:8, padding:“8px 14px”, fontWeight:700, cursor:“pointer”, fontSize:13, fontFamily:“inherit”, display:“flex”, alignItems:“center”, gap:6 }}>
⚡ Filters {activeFilterCount>0 && <span style={{ background:C.accent, color:”#fff”, borderRadius:10, padding:“1px 7px”, fontSize:10, fontWeight:800 }}>{activeFilterCount}</span>}
</button>
<Btn onClick={()=>setShowModal(true)}>+ Add Reservation</Btn>
</div>
</div>

```
  {/* Stats */}
  <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
    {[
      { label:"Active Stays", value:reservations.filter(r=>r.status==="active").length, color:C.green },
      { label:"Upcoming", value:reservations.filter(r=>r.status==="upcoming").length, color:C.yellow },
      { label:"Confirmed", value:reservations.filter(r=>r.status==="confirmed").length, color:C.accent },
      { label:"Total", value:reservations.length, color:C.purple },
    ].map(s => (
      <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px", flex:1, minWidth:110 }}>
        <div style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
        <div style={{ color:s.color, fontSize:26, fontWeight:800, marginTop:4 }}>{s.value}</div>
      </div>
    ))}
  </div>

  {/* Search Bar */}
  <div style={{ position:"relative", marginBottom:12 }}>
    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.muted, fontSize:14 }}>🔍</span>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by guest name or property..." style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px 10px 36px", color:C.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
    {search && <button onClick={()=>setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>×</button>}
  </div>

  {/* Filter Panel */}
  {showFilters && (
    <div style={{ background:C.surface, border:`1px solid ${C.accent}44`, borderRadius:14, padding:20, marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>⚡ Advanced Filters</div>
        <div style={{ display:"flex", gap:8 }}>
          {activeFilterCount > 0 && <Btn small variant="ghost" onClick={clearFilters}>Clear all ({activeFilterCount})</Btn>}
          <Btn small variant="ghost" onClick={()=>setShowFilters(false)}>Hide</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {/* Status */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Status</label>
          <Select value={filterStatus} onChange={setFilterStatus} options={[{value:"all",label:"All Statuses"},{value:"active",label:"Active"},{value:"confirmed",label:"Confirmed"},{value:"upcoming",label:"Upcoming"},{value:"completed",label:"Completed"},{value:"cancelled",label:"Cancelled"}]} />
        </div>

        {/* Source / OTA */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Source / OTA</label>
          <Select value={filterSource} onChange={setFilterSource} options={allSources.map(s=>({value:s,label:s==="all"?"All Sources":s}))} />
        </div>

        {/* Property */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Property</label>
          <Select value={filterProperty} onChange={setFilterProperty} options={[{value:"all",label:"All Properties"},...allProperties.map(p=>({value:p,label:p}))]} />
        </div>

        {/* Guest Count */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Party Size</label>
          <Select value={filterGuests} onChange={setFilterGuests} options={[{value:"all",label:"Any Size"},{value:"solo",label:"Solo (1 guest)"},{value:"couple",label:"Couple (2 guests)"},{value:"group",label:"Group (3-5)"},{value:"large",label:"Large Group (6+)"}]} />
        </div>

        {/* Stay Length */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Stay Length</label>
          <Select value={filterNights} onChange={setFilterNights} options={[{value:"all",label:"Any Length"},{value:"short",label:"Short (1-3 nights)"},{value:"week",label:"Week (4-7 nights)"},{value:"long",label:"Long Stay (8+ nights)"}]} />
        </div>

        {/* Special Requests */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Special Requests</label>
          <div onClick={()=>setFilterSpecial(!filterSpecial)} style={{ display:"flex", alignItems:"center", gap:8, background:C.surfaceAlt, border:`1px solid ${filterSpecial?C.accent:C.border}`, borderRadius:8, padding:"9px 12px", cursor:"pointer" }}>
            <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${filterSpecial?C.accent:C.dim}`, background:filterSpecial?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {filterSpecial && <span style={{ color:"#fff", fontSize:11, fontWeight:800 }}>✓</span>}
            </div>
            <span style={{ color:filterSpecial?C.accent:C.muted, fontSize:13 }}>Has special requests</span>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Check-in From</label>
          <Input value={filterDateFrom} onChange={setFilterDateFrom} type="date" placeholder="From date" />
        </div>
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Check-out To</label>
          <Input value={filterDateTo} onChange={setFilterDateTo} type="date" placeholder="To date" />
        </div>
      </div>

      {/* OTA Quick Filter Chips */}
      <div style={{ marginTop:14 }}>
        <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:8 }}>Quick OTA Filter</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["Airbnb","VRBO","Booking.com","Direct","Expedia","TripAdvisor"].map(ota=>(
            <button key={ota} onClick={()=>setFilterSource(filterSource===ota?"all":ota)} style={{ background:filterSource===ota?(sourceColors[ota]||C.accent)+"22":C.surfaceAlt, color:filterSource===ota?(sourceColors[ota]||C.accent):C.muted, border:`1px solid ${filterSource===ota?(sourceColors[ota]||C.accent)+"60":C.border}`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{ota}</button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Active Filter Tags */}
  {activeFilterCount > 0 && !showFilters && (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
      {filterStatus !== "all" && <span style={{ background:C.accent+"22", color:C.accent, border:`1px solid ${C.accent}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>Status: {filterStatus}</span>}
      {filterSource !== "all" && <span style={{ background:(sourceColors[filterSource]||C.purple)+"22", color:sourceColors[filterSource]||C.purple, border:`1px solid ${(sourceColors[filterSource]||C.purple)}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>{filterSource}</span>}
      {filterProperty !== "all" && <span style={{ background:C.green+"22", color:C.green, border:`1px solid ${C.green}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>🏠 {filterProperty.slice(0,20)}</span>}
      {filterGuests !== "all" && <span style={{ background:C.yellow+"22", color:C.yellow, border:`1px solid ${C.yellow}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>👥 {filterGuests}</span>}
      {filterNights !== "all" && <span style={{ background:C.purple+"22", color:C.purple, border:`1px solid ${C.purple}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>🌙 {filterNights} stay</span>}
      {filterSpecial && <span style={{ background:C.red+"22", color:C.red, border:`1px solid ${C.red}44`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600 }}>⚡ Special requests</span>}
      <button onClick={clearFilters} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:20, padding:"4px 12px", fontSize:12, color:C.muted, cursor:"pointer", fontFamily:"inherit" }}>Clear all ×</button>
    </div>
  )}

  {/* Reservation Cards */}
  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    {filtered.length===0 && (
      <div style={{ color:C.muted, textAlign:"center", padding:60, background:C.surface, borderRadius:14, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
        <div style={{ fontWeight:700, marginBottom:4 }}>No reservations match your filters</div>
        <div style={{ fontSize:13 }}>Try adjusting or <span onClick={clearFilters} style={{ color:C.accent, cursor:"pointer" }}>clearing your filters</span></div>
      </div>
    )}
    {filtered.map(r => (
      <div key={r.id} onClick={()=>setSelected(selected?.id===r.id?null:r)} style={{ background:C.surface, border:`1px solid ${selected?.id===r.id?C.accent:C.border}`, borderRadius:14, padding:18, cursor:"pointer", transition:"border-color 0.15s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div style={{ flex:1, marginRight:12 }}>
            <div style={{ color:C.text, fontWeight:700, fontSize:15 }}>{r.guest}</div>
            <div style={{ color:C.muted, fontSize:13, marginTop:2 }}>🏠 {r.property}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
            <Badge label={r.status} color={statusColor(r.status)} />
            <span style={{ background:(sourceColors[r.source]||C.purple)+"22", color:sourceColors[r.source]||C.purple, border:`1px solid ${(sourceColors[r.source]||C.purple)}44`, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{r.source}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
          <span style={{ color:C.muted, fontSize:12 }}>📅 {r.checkin} → {r.checkout}</span>
          <span style={{ color:C.muted, fontSize:12 }}>🌙 {nights(r.checkin, r.checkout)} nights</span>
          <span style={{ color:C.muted, fontSize:12 }}>👥 {r.guests} guest{r.guests>1?"s":""}</span>
          {r.notes && <span style={{ color:C.yellow, fontSize:12 }}>⚡ Special request</span>}
        </div>
        {selected?.id===r.id && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
            {r.notes && <div style={{ background:C.yellow+"15", border:`1px solid ${C.yellow}33`, borderRadius:8, padding:"8px 12px", color:C.text, fontSize:13, marginBottom:12 }}>📝 {r.notes}</div>}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["confirmed","active","completed","cancelled"].filter(s=>s!==r.status).map(s=>(
                <Btn key={s} small variant="ghost" onClick={e=>{e.stopPropagation();setReservations(prev=>prev.map(res=>res.id===r.id?{...res,status:s}:res));}}>→ {s}</Btn>
              ))}
              <Btn small variant="danger" onClick={e=>{e.stopPropagation();if(confirm("Delete?"))setReservations(prev=>prev.filter(res=>res.id!==r.id));}}>Delete</Btn>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>

  {showModal && (
    <Modal title="Add Reservation" onClose={()=>setShowModal(false)}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Input value={form.guest} onChange={v=>setForm({...form,guest:v})} placeholder="Guest name *" />
        <Input value={form.property} onChange={v=>setForm({...form,property:v})} placeholder="Property name *" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input value={form.checkin} onChange={v=>setForm({...form,checkin:v})} placeholder="Check-in" type="date" />
          <Input value={form.checkout} onChange={v=>setForm({...form,checkout:v})} placeholder="Check-out" type="date" />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input value={form.guests} onChange={v=>setForm({...form,guests:v})} placeholder="# Guests" type="number" />
          <Select value={form.source} onChange={v=>setForm({...form,source:v})} options={["Direct","Airbnb","VRBO","Booking.com","Expedia","TripAdvisor","Other"].map(s=>({value:s,label:s}))} />
        </div>
        <Select value={form.status} onChange={v=>setForm({...form,status:v})} options={["upcoming","confirmed","active","completed","cancelled"].map(s=>({value:s,label:s}))} />
        <Textarea value={form.notes} onChange={v=>setForm({...form,notes:v})} placeholder="Special requests or notes" rows={2} />
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>Save Reservation</Btn>
        </div>
      </div>
    </Modal>
  )}
</div>
```

);
}

// =============================================
// REPORTED ISSUES
// =============================================
const sampleIssues = [
{ id:1, title:“Leaking faucet in master bathroom”, property:“Ocean View Villa”, reported_by:“Maria L.”, priority:“high”, status:“open”, category:“Plumbing”, date:“2026-04-09”, description:“The hot water faucet in master bathroom is dripping constantly. Needs immediate attention before next guest arrival.”, photos:[] },
{ id:2, title:“AC not cooling properly”, property:“Mountain Retreat”, reported_by:“Carlos M.”, priority:“high”, status:“in-progress”, category:“HVAC”, date:“2026-04-08”, description:“Air conditioning unit is running but not reaching set temperature. Possible refrigerant issue.”, photos:[] },
{ id:3, title:“Broken deck chair”, property:“Beachfront Suite”, reported_by:“Sofia R.”, priority:“medium”, status:“open”, category:“Furniture”, date:“2026-04-09”, description:“One of the outdoor deck chairs has a broken armrest. Needs replacement before next guests.”, photos:[] },
{ id:4, title:“WiFi router not working”, property:“Downtown Loft #3”, reported_by:“James T.”, priority:“high”, status:“resolved”, category:“Technology”, date:“2026-04-07”, description:“Router needed restart. Resolved by unplugging and replugging. Monitoring for recurrence.”, photos:[] },
{ id:5, title:“Pool pump making noise”, property:“Palm Springs Casa”, reported_by:“David N.”, priority:“medium”, status:“open”, category:“Pool”, date:“2026-04-08”, description:“Pool pump making grinding noise. Needs inspection by pool technician.”, photos:[] },
];

function ReportedIssues({ properties, staff }) {
const [issues, setIssues] = useState(sampleIssues);
const [filter, setFilter] = useState(“all”);
const [showModal, setShowModal] = useState(false);
const [showStaffPicker, setShowStaffPicker] = useState(false);
const [staffSearch, setStaffSearch] = useState(””);
const [selected, setSelected] = useState(null);
const [form, setForm] = useState({ title:””, property:””, reported_by:””, priority:“medium”, status:“open”, category:“General”, description:”” });

const filtered = filter===“all” ? issues : issues.filter(i=>i.status===filter);
const issueStatusColor = s => ({ open:C.red, “in-progress”:C.yellow, resolved:C.green, closed:C.muted }[s] || C.muted);
const categories = [“Plumbing”,“HVAC”,“Electrical”,“Furniture”,“Appliance”,“Pool”,“Technology”,“Structural”,“Landscaping”,“General”];

const handleSave = () => {
if (!form.title) return alert(“Issue title required”);
setIssues(prev => […prev, { …form, id:Date.now(), date:new Date().toISOString().split(“T”)[0], photos:[] }]);
setShowModal(false);
setForm({ title:””, property:””, reported_by:””, priority:“medium”, status:“open”, category:“General”, description:”” });
};

return (
<div>
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:24 }}>
<div>
<h2 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>Reported Issues</h2>
<p style={{ margin:“4px 0 0”, color:C.muted, fontSize:13 }}>Track and resolve property problems</p>
</div>
<Btn onClick={()=>setShowModal(true)}>+ Report Issue</Btn>
</div>

```
  {/* Stats */}
  <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
    {[
      { label:"Open Issues", value:issues.filter(i=>i.status==="open").length, color:C.red },
      { label:"In Progress", value:issues.filter(i=>i.status==="in-progress").length, color:C.yellow },
      { label:"Resolved", value:issues.filter(i=>i.status==="resolved").length, color:C.green },
      { label:"High Priority", value:issues.filter(i=>i.priority==="high"&&i.status!=="resolved").length, color:C.purple },
    ].map(s=>(
      <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", flex:1, minWidth:120 }}>
        <div style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
        <div style={{ color:s.color, fontSize:28, fontWeight:800, marginTop:4 }}>{s.value}</div>
      </div>
    ))}
  </div>

  {/* Filters */}
  <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
    {["all","open","in-progress","resolved"].map(f=>(
      <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?C.accent:C.surface, color:filter===f?"#fff":C.muted, border:`1px solid ${filter===f?C.accent:C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", textTransform:"capitalize", fontFamily:"inherit" }}>{f}</button>
    ))}
  </div>

  {/* Issue Cards */}
  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    {filtered.length===0 && <div style={{ color:C.muted, textAlign:"center", padding:60, background:C.surface, borderRadius:14, border:`1px solid ${C.border}` }}>No issues found. 🎉</div>}
    {filtered.map(issue=>(
      <div key={issue.id} style={{ background:C.surface, border:`1px solid ${selected?.id===issue.id?C.accent:C.border}`, borderRadius:14, overflow:"hidden" }}>
        <div onClick={()=>setSelected(selected?.id===issue.id?null:issue)} style={{ padding:18, cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ flex:1, marginRight:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:issueStatusColor(issue.status), flexShrink:0 }} />
                <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>{issue.title}</div>
              </div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ color:C.muted, fontSize:12 }}>🏠 {issue.property}</span>
                <span style={{ color:C.muted, fontSize:12 }}>👤 {issue.reported_by}</span>
                <span style={{ color:C.muted, fontSize:12 }}>📅 {issue.date}</span>
                <span style={{ color:C.muted, fontSize:12 }}>🏷 {issue.category}</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end", flexShrink:0 }}>
              <Badge label={issue.priority} color={priorityColor(issue.priority)} />
              <Badge label={issue.status} color={issueStatusColor(issue.status)} />
            </div>
          </div>
          {issue.description && <div style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>{issue.description.slice(0,120)}{issue.description.length>120?"...":""}</div>}
        </div>

        {selected?.id===issue.id && (
          <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
            {issue.description.length > 120 && <div style={{ color:C.muted, fontSize:13, lineHeight:1.6, marginBottom:12 }}>{issue.description}</div>}
            <div style={{ marginBottom:12 }}>
              <div style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Update Status</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {["open","in-progress","resolved","closed"].map(s=>(
                  <button key={s} onClick={()=>setIssues(prev=>prev.map(i=>i.id===issue.id?{...i,status:s}:i))} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${issue.status===s?issueStatusColor(s):C.border}`, background:issue.status===s?issueStatusColor(s)+"22":"transparent", color:issue.status===s?issueStatusColor(s):C.muted, fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn small variant="ghost" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn small variant="danger" onClick={()=>{if(confirm("Delete issue?"))setIssues(prev=>prev.filter(i=>i.id!==issue.id));setSelected(null);}}>Delete</Btn>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>

  {showModal && (
    <Modal title="Report an Issue" onClose={()=>setShowModal(false)}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Property FIRST - at the very top */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Property</label>
          <div style={{ position:"relative" }}>
            <select value={form.property} onChange={e=>setForm({...form,property:e.target.value})} style={{ width:"100%", background:form.property?C.accentDim:C.surfaceAlt, border:`1px solid ${form.property?C.accent:C.border}`, borderRadius:8, padding:"10px 12px", color:form.property?C.accent:C.muted, fontSize:13, fontFamily:"inherit", outline:"none", appearance:"none", cursor:"pointer" }}>
              <option value="">🏠 Select a property...</option>
              {properties.map(p=>(
                <option key={p.id} value={p.name} style={{background:C.surface,color:C.text}}>{p.name} — {p.location}</option>
              ))}
            </select>
            <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:C.muted, pointerEvents:"none" }}>⌄</span>
          </div>
        </div>

        {/* Department + Priority side by side */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Department</label>
            <Select value={form.category} onChange={v=>setForm({...form,category:v})} options={categories.map(c=>({value:c,label:c}))} />
          </div>
          <div>
            <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Priority</label>
            <Select value={form.priority} onChange={v=>setForm({...form,priority:v})} options={[{value:"urgent",label:"🚨 Urgent"},{value:"high",label:"🔴 High"},{value:"medium",label:"🟡 Medium"},{value:"low",label:"🟢 Low"},{value:"lowest",label:"⬇ Lowest"}]} />
          </div>
        </div>

        {/* Issue Title */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Issue Title *</label>
          <Input value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="e.g. Leaking faucet in master bathroom" />
        </div>

        {/* Reported By - tap to open staff picker */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Reported By</label>
          <div onClick={()=>setShowStaffPicker(true)} style={{ background:form.reported_by?C.accentDim:C.surfaceAlt, border:`1px solid ${form.reported_by?C.accent:C.border}`, borderRadius:8, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {form.reported_by ? (
                <>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff" }}>
                    {form.reported_by.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>{form.reported_by}</span>
                </>
              ) : (
                <span style={{ color:C.muted, fontSize:13 }}>👤 Tap to select staff member...</span>
              )}
            </div>
            <span style={{ color:C.muted }}>⌄</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Description</label>
          <Textarea value={form.description} onChange={v=>setForm({...form,description:v})} placeholder="Describe the issue in detail so it can be fixed quickly..." rows={3} />
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>Submit Issue</Btn>
        </div>
      </div>
    </Modal>
  )}

  {/* Staff Picker Modal */}
  {showStaffPicker && (
    <Modal title="Select Reporter" onClose={()=>setShowStaffPicker(false)}>
      <div style={{ marginBottom:12 }}>
        <input value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="Search staff..." style={{ width:"100%", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
      </div>
      <div onClick={()=>{setForm({...form,reported_by:"Me (Manager)"});setShowStaffPicker(false);}} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:C.accent+"30", border:`2px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>👤</div>
        <div>
          <div style={{ color:C.accent, fontSize:14, fontWeight:700 }}>Assign to me</div>
          <div style={{ color:C.muted, fontSize:12 }}>Property Manager</div>
        </div>
      </div>
      {["Housekeeper","Maintenance Tech","Inspector","Groundskeeper","Supervisor"].map(role => {
        const roleStaff = staff.filter(s => s.role === role && (!staffSearch || s.name.toLowerCase().includes(staffSearch.toLowerCase())));
        if (roleStaff.length === 0) return null;
        return (
          <div key={role}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", padding:"10px 0 6px" }}>{role}</div>
            {roleStaff.map(s => (
              <div key={s.id} onClick={()=>{setForm({...form,reported_by:s.name});setShowStaffPicker(false);}} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:s.color+"30", border:`2px solid ${s.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:s.color, flexShrink:0 }}>
                  {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.text, fontSize:14, fontWeight:600 }}>{s.name}</div>
                  <div style={{ color:C.muted, fontSize:12 }}>{s.role}</div>
                </div>
                {form.reported_by === s.name && <span style={{ color:C.green, fontSize:20 }}>✓</span>}
              </div>
            ))}
          </div>
        );
      })}
    </Modal>
  )}
</div>
```

);
}

const navItems = [
{ id:“dashboard”, label:“Dashboard”, icon:“⬡” },
{ id:“properties”, label:“Properties”, icon:“⌂” },
{ id:“reservations”, label:“Reservations”, icon:“🛏” },
{ id:“tasks”, label:“Tasks”, icon:“✓” },
{ id:“issues”, label:“Issues”, icon:“⚠” },
{ id:“schedule”, label:“Schedule”, icon:“▦” },
{ id:“checklists”, label:“Checklists”, icon:“☑” },
{ id:“messaging”, label:“Messaging”, icon:“✉” },
{ id:“staff”, label:“Staff”, icon:“⬤” },
{ id:“reports”, label:“Reports”, icon:“▨” },
{ id:“settings”, label:“Settings”, icon:“⚙” },
];

export default function App() {
const [page, setPage] = useState(“dashboard”);
const [properties, setProperties] = useState([]);
const [tasks, setTasks] = useState([]);
const [staff, setStaff] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [appSettings, setAppSettings] = useState(getSettings());

const fetchAll = useCallback(async () => {
try {
setLoading(true);
const [props, tsk, stf] = await Promise.all([
db.get(“properties”, “order=created_at.desc”),
db.get(“tasks”, “order=created_at.desc&select=*,properties(name),staff(name,color)”),
db.get(“staff”, “order=name.asc”),
]);
if (props.code) throw new Error(props.message || “DB error — run SQL setup in Supabase”);
setProperties(props); setTasks(tsk); setStaff(stf); setError(null);
} catch (e) { setError(e.message); } finally { setLoading(false); }
}, []);

useEffect(() => { fetchAll(); }, [fetchAll]);
useEffect(() => { setAppSettings(getSettings()); }, [page]);

const pendingTasks = tasks.filter(t => t.status !== “completed”).length;
const accent = appSettings.accentColor || C.accent;

return (
<div style={{ display:“flex”, height:“100vh”, background:C.bg, fontFamily:”‘DM Sans’, ‘Segoe UI’, sans-serif”, color:C.text, overflow:“hidden” }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #2a3350; border-radius: 4px; } select option { background: #131825; }`}</style>

```
  {/* Sidebar */}
  <div style={{ width:215, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
    <div style={{ padding:"14px 12px 12px", borderBottom:`1px solid ${C.border}` }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 90" width="100%" height="52">
        <g transform="translate(4,4)">
          <polygon points="41,2 2,36 80,36" fill="#2a4fa0" />
          <rect x="8" y="34" width="66" height="50" fill="#2a4fa0" />
          <polygon points="41,8 7,38 75,38" fill="white" />
          <rect x="13" y="36" width="56" height="46" fill="white" />
          <rect x="14" y="37" width="26" height="22" rx="2" fill="#5cb85c" />
          <circle cx="27" cy="37" r="4" fill="#5cb85c" />
          <circle cx="14" cy="48" r="4" fill="#5cb85c" />
          <text x="27" y="52" textAnchor="middle" fontSize="13" fill="white">✿</text>
          <rect x="42" y="37" width="26" height="22" rx="2" fill="#e8821a" />
          <circle cx="55" cy="37" r="4" fill="#e8821a" />
          <circle cx="68" cy="48" r="4" fill="#e8821a" />
          <text x="55" y="52" textAnchor="middle" fontSize="13" fill="white">☀</text>
          <rect x="14" y="60" width="26" height="21" rx="2" fill="#2980b9" />
          <circle cx="14" cy="71" r="4" fill="#2980b9" />
          <circle cx="27" cy="81" r="4" fill="#2980b9" />
          <text x="27" y="75" textAnchor="middle" fontSize="13" fill="white">❄</text>
          <rect x="42" y="60" width="26" height="21" rx="2" fill="#c8a96e" />
          <circle cx="68" cy="71" r="4" fill="#c8a96e" />
          <circle cx="55" cy="81" r="4" fill="#c8a96e" />
          <text x="55" y="75" textAnchor="middle" fontSize="11" fill="white">🍂</text>
        </g>
        <text x="100" y="46" fontFamily="Arial Black, sans-serif" fontSize="40" fontWeight="900" fill="#2a4fa0" letterSpacing="-1">VR 365</text>
        <text x="101" y="70" fontFamily="Georgia, serif" fontSize="14" fontStyle="italic" fill="#2a4fa0">Vacation Rentals, Year Round</text>
      </svg>
    </div>
    <nav style={{ padding:"10px 8px", flex:1, overflowY:"auto" }}>
      {navItems.map(item=>(
        <button key={item.id} onClick={()=>setPage(item.id)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 10px", borderRadius:8, background:page===item.id?accent+"18":"transparent", border:`1px solid ${page===item.id?accent+"40":"transparent"}`, color:page===item.id?accent:C.muted, fontWeight:page===item.id?700:500, fontSize:13, cursor:"pointer", marginBottom:1, textAlign:"left", fontFamily:"inherit", transition:"all 0.15s" }}>
          <span style={{ fontSize:14, width:20, textAlign:"center" }}>{item.icon}</span>
          {item.label}
          {item.id==="tasks" && pendingTasks>0 && <span style={{ marginLeft:"auto", background:C.red, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:800 }}>{pendingTasks}</span>}
          {item.id==="issues" && <span style={{ marginLeft:"auto", background:C.red, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:800 }}>5</span>}
        </button>
      ))}
    </nav>
    <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:30, height:30, borderRadius:"50%", background:accent+"30", border:`2px solid ${accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:accent }}>
          {(appSettings.managerName||"PM").split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
        <div>
          <div style={{ color:C.text, fontWeight:600, fontSize:12 }}>{appSettings.managerName||"Property Manager"}</div>
          <div style={{ color:C.muted, fontSize:11 }}>{properties.length} properties · Admin</div>
        </div>
      </div>
    </div>
  </div>

  {/* Main */}
  <div style={{ flex:1, overflow:"auto", padding:28 }}>
    {error && (
      <div style={{ background:C.red+"22", border:`1px solid ${C.red}44`, borderRadius:12, padding:16, marginBottom:20, color:C.red }}>
        <strong>⚠ Database not connected:</strong> {error}
      </div>
    )}
    {loading ? <Spinner /> : (
      <>
        {page==="dashboard" && <Dashboard properties={properties} tasks={tasks} staff={staff} />}
        {page==="properties" && <Properties properties={properties} onRefresh={fetchAll} />}
        {page==="tasks" && <Tasks tasks={tasks} properties={properties} staff={staff} onRefresh={fetchAll} />}
        {page==="schedule" && <Schedule tasks={tasks} properties={properties} staff={staff} onRefresh={fetchAll} />}
        {page==="checklists" && <Checklists properties={properties} />}
        {page==="messaging" && <GuestMessaging />}
        {page==="staff" && <StaffPage staff={staff} tasks={tasks} onRefresh={fetchAll} />}
        {page==="reports" && <Reports tasks={tasks} properties={properties} staff={staff} />}
        {page==="reservations" && <Reservations properties={properties} />}
        {page==="issues" && <ReportedIssues properties={properties} staff={staff} />}
        {page==="settings" && <Settings />}
      </>
    )}
  </div>
</div>
```

);
}
