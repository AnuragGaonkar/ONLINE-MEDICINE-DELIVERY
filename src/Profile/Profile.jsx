import React, { useEffect, useState } from "react";
import "./Profile.css";

const HOST = "https://mediquick-backend-yizx.onrender.com";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("info"); // "info" | "orders"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: {
      street: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });

  const [orders, setOrders] = useState([]);

  const token = localStorage.getItem("auth-token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${HOST}/api/auth/user/profile`, {
          headers: { "auth-token": token },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load profile");
        }
        setProfile({
          name: data.name || "",
          email: data.email || "",
          contactNumber: data.contactNumber || "",
          address: {
            street: data.address?.street || "",
            city: data.address?.city || "",
            postalCode: data.address?.postalCode || "",
            country: data.address?.country || "",
          },
        });
      } catch (err) {
        console.error(err);
        alert("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      alert("Please log in first.");
      return;
    }
    fetchProfile();
  }, [token]);

  const fetchOrders = async () => {
    if (orders.length > 0) return; // simple caching
    setOrdersLoading(true);
    try {
      const res = await fetch(`${HOST}/api/orders/my`, {
        headers: { "auth-token": token },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load orders");
      }
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Could not load orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "orders") {
      fetchOrders();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["street", "city", "postalCode", "country"].includes(name)) {
      setProfile((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${HOST}/api/auth/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({
          name: profile.name,
          contactNumber: profile.contactNumber,
          street: profile.address.street,
          city: profile.address.city,
          postalCode: profile.address.postalCode,
          country: profile.address.country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      alert("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  const handleBackHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="profile-page">
      {/* Top bar with Back button */}
      <div className="profile-top-bar">
        <button className="back-home-btn" onClick={handleBackHome}>
          ← Back to Home
        </button>
      </div>

      <h1>My Account</h1>

      <div className="profile-tabs">
        <button
          className={activeTab === "info" ? "tab active" : "tab"}
          onClick={() => handleTabChange("info")}
        >
          Personal Info
        </button>
        <button
          className={activeTab === "orders" ? "tab active" : "tab"}
          onClick={() => handleTabChange("orders")}
        >
          Orders
        </button>
      </div>

      {activeTab === "info" && (
        <div className="tab-content">
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                disabled
              />
            </div>

            <div className="form-row">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={profile.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <h3>Address</h3>

            <div className="form-row">
              <label>Street</label>
              <input
                type="text"
                name="street"
                value={profile.address.street}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row two-cols">
              <div>
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={profile.address.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={profile.address.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={profile.address.country}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="tab-content">
          {ordersLoading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders yet. Start your first order from the home page.</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">
                      Order #{order._id.slice(-6)}
                    </span>
                    <span className="order-date">
                      {new Date(
                        order.orderDate || order.createdAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="order-meta">
                    <span>Total: ₹{order.totalAmount}</span>
                    <span>Payment: {order.paymentStatus}</span>
                    <span>Delivery: {order.deliveryStatus}</span>
                  </div>

                  <ul className="order-items">
                    {order.medicines.map((m) => (
                      <li key={m._id}>
                        <span>
                          {m.medicineId?.name || "Medicine"} × {m.quantity}
                        </span>
                        {m.medicineId?.price && (
                          <span>₹{m.medicineId.price}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
