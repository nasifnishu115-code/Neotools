import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Palette,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Unlock,
  Sparkles,
  Sliders
} from 'lucide-react';
import './ColorPalette.css';

function getRandomHex(mode = 'random') {
  if (mode === 'pastel') {
    // High lightness, moderate saturation
    const r = Math.floor((Math.random() * 127) + 128);
    const g = Math.floor((Math.random() * 127) + 128);
    const b = Math.floor((Math.random() * 127) + 128);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  if (mode === 'neon') {
    // Very vibrant
    const hues = [
      '#FF0055', '#00FF66', '#00F0FF', '#FF00FF', '#FFE600',
      '#7928CA', '#FF4D4D', '#00E5FF', '#39FF14', '#FF073A'
    ];
    return hues[Math.floor(Math.random() * hues.length)];
  }

  if (mode === 'warm') {
    const r = Math.floor(Math.random() * 80 + 175);
    const g = Math.floor(Math.random() * 120 + 60);
    const b = Math.floor(Math.random() * 60 + 20);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  if (mode === 'cool') {
    const r = Math.floor(Math.random() * 60 + 20);
    const g = Math.floor(Math.random() * 120 + 80);
    const b = Math.floor(Math.random() * 80 + 175);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  // Pure random
  const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return `#${hex.toUpperCase()}`;
}

// Check luminance to choose white or black text
function getContrastColor(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#110c1c' : '#ffffff';
}

export default function ColorPalette({ onBack }) {
  const [mode, setMode] = useState('random');
  const [colors, setColors] = useState([
    { hex: '#8749E8', locked: false },
    { hex: '#EC4899', locked: false },
    { hex: '#3B82F6', locked: false },
    { hex: '#10B981', locked: false },
    { hex: '#F59E0B', locked: false }
  ]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generatePalette = useCallback(() => {
    setColors((prev) =>
      prev.map((item) =>
        item.locked ? item : { ...item, hex: getRandomHex(mode) }
      )
    );
  }, [mode]);

  // Spacebar to generate new palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        generatePalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generatePalette]);

  const toggleLock = (index) => {
    setColors((prev) =>
      prev.map((item, i) => (i === index ? { ...item, locked: !item.locked } : item))
    );
  };

  const regenerateSingle = (index) => {
    setColors((prev) =>
      prev.map((item, i) => (i === index ? { ...item, hex: getRandomHex(mode) } : item))
    );
  };

  const copyHex = async (hex, index) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      // Fallback
    }
  };

  const copyAll = async () => {
    const list = colors.map((c) => c.hex).join(', ');
    try {
      await navigator.clipboard.writeText(list);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section className="palette-page">
      <div className="palette-container">
        <button className="palette-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="palette-header">
          <div className="palette-icon-wrapper">
            <Palette size={28} />
          </div>
          <h1>Color <span className="gradient-text">Palette.</span></h1>
          <p>Generate beautiful color schemes. Lock your favorites, copy HEX codes, or press Space.</p>
        </header>

        {/* Action Controls */}
        <div className="palette-controls">
          <div className="palette-modes">
            <span className="mode-label"><Sliders size={14} /> Mood:</span>
            {[
              { id: 'random', label: 'Surprise' },
              { id: 'pastel', label: 'Pastel' },
              { id: 'neon', label: 'Vibrant Neon' },
              { id: 'warm', label: 'Warm Sunset' },
              { id: 'cool', label: 'Cool Ocean' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`palette-mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="palette-main-btns">
            <button
              type="button"
              className="palette-generate-btn"
              onClick={generatePalette}
            >
              <RefreshCw size={17} /> Generate (Space)
            </button>
            <button
              type="button"
              className="palette-copy-all-btn"
              onClick={copyAll}
            >
              {copiedAll ? <Check size={16} /> : <Copy size={16} />}
              {copiedAll ? 'All Copied!' : 'Copy All HEX'}
            </button>
          </div>
        </div>

        {/* Color Bars Container */}
        <div className="palette-bars-grid">
          {colors.map((color, index) => {
            const contrast = getContrastColor(color.hex);
            const isCopied = copiedIndex === index;

            return (
              <div
                key={index}
                className="palette-swatch"
                style={{ backgroundColor: color.hex }}
              >
                <div className="swatch-controls" style={{ color: contrast }}>
                  <button
                    type="button"
                    className="swatch-btn"
                    onClick={() => toggleLock(index)}
                    title={color.locked ? 'Unlock color' : 'Lock color to keep during regenerate'}
                    style={{ color: contrast, borderColor: `${contrast}30`, backgroundColor: `${contrast}15` }}
                  >
                    {color.locked ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button
                    type="button"
                    className="swatch-btn"
                    onClick={() => regenerateSingle(index)}
                    title="Regenerate only this color"
                    style={{ color: contrast, borderColor: `${contrast}30`, backgroundColor: `${contrast}15` }}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div className="swatch-info" style={{ color: contrast }}>
                  <button
                    type="button"
                    className="swatch-hex-pill"
                    onClick={() => copyHex(color.hex, index)}
                    title="Click to copy HEX code"
                    style={{ color: contrast, borderColor: `${contrast}40`, backgroundColor: `${contrast}18` }}
                  >
                    {isCopied ? <Check size={15} /> : <Copy size={15} />}
                    <span>{color.hex}</span>
                  </button>
                  <span className="swatch-copy-hint" style={{ opacity: 0.8 }}>
                    {isCopied ? 'Copied to clipboard!' : 'Click to copy'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="palette-footer-hint">
          <Sparkles size={16} />
          <span>Tip: Tap the lock icon on individual swatches to freeze them while re-rolling the rest.</span>
        </div>
      </div>
    </section>
  );
}

