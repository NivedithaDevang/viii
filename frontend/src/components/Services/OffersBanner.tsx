import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import "./OffersBanner.css";

export function OffersBanner() {
  return (
    <aside className="offers-banner" aria-label="Christmas and opening offers">
      <div className="offers-banner-content">
        <span className="offers-banner-label">
          <Sparkles size={14} />
          SPECIAL OFFERS
        </span>
        <h2>Since Christmas is just around the corner... why not make it extra special? 🎄</h2>
        <p>
          Opening Offers and Christmas Special Offers are available. Contact us to know more!
        </p>
      </div>
      <Link to="/contact" className="offers-banner-link">
        Contact us to know more
        <ArrowUpRight size={16} />
      </Link>
    </aside>
  );
}
