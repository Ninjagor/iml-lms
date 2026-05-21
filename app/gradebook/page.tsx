"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Homework {
    id: string;
    name: string;
    points: number;
}

interface Quiz {
    id: string;
    title: string;
    points: number;
}

interface QuizGrade {
    quizId: string;
    userId: string;
    score: number;
    maxScore: number;
}

interface Submission {
    id: string;
    homeworkId: string;
    userId: string;
    grade: number | null;
}

interface GradebookData {
    students: User[];
    homeworks: Homework[];
    quizzes: Quiz[];
    quizGrades: QuizGrade[];
    submissions: Submission[];
}

export default function GradebookPage() {
    const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.role === "auditor") {
            router.push("/");
        }
    }, [user, isLoading, router]);
    const [data, setData] = useState<GradebookData | null>(null);
    const [loading, setLoading] = useState(true);

    const isStaff = user && (user.role === "instructor" || user.role === "teacher");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/gradebook");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { checkAuth(); }, [checkAuth]);
    useEffect(() => { if (!isLoading) fetchData(); }, [isLoading]);

    if (isLoading || loading) return <div>Loading...</div>;

    if (!data) return <div>Loading...</div>;

    const { students, homeworks, quizzes, quizGrades, submissions } = data;

    const calculateOverall = (userId: string) => {
        let earned = 0;
        let total = 0;
        let hasGrades = false;

        homeworks.forEach(hw => {
            const sub = submissions.find(s => s.homeworkId === hw.id && s.userId === userId);
            if (sub && sub.grade !== null) {
                earned += sub.grade;
                total += hw.points;
                hasGrades = true;
            }
        });

        quizzes.forEach(q => {
            const qg = quizGrades.find(g => g.quizId === q.id && g.userId === userId);
            if (qg) {
                earned += qg.score;
                total += q.points;
                hasGrades = true;
            }
        });

        if (!hasGrades || total === 0) return { pct: null, earned, total };
        return { pct: (earned / total) * 100, earned, total };
    };

    const getLetterGrade = (pct: number | null) => {
        if (pct === null) return "N/A";
        if (pct >= 93) return "A";
        if (pct >= 90) return "A-";
        if (pct >= 87) return "B+";
        if (pct >= 83) return "B";
        if (pct >= 80) return "B-";
        if (pct >= 77) return "C+";
        if (pct >= 70) return "C";
        if (pct >= 60) return "D";
        return "F";
    };

    const getGradeClass = (pct: number | null) => {
        if (pct === null) return "grade-missing";
        if (pct >= 90) return "grade-A";
        if (pct >= 80) return "grade-B";
        if (pct >= 70) return "grade-C";
        if (pct >= 60) return "grade-D";
        return "grade-F";
    };

    if (!isStaff) {
        const myId = user!.id;
        const student = students?.find((s: any) => s.id === myId) || { name: user!.name, email: user!.email };
        const overall = calculateOverall(myId);

        return (
            <div id="page-gradebook" className="page-section active">
                <h2>My Grades — {student.name} ({student.email.split('@')[0]})</h2>
                <table className="gradebook-summary">
                    <tbody>
                        <tr>
                            <td className="label">Current Overall Grade:</td>
                            <td style={{ fontWeight: "bold", color: overall.pct !== null ? "#004d00" : "#888", fontSize: "15px" }}>
                                {getLetterGrade(overall.pct)} {overall.pct !== null ? `(${overall.pct.toFixed(1)}%)` : ""}
                            </td>
                        </tr>
                        <tr>
                            <td className="label">Points Earned:</td>
                            <td style={{ fontWeight: "bold" }}>{overall.earned} / {overall.total}</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Homework</h3>
                <table className="classic">
                    <thead>
                        <tr>
                            <th>Assignment</th>
                            <th>Score</th>
                            <th>Max</th>
                            <th>Pct</th>
                        </tr>
                    </thead>
                    <tbody>
                        {homeworks.map(hw => {
                            const sub = submissions.find(s => s.homeworkId === hw.id && s.userId === myId);
                            const pct = sub && sub.grade !== null ? (sub.grade / hw.points) * 100 : null;
                            return (
                                <tr key={hw.id}>
                                    <td>{hw.name}</td>
                                    <td className={`grade-cell ${pct !== null ? getGradeClass(pct) : "grade-missing"}`}>
                                        {sub && sub.grade !== null ? sub.grade : "—"}
                                    </td>
                                    <td className="grade-cell">{hw.points}</td>
                                    <td className={`grade-cell ${pct !== null ? "" : "grade-missing"}`}>
                                        {pct !== null ? `${pct.toFixed(1)}%` : "pending"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <h3>Exams & Quizzes</h3>
                <table className="classic">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Score</th>
                            <th>Max</th>
                            <th>Pct</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quizzes.map(q => {
                            const qg = quizGrades.find(g => g.quizId === q.id && g.userId === myId);
                            const pct = qg ? (qg.score / q.points) * 100 : null;
                            return (
                                <tr key={q.id}>
                                    <td>{q.title}</td>
                                    <td className={`grade-cell ${pct !== null ? getGradeClass(pct) : "grade-missing"}`}>
                                        {qg ? qg.score : "—"}
                                    </td>
                                    <td className="grade-cell">{q.points}</td>
                                    <td className={`grade-cell ${pct !== null ? "" : "grade-missing"}`}>
                                        {pct !== null ? `${pct.toFixed(1)}%` : "upcoming"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // Instructor View
    return (
        <div id="page-gradebook" className="page-section active">
            <h2>Gradebook — CS XXXX Fall 2027</h2>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "14px" }}>
                <table className="gradebook-summary">
                    <tbody>
                        <tr><td className="label">Enrolled:</td><td style={{ fontWeight: "bold" }}>{students.length}</td></tr>
                        <tr><td className="label">Class Average:</td><td style={{ fontWeight: "bold" }}>
                            {(() => {
                                const gradedStudents = students
                                    .map(s => calculateOverall(s.id).pct)
                                    .filter((pct): pct is number => pct !== null);
                                if (gradedStudents.length === 0) return "N/A";
                                return (gradedStudents.reduce((acc, pct) => acc + pct, 0) / gradedStudents.length).toFixed(1) + "%";
                            })()}
                        </td></tr>
                    </tbody>
                </table>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table className="classic compact">
                    <thead>
                        <tr>
                            <th style={{ minWidth: "160px", textAlign: "left" }}>Student</th>
                            {homeworks.map(hw => (
                                <th key={hw.id} style={{ width: "32px" }}>
                                    {hw.name.replace("Homework ", "HW")}
                                </th>
                            ))}
                            {quizzes.map(q => (
                                <th key={q.id} style={{ width: "32px" }}>
                                    {q.title
                                        .replace("Quiz ", "Q")
                                        .replace("Midterm ", "MT")
                                        .replace("Final Exam", "Final")}
                                </th>
                            ))}
                            <th style={{ width: "90px" }}>Overall</th>
                            <th style={{ width: "50px" }}>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => {
                            const overall = calculateOverall(student.id);
                            return (
                                <tr key={student.id}>
                                    <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                                        {student.name}
                                    </td>

                                    {homeworks.map(hw => {
                                        const sub = submissions.find(
                                            s => s.homeworkId === hw.id && s.userId === student.id
                                        );
                                        const pct =
                                            sub && sub.grade !== null
                                                ? (sub.grade / hw.points) * 100
                                                : null;

                                        return (
                                            <td
                                                key={hw.id}
                                                className={`grade-cell ${pct !== null
                                                    ? getGradeClass(pct)
                                                    : "grade-missing"
                                                    }`}
                                            >
                                                {sub && sub.grade !== null ? sub.grade : "—"}
                                            </td>
                                        );
                                    })}

                                    {quizzes.map(q => {
                                        const qg = quizGrades.find(
                                            g => g.quizId === q.id && g.userId === student.id
                                        );
                                        const pct =
                                            qg ? (qg.score / q.points) * 100 : null;

                                        return (
                                            <td
                                                key={q.id}
                                                className={`grade-cell ${pct !== null
                                                    ? getGradeClass(pct)
                                                    : "grade-missing"
                                                    }`}
                                            >
                                                {qg ? qg.score : "—"}
                                            </td>
                                        );
                                    })}

                                    <td className="grade-cell">
                                        {overall.pct !== null ? (
                                            <>
                                                <span className="pbar-wrap">
                                                    <span
                                                        className="pbar-fill"
                                                        style={{
                                                            width: `${overall.pct}%`,
                                                        }}
                                                    ></span>
                                                </span>{" "}
                                                {overall.pct.toFixed(1)}%
                                            </>
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>

                                    <td
                                        className={`grade-cell ${getGradeClass(
                                            overall.pct
                                        )}`}
                                    >
                                        <strong>
                                            {getLetterGrade(overall.pct)}
                                        </strong>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <style jsx>{`
        .compact th,
        .compact td {
            padding: 4px 6px;
            font-size: 12px;
            text-align: center;
        }

        .compact th:first-child,
        .compact td:first-child {
            text-align: left;
        }
    `}</style>
            </div>
        </div>
    );
}
