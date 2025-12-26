// MedicineDetails.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./MedicineDetails.css";
import { CartContext } from "../Cart/CartContext";

// Deployed backend base URL
const HOST = "https://mediquick-backend-yizx.onrender.com";

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await fetch(`${HOST}/api/combined-medicines/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch medicine details");
        }
        const data = await res.json();
        setMedicine(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddToCart = () => {
    if (!medicine) return;

    const isLoggedIn = !!localStorage.getItem("auth-token");
    const qty = quantity || 1;

    if (!isLoggedIn) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    addToCart(medicine._id, qty);
    setAlertMessage(
      `${medicine.name} (Quantity: ${qty}) has been added to your cart!`
    );
    setTimeout(() => setAlertMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="med-details-page med-details-loading">
        <p>Loading medicine details…</p>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="med-details-page med-details-error">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <p>{error || "Medicine not found"}</p>
      </div>
    );
  }

  const {
    name,
    description,
    dosage,
    side_effects = [],
    contraindications = [],
    brand_name = [],
    price,
    delivery_time,
    prescription_required,
    in_stock,
    recommended_dosage = {},
    availability,
    precautions = [],
    alternativeMedicines = [],
    manufacturer,
    category,
    rating,
    use0,
    use1,
    use2,
    use3,
    use4,
    imageUrl, // from mediciness DB
  } = medicine;

  const uses = [use0, use1, use2, use3, use4].filter(Boolean);

  return (
    <div className="med-details-page">
      <div className="med-details-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
      </div>

      <div className="med-details-main-card">
        {/* Left: image + basic info */}
        <div className="med-details-left">
          {imageUrl ? (
            <div className="med-image-wrapper">
              <img src={imageUrl} alt={name} className="med-main-image" />
            </div>
          ) : (
            <div className="med-image-placeholder">
              <span>{name?.charAt(0) || "M"}</span>
            </div>
          )}

          <div className="med-basic-info">
            <h1 className="med-name">{name}</h1>
            {category && <p className="med-category">{category}</p>}
            {manufacturer && (
              <p className="med-manufacturer">By {manufacturer}</p>
            )}

            <div className="med-price-rating-row">
              {price && <p className="med-price">{price}</p>}
              {typeof rating === "number" && (
                <div className="med-rating-pill">★ {rating.toFixed(1)}</div>
              )}
            </div>

            <div className="med-availability-row">
              {in_stock && availability && (
                <span className="tag in-stock-tag">{availability}</span>
              )}
              {prescription_required && (
                <span className="tag rx-tag">Prescription required</span>
              )}
              {!prescription_required && (
                <span className="tag otc-tag">OTC</span>
              )}
            </div>

            {delivery_time && (
              <p className="med-delivery">Delivery in {delivery_time}</p>
            )}

            <div className="med-cta-row">
              <div className="quantity-select">
                <button
                  onClick={() =>
                    setQuantity((q) => (q > 1 ? q - 1 : 1))
                  }
                >
                  −
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>

              <button
                className="primary-add-cart-btn"
                onClick={handleAddToCart}
                disabled={!in_stock}
              >
                {in_stock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: quick chips */}
        <div className="med-details-right">
          <div className="med-quick-box">
            <h3>Quick Info</h3>
            {uses.length > 0 && (
              <div className="chip-row">
                {uses.map((u, idx) => (
                  <span key={idx} className="chip">
                    {u}
                  </span>
                ))}
              </div>
            )}

            {brand_name.length > 0 && (
              <>
                <p className="section-label">Brand names</p>
                <div className="chip-row">
                  {brand_name.map((b, idx) => (
                    <span key={idx} className="chip ghost-chip">
                      {b}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <section className="med-section">
          <h2>Description</h2>
          <p>{description}</p>
        </section>
      )}

      {/* Recommended dosage */}
      {(dosage ||
        recommended_dosage.children ||
        recommended_dosage.adults ||
        recommended_dosage.elderly) && (
        <section className="med-section">
          <h2>Dosage</h2>
          {dosage && <p className="med-dosage-main">{dosage}</p>}
          <div className="dosage-grid">
            {recommended_dosage.children && (
              <div className="dosage-card">
                <h4>Children</h4>
                <p>{recommended_dosage.children}</p>
              </div>
            )}
            {recommended_dosage.adults && (
              <div className="dosage-card">
                <h4>Adults</h4>
                <p>{recommended_dosage.adults}</p>
              </div>
            )}
            {recommended_dosage.elderly && (
              <div className="dosage-card">
                <h4>Elderly</h4>
                <p>{recommended_dosage.elderly}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Side effects, Contraindications, Precautions */}
      <section className="med-section med-3col">
        {side_effects.length > 0 && (
          <div className="med-column-card">
            <h3>Side Effects</h3>
            <ul>
              {side_effects.map((se, idx) => (
                <li key={idx}>{se}</li>
              ))}
            </ul>
          </div>
        )}

        {contraindications.length > 0 && (
          <div className="med-column-card">
            <h3>Contraindications</h3>
            <ul>
              {contraindications.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {precautions.length > 0 && (
          <div className="med-column-card">
            <h3>Precautions</h3>
            <ul>
              {precautions.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Alternatives */}
      {alternativeMedicines.length > 0 && (
        <section className="med-section">
          <h2>Alternative Medicines</h2>
          <div className="chip-row">
            {alternativeMedicines.map((alt, idx) => (
              <span key={idx} className="chip ghost-chip">
                {alt}
              </span>
            ))}
          </div>
        </section>
      )}

      {alertMessage && (
        <Alert
          message={alertMessage}
          onClose={() => setAlertMessage("")}
        />
      )}
    </div>
  );
};

const Alert = ({ message, onClose }) => {
  return (
    <div className="alert" style={{ zIndex: 1001 }}>
      <span>{message}</span>
      <button onClick={onClose} className="close-alert">
        ×
      </button>
    </div>
  );
};

export default MedicineDetails;
