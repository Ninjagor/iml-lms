"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [filter, setFilter] = useState("");
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || (user?.role !== "instructor" && user?.role !== "teacher")) {
        router.push("/");
      } else {
        fetchUsers();
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      alert("Failed to approve user");
    }
  };

  const handleDeny = async (id: string) => {
    if (!confirm("Deny this account request? The user will be notified.")) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "denied" }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      alert("Failed to deny user");
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from this course? Their grades will be retained.`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (error) {
      alert("Failed to remove user");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, role: editRole, status: editStatus }),
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      alert("Failed to update user");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const pendingUsers = users.filter((u) => u.status === "pending");
  const filteredUsers = users.filter((u) => 
    u.status !== "pending" && 
    (u.name.toLowerCase().includes(filter.toLowerCase()) || u.email.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div id="page-users" className="page-section active">
      <h2>User Management</h2>
      <p style={{ fontSize: "12px", color: "#555", marginBottom: "14px" }}>
        Manage student and instructor enrollment. Approve new account requests or change roles.
      </p>

      <div className="subtabs">
        <button 
          className={activeTab === "pending" ? "active" : ""} 
          onClick={() => setActiveTab("pending")}
        >
          Pending Approvals ({pendingUsers.length})
        </button>
        <button 
          className={activeTab === "all" ? "active" : ""} 
          onClick={() => setActiveTab("all")}
        >
          All Users
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="subtab-content active">
          {pendingUsers.length > 0 ? (
            <table className="classic">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Requested Role</th>
                  <th>Signed Up</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className={`user-role-badge role-${user.role}`}>{user.role}</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(user.id)}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeny(user.id)}>Deny</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No pending account requests.</p>}
        </div>
      )}

      {activeTab === "all" && (
        <div className="subtab-content active">
          <input 
            type="text" 
            placeholder="Filter by name/email" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginBottom: "10px", padding: "4px" }}
          />
          <table className="classic">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`user-role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u.status}</td>
                  <td>
                    {u.id !== user?.id && (
                      <>
                        <button className="btn btn-sm" onClick={() => {
                          setEditingUser(u);
                          setEditName(u.name);
                          setEditRole(u.role);
                          setEditStatus(u.status);
                        }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(u.id, u.name)}>Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <div className="modal-header">
              <span>Edit User: {editingUser.name}</span>
              <button onClick={() => setEditingUser(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row"><label>Full Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <div className="form-row"><label>Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>
              <div className="form-row"><label>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
              <div style={{ marginTop: "10px" }}>
                <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                <button className="btn" style={{ marginLeft: "8px" }} onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
