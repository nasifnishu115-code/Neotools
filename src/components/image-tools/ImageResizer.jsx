import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  Scaling,
  Lock,
  Unlock,
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

export default function ImageResizer() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [format, setFormat] = useState('original');
  const [resizedBlob, setResizedBlob] = useState(null);
  const [resizedUrl, setResizedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const prevResizedUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (prevResizedUrlRef.current) URL.revokeObjectURL(prevResizedUrlRef.current);
    };
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resizedUrl) URL.revokeObjectURL(resizedUrl);

    setError('');
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setResizedBlob(null);
    setResizedUrl('');

    loadImage(url)
      .then((img) => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setOriginalDimensions({ width: w, height: h });
        setWidth(w);
        setHeight(h);
        setAspectRatio(w / h);
      })
      .catch(() => {
        setError('Failed to load image. The file might be corrupted.');
      });
  };

  const handleWidthChange = (newWidth) => {
    const val = Math.max(1, parseInt(newWidth, 10) || 0);
    setWidth(val);
    if (lockAspectRatio && aspectRatio > 0) {
      setHeight(Math.max(1, Math.round(val / aspectRatio)));
    }
  };

  const handleHeightChange = (newHeight) => {
    const val = Math.max(1, parseInt(newHeight, 10) || 0);
    setHeight(val);
    if (lockAspectRatio && aspectRatio > 0) {
      setWidth(Math.max(1, Math.round(val * aspectRatio)));
    }
  };

  const applyScalePercent = (percent) => {
    if (!originalDimensions.width || !originalDimensions.height) return;
    const factor = percent / 100;
    const newW = Math.max(1, Math.round(originalDimensions.width * factor));
    const newH = Math.max(1, Math.round(originalDimensions.height * factor));
    setWidth(newW);
    setHeight(newH);
  };

  const applyResolutionPreset = (presetW, presetH) => {
    setWidth(presetW);
    setHeight(presetH);
  };

  const executeResize = useCallback(async () => {
    if (!file || !originalUrl || width <= 0 || height <= 0) return;

    setIsProcessing(true);
    setError('');

    try {
      const img = await loadImage(originalUrl);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      let mimeType = 'image/png';
      if (format !== 'original') {
        mimeType = format;
      } else if (file.type && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        mimeType = file.type;
      }

      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Failed to resize image.');
            setIsProcessing(false);
            return;
          }

          if (prevResizedUrlRef.current) URL.revokeObjectURL(prevResizedUrlRef.current);
          const newUrl = URL.createObjectURL(blob);
          prevResizedUrlRef.current = newUrl;
          setResizedBlob(blob);
          setResizedUrl(newUrl);
          setIsProcessing(false);
        },
        mimeType,
        0.92
      );
    } catch {
      setError('An error occurred during resizing.');
      setIsProcessing(false);
    }
  }, [file, originalUrl, width, height, format]);

  useEffect(() => {
    if (file && originalUrl && width > 0 && height > 0) {
      const timer = setTimeout(() => {
        executeResize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [file, originalUrl, width, height, format, executeResize]);

  const triggerSave = (blobToSave) => {
    let extension = 'png';
    if (blobToSave.type === 'image/webp') extension = 'webp';
    else if (blobToSave.type === 'image/jpeg') extension = 'jpg';
    else if (blobToSave.type === 'image/png') extension = 'png';

    const baseName = getBaseFileName(file.name);
    downloadBlob(blobToSave, `${baseName}-${width}x${height}.${extension}`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleDownload = async () => {
    if (!file || !originalUrl || width <= 0 || height <= 0) return;

    if (resizedBlob && !isProcessing) {
      triggerSave(resizedBlob);
      return;
    }

    try {
      setIsProcessing(true);
      const img = await loadImage(originalUrl);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      let mimeType = 'image/png';
      if (format !== 'original') {
        mimeType = format;
      } else if (file.type && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        mimeType = file.type;
      }

      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            if (prevResizedUrlRef.current) URL.revokeObjectURL(prevResizedUrlRef.current);
            const newUrl = URL.createObjectURL(blob);
            prevResizedUrlRef.current = newUrl;
            setResizedBlob(blob);
            setResizedUrl(newUrl);
            triggerSave(blob);
          }
        },
        mimeType,
        0.92
      );
    } catch {
      setIsProcessing(false);
      setError('Failed to download resized image.');
    }
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resizedUrl) URL.revokeObjectURL(resizedUrl);
    setFile(null);
    setOriginalUrl('');
    setResizedBlob(null);
    setResizedUrl('');
    setWidth(0);
    setHeight(0);
    setError('');
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
          <h3>Upload an image to resize</h3>
          <p>Drag and drop your file here, or click to browse</p>
          <span className="upload-meta">Supports JPEG, PNG, WebP, SVG, BMP</span>
        </div>
      ) : (
        <div className="tool-grid">
          <div className="controls-card">
            <div className="controls-header">
              <span className="controls-title">
                <Sliders size={18} /> Dimensions & Scale
              </span>
              <button className="icon-btn-ghost" onClick={handleReset} title="Clear">
                <Trash2 size={16} /> Clear
              </button>
            </div>

            <div className="dimension-inputs-container">
              <div className="dimension-field">
                <label htmlFor="dim-width">Width (px)</label>
                <input
                  id="dim-width"
                  type="number"
                  min="1"
                  max="16000"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="dimension-input"
                />
              </div>

              <button
                type="button"
                className={`lock-button ${lockAspectRatio ? 'locked' : ''}`}
                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                aria-label="Toggle aspect ratio lock"
              >
                {lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
              </button>

              <div className="dimension-field">
                <label htmlFor="dim-height">Height (px)</label>
                <input
                  id="dim-height"
                  type="number"
                  min="1"
                  max="16000"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="dimension-input"
                />
              </div>
            </div>

            <div className="setting-group">
              <label>Quick Scale Percentage</label>
              <div className="chip-group">
                {[25, 50, 75, 100, 150, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className="choice-chip"
                    onClick={() => applyScalePercent(pct)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Common Resolutions</label>
              <div className="chip-group">
                {[
                  { label: 'FHD (1920×1080)', w: 1920, h: 1080 },
                  { label: 'HD (1280×720)', w: 1280, h: 720 },
                  { label: 'Square (1080×1080)', w: 1080, h: 1080 },
                  { label: 'Story (1080×1920)', w: 1080, h: 1920 },
                  { label: 'Avatar (512×512)', w: 512, h: 512 }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="choice-chip"
                    onClick={() => applyResolutionPreset(item.w, item.h)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Output Format</label>
              <div className="chip-group">
                {[
                  { id: 'original', label: 'Original' },
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/jpeg', label: 'JPEG' },
                  { id: 'image/webp', label: 'WebP' }
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
            </div>

            <div className="stats-box">
              <div className="stats-row">
                <span className="stat-label">Original:</span>
                <span className="stat-val">{originalDimensions.width} × {originalDimensions.height} px ({formatBytes(file.size)})</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Resized:</span>
                <span className="stat-val highlight">{width} × {height} px</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Estimated Size:</span>
                <span className="stat-val highlight">{resizedBlob ? formatBytes(resizedBlob.size) : 'Calculating...'}</span>
              </div>
            </div>

            <button
              className="action-btn-primary"
              onClick={handleDownload}
              disabled={!file || width <= 0 || height <= 0}
            >
              {downloaded ? (
                <>
                  <Check size={18} />
                  <span>Downloaded!</span>
                </>
              ) : isProcessing ? (
                <>
                  <RefreshCw className="spin-icon" size={18} />
                  <span>Resizing...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Resized Image</span>
                </>
              )}
            </button>
          </div>

          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-title">
                <Scaling size={18} /> Resized Output
              </span>
              <span className="file-name-tag">{width} × {height} px</span>
            </div>

            <div className="single-preview-container">
              <div className="image-frame centered">
                {resizedUrl ? (
                  <img src={resizedUrl} alt="Resized preview" />
                ) : (
                  <div className="loading-placeholder">Processing...</div>
                )}
              </div>
            </div>

            <div className="preview-meta-footer">
              <CheckCircle2 size={16} className="text-accent" />
              <span>Scaled to {width} × {height} px with high-quality bicubic smoothing.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

