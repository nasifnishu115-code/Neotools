import { useState } from 'react';
import {
  ArrowLeft,
  Type,
  Copy,
  Check,
  Trash2,
  Sparkles
} from 'lucide-react';
import './TextCaseConverter.css';

// Case conversion helpers
function toUpperCase(text) {
  return text.toUpperCase();
}

function toLowerCase(text) {
  return text.toLowerCase();
}

function toSentenceCase(text) {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

function toCamelCase(text) {
  const words = text
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .trim()
    .split(/[\s_-]+/);

  if (words.length === 0 || !words[0]) return '';
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
  );
}

function toPascalCase(text) {
  return text
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .trim()
    .split(/[\s_-]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join('');
}

function toSnakeCase(text) {
  return text
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .trim()
    .split(/[\s_-]+/)
    .map((w) => w.toLowerCase())
    .join('_');
}

function toKebabCase(text) {
  return text
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .trim()
    .split(/[\s_-]+/)
    .map((w) => w.toLowerCase())
    .join('-');
}

const CASES = [
  { id: 'upper', label: 'UPPERCASE', fn: toUpperCase, desc: 'ALL CAPITAL LETTERS' },
  { id: 'lower', label: 'lowercase', fn: toLowerCase, desc: 'all small letters' },
  { id: 'title', label: 'Title Case', fn: toTitleCase, desc: 'First Letter Of Each Word Capitalized' },
  { id: 'sentence', label: 'Sentence case', fn: toSentenceCase, desc: 'First letter of each sentence capitalized' },
  { id: 'camel', label: 'camelCase', fn: toCamelCase, desc: 'firstWordLowerRestCapitalized' },
  { id: 'pascal', label: 'PascalCase', fn: toPascalCase, desc: 'EveryWordCapitalized' },
  { id: 'snake', label: 'snake_case', fn: toSnakeCase, desc: 'words_separated_by_underscores' },
  { id: 'kebab', label: 'kebab-case', fn: toKebabCase, desc: 'words-separated-by-hyphens' }
];

export default function TextCaseConverter({ onBack }) {
  const [inputText, setInputText] = useState('Transform your text instantly with NeoTools.');
  const [copiedId, setCopiedId] = useState(null);

  const copyCaseOutput = async (id, textToCopy) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
    }
  };

  const applyTransformationDirectly = (fn) => {
    setInputText(fn(inputText));
  };

  const handleClear = () => {
    setInputText('');
  };

  return (
    <section className="case-page">
      <div className="case-container">
        <button className="case-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="case-header">
          <div className="case-icon-wrapper">
            <Type size={28} />
          </div>
          <h1>Text Case <span className="gradient-text">Converter.</span></h1>
          <p>Instantly transform text between uppercase, title case, camelCase, kebab, and more.</p>
        </header>

        {/* Input Text Box */}
        <div className="case-input-card">
          <div className="case-card-header">
            <span className="case-card-title">
              <Type size={16} /> Source Text
            </span>
            <div className="case-header-actions">
              <button
                type="button"
                className="case-action-chip danger"
                onClick={handleClear}
                disabled={!inputText}
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          <textarea
            className="case-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your text to convert..."
            rows={4}
            autoFocus
          />

          <div className="case-quick-bar">
            <span className="quick-bar-label">
              <Sparkles size={14} /> Quick Apply to Input:
            </span>
            <div className="quick-chips">
              {CASES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="quick-chip"
                  onClick={() => applyTransformationDirectly(c.fn)}
                  disabled={!inputText}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Cases Grid */}
        <div className="case-results-grid">
          {CASES.map((item) => {
            const converted = inputText ? item.fn(inputText) : '';
            const isCopied = copiedId === item.id;

            return (
              <div key={item.id} className="case-result-card">
                <div className="case-result-header">
                  <div>
                    <strong>{item.label}</strong>
                    <span className="case-desc">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    className="case-copy-btn"
                    onClick={() => copyCaseOutput(item.id, converted)}
                    disabled={!converted}
                    title={`Copy ${item.label}`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="case-result-content">
                  {converted || <span className="empty-placeholder">Output will appear here...</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

