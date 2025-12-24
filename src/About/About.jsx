import React from "react";
import { useNavigate } from "react-router-dom";
import "./About.css";

const About = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="about-root">
      {/* Floating back button */}
      <button type="button" className="back-pill" onClick={goHome}>
        <span className="back-arrow left" />
        <span className="back-text">Home</span>
      </button>

      {/* Background gradient blobs */}
      <div className="about-bg about-bg-1" />
      <div className="about-bg about-bg-2" />
      <div className="about-bg about-bg-3" />

      <div className="about-container">
        {/* Left: main content */}
        <section className="about-hero">
          <p className="about-pill">About MediQuick</p>

          <h1 className="about-title">
            Smarter care,
            <span className="about-title-gradient"> faster relief.</span>
          </h1>

          <p className="about-subtitle">
            MediQuick combines intelligent symptom analysis with curated
            medicines to help you make safer, faster decisions about your
            health—anytime, from anywhere.
          </p>

          <div className="about-highlights">
            <div className="about-highlight-card">
              <div className="about-highlight-dot" />
              <h3>AI‑assisted guidance</h3>
              <p>
                Our chatbot interprets your symptoms and surfaces relevant
                medicines and information in clear, simple language.
              </p>
            </div>

            <div className="about-highlight-card">
              <div className="about-highlight-dot" />
              <h3>Human‑first design</h3>
              <p>
                Every interaction is built to be calm, respectful, and
                transparent—supporting you, not overwhelming you.
              </p>
            </div>

            <div className="about-highlight-card">
              <div className="about-highlight-dot" />
              <h3>Secure experience</h3>
              <p>
                Your data is protected with secure authentication and a clear
                separation between your profile and recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* Right: animated info card */}
        <section className="about-panel">
          <div className="about-panel-glass">
            <div className="about-orbit">
              <div className="about-orbit-ring about-orbit-ring-1" />
              <div className="about-orbit-ring about-orbit-ring-2" />
              <div className="about-orbit-dot about-orbit-dot-1" />
              <div className="about-orbit-dot about-orbit-dot-2" />
              <div className="about-orbit-dot about-orbit-dot-3" />
            </div>

            <div className="about-panel-content">
              <p className="about-panel-label">Why we built this</p>
              <h2>Healthcare that listens first.</h2>
              <p>
                During stressful moments, searching for medicines and guidance
                should not feel like solving a puzzle. MediQuick cuts through
                noise and gets you to what matters—clear options and next
                steps.
              </p>

              <div className="about-stats">
                <div className="about-stat">
                  <span className="about-stat-number">24/7</span>
                  <span className="about-stat-label">Availability</span>
                </div>
                <div className="about-stat">
                  <span className="about-stat-number">Secured</span>
                  <span className="about-stat-label">Login & profile</span>
                </div>
                <div className="about-stat">
                  <span className="about-stat-number">Smart</span>
                  <span className="about-stat-label">Recommendations</span>
                </div>
              </div>

              <p className="about-disclaimer">
                MediQuick is an assistive tool and does not replace professional
                medical advice. Always consult a qualified doctor for
                diagnoses and treatments.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
