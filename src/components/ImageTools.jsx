import { useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Minimize2,
  Scaling,
  RefreshCw,
  Crop,
  ShieldCheck,
  Zap
} from 'lucide-react';
import ImageCompressor from './image-tools/ImageCompressor';
import ImageResizer from './image-tools/ImageResizer';
import ImageConverter from './image-tools/ImageConverter';
import ImageCropper from './image-tools/ImageCropper';
import './ImageTools.css';

const TABS = [
  { id: 'compressor', label: 'Image Compressor', icon: Minimize2, desc: 'Reduce file size while preserving quality' },
  { id: 'resizer', label: 'Image Resizer', icon: Scaling, desc: 'Scale dimensions and change resolutions' },
  { id: 'converter', label: 'Image Converter', icon: RefreshCw, desc: 'Convert between PNG, JPEG, and WebP' },
  { id: 'cropper', label: 'Image Cropper', icon: Crop, desc: 'Crop, rotate, and frame your photos' }
];

export default function ImageTools({ onBack }) {
  const [activeTab, setActiveTab] = useState('compressor');

  return (
    <section className="image-tools-page">
      <div className="image-tools-container">
        <button className="image-tools-back" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="image-tools-hero">
          <div className="image-tools-badge">
            <div className="image-tools-icon">
              <ImageIcon size={30} />
            </div>
            <div className="badge-tag">
              <Zap size={14} />
              <span>100% Client-Side Processing</span>
            </div>
          </div>

          <h1>
            Image <span className="gradient-text">Studio.</span>
          </h1>
          <p className="image-tools-subtitle">
            Compress, resize, convert, and crop images directly in your browser.
            Fast, zero latency, and private — your photos never leave your device.
          </p>

          <div className="privacy-pill">
            <ShieldCheck size={16} />
            <span>Local Browser Execution • No Server Uploads</span>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="image-tools-tabs" aria-label="Image tools switcher">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-button ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Tool View */}
        <main className="tab-render-area">
          {activeTab === 'compressor' && <ImageCompressor />}
          {activeTab === 'resizer' && <ImageResizer />}
          {activeTab === 'converter' && <ImageConverter />}
          {activeTab === 'cropper' && <ImageCropper />}
        </main>
      </div>
    </section>
  );
}

