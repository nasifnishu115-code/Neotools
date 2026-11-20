
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import "./PasswordGenerator.css";

function createPassword(length, options) {
  const groups = [];

  if (options.uppercase) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (options.lowercase) groups.push("abcdefghijklmnopqrstuvwxyz");
  if (options.numbers) groups.push("0123456789");
  if (options.symbols) groups.push("!@#$%^&*()_+-=[]{}?");

  if (groups.length === 0) {
    throw new Error("Select at least one character type.");
  }

  const allCharacters = groups.join("");
  const passwordCharacters = [];

  // Include at least one character from each selected group.
  for (const group of groups) {
    passwordCharacters.push(
      group[randomIndex(group.length)]
    );
  }

  // Fill the remaining password length.
  while (passwordCharacters.length < length) {
    passwordCharacters.push(
      allCharacters[randomIndex(allCharacters.length)]
    );
  }

  // Securely shuffle the characters.
  for (let i = passwordCharacters.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [passwordCharacters[i], passwordCharacters[j]] =
      [passwordCharacters[j], passwordCharacters[i]];
  }

  return passwordCharacters.join("");
}

// Use browser cryptographic randomness without modulo bias.
function randomIndex(max) {
  const range = 0x100000000;
  const limit = range - (range % max);
  const value = new Uint32Array(1);

  do {
    window.crypto.getRandomValues(value);
  } while (value[0] >= limit);

  return value[0] % max;
}

export default function PasswordGenerator({ onBack }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [password, setPassword] = useState(() =>
    createPassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    })
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function toggleOption(name) {
    setOptions((previous) => ({
      ...previous,
      [name]: !previous[name]
    }));
    setCopied(false);
  }

  function generateNewPassword() {
    const selected = Object.values(options).some(Boolean);

    if (!selected) {
      setError("Choose at least one character type.");
      return;
    }

    setError("");

    try {
      setPassword(createPassword(length, options));
      setCopied(false);
    } catch {
      setError("Could not generate a password. Please try again.");
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setError("");
    } catch {
      setError(
        "Copy was blocked by your browser. Select the password and copy it manually."
      );
      setCopied(false);
    }
  }

  const strength =
    length >= 16 && Object.values(options).filter(Boolean).length >= 3
      ? "Strong"
      : length >= 12
        ? "Good"
        : "Fair";

  return (
    <section className="password-page">
      <button className="password-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to all tools
      </button>

      <div className="password-panel">
        <div className="password-heading-icon">
          <ShieldCheck size={29} />
        </div>

        <span className="password-eyebrow">NEOTOOLS SECURITY</span>
        <h2>Password <span>Generator</span></h2>
        <p className="password-intro">
          Create a random password for your next account.
          Generated locally in your browser.
        </p>

        <label className="password-label" htmlFor="generated-password">
          Your password
        </label>

        <div className="password-output">
          <input
            id="generated-password"
            type="text"
            value={password}
            readOnly
            spellCheck={false}
            autoComplete="off"
            aria-label="Generated password"
          />

          <button
            className="password-copy"
            onClick={copyPassword}
            aria-label="Copy password"
            title="Copy password"
          >
            {copied ? <Check size={19} /> : <Copy size={19} />}
          </button>
        </div>

        <div className="password-status">
          <span className={strength === "Strong" ? "strength strong" : "strength"}>
            <ShieldCheck size={15} />
            {strength}
          </span>
          <span>{length} characters</span>
        </div>

        <div className="password-length-heading">
          <label htmlFor="password-length">Password length</label>
          <strong>{length}</strong>
        </div>

        <input
          id="password-length"
          className="password-slider"
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(event) => {
            setLength(Number(event.target.value));
            setCopied(false);
          }}
        />

        <div className="password-range-labels">
          <span>8 characters</span>
          <span>64 characters</span>
        </div>

        <h3 className="password-options-title">Include characters</h3>

        <div className="password-options">
          {[
            ["uppercase", "Uppercase letters", "A–Z"],
            ["lowercase", "Lowercase letters", "a–z"],
            ["numbers", "Numbers", "0–9"],
            ["symbols", "Symbols", "!@#$%"]
          ].map(([name, label, sample]) => (
            <label className="password-option" key={name}>
              <input
                type="checkbox"
                checked={options[name]}
                onChange={() => toggleOption(name)}
              />
              <span className="custom-checkbox">
                {options[name] && <Check size={13} />}
              </span>
              <span className="password-option-name">{label}</span>
              <span className="password-sample">{sample}</span>
            </label>
          ))}
        </div>

        {error && <p className="password-error" role="alert">{error}</p>}

        <button
          className="password-generate"
          onClick={generateNewPassword}
        >
          <RefreshCw size={18} />
          Generate new password
        </button>

        <p className="password-privacy">
          <ShieldCheck size={14} />
          Passwords are generated locally and are not sent to our server.
        </p>
      </div>
    </section>
  );
}
