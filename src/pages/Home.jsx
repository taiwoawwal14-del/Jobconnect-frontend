import React from "react";
import "../css/Home.css";
import { Link } from "react-router-dom";
import heroImg from "../assets/secondjob.png";

export default function Home() {
  return (
    <main className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Build your future with JobConnect.</h1>
          <p>
            Discover job matches, connect with top employers, and grow your
            career.
          </p>

          <div className="hero-actions">
            <Link className="primary-btn" to="/signup">
              Get started
            </Link>
            <Link className="secondary-btn" to="/login">
              Log in
            </Link>
          </div>
        </div>

        <div className="hero-media">
          <img src={heroImg} alt="people connecting" />
        </div>
      </section>

      {/* Feature Section */}
      <section className="feature-grid">
        <article>
          <h2>Smart Matching</h2>
          <p>Discover opportunities aligned with your experience and goals.</p>
        </article>
        <article>
          <h2>Career Support</h2>
          <p>
            Track your applications and keep your job search moving forward.
          </p>
        </article>
        <article>
          <h2>Hiring Made Easy</h2>
          <p>
            Connect directly with top employers seeking your specific skills.
          </p>
        </article>
      </section>

      <section className="testimonials">
        <div className="testimonial">
          <p className="quote">“I found my dream role in under two weeks.”</p>
          <p className="who">— Sarah K., Product Designer</p>
        </div>
        <div className="testimonial">
          <p className="quote">“Hiring was so much faster with JobConnect.”</p>
          <p className="who">— Mark R., Head of Talent</p>
        </div>
      </section>

      <section className="bottom-cta">
        <div>
          <h2>Ready to get started?</h2>
          <p className="small text-muted">
            Create an account and start applying today.
          </p>
        </div>
        <div>
          <Link className="primary-btn" to="/signup">
            Create account
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="jc-brand">JobConnect</span>
            <p className="small text-muted">
              Opportunities • People • Progress
            </p>
          </div>

          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
          </div>
        </div>
        <div className="footer-bottom text-muted">
          © {new Date().getFullYear()} JobConnect. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
