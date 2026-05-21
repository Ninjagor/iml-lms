"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";

export default function SignupPage() {
    const router = useRouter();
    const { logout } = useAuthStore();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Signup failed");
                return;
            }

            // Log out to clear session and redirect to login with pending message
            await fetch("/api/auth/logout", { method: "POST" });
            logout();
            router.push("/login?pending=true");
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="screen-container">
            <div className="login-box">
                <div className="login-box-header">
                    Create Account — Introduction to Machine Learning
                    <span className="uni-small">Sign up with your email and password</span>
                </div>
                <div className="login-box-body">
                    <form onSubmit={handleSignup}>
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", fontFamily: "Times New Roman", fontSize: "14px" }}
                            />
                        </div>
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", fontFamily: "Times New Roman", fontSize: "14px" }}
                            />
                        </div>
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ width: "100%", padding: "8px", fontFamily: "Times New Roman", fontSize: "14px" }}
                            />
                        </div>
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                                I am a:
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={{ width: "100%", padding: "8px", fontFamily: "Times New Roman", fontSize: "14px" }}
                            >
                                <option value="student">Student</option>
                                <option value="instructor">Instructor</option>
                            </select>
                        </div>
                        {error && (
                            <div style={{ color: "#d32f2f", fontSize: "12px", marginBottom: "10px" }}>
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="google-btn"
                            disabled={isLoading}
                            style={{ width: "100%", cursor: isLoading ? "not-allowed" : "pointer" }}
                        >
                            {isLoading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>
                    <hr className="login-divider" />
                    <p className="login-note">
                        Your account request will be sent to the course instructor for approval.
                    </p>
                    <p className="login-link"><a href="/login">← Back to login</a></p>
                </div>
            </div>
        </div>
    );
}
