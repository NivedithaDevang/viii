import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Sparkles, ArrowUpRight } from "lucide-react";
import { api } from "../../api";
import { catalogServiceOptions } from "../../utils/servicesData";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import { OffersBanner } from "../../components/Services/OffersBanner";
import "./ServicesPage.css";

export interface ServiceItem {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  startingPrice?: string;
  duration?: string;
  description?: string;
}

const CATEGORIES = ["All", "Hair", "Skin", "Nails"];

const CATEGORY_QUERY_MAP: Record<string, string> = {
  hair: "Hair",
  skin: "Skin",
  nails: "Nails",
};

const CATEGORY_TAGLINES: Record<string, string> = {
  "Haircuts & Styling": "Cuts and styling tailored to your look.",
  "Hair Colour": "Colour services for a fresh, expressive look.",
  "Texture Treatments": "Smoothing and texture services for your hair.",
  "Hair Care": "Restorative care for healthy-looking hair.",
  "Facials & Skin Care": "Skin care and facial services for every need.",
  Waxing: "Regular and Rica waxing services.",
  "Nail Services": "Nail extensions, polish, art, manicure and pedicure.",
};

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const paramCategory = searchParams.get("category")?.toLowerCase() || "";
  const [activeCategory, setActiveCategory] = useState(
    CATEGORY_QUERY_MAP[paramCategory] || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const mapped = CATEGORY_QUERY_MAP[paramCategory];
    if (mapped) setActiveCategory(mapped);
  }, [paramCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!Array.isArray(list)) throw new Error("Invalid service list.");
      setServices(list);
      setNotice("");
    } catch (err: any) {
      setServices(catalogServiceOptions);
      const message = err.response?.data?.message || "Showing our curated salon menu.";
      setNotice(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const menuServices = useMemo(
    () =>
      catalogServiceOptions.map((item) => {
        const liveService = services.find(
          (service) => service.name.trim().toLowerCase() === item.name.toLowerCase()
        );
        return {
          ...item,
          id: liveService?.id ?? item.id,
          description: liveService?.description,
        };
      }),
    [services]
  );

  const visibleServices = useMemo(
    () =>
      menuServices.filter((service) => {
        const matchesCategory =
          activeCategory === "All" ||
          service.category.toLowerCase() === activeCategory.toLowerCase();
        const matchesSearch =
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [menuServices, activeCategory, searchQuery]
  );

  const visibleServiceGroups = useMemo(
    () =>
      visibleServices.reduce<
        Record<string, { items: ServiceItem[]; startingPrice?: string }>
      >((acc, item) => {
        const group = item.subcategory || "Signature Rituals";
        if (!acc[group]) {
          acc[group] = { items: [], startingPrice: item.startingPrice };
        }
        acc[group].items.push(item);
        return acc;
      }, {}),
    [visibleServices]
  );

  const handleReserveService = (service: ServiceItem) => {
    navigate(`/booking?service=${encodeURIComponent(String(service.id))}`);
  };

  return (
    <div>
      <Header />
      <section className="sp-wrapper">
      <OffersBanner />
      {/* Ambient Top Glow */}
      <div className="sp-ambient-glow" />

      <div className="sp-container">
        {/* Hero Header */}
        <header className="sp-hero">
          <div className="sp-badge">
            <Sparkles size={13} />
            <span>CURATED ATELIER MENU</span>
          </div>

          <h1 className="sp-title">
            Signature Services & <span>Rituals</span>
          </h1>

          <p className="sp-subtitle">
            Hair, skin and nail services tailored for you at BTM Layout 2nd Stage.
          </p>

        </header>

        {/* Sticky Frosted Filter & Search Bar */}
        <div className="sp-controls-dock">
          <div className="sp-tabs" role="tablist">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`sp-tab ${isActive ? "is-active" : ""}`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="sp-search-box">
            <Search size={15} className="sp-search-icon" />
            <input
              type="text"
              placeholder="Search rituals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="sp-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {notice && <div className="sp-notice">{notice}</div>}

        {/* Menu Content */}
        {loading ? (
          <div className="sp-empty-state">
            <div className="sp-spinner" />
            <p>Curating Salon Menu...</p>
          </div>
        ) : Object.keys(visibleServiceGroups).length === 0 ? (
          <div className="sp-empty-state">
            <p>No treatments match “{searchQuery}”.</p>
            <button
              className="sp-btn-ghost"
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="sp-sections">
            {Object.entries(visibleServiceGroups).map(([categoryName, group], sectionIdx) => (
              <div key={categoryName} className="sp-category-section">
                {/* Editorial Section Banner */}
                <div className="sp-category-header">
                  <div className="sp-category-title-row">
                    <span className="sp-roman-num">
                      0{sectionIdx + 1}
                    </span>
                    <div>
                      <h2>{categoryName}</h2>
                      {CATEGORY_TAGLINES[categoryName] && (
                        <p className="sp-category-tagline">
                          {CATEGORY_TAGLINES[categoryName]}
                        </p>
                      )}
                      {group.startingPrice && (
                        <p className="sp-starting-price">
                          Starting from {group.startingPrice} onwards
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="sp-count-pill">
                    {group.items.length} {group.items.length === 1 ? "Service" : "Services"}
                  </span>
                </div>

                {/* Luxury Menu Cards */}
                <div className="sp-cards-grid">
                  {group.items.map((service) => (
                    <article key={service.id} className="sp-card">
                      <div className="sp-card-main">
                        <h3 className="sp-card-name">{service.name}</h3>
                        {service.description && (
                          <p className="sp-card-desc">{service.description}</p>
                        )}
                      </div>

                      <div className="sp-card-right">
                        <button
                          type="button"
                          onClick={() => handleReserveService(service)}
                          className="sp-btn-reserve"
                        >
                          <span>Reserve</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="sp-price-disclaimer">
          Prices shown are starting prices and may vary depending on hair length, product usage
          and service requirements. The final price will be confirmed at the salon.
        </p>
        <p className="sp-price-disclaimer">
          <strong>Special combos available:</strong> Ask us about our latest packages and offers.
        </p>
      </div>

    </section>
    <Footer />
    </div>
  );
}