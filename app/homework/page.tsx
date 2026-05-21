"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useEffect, useState } from "react";

interface Material { title: string; url: string; }

interface Homework {
    id: string;
    name: string;
    dueDate: string;
    points: number;
    description: string | null;
    materials: Material[];
}

interface Submission {
    id: string;
    homeworkId: string;
    userId: string;
    user?: { name: string; email: string };
    materials: Material[];
    grade: number | null;
    submittedAt: string;
}

interface SubmissionDraft {
    materials: Material[];
    title: string;
    url: string;
}

export default function HomeworkPage() {
    const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
    const [homework, setHomework] = useState<Homework[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [points, setPoints] = useState(100);
    const [desc, setDesc] = useState("");
    const [newMaterials, setNewMaterials] = useState<Material[]>([]);
    const [matTitle, setMatTitle] = useState("");
    const [matUrl, setMatUrl] = useState("");
    const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
    const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, SubmissionDraft>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    const isStaff = user && (user.role === "instructor" || user.role === "teacher");
    const isAuditor = user?.role === "auditor";

    const getDraft = (homeworkId: string) => submissionDrafts[homeworkId] ?? { materials: [], title: "", url: "" };

    const setDraft = (homeworkId: string, draft: SubmissionDraft) => {
        setSubmissionDrafts((prev) => ({ ...prev, [homeworkId]: draft }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [hwRes, subRes] = await Promise.all([
                fetch("/api/homework"),
                fetch(isStaff ? "/api/submissions/instructor" : "/api/submissions"),
            ]);

            if (hwRes.ok) {
                const data = await hwRes.json();
                setHomework(data.map((hw: any) => ({
                    ...hw,
                    materials: Array.isArray(hw.materials) ? hw.materials : JSON.parse(hw.materials || "[]"),
                })));
            }

            if (subRes.ok) {
                const subs = await subRes.json();
                const parsedSubs: Submission[] = subs.map((s: any) => ({
                    ...s,
                    materials: Array.isArray(s.materials) ? s.materials : JSON.parse(s.materials || "[]"),
                }));
                setSubmissions(parsedSubs);

                if (!isStaff) {
                    const drafts: Record<string, SubmissionDraft> = {};
                    parsedSubs.forEach((s) => {
                        drafts[s.homeworkId] = {
                            materials: s.materials,
                            title: "",
                            url: "",
                        };
                    });
                    setSubmissionDrafts(drafts);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { checkAuth(); }, [checkAuth]);
    useEffect(() => { if (!isLoading) fetchData(); }, [isLoading]);

    const addMaterial = () => {
        if (matTitle && matUrl) {
            setNewMaterials([...newMaterials, { title: matTitle, url: matUrl }]);
            setMatTitle("");
            setMatUrl("");
        }
    };

    const handleAddOrUpdate = async () => {
        if (!name || !dueDate) return;
        try {
            const res = await fetch("/api/homework", {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: editingId,
                    name, 
                    dueDate, 
                    points, 
                    description: desc, 
                    materials: newMaterials 
                }),
            });
            if (res.ok) {
                resetForm();
                fetchData();
            }
        } catch (e) {
            alert("Operation failed");
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setDueDate("");
        setPoints(100);
        setDesc("");
        setNewMaterials([]);
    };

    const handleEdit = (hw: Homework) => {
        setEditingId(hw.id);
        setName(hw.name);
        setDueDate(hw.dueDate.split('T')[0]);
        setPoints(hw.points);
        setDesc(hw.description || "");
        setNewMaterials(hw.materials);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this homework? All submissions will also be deleted.")) return;
        try {
            const res = await fetch(`/api/homework?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            alert("Delete failed");
        }
    };

    const updateGrade = async (id: string) => {
        try {
            const res = await fetch("/api/submissions/instructor", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, grade: gradeInputs[id] }),
            });
            if (res.ok) fetchData();
        } catch (e) {
            alert("Failed");
        }
    };

    const addSubmissionLink = (homeworkId: string) => {
        const draft = getDraft(homeworkId);
        if (!draft.title || !draft.url) return;
        setDraft(homeworkId, {
            materials: [...draft.materials, { title: draft.title, url: draft.url }],
            title: "",
            url: "",
        });
    };

    const updateSubmissionLink = (homeworkId: string, index: number, field: "title" | "url", value: string) => {
        const draft = getDraft(homeworkId);
        const updated = draft.materials.map((item, i) => i === index ? { ...item, [field]: value } : item);
        setDraft(homeworkId, { ...draft, materials: updated });
    };

    const removeSubmissionLink = (homeworkId: string, index: number) => {
        const draft = getDraft(homeworkId);
        setDraft(homeworkId, {
            ...draft,
            materials: draft.materials.filter((_, i) => i !== index),
        });
    };

    const submitStudentSubmission = async (homeworkId: string) => {
        const draft = getDraft(homeworkId);
        if (draft.materials.length === 0) {
            alert("Add at least one link before submitting.");
            return;
        }

        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ homeworkId, materials: draft.materials }),
            });
            if (res.ok) {
                fetchData();
            } else {
                const text = await res.text();
                alert(text || "Failed to submit");
            }
        } catch (e) {
            alert("Failed to submit");
        }
    };

    const deleteStudentSubmission = async (id: string) => {
        if (!confirm("Delete your submission?")) return;
        try {
            const res = await fetch(`/api/submissions?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
            if (res.ok) fetchData();
            else alert("Failed to delete submission");
        } catch (e) {
            alert("Failed to delete submission");
        }
    };

    const renderStatusLabel = (hw: Homework, submission?: Submission) => {
        if (!submission) return <span style={{ color: "#666", fontStyle: "italic" }}>Not submitted</span>;
        const submittedAt = new Date(submission.submittedAt);
        const dueEnd = new Date(hw.dueDate);
        dueEnd.setHours(23, 59, 59, 999);
        const isLate = submittedAt > dueEnd;
        return (
            <span style={{ color: isLate ? "#800" : "#086", borderColor: isLate ? "#800" : "#086", fontSize: "15px", padding: "3px 8px", borderRadius: "12px" }}>
                {isLate ? "Late" : "On Time"}
            </span>
        );
    };

    if (isLoading || loading) return <div>Loading...</div>;

    return (
        <div id="page-homework" className="page-section active">
            <h2>Homework Assignments</h2>
            {isStaff && (
                <div className="form-section" style={{ border: "1px solid #ccc", padding: "15px" }}>
                    <h3>{editingId ? "✎ Edit Assignment" : "➕ New Assignment"}</h3>
                    <div className="form-row">
                        <div style={{ flex: 1, marginRight: "10px" }}>
                            <label>Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Homework 1" style={{ width: "100%" }} />
                        </div>
                        <div style={{ flex: 1, marginRight: "10px" }}>
                            <label>Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: "100%" }} />
                        </div>
                    </div>

                    <div style={{ width: "80px" }}>
                        <label>Points</label>
                        <input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value))} style={{ width: "100%" }} />
                    </div>

                    <label>Description</label>
                    <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Topics/Instructions..."
                        style={{ width: "100%", height: "80px", padding: "8px", fontFamily: "inherit" }}
                    />

                    <div style={{ margin: "15px 0", padding: "10px", border: "1px solid #ccc" }}>
                        <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>Assignment Materials (Links):</p>
                        {newMaterials.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                                {newMaterials.map((m, i) => (
                                    <div key={i} style={{ fontSize: "12px", background: "#fff", padding: "4px 8px", marginBottom: "4px", borderRadius: "3px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span><strong>{m.title}</strong>: {m.url}</span>
                                        <button className="btn btn-sm" style={{ color: "#800", padding: "0 4px" }} onClick={() => setNewMaterials(newMaterials.filter((_, idx) => idx !== i))}>&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="form-row">
                            <input type="text" placeholder="Link Title" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} style={{ flex: 1, marginRight: "5px" }} />
                            <input type="text" placeholder="URL" value={matUrl} onChange={(e) => setMatUrl(e.target.value)} style={{ flex: 2, marginRight: "5px" }} />
                            <button className="btn btn-sm" onClick={addMaterial}>Add Link</button>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-primary" onClick={handleAddOrUpdate}>
                            {editingId ? "Update Assignment" : "Post Assignment"}
                        </button>
                        {editingId && <button className="btn" onClick={resetForm}>Cancel</button>}
                    </div>
                </div>
            )}

            {homework.map((hw) => {
                const studentSubmission = submissions.find((s) => s.homeworkId === hw.id);
                const draft = getDraft(hw.id);
                return (
                    <div key={hw.id} className="section-block">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <h3>{hw.name} <span style={{ fontSize: 12, fontWeight: "normal" }}>(Due: {new Date(hw.dueDate).toLocaleDateString()}, {hw.points} pts)</span></h3>
                            {isStaff && (
                                <div style={{ fontSize: "11px" }}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(hw); }}>edit</a> &nbsp;
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(hw.id); }} style={{ color: "#800" }}>delete</a>
                                </div>
                            )}
                        </div>
                        <p>{hw.description}</p>

                        {isStaff ? (
                            <table className="classic">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Submission</th>
                                        <th>Status</th>
                                        <th>Grade</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.filter((s) => s.homeworkId === hw.id).length > 0 ? (
                                        submissions.filter((s) => s.homeworkId === hw.id).map((s) => (
                                            <tr key={s.id}>
                                                <td>{s.user?.name}</td>
                                                <td>{s.materials.map((m, i) => <div key={i}><a href={m.url} target="_blank">{m.title}</a></div>)}</td>
                                                <td>{renderStatusLabel(hw, s)}</td>
                                                <td><input type="number" defaultValue={s.grade ?? ""} onChange={(e) => setGradeInputs({ ...gradeInputs, [s.id]: e.target.value })} style={{ width: 50 }} /></td>
                                                <td><button className="btn btn-sm" onClick={() => updateGrade(s.id)}>Save</button></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center", color: "#666", fontStyle: "italic", fontSize: "12px", padding: "10px" }}>
                                                No submissions yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="classic">
                                <thead><tr><th>Links</th><th>Your Submission</th><th>Status</th><th>Grade</th></tr></thead>
                                <tbody>
                                    <tr>
                                        <td style={{ verticalAlign: "top" }}>
                                            {hw.materials.map((m, i) => (
                                                <div key={i}><a href={m.url} target="_blank" rel="noreferrer">{m.title}</a></div>
                                            ))}
                                        </td>
                                        <td>
                                            <div style={{ marginBottom: "10px" }}>
                                                {studentSubmission?.materials.length ? studentSubmission.materials.map((m, i) => (
                                                    <div key={i} style={{ marginBottom: "4px" }}>
                                                        <a href={m.url} target="_blank" rel="noreferrer">{m.title}</a>
                                                    </div>
                                                )) : <span style={{ color: "#666", fontStyle: "italic" }}>{isAuditor ? "Auditor view (read-only)" : "No submission yet"}</span>}
                                            </div>
                                            {!isAuditor && (
                                                <div className="form-section" style={{ margin: 0, padding: "12px 14px" }}>
                                                    <h3 style={{ marginBottom: "10px", fontSize: "13px" }}>➤ Submit or edit your work</h3>
                                                    {draft.materials.length > 0 && (
                                                        <div style={{ marginBottom: "10px" }}>
                                                            {draft.materials.map((m, i) => (
                                                                <div key={i} className="form-row" style={{ alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                                                    <input type="text" value={m.title} onChange={(e) => updateSubmissionLink(hw.id, i, "title", e.target.value)} placeholder="Link title" style={{ flex: 1, minWidth: "140px" }} />
                                                                    <input type="text" value={m.url} onChange={(e) => updateSubmissionLink(hw.id, i, "url", e.target.value)} placeholder="URL" style={{ flex: 2, minWidth: "180px" }} />
                                                                    <button className="btn btn-sm" style={{ padding: "0 6px" }} onClick={() => removeSubmissionLink(hw.id, i)}>&times;</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="form-row" style={{ gap: "6px", flexWrap: "wrap" }}>
                                                        <input type="text" placeholder="Link Title" value={draft.title} onChange={(e) => setDraft(hw.id, { ...draft, title: e.target.value })} style={{ flex: 1, minWidth: "140px" }} />
                                                        <input type="text" placeholder="URL" value={draft.url} onChange={(e) => setDraft(hw.id, { ...draft, url: e.target.value })} style={{ flex: 2, minWidth: "180px" }} />
                                                        <button className="btn btn-sm" onClick={() => addSubmissionLink(hw.id)}>Add link</button>
                                                    </div>
                                                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                        <button className="btn btn-primary btn-sm" onClick={() => submitStudentSubmission(hw.id)}>
                                                            {studentSubmission ? "Update submission" : "Submit work"}
                                                        </button>
                                                        {studentSubmission && (
                                                            <button className="btn btn-secondary btn-sm" onClick={() => deleteStudentSubmission(studentSubmission.id)}>
                                                                Delete submission
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ verticalAlign: "middle" }}>
                                            {renderStatusLabel(hw, studentSubmission)}
                                        </td>
                                        <td style={{ verticalAlign: "middle" }}>{studentSubmission?.grade ?? "--"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
