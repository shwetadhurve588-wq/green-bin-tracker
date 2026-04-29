import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, BarChart3, Clock3, MapPin, Navigation, Recycle, Route, Satellite, Truck } from "lucide-react";

const bins = [
  { id: "BIN-104", area: "Riverside Market", fill: 86, rate: 7.8, lat: 40.72, lng: -73.99, vehicle: "EV-12", eta: "18 min", risk: "High" },
  { id: "BIN-219", area: "Old Mill Park", fill: 63, rate: 4.4, lat: 40.71, lng: -74.01, vehicle: "EV-08", eta: "44 min", risk: "Medium" },
  { id: "BIN-337", area: "Cedar Station", fill: 42, rate: 3.1, lat: 40.73, lng: -73.97, vehicle: "EV-12", eta: "1h 12m", risk: "Low" },
  { id: "BIN-418", area: "Harbor Walk", fill: 91, rate: 8.6, lat: 40.70, lng: -73.98, vehicle: "EV-03", eta: "9 min", risk: "Critical" },
  { id: "BIN-522", area: "North Campus", fill: 55, rate: 5.2, lat: 40.74, lng: -74.00, vehicle: "EV-08", eta: "57 min", risk: "Medium" },
];

const history = [
  { day: "Mon", actual: 52, predicted: 49 },
  { day: "Tue", actual: 61, predicted: 58 },
  { day: "Wed", actual: 68, predicted: 70 },
  { day: "Thu", actual: 74, predicted: 72 },
  { day: "Fri", actual: 88, predicted: 84 },
  { day: "Sat", actual: 92, predicted: 89 },
  { day: "Sun", actual: 77, predicted: 81 },
];

const vehicles = [
  { id: "EV-12", driver: "Ari Lane", load: 58, stops: 8, status: "Collecting", left: "12.4 km" },
  { id: "EV-08", driver: "Mina Ko", load: 34, stops: 5, status: "Rerouting", left: "8.1 km" },
  { id: "EV-03", driver: "Jon Reed", load: 71, stops: 11, status: "Urgent pickup", left: "17.8 km" },
];

const tabs = [
  { id: "predict", label: "Prediction", icon: BarChart3 },
  { id: "gps", label: "GPS Map", icon: Satellite },
  { id: "history", label: "History", icon: Clock3 },
  { id: "dispatch", label: "Dispatch", icon: Route },
] as const;

type TabId = (typeof tabs)[number]["id"];

const riskClass = (risk: string) =>
  risk === "Critical" ? "bg-danger text-destructive-foreground" : risk === "High" ? "bg-warning text-accent-foreground" : risk === "Medium" ? "bg-accent text-accent-foreground" : "bg-success text-primary-foreground";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("predict");
  const [selectedBin, setSelectedBin] = useState(bins[0]);

  const prediction = useMemo(() => {
    const hoursToFull = Math.max(0.4, (100 - selectedBin.fill) / selectedBin.rate);
    const confidence = Math.min(98, Math.round(84 + selectedBin.rate * 1.4));
    return { hoursToFull, confidence, projected: Math.min(100, Math.round(selectedBin.fill + selectedBin.rate * 6)) };
  }, [selectedBin]);

  const urgentBins = bins.filter((bin) => bin.fill >= 80).length;
  const averageFill = Math.round(bins.reduce((sum, bin) => sum + bin.fill, 0) / bins.length);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative bg-hero-gradient text-primary-foreground">
        <div className="absolute inset-0 grid-field opacity-30" aria-hidden="true" />
        <div className="container relative grid min-h-[420px] gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Recycle className="h-4 w-4" /> GreenBin Predictive Ops
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Predict bin waste levels before overflow.</h1>
              <p className="max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
                Historical fill trends, bin GPS, and vehicle telemetry combine into a working command center for smarter collection routes.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Average fill" value={`${averageFill}%`} icon={Activity} />
              <Metric label="Urgent bins" value={urgentBins.toString()} icon={AlertTriangle} />
              <Metric label="Vehicles live" value={vehicles.length.toString()} icon={Truck} />
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
                <p className="text-sm text-primary-foreground/70">{selectedBin.id} · {selectedBin.area}</p>
                <p className="mt-2 text-7xl font-black">{selectedBin.fill}%</p>
                <p className="mt-3 text-primary-foreground/75">Projected to reach {prediction.projected}% in 6 hours.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-surface-deep/55 p-4">
                  <p className="text-xs text-primary-foreground/60">Time to full</p>
                  <p className="text-2xl font-black">{prediction.hoursToFull.toFixed(1)}h</p>
                </div>
                <div className="rounded-md bg-surface-deep/55 p-4">
                  <p className="text-xs text-primary-foreground/60">Assigned vehicle</p>
                  <p className="text-2xl font-black">{selectedBin.vehicle}</p>
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
                  <h2 className="text-2xl font-black">Bin forecast queue</h2>
                  {bins.map((bin) => (
                    <button key={bin.id} onClick={() => setSelectedBin(bin)} className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedBin.id === bin.id ? "border-primary bg-surface-mist" : "border-border bg-card"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black">{bin.id}</p>
                          <p className="text-sm text-muted-foreground">{bin.area}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClass(bin.risk)}`}>{bin.risk}</span>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${bin.fill}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
                <ForecastPanel bin={selectedBin} projected={prediction.projected} hours={prediction.hoursToFull} confidence={prediction.confidence} />
              </div>
            )}

            {activeTab === "gps" && <GpsPanel selectedBin={selectedBin} onSelect={setSelectedBin} />}
            {activeTab === "history" && <HistoryPanel />}
            {activeTab === "dispatch" && <DispatchPanel />}
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

const ForecastPanel = ({ bin, projected, hours, confidence }: { bin: (typeof bins)[number]; projected: number; hours: number; confidence: number }) => (
  <div className="rounded-lg border border-border bg-surface-mist p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black">{bin.area}</h2>
        <p className="text-muted-foreground">GPS {bin.lat.toFixed(2)}, {bin.lng.toFixed(2)} · fill rate {bin.rate}%/h</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClass(bin.risk)}`}>{bin.risk}</span>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <DataTile label="Current level" value={`${bin.fill}%`} />
      <DataTile label="6h forecast" value={`${projected}%`} />
      <DataTile label="Overflow in" value={`${hours.toFixed(1)}h`} />
    </div>
    <div className="mt-6 h-[280px] rounded-lg border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history.map((point, index) => ({ ...point, predicted: Math.min(100, point.predicted + Math.round(bin.rate * index * 0.7)) }))}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
          <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={3} />
          <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.16)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-4 text-sm font-semibold text-muted-foreground">Model confidence: {confidence}% based on historical pickup cycles, fill velocity, and nearby route telemetry.</p>
  </div>
);

const DataTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-3xl font-black">{value}</p>
  </div>
);

const GpsPanel = ({ selectedBin, onSelect }: { selectedBin: (typeof bins)[number]; onSelect: (bin: (typeof bins)[number]) => void }) => (
  <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
    <div className="relative min-h-[470px] overflow-hidden rounded-lg border border-border bg-map-water grid-field">
      <div className="absolute inset-x-10 top-20 h-24 rotate-[-8deg] rounded-full bg-surface-leaf/20" />
      <div className="absolute bottom-20 left-8 right-12 h-20 rotate-[6deg] rounded-full bg-surface-leaf/20" />
      <div className="absolute left-0 right-0 top-0 h-24 bg-primary/15 scan-line" />
      {bins.map((bin, index) => (
        <button key={bin.id} onClick={() => onSelect(bin)} className={`absolute rounded-full border-4 p-2 shadow-command transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedBin.id === bin.id ? "border-accent bg-primary text-primary-foreground" : "border-card bg-card text-primary"}`} style={{ left: `${18 + index * 15}%`, top: `${24 + (index % 3) * 18}%` }} aria-label={`Select ${bin.id}`}>
          <MapPin className="h-6 w-6" />
        </button>
      ))}
      {vehicles.map((vehicle, index) => (
        <div key={vehicle.id} className="absolute flex items-center gap-2 rounded-full bg-surface-deep px-3 py-2 text-sm font-black text-primary-foreground shadow-soft" style={{ right: `${12 + index * 12}%`, bottom: `${22 + index * 15}%` }}>
          <Truck className="h-4 w-4 text-accent" /> {vehicle.id}
        </div>
      ))}
    </div>
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Live GPS telemetry</h2>
      <DataTile label="Selected bin" value={selectedBin.id} />
      <DataTile label="Coordinates" value={`${selectedBin.lat.toFixed(2)}, ${selectedBin.lng.toFixed(2)}`} />
      <DataTile label="Nearest vehicle" value={selectedBin.vehicle} />
      <DataTile label="Pickup ETA" value={selectedBin.eta} />
    </div>
  </div>
);

const HistoryPanel = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-black">Historical accuracy</h2>
      <p className="text-muted-foreground">Compare observed bin levels against model predictions by day.</p>
    </div>
    <div className="h-[360px] rounded-lg border border-border bg-surface-mist p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
          <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={3} />
          <Area type="monotone" dataKey="predicted" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.18)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <DataTile label="Mean accuracy" value="94.2%" />
      <DataTile label="Overflow prevented" value="31" />
      <DataTile label="Route km saved" value="148" />
    </div>
  </div>
);

const DispatchPanel = () => (
  <div className="space-y-5">
    <div>
      <h2 className="text-2xl font-black">Vehicle dispatch board</h2>
      <p className="text-muted-foreground">Prioritized routes generated from predicted fill level, GPS distance, and vehicle capacity.</p>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <article key={vehicle.id} className="rounded-lg border border-border bg-surface-mist p-5 transition hover:-translate-y-1 hover:shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary p-3 text-primary-foreground"><Truck className="h-5 w-5" /></div>
              <div>
                <h3 className="text-xl font-black">{vehicle.id}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.driver}</p>
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
