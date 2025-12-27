import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminInventory.css";

const API_HOST = "https://mediquick-backend-yizx.onrender.com";
const LOW_STOCK_THRESHOLD = 10;

const AdminInventory = () => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [items, setItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("auth-token");

  // 1) Load current user and enforce admin role
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        navigate("/"); // not logged in
        return;
      }
      try {
        const res = await fetch(`${API_HOST}/api/auth/getuser`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("auth-token");
          navigate("/");
          return;
        }

        const data = await res.json();
        setUser(data);

        if (data.role !== "admin") {
          navigate("/");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [token, navigate]);

  // 2) Load inventory (after user check)
  useEffect(() => {
    if (!token) return;
    if (!user || user.role !== "admin") return;

    const fetchInventory = async () => {
      try {
        setLoadingInventory(true);
        const res = await fetch(`${API_HOST}/api/inventory`, {
          headers: {
            "Content-Type": "application/json",
            "auth-token": token, // ✅ fixed: same header your backend expects
          },
        });

        if (!res.ok) {
          setError("Failed to load inventory.");
          return;
        }

        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading inventory.");
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [token, user]);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/");
  };

  if (loadingUser) {
    return (
      <div className="admin-inv-page">
        <div className="admin-inv-loader">Checking access…</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // safety – redirect already happened
  }

  return (
    <div className="admin-inv-page">
      {/* Top bar */}
      <header className="admin-inv-header">
        <div className="admin-inv-left">
          <span className="admin-logo">MediQuick</span>
          <span className="admin-tag">Admin Inventory</span>
        </div>
        <div className="admin-inv-right">
          <div className="admin-user-pill">
            <span className="admin-avatar">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </span>
            <div className="admin-user-text">
              <span className="admin-user-name">{user.name || "Admin"}</span>
              <span className="admin-user-role">Administrator</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="admin-inv-content">
        <div className="admin-inv-card">
          <div className="admin-inv-card-header">
            <h2>Inventory Overview</h2>
            <span className="admin-inv-chip">
              Low stock &lt; {LOW_STOCK_THRESHOLD}
            </span>
          </div>

          {loadingInventory ? (
            <div className="admin-inv-loader">Loading inventory…</div>
          ) : error ? (
            <div className="admin-inv-error">{error}</div>
          ) : items.length === 0 ? (
            <div className="admin-inv-empty">
              No medicines found in inventory.
            </div>
          ) : (
            <div className="admin-inv-table-wrapper">
              <table className="admin-inv-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((med) => {
                    const isLow =
                      med.stock > 0 && med.stock < LOW_STOCK_THRESHOLD;
                    const isOut = med.stock <= 0;
                    return (
                      <tr
                        key={med._id}
                        className={
                          isOut
                            ? "row-out"
                            : isLow
                            ? "row-low"
                            : "row-normal"
                        }
                      >
                        <td className="cell-med">
                          <div className="med-info">
                            {med.imageUrl && (
                              <img
                                src={med.imageUrl}
                                alt={med.name}
                                className="med-image"
                              />
                            )}
                            <div className="med-text">
                              <span className="med-name">{med.name}</span>
                              <span className="med-id">
                                #{med._id?.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{med.category || "-"}</td>
                        <td>{med.price ?? "-"}</td>
                        <td>{med.stock}</td>
                        <td>
                          {isOut ? (
                            <span className="status-badge out">
                              Out of stock
                            </span>
                          ) : isLow ? (
                            <span className="status-badge low">Low stock</span>
                          ) : (
                            <span className="status-badge ok">In stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminInventory;
