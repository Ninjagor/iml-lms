"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Material {
  title: string;
  url: string;
}

interface ScheduleItem {
  id: string;
  date: string;
  day: string;
  topic: string;
  type: string;
  materials: Material[];
}

export default function SchedulePage() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [date, setDate] = useState("");
  const [day, setDay] = useState("Mon");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("Lecture");
  const [newMaterials, setNewMaterials] = useState<Material[]>([]);
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");

  // Edit State
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [editType, setEditType] = useState("");

  const isStaff = user && (user.role === "instructor" || user.role === "teacher");

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule");
      if (res.ok) {
        const data = await res.json();
        const items = data.schedule.map((item: any) => ({
          ...item,
          materials: Array.isArray(item.materials) ? item.materials : (item.materials ? JSON.parse(item.materials as any) : [])
        }));
        setSchedule(items);
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => { if (!isLoading) fetchSchedule(); }, [isLoading]);

  const addMaterial = () => {
    if (matTitle && matUrl) {
      setNewMaterials([...newMaterials, { title: matTitle, url: matUrl }]);
      setMatTitle("");
      setMatUrl("");
    }
  };

  const handleAdd = async () => {
    if (!topic || !date) return;
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, day, topic, type, materials: newMaterials }),
      });
      if (res.ok) {
        setTopic("");
        setNewMaterials([]);
        fetchSchedule();
      }
    } catch (error) {
      alert("Failed to add entry");
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingItem.id, 
          date: editDate, 
          day: editDay,
          topic: editTopic, 
          type: editType 
        }),
      });
      if (res.ok) {
        setEditingItem(null);
        fetchSchedule();
      }
    } catch (error) {
      alert("Failed to update entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchSchedule();
    } catch (error) {
      alert("Failed to delete entry");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div id="page-schedule" className="page-section active">
      <h2>Course Schedule</h2>
      
      {isStaff && (
        <div className="form-section">
          <h3>➕ Add Entry</h3>
          <div className="form-row">
            <label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <label>Day</label>
            <select value={day} onChange={(e) => setDay(e.target.value)} style={{maxWidth:"100px"}}>
              <option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option>
            </select>
          </div>
          <div className="form-row">
            <label>Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. §5.1" style={{flex:2}} />
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}><option>Lecture</option><option>No Class</option><option>Exam</option><option>HW Due</option></select>
          </div>
          
          <div style={{ margin: "10px 0" }}>
            <p>Materials:</p>
            {newMaterials.map((m, i) => <div key={i}>{m.title}: {m.url}</div>)}
            <div className="form-row" style={{ marginTop: "5px" }}>
              <input type="text" placeholder="Title (e.g. Slides)" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} />
              <input type="text" placeholder="URL" value={matUrl} onChange={(e) => setMatUrl(e.target.value)} />
              <button className="btn btn-sm" onClick={addMaterial}>Add Link</button>
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={handleAdd}>Add Entry</button>
        </div>
      )}

      <table className="classic">
        <thead>
          <tr>
            <th>Date</th><th>Day</th><th>Topic</th><th>Materials</th>
            {isStaff && <th style={{width:"80px"}}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={5}>Loading...</td></tr> : schedule.map((item) => (
            <tr key={item.id}>
              <td>{new Date(item.date).toLocaleDateString("en-US", {month:'short', day:'numeric'})}</td>
              <td>{item.day}</td>
              <td>{item.topic}</td>
              <td>
                {item.materials.map((m, i) => (
                  <span key={i} style={{marginRight: "8px"}}>
                    <a href={m.url} target="_blank" rel="noreferrer">[{m.title}]</a>
                  </span>
                ))}
              </td>
              {isStaff && (
                <td>
                  <a href="#" style={{color:"#004d00", marginRight: "5px"}} onClick={(e) => { 
                    e.preventDefault(); 
                    setEditingItem(item); 
                    setEditDate(new Date(item.date).toISOString().split('T')[0]);
                    setEditDay(item.day);
                    setEditTopic(item.topic);
                    setEditType(item.type);
                  }}>edit</a>
                  <a href="#" style={{color:"#800"}} onClick={(e) => { e.preventDefault(); handleDelete(item.id); }}>del</a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editingItem && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <div className="modal-header"><span>Edit Entry</span><button onClick={() => setEditingItem(null)}>&times;</button></div>
            <div className="modal-body">
              <div className="form-row"><label>Date</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></div>
              <div className="form-row">
                <label>Day</label>
                <select value={editDay} onChange={(e) => setEditDay(e.target.value)}>
                    <option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option>
                </select>
              </div>
              <div className="form-row"><label>Topic</label><input type="text" value={editTopic} onChange={(e) => setEditTopic(e.target.value)} /></div>
              <div className="form-row">
                <label>Type</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value)}><option>Lecture</option><option>No Class</option><option>Exam</option><option>HW Due</option></select>
              </div>
              <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
