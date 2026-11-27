import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Sparkles,
  Scissors,
  Sparkle,
  Heart,
} from "lucide-react";
import "./Services.css";

interface ServiceCategoryPreview {
  id: "hair" | "skin" | "nails";
  title: string;
  subtitle: string;
  highlights: string[];
  startingPrice: string;
  icon: React.ReactNode;
}

const categoryPreviews: ServiceCategoryPreview[] = [
  {
    id: "hair",
    title: "Hair",
    subtitle: "Cuts, colour, texture treatments and hair care",
    highlights: [
      "Haircuts & Styling",
      "Hair Colour",
      "Texture Treatments & Hair Care",
    ],
    startingPrice: "₹299",
    icon: <Scissors size={20} />,
  },
  {
    id: "skin",
    title: "Skin",
    subtitle: "Facials, skin care and waxing",
    highlights: [
      "Facials & Skin Care",
      "Waxing",
    ],
    startingPrice: "₹899",
    icon: <Sparkle size={20} />,
  },
  {
    id: "nails",
    title: "Nails",
    subtitle: "Extensions, polish, nail art, manicure and pedicure",
    highlights: [
      "Nail Extensions",
      "Gel Polish & Nail Art",
      "Manicure & Pedicure",
    ],
    startingPrice: "₹499",
    icon: <Heart size={20} />,
  },
];

export default function Services() {
  return (
    <section className="home-services-section" id="services">
      <div className="home-services-container">
        {/* Header */}
        <div className="home-services-header">
          <span className="services-pill-tag">
            <Sparkles size={13} /> OUR SERVICES
          </span>

          <h2 className="home-services-title">
            Signature Services & <span>Endless Artistry.</span>
          </h2>

          <p className="home-services-subtitle">
            Hair, skin and nail services curated for you in BTM Layout.
          </p>
        </div>

        {/* Service category cards */}
        <div className="home-services-grid">
          {categoryPreviews.map((cat) => (
            <Link
              to={`/services?category=${cat.id}`}
              className="home-service-card"
              key={cat.id}
            >
              <div className="card-top-row">
                <div className="service-icon-box">{cat.icon}</div>
                <span className="service-arrow-circle">
                  <ArrowUpRight size={16} />
                </span>
              </div>

              <div className="card-body">
                <h3>{cat.title}</h3>
                <p className="card-desc">{cat.subtitle}</p>

                <ul className="card-highlights">
                  {cat.highlights.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="card-footer">
                <span className="starting-label">
                  Starts from <strong>{cat.startingPrice}</strong>
                </span>
                <span className="explore-text">Explore Menu</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Main CTA Button */}
        <div className="home-services-cta">
          <Link to="/services" className="btn-explore-all-services">
            <span>Explore Full Service Menu</span>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}