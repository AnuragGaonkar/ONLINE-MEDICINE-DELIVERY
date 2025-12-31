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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // RESTOCK STATE
  const [showRestock, setShowRestock] = useState(false);
  const [restockForm, setRestockForm] = useState({
    medicineId: "",
    quantity: "",
    supplierName: "",
    supplierContact: "",
    invoiceNumber: "",
    notes: "",
  });
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState("");
  const [restockSuccess, setRestockSuccess] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("auth-token");

  // handle resize for mobile/desktop switch
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 1) Load current user and enforce admin role
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        navigate("/");
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
            "auth-token": token,
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

  // RESTOCK HANDLERS
  const openRestock = () => {
    setRestockForm({
      medicineId: "",
      quantity: "",
      supplierName: "",
      supplierContact: "",
      invoiceNumber: "",
      notes: "",
    });
    setRestockError("");
    setRestockSuccess("");
    setShowRestock(true);
  };

  const closeRestock = () => {
    setShowRestock(false);
  };

  const handleRestockChange = (e) => {
    const { name, value } = e.target;
    setRestockForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitRestock = async (e) => {
    e.preventDefault();
    setRestockError("");
    setRestockSuccess("");

    const qty = Number(restockForm.quantity);
    if (!restockForm.medicineId || !qty || qty <= 0) {
      setRestockError("Please select a medicine and enter a positive quantity.");
      return;
    }

    try {
      setRestockLoading(true);
      const res = await fetch(`${API_HOST}/api/inventory/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify(restockForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to restock medicine");
      }

      setRestockSuccess("Stock updated successfully.");

      // update items list locally so table/cards reflect new stock
      setItems((prev) =>
        prev.map((m) =>
          m._id === data.medicine._id ? { ...m, stock: data.medicine.stock } : m
        )
      );

      setTimeout(() => setShowRestock(false), 1000);
    } catch (err) {
      console.error(err);
      setRestockError(err.message || "Could not restock medicine.");
    } finally {
      setRestockLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="admin-inv-page">
        <div className="admin-inv-loader">Checking access…</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-inv-page">

      {/* Content */}
      <main className="admin-inv-content">
        <div className="admin-inv-card">
          <div className="admin-inv-card-header">
            <h2>Inventory Overview</h2>
            <div className="admin-inv-header-actions">
              <span className="admin-inv-chip">
                Low stock &lt; {LOW_STOCK_THRESHOLD}
              </span>
              <button className="restock-btn" onClick={openRestock}>
                Restock
              </button>
            </div>
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
            <>
              {/* Desktop: table */}
              {!isMobile && (
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
                                <span className="status-badge low">
                                  Low stock
                                </span>
                              ) : (
                                <span className="status-badge ok">
                                  In stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile: cards */}
              {isMobile && (
                <div className="admin-inv-cards">
                  {items.map((med) => {
                    const isLow =
                      med.stock > 0 && med.stock < LOW_STOCK_THRESHOLD;
                    const isOut = med.stock <= 0;
                    return (
                      <div
                        key={med._id}
                        className={
                          "admin-inv-card-item " +
                          (isOut ? "row-out" : isLow ? "row-low" : "row-normal")
                        }
                      >
                        <div className="admin-inv-card-top">
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
                          <div className="admin-inv-card-status">
                            {isOut ? (
                              <span className="status-badge out">
                                Out of stock
                              </span>
                            ) : isLow ? (
                              <span className="status-badge low">
                                Low stock
                              </span>
                            ) : (
                              <span className="status-badge ok">
                                In stock
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="admin-inv-card-meta">
                          <div className="meta-item">
                            <span className="meta-label">Category</span>
                            <span className="meta-value">
                              {med.category || "-"}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Price</span>
                            <span className="meta-value">
                              {med.price ?? "-"}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Stock</span>
                            <span className="meta-value">{med.stock}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Restock Modal */}
      {showRestock && (
        <div className="restock-overlay">
          <div className="restock-modal">
            <div className="restock-header">
              <h3>Restock Medicine</h3>
              <button className="restock-close" onClick={closeRestock}>
                ×
              </button>
            </div>

            <form className="restock-form" onSubmit={submitRestock}>
              <label>
                Medicine
                <select
                  name="medicineId"
                  value={restockForm.medicineId}
                  onChange={handleRestockChange}
                  required
                >
                  <option value="">Select medicine</option>
                  {items.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} (Stock: {m.stock})
                    </option>
                  ))}
                </select>
              </label>

              <div className="restock-row">
                <label>
                  Quantity to add
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={restockForm.quantity}
                    onChange={handleRestockChange}
                    required
                  />
                </label>
                <label>
                  Invoice No.
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={restockForm.invoiceNumber}
                    onChange={handleRestockChange}
                  />
                </label>
              </div>

              <label>
                Supplier name
                <input
                  type="text"
                  name="supplierName"
                  value={restockForm.supplierName}
                  onChange={handleRestockChange}
                />
              </label>

              <label>
                Supplier contact
                <input
                  type="text"
                  name="supplierContact"
                  value={restockForm.supplierContact}
                  onChange={handleRestockChange}
                />
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  rows="3"
                  value={restockForm.notes}
                  onChange={handleRestockChange}
                />
              </label>

              {restockError && (
                <p className="restock-error">{restockError}</p>
              )}
              {restockSuccess && (
                <p className="restock-success">{restockSuccess}</p>
              )}

              <button
                type="submit"
                className="restock-submit"
                disabled={restockLoading}
              >
                {restockLoading ? "Updating..." : "Add to stock"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
