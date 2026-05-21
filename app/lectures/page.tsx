"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useEffect, useState } from "react";

interface Material {
  title: string;
  url: string;
}

interface Lecture {
  id: string;
  title: string;
  topic: string;
  date: string;
  materials: Material[];
}

export default function LecturesPage() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [newMaterials, setNewMaterials] = useState<Material[]>([]);
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");

  const isStaff = user && (user.role === "instructor" || user.role === "teacher");

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lectures");
      if (res.ok) {
        const data = await res.json();
        const items = data.lectures.map((l: any) => ({
          ...l,
          materials: Array.isArray(l.materials) ? l.materials : (l.materials ? JSON.parse(l.materials as any) : [])
        }));
        setLectures(items);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => { if (!isLoading) fetchLectures(); }, [isLoading]);

  const addMaterial = () => {
    if (matTitle && matUrl) {
      setNewMaterials([...newMaterials, { title: matTitle, url: matUrl }]);
      setMatTitle(""); setMatUrl("");
    }
  };

  const handleAdd = async () => {
    if (!title || !date || !topic) return;
    try {
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, topic, materials: newMaterials }),
      });
      if (res.ok) {
        setTitle(""); setTopic(""); setNewMaterials([]); fetchLectures();
      }
    } catch (e) { alert("Failed to add"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try {
      const res = await fetch(`/api/lectures?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchLectures();
    } catch (e) { alert("Failed"); }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div id="page-resources" className="page-section active">
      <h2>Lectures, Notes & Resources</h2>
      {isStaff && (
        <div className="form-section">
          <h3>➕ Upload Resource</h3>
          <div className="form-row">
            <label>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Topic</label><input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div style={{ margin: "10px 0", padding: "10px", background: "#eee" }}>
            <p>Links:</p>
            {newMaterials.map((m, i) => <div key={i}>{m.title}: {m.url}</div>)}
            <div className="form-row" style={{ marginTop: "5px" }}>
              <input type="text" placeholder="Title" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} />
              <input type="text" placeholder="URL" value={matUrl} onChange={(e) => setMatUrl(e.target.value)} />
              <button className="btn btn-sm" onClick={addMaterial}>Add Link</button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>Add Resource</button>
        </div>
      )}
      <table className="classic">
        <thead>
          <tr><th>Title</th><th>Topic</th><th>Date</th><th>Materials</th>{isStaff && <th style={{width:80}}>Actions</th>}</tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={5}>Loading...</td></tr> : lectures.map(l => (
            <tr key={l.id}>
              <td>{l.title}</td>
              <td>{l.topic}</td>
              <td>{new Date(l.date).toLocaleDateString()}</td>
              <td>{l.materials.map((m, i) => <span key={i} style={{marginRight:8}}><a href={m.url} target="_blank" rel="noreferrer">[{m.title}]</a></span>)}</td>
              {isStaff && <td><a href="#" style={{color:"#800"}} onClick={(e) => { e.preventDefault(); handleDelete(l.id); }}>del</a></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
