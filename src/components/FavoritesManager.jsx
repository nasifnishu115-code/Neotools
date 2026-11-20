import {
  ArrowLeft,
  Heart,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import './FavoritesManager.css';

export default function FavoritesManager({
  favorites,
  onToggleFavorite,
  onSelectTool,
  onBack,
  allTools
}) {
  // Filter out the Favorites tool itself from the list of favorites
  const favoriteTools = allTools.filter(
    (tool) => tool.name !== 'Favorites' && favorites.includes(tool.name)
  );

  return (
    <section className="favorites-page">
      <div className="favorites-container">
        <button className="fav-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="fav-header">
          <div className="fav-icon-wrapper">
            <Heart size={28} fill="currentColor" />
          </div>
          <h1>My <span className="gradient-text">Workspace.</span></h1>
          <p>
            Your hand-picked collection of favorite utilities. Saved locally in your browser for quick access anytime.
          </p>
        </header>

        {favoriteTools.length > 0 ? (
          <div>
            <div className="fav-count-banner">
              <span>
                <strong>{favoriteTools.length}</strong> tool{favoriteTools.length > 1 ? 's' : ''} saved in your personal workspace
              </span>
            </div>

            <div className="fav-tools-grid">
              {favoriteTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <article key={tool.name} className="fav-tool-card">
                    <div className="fav-card-top">
                      <div className={`fav-tool-icon ${tool.color}`}>
                        <Icon size={24} strokeWidth={1.8} />
                      </div>
                      <button
                        type="button"
                        className="fav-unheart-btn"
                        onClick={() => onToggleFavorite(tool.name)}
                        title="Remove from favorites"
                        aria-label={`Remove ${tool.name} from favorites`}
                      >
                        <Heart size={19} fill="currentColor" />
                      </button>
                    </div>

                    <span className="fav-category-tag">{tool.category}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.desc}</p>

                    <button
                      type="button"
                      className="fav-open-btn"
                      onClick={() => onSelectTool(tool.name)}
                    >
                      <span>Open tool</span>
                      <ArrowUpRight size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="fav-empty-state">
            <div className="fav-empty-icon">
              <Sparkles size={36} />
            </div>
            <h2>No favorites saved yet</h2>
            <p>
              Tap the <Heart size={15} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> heart icon on any tool card on the homepage to pin your most-used utilities here.
            </p>
            <button
              type="button"
              className="fav-explore-btn"
              onClick={onBack}
            >
              Explore Tools <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

