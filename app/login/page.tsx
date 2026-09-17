"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { logout } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get("pending") === "true") {
            setMessage("Successfully authenticated, please wait for your instructor to approve you.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Login failed");
                return;
            }

            if (data.user.status === "pending") {
                await fetch("/api/auth/logout", { method: "POST" });
                logout();
                setMessage("Successfully authenticated, please wait for your instructor to approve you.");
                return;
            } else {
                window.location.href = "/";
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="screen-container">
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <div style={{ fontSize: "13px", color: "#555", fontStyle: "italic" }}>
                    CSW
                </div>
                <div style={{ fontSize: "11px", color: "#888" }}>
                    Department of Computer Science
                </div>
            </div>
            <div className="login-box">
                <div className="login-box-header">
                    Introduction to Machine Learning
                    <span className="uni-small">Course Portal Login</span>
                </div>
                <div className="login-box-body">
                    <form onSubmit={handleLogin}>
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
                                style={{ width: "100%", padding: "8px", fontFamily: "Times New Roman", fontSize: "14px" }}
                            />
                        </div>
                        {error && (
                            <div style={{ color: "#d32f2f", fontSize: "12px", marginBottom: "10px" }}>
                                {error}
                            </div>
                        )}
                        {message && (
                            <div style={{ color: "#2e7d32", fontSize: "13px", marginBottom: "10px", padding: "8px", backgroundColor: "#e8f5e9", border: "1px solid #c8e6c9" }}>
                                {message}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="google-btn"
                            disabled={isLoading}
                            style={{ width: "100%", cursor: isLoading ? "not-allowed" : "pointer" }}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div style={{ marginTop: "10px" }}>
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    const response = await fetch("/api/auth/auditor", { method: "POST" });
                                    if (response.ok) {
                                        window.location.href = "/";
                                    } else {
                                        setError("Failed to sign in as auditor");
                                    }
                                } catch (e) {
                                    setError("An error occurred");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="btn"
                            disabled={isLoading}
                            style={{
                                width: "100%", cursor: isLoading ? "not-allowed" : "pointer", backgroundColor: "#f8f8f8", color: "#333", border: "1px solid #ccc",
                                padding: "8px 0px"


                            }}

                        >
                            View as Auditor (Read Only)
                        </button>
                    </div>

                    <hr className="login-divider" />
                    <p className="login-note">
                        New student or instructor? <a href="/signup" style={{ color: "#1976d2" }}>Create an account</a>
                    </p>
                    <p className="login-note">
                        After signing in, your account will be submitted for approval by the course instructor.
                    </p>
                </div>
            </div>
        </div>
    );
}
