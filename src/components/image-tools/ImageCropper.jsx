import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
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

export default function ImageCropper() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [aspectRatioPreset, setAspectRatioPreset] = useState('free'); // 'free', '1:1', '4:3', '16:9', '3:2', '9:16'
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [croppedUrl, setCroppedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Dragging state for interactive crop
  const [dragMode, setDragMode] = useState(null); // 'move', 'nw', 'ne', 'sw', 'se', 'draw', null
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: { ...crop } });

  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const imageDisplayRef = useRef(null);
  const prevCroppedUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (prevCroppedUrlRef.current) URL.revokeObjectURL(prevCroppedUrlRef.current);
    };
  }, []);

  const getPresetRatio = (preset) => {
    switch (preset) {
      case '1:1': return 1;
      case '4:3': return 4 / 3;
      case '16:9': return 16 / 9;
      case '3:2': return 3 / 2;
      case '9:16': return 9 / 16;
      default: return null;
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPEG, WebP, etc.).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (croppedUrl) URL.revokeObjectURL(croppedUrl);

    setError('');
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setCroppedBlob(null);
    setCroppedUrl('');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatioPreset('free');

    loadImage(url)
      .then((img) => {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        setNaturalDimensions({ width: nw, height: nh });
        // Default crop to central 80%
        const initialW = Math.round(nw * 0.8);
        const initialH = Math.round(nh * 0.8);
        const initialX = Math.round((nw - initialW) / 2);
        const initialY = Math.round((nh - initialH) / 2);
        setCrop({ x: initialX, y: initialY, width: initialW, height: initialH });
      })
      .catch(() => {
        setError('Failed to load image. The file might be corrupted.');
      });
  };

  const applyCropPreset = (preset) => {
    setAspectRatioPreset(preset);
    const ratio = getPresetRatio(preset);
    if (!ratio || naturalDimensions.width === 0) return;

    const nw = naturalDimensions.width;
    const nh = naturalDimensions.height;
    let targetW = nw * 0.85;
    let targetH = targetW / ratio;

    if (targetH > nh * 0.85) {
      targetH = nh * 0.85;
      targetW = targetH * ratio;
    }

    targetW = Math.round(targetW);
    targetH = Math.round(targetH);
    const targetX = Math.round((nw - targetW) / 2);
    const targetY = Math.round((nh - targetH) / 2);

    setCrop({
      x: Math.max(0, targetX),
      y: Math.max(0, targetY),
      width: targetW,
      height: targetH
    });
  };

  const executeCrop = useCallback(async () => {
    if (!file || !originalUrl || crop.width <= 0 || crop.height <= 0) return;

    setIsProcessing(true);
    setError('');

    try {
      const img = await loadImage(originalUrl);

      // Create intermediate canvas if rotated or flipped
      const srcCanvas = document.createElement('canvas');
      const is90or270 = rotation === 90 || rotation === 270;
      srcCanvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
      srcCanvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;
      const sCtx = srcCanvas.getContext('2d');

      sCtx.translate(srcCanvas.width / 2, srcCanvas.height / 2);
      sCtx.rotate((rotation * Math.PI) / 180);
      sCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      sCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // Create crop canvas
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = crop.width;
      cropCanvas.height = crop.height;
      const cCtx = cropCanvas.getContext('2d');

      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = 'high';
      cCtx.drawImage(
        srcCanvas,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      cropCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Failed to crop image.');
            setIsProcessing(false);
            return;
          }

          if (prevCroppedUrlRef.current) URL.revokeObjectURL(prevCroppedUrlRef.current);
          const newUrl = URL.createObjectURL(blob);
          prevCroppedUrlRef.current = newUrl;
          setCroppedBlob(blob);
          setCroppedUrl(newUrl);
          setIsProcessing(false);
        },
        mimeType,
        0.95
      );
    } catch {
      setError('An error occurred during cropping.');
      setIsProcessing(false);
    }
  }, [file, originalUrl, crop, rotation, flipH, flipV]);

  useEffect(() => {
    if (file && originalUrl && crop.width > 0 && crop.height > 0) {
      const timer = setTimeout(() => {
        executeCrop();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [file, originalUrl, crop, rotation, flipH, flipV, executeCrop]);

  // Pointer drag calculation for interactive crop box
  const getImageScale = () => {
    if (!imageDisplayRef.current || !naturalDimensions.width) return 1;
    const is90or270 = rotation === 90 || rotation === 270;
    const effectiveWidth = is90or270 ? naturalDimensions.height : naturalDimensions.width;
    return imageDisplayRef.current.clientWidth / effectiveWidth;
  };

  const handlePointerDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const scale = getImageScale();
    setDragMode(mode);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop },
      scale
    });
  };

  const handlePointerMove = (e) => {
    if (!dragMode) return;
    const dx = (e.clientX - dragStart.x) / dragStart.scale;
    const dy = (e.clientY - dragStart.y) / dragStart.scale;

    const is90or270 = rotation === 90 || rotation === 270;
    const maxW = is90or270 ? naturalDimensions.height : naturalDimensions.width;
    const maxH = is90or270 ? naturalDimensions.width : naturalDimensions.height;
    const ratio = getPresetRatio(aspectRatioPreset);

    let newX = dragStart.crop.x;
    let newY = dragStart.crop.y;
    let newW = dragStart.crop.width;
    let newH = dragStart.crop.height;

    if (dragMode === 'move') {
      newX = Math.max(0, Math.min(maxW - newW, dragStart.crop.x + dx));
      newY = Math.max(0, Math.min(maxH - newH, dragStart.crop.y + dy));
    } else if (dragMode === 'se') {
      newW = Math.max(20, Math.min(maxW - newX, dragStart.crop.width + dx));
      if (ratio) {
        newH = Math.max(20, Math.min(maxH - newY, Math.round(newW / ratio)));
        newW = Math.round(newH * ratio);
      } else {
        newH = Math.max(20, Math.min(maxH - newY, dragStart.crop.height + dy));
      }
    } else if (dragMode === 'nw') {
      const targetW = dragStart.crop.width - dx;
      const targetH = ratio ? targetW / ratio : dragStart.crop.height - dy;
      if (targetW > 20 && targetH > 20) {
        newX = Math.max(0, dragStart.crop.x + dx);
        newY = Math.max(0, dragStart.crop.y + (ratio ? (dragStart.crop.width - targetW) / ratio : dy));
        newW = targetW;
        newH = targetH;
      }
    }

    setCrop({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH)
    });
  };

  const handlePointerUp = () => {
    setDragMode(null);
  };

  const handleDownload = () => {
    if (!croppedBlob || !file) return;

    let extension = 'png';
    if (croppedBlob.type === 'image/jpeg') extension = 'jpg';
    else if (croppedBlob.type === 'image/webp') extension = 'webp';

    const baseName = getBaseFileName(file.name);
    downloadBlob(croppedBlob, `${baseName}-cropped.${extension}`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (croppedUrl) URL.revokeObjectURL(croppedUrl);
    setFile(null);
    setOriginalUrl('');
    setCroppedBlob(null);
    setCroppedUrl('');
    setError('');
  };

  const is90or270 = rotation === 90 || rotation === 270;
  const baseW = is90or270 ? naturalDimensions.height : naturalDimensions.width;
  const baseH = is90or270 ? naturalDimensions.width : naturalDimensions.height;

  const cropBoxStyle = {
    left: baseW ? `${(crop.x / baseW) * 100}%` : '0%',
    top: baseH ? `${(crop.y / baseH) * 100}%` : '0%',
    width: baseW ? `${(crop.width / baseW) * 100}%` : '100%',
    height: baseH ? `${(crop.height / baseH) * 100}%` : '100%'
  };

  return (
    <div className="tool-content" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
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
          <h3>Upload an image to crop</h3>
          <p>Drag and drop your file here, or click to browse</p>
          <span className="upload-meta">Supports PNG, JPEG, WebP, SVG</span>
        </div>
      ) : (
        <div className="tool-grid">
          <div className="controls-card">
            <div className="controls-header">
              <span className="controls-title">
                <Sliders size={18} /> Crop & Rotate Tools
              </span>
              <button className="icon-btn-ghost" onClick={handleReset} title="Clear">
                <Trash2 size={16} /> Clear
              </button>
            </div>

            <div className="setting-group">
              <label>Aspect Ratio</label>
              <div className="chip-group">
                {[
                  { id: 'free', label: 'Free' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:3', label: '4:3' },
                  { id: '16:9', label: '16:9' },
                  { id: '3:2', label: '3:2' },
                  { id: '9:16', label: '9:16 Story' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`choice-chip ${aspectRatioPreset === item.id ? 'active' : ''}`}
                    onClick={() => applyCropPreset(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Transform & Orientation</label>
              <div className="transform-actions-row">
                <button
                  type="button"
                  className="choice-chip"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  title="Rotate 90 degrees"
                >
                  <RotateCw size={15} /> Rotate 90°
                </button>
                <button
                  type="button"
                  className={`choice-chip ${flipH ? 'active' : ''}`}
                  onClick={() => setFlipH(!flipH)}
                  title="Flip horizontally"
                >
                  <FlipHorizontal size={15} /> Flip H
                </button>
                <button
                  type="button"
                  className={`choice-chip ${flipV ? 'active' : ''}`}
                  onClick={() => setFlipV(!flipV)}
                  title="Flip vertically"
                >
                  <FlipVertical size={15} /> Flip V
                </button>
              </div>
            </div>

            <div className="dimension-inputs-container">
              <div className="dimension-field">
                <label htmlFor="crop-w">Crop Width (px)</label>
                <input
                  id="crop-w"
                  type="number"
                  min="20"
                  value={crop.width}
                  onChange={(e) => setCrop({ ...crop, width: Math.max(20, parseInt(e.target.value, 10) || 20) })}
                  className="dimension-input"
                />
              </div>
              <div className="dimension-field">
                <label htmlFor="crop-h">Crop Height (px)</label>
                <input
                  id="crop-h"
                  type="number"
                  min="20"
                  value={crop.height}
                  onChange={(e) => setCrop({ ...crop, height: Math.max(20, parseInt(e.target.value, 10) || 20) })}
                  className="dimension-input"
                />
              </div>
            </div>

            <div className="stats-box">
              <div className="stats-row">
                <span className="stat-label">Original:</span>
                <span className="stat-val">{naturalDimensions.width} × {naturalDimensions.height} px</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Crop Size:</span>
                <span className="stat-val highlight">{crop.width} × {crop.height} px</span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Result Size:</span>
                <span className="stat-val highlight">{croppedBlob ? formatBytes(croppedBlob.size) : 'Calculating...'}</span>
              </div>
            </div>

            <button
              className="action-btn-primary"
              onClick={handleDownload}
              disabled={!croppedBlob || isProcessing}
            >
              {downloaded ? (
                <>
                  <Check size={18} />
                  <span>Downloaded!</span>
                </>
              ) : isProcessing ? (
                <>
                  <RefreshCw className="spin-icon" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Cropped Image</span>
                </>
              )}
            </button>
          </div>

          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-title">
                <Crop size={18} /> Interactive Crop Area
              </span>
              <span className="file-name-tag">Drag box to reposition</span>
            </div>

            <div className="cropper-viewport-container" ref={imageContainerRef}>
              <div className="cropper-image-wrapper">
                <img
                  ref={imageDisplayRef}
                  src={originalUrl}
                  alt="Crop source"
                  className="cropper-base-image"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`
                  }}
                />

                {/* Shaded crop overlay */}
                <div
                  className="crop-box"
                  style={cropBoxStyle}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  <div className="crop-grid-line horizontal h1" />
                  <div className="crop-grid-line horizontal h2" />
                  <div className="crop-grid-line vertical v1" />
                  <div className="crop-grid-line vertical v2" />

                  <div
                    className="crop-handle nw"
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  />
                  <div
                    className="crop-handle se"
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                  />
                  <div className="crop-dimension-badge">
                    {crop.width} × {crop.height}
                  </div>
                </div>
              </div>
            </div>

            {croppedUrl && (
              <div className="cropped-result-tray">
                <div className="tray-label">
                  <CheckCircle2 size={15} /> Cropped Result Preview ({crop.width} × {crop.height} px)
                </div>
                <div className="tray-preview">
                  <img src={croppedUrl} alt="Cropped result" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
