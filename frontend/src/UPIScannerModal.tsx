import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, ArrowRight, X } from "lucide-react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteSweep: (merchant: string, spend: number) => Promise<void>;
}

export function UPIScannerModal({ isOpen, onClose, onExecuteSweep }: QRModalProps) {
  const [scannedData, setScannedData] = useState<{ pa: string; pn: string } | null>(null);
  const [spendAmount, setSpendAmount] = useState<string>("12");
  const [enableSavings, setEnableSavings] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || scannedData) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 220, height: 220 },
        videoConstraints: { facingMode: { ideal: "environment" } }
      },
      false
    );

    scanner.render(
      (decodedText) => {
        try {
          if (decodedText.startsWith("upi://pay")) {
            const url = new URL(decodedText);
            const pa = url.searchParams.get("pa") || "merchant@upi";
            const pn = url.searchParams.get("pn") || "Tapri Chai";
            const am = url.searchParams.get("am");
            if (am) setSpendAmount(am);
            setScannedData({ pa, pn });
            scanner.clear();
          } else {
            setScannedData({ pa: "tapri@upi", pn: decodedText.slice(0, 16) });
            scanner.clear();
          }
        } catch {
          setScannedData({ pa: "tapri@upi", pn: "Pune Merchant" });
          scanner.clear();
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isOpen, scannedData]);

  if (!isOpen) return null;

  const spend = Number(spendAmount) || 0;
  const roundMultiple = spend <= 25 ? 5 : 10;
  const delta = spend % roundMultiple === 0 ? 0 : roundMultiple - (spend % roundMultiple);

  const handleProceed = async () => {
    if (!scannedData) return;

    const spendNum = Number(spendAmount) || 12;

    if (enableSavings && delta > 0) {
      await onExecuteSweep(scannedData.pn, spendNum);
    }

    const upiUri = `upi://pay?pa=${scannedData.pa}&pn=${encodeURIComponent(scannedData.pn)}&am=${spendNum}&cu=INR`;
    window.location.href = upiUri;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-static max-w-sm w-full p-5 text-white shadow-2xl shadow-black/40 animate-fade-in">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-semibold text-base">Scan Merchant QR</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {!scannedData ? (
          <div className="mt-4">
            <div
              id="qr-reader"
              className="w-full rounded-xl overflow-hidden border border-white/[0.06]"
            ></div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Point your camera at any UPI QR code
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Merchant Info */}
            <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Merchant</div>
              <div className="font-bold text-sm text-white mt-0.5">{scannedData.pn}</div>
              <div className="text-[11px] font-mono text-amber-400 mt-0.5">{scannedData.pa}</div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-[11px] text-gray-500 block mb-1.5 uppercase tracking-wider font-medium">
                Spend Amount (₹)
              </label>
              <input
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-base font-bold"
              />
            </div>

            {/* Savings Toggle */}
            <div className="p-3.5 bg-amber-400/[0.06] border border-amber-400/15 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">Monad Micro-Roundup</span>
                <span className="text-emerald-400 font-bold text-sm">+₹{delta} to Vault</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSavings}
                  onChange={(e) => setEnableSavings(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-400 accent-amber-400"
                />
                <span className="text-xs text-gray-400 font-medium">Save</span>
              </label>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceed}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              Pay via UPI & Sweep
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}