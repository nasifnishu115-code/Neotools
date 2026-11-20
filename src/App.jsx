
import JSONFormatter from "./components/JSONFormatter";
import PasswordGenerator from "./components/PasswordGenerator";
import QRCodeGenerator from "./components/QRCodeGenerator";
import ImageTools from "./components/ImageTools";
import WordCounter from "./components/WordCounter";
import ColorPalette from "./components/ColorPalette";
import UnitConverter from "./components/UnitConverter";
import TextCaseConverter from "./components/TextCaseConverter";
import Timer from "./components/Timer";
import QuickNotes from "./components/QuickNotes";
import FavoritesManager from "./components/FavoritesManager";
import { useMemo, useState, useEffect } from "react";
import {
  Search, Sparkles, ArrowUpRight, QrCode, KeyRound,
  FileText, Palette, RefreshCw, Image,
  Type, Clock, Code2, Heart, Zap, Menu, X
} from "lucide-react";
import "./App.css";

const tools = [
  { name: "QR Code Generator", category: "Generator", desc: "Create QR codes from links and text.", icon: QrCode, color: "purple" },
  { name: "Password Generator", category: "Security", desc: "Generate strong, secure passwords.", icon: KeyRound, color: "pink" },
  { name: "Word Counter", category: "Text", desc: "Count words, characters and sentences.", icon: FileText, color: "blue" },
  { name: "Color Palette", category: "Design", desc: "Discover beautiful color combinations.", icon: Palette, color: "green" },
  { name: "Unit Converter", category: "Converter", desc: "Convert common units in seconds.", icon: RefreshCw, color: "cyan" },
  { name: "Image Tools", category: "Image", desc: "Explore handy image utilities.", icon: Image, color: "pink" },
  { name: "Text Case Converter", category: "Text", desc: "Transform text into different cases.", icon: Type, color: "orange" },
  { name: "Timer", category: "Productivity", desc: "Keep track of your time.", icon: Clock, color: "purple" },
  { name: "JSON Formatter", category: "Developer", desc: "Format and validate JSON data.", icon: Code2, color: "blue" },
  { name: "Quick Notes", category: "Productivity", desc: "A simple space for quick notes.", icon: FileText, color: "green" },
  { name: "Favorites", category: "Personal", desc: "Keep your favorite tools close.", icon: Heart, color: "pink" }
];

const categories = [
  "All Tools", "Generator", "Security", "Productivity",
  "Text", "Design", "Converter", "Developer", "Image", "Personal"
];

export default function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Tools");
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('neotools_favorites');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return ['QR Code Generator', 'Password Generator', 'Word Counter'];
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  useEffect(() => {
    // Load favorites from backend
    fetch('/api/favorites')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFavorites(res.data);
        }
      })
      .catch(() => {
        // Fallback to localStorage
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('neotools_favorites', JSON.stringify(favorites));
    } catch {
      // Storage error handled
    }
  }, [favorites]);

  const filteredTools = useMemo(() => tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.desc.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All Tools" || tool.category === category;

    return matchesSearch && matchesCategory;
  }), [search, category]);

  function toggleFavorite(name) {
    setFavorites((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name]
    );

    fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName: name })
    }).catch(() => {
      // Offline fallback
    });
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon"><Zap size={23} fill="currentColor" /></span>
          <span>neo<span className="brand-highlight">tools</span></span>
          <span className="brand-dot">.</span>
        </a>

        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          <a href="#tools" onClick={() => { setActiveTool(null); setMobileMenu(false); }}>Explore tools</a>
          <a href="#about" onClick={() => { setActiveTool(null); setMobileMenu(false); }}>About</a>
          <a href="#favorites" onClick={(e) => {
            e.preventDefault();
            setMobileMenu(false);
            setActiveTool("Favorites");
          }}>My workspace</a>
        </nav>

        <a href="#tools" className="nav-cta" onClick={() => setActiveTool(null)}>
          Get started <ArrowUpRight size={16} />
        </a>

        <button
          className="menu-button"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle menu"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </header>

    
    <main>
        {activeTool === "Password Generator" ? (
          <PasswordGenerator onBack={() => setActiveTool(null)} />
        ) : activeTool === "QR Code Generator" ? (
          <QRCodeGenerator onBack={() => setActiveTool(null)} />
        ) : activeTool === "JSON Formatter" ? (
          <JSONFormatter onBack={() => setActiveTool(null)} />
        ) : activeTool === "Image Tools" ? (
          <ImageTools onBack={() => setActiveTool(null)} />
        ) : activeTool === "Word Counter" ? (
          <WordCounter onBack={() => setActiveTool(null)} />
        ) : activeTool === "Color Palette" ? (
          <ColorPalette onBack={() => setActiveTool(null)} />
        ) : activeTool === "Unit Converter" ? (
          <UnitConverter onBack={() => setActiveTool(null)} />
        ) : activeTool === "Text Case Converter" ? (
          <TextCaseConverter onBack={() => setActiveTool(null)} />
        ) : activeTool === "Timer" ? (
          <Timer onBack={() => setActiveTool(null)} />
        ) : activeTool === "Quick Notes" ? (
          <QuickNotes onBack={() => setActiveTool(null)} />
        ) : activeTool === "Favorites" ? (
          <FavoritesManager
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectTool={(toolName) => setActiveTool(toolName)}
            onBack={() => setActiveTool(null)}
            allTools={tools}
          />
        ) : (
          <>

        <section className="hero">
          <div className="hero-pill">
            <Sparkles size={15} />
            <span>YOUR DIGITAL TOOLBOX, REIMAGINED</span>
          </div>

          <h1>
            Small tools.
            <br />
            <span className="gradient-text">Big possibilities.</span>
          </h1>

          <p className="hero-description">
            Everything you need to create, convert and get things done.
            One beautiful place. Zero unnecessary complexity.
          </p>

          <div className="hero-search">
            <Search size={21} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                document.getElementById("tools")?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest"
                });
              }}
              placeholder="What do you want to do today?"
              aria-label="Search tools"
            />
            <span className="search-shortcut">⌘ K</span>
          </div>

          <div className="hero-stats">
            <div><strong>12+</strong><span>Useful tools</span></div>
            <i />
            <div><strong>6+</strong><span>Categories</span></div>
            <i />
            <div><strong>One</strong><span>Simple workspace</span></div>
          </div>

          <div className="hero-decoration decoration-one"><Sparkles size={24} /></div>
          <div className="hero-decoration decoration-two"><Zap size={25} /></div>
        </section>

        <section className="tools-section" id="tools">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE COLLECTION</span>
              <h2>Tools that just <span className="gradient-text">click.</span></h2>
              <p>Less searching, more doing. Find your next favorite tool.</p>
            </div>
            <span className="tool-count">{filteredTools.length} tools found</span>
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={category === item ? "category-chip active" : "category-chip"}
              >
                {item}
              </button>
            ))}
          </div>

          {filteredTools.length > 0 ? (
            <div className="tools-grid">
              {filteredTools.map((tool, index) => {
                const Icon = tool.icon;
                const isFavorite = favorites.includes(tool.name);

                return (
                  <article
                    className="tool-card"
                    key={tool.name}
                    style={{ "--card-index": index }}
                  >
                    <div className="card-top">
                      <div className={`tool-icon ${tool.color}`}>
                        <Icon size={24} strokeWidth={1.8} />
                      </div>
                      <button
                        className={isFavorite ? "favorite-button favorited" : "favorite-button"}
                        onClick={() => toggleFavorite(tool.name)}
                        aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                      >
                        <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <span className="tool-category">{tool.category}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.desc}</p>

                    
                    <button
                      className="card-action"
                      onClick={() => setActiveTool(tool.name)}
                    >
                      Explore tool <ArrowUpRight size={17} />
                    </button>

                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={32} />
              <h3>No tools found</h3>
              <p>Try another search or choose a different category.</p>
              <button onClick={() => {
                setSearch("");
                setCategory("All Tools");
              }}>Clear filters</button>
            </div>
          )}
        </section>

        <section className="favorites-section" id="favorites">
          <div className="favorites-banner">
            <div className="favorites-symbol"><Heart size={25} /></div>
            <div>
              <h2>Your personal toolkit.</h2>
              <p>
                {favorites.length
                  ? `${favorites.length} favorite tool${favorites.length > 1 ? "s" : ""} saved in your workspace.`
                  : "Tap the heart on any tool card to build your own collection."}
              </p>
            </div>
            <button onClick={() => setActiveTool("Favorites")}>
              View workspace <ArrowUpRight size={17} />
            </button>
          </div>
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">MADE FOR YOUR FLOW</span>
          <h2>Good tools make life <span className="gradient-text">simpler.</span></h2>
          <p>
            NeoTools brings everyday utilities together in one clean,
            colorful workspace designed to help you focus on what matters.
          </p>
        </section>
              </>
            )}
    </main>

      <footer className="footer">
        <a href="#" className="brand footer-brand">
          <span className="brand-icon"><Zap size={19} fill="currentColor" /></span>
          <span>neo<span className="brand-highlight">tools</span></span>
          <span className="brand-dot">.</span>
        </a>
        <span>Made for curious minds ✦</span>
        <span>© 2026 NeoTools</span>
      </footer>
    </div>
  );
}
