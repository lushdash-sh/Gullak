import { useState, useEffect } from "react";
import {
  Coffee,
  Zap,
  TrendingUp,
  ShieldCheck,
  Flame,
  Award,
  ExternalLink,
  Camera,
  Wallet,
  IndianRupee,
  ArrowUpRight,
  Laptop,
  UtensilsCrossed,
  CupSoda,
  Croissant,
} from "lucide-react";
import confetti from "canvas-confetti";
import { UPIScannerModal } from "./UPIScannerModal";

interface SweepEvent {
  txHash: string;
  merchantName: string;
  spendRupees: number;
  savedRupees: number;
  sweptMON: string;
  latencyMs: number;
  blockNumber: number;
}

// Dynamically use current hostname so phones on local WiFi connect seamlessly
const BACKEND_URL = "";
const DEMO_USER_ADDRESS = "0x1d4E38BE39939c60e8D513d7cb046Cb7179Fa8d1";

export default function App() {
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [totalSavedMON, setTotalSavedMON] = useState<string>("0.000000");
  const [depositCount, setDepositCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [badgeTier, setBadgeTier] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<SweepEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [customSpend, setCustomSpend] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const badgeLabels = [
    { name: "Rookie Saver", color: "text-gray-500" },
    { name: "Tapri Regular", color: "text-amber-600" },
    { name: "Cutting Connoisseur", color: "text-brand-500" },
    { name: "Chai Sovereign", color: "text-yellow-600" },
  ];

  useEffect(() => {
    async function initVault() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/get-or-create-vault`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: DEMO_USER_ADDRESS }),
        });
        const data = await res.json();
        setVaultAddress(data.vaultAddress);
        fetchVaultData(data.vaultAddress);

        const historyRes = await fetch(`${BACKEND_URL}/api/history`);
        const history = await historyRes.json();
        if (Array.isArray(history) && history.length > 0) {
          setRecentEvents(history);
        }
      } catch (err) {
        console.error("Failed to load vault:", err);
      }
    }

    initVault();

    const eventSource = new EventSource(`${BACKEND_URL}/api/events`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "SWEEP_EXECUTED") {
          setRecentEvents((prev) => {
            if (prev.some((item) => item.txHash === data.txHash)) return prev;
            return [data, ...prev.slice(0, 9)];
          });
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
        }
      } catch {}
    };

    return () => eventSource.close();
  }, []);

  async function fetchVaultData(vAddress: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/vault/${vAddress}`);
      const data = await res.json();
      setTotalSavedMON(parseFloat(data.totalSavedMON).toFixed(6));
      setDepositCount(data.totalDepositsCount);
      setStreak(data.currentStreak);
      setBadgeTier(data.badgeTier);
    } catch (err) {
      console.error(err);
    }
  }

  async function triggerPayment(merchantName: string, spendRupees: number) {
    if (!vaultAddress || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/upi-sweep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultAddress, spendRupees, merchantName }),
      });
      const data = await res.json();

      if (data && data.txHash) {
        setRecentEvents((prev) => {
          if (prev.some((item) => item.txHash === data.txHash)) return prev;
          return [data, ...prev.slice(0, 9)];
        });
        confetti({ particleCount: 35, spread: 70, origin: { y: 0.8 } });
      }

      await fetchVaultData(vaultAddress);
    } catch (err) {
      console.error("Payment failed", err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function triggerCampusRush() {
    if (!vaultAddress || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulate-rush`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultAddress }),
      });
      const data = await res.json();

      if (data && data.events) {
        setRecentEvents((prev) => [...data.events, ...prev].slice(0, 10));
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.8 } });
      }

      await fetchVaultData(vaultAddress);
    } catch (err) {
      console.error("Campus rush simulation failed", err);
    } finally {
      setIsProcessing(false);
    }
  }

  const orders = [
    { name: "Cutting Chai", icon: CupSoda, price: 12, saved: "+₹3 saved", color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Bun Maska", icon: Croissant, price: 28, saved: "+₹2 saved", color: "text-orange-600", bg: "bg-orange-50" },
    { name: "FC Road Poha", icon: UtensilsCrossed, price: 23, saved: "+₹2 saved", color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Large Rent/Fee", icon: Laptop, price: 14423, saved: "+₹7 clamp", color: "text-brand-600", bg: "bg-brand-50" },
  ];

  return (
    <div className="app-bg text-text-primary flex flex-col font-sans min-h-screen">
      {/* ─── Navbar ─────────────────────────────── */}
      <header className="navbar sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Wallet className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-text-primary leading-tight">
                Gullak
              </h1>
              <p className="text-[10px] sm:text-[11px] text-text-tertiary leading-tight">
                Chhutta nahi, savings hai
              </p>
            </div>
          </div>

          {/* Network & Vault */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-surface-muted border border-border px-2.5 py-1.5 rounded-lg text-xs text-text-secondary">
              <span className="live-dot"></span>
              <span>Monad Testnet</span>
            </div>
            <div className="text-[11px] font-mono bg-brand-50 text-brand-600 px-2.5 py-1.5 rounded-lg border border-brand-100 truncate max-w-[130px] sm:max-w-none font-medium">
              {vaultAddress ? `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}` : "Deploying..."}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main ──────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

        {/* ── Left: Point of Sale ──────────────── */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          <div className="g-card p-5 sm:p-6">
            {/* Header Row */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Coffee className="w-[18px] h-[18px] text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-text-primary leading-tight">Pune Tapri</h2>
                  <p className="text-[11px] text-text-tertiary">Point-of-Sale Terminal</p>
                </div>
              </div>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan QR
              </button>
            </div>

            {/* Quick Orders */}
            <div className="mt-5">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest mb-3">
                Quick Orders
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {orders.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      disabled={isProcessing}
                      onClick={() => triggerPayment(item.name, item.price)}
                      className="order-btn flex flex-col p-3.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <span className="font-semibold text-sm text-text-primary">{item.name}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2.5 pl-9">
                        <span className="text-xs text-text-tertiary">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          {item.saved}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vault Balance */}
            <div className="vault-card mt-5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Vault Balance</span>
                <TrendingUp className="w-4 h-4 text-brand-500" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-text-primary tracking-tight">
                {totalSavedMON}
                <span className="text-sm font-sans font-semibold text-brand-500 ml-1.5">mINR</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-semibold">
                  ≈ ₹{parseFloat(totalSavedMON || "0").toFixed(0)} Saved
                </span>
                <span className="text-text-tertiary">{depositCount} Deposits</span>
              </div>
            </div>

            {/* Custom Spend */}
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                placeholder="Custom ₹ (e.g. 18)"
                value={customSpend}
                onChange={(e) => setCustomSpend(e.target.value)}
                className="input-field flex-1 px-3.5 py-2.5 text-sm"
              />
              <button
                disabled={!customSpend || isProcessing}
                onClick={() => {
                  triggerPayment("Custom Merchant", Number(customSpend));
                  setCustomSpend("");
                }}
                className="btn-primary px-5 py-2.5 text-sm"
              >
                Pay & Save
              </button>
            </div>

            {/* Campus Rush */}
            <div className="mt-5 pt-4 border-t border-border">
              <button
                disabled={isProcessing}
                onClick={triggerCampusRush}
                className="btn-rush w-full py-3.5 text-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                {isProcessing ? "Processing on Monad..." : "Simulate Pune Campus Rush"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Right: Stats + Live Stream ────────── */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Saved */}
            <div className="stat-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-tertiary">Total Saved</span>
                <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                </div>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-text-primary tracking-tight">
                {totalSavedMON}
                <span className="text-xs font-sans font-medium text-brand-400 ml-1">MON</span>
              </div>
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                {depositCount} Micro-Deposits
              </p>
            </div>

            {/* Streak */}
            <div className="stat-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-tertiary">Saving Streak</span>
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </div>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-extrabold text-orange-500 font-mono">
                {streak}
                <span className="text-xs font-sans font-medium text-text-secondary ml-1.5">Days</span>
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                Daily auto-increment
              </p>
            </div>

            {/* Tier */}
            <div className="stat-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-tertiary">Tier Status</span>
                <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-yellow-600" />
                </div>
              </div>
              <div className={`mt-2 text-sm font-bold truncate ${badgeLabels[badgeTier]?.color || "text-gray-500"}`}>
                {badgeLabels[badgeTier]?.name || "Rookie"}
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                Tier {badgeTier} of 3
              </p>
            </div>
          </div>

          {/* Live Stream */}
          <div className="g-card p-5 sm:p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck className="w-[18px] h-[18px] text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary leading-tight">Live Monad Stream</h3>
                  <p className="text-[11px] text-text-tertiary">Sub-second block finality</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {recentEvents.length > 0 && <span className="live-dot"></span>}
                <span className="text-xs text-text-tertiary font-mono">
                  {recentEvents.length > 0 ? `${recentEvents.length} Sweeps` : "Waiting..."}
                </span>
              </div>
            </div>

            <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {recentEvents.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-tertiary">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mb-3">
                    <Coffee className="w-5 h-5 text-text-tertiary" />
                  </div>
                  <p className="text-sm">Tap an order or scan a QR to start</p>
                </div>
              ) : (
                recentEvents.map((evt, idx) => (
                  <div
                    key={`${evt.txHash}-${idx}`}
                    className="event-card p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{evt.merchantName}</span>
                          <span className="text-xs text-text-tertiary font-normal shrink-0">
                            Paid ₹{evt.spendRupees}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          +{evt.sweptMON} MON swept · ₹{evt.savedRupees} change
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="pill bg-brand-50 text-brand-600 border border-brand-100 text-[10px] sm:text-[11px]">
                        {evt.latencyMs}ms
                      </span>
                      <a
                        href={`https://testnet.monadexplorer.com/tx/${evt.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] sm:text-[11px] text-text-tertiary hover:text-brand-500 flex items-center gap-0.5 transition-colors"
                      >
                        {evt.txHash.slice(0, 8)}...
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* UPI QR Scanner Modal */}
      <UPIScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onExecuteSweep={(merchant, spend) => triggerPayment(merchant, spend)}
      />
    </div>
  );
}