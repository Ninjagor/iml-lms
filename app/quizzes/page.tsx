"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useEffect, useState } from "react";

interface Quiz {
    id: string;
    title: string;
    type: string;
    date: string;
    isPublished: boolean;
    answerKeyTitle: string | null;
    answerKeyUrl: string | null;
    points: number;
    instructions: string | null;
    grades?: QuizGrade[];
}

interface QuizGrade {
    id: string;
    quizId: string;
    userId: string;
    score: number;
    maxScore: number;
    user?: { name: string; email: string };
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function QuizzesPage() {
    const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubtab, setActiveSubtab] = useState("list");

    // Form states
    const [title, setTitle] = useState("");
    const [type, setType] = useState("In-Class Quiz");
    const [date, setDate] = useState("");
    const [points, setPoints] = useState(10);
    const [instructions, setInstructions] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [answerKeyTitle, setAnswerKeyTitle] = useState("");
    const [answerKeyUrl, setAnswerKeyUrl] = useState("");

    // Edit state
    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

    // Grade entry state
    const [selectedQuizId, setSelectedQuizId] = useState("");
    const [csvGrades, setCsvGrades] = useState("");
    const [gradeMode, setGradeMode] = useState<"manual" | "csv">("manual");
    const [manualGrades, setManualGrades] = useState<Record<string, string>>({});

    const isStaff = user && (user.role === "instructor" || user.role === "teacher");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/quizzes");
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data);
            }
            if (isStaff) {
                const userRes = await fetch("/api/users");
                if (userRes.ok) {
                    const userData = await userRes.json();
                    // Sort users by name
                    setUsers(userData.sort((a: User, b: User) => (a.name || "").localeCompare(b.name || "")));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading) fetchData();
    }, [isLoading, isStaff]);

    useEffect(() => {
        if (selectedQuizId) {
            const quiz = quizzes.find(q => q.id === selectedQuizId);
            const initialGrades: Record<string, string> = {};
            if (quiz?.grades) {
                quiz.grades.forEach(g => {
                    initialGrades[g.userId] = g.score.toString();
                });
            }
            setManualGrades(initialGrades);
        } else {
            setManualGrades({});
        }
    }, [selectedQuizId, quizzes]);

    const handleCreateOrUpdate = async () => {
        if (!title || !date) return;
        const payload = {
            title,
            type,
            date,
            points,
            instructions,
            isPublished,
            answerKeyTitle,
            answerKeyUrl,
        };

        try {
            const res = await fetch(editingQuizId ? `/api/quizzes/${editingQuizId}` : "/api/quizzes", {
                method: editingQuizId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                resetForm();
                fetchData();
                setActiveSubtab("list");
            }
        } catch (e) {
            alert("Operation failed");
        }
    };

    const resetForm = () => {
        setTitle("");
        setType("In-Class Quiz");
        setDate("");
        setPoints(10);
        setInstructions("");
        setIsPublished(false);
        setAnswerKeyTitle("");
        setAnswerKeyUrl("");
        setEditingQuizId(null);
    };

    const handleEdit = (quiz: Quiz) => {
        setEditingQuizId(quiz.id);
        setTitle(quiz.title);
        setType(quiz.type);
        setDate(quiz.date.split('T')[0]);
        setPoints(quiz.points);
        setInstructions(quiz.instructions || "");
        setIsPublished(quiz.isPublished);
        setAnswerKeyTitle(quiz.answerKeyTitle || "");
        setAnswerKeyUrl(quiz.answerKeyUrl || "");
        setActiveSubtab("create");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this quiz/exam?")) return;
        try {
            const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (e) {
            alert("Delete failed");
        }
    };

    const handleGradeUpload = async () => {
        if (!selectedQuizId || !csvGrades) return;

        // Simple CSV parser (email, score)
        const lines = csvGrades.split('\n');
        const gradesToSubmit = [];

        for (const line of lines) {
            const [email, score] = line.split(',').map(s => s.trim());
            if (!email || !score) continue;

            const user = users.find(u => u.email === email);
            if (user) {
                gradesToSubmit.push({
                    userId: user.id,
                    score: parseInt(score),
                    maxScore: quizzes.find(q => q.id === selectedQuizId)?.points || 10,
                });
            }
        }

        if (gradesToSubmit.length === 0) {
            alert("No valid grades found. Format: email, score");
            return;
        }

        try {
            const res = await fetch("/api/quizzes/grades", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quizId: selectedQuizId, grades: gradesToSubmit }),
            });
            if (res.ok) {
                alert(`Uploaded ${gradesToSubmit.length} grades`);
                setCsvGrades("");
                fetchData();
                setActiveSubtab("list");
            }
        } catch (e) {
            alert("Failed to upload grades");
        }
    };

    const handleManualGradeSave = async () => {
        if (!selectedQuizId) return;

        const quiz = quizzes.find(q => q.id === selectedQuizId);
        const maxScore = quiz?.points || 10;

        const gradesToSubmit = Object.entries(manualGrades)
            .filter(([_, score]) => score !== "")
            .map(([userId, score]) => ({
                userId,
                score: parseInt(score),
                maxScore
            }));

        try {
            const res = await fetch("/api/quizzes/grades", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quizId: selectedQuizId, grades: gradesToSubmit }),
            });
            if (res.ok) {
                alert("Grades saved successfully");
                fetchData();
            }
        } catch (e) {
            alert("Failed to save grades");
        }
    };

    const handleClearGrade = async (userId: string) => {
        if (!selectedQuizId) return;
        if (!confirm("Clear this student's grade?")) return;

        try {
            const res = await fetch(`/api/quizzes/grades?quizId=${selectedQuizId}&userId=${userId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setManualGrades(prev => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });
                fetchData();
            }
        } catch (e) {
            alert("Failed to clear grade");
        }
    };

    if (isLoading || loading) return <div>Loading...</div>;

    return (
        <div id="page-quizzes" className="page-section active">
            <h2>Quizzes & Exams</h2>

            <div className="subtabs">
                <button className={activeSubtab === "list" ? "active" : ""} onClick={() => setActiveSubtab("list")}>All Exams & Quizzes</button>
                {isStaff && <button className={activeSubtab === "create" ? "active" : ""} onClick={() => { resetForm(); setActiveSubtab("create"); }}>{editingQuizId ? "✎ Edit Quiz" : "➕ Create New"}</button>}
                {isStaff && <button className={activeSubtab === "grades" ? "active" : ""} onClick={() => setActiveSubtab("grades")}>Enter Grades</button>}
            </div>

            {activeSubtab === "list" && (
                <div id="qt-subtab-list" className="subtab-content active">
                    <table className="classic" id="quiz-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th style={{ width: "110px" }}>Type</th>
                                <th style={{ width: "110px" }}>Date</th>
                                {!isStaff && <th style={{ width: "75px" }}>My Score</th>}
                                {isStaff && <th style={{ width: "75px" }}>Avg</th>}
                                <th style={{ width: "110px" }}>Key/Materials</th>
                                {isStaff && <th style={{ width: "110px" }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map((q) => {
                                const myGrade = q.grades?.[0];
                                const avgScore = q.grades && q.grades.length > 0
                                    ? (q.grades.reduce((acc, curr) => acc + curr.score, 0) / q.grades.length).toFixed(1)
                                    : "--";

                                return (
                                    <tr key={q.id}>
                                        <td><strong>{q.title}</strong></td>
                                        <td>{q.type}</td>
                                        <td>{new Date(q.date).toLocaleDateString()}</td>
                                        {!isStaff && <td className="grade-cell">{myGrade ? `${myGrade.score}/${myGrade.maxScore}` : "—"}</td>}
                                        {isStaff && <td className="grade-cell">{avgScore}{avgScore !== "--" ? `/${q.points}` : ""}</td>}
                                        <td>
                                            {(isStaff || q.isPublished) && q.answerKeyUrl ? (
                                                <a href={q.answerKeyUrl} target="_blank" rel="noreferrer">
                                                    {q.answerKeyTitle || "Answer Key"} ✔
                                                </a>
                                            ) : (
                                                <span style={{ color: "#888", fontSize: "12px", fontStyle: "italic" }}>
                                                    {q.answerKeyUrl ? "Key not published" : "No materials"}
                                                </span>
                                            )}
                                        </td>
                                        {isStaff && (
                                            <td>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(q); }} style={{ fontSize: "11px" }}>edit</a> &nbsp;
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(q.id); }} style={{ fontSize: "11px", color: "#800" }}>del</a>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {quizzes.length === 0 && (
                                <tr>
                                    <td colSpan={isStaff ? 6 : 5} style={{ textAlign: "center", fontStyle: "italic", padding: "10px" }}>No quizzes or exams found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeSubtab === "create" && isStaff && (
                <div id="qt-subtab-create" className="subtab-content active">
                    <div className="form-section">
                        <h3>{editingQuizId ? "✎ Edit Quiz or Exam" : "➕ Create Quiz or Exam"}</h3>
                        <div className="form-row">
                            <label>Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quiz 6 or Midterm 2" />
                            <label>Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                <option>In-Class Quiz</option>
                                <option>Online Quiz</option>
                                <option>Midterm Exam</option>
                                <option>Final Exam</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <label>Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            <label>Max Points</label>
                            <input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value))} style={{ maxWidth: "100px" }} />
                        </div>
                        <div className="form-row">
                            <label>Instructions</label>
                            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions shown to students..." />
                        </div>
                        <hr />
                        <h3>Answer Key & Materials</h3>
                        <div className="form-row">
                            <label>Key Title</label>
                            <input type="text" value={answerKeyTitle} onChange={(e) => setAnswerKeyTitle(e.target.value)} placeholder="e.g. Midterm 2 Solutions" />
                            <label>Key URL</label>
                            <input type="text" value={answerKeyUrl} onChange={(e) => setAnswerKeyUrl(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="form-row">
                            <label style={{ minWidth: "200px" }}>
                                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Publish to students
                            </label>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={handleCreateOrUpdate}>{editingQuizId ? "Save Changes" : "Create & Save"}</button>
                        <button className="btn" onClick={() => setActiveSubtab("list")}>Cancel</button>
                    </div>
                </div>
            )}

            {activeSubtab === "grades" && isStaff && (
                <div id="qt-subtab-grades" className="subtab-content active">
                    <div className="form-section">
                        <h3>Enter or Import Quiz Grades</h3>
                        <div className="form-row">
                            <label>Quiz/Exam</label>
                            <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)} style={{ fontFamily: "serif", fontSize: "13px" }}>
                                <option value="">Select a Quiz...</option>
                                {quizzes.map(q => <option key={q.id} value={q.id}>{q.title} ({new Date(q.date).toLocaleDateString()})</option>)}
                            </select>
                        </div>

                        {selectedQuizId && (
                            <>
                                <div className="subtabs" style={{ marginTop: "20px", marginBottom: "20px" }}>
                                    <button className={gradeMode === "manual" ? "active" : ""} onClick={() => setGradeMode("manual")}>Table View</button>
                                    <button className={gradeMode === "csv" ? "active" : ""} onClick={() => setGradeMode("csv")}>CSV Import</button>
                                </div>

                                {gradeMode === "manual" && (
                                    <div className="manual-entry">
                                        <table className="classic">
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Email</th>
                                                    <th style={{ width: "120px" }}>Score / {quizzes.find(q => q.id === selectedQuizId)?.points}</th>
                                                    <th style={{ width: "80px" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.filter(u => u.role === "student").map(user => (
                                                    <tr key={user.id}>
                                                        <td>{user.name}</td>
                                                        <td style={{ fontSize: "12px", color: "#666" }}>{user.email}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={manualGrades[user.id] || ""}
                                                                onChange={(e) => setManualGrades({ ...manualGrades, [user.id]: e.target.value })}
                                                                style={{ width: "80px" }}
                                                                placeholder="--"
                                                            />
                                                        </td>
                                                        <td>
                                                            {manualGrades[user.id] && (
                                                                <button
                                                                    onClick={() => handleClearGrade(user.id)}
                                                                    className="btn"
                                                                    style={{ fontSize: "10px", padding: "2px 5px", color: "#800", height: "auto", minWidth: "auto" }}
                                                                >
                                                                    Clear
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {users.filter(u => u.role === "student").length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: "center", fontStyle: "italic", padding: "10px" }}>No students found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <div style={{ marginTop: "20px" }}>
                                            <button className="btn btn-primary" onClick={handleManualGradeSave}>Save All Grades</button>
                                        </div>
                                    </div>
                                )}

                                {gradeMode === "csv" && (
                                    <div className="csv-entry">
                                        <div className="form-row">
                                            <label>Grade Data (CSV)</label>
                                            <textarea
                                                value={csvGrades}
                                                onChange={(e) => setCsvGrades(e.target.value)}
                                                placeholder="email, score&#10;student1@hartwick.edu, 9&#10;student2@hartwick.edu, 10"
                                                style={{ height: "150px" }}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <label style={{ minWidth: 0 }}></label>
                                            <span style={{ fontSize: "11px", color: "#555" }}>Format: <code>email, score</code> (one per line)</span>
                                        </div>
                                        <button className="btn btn-primary" onClick={handleGradeUpload}>Upload Grades</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
