"use client";

import { useEffect, useState } from "react";

interface ScheduleItem {
  id: string;
  date: string;
  day: string;
  topic: string;
  type: string;
  notes: string | null;
}

export default function ScheduleList({ isStaff }: { isStaff: boolean }) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add State
  const [date, setDate] = useState("");
  const [day, setDay] = useState("Mon");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("Lecture");
  const [notes, setNotes] = useState("");

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule");
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.schedule);
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAdd = async () => {
    if (!topic || !date) return;
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, day, topic, type, notes }),
      });
      if (res.ok) {
        setTopic("");
        setNotes("");
        fetchSchedule();
      }
    } catch (error) {
      alert("Failed to add entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (res.ok) fetchSchedule();
    } catch (error) {
      alert("Failed to delete entry");
    }
  };

  return (
    <div className="section-block">
      <h2>Course Schedule</h2>
      
      {isStaff && (
        <div className="form-section">
          <h3>➕ Add Entry</h3>
          <div className="form-row">
            <label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <label>Day</label>
            <select value={day} onChange={(e) => setDay(e.target.value)} style={{maxWidth:"70px"}}>
              <option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option>
            </select>
            <label>Topic</label><input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. §5.1" />
          </div>
          <div className="form-row">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}><option>Lecture</option><option>No Class</option><option>Exam</option><option>HW Due</option></select>
            <label>Link (URL)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. https://drive..." />
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
              <td>{item.notes ? <a href={item.notes} target="_blank" rel="noreferrer">[Link]</a> : "—"}</td>
              {isStaff && (
                <td><a href="#" style={{color:"#800"}} onClick={(e) => { e.preventDefault(); handleDelete(item.id); }}>del</a></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
