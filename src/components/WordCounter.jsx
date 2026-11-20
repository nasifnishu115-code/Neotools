import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Copy,
  Check,
  Trash2,
  Clock,
  BookOpen,
  AlignLeft,
  Sparkles
} from 'lucide-react';
import './WordCounter.css';

export default function WordCounter({ onBack }) {
  const [text, setText] = useState(
    'NeoTools provides clean, modern digital tools designed to make everyday tasks effortless. Paste or type your content here to inspect real-time word counts, characters, sentence structures, and estimated reading speeds.'
  );
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        words: 0,
        characters: 0,
        charsNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
        speakingTimeMinutes: 0
      };
    }

    // Words
    const wordList = trimmed.match(/[\p{L}\p{N}'’_-]+/gu) || [];
    const words = wordList.length;

    // Characters
    const characters = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;

    // Sentences
    const sentenceList = trimmed.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0);
    const sentences = sentenceList.length || 1;

    // Paragraphs
    const paragraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length || 1;

    // Speeds: average reading ~200 wpm, speaking ~130 wpm
    const readingTimeMinutes = Math.ceil(words / 200);
    const speakingTimeMinutes = Math.ceil(words / 130);

    return {
      words,
      characters,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes
    };
  }, [text]);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setText('');
  };

  const handleSample = () => {
    setText(
      'The quick brown fox jumps over the lazy dog. Simplicity is the ultimate sophistication. When you focus on clarity and speed, great things happen naturally.'
    );
  };

  return (
    <section className="word-counter-page">
      <div className="word-counter-container">
        <button className="wc-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="wc-header">
          <div className="wc-icon-wrapper">
            <FileText size={28} />
          </div>
          <h1>Word <span className="gradient-text">Counter.</span></h1>
          <p>Real-time word, character, sentence, and paragraph analytics as you type.</p>
        </header>

        {/* Stats Grid */}
        <div className="wc-stats-grid">
          <div className="wc-stat-card primary">
            <span className="wc-stat-num">{stats.words.toLocaleString()}</span>
            <span className="wc-stat-label">Words</span>
          </div>

          <div className="wc-stat-card">
            <span className="wc-stat-num">{stats.characters.toLocaleString()}</span>
            <span className="wc-stat-label">Characters</span>
          </div>

          <div className="wc-stat-card">
            <span className="wc-stat-num">{stats.charsNoSpaces.toLocaleString()}</span>
            <span className="wc-stat-label">Chars (no spaces)</span>
          </div>

          <div className="wc-stat-card">
            <span className="wc-stat-num">{stats.sentences.toLocaleString()}</span>
            <span className="wc-stat-label">Sentences</span>
          </div>

          <div className="wc-stat-card">
            <span className="wc-stat-num">{stats.paragraphs.toLocaleString()}</span>
            <span className="wc-stat-label">Paragraphs</span>
          </div>

          <div className="wc-stat-card highlight">
            <div className="wc-read-meta">
              <span><BookOpen size={14} /> {stats.readingTimeMinutes} min read</span>
              <span><Clock size={14} /> {stats.speakingTimeMinutes} min speech</span>
            </div>
            <span className="wc-stat-label">Reading Speed</span>
          </div>
        </div>

        {/* Text Area Card */}
        <div className="wc-editor-card">
          <div className="wc-toolbar">
            <span className="wc-toolbar-title">
              <AlignLeft size={16} /> Text Input
            </span>
            <div className="wc-toolbar-actions">
              <button
                type="button"
                className="wc-tool-btn"
                onClick={handleSample}
                title="Insert sample text"
              >
                <Sparkles size={14} /> Sample
              </button>
              <button
                type="button"
                className="wc-tool-btn"
                onClick={handleCopy}
                disabled={!text}
                title="Copy text to clipboard"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                className="wc-tool-btn danger"
                onClick={handleClear}
                disabled={!text}
                title="Clear all text"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          <textarea
            className="wc-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={12}
            autoFocus
          />

          <div className="wc-footer-bar">
            <span>{stats.words} words • {stats.characters} characters</span>
            <span className="wc-live-indicator">● Live Analysis</span>
          </div>
        </div>
      </div>
    </section>
  );
}

