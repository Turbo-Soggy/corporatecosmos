import * as THREE from 'three';
import { normalize } from './parseMetric';
import { domainFromUrl } from './logoTexture';
import { currencyCode, rankWithinCurrency } from './currency';

// ---------------------------------------------------------------------------
// Layout precompute. Runs ONCE (memoized) from parsed full_json. Produces three
// Float32Array(n*3) position buffers — galaxy, financial, geographic — plus a
// per-node metadata array the HUD reads. Nothing here runs per frame.
// ---------------------------------------------------------------------------

const REGION_KEYWORDS = [
  { region: 'India', test: /india|mumbai|bangalore|bengaluru|delhi|noida|gurgaon|gurugram|hyderabad|pune|chennai|kolkata/ },
  { region: 'North America', test: /united states|u\.s\.|usa|california|new york|san francisco|seattle|texas|boston|chicago|canada|toronto/ },
  { region: 'Europe', test: /ireland|dublin|london|united kingdom|u\.k\.|england|germany|berlin|munich|france|paris|netherlands|amsterdam|spain|sweden|switzerland|zurich/ },
  { region: 'APAC', test: /singapore|japan|tokyo|china|beijing|shanghai|hong kong|australia|sydney|korea|seoul|indonesia|jakarta|philippines/ },
  { region: 'MEA / LatAm', test: /dubai|uae|emirates|saudi|israel|tel aviv|africa|brazil|mexico|argentina/ },
];

const REGION_ORDER = ['India', 'North America', 'Europe', 'APAC', 'MEA / LatAm', 'Other'];

function regionOf(company) {
  const hay = `${company.headquarters_address ?? ''} ${company.office_locations ?? ''} ${company.operating_countries ?? ''}`.toLowerCase();
  for (const { region, test } of REGION_KEYWORDS) if (test.test(hay)) return region;
  return 'Other';
}

// Deterministic pseudo-random so layouts are stable between reloads.
function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildLayouts(companies) {
  const n = companies.length;
  const galaxy = new Float32Array(n * 3);
  const financial = new Float32Array(n * 3);
  const geographic = new Float32Array(n * 3);
  const scale = new Float32Array(n); // per-node base radius, data-driven
  const rand = mulberry(1337);

  // --- Parsed numeric metrics (already computed once in formatCompanyData) ---
  const pick = (m) => (Number.isFinite(m) ? m : NaN);
  const valuation = companies.map((c) =>
    Number.isFinite(c.metrics.valuation)
      ? c.metrics.valuation
      : Number.isFinite(c.metrics.revenue)
        ? c.metrics.revenue
        : pick(c.metrics.capital)
  );
  const valuationCurrencies = companies.map((c) => c.metricCurrencies?.valuation || currencyCode(c.valuation));
  const growth = companies.map((c) => c.metrics.growth);
  const offices = companies.map((c) => c.metrics.offices);

  // Currency magnitudes are not comparable. The financial X axis is a
  // within-currency percentile, never an implicit FX conversion.
  const valN = rankWithinCurrency(valuation, valuationCurrencies);
  const growN = normalize(growth);
  const offN = normalize(offices);

  // Node size encodes market weight: valuation first, employee size as fallback.
  const employees = companies.map((c) => c.metrics.employees);
  const sizeMetric = valuation.map((v, i) => (Number.isFinite(v) ? v : employees[i]));
  const sizeN = normalize(sizeMetric);

  // --- Region grouping ---
  const regions = companies.map(regionOf);
  const regionCenters = {};
  REGION_ORDER.forEach((r, i) => {
    const a = (i / REGION_ORDER.length) * Math.PI * 2;
    regionCenters[r] = new THREE.Vector3(Math.cos(a) * 34, 0, Math.sin(a) * 34);
  });

  const GALAXY_R = 24;
  for (let i = 0; i < n; i++) {
    // 1) GALAXY — Fibonacci sphere with a touch of radial noise.
    const t = (i + 0.5) / n;
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = GALAXY_R * (0.82 + rand() * 0.18);
    galaxy[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    galaxy[i * 3 + 1] = Math.cos(phi) * r * 0.7;
    galaxy[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

    // 2) FINANCIAL AXIS — X by valuation, Y by growth, slight Z jitter.
    financial[i * 3] = (valN[i] - 0.5) * 82;
    financial[i * 3 + 1] = (growN[i] - 0.5) * 34;
    financial[i * 3 + 2] = (rand() - 0.5) * 10;

    // 3) GEOGRAPHIC CLUSTERS — scatter inside region pocket, lift by offices.
    const c = regionCenters[regions[i]];
    const sa = rand() * Math.PI * 2;
    const sr = Math.sqrt(rand()) * 8;
    geographic[i * 3] = c.x + Math.cos(sa) * sr;
    geographic[i * 3 + 1] = (offN[i] - 0.5) * 18 + (rand() - 0.5) * 4;
    geographic[i * 3 + 2] = c.z + Math.sin(sa) * sr;

    // Market leaders are physically larger (0.7x .. 2.3x).
    scale[i] = 0.7 + sizeN[i] * 1.6;
  }

  const meta = companies.map((c, i) => ({
    index: i,
    name: c.short_name || c.name,
    fullName: c.name,
    category: c.category,
    sector: c.sector,
    region: regions[i],
    valuation: valuation[i], // number, for sorting/scale
    valuationCurrency: valuationCurrencies[i],
    valuationDisplay: c.display.valuation, // cleaned string, for HUD
    growthDisplay: c.display.yoy_growth_rate,
    estimated: c.estimated,
    logoUrl: c.logo_url ?? null, // raw, may be multi-URL/SVG — resolved in logoTexture
    domain: domainFromUrl(c.website_url), // derived; null if unparseable (no `domain` field)
  }));

  // Region tallies (+ pocket centers) for the geographic-phase HUD card and grid rings.
  const regionCounts = REGION_ORDER.map((r) => ({
    region: r,
    count: regions.filter((x) => x === r).length,
    x: regionCenters[r].x,
    z: regionCenters[r].z,
  })).filter((x) => x.count > 0);

  return { galaxy, financial, geographic, scale, meta, regionCounts, count: n };
}
