import { ArrowRight, BookOpen, BrainCircuit, ShieldCheck, Sparkles } from 'lucide-react';

const highlightItems = [
  'Diagram-first concept popups',
  'Chat-style answer history',
  'Adaptive question selection',
];

const experienceItems = [
  'Interactive lessons',
  'Smart knowledge checks',
  'Feedback-driven learning',
];

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-shell">
        <div className="site-footer-card">
          <div className="site-footer-grid">
            <div className="site-footer-brand">
              <div className="site-footer-brand-row">
                <div className="site-footer-brand-icon">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h3 className="site-footer-title">SignLearn AI</h3>
                  <p className="site-footer-kicker">Knowledge Graph Learning Suite</p>
                </div>
              </div>

              <p className="site-footer-copy">
                A modern adaptive e-learning experience for guided video lessons,
                concept diagrams, popup MCQs, and feedback history designed for
                focused student growth.
              </p>

              <div className="site-footer-badge-row">
                <div className="site-footer-badge site-footer-badge-primary">
                  <BookOpen size={16} />
                  O/L ICT Ready
                </div>
                <div className="site-footer-badge">
                  <ShieldCheck size={16} className="text-accent" />
                  FastAPI + React + MongoDB
                </div>
              </div>
            </div>

            <div className="site-footer-column">
              <h4 className="site-footer-heading">Platform Highlights</h4>
              <div className="site-footer-list">
                {highlightItems.map((item) => (
                  <div key={item} className="site-footer-list-item">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="site-footer-column">
              <h4 className="site-footer-heading">Experience</h4>
              <div className="site-footer-list">
                {experienceItems.map((item) => (
                  <div key={item} className="site-footer-list-item site-footer-list-item-arrow">
                    <span>{item}</span>
                    <ArrowRight size={16} className="text-primary" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="site-footer-bottom">
            <div className="site-footer-bottom-copy">
              <Sparkles size={16} className="text-primary" />
              <span>Built for smart, guided, and visually calm e-learning.</span>
            </div>

            <div className="site-footer-meta">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Support</span>
              <span>&copy; {new Date().getFullYear()} SignLearn AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
