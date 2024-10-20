import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom"; // To get medicineId from route and navigation
import { CartContext } from "../Cart/CartContext"; // For addToCart functionality
import "./MedicineSearch.css"; // Assuming you will create appropriate CSS for styling

const MedicineDetails = () => {
  const { medicineId } = useParams(); // Get medicineId from the URL
  const { addToCart } = useContext(CartContext); // Access addToCart from context
  const [medicine, setMedicine] = useState(null); // State to store the specific medicine details
  const [similarMedicines, setSimilarMedicines] = useState([]); // State to store similar medicines
  const navigate = useNavigate(); // For navigating to other routes

  // Fetch medicine details on component mount
  useEffect(() => {
    // Function to fetch specific medicine from API
    const fetchMedicineDetails = async (id) => {
      const URL = `http://localhost:5001/api/medicines/${id}`;
      try {
        const response = await fetch(URL);
        if (!response.ok) {
          console.log("Could not fetch medicine details");
          return;
        }
        const data = await response.json();
        setMedicine(data); // Set fetched medicine data to state

        // After fetching the medicine, fetch similar medicines by category
        if (data.category) {
          fetchSimilarMedicines(data.category);
        }
      } catch (error) {
        console.log("Internal Server error.");
      }
    };

    // Function to fetch similar medicines based on category
    const fetchSimilarMedicines = async (category) => {
      const URL = `http://localhost:5001/api/medicines?category=${category}`;
      try {
        const response = await fetch(URL);
        if (!response.ok) {
          console.log("Could not fetch similar medicines");
          return;
        }
        const data = await response.json();
        setSimilarMedicines(data); // Set similar medicines to state
      } catch (error) {
        console.log("Internal Server error.");
      }
    };

    if (medicineId) {
      fetchMedicineDetails(medicineId); // Fetch the medicine when medicineId is available
    }
  }, [medicineId]); // Add medicineId as a dependency

  // Handle adding to cart and alert message
  const handleAddToCart = () => {
    if (medicine) {
      addToCart(medicine._id, 1);
      alert(`${medicine.name} has been added to your cart!`);
    }
  };

  if (!medicine) {
    return <div>Loading...</div>; // Loading state while fetching medicine
  }

  return (
    <div className="medicine-details-container">
      <h2>{medicine.name}</h2>
      <div className="medicine-info">
        <img
          src={medicine.imageUrl || "medicine-placeholder.png"}
          alt={medicine.name}
          className="medicine-image"
        />
        <div className="medicine-details">
          <p><strong>Category:</strong> {medicine.category}</p>
          <p><strong>Price:</strong> ₹{medicine.price}</p>
          <p><strong>Stock:</strong> {medicine.stock} units available</p>
          <p><strong>Prescription Required:</strong> {medicine.prescriptionRequired ? "Yes" : "No"}</p>
        </div>
      </div>
      <button className="add-to-cart-btn" onClick={handleAddToCart}>
        Add to Cart
      </button>


      <h3>Similar Medicines</h3>
      <div className="similar-medicines-container">
        {similarMedicines.length > 0 ? (
          similarMedicines.map((similarMedicine) => (
            <div key={similarMedicine._id} className="medicine-card">
              <img
                src={similarMedicine.imageUrl || "medicine-placeholder.png"}
                alt={similarMedicine.name}
                className="medicine-card-image"
              />
              <div className="medicine-card-details">
                <h4>{similarMedicine.name}</h4>
                <p>Price: ₹{similarMedicine.price}</p>
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(similarMedicine._id, 1)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No similar medicines found.</p>
        )}
      <div className="cart-summary">
        <button className="view-cart-btn" onClick={() => navigate("/cart")}>
          View Cart
        </button>
      </div>
      </div>
    </div>
  );
};

export default MedicineDetails;
