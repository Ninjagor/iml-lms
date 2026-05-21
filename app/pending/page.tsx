"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingPage() {
    const { user, isLoading, isAuthenticated, logout, checkAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
        if (user && user.status === "active") {
            router.push("/");
        }
    }, [user, isLoading, isAuthenticated, router]);

    const handleSignOut = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        logout();
        router.push("/login");
    };

    if (isLoading) return <div className="screen-container">Loading...</div>;

    return (
        <div className="screen-container">
            <div className="pending-box">
                <div className="pending-box-header">Account Pending Approval</div>
                <div className="pending-box-body">
                    <p>
                        Your account (<strong>{user?.email}</strong>) has been
                        submitted and is awaiting instructor approval.
                    </p>
                    <div className="warn">
                        <strong>⚠ Access not yet granted.</strong>
                        <br />
                        Please try again later.
                    </div>
                    <p style={{ fontSize: "12px", color: "#555" }}>
                        If you believe this is an error, contact your instructor.
                    </p>
                    <button
                        className="btn"
                        style={{ marginTop: "10px" }}
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
