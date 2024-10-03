import React, { useState, useContext} from 'react';
import './home.css'; 
// import Dolo650 from '../assets/Dolo-650.jpg';
// import Ibuprofen600mg from '../assets/Ibuprofen-600mg.jpg';
// import VitaminC from '../assets/vitamin-c-500-mg.jpg';
// import Aspirin from '../Home/Aspirin.png';
// import para from '../Home/paracetamol.jpeg';
// import azit from '../Home/azithromycin.jpg';
// import amoxi from '../Home/amoxi.jpg';
// import met from '../Home/metformin.jpg';
// import pant from '../Home/pantoprozole.jpg';
// import cet from '../Home/cetirizine.jpg';
// import lorat from '../Home/loratadine-10-mg-tablets.jpeg';
// import calcium from '../Home/calcihal-500-tablets.jpg';
// import fe from '../Home/fe.jpg';
// import decl from '../Home/Diclofenac-50-Tablet.png';
// import setri from '../Home/Setrikast-5.jpg'
import Chatbot from '../Chatbot/Chatbot';
import { CartContext } from '../Cart/CartContext';

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const [alertMessage, setAlertMessage] = useState('');

  const Alert = ({ message, onClose }) => {
    return (
      <div className="alert">
        <span>{message}</span>
        <button onClick={onClose} className="close-alert">×</button>
      </div>
    );
  };

  const products = [
  // { source: Dolo650, name: 'Dolo 650', price: '₹30', description: 'Pain reliever and fever reducer' },
  // { source: Ibuprofen600mg, name: 'Ibuprofen 600mg', price: '₹8', description: 'Anti-inflammatory painkiller' },
  // { source: VitaminC, name: 'Vitamin C 500mg', price: '₹12', description: 'Chewable tablets' },

  // { source: para, name: 'Paracetamol 500mg', price: '₹20', description: 'Common fever and pain relief tablet' },
  // { source: Aspirin, name: 'Aspirin 100mg', price: '₹10', description: 'Blood thinner and pain reliever' },
  // { source: azit, name: 'Azithromycin 500mg', price: '₹50', description: 'Broad-spectrum antibiotic' },
  // { source: amoxi, name: 'Amoxicillin 500mg', price: '₹25', description: 'Antibiotic for bacterial infections' },
  // { source: met, name: 'Metformin 500mg', price: '₹15', description: 'Oral diabetes medication' },
  // { source: pant, name: 'Pantoprazole 40mg', price: '₹18', description: 'Acid reflux and heartburn relief' },
  // { source: cet, name: 'Cetirizine 10mg', price: '₹5', description: 'Antihistamine for allergies' },
  // { source: lorat, name: 'Loratadine 10mg', price: '₹6', description: 'Non-drowsy allergy relief' },
  // { source: calcium, name: 'Calcium Carbonate 500mg', price: '₹12', description: 'Calcium supplement for bone health' },
  // { source: fe, name: 'Iron + Folic Acid', price: '₹15', description: 'Iron supplement for anemia' },
  // { source: decl, name: 'Diclofenac 50mg', price: '₹10', description: 'Painkiller for joint pain and inflammation' },
  // { source: setri, name: 'Levocetirizine 5mg', price: '₹7', description: 'Antihistamine for allergy symptoms' },
  // { source: 'https://example.com/images/amlodipine5mg.jpg', name: 'Amlodipine 5mg', price: '₹10', description: 'Blood pressure control medication' },
  // { source: 'https://example.com/images/atorvastatin10mg.jpg', name: 'Atorvastatin 10mg', price: '₹20', description: 'Cholesterol-lowering medication' },
  // { source: 'https://example.com/images/clopidogrel75mg.jpg', name: 'Clopidogrel 75mg', price: '₹30', description: 'Prevents blood clots in heart disease' },
  // { source: 'https://example.com/images/multivitaminCapsules.jpg', name: 'Multivitamin Capsules', price: '₹50', description: 'General supplement for overall health' }
];

  
  const handleAddToCart = (product) => {
    addToCart(product);
    setAlertMessage(`${product.name} has been added to your cart!`); 
    setTimeout(() => setAlertMessage(''), 3000); 
  };


  return (
    <div className='main'>
      <main>
        <section className="hero">
          <h1>Welcome to Online Medicine Delivery</h1>
          <p>Your one-stop solution for all medical needs</p>

          

        </section>

        <section className="products">
          <h2>Popular Products</h2>
          <div className="product-list">
            {products.map(product => (
              <div className="product-item" key={product.name}>
                <a href="#">
                  <img src={product.source} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <p><strong>{product.price}</strong></p>
                </a>
                <button onClick={() => handleAddToCart(product)}>
                  <i className="bi bi-cart-check"></i>Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>
        <Chatbot />
      </main>

      {alertMessage && <Alert message={alertMessage} onClose={() => setAlertMessage('')} />}

      <footer>
        <p>&copy; 2024 Online Medicine Delivery. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
