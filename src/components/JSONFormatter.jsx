
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  WandSparkles,
  Minimize2,
  Trash2,
} from "lucide-react";
import "./JSONFormatter.css";

export default function JSONFormatter({ onBack }) {
  const [input, setInput] = useState(
    '{\n  "name": "NeoTools",\n  "active": true,\n  "tools": 12\n}'
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function formatJSON() {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
      setCopied(false);
    } catch (err) {
      setOutput("");
      setError(`Invalid JSON: ${err.message}`);
    }
  }

  function minifyJSON() {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
      setCopied(false);
    } catch (err) {
      setOutput("");
      setError(`Invalid JSON: ${err.message}`);
    }
  }

  async function copyOutput() {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      setError("Copy failed. Please copy the output manually.");
    }
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
  }

  return (
    <section className="json-page">
      <button className="json-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to tools
      </button>

      <div className="json-heading">
        <div className="json-icon">
          <WandSparkles size={27} />
        </div>
        <h1>JSON Formatter</h1>
        <p>Format, validate and minify your JSON data.</p>
      </div>

      <div className="json-workspace">
        <div className="json-panel">
          <div className="json-panel-header">
            <span>Input JSON</span>
            <button onClick={clearAll} title="Clear all">
              <Trash2 size={16} /> Clear
            </button>
          </div>

          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
            }}
            placeholder='Paste JSON here, e.g. {"name":"NeoTools"}'
            spellCheck={false}
          />

          <div className="json-actions">
            <button onClick={formatJSON}>
              <WandSparkles size={17} /> Format JSON
            </button>
            <button onClick={minifyJSON} className="json-secondary">
              <Minimize2 size={17} /> Minify
            </button>
          </div>
        </div>

        <div className="json-panel">
          <div className="json-panel-header">
            <span>Output</span>
            <button onClick={copyOutput} disabled={!output}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <textarea
            value={output}
            readOnly
            placeholder="Your formatted JSON will appear here..."
            spellCheck={false}
          />

          {error && <p className="json-error">{error}</p>}
          {!error && output && (
            <p className="json-success">Valid JSON ✓</p>
          )}
        </div>
      </div>
    </section>
  );
}
