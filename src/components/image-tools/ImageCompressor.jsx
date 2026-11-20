import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  Sparkles,
  Layers,
  Trash2,
  Sliders,
  CheckCircle2,
  Check,
  RefreshCw
} from 'lucide-react';
import {
  formatBytes,
  getBaseFileName,
  downloadBlob,
  loadImage
} from './imageUtils';

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState('auto'); // 'auto', 'image/webp', 'image/jpeg', 'image/png'
  const [maxDimension, setMaxDimension] = useState('original'); // 'original', 2560, 1920, 1280
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState('');
  const [compressedDimensions, setCompressedDimensions] = useState({ width: 0, height: 0 });
  const [isCompressing, setIsCompressing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const prevCompressedUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (prevCompressedUrlRef.current) URL.revokeObjectURL(prevCompressedUrlRef.current);
    };
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, SVG, etc.).');
      return;
    }

    // Reset previous state
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);

    setError('');
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setCompressedBlob(null);
    setCompressedUrl('');

    loadImage(url)
      .then((img) => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      })
      .catch(() => {
        setError('Failed to load image. The file might be corrupted.');
      });
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const compress = useCallback(async () => {
    if (!file || !originalUrl) return;

    setIsCompressing(true);
    setError('');

    try {
      const img = await loadImage(originalUrl);
      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      if (maxDimension !== 'original') {
        const max = parseInt(maxDimension, 10);
        if (targetWidth > max || targetHeight > max) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * max) / targetWidth);
            targetWidth = max;
          } else {
            targetWidth = Math.round((targetWidth * max) / targetHeight);
            targetHeight = max;
          }
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Determine output MIME type
      let mimeType = file.type;
      if (format === 'auto') {
        // Default to webp if original is png/webp, or jpeg for jpg
        mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      } else if (format !== 'original') {
        mimeType = format;
      }

      // If output is JPEG, draw a white background for transparent images
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const q = quality / 100;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Compression failed. Please try different settings.');
            setIsCompressing(false);
            return;
          }

          if (prevCompressedUrlRef.current) URL.revokeObjectURL(prevCompressedUrlRef.current);
          const newUrl = URL.createObjectURL(blob);
          prevCompressedUrlRef.current = newUrl;
          setCompressedBlob(blob);
          setCompressedUrl(newUrl);
          setCompressedDimensions({ width: targetWidth, height: targetHeight });
          setIsCompressing(false);
        },
        mimeType,
        q
      );
    } catch {
      setError('An error occurred while compressing the image.');
      setIsCompressing(false);
    }
  }, [file, originalUrl, quality, format, maxDimension]);

  useEffect(() => {
    if (file && originalUrl) {
      const timer = setTimeout(() => {
        compress();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [file, originalUrl, quality, format, maxDimension, compress]);

  const handleDownload = () => {
    if (!compressedBlob || !file) return;

    let extension = 'jpg';
    if (compressedBlob.type === 'image/webp') extension = 'webp';
    else if (compressedBlob.type === 'image/png') extension = 'png';
    else if (compressedBlob.type === 'image/jpeg') extension = 'jpg';

    const baseName = getBaseFileName(file.name);
    downloadBlob(compressedBlob, `${baseName}-compressed.${extension}`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setFile(null);
    setOriginalUrl('');
    setCompressedBlob(null);
    setCompressedUrl('');
    setError('');
  };

  const originalSize = file ? file.size : 0;
  const compressedSize = compressedBlob ? compressedBlob.size : 0;
  const savedBytes = originalSize - compressedSize;
  const savingsPercent = originalSize > 0 && compressedSize > 0
    ? Math.round((savedBytes / originalSize) * 100)
    : 0;

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
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
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
          <h3>Upload an image to compress</h3>
          <p>Drag and drop your file here, or click to browse</p>
          <span className="upload-meta">Supports JPEG, PNG, WebP, SVG</span>
        </div>
      ) : (
        <div className="tool-grid">
          <div className="controls-card">
            <div className="controls-header">
              <span className="controls-title">
                <Sliders size={18} /> Compression Settings
              </span>
              <button className="icon-btn-ghost" onClick={handleReset} title="Clear and upload new image">
                <Trash2 size={16} /> Clear
              </button>
            </div>

            <div className="setting-group">
              <div className="setting-label-row">
                <label htmlFor="quality-slider">Quality: {quality}%</label>
                <span className="badge-pill">{quality < 50 ? 'Smaller Size' : quality > 85 ? 'High Quality' : 'Balanced'}</span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="5"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="custom-range"
              />
              <div className="range-hints">
                <span>Maximum compression (5%)</span>
                <span>Best quality (100%)</span>
              </div>
            </div>

            <div className="setting-group">
              <label>Output Format</label>
              <div className="chip-group">
                {[
                  { id: 'auto', label: 'Auto (Best)' },
                  { id: 'image/webp', label: 'WebP' },
                  { id: 'image/jpeg', label: 'JPEG' },
                  { id: 'original', label: 'Original' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`choice-chip ${format === item.id ? 'active' : ''}`}
                    onClick={() => setFormat(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <small className="setting-hint">
                WebP provides the highest compression ratio while retaining visual fidelity.
              </small>
            </div>

            <div className="setting-group">
              <label>Max Resolution</label>
              <div className="chip-group">
                {[
                  { id: 'original', label: 'Original' },
                  { id: '2560', label: '2560px' },
                  { id: '1920', label: '1920px (FHD)' },
                  { id: '1280', label: '1280px (HD)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`choice-chip ${maxDimension === item.id ? 'active' : ''}`}
                    onClick={() => setMaxDimension(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="stats-box">
              <div className="stats-row">
                <span className="stat-label">Original Size:</span>
                <span className="stat-val">{formatBytes(originalSize)}</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Compressed Size:</span>
                <span className="stat-val highlight">
                  {compressedSize ? formatBytes(compressedSize) : 'Calculating...'}
                </span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Dimensions:</span>
                <span className="stat-val">
                  {compressedDimensions.width} × {compressedDimensions.height} px
                </span>
              </div>
              {savingsPercent > 0 ? (
                <div className="savings-badge success">
                  <CheckCircle2 size={16} />
                  <span>Saved {savingsPercent}% ({formatBytes(savedBytes)} reduced)</span>
                </div>
              ) : savingsPercent < 0 ? (
                <div className="savings-badge neutral">
                  <span>File is already optimized at this quality.</span>
                </div>
              ) : null}
            </div>

            <button
              className="action-btn-primary"
              onClick={handleDownload}
              disabled={!compressedBlob || isCompressing}
            >
              {downloaded ? (
                <>
                  <Check size={18} />
                  <span>Downloaded!</span>
                </>
              ) : isCompressing ? (
                <>
                  <RefreshCw className="spin-icon" size={18} />
                  <span>Compressing...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Compressed Image</span>
                </>
              )}
            </button>
          </div>

          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-title">
                <Layers size={18} /> Comparison Preview
              </span>
              <span className="file-name-tag">{file.name}</span>
            </div>

            <div className="comparison-container">
              <div className="preview-pane">
                <div className="pane-header">
                  <span>Original</span>
                  <span className="pane-meta">
                    {originalDimensions.width}×{originalDimensions.height} • {formatBytes(originalSize)}
                  </span>
                </div>
                <div className="image-frame">
                  <img src={originalUrl} alt="Original" />
                </div>
              </div>

              <div className="preview-pane">
                <div className="pane-header">
                  <span>Compressed</span>
                  <span className="pane-meta highlight">
                    {compressedDimensions.width}×{compressedDimensions.height} • {compressedSize ? formatBytes(compressedSize) : '...'}
                  </span>
                </div>
                <div className="image-frame">
                  {compressedUrl ? (
                    <img src={compressedUrl} alt="Compressed" />
                  ) : (
                    <div className="loading-placeholder">
                      <Sparkles className="spin-icon" size={24} />
                      <span>Generating compressed preview...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
