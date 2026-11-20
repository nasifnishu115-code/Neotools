import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sliders,
  CheckCircle2,
  Check,
  FileType
} from 'lucide-react';
import {
  formatBytes,
  getBaseFileName,
  downloadBlob,
  loadImage
} from './imageUtils';

export default function ImageConverter() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [targetFormat, setTargetFormat] = useState('image/png'); // 'image/png', 'image/jpeg', 'image/webp'
  const [quality, setQuality] = useState(92);
  const [jpegBgColor, setJpegBgColor] = useState('#ffffff');
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const prevConvertedUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (prevConvertedUrlRef.current) URL.revokeObjectURL(prevConvertedUrlRef.current);
    };
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPEG, WebP, SVG, BMP, etc.).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);

    setError('');
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setConvertedBlob(null);
    setConvertedUrl('');

    // Preselect a target format different from current
    if (selectedFile.type === 'image/png') {
      setTargetFormat('image/webp');
    } else if (selectedFile.type === 'image/jpeg') {
      setTargetFormat('image/png');
    } else {
      setTargetFormat('image/png');
    }

    loadImage(url)
      .then((img) => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      })
      .catch(() => {
        setError('Failed to load image. The file might be corrupted.');
      });
  };

  const convert = useCallback(async () => {
    if (!file || !originalUrl) return;

    setIsConverting(true);
    setError('');

    try {
      const img = await loadImage(originalUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = jpegBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);

      const q = (targetFormat === 'image/jpeg' || targetFormat === 'image/webp')
        ? quality / 100
        : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Conversion failed. Please try again.');
            setIsConverting(false);
            return;
          }

          if (prevConvertedUrlRef.current) URL.revokeObjectURL(prevConvertedUrlRef.current);
          const newUrl = URL.createObjectURL(blob);
          prevConvertedUrlRef.current = newUrl;
          setConvertedBlob(blob);
          setConvertedUrl(newUrl);
          setIsConverting(false);
        },
        targetFormat,
        q
      );
    } catch {
      setError('An error occurred during conversion.');
      setIsConverting(false);
    }
  }, [file, originalUrl, targetFormat, quality, jpegBgColor]);

  useEffect(() => {
    if (file && originalUrl) {
      const timer = setTimeout(() => {
        convert();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [file, originalUrl, targetFormat, quality, jpegBgColor, convert]);

  const handleDownload = () => {
    if (!convertedBlob || !file) return;

    let extension = 'png';
    if (targetFormat === 'image/jpeg') extension = 'jpg';
    else if (targetFormat === 'image/webp') extension = 'webp';
    else if (targetFormat === 'image/png') extension = 'png';

    const baseName = getBaseFileName(file.name);
    downloadBlob(convertedBlob, `${baseName}-converted.${extension}`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setFile(null);
    setOriginalUrl('');
    setConvertedBlob(null);
    setConvertedUrl('');
    setError('');
  };

  const getFormatLabel = (mime) => {
    if (mime === 'image/png') return 'PNG';
    if (mime === 'image/jpeg') return 'JPEG';
    if (mime === 'image/webp') return 'WebP';
    if (mime === 'image/svg+xml') return 'SVG';
    if (mime === 'image/gif') return 'GIF';
    if (mime === 'image/bmp') return 'BMP';
    return mime ? mime.replace('image/', '').toUpperCase() : 'Unknown';
  };

  return (
    <div className="tool-content">
      {error && (
        <div className="tool-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden-input"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <div className="upload-icon-wrapper">
            <Upload size={32} />
          </div>
          <h3>Upload an image to convert</h3>
          <p>Drag and drop your file here, or click to browse</p>
          <span className="upload-meta">Supports PNG, JPEG, WebP, SVG, BMP, GIF, AVIF</span>
        </div>
      ) : (
        <div className="tool-grid">
          <div className="controls-card">
            <div className="controls-header">
              <span className="controls-title">
                <Sliders size={18} /> Format & Options
              </span>
              <button className="icon-btn-ghost" onClick={handleReset} title="Clear">
                <Trash2 size={16} /> Clear
              </button>
            </div>

            <div className="setting-group">
              <label>Target Format</label>
              <div className="chip-group grid-chips">
                {[
                  { id: 'image/png', label: 'PNG (.png)', desc: 'Lossless, supports transparency' },
                  { id: 'image/jpeg', label: 'JPEG (.jpg)', desc: 'High compatibility, compact' },
                  { id: 'image/webp', label: 'WebP (.webp)', desc: 'Modern web standard, small size' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`format-card-chip ${targetFormat === item.id ? 'active' : ''}`}
                    onClick={() => setTargetFormat(item.id)}
                  >
                    <div className="format-chip-header">
                      <FileType size={16} />
                      <strong>{item.label}</strong>
                    </div>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
              <div className="setting-group">
                <div className="setting-label-row">
                  <label htmlFor="convert-quality">Quality: {quality}%</label>
                  <span className="badge-pill">{quality}%</span>
                </div>
                <input
                  id="convert-quality"
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="custom-range"
                />
              </div>
            )}

            {targetFormat === 'image/jpeg' && (
              <div className="setting-group">
                <label htmlFor="bg-color-picker">Background Fill Color (for transparent areas)</label>
                <div className="color-picker-row">
                  <input
                    id="bg-color-picker"
                    type="color"
                    value={jpegBgColor}
                    onChange={(e) => setJpegBgColor(e.target.value)}
                    className="custom-color-input"
                  />
                  <span className="color-hex-tag">{jpegBgColor}</span>
                  <button
                    type="button"
                    className="choice-chip"
                    onClick={() => setJpegBgColor('#ffffff')}
                  >
                    White
                  </button>
                  <button
                    type="button"
                    className="choice-chip"
                    onClick={() => setJpegBgColor('#000000')}
                  >
                    Black
                  </button>
                </div>
              </div>
            )}

            <div className="stats-box">
              <div className="stats-row">
                <span className="stat-label">Source Format:</span>
                <span className="stat-val">{getFormatLabel(file.type)} ({formatBytes(file.size)})</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Target Format:</span>
                <span className="stat-val highlight">{getFormatLabel(targetFormat)}</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Converted Size:</span>
                <span className="stat-val highlight">{convertedBlob ? formatBytes(convertedBlob.size) : 'Converting...'}</span>
              </div>
            </div>

            <button
              className="action-btn-primary"
              onClick={handleDownload}
              disabled={!convertedBlob || isConverting}
            >
              {downloaded ? (
                <>
                  <Check size={18} />
                  <span>Downloaded!</span>
                </>
              ) : isConverting ? (
                <>
                  <RefreshCw className="spin-icon" size={18} />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download {getFormatLabel(targetFormat)}</span>
                </>
              )}
            </button>
          </div>

          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-title">
                <RefreshCw size={18} /> Converted Preview
              </span>
              <span className="file-name-tag">{getFormatLabel(targetFormat)}</span>
            </div>

            <div className="single-preview-container">
              <div className="image-frame centered">
                {convertedUrl ? (
                  <img src={convertedUrl} alt="Converted preview" />
                ) : (
                  <div className="loading-placeholder">Processing conversion...</div>
                )}
              </div>
            </div>

            <div className="preview-meta-footer">
              <CheckCircle2 size={16} className="text-accent" />
              <span>
                {originalDimensions.width} × {originalDimensions.height} px • Converted to {getFormatLabel(targetFormat)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
