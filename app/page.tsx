"use client";

import {
  Bell,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Crosshair,
  Database,
  ExternalLink,
  Gauge,
  Info,
  Map,
  MapPin,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Thermometer,
  TriangleAlert,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Severity = "critical" | "warning";

type WaterStation = {
  id: string;
  code: string;
  name: string;
  district: string;
  river: string;
  observedAt: string;
  levelMsl: number;
  previousLevelMsl: number;
  bankDistanceM: number;
  bankDistanceText: string;
  situationLevel: number;
  storagePercent: number;
  latitude: number;
  longitude: number;
  agency: string;
};

type RainStation = {
  id: string;
  code: string;
  name: string;
  district: string;
  observedAt: string;
  rainfall1hMm: number;
  rainfall24hMm: number;
  latitude: number;
  longitude: number;
  agency: string;
};

type WeatherStation = {
  code: string;
  name: string;
  observedAt: string;
  temperatureC: number;
  humidityPercent: number;
  rainfallMm: number;
  rainfall24hMm: number;
  windSpeedKmh: number;
  latitude: number;
  longitude: number;
};

type SourceStatus = {
  id: string;
  name: string;
  shortName: string;
  url: string;
  mode: string;
  status: "connected" | "unavailable";
  updatedAt: string | null;
};

type GovernmentData = {
  generatedAt: string;
  weather: { stations: WeatherStation[]; observedAt: string | null; sourceUrl: string } | null;
  water: {
    stations: WaterStation[];
    rainfallStations: RainStation[];
    flaggedCount: number;
    observedAt: string | null;
    sourceUrl: string;
  } | null;
  roads: {
    records: Array<{ id: string; title: string; road: string; date: string; passable: boolean; floodHeightCm: number }>;
    recordCount: number;
    blockedCount: number;
    archiveYear: number;
    sourceUrl: string;
  } | null;
  ddpm: {
    shelterCount: number;
    totalCapacity: number;
    districts: Array<{ district: string; count: number }>;
    datasetUpdatedAt: string;
    sourceUrl: string;
  } | null;
  sources: SourceStatus[];
};

type LiveAlert = {
  id: string;
  severity: Severity;
  title: string;
  district: string;
  detail: string;
  time: string;
  level: string;
  delta: string;
  x: number;
  y: number;
  station: WaterStation;
};

const districtDefinitions = [
  { name: "Mae Sot", apiName: "Mae Sot District" },
  { name: "Umphang", apiName: "Umphang District" },
  { name: "Tha Song Yang", apiName: "Tha Song Yang District" },
  { name: "Mae Ramat", apiName: "Mae Ramat District" },
  { name: "Phop Phra", apiName: "Phop Phra District" },
] as const;

function mapPosition(latitude: number, longitude: number) {
  const x = Math.min(90, Math.max(10, ((longitude - 97.75) / (99.2 - 97.75)) * 100));
  const y = Math.min(90, Math.max(10, (1 - (latitude - 15.75) / (17.85 - 15.75)) * 100));
  return { x, y };
}

function formatFeedTime(value?: string | null) {
  if (!value) return "Not reported";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.replace("T", " ").slice(0, 16);
  return value;
}

function levelLabel(level: number) {
  if (level >= 5) return "Level 5";
  if (level >= 4) return "Level 4";
  if (level >= 3) return "Level 3";
  if (level > 0) return `Level ${level}`;
  return "No level";
}

export default function Home() {
  const [data, setData] = useState<GovernmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");
  const [mapLayer, setMapLayer] = useState<"warnings" | "rainfall" | "gauges">("warnings");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  const loadGovernmentData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/government-data", { cache: "no-store" });
      if (!response.ok) throw new Error("Government feed request failed");
      const nextData = await response.json() as GovernmentData;
      setData(nextData);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGovernmentData();
  }, [loadGovernmentData]);

  const alerts = useMemo<LiveAlert[]>(() => {
    return (data?.water?.stations ?? [])
      .filter((station) => station.situationLevel >= 4)
      .map((station) => {
        const position = mapPosition(station.latitude, station.longitude);
        const change = station.levelMsl - station.previousLevelMsl;
        return {
          id: station.code,
          severity: station.situationLevel >= 5 ? "critical" : "warning",
          title: station.situationLevel >= 5 ? "Very high water situation" : "High water situation",
          district: station.district.replace(" District", ""),
          detail: station.bankDistanceM >= 0
            ? `${station.bankDistanceM.toFixed(2)} m below the reported bank level`
            : `${Math.abs(station.bankDistanceM).toFixed(2)} m above the reported bank level`,
          time: formatFeedTime(station.observedAt),
          level: `${station.levelMsl.toFixed(2)} m MSL`,
          delta: `${change >= 0 ? "+" : ""}${change.toFixed(2)} m`,
          x: position.x,
          y: position.y,
          station,
        };
      });
  }, [data]);

  const selected = alerts.find((alert) => alert.id === selectedId) ?? alerts[0] ?? null;
  const drawerAlert = alerts.find((alert) => alert.id === drawerId) ?? null;

  const filteredAlerts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return alerts.filter((alert) => {
      const severityMatch = severity === "all" || alert.severity === severity;
      const searchMatch = !normalized || `${alert.title} ${alert.district} ${alert.id}`.toLowerCase().includes(normalized);
      return severityMatch && searchMatch;
    });
  }, [alerts, query, severity]);

  const districtRows = useMemo(() => {
    const waterStations = data?.water?.stations ?? [];
    const rainStations = data?.water?.rainfallStations ?? [];
    return districtDefinitions.map((district) => {
      const districtWater = waterStations.filter((station) => station.district === district.apiName);
      const districtRain = rainStations.filter((station) => station.district === district.apiName);
      const maximumLevel = districtWater.reduce((maximum, station) => Math.max(maximum, station.situationLevel), 0);
      const maximumRain = districtRain.reduce((maximum, station) => Math.max(maximum, station.rainfall24hMm), 0);
      return { ...district, gaugeCount: districtWater.length, rainCount: districtRain.length, maximumLevel, maximumRain };
    });
  }, [data]);

  const connectedCount = data?.sources.filter((source) => source.status === "connected").length ?? 0;
  const maximumRainStation = data?.water?.rainfallStations?.[0] ?? null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="Floodwatch overview">
          <span className="brand-mark"><Waves size={20} strokeWidth={2.4} /></span>
          <span>FLOODWATCH</span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="active" href="#overview">Overview</a>
          <a href="#alerts">Water flags <span className="nav-count">{alerts.length}</span></a>
          <a href="#districts">Districts</a>
          <a href="#sources">Sources</a>
        </nav>

        <div className="topbar-actions">
          <div className="system-state" aria-label={`${connectedCount} of 4 official sources connected`}>
            <span className={connectedCount === 4 ? "live-dot" : "live-dot partial"} />
            <span>{connectedCount}/4 official sources</span>
          </div>
          <button className="icon-button notification-button" aria-label="Open data notices" title="Data notices">
            <Bell size={19} />
            {alerts.length > 0 && <span className="notification-dot">{alerts.length}</span>}
          </button>
          <div className="operator-avatar" aria-label="Tak Province">TAK</div>
        </div>
      </header>

      <div className="page-content" id="overview">
        <div className="page-heading">
          <div>
            <p className="eyebrow">FIVE WESTERN TAK DISTRICTS - OFFICIAL GOVERNMENT FEEDS</p>
            <h1>Western Tak flood monitoring</h1>
            <p className="heading-meta">
              <span>Generated {data ? new Date(data.generatedAt).toLocaleString() : "when feeds respond"}</span>
              <span className="meta-separator" />
              <span className="official-badge">NO DEMO READINGS</span>
            </p>
          </div>
          <button className="dispatch-button" type="button" onClick={() => void loadGovernmentData()} disabled={loading}>
            <RefreshCw className={loading ? "spinning" : ""} size={18} /> {loading ? "Refreshing" : "Refresh official data"}
          </button>
        </div>

        {loading && (
          <section className="feed-banner neutral" aria-live="polite">
            <RefreshCw className="spinning" size={20} />
            <div><strong>Loading official government feeds</strong><span>TMD, ThaiWater, DRR, and DDPM are being checked independently.</span></div>
          </section>
        )}

        {!loading && loadError && (
          <section className="feed-banner unavailable" role="alert">
            <TriangleAlert size={20} />
            <div><strong>Official feeds could not be reached</strong><span>No cached demonstration values are being shown. Refresh to try again.</span></div>
          </section>
        )}

        {!loading && !loadError && alerts.length > 0 && bannerVisible && (
          <section className="critical-banner high-banner" aria-label="Official water level notice">
            <div className="critical-icon"><TriangleAlert size={21} /></div>
            <div className="critical-copy">
              <strong>{alerts.length} Tak station{alerts.length === 1 ? "" : "s"} returned ThaiWater situation level 4 or higher</strong>
              <span>This is a feed-based monitoring flag, not an evacuation order. Confirm the latest agency bulletin before field action.</span>
            </div>
            <div className="banner-actions">
              <a className="source-link-button" href={data?.water?.sourceUrl} target="_blank" rel="noreferrer">Open ThaiWater <ExternalLink size={14} /></a>
              <button className="banner-close" type="button" aria-label="Dismiss notice" title="Dismiss" onClick={() => setBannerVisible(false)}><X size={18} /></button>
            </div>
          </section>
        )}

        {!loading && !loadError && alerts.length === 0 && (
          <section className="feed-banner connected">
            <CheckCircle2 size={20} />
            <div><strong>No level 4-5 Tak water stations returned</strong><span>This is not an all-clear. Continue checking TMD, ThaiWater, DDPM, and local authority notices.</span></div>
          </section>
        )}

        <section className="operations-grid">
          <div className="map-panel" aria-label="Tak official monitoring map">
            <div className="map-toolbar">
              <button className={mapLayer === "warnings" ? "active" : ""} type="button" onClick={() => setMapLayer("warnings")}>
                <ShieldAlert size={15} /> Water flags
              </button>
              <button className={mapLayer === "rainfall" ? "active" : ""} type="button" onClick={() => setMapLayer("rainfall")}>
                <CloudRain size={15} /> Rainfall
              </button>
              <button className={mapLayer === "gauges" ? "active" : ""} type="button" onClick={() => setMapLayer("gauges")}>
                <Gauge size={15} /> All gauges
              </button>
            </div>

            <div className="map-canvas">
              <div className="map-tiles" aria-hidden="true">
                {["197/114", "198/114", "199/114", "197/115", "198/115", "199/115"].map((tile) => (
                  <img key={tile} src={`https://tile.openstreetmap.org/8/${tile}.png`} alt="" />
                ))}
              </div>
              <div className="map-wash" aria-hidden="true" />

              {mapLayer === "warnings" && alerts.map((alert) => (
                <button
                  className={`map-marker ${alert.severity} ${selected?.id === alert.id ? "selected" : ""}`}
                  key={alert.id}
                  style={{ left: `${alert.x}%`, top: `${alert.y}%` }}
                  type="button"
                  aria-label={`${alert.title} at ${alert.station.name}`}
                  onClick={() => setSelectedId(alert.id)}
                >
                  <MapPin size={17} fill="currentColor" /><span>{alert.district}</span>
                </button>
              ))}

              {mapLayer === "rainfall" && (data?.water?.rainfallStations ?? []).slice(0, 20).map((station) => {
                const position = mapPosition(station.latitude, station.longitude);
                return (
                  <button className="map-marker rainfall" key={station.id} style={{ left: `${position.x}%`, top: `${position.y}%` }} type="button" title={`${station.rainfall24hMm} mm in 24h`}>
                    <CloudRain size={16} /><span>{station.rainfall24hMm} mm</span>
                  </button>
                );
              })}

              {mapLayer === "gauges" && (data?.water?.stations ?? []).map((station) => {
                const position = mapPosition(station.latitude, station.longitude);
                return (
                  <button className={`map-marker ${station.situationLevel >= 5 ? "critical" : station.situationLevel >= 4 ? "warning" : "watch"}`} key={station.id} style={{ left: `${position.x}%`, top: `${position.y}%` }} type="button" title={`${station.name}: ${levelLabel(station.situationLevel)}`}>
                    <Gauge size={16} /><span>{station.name}</span>
                  </button>
                );
              })}

              {mapLayer === "warnings" && !loading && alerts.length === 0 && (
                <div className="map-empty"><CheckCircle2 size={22} /><strong>No level 4-5 stations</strong><span>Based on the latest ThaiWater response.</span></div>
              )}

              <div className="map-controls">
                <button type="button" aria-label="Zoom in" title="Zoom in"><ZoomIn size={18} /></button>
                <button type="button" aria-label="Zoom out" title="Zoom out"><ZoomOut size={18} /></button>
                <button type="button" aria-label="Center map" title="Center map"><Crosshair size={18} /></button>
              </div>

              {selected && mapLayer === "warnings" && (
                <article className="map-callout">
                  <div className="callout-heading"><span className={`severity-pill ${selected.severity}`}>{levelLabel(selected.station.situationLevel)}</span><span>{selected.id}</span></div>
                  <strong>{selected.station.name}</strong>
                  <p>{selected.district} - {selected.level}</p>
                  <button type="button" onClick={() => setDrawerId(selected.id)}>View source details <ChevronRight size={15} /></button>
                </article>
              )}

              <div className="map-legend">
                <span><i className="legend-dot critical" /> Level 5</span>
                <span><i className="legend-dot warning" /> Level 4</span>
                <span><i className="legend-dot watch" /> Level 1-3</span>
              </div>
              <a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">(c) OpenStreetMap</a>
            </div>
          </div>

          <aside className="alerts-panel" id="alerts">
            <div className="panel-heading">
              <div><span className="panel-kicker">THAIWATER LIVE FEED</span><h2>High water flags <span>{alerts.length}</span></h2></div>
              <a className="icon-button" href={data?.water?.sourceUrl ?? "https://www.thaiwater.net/"} target="_blank" rel="noreferrer" aria-label="Open ThaiWater" title="Open ThaiWater"><ExternalLink size={18} /></a>
            </div>

            <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search station or district" /></label>

            <div className="severity-tabs compact" aria-label="Filter water flags">
              <button type="button" className={severity === "all" ? "active" : ""} onClick={() => setSeverity("all")}>All</button>
              <button type="button" className={severity === "critical" ? "active" : ""} onClick={() => setSeverity("critical")}>Level 5</button>
              <button type="button" className={severity === "warning" ? "active" : ""} onClick={() => setSeverity("warning")}>Level 4</button>
            </div>

            <div className="alert-list live-list">
              {filteredAlerts.map((alert) => (
                <article className={`alert-row ${selected?.id === alert.id ? "selected" : ""}`} key={alert.id}>
                  <button className="alert-main" type="button" onClick={() => { setSelectedId(alert.id); setDrawerId(alert.id); }}>
                    <span className={`alert-indicator ${alert.severity}`} />
                    <span className="alert-content">
                      <span className="alert-topline"><b>{alert.station.name}</b><small>{alert.time}</small></span>
                      <strong>{alert.district} - {levelLabel(alert.station.situationLevel)}</strong>
                      <span className="alert-reading"><Gauge size={14} /> {alert.level} <em>{alert.delta}</em></span>
                    </span>
                    <ChevronRight className="row-chevron" size={17} />
                  </button>
                </article>
              ))}
              {!loading && filteredAlerts.length === 0 && <p className="empty-state">No official water flags match this filter.</p>}
            </div>

            <div className="weather-summary">
              <div className="weather-summary-heading"><span>TMD observations</span><small>{data?.weather?.stations.length ?? 0} target-area stations</small></div>
              {(data?.weather?.stations ?? []).slice(0, 3).map((station) => (
                <div className="weather-row" key={station.code}>
                  <span><b>{station.name}</b><small>{formatFeedTime(station.observedAt)}</small></span>
                  <span><Thermometer size={13} /> {station.temperatureC.toFixed(1)} C</span>
                  <span><CloudRain size={13} /> {station.rainfall24hMm.toFixed(1)} mm</span>
                </div>
              ))}
              {!data?.weather && !loading && <p className="source-unavailable-copy">TMD feed unavailable.</p>}
            </div>
          </aside>
        </section>

        <section className="metric-strip" aria-label="Official flood monitoring summary">
          <div className="metric"><span className="metric-icon red"><ShieldAlert size={19} /></span><span><small>WATER LEVEL FLAGS</small><strong>{data?.water?.flaggedCount ?? "-"}</strong><em>ThaiWater level 4-5</em></span></div>
          <div className="metric"><span className="metric-icon gold"><CloudRain size={19} /></span><span><small>MAXIMUM RAIN 24H</small><strong>{maximumRainStation ? `${maximumRainStation.rainfall24hMm.toFixed(1)} mm` : "-"}</strong><em>{maximumRainStation?.name ?? "No feed"}</em></span></div>
          <div className="metric"><span className="metric-icon teal"><Gauge size={19} /></span><span><small>FIVE-DISTRICT GAUGES</small><strong>{data?.water?.stations.length ?? "-"}</strong><em>{formatFeedTime(data?.water?.observedAt)}</em></span></div>
          <div className="metric"><span className="metric-icon blue"><Building2 size={19} /></span><span><small>DDPM SHELTER RECORDS</small><strong>{data?.ddpm?.shelterCount ?? "-"}</strong><em>Dataset: Aug 2024</em></span></div>
        </section>

        <section className="source-status-strip" id="sources" aria-label="Official source status">
          <div className="source-title"><Database size={18} /><span><strong>Official sources</strong><small>Each feed is checked independently</small></span></div>
          {(data?.sources ?? []).map((source) => (
            <a className="source-item" href={source.url} target="_blank" rel="noreferrer" key={source.id}>
              <span className={`source-state ${source.status}`} />
              <span>
                <strong>{source.shortName}</strong>
                <small>
                  {source.mode}
                  {source.id === "tmd" && data?.weather ? ` - ${data.weather.stations.length} target-area stations` : ""}
                  {source.id === "thaiwater" && data?.water ? ` - ${data.water.stations.length} target-area gauges` : ""}
                  {source.id === "roads" && data?.roads ? ` - ${data.roads.recordCount} target-area archive records` : ""}
                  {source.id === "ddpm" && data?.ddpm ? ` - ${data.ddpm.shelterCount} target-area shelter records` : ""}
                </small>
              </span>
              <ExternalLink size={14} />
            </a>
          ))}
        </section>

        <section className="lower-grid">
          <article className="telemetry-panel" id="telemetry">
            <div className="section-heading">
              <div><span className="panel-kicker">LATEST THAIWATER RESPONSE</span><h2>Five-district water gauges</h2></div>
              <span className="coverage-count">{data?.water?.stations.length ?? 0} stations</span>
            </div>

            <div className="live-gauge-list">
              <div className="live-gauge-row gauge-head"><span>Station</span><span>Level</span><span>Bank distance</span><span>Status</span></div>
              {(data?.water?.stations ?? []).slice(0, 9).map((station) => (
                <div className="live-gauge-row" key={station.id}>
                  <span><b>{station.name}</b><small>{station.district.replace(" District", "")} - {formatFeedTime(station.observedAt)}</small></span>
                  <span><b>{station.levelMsl.toFixed(2)} m</b><small>MSL</small></span>
                  <span><b>{station.bankDistanceM.toFixed(2)} m</b><small>{station.bankDistanceText || "Reported difference"}</small></span>
                  <span><i className={`risk-badge ${station.situationLevel >= 5 ? "critical" : station.situationLevel >= 4 ? "warning" : station.situationLevel >= 3 ? "watch" : "normal"}`}>{levelLabel(station.situationLevel)}</i></span>
                </div>
              ))}
              {!data?.water && !loading && <p className="empty-state">ThaiWater feed unavailable. No substitute values are shown.</p>}
            </div>
          </article>

          <article className="district-panel" id="districts">
            <div className="section-heading">
              <div><span className="panel-kicker">FIVE TARGET DISTRICTS</span><h2>Feed coverage</h2></div>
              <span className="coverage-count">5 districts checked</span>
            </div>

            <div className="district-table" role="table" aria-label="Official feed coverage for the five target districts">
              <div className="district-row table-head" role="row"><span>District</span><span>Rain 24h</span><span>Water</span><span aria-hidden="true" /></div>
              {districtRows.map((district) => (
                <div className="district-row" role="row" key={district.name}>
                  <span><i className={`status-mark ${district.maximumLevel >= 5 ? "critical" : district.maximumLevel >= 4 ? "warning" : district.gaugeCount ? "normal" : "unavailable"}`} /><b>{district.name}</b><small>{district.rainCount} rain / {district.gaugeCount} water stations</small></span>
                  <span><b>{district.rainCount ? `${district.maximumRain.toFixed(1)} mm` : "-"}</b><small>{district.rainCount ? "Maximum" : "No station"}</small></span>
                  <span><i className={`risk-badge ${district.maximumLevel >= 5 ? "critical" : district.maximumLevel >= 4 ? "warning" : district.maximumLevel >= 3 ? "watch" : district.gaugeCount ? "normal" : "unavailable"}`}>{district.gaugeCount ? levelLabel(district.maximumLevel) : "No gauge"}</i></span>
                  <a href={data?.water?.sourceUrl ?? "https://www.thaiwater.net/"} target="_blank" rel="noreferrer" aria-label={`Open ThaiWater for ${district.name}`}><ExternalLink size={15} /></a>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="data-caveat">
          <Info size={17} />
          <p><strong>Operational use:</strong> Feed values can be delayed, missing, or revised by the source agency. The DRR road dataset shown in source status is a 2022 archive, not current road passability. For current highway conditions use the official DOH hotline 1586 and agency bulletins.</p>
        </section>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a className="active" href="#overview"><Map size={19} /><span>Overview</span></a>
        <a href="#alerts"><BellRing size={19} /><span>Water flags</span></a>
        <a href="#districts"><Gauge size={19} /><span>Districts</span></a>
        <a href="#sources"><Database size={19} /><span>Sources</span></a>
      </nav>

      {drawerAlert && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDrawerId(null); }}>
          <aside className="incident-drawer" role="dialog" aria-modal="true" aria-labelledby="incident-title">
            <div className="drawer-header">
              <div><span className={`severity-pill ${drawerAlert.severity}`}>{levelLabel(drawerAlert.station.situationLevel)}</span><small>{drawerAlert.id} - {drawerAlert.time}</small></div>
              <button className="icon-button" type="button" onClick={() => setDrawerId(null)} aria-label="Close station details" title="Close"><X size={20} /></button>
            </div>
            <h2 id="incident-title">{drawerAlert.station.name}</h2>
            <p className="drawer-location"><MapPin size={16} /> {drawerAlert.district}, Tak Province</p>
            <p className="drawer-summary">ThaiWater reports {drawerAlert.detail}. The situation level is supplied by the source feed and should be checked against the latest agency bulletin.</p>

            <div className="drawer-stats">
              <span><small>Water level</small><strong>{drawerAlert.level}</strong><em>{drawerAlert.delta} from previous</em></span>
              <span><small>Bank distance</small><strong>{drawerAlert.station.bankDistanceM.toFixed(2)} m</strong><em>{drawerAlert.station.bankDistanceText || "Source value"}</em></span>
            </div>

            <div className="official-detail-list">
              <span><small>Source agency</small><b>{drawerAlert.station.agency}</b></span>
              <span><small>Observed</small><b>{drawerAlert.time}</b></span>
              <span><small>River</small><b>{drawerAlert.station.river}</b></span>
              <span><small>Situation code</small><b>{drawerAlert.station.situationLevel}</b></span>
            </div>

            <div className="data-caveat compact"><Info size={16} /><p>Do not issue evacuation or road-closure instructions from this dashboard alone. Confirm with DDPM and the responsible local authority.</p></div>

            <div className="drawer-actions">
              <a className="primary" href={data?.water?.sourceUrl ?? "https://www.thaiwater.net/"} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Open ThaiWater</a>
              <button type="button" onClick={() => setDrawerId(null)}>Close details</button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
