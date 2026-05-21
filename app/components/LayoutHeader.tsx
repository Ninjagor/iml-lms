"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LayoutHeader({
    user,
    isStaff,
}: {
    user: { name: string; role: string };
    isStaff: boolean;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    const isActive = (path: string) => pathname === path;
    return (
        <>
            <div id="uni-header">
                <a href="#">CSW</a> »
                <a href="#">Introduction to Machine Learning - Fall 2027</a>
                <span className="user-info">
                    Signed in as: <strong id="header-username">{user.name}</strong>
                    &nbsp;({user.role})
                    &nbsp;<button onClick={handleSignOut} style={{ background: "none", border: "none", color: "#1976d2", cursor: "pointer", textDecoration: "underline" }}>[Sign Out]</button>
                </span>
            </div>

            <div id="course-banner">
                <h1>CS XXXX: Introduction to Machine Learning</h1>
                <div className="subtitle">
                    CSW — Department of Computer Science — Fall 2027
                </div>
                <div className="meta">
                    Period X &nbsp;|&nbsp; Room XXX &nbsp;
                </div>
            </div>

            <div id="topnav">
                <Link href="/" className={`${isActive('/') ? "active" : ""}`}>Home</Link>
                <Link href="/schedule" className={`${isActive('/schedule') ? "active" : ""}`}>Schedule</Link>
                <Link href="/lectures" className={`${isActive('/lectures') ? "active" : ""}`}>Lectures & Notes</Link>
                <Link href="/homework" className={`${isActive('/homework') ? "active" : ""}`}>Homework</Link>
                <Link href="/quizzes" className={`${isActive('/quizzes') ? "active" : ""}`}>Quizzes & Exams</Link>
                <Link href="/gradebook" className={`${isActive('/gradebook') ? "active" : ""}`}>Gradebook</Link>
                {isStaff && (
                    <Link href="/users" className={`${isActive('/users') ? "active" : ""}`}>
                        ▶ Users
                    </Link>
                )}
            </div>
        </>
    );
}
