"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AnnouncementsList({ isStaff }: { isStaff: boolean }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Post state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchAnnouncements = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements?page=${p}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements);
        setMeta(data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(page);
  }, [page]);

  const handlePost = async () => {
    if (!title || !body) return;
    setPosting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (res.ok) {
        setTitle("");
        setBody("");
        setPage(1);
        fetchAnnouncements(1);
      }
    } catch (error) {
      alert("Failed to post announcement");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAnnouncements(page);
      }
    } catch (error) {
      alert("Failed to delete announcement");
    }
  };

  return (
    <div className="section-block">
      <h2>Announcements</h2>
      
      {isStaff && (
        <div className="form-section" style={{ marginBottom: "16px" }}>
          <h3>➕ Post Announcement</h3>
          <div className="form-row">
            <label>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Office hours canceled Wed" 
            />
          </div>
          <div className="form-row">
            <label>Body</label>
            <textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Announcement text..." 
            ></textarea>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handlePost}
            disabled={posting}
          >
            {posting ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      )}

      <div id="announcements-list">
        {loading ? (
          <p>Loading announcements...</p>
        ) : announcements.length > 0 ? (
          announcements.map((ann) => (
            <div key={ann.id} className="announce-box">
              <div className="date">
                {new Date(ann.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <strong>{ann.title}</strong>
              <p style={{ whiteSpace: "pre-wrap" }}>{ann.body}</p>
              <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                Posted by {ann.user.name}
              </div>
              {isStaff && (
                <span className="instr-only" style={{ display: "block", marginTop: "8px" }}>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(ann.id)}
                  >
                    Delete
                  </button>
                </span>
              )}
            </div>
          ))
        ) : (
          <p style={{ fontStyle: "italic", color: "#666" }}>No announcements yet.</p>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div style={{ marginTop: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
          <button 
            className="btn btn-sm" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            &laquo; Prev
          </button>
          <span style={{ fontSize: "12px", fontFamily: "monospace" }}>
            Page {page} of {meta.totalPages}
          </span>
          <button 
            className="btn btn-sm" 
            disabled={page === meta.totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
