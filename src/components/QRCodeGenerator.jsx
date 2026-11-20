import "./QRCodeGenerator.css";
import { useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Download, QrCode } from "lucide-react";

export default function QRCodeGenerator({ onBack }) {
  const [text, setText] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [error, setError] = useState("");

  const generateQR = async () => {
    if (!text.trim()) {
      setError("Please enter a URL or text.");
      setQrImage("");
      return;
    }

    try {
      const image = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setQrImage(image);
      setError("");
    } catch {
      setError("Could not generate QR code. Please try again.");
      setQrImage("");
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = "neotools-qr-code.png";
    link.click();
  };

  return (
    <section className="qr-page">
      <button className="qr-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to tools
      </button>

      <div className="qr-card">
        <div className="qr-icon">
          <QrCode size={28} />
        </div>

        <h1>QR Code Generator</h1>
        <p>Turn any link or text into a scannable QR code.</p>

        <label htmlFor="qr-text">Enter URL or text</label>
        <textarea
          id="qr-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="https://example.com"
          rows={4}
        />

        {error && <p className="qr-error">{error}</p>}

        <button className="qr-generate" onClick={generateQR}>
          <QrCode size={18} /> Generate QR Code
        </button>

        {qrImage && (
          <div className="qr-result">
            <img src={qrImage} alt="Generated QR code" />

            <button className="qr-download" onClick={downloadQR}>
              <Download size={18} /> Download PNG
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
