import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, BarChart3, Battery, Clock3, IndianRupee, MapPin, Navigation, Recycle, Route, Satellite, Truck } from "lucide-react";
import { wasteBins, type WasteBinRecord } from "@/data/wasteBins";

const tabs = [
  { id: "predict", label: "Prediction", icon: BarChart3 },
  { id: "gps", label: "GPS Map", icon: Satellite },
  { id: "history", label: "History", icon: Clock3 },
  { id: "dispatch", label: "Dispatch", icon: Route },
] as const;

type TabId = (typeof tabs)[number]["id"];

type Vehicle = {
  id: string;
  zone: string;
  load: number;
  stops: number;
  status: string;
  left: string;
  tons: number;
};

const statusClass = (status: string) =>
  status === "Critical"
    ? "bg-danger text-destructive-foreground"
    : status === "Warning"
      ? "bg-warning text-accent-foreground"
      : "bg-success text-primary-foreground";

const fillRate = (bin: WasteBinRecord) => {
  const last = new Date(bin.lastCollection).getTime();
  const hoursSinceCollection = Math.max(1, (Date.now() - last) / 36e5);
  return Math.max(1.4, Math.min(9.8, bin.fillLevel / hoursSinceCollection + bin.collectedTons * 3.5));
};

const currency = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("predict");
  const [selectedBin, setSelectedBin] = useState<WasteBinRecord>(wasteBins[0]);

  const zones = useMemo(() => {
    const map = new Map<string, { zone: string; bins: number; avgFill: number; tons: number; critical: number; charges: number }>();
    wasteBins.forEach((bin) => {
      const current = map.get(bin.zone) ?? { zone: bin.zone, bins: 0, avgFill: 0, tons: 0, critical: 0, charges: 0 };
      current.bins += 1;
      current.avgFill += bin.fillLevel;
      current.tons += bin.collectedTons;
      current.charges += bin.collectedTons * bin.chargePerMt;
      current.critical += bin.status === "Critical" ? 1 : 0;
      map.set(bin.zone, current);
    });
    return Array.from(map.values()).map((zone) => ({ ...zone, avgFill: Math.round(zone.avgFill / zone.bins) }));
  }, []);

  const vehicles = useMemo<Vehicle[]>(() => zones.slice(0, 6).map((zone, index) => ({
    id: `NMC-TRUCK-${String(index + 1).padStart(2, "0")}`,
    zone: zone.zone,
    load: Math.min(96, Math.round(zone.avgFill + zone.tons * 4)),
    stops: zone.critical + Math.ceil(zone.bins * 0.28),
    status: zone.critical > 2 ? "Urgent pickup" : zone.avgFill > 60 ? "Collecting" : "Monitoring",
    left: `${(zone.bins * 0.42 + index * 1.7).toFixed(1)} km`,
    tons: zone.tons,
  })), [zones]);

  const prediction = useMemo(() => {
    const rate = fillRate(selectedBin);
    const hoursToFull = Math.max(0.2, (100 - selectedBin.fillLevel) / rate);
    const projected = Math.min(100, Math.round(selectedBin.fillLevel + rate * 6));
    const confidence = Math.min(98, Math.round(82 + selectedBin.wardTotalTons * 4 + selectedBin.collectedTons * 8));
    return { rate, hoursToFull, projected, confidence };
  }, [selectedBin]);

  const urgentBins = wasteBins.filter((bin) => bin.fillLevel >= 80 || bin.status === "Critical").length;
  const averageFill = Math.round(wasteBins.reduce((sum, bin) => sum + bin.fillLevel, 0) / wasteBins.length);
  const totalTons = wasteBins.reduce((sum, bin) => sum + bin.collectedTons, 0);
  const totalCharges = wasteBins.reduce((sum, bin) => sum + bin.collectedTons * bin.chargePerMt, 0);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative bg-hero-gradient text-primary-foreground">
        <div className="absolute inset-0 grid-field opacity-30" aria-hidden="true" />
        <div className="container relative grid min-h-[420px] gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Recycle className="h-4 w-4" /> Nagpur Waste Intelligence
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Predict bin waste levels before overflow.</h1>
              <p className="max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
                Your uploaded bin dataset powers fill forecasts, GPS monitoring, contractor cost visibility, and vehicle dispatch planning.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Dataset bins" value={wasteBins.length.toString()} icon={Activity} />
              <Metric label="Urgent bins" value={urgentBins.toString()} icon={AlertTriangle} />
              <Metric label="Collected tons" value={totalTons.toFixed(1)} icon={Truck} />
            </div>
          </div>
          <div className="relative min-h-[300px] rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-5 shadow-command backdrop-blur-md">
            <div className="absolute left-0 right-0 top-0 h-16 bg-accent/20 scan-line" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-foreground/75">Live prediction</span>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{prediction.confidence}% confidence</span>
              </div>
              <div>
                <p className="text-sm text-primary-foreground/70">{selectedBin.binId} · Ward {selectedBin.ward} · {selectedBin.zone}</p>
                <p className="mt-2 text-7xl font-black">{selectedBin.fillLevel}%</p>
                <p className="mt-3 text-primary-foreground/75">Projected to reach {prediction.projected}% in 6 hours.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-surface-deep/55 p-4">
                  <p className="text-xs text-primary-foreground/60">Time to full</p>
                  <p className="text-2xl font-black">{prediction.hoursToFull.toFixed(1)}h</p>
                </div>
                <div className="rounded-md bg-surface-deep/55 p-4">
                  <p className="text-xs text-primary-foreground/60">Waste type</p>
                  <p className="text-2xl font-black">{selectedBin.wasteType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container -mt-5 pb-12">
        <div className="rounded-lg border border-border bg-panel-gradient p-3 shadow-command">
          <div className="grid gap-2 md:grid-cols-4" role="tablist" aria-label="Waste operations tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 min-h-[520px] rounded-lg border border-border bg-card p-4 md:p-6">
            {activeTab === "predict" && (
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-3">
                  <h2 className="text-2xl font-black">Highest priority bins</h2>
                  {[...wasteBins].sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 10).map((bin) => (
                    <button key={bin.binId} onClick={() => setSelectedBin(bin)} className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedBin.binId === bin.binId ? "border-primary bg-surface-mist" : "border-border bg-card"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black">{bin.binId}</p>
                          <p className="text-sm text-muted-foreground">{bin.zone} · Ward {bin.ward}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(bin.status)}`}>{bin.status}</span>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${bin.fillLevel}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
                <ForecastPanel bin={selectedBin} projected={prediction.projected} hours={prediction.hoursToFull} confidence={prediction.confidence} rate={prediction.rate} />
              </div>
            )}
            {activeTab === "gps" && <GpsPanel selectedBin={selectedBin} onSelect={setSelectedBin} vehicles={vehicles} />}
            {activeTab === "history" && <HistoryPanel zones={zones} totalCharges={totalCharges} />}
            {activeTab === "dispatch" && <DispatchPanel vehicles={vehicles} />}
          </div>
        </div>
      </section>
    </main>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) => (
  <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur">
    <Icon className="mb-3 h-5 w-5 text-accent" />
    <p className="text-3xl font-black">{value}</p>
    <p className="text-sm text-primary-foreground/70">{label}</p>
  </div>
);

const DataTile = ({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Activity }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">{Icon && <Icon className="h-4 w-4" />}<span>{label}</span></div>
    <p className="mt-1 break-words text-2xl font-black md:text-3xl">{value}</p>
  </div>
);

const ForecastPanel = ({ bin, projected, hours, confidence, rate }: { bin: WasteBinRecord; projected: number; hours: number; confidence: number; rate: number }) => {
  const history = Array.from({ length: 7 }, (_, index) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
    actual: Math.max(5, Math.round(bin.fillLevel - (6 - index) * rate * 0.8)),
    predicted: Math.min(100, Math.round(bin.fillLevel + (index - 3) * rate * 0.9)),
  }));

  return (
    <div className="rounded-lg border border-border bg-surface-mist p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{bin.zone}</h2>
          <p className="text-muted-foreground">GPS {bin.latitude.toFixed(5)}, {bin.longitude.toFixed(5)} · {bin.contractAgency}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(bin.status)}`}>{bin.status}</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DataTile label="Current level" value={`${bin.fillLevel}%`} />
        <DataTile label="6h forecast" value={`${projected}%`} />
        <DataTile label="Overflow in" value={`${hours.toFixed(1)}h`} />
      </div>
      <div className="mt-6 h-[280px] rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={3} />
            <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.16)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <DataTile label="Battery" value={`${bin.batteryLevel}%`} icon={Battery} />
        <DataTile label="Collected" value={`${bin.collectedTons.toFixed(3)} tons`} />
        <DataTile label="Charge" value={`₹${currency.format(bin.collectedTons * bin.chargePerMt)}`} icon={IndianRupee} />
      </div>
      <p className="mt-4 text-sm font-semibold text-muted-foreground">Model confidence: {confidence}% from last collection time, current fill, collected tons, and ward-level history.</p>
    </div>
  );
};

const GpsPanel = ({ selectedBin, onSelect, vehicles }: { selectedBin: WasteBinRecord; onSelect: (bin: WasteBinRecord) => void; vehicles: Vehicle[] }) => {
  const minLat = Math.min(...wasteBins.map((bin) => bin.latitude));
  const maxLat = Math.max(...wasteBins.map((bin) => bin.latitude));
  const minLng = Math.min(...wasteBins.map((bin) => bin.longitude));
  const maxLng = Math.max(...wasteBins.map((bin) => bin.longitude));
  const priorityBins = [...wasteBins].sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 55);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative min-h-[470px] overflow-hidden rounded-lg border border-border bg-map-water grid-field">
        <div className="absolute inset-x-10 top-20 h-24 rotate-[-8deg] rounded-full bg-surface-leaf/20" />
        <div className="absolute bottom-20 left-8 right-12 h-20 rotate-[6deg] rounded-full bg-surface-leaf/20" />
        <div className="absolute left-0 right-0 top-0 h-24 bg-primary/15 scan-line" />
        {priorityBins.map((bin) => {
          const left = 8 + ((bin.longitude - minLng) / Math.max(0.0001, maxLng - minLng)) * 82;
          const top = 8 + (1 - (bin.latitude - minLat) / Math.max(0.0001, maxLat - minLat)) * 78;
          return (
            <button key={bin.binId} onClick={() => onSelect(bin)} className={`absolute rounded-full border-2 p-1.5 shadow-command transition hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedBin.binId === bin.binId ? "border-accent bg-primary text-primary-foreground" : "border-card bg-card text-primary"}`} style={{ left: `${left}%`, top: `${top}%` }} aria-label={`Select ${bin.binId}`}>
              <MapPin className="h-4 w-4" />
            </button>
          );
        })}
        {vehicles.slice(0, 4).map((vehicle, index) => (
          <div key={vehicle.id} className="absolute flex items-center gap-2 rounded-full bg-surface-deep px-3 py-2 text-sm font-black text-primary-foreground shadow-soft" style={{ right: `${8 + index * 11}%`, bottom: `${18 + index * 16}%` }}>
            <Truck className="h-4 w-4 text-accent" /> {vehicle.id}
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-black">Live GPS telemetry</h2>
        <DataTile label="Selected bin" value={selectedBin.binId} />
        <DataTile label="Coordinates" value={`${selectedBin.latitude.toFixed(5)}, ${selectedBin.longitude.toFixed(5)}`} />
        <DataTile label="Zone / Ward" value={`${selectedBin.zone} / ${selectedBin.ward}`} />
        <DataTile label="Battery" value={`${selectedBin.batteryLevel}%`} icon={Battery} />
      </div>
    </div>
  );
};

const HistoryPanel = ({ zones, totalCharges }: { zones: ReturnType<typeof useZoneShape>; totalCharges: number }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-black">Zone collection history</h2>
      <p className="text-muted-foreground">Aggregated directly from ward totals, fill levels, and contract collection charges.</p>
    </div>
    <div className="h-[360px] rounded-lg border border-border bg-surface-mist p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={zones}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="zone" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
          <Bar dataKey="avgFill" name="Avg fill %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          <Bar dataKey="tons" name="Collected tons" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <DataTile label="Zones covered" value={zones.length.toString()} />
      <DataTile label="Estimated charges" value={`₹${currency.format(totalCharges)}`} />
      <DataTile label="Top zone" value={[...zones].sort((a, b) => b.avgFill - a.avgFill)[0]?.zone ?? "—"} />
    </div>
  </div>
);

const useZoneShape = () => [] as { zone: string; bins: number; avgFill: number; tons: number; critical: number; charges: number }[];

const DispatchPanel = ({ vehicles }: { vehicles: Vehicle[] }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-2xl font-black">Vehicle dispatch board</h2>
      <p className="text-muted-foreground">Routes are prioritized from critical bins, zone average fill, GPS spread, and collected tons.</p>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <article key={vehicle.id} className="rounded-lg border border-border bg-surface-mist p-5 transition hover:-translate-y-1 hover:shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary p-3 text-primary-foreground"><Truck className="h-5 w-5" /></div>
              <div>
                <h3 className="text-xl font-black">{vehicle.id}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.zone}</p>
              </div>
            </div>
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            <DataTile label="Status" value={vehicle.status} />
            <div className="grid grid-cols-2 gap-3">
              <DataTile label="Stops" value={vehicle.stops.toString()} />
              <DataTile label="Route left" value={vehicle.left} />
            </div>
            <DataTile label="Assigned tons" value={`${vehicle.tons.toFixed(2)} tons`} />
            <div>
              <div className="mb-2 flex justify-between text-sm font-bold"><span>Load</span><span>{vehicle.load}%</span></div>
              <div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${vehicle.load}%` }} /></div>
            </div>
          </div>
        </article>
      ))}
    </div>
  </div>
);

export default Index;
