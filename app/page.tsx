"use client";

import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Crosshair,
  Gauge,
  Layers3,
  Map,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Siren,
  TriangleAlert,
  UsersRound,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";

type Severity = "critical" | "warning" | "watch";

type FloodAlert = {
  id: string;
  severity: Severity;
  title: string;
  district: string;
  detail: string;
  time: string;
  level: string;
  delta: string;
  people: number;
  x: number;
  y: number;
};

const alerts: FloodAlert[] = [
  {
    id: "FW-102",
    severity: "critical",
    title: "Moei River overflow",
    district: "Mae Sot",
    detail: "Water is above the evacuation trigger at station MS-04.",
    time: "8 min ago",
    level: "6.42 m",
    delta: "+0.28 m",
    people: 860,
    x: 42,
    y: 48,
  },
  {
    id: "FW-098",
    severity: "critical",
    title: "Creek overtopping",
    district: "Mae Ramat",
    detail: "Low-lying communities near the Moei tributaries are affected.",
    time: "19 min ago",
    level: "5.91 m",
    delta: "+0.16 m",
    people: 510,
    x: 45,
    y: 30,
  },
  {
    id: "FW-091",
    severity: "warning",
    title: "Rapid runoff rise",
    district: "Phop Phra",
    detail: "Mountain runoff is forecast to reach the warning threshold within 2 hours.",
    time: "34 min ago",
    level: "4.78 m",
    delta: "+0.21 m",
    people: 430,
    x: 46,
    y: 65,
  },
  {
    id: "FW-087",
    severity: "warning",
    title: "Flash flood and road closure",
    district: "Umphang",
    detail: "Local access roads are closed at three low-water crossings.",
    time: "51 min ago",
    level: "3.64 m",
    delta: "+0.12 m",
    people: 280,
    x: 49,
    y: 83,
  },
  {
    id: "FW-079",
    severity: "watch",
    title: "Ping River rainfall watch",
    district: "Ban Tak",
    detail: "88 mm is forecast across the upper catchment in 6 hours.",
    time: "1 hr ago",
    level: "4.11 m",
    delta: "+0.05 m",
    people: 380,
    x: 64,
    y: 35,
  },
];

const levelReadings = [42, 46, 49, 52, 57, 61, 66, 71, 76, 81, 86, 90];
const rainReadings = [10, 18, 12, 26, 36, 22, 44, 51, 41, 62, 54, 68];

const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  watch: "Watch",
};

const districts = [
  { name: "Mae Sot", risk: "critical", reading: "6.42 m", trend: "Rising", action: "Evacuating" },
  { name: "Mae Ramat", risk: "critical", reading: "5.91 m", trend: "Rising", action: "Response active" },
  { name: "Phop Phra", risk: "warning", reading: "4.78 m", trend: "Rising", action: "Preparing shelters" },
  { name: "Umphang", risk: "warning", reading: "3.64 m", trend: "Rising", action: "Road teams staged" },
  { name: "Ban Tak", risk: "watch", reading: "4.11 m", trend: "Stable", action: "Monitoring" },
  { name: "Tha Song Yang", risk: "watch", reading: "4.02 m", trend: "Stable", action: "Monitoring" },
  { name: "Mueang Tak", risk: "normal", reading: "3.36 m", trend: "Stable", action: "Routine watch" },
  { name: "Sam Ngao", risk: "normal", reading: "69%", trend: "Reservoir", action: "Routine watch" },
  { name: "Wang Chao", risk: "normal", reading: "2.88 m", trend: "Stable", action: "Routine watch" },
] as const;

const districtRiskLabel = {
  critical: "Critical",
  warning: "Warning",
  watch: "Watch",
  normal: "Normal",
};

export default function Home() {
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");
  const [mapLayer, setMapLayer] = useState<"warnings" | "rainfall" | "gauges">("warnings");
  const [selected, setSelected] = useState<FloodAlert | null>(alerts[0]);
  const [drawerAlert, setDrawerAlert] = useState<FloodAlert | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [bannerVisible, setBannerVisible] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("10:42");

  const filteredAlerts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return alerts.filter((alert) => {
      const severityMatch = severity === "all" || alert.severity === severity;
      const searchMatch =
        !normalized ||
        `${alert.title} ${alert.district} ${alert.id}`.toLowerCase().includes(normalized);
      return severityMatch && searchMatch;
    });
  }, [query, severity]);

  const acknowledge = (id: string) => {
    setAcknowledged((current) => new Set(current).add(id));
  };

  const refresh = () => {
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="Floodwatch overview">
          <span className="brand-mark"><Waves size={20} strokeWidth={2.4} /></span>
          <span>FLOODWATCH</span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="active" href="#overview">Overview</a>
          <a href="#alerts">Warnings <span className="nav-count">5</span></a>
          <a href="#districts">Districts</a>
          <a href="#telemetry">River levels</a>
        </nav>

        <div className="topbar-actions">
          <div className="system-state" aria-label="Monitoring systems online">
            <span className="live-dot" />
            <span>Systems online</span>
          </div>
          <button className="icon-button notification-button" aria-label="Open notifications" title="Notifications">
            <Bell size={19} />
            <span className="notification-dot">3</span>
          </button>
          <div className="operator-avatar" aria-label="Operations user">OP</div>
        </div>
      </header>

      <div className="page-content" id="overview">
        <div className="page-heading">
          <div>
            <p className="eyebrow">TAK PROVINCE</p>
            <h1>Tak flood operations</h1>
            <p className="heading-meta">
              <span>Friday, 10 July 2026</span>
              <span className="meta-separator" />
              <button className="refresh-button" onClick={refresh} type="button">
                <RefreshCw size={14} /> Updated {lastUpdated}
              </button>
              <span className="demo-badge">DEMO DATA</span>
            </p>
          </div>
          <button className="dispatch-button" type="button" onClick={() => setDrawerAlert(alerts[0])}>
            <Siren size={18} /> Open response plan
          </button>
        </div>

        {bannerVisible && (
          <section className="critical-banner" aria-label="Critical warning">
            <div className="critical-icon"><TriangleAlert size={21} /></div>
            <div className="critical-copy">
              <strong>Evacuation trigger reached in Mae Sot</strong>
              <span>The Moei River at MS-04 is 0.42 m above the critical threshold. Move Mae Pa and Tha Sai Luat residents to shelters.</span>
            </div>
            <div className="banner-actions">
              <button type="button" onClick={() => { acknowledge("banner"); setBannerVisible(false); }}>
                <Check size={16} /> Acknowledge
              </button>
              <button className="banner-close" type="button" aria-label="Dismiss warning" title="Dismiss" onClick={() => setBannerVisible(false)}>
                <X size={18} />
              </button>
            </div>
          </section>
        )}

        <section className="operations-grid">
          <div className="map-panel" aria-label="Flood warning map">
            <div className="map-toolbar">
              {(["warnings", "rainfall", "gauges"] as const).map((layer) => (
                <button
                  className={mapLayer === layer ? "active" : ""}
                  key={layer}
                  type="button"
                  onClick={() => setMapLayer(layer)}
                >
                  {layer === "warnings" && <ShieldAlert size={15} />}
                  {layer === "rainfall" && <CloudRain size={15} />}
                  {layer === "gauges" && <Gauge size={15} />}
                  {layer[0].toUpperCase() + layer.slice(1)}
                </button>
              ))}
            </div>

            <div className="map-canvas">
              <div className="map-tiles" aria-hidden="true">
                {["197/115", "198/115", "199/115", "197/116", "198/116", "199/116"].map((tile) => (
                  <img key={tile} src={`https://tile.openstreetmap.org/8/${tile}.png`} alt="" />
                ))}
              </div>
              <div className="map-wash" aria-hidden="true" />

              {mapLayer === "warnings" && (
                <>
                  <span className="risk-zone risk-zone-critical" aria-hidden="true" />
                  <span className="risk-zone risk-zone-warning" aria-hidden="true" />
                </>
              )}
              {mapLayer === "rainfall" && (
                <div className="rain-cells" aria-hidden="true">
                  <span /><span /><span /><span /><span />
                </div>
              )}
              {mapLayer === "gauges" && (
                <div className="gauge-markers" aria-hidden="true">
                  <span style={{ left: "20%", top: "34%" }}>4.2</span>
                  <span style={{ left: "43%", top: "55%" }}>5.8</span>
                  <span style={{ left: "67%", top: "40%" }}>5.1</span>
                  <span style={{ left: "77%", top: "68%" }}>3.9</span>
                </div>
              )}

              {mapLayer === "warnings" && alerts.map((alert) => (
                <button
                  className={`map-marker ${alert.severity} ${selected?.id === alert.id ? "selected" : ""}`}
                  key={alert.id}
                  style={{ left: `${alert.x}%`, top: `${alert.y}%` }}
                  type="button"
                  aria-label={`${severityLabel[alert.severity]} alert in ${alert.district}`}
                  onClick={() => setSelected(alert)}
                >
                  <MapPin size={17} fill="currentColor" />
                  <span>{alert.district}</span>
                </button>
              ))}

              <div className="map-controls">
                <button type="button" aria-label="Zoom in" title="Zoom in"><ZoomIn size={18} /></button>
                <button type="button" aria-label="Zoom out" title="Zoom out"><ZoomOut size={18} /></button>
                <button type="button" aria-label="Center map" title="Center map"><Crosshair size={18} /></button>
              </div>

              {selected && mapLayer === "warnings" && (
                <article className="map-callout">
                  <div className="callout-heading">
                    <span className={`severity-pill ${selected.severity}`}>{severityLabel[selected.severity]}</span>
                    <span>{selected.id}</span>
                  </div>
                  <strong>{selected.title}</strong>
                  <p>{selected.district} - {selected.level} <b>{selected.delta}</b></p>
                  <button type="button" onClick={() => setDrawerAlert(selected)}>
                    View details <ChevronRight size={15} />
                  </button>
                </article>
              )}

              <div className="map-legend">
                <span><i className="legend-dot critical" /> Critical</span>
                <span><i className="legend-dot warning" /> Warning</span>
                <span><i className="legend-dot watch" /> Watch</span>
              </div>
              <a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">(c) OpenStreetMap</a>
            </div>
          </div>

          <aside className="alerts-panel" id="alerts">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">ACTIVE INCIDENTS</span>
                <h2>Warnings <span>5</span></h2>
              </div>
              <button className="icon-button" type="button" aria-label="Alert options" title="Alert options">
                <Layers3 size={18} />
              </button>
            </div>

            <label className="search-field">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search location or ID" />
            </label>

            <div className="severity-tabs" aria-label="Filter alerts">
              {(["all", "critical", "warning", "watch"] as const).map((item) => (
                <button key={item} type="button" className={severity === item ? "active" : ""} onClick={() => setSeverity(item)}>
                  {item === "all" ? "All" : severityLabel[item]}
                </button>
              ))}
            </div>

            <div className="alert-list">
              {filteredAlerts.map((alert) => (
                <article className={`alert-row ${selected?.id === alert.id ? "selected" : ""}`} key={alert.id}>
                  <button className="alert-main" type="button" onClick={() => { setSelected(alert); setDrawerAlert(alert); }}>
                    <span className={`alert-indicator ${alert.severity}`} />
                    <span className="alert-content">
                      <span className="alert-topline">
                        <b>{alert.district}</b>
                        <small>{alert.time}</small>
                      </span>
                      <strong>{alert.title}</strong>
                      <span className="alert-reading"><Gauge size={14} /> {alert.level} <em>{alert.delta}</em></span>
                    </span>
                    <ChevronRight className="row-chevron" size={17} />
                  </button>
                  <button
                    className={`ack-button ${acknowledged.has(alert.id) ? "done" : ""}`}
                    type="button"
                    aria-label={acknowledged.has(alert.id) ? `${alert.id} acknowledged` : `Acknowledge ${alert.id}`}
                    title="Acknowledge"
                    onClick={() => acknowledge(alert.id)}
                  >
                    {acknowledged.has(alert.id) ? <CheckCircle2 size={16} /> : <BellRing size={16} />}
                  </button>
                </article>
              ))}
              {filteredAlerts.length === 0 && <p className="empty-state">No warnings match this filter.</p>}
            </div>
          </aside>
        </section>

        <section className="metric-strip" aria-label="Flood summary">
          <div className="metric">
            <span className="metric-icon red"><ShieldAlert size={19} /></span>
            <span><small>ACTIVE WARNINGS</small><strong>5</strong><em className="up">+1 today</em></span>
          </div>
          <div className="metric">
            <span className="metric-icon gold"><UsersRound size={19} /></span>
            <span><small>PEOPLE EXPOSED</small><strong>2,460</strong><em>5 districts</em></span>
          </div>
          <div className="metric">
            <span className="metric-icon teal"><Map size={19} /></span>
            <span><small>DISTRICTS MONITORED</small><strong>9 / 9</strong><em className="normal">Full coverage</em></span>
          </div>
          <div className="metric">
            <span className="metric-icon blue"><Route size={19} /></span>
            <span><small>ROAD DISRUPTIONS</small><strong>7</strong><em>2 major routes</em></span>
          </div>
        </section>

        <section className="lower-grid">
          <article className="telemetry-panel" id="telemetry">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">STATION MS-04 - MAE SOT</span>
                <h2>Moei River level</h2>
              </div>
              <div className="station-reading">
                <span>Current</span>
                <strong>6.42 m</strong>
                <em>+0.28 m / hr</em>
              </div>
            </div>

            <div className="chart-key">
              <span><i className="key-level" /> River level</span>
              <span><i className="key-rain" /> Rainfall</span>
              <span className="threshold-label"><i /> Critical 6.00 m</span>
            </div>

            <div className="telemetry-chart" aria-label="Moei River levels rising from 4.3 to 6.42 metres over twelve hours">
              <span className="chart-gridline line-1"><b>6.5 m</b></span>
              <span className="chart-gridline line-2"><b>5.5 m</b></span>
              <span className="chart-gridline line-3"><b>4.5 m</b></span>
              <span className="critical-line"><b>Critical</b></span>
              <div className="bar-series">
                {levelReadings.map((level, index) => (
                  <span className="level-column" key={index}>
                    <i className="rain-bar" style={{ height: `${rainReadings[index]}%` }} />
                    <i className={`level-bar ${index > 8 ? "critical" : ""}`} style={{ height: `${level}%` }} />
                  </span>
                ))}
              </div>
              <div className="chart-times"><span>23:00</span><span>03:00</span><span>07:00</span><span>10:00</span></div>
            </div>
          </article>

          <article className="district-panel" id="districts">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">PROVINCE COVERAGE</span>
                <h2>All district status</h2>
              </div>
              <span className="coverage-count">9 of 9 monitored</span>
            </div>

            <div className="district-table" role="table" aria-label="District readiness">
              <div className="district-row table-head" role="row">
                <span>District</span><span>Reading</span><span>Risk</span><span aria-hidden="true" />
              </div>
              {districts.map((district) => (
                <div className="district-row" role="row" key={district.name}>
                  <span>
                    <i className={`status-mark ${district.risk}`} />
                    <b>{district.name}</b>
                    <small>{district.action}</small>
                  </span>
                  <span>
                    <b>{district.reading}</b>
                    <small className={district.trend === "Rising" ? "rising" : "stable"}>{district.trend}</small>
                  </span>
                  <span><i className={`risk-badge ${district.risk}`}>{districtRiskLabel[district.risk]}</i></span>
                  <button type="button" aria-label={`Open ${district.name} details`}><ChevronRight size={17} /></button>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a className="active" href="#overview"><Map size={19} /><span>Overview</span></a>
        <a href="#alerts"><BellRing size={19} /><span>Warnings</span></a>
        <button type="button" onClick={() => setDrawerAlert(alerts[0])}><Siren size={20} /><span>Respond</span></button>
        <a href="#telemetry"><Gauge size={19} /><span>Telemetry</span></a>
      </nav>

      {drawerAlert && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setDrawerAlert(null);
        }}>
          <aside className="incident-drawer" role="dialog" aria-modal="true" aria-labelledby="incident-title">
            <div className="drawer-header">
              <div>
                <span className={`severity-pill ${drawerAlert.severity}`}>{severityLabel[drawerAlert.severity]}</span>
                <small>{drawerAlert.id} - {drawerAlert.time}</small>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawerAlert(null)} aria-label="Close incident details" title="Close">
                <X size={20} />
              </button>
            </div>
            <h2 id="incident-title">{drawerAlert.title}</h2>
            <p className="drawer-location"><MapPin size={16} /> {drawerAlert.district}, Tak Province</p>
            <p className="drawer-summary">{drawerAlert.detail}</p>

            <div className="drawer-stats">
              <span><small>River level</small><strong>{drawerAlert.level}</strong><em>{drawerAlert.delta}</em></span>
              <span><small>People exposed</small><strong>{drawerAlert.people.toLocaleString()}</strong><em>Estimate</em></span>
            </div>

            <div className="response-section">
              <div className="response-heading"><span>Response checklist</span><small>2 of 4 complete</small></div>
              <label><input type="checkbox" defaultChecked /><span>Notify district command centre</span></label>
              <label><input type="checkbox" defaultChecked /><span>Open evacuation shelters</span></label>
              <label><input type="checkbox" /><span>Dispatch transport to Mae Pa and Tha Sai Luat</span></label>
              <label><input type="checkbox" /><span>Confirm Route 12 traffic control</span></label>
            </div>

            <div className="drawer-actions">
              <button className="primary" type="button" onClick={() => acknowledge(drawerAlert.id)}>
                {acknowledged.has(drawerAlert.id) ? <><CheckCircle2 size={17} /> Acknowledged</> : <><BellRing size={17} /> Acknowledge warning</>}
              </button>
              <button type="button"><Navigation size={17} /> Dispatch team</button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
