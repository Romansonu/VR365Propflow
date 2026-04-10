import { useState, useEffect, useCallback } from "react";

// =============================================
// SUPABASE CONFIG
// =============================================
const SUPABASE_URL = "https://fadpwmaumklbibnsoyft.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZHB3bWF1bWtsYmlibnNveWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDAxNzMsImV4cCI6MjA5MTM3NjE3M30.HElpazl-1eqBCrIG94ZlD_2fOB5bzVeMAWc4aozGAFI";

const db = {
  async get(table, params = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
    });
    return res.json();
  },
  async post(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async patch(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }
};

// =============================================
// DESIGN TOKENS
// =============================================
const C = {
  bg: "#0b0e17", surface: "#131825", surfaceAlt: "#1a2035",
  border: "#1f2840", accent: "#4f8ef7", accentDim: "#4f8ef718",
  green: "#34d399", yellow: "#fbbf24", red: "#f87171", purple: "#a78bfa",
  text: "#e2e8f8", muted: "#5a6580", dim: "#2a3350",
};

const statusColor = s => ({ occupied: C.green, turnover: C.yellow, vacant: C.muted, maintenance: C.red }[s] || C.muted);
const priorityColor = p => ({ high: C.red, medium: C.yellow, low: C.green }[p] || C.muted);
const taskStatusColor = s => ({ completed: C.green, "in-progress": C.accent, pending: C.muted }[s] || C.muted);

// =============================================
// UI PRIMITIVES
// =============================================
function Badge({ label, color }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>;
}

function Btn({ children, onClick, variant = "primary", small }) {
  const styles = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.red + "22", color: C.red, border: `1px solid ${C.red}44` },
  };
  return <button onClick={onClick} style={{ ...styles[variant], borderRadius: 8, padding: small ? "5px 12px" : "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: small ? 12 : 13, fontFamily: "inherit", transition: "opacity 0.15s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{children}</button>;
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" }} />;
}

function Select({ value, onChange, options }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>;
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 130, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -16, right: -8, fontSize: 64, opacity: 0.04 }}>{icon}</div>
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color, fontSize: 30, fontWeight: 800, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// =============================================
// DASHBOARD
// =============================================
function Dashboard({ properties, tasks, staff }) {
  const occupied = properties.filter(p => p.status === "occupied").length;
  const turnover = properties.filter(p => p.status === "turnover").length;
  const maintenance = properties.filter(p => p.status === "maintenance").length;
  const pendingHigh = tasks.filter(t => t.priority === "high" && t.status !== "completed").length;
  const todayTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());
  const recentTasks = tasks.filter(t => t.status !== "completed").slice(0, 6);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Operations Dashboard 👋</h1>
        <p style={{ color: C.muted, margin: "6px 0 0", fontSize: 14 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Properties" value={properties.length} sub="Total managed" color={C.accent} icon="⌂" />
        <StatCard label="Occupied" value={occupied} sub={properties.length ? `${Math.round(occupied / properties.length * 100)}% occupancy` : "—"} color={C.green} icon="⬤" />
        <StatCard label="Turnovers" value={turnover} sub="Need attention" color={C.yellow} icon="↻" />
        <StatCard label="Maintenance" value={maintenance} sub="Blocked units" color={C.red} icon="⚙" />
        <StatCard label="High Priority" value={pendingHigh} sub="Action needed" color={C.purple} icon="!" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Active Tasks</h3>
            <Badge label={`${recentTasks.length} pending`} color={C.accent} />
          </div>
          {recentTasks.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 30 }}>No pending tasks 🎉</div>}
          {recentTasks.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 4, height: 36, borderRadius: 4, background: priorityColor(t.priority), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{t.properties?.name} · {t.staff?.name || "Unassigned"}</div>
              </div>
              <Badge label={t.status} color={taskStatusColor(t.status)} />
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: C.text }}>Property Status</h3>
          {properties.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 30 }}>No properties yet</div>}
          {properties.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(p.status), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
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

// =============================================
// PROPERTIES PAGE
// =============================================
function Properties({ properties, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", type: "Villa", beds: 1, status: "vacant", guest_name: "", check_out: "", notes: "" });

  const filtered = filter === "all" ? properties : properties.filter(p => p.status === filter);

  const handleSave = async () => {
    if (!form.name) return alert("Property name is required");
    setSaving(true);
    await db.post("properties", { ...form, beds: parseInt(form.beds) || 1 });
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", location: "", type: "Villa", beds: 1, status: "vacant", guest_name: "", check_out: "", notes: "" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this property?")) return;
    await db.delete("properties", id);
    onRefresh();
  };

  const handleStatusChange = async (id, status) => {
    await db.patch("properties", id, { status });
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Properties</h2>
        <Btn onClick={() => setShowModal(true)}>+ Add Property</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "occupied", "vacant", "turnover", "maintenance"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.accent : C.surface, color: filter === f ? "#fff" : C.muted, border: `1px solid ${filter === f ? C.accent : C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit" }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 60, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>No properties found. Add your first one!</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{p.location}</div>
              </div>
              <Badge label={p.status} color={statusColor(p.status)} />
            </div>
            <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
              <div style={{ color: C.muted, fontSize: 12 }}>🛏 {p.beds} beds</div>
              <div style={{ color: C.muted, fontSize: 12 }}>🏠 {p.type}</div>
              {p.guest_name && <div style={{ color: C.muted, fontSize: 12 }}>👤 {p.guest_name}</div>}
            </div>
            {p.check_out && <div style={{ padding: "6px 10px", background: C.accentDim, borderRadius: 6, fontSize: 12, color: C.accent, marginBottom: 12 }}>🗓 Checkout: {new Date(p.check_out).toLocaleDateString()}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["vacant", "occupied", "turnover", "maintenance"].filter(s => s !== p.status).map(s => (
                <Btn key={s} small variant="ghost" onClick={() => handleStatusChange(p.id, s)}>→ {s}</Btn>
              ))}
              <Btn small variant="danger" onClick={() => handleDelete(p.id)}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Add Property" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Property name *" />
            <Input value={form.location} onChange={v => setForm({ ...form, location: v })} placeholder="Location (e.g. Malibu, CA)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={["Villa","Loft","Cottage","Suite","Cabin","House","Condo","Apartment"].map(t => ({ value: t, label: t }))} />
              <Input value={form.beds} onChange={v => setForm({ ...form, beds: v })} placeholder="Beds" type="number" />
            </div>
            <Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={["vacant","occupied","turnover","maintenance"].map(s => ({ value: s, label: s }))} />
            {form.status === "occupied" && <>
              <Input value={form.guest_name} onChange={v => setForm({ ...form, guest_name: v })} placeholder="Guest name" />
              <Input value={form.check_out} onChange={v => setForm({ ...form, check_out: v })} placeholder="Check-out date" type="date" />
            </>}
            <Input value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Notes (optional)" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleSave}>{saving ? "Saving..." : "Save Property"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =============================================
// TASKS PAGE
// =============================================
function Tasks({ tasks, properties, staff, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", property_id: "", assignee_id: "", priority: "medium", status: "pending", type: "housekeeping", due_date: "", notes: "" });

  const filtered = tasks.filter(t =>
    (filter === "all" || t.status === filter) &&
    (typeFilter === "all" || t.type === typeFilter)
  );

  const handleSave = async () => {
    if (!form.title) return alert("Task title required");
    setSaving(true);
    await db.post("tasks", { ...form, property_id: form.property_id || null, assignee_id: form.assignee_id || null, due_date: form.due_date || null });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", property_id: "", assignee_id: "", priority: "medium", status: "pending", type: "housekeeping", due_date: "", notes: "" });
    onRefresh();
  };

  const handleStatusChange = async (id, status) => {
    await db.patch("tasks", id, { status });
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    await db.delete("tasks", id);
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Tasks & Work Orders</h2>
        <Btn onClick={() => setShowModal(true)}>+ New Task</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "pending", "in-progress", "completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.accent : C.surface, color: filter === f ? "#fff" : C.muted, border: `1px solid ${filter === f ? C.accent : C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit" }}>{f}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["all", "housekeeping", "maintenance", "inspection"].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{ background: typeFilter === f ? C.surfaceAlt : "transparent", color: typeFilter === f ? C.text : C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit" }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 80px", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <div>Task</div><div>Property</div><div>Assignee</div><div>Priority</div><div>Status</div><div>Due</div><div></div>
        </div>
        {filtered.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>No tasks found.</div>}
        {filtered.map(t => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 80px", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            <div>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{t.title}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 2, textTransform: "capitalize" }}>{t.type}</div>
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>{t.properties?.name || "—"}</div>
            <div style={{ color: C.text, fontSize: 12 }}>{t.staff?.name || "—"}</div>
            <div><Badge label={t.priority} color={priorityColor(t.priority)} /></div>
            <div>
              <select value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)} style={{ background: taskStatusColor(t.status) + "22", color: taskStatusColor(t.status), border: `1px solid ${taskStatusColor(t.status)}44`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase" }}>
                {["pending", "in-progress", "completed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</div>
            <div><Btn small variant="danger" onClick={() => handleDelete(t.id)}>✕</Btn></div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="New Task" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="Task title *" />
            <Select value={form.property_id} onChange={v => setForm({ ...form, property_id: v })} options={[{ value: "", label: "Select property..." }, ...properties.map(p => ({ value: p.id, label: p.name }))]} />
            <Select value={form.assignee_id} onChange={v => setForm({ ...form, assignee_id: v })} options={[{ value: "", label: "Assign to staff..." }, ...staff.map(s => ({ value: s.id, label: `${s.name} — ${s.role}` }))]} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={["housekeeping","maintenance","inspection","other"].map(t => ({ value: t, label: t }))} />
              <Select value={form.priority} onChange={v => setForm({ ...form, priority: v })} options={["low","medium","high"].map(p => ({ value: p, label: p }))} />
            </div>
            <Input value={form.due_date} onChange={v => setForm({ ...form, due_date: v })} placeholder="Due date" type="datetime-local" />
            <Input value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Notes (optional)" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleSave}>{saving ? "Saving..." : "Create Task"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =============================================
// STAFF PAGE
// =============================================
function Staff({ staff, tasks, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "Housekeeper", email: "", phone: "", color: "#4f8ef7" });

  const handleSave = async () => {
    if (!form.name || !form.email) return alert("Name and email required");
    setSaving(true);
    await db.post("staff", form);
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", role: "Housekeeper", email: "", phone: "", color: "#4f8ef7" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this staff member?")) return;
    await db.delete("staff", id);
    onRefresh();
  };

  const colors = ["#f472b6","#60a5fa","#34d399","#fbbf24","#a78bfa","#fb923c","#e879f9","#2dd4bf"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Staff & Assignments</h2>
        <Btn onClick={() => setShowModal(true)}>+ Add Staff</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
        {staff.map(s => {
          const memberTasks = tasks.filter(t => t.assignee_id === s.id);
          const done = memberTasks.filter(t => t.status === "completed").length;
          const pct = memberTasks.length > 0 ? Math.round(done / memberTasks.length * 100) : 0;
          return (
            <div key={s.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: s.color + "30", border: `2px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: s.color, flexShrink: 0 }}>
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{s.role}</div>
                  {s.email && <div style={{ color: C.muted, fontSize: 11 }}>{s.email}</div>}
                </div>
                <Btn small variant="danger" onClick={() => handleDelete(s.id)}>✕</Btn>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Tasks assigned</span>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{done}/{memberTasks.length}</span>
              </div>
              <div style={{ height: 6, background: C.dim, borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 4 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{pct}% complete</span>
                <span style={{ fontSize: 11, color: memberTasks.length - done > 0 ? C.yellow : C.green }}>{memberTasks.length - done} remaining</span>
              </div>
            </div>
          );
        })}
        {staff.length === 0 && <div style={{ gridColumn: "1/-1", color: C.muted, textAlign: "center", padding: 60, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>No staff added yet.</div>}
      </div>

      {showModal && (
        <Modal title="Add Staff Member" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Full name *" />
            <Input value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="Email address *" type="email" />
            <Input value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="Phone number" />
            <Select value={form.role} onChange={v => setForm({ ...form, role: v })} options={["Housekeeper","Maintenance Tech","Inspector","Groundskeeper","Property Manager","Supervisor"].map(r => ({ value: r, label: r }))} />
            <div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Profile color</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {colors.map(c => (
                  <div key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? `3px solid #fff` : "3px solid transparent", transition: "transform 0.15s" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleSave}>{saving ? "Saving..." : "Add Staff"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =============================================
// REPORTS PAGE
// =============================================
function Reports({ tasks, properties, staff }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const rate = total > 0 ? Math.round(completed / total * 100) : 0;
  const byType = ["housekeeping","maintenance","inspection","other"].map(type => ({
    type, count: tasks.filter(t => t.type === type).length
  }));
  const typeColors = { housekeeping: C.yellow, maintenance: C.red, inspection: C.purple, other: C.accent };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Reports & Analytics</h2>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total Tasks" value={total} sub="All time" color={C.accent} icon="✓" />
        <StatCard label="Completed" value={completed} sub={`${rate}% completion`} color={C.green} icon="▲" />
        <StatCard label="In Progress" value={tasks.filter(t => t.status === "in-progress").length} sub="Active now" color={C.yellow} icon="⟳" />
        <StatCard label="Staff Active" value={staff.length} sub="Team members" color={C.purple} icon="⬤" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Tasks by Type</h3>
          {byType.map(({ type, count }) => (
            <div key={type} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.text, fontSize: 13, textTransform: "capitalize" }}>{type}</span>
                <span style={{ color: C.muted, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>{count}</span>
              </div>
              <div style={{ height: 6, background: C.dim, borderRadius: 4 }}>
                <div style={{ height: "100%", width: total > 0 ? `${count / total * 100}%` : "0%", background: typeColors[type], borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Staff Performance</h3>
          {staff.map(s => {
            const memberTasks = tasks.filter(t => t.assignee_id === s.id);
            const done = memberTasks.filter(t => t.status === "completed").length;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: s.color + "25", border: `2px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: s.color, flexShrink: 0 }}>
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontSize: 13 }}>{s.name}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{s.role}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{done} done</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{memberTasks.length} total</div>
                </div>
              </div>
            );
          })}
          {staff.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 20 }}>No staff data yet</div>}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, gridColumn: "1/-1" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: C.text }}>Property Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {properties.map(p => {
              const propTasks = tasks.filter(t => t.property_id === p.id);
              const propDone = propTasks.filter(t => t.status === "completed").length;
              return (
                <div key={p.id} style={{ background: C.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(p.status) }} />
                    <span style={{ color: C.muted, fontSize: 11, textTransform: "capitalize" }}>{p.status}</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{propDone}/{propTasks.length} tasks done</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN APP
// =============================================
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "properties", label: "Properties", icon: "⌂" },
  { id: "tasks", label: "Tasks", icon: "✓" },
  { id: "staff", label: "Staff", icon: "⬤" },
  { id: "reports", label: "Reports", icon: "▨" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [properties, setProperties] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [props, tsk, stf] = await Promise.all([
        db.get("properties", "order=created_at.desc"),
        db.get("tasks", "order=created_at.desc&select=*,properties(name),staff(name,color)"),
        db.get("staff", "order=name.asc"),
      ]);
      if (props.code) throw new Error(props.message || "DB error — did you run the SQL setup?");
      setProperties(props);
      setTasks(tsk);
      setStaff(stf);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pendingTasks = tasks.filter(t => t.status !== "completed").length;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #2a3350; border-radius: 4px; }
        select option { background: #131825; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 215, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⌂</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>PropFlow</div>
              <div style={{ fontSize: 11, color: C.muted }}>Operations Hub</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, background: page === item.id ? C.accentDim : "transparent", border: `1px solid ${page === item.id ? C.accent + "40" : "transparent"}`, color: page === item.id ? C.accent : C.muted, fontWeight: page === item.id ? 700 : 500, fontSize: 13, cursor: "pointer", marginBottom: 2, textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.id === "tasks" && pendingTasks > 0 && <span style={{ marginLeft: "auto", background: C.red, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{pendingTasks}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accent + "30", border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: C.accent }}>PM</div>
            <div>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>Property Manager</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{properties.length} properties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {error && (
          <div style={{ background: C.red + "22", border: `1px solid ${C.red}44`, borderRadius: 12, padding: 16, marginBottom: 20, color: C.red }}>
            <strong>⚠ Database not connected:</strong> {error}
            <br /><span style={{ fontSize: 12, opacity: 0.8 }}>Run the SQL setup script in Supabase → SQL Editor → paste the setup file contents → Run</span>
          </div>
        )}
        {loading ? <Spinner /> : (
          <>
            {page === "dashboard" && <Dashboard properties={properties} tasks={tasks} staff={staff} />}
            {page === "properties" && <Properties properties={properties} onRefresh={fetchAll} />}
            {page === "tasks" && <Tasks tasks={tasks} properties={properties} staff={staff} onRefresh={fetchAll} />}
            {page === "staff" && <Staff staff={staff} tasks={tasks} onRefresh={fetchAll} />}
            {page === "reports" && <Reports tasks={tasks} properties={properties} staff={staff} />}
          </>
        )}
      </div>
    </div>
  );
}
