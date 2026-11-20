import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ArrowRightLeft,
  Copy,
  Check,
  Scale,
  Ruler,
  Thermometer,
  Layers,
  FlaskConical,
  Clock,
  HardDrive
} from 'lucide-react';
import './UnitConverter.css';

const CATEGORIES = [
  {
    id: 'length',
    label: 'Length',
    icon: Ruler,
    units: [
      { id: 'm', label: 'Meters (m)', factor: 1 },
      { id: 'km', label: 'Kilometers (km)', factor: 1000 },
      { id: 'cm', label: 'Centimeters (cm)', factor: 0.01 },
      { id: 'mm', label: 'Millimeters (mm)', factor: 0.001 },
      { id: 'mi', label: 'Miles (mi)', factor: 1609.344 },
      { id: 'yd', label: 'Yards (yd)', factor: 0.9144 },
      { id: 'ft', label: 'Feet (ft)', factor: 0.3048 },
      { id: 'in', label: 'Inches (in)', factor: 0.0254 }
    ]
  },
  {
    id: 'weight',
    label: 'Weight & Mass',
    icon: Scale,
    units: [
      { id: 'kg', label: 'Kilograms (kg)', factor: 1 },
      { id: 'g', label: 'Grams (g)', factor: 0.001 },
      { id: 'mg', label: 'Milligrams (mg)', factor: 0.000001 },
      { id: 'lb', label: 'Pounds (lb)', factor: 0.45359237 },
      { id: 'oz', label: 'Ounces (oz)', factor: 0.028349523125 },
      { id: 't', label: 'Metric Tons (t)', factor: 1000 }
    ]
  },
  {
    id: 'temperature',
    label: 'Temperature',
    icon: Thermometer,
    units: [
      { id: 'c', label: 'Celsius (°C)' },
      { id: 'f', label: 'Fahrenheit (°F)' },
      { id: 'k', label: 'Kelvin (K)' }
    ]
  },
  {
    id: 'area',
    label: 'Area',
    icon: Layers,
    units: [
      { id: 'sq_m', label: 'Square Meters (m²)', factor: 1 },
      { id: 'sq_km', label: 'Square Kilometers (km²)', factor: 1000000 },
      { id: 'sq_ft', label: 'Square Feet (ft²)', factor: 0.092903 },
      { id: 'acre', label: 'Acres (ac)', factor: 4046.856422 },
      { id: 'ha', label: 'Hectares (ha)', factor: 10000 }
    ]
  },
  {
    id: 'volume',
    label: 'Volume',
    icon: FlaskConical,
    units: [
      { id: 'l', label: 'Liters (L)', factor: 1 },
      { id: 'ml', label: 'Milliliters (mL)', factor: 0.001 },
      { id: 'gal', label: 'US Gallons (gal)', factor: 3.78541 },
      { id: 'qt', label: 'US Quarts (qt)', factor: 0.946353 },
      { id: 'pt', label: 'US Pints (pt)', factor: 0.473176 },
      { id: 'cup', label: 'US Cups', factor: 0.236588 },
      { id: 'cum', label: 'Cubic Meters (m³)', factor: 1000 }
    ]
  },
  {
    id: 'time',
    label: 'Time',
    icon: Clock,
    units: [
      { id: 's', label: 'Seconds (s)', factor: 1 },
      { id: 'min', label: 'Minutes (min)', factor: 60 },
      { id: 'h', label: 'Hours (h)', factor: 3600 },
      { id: 'd', label: 'Days (d)', factor: 86400 },
      { id: 'wk', label: 'Weeks (wk)', factor: 604800 },
      { id: 'yr', label: 'Years (365d)', factor: 31536000 }
    ]
  },
  {
    id: 'digital',
    label: 'Digital Data',
    icon: HardDrive,
    units: [
      { id: 'b', label: 'Bytes (B)', factor: 1 },
      { id: 'kb', label: 'Kilobytes (KB)', factor: 1024 },
      { id: 'mb', label: 'Megabytes (MB)', factor: 1048576 },
      { id: 'gb', label: 'Gigabytes (GB)', factor: 1073741824 },
      { id: 'tb', label: 'Terabytes (TB)', factor: 1099511627776 }
    ]
  }
];

function convertTemperature(value, from, to) {
  if (isNaN(value)) return 0;
  if (from === to) return value;

  // Convert from -> Celsius
  let inCelsius = value;
  if (from === 'f') inCelsius = (value - 32) * (5 / 9);
  else if (from === 'k') inCelsius = value - 273.15;

  // Convert Celsius -> to
  if (to === 'c') return inCelsius;
  if (to === 'f') return inCelsius * (9 / 5) + 32;
  if (to === 'k') return inCelsius + 273.15;

  return inCelsius;
}

export default function UnitConverter({ onBack }) {
  const [categoryId, setCategoryId] = useState('length');
  const [inputValue, setInputValue] = useState('100');
  const [fromUnitId, setFromUnitId] = useState('m');
  const [toUnitId, setToUnitId] = useState('ft');
  const [copied, setCopied] = useState(false);

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  }, [categoryId]);

  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat && cat.units.length >= 2) {
      setFromUnitId(cat.units[0].id);
      setToUnitId(cat.units[1].id);
    }
  };

  const handleSwap = () => {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  };

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return '—';

    if (categoryId === 'temperature') {
      const res = convertTemperature(val, fromUnitId, toUnitId);
      return Number(res.toFixed(4)).toString();
    }

    const fromUnit = activeCategory.units.find((u) => u.id === fromUnitId);
    const toUnit = activeCategory.units.find((u) => u.id === toUnitId);

    if (!fromUnit || !toUnit || !fromUnit.factor || !toUnit.factor) return '0';

    // Base value in reference unit
    const baseVal = val * fromUnit.factor;
    const converted = baseVal / toUnit.factor;

    // Clean formatting
    if (Math.abs(converted) < 0.000001 && converted !== 0) {
      return converted.toExponential(4);
    }
    return Number(converted.toFixed(6)).toString();
  }, [inputValue, categoryId, fromUnitId, toUnitId, activeCategory]);

  const copyResult = async () => {
    if (result === '—') return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const fromUnitObj = activeCategory.units.find((u) => u.id === fromUnitId);
  const toUnitObj = activeCategory.units.find((u) => u.id === toUnitId);

  return (
    <section className="converter-page">
      <div className="converter-container">
        <button className="converter-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="converter-header">
          <div className="converter-icon-wrapper">
            <RefreshCw size={28} />
          </div>
          <h1>Unit <span className="gradient-text">Converter.</span></h1>
          <p>Instant precision conversions across lengths, weights, temperatures, and more.</p>
        </header>

        {/* Category Pills */}
        <nav className="converter-category-nav" aria-label="Conversion categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`converter-cat-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Converter Card */}
        <div className="converter-card">
          <div className="converter-grid">
            {/* From Box */}
            <div className="converter-box">
              <label htmlFor="from-input">From</label>
              <div className="converter-input-wrap">
                <input
                  id="from-input"
                  type="number"
                  step="any"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter value"
                  className="converter-num-input"
                />
              </div>
              <select
                className="converter-select"
                value={fromUnitId}
                onChange={(e) => setFromUnitId(e.target.value)}
                aria-label="Source unit"
              >
                {activeCategory.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="converter-swap-wrap">
              <button
                type="button"
                className="converter-swap-btn"
                onClick={handleSwap}
                title="Swap units"
                aria-label="Swap units"
              >
                <ArrowRightLeft size={18} />
              </button>
            </div>

            {/* To Box */}
            <div className="converter-box">
              <label htmlFor="to-output">To (Result)</label>
              <div className="converter-input-wrap result-wrap">
                <input
                  id="to-output"
                  type="text"
                  readOnly
                  value={result}
                  className="converter-num-input result"
                  aria-label="Converted result"
                />
                <button
                  type="button"
                  className="converter-copy-inline"
                  onClick={copyResult}
                  disabled={result === '—'}
                  title="Copy result"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <select
                className="converter-select"
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
                aria-label="Target unit"
              >
                {activeCategory.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="converter-summary-footer">
            <span className="summary-formula">
              <strong>{inputValue || 0}</strong> {fromUnitObj?.label} ={' '}
              <strong className="summary-result">{result}</strong> {toUnitObj?.label}
            </span>
            {copied && <span className="copy-toast">Result copied to clipboard! ✓</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

