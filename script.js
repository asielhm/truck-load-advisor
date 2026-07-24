const CONFIG = {
  localLoadsFile: "loads.json",
  localCitiesFile: "cities.json",
  syncFunctionName: "sync-load-sources"
};

const STORAGE_KEYS = {
  profile: "truckLoadAdvisorOperatingProfile"
};

const SUPABASE_URL = "https://iirptoelyjunzvzoudcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SNS4H3Y85BLrYAoYvsttVA_V4GYPMvc";
const APP_URL = "https://asielhm.github.io/truck-load-advisor/";

if (!window.supabase?.createClient) {
  throw new Error("Supabase could not be loaded from the CDN.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

const elements = {
  loadList: document.getElementById("loadList"),
  resultCount: document.getElementById("resultCount"),
  searchForm: document.getElementById("searchForm"),
  origin: document.getElementById("origin"),
  destination: document.getElementById("destination"),
  originSuggestions: document.getElementById("originSuggestions"),
  destinationSuggestions: document.getElementById("destinationSuggestions"),
  equipment: document.getElementById("equipment"),
  minRate: document.getElementById("minRate"),
  costPerMile: document.getElementById("costPerMile"),
  maxDeadhead: document.getElementById("maxDeadhead"),
  preferredEquipment: document.getElementById("preferredEquipment"),
  sortBy: document.getElementById("sortBy"),
  loginButton: document.getElementById("loginButton"),
  signupButton: document.getElementById("signupButton"),
  sidebarSignupButton: document.getElementById("sidebarSignupButton"),
  accountChip: document.getElementById("accountChip"),
  accountName: document.getElementById("accountName"),
  accountInitials: document.getElementById("accountInitials"),
  sidebarAccountState: document.getElementById("sidebarAccountState"),
  authModal: document.getElementById("authModal"),
  closeAuthModal: document.getElementById("closeAuthModal"),
  registerTab: document.getElementById("registerTab"),
  signinTab: document.getElementById("signinTab"),
  registerPanel: document.getElementById("registerPanel"),
  signinPanel: document.getElementById("signinPanel"),
  registerForm: document.getElementById("registerForm"),
  signinForm: document.getElementById("signinForm"),
  registerMessage: document.getElementById("registerMessage"),
  signinMessage: document.getElementById("signinMessage"),
  selectedPlan: document.getElementById("selectedPlan"),
  loadModal: document.getElementById("loadModal"),
  closeLoadModal: document.getElementById("closeLoadModal"),
  loadModalContent: document.getElementById("loadModalContent"),
  heroDataMode: document.getElementById("heroDataMode"),
  searchDataMode: document.getElementById("searchDataMode"),
  adminNavLink: document.getElementById("adminNavLink"),
  adminSection: document.getElementById("admin"),
  adminLoadForm: document.getElementById("adminLoadForm"),
  adminLoadId: document.getElementById("adminLoadId"),
  adminFormTitle: document.getElementById("adminFormTitle"),
  cancelLoadEdit: document.getElementById("cancelLoadEdit"),
  adminSourceName: document.getElementById("adminSourceName"),
  adminSourceLoadId: document.getElementById("adminSourceLoadId"),
  adminOrigin: document.getElementById("adminOrigin"),
  adminDestination: document.getElementById("adminDestination"),
  adminCityList: document.getElementById("adminCityList"),
  adminEquipment: document.getElementById("adminEquipment"),
  adminGrossRate: document.getElementById("adminGrossRate"),
  adminWeight: document.getElementById("adminWeight"),
  adminLoadedMiles: document.getElementById("adminLoadedMiles"),
  adminDeadheadMiles: document.getElementById("adminDeadheadMiles"),
  adminTolls: document.getElementById("adminTolls"),
  adminPickupAt: document.getElementById("adminPickupAt"),
  adminDeliveryAt: document.getElementById("adminDeliveryAt"),
  adminBrokerName: document.getElementById("adminBrokerName"),
  adminBrokerMc: document.getElementById("adminBrokerMc"),
  adminDestinationQuality: document.getElementById("adminDestinationQuality"),
  adminStatus: document.getElementById("adminStatus"),
  adminExpiresAt: document.getElementById("adminExpiresAt"),
  saveAdminLoadButton: document.getElementById("saveAdminLoadButton"),
  adminLoadMessage: document.getElementById("adminLoadMessage"),
  adminLoadList: document.getElementById("adminLoadList"),
  adminLoadCount: document.getElementById("adminLoadCount"),
  refreshAdminLoads: document.getElementById("refreshAdminLoads"),
  syncProvidersButton: document.getElementById("syncProvidersButton"),
  providerGrid: document.getElementById("providerGrid"),
  providerSyncMessage: document.getElementById("providerSyncMessage")
};

let demoLoads = [];
let allLoads = [];
let activeLoads = [];
let cities = [];
let locations = [];
let locationLookup = new Map();
let activeLoadMap = null;
let currentUser = null;
let currentProfile = null;
let currentDataMode = "demo";
let profileSaveTimer = null;
let loadsRealtimeChannel = null;
let autocompleteState = {
  origin: { index: -1, matches: [] },
  destination: { index: -1, matches: [] }
};

function currency(value) {
  return new Intl.NumberFormat(window.TLA_I18N?.getLocale() || "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value, fallback = "Appointment pending") {
  if (!value) return window.TLA_I18N?.translateString(fallback) || fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return window.TLA_I18N?.translateString(fallback) || fallback;
  return date.toLocaleString(window.TLA_I18N?.getLocale() || "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

const CANADIAN_PROVINCES = new Set([
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
]);

function splitLocation(value) {
  const parts = String(value || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { city: "", state: "", country: "" };
  }

  let country = parts.length >= 3 ? parts.pop().toUpperCase() : "";
  const state = (parts.pop() || "").toUpperCase();
  const city = parts.join(", ");

  if (!country) country = CANADIAN_PROVINCES.has(state) ? "CA" : "US";

  return { city, state, country };
}

function formatLocation(city, state, country = "US") {
  return [city, state, country].filter(Boolean).join(", ");
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return response.json();
}

function setDataMode(mode) {
  currentDataMode = mode;
  const isLive = mode === "live";
  const text = isLive ? "Online loads" : "Demo data";
  elements.heroDataMode.textContent = text;
  elements.searchDataMode.textContent = text;
  elements.heroDataMode.classList.toggle("live-pill", isLive);
  elements.searchDataMode.classList.toggle("live-pill", isLive);
  elements.heroDataMode.classList.toggle("demo-pill", !isLive);
  elements.searchDataMode.classList.toggle("demo-pill", !isLive);
}

async function loadBaseData() {
  try {
    const [loadedLoads, loadedCities] = await Promise.all([
      fetchJson(CONFIG.localLoadsFile),
      fetchJson(CONFIG.localCitiesFile)
    ]);

    demoLoads = Array.isArray(loadedLoads) ? loadedLoads : [];
    locations = (Array.isArray(loadedCities) ? loadedCities : [])
      .map(item => {
        if (typeof item === "string") {
          const parsed = splitLocation(item);
          return {
            label: item,
            city: parsed.city,
            region: parsed.state,
            country: parsed.country,
            lat: null,
            lon: null
          };
        }

        return {
          label: item.label,
          city: item.city,
          region: item.region,
          country: item.country,
          lat: Number(item.lat),
          lon: Number(item.lon)
        };
      })
      .filter(item => item.label);

    cities = locations.map(item => item.label);
    locationLookup = new Map(
      locations.map(item => [normalizeSearch(item.label), item])
    );
    rebuildCitySearchIndex();

    elements.adminCityList.innerHTML = cities
      .map(city => `<option value="${escapeHtml(city)}"></option>`)
      .join("");

    demoLoads = demoLoads.map(enrichLoadCoordinates);

    useDemoLoads();
  } catch (error) {
    console.error(error);
    elements.resultCount.textContent = "The local data files could not be loaded.";
    elements.loadList.innerHTML = `
      <div class="error-state">
        <strong>Data files are missing.</strong>
        <div>Upload <code>loads.json</code> and <code>cities.json</code> to the same GitHub folder.</div>
      </div>
    `;
  }
}

function useDemoLoads() {
  allLoads = demoLoads.map(enrichLoadCoordinates);
  activeLoads = [...allLoads];
  setDataMode("demo");
  render();
}

function mapDatabaseLoad(row) {
  const origin = formatLocation(
    row.origin_city,
    row.origin_state,
    row.origin_country || "US"
  );
  const destination = formatLocation(
    row.destination_city,
    row.destination_state,
    row.destination_country || "US"
  );
  const originLocation = resolveLocation(origin);
  const destinationLocation = resolveLocation(destination);

  return {
    id: row.id,
    source: row.source_name,
    sourceLoadId: row.source_load_id,
    sourceUrl: row.source_url || "",
    status: row.status || "available",
    origin,
    destination,
    originLat: finiteCoordinate(row.origin_lat) ?? finiteCoordinate(originLocation?.lat),
    originLon: finiteCoordinate(row.origin_lon) ?? finiteCoordinate(originLocation?.lon),
    destinationLat:
      finiteCoordinate(row.destination_lat) ?? finiteCoordinate(destinationLocation?.lat),
    destinationLon:
      finiteCoordinate(row.destination_lon) ?? finiteCoordinate(destinationLocation?.lon),
    equipment: row.equipment,
    gross: Number(row.gross_rate || 0),
    loadedMiles: Number(row.loaded_miles || 0),
    deadhead: Number(row.deadhead_miles || 0),
    weight: row.weight_lbs
      ? `${Number(row.weight_lbs).toLocaleString(window.TLA_I18N?.getLocale() || "en-US")} lb`
      : "Weight not listed",
    pickup: formatDate(row.pickup_at),
    delivery: formatDate(row.delivery_at),
    pickupAt: row.pickup_at,
    deliveryAt: row.delivery_at,
    destinationQuality: Number(row.destination_quality ?? 70),
    tolls: Number(row.tolls || 0),
    broker: row.broker_name || "Broker not listed",
    brokerMc: row.broker_mc_number || "",
    expiresAt: row.expires_at,
    isOnline: true
  };
}

async function loadOnlineLoads() {
  if (!currentUser) {
    useDemoLoads();
    return;
  }

  const { data, error } = await supabaseClient
    .from("loads")
    .select("*")
    .order("pickup_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Could not load online freight:", error);
    useDemoLoads();
    return;
  }

  const onlineLoads = (data || []).map(mapDatabaseLoad);
  if (onlineLoads.length) {
    allLoads = onlineLoads;
    activeLoads = [...onlineLoads];
    setDataMode("live");
    render();
  } else {
    useDemoLoads();
  }
}

function subscribeToLoadChanges() {
  if (loadsRealtimeChannel) {
    supabaseClient.removeChannel(loadsRealtimeChannel);
    loadsRealtimeChannel = null;
  }

  if (!currentUser) return;

  loadsRealtimeChannel = supabaseClient
    .channel("public-loads-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "loads" },
      () => {
        loadOnlineLoads();
        if (currentProfile?.is_admin) loadAdminLoads();
      }
    )
    .subscribe();
}

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

let citySearchIndex = [];

function rebuildCitySearchIndex() {
  citySearchIndex = locations.map(location => {
    const normalized = normalizeSearch(location.label);
    const cityName = normalizeSearch(location.city || location.label.split(",")[0]);
    return {
      ...location,
      normalized,
      cityName
    };
  });
}

function resolveLocation(label) {
  return locationLookup.get(normalizeSearch(label)) || null;
}

function finiteCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function enrichLoadCoordinates(load) {
  const originLocation = resolveLocation(load.origin);
  const destinationLocation = resolveLocation(load.destination);

  return {
    ...load,
    originLat:
      finiteCoordinate(load.originLat) ??
      finiteCoordinate(load.origin_lat) ??
      finiteCoordinate(originLocation?.lat),
    originLon:
      finiteCoordinate(load.originLon) ??
      finiteCoordinate(load.origin_lon) ??
      finiteCoordinate(originLocation?.lon),
    destinationLat:
      finiteCoordinate(load.destinationLat) ??
      finiteCoordinate(load.destination_lat) ??
      finiteCoordinate(destinationLocation?.lat),
    destinationLon:
      finiteCoordinate(load.destinationLon) ??
      finiteCoordinate(load.destination_lon) ??
      finiteCoordinate(destinationLocation?.lon)
  };
}

function cityMatches(query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return cities.slice(0, 12);

  const queryTokens = normalized.split(/\s+/).filter(Boolean);
  const prefix = [];
  const wordPrefix = [];
  const contains = [];

  for (const item of citySearchIndex) {
    if (!queryTokens.every(token => item.normalized.includes(token))) continue;

    if (item.cityName.startsWith(normalized) || item.normalized.startsWith(normalized)) {
      if (prefix.length < 12) prefix.push(item.label);
      continue;
    }

    const words = item.normalized.split(/[\s,.-]+/);
    if (queryTokens.every(token => words.some(word => word.startsWith(token)))) {
      if (wordPrefix.length < 12) wordPrefix.push(item.label);
      continue;
    }

    if (contains.length < 12) contains.push(item.label);
  }

  return [...prefix, ...wordPrefix, ...contains].slice(0, 12);
}

function highlightMatch(city, query) {
  const normalized = String(query || "").trim();
  if (!normalized) return escapeHtml(city);

  const index = city.toLowerCase().indexOf(normalized.toLowerCase());
  if (index < 0) return escapeHtml(city);

  return (
    escapeHtml(city.slice(0, index)) +
    `<mark>${escapeHtml(city.slice(index, index + normalized.length))}</mark>` +
    escapeHtml(city.slice(index + normalized.length))
  );
}

function setupAutocomplete(input, menu, key) {
  const state = autocompleteState[key];

  const close = () => {
    menu.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
    state.index = -1;
  };

  const choose = city => {
    input.value = city;
    close();
    filterLoads();
  };

  const renderSuggestions = () => {
    const query = input.value;
    state.matches = cityMatches(query);
    state.index = -1;

    if (!state.matches.length) {
      menu.innerHTML = `<div class="autocomplete-empty">No matching city found</div>`;
    } else {
      menu.innerHTML = state.matches
        .map(
          (city, index) => `
            <button
              class="autocomplete-option"
              type="button"
              role="option"
              data-index="${index}"
              data-city="${escapeHtml(city)}"
            >${highlightMatch(city, query)}</button>
          `
        )
        .join("");
    }

    menu.classList.add("open");
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("input", renderSuggestions);
  input.addEventListener("focus", renderSuggestions);

  input.addEventListener("keydown", event => {
    if (!menu.classList.contains("open")) return;
    const options = [...menu.querySelectorAll(".autocomplete-option")];
    if (!options.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.index = Math.min(state.index + 1, options.length - 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      state.index = Math.max(state.index - 1, 0);
    } else if (event.key === "Enter" && state.index >= 0) {
      event.preventDefault();
      choose(state.matches[state.index]);
      return;
    } else if (event.key === "Escape") {
      close();
      return;
    } else {
      return;
    }

    options.forEach((option, index) => option.classList.toggle("active", index === state.index));
    options[state.index]?.scrollIntoView({ block: "nearest" });
  });

  menu.addEventListener("click", event => {
    const option = event.target.closest(".autocomplete-option");
    if (!option) return;
    choose(option.dataset.city);
  });

  document.addEventListener("click", event => {
    if (!input.contains(event.target) && !menu.contains(event.target)) close();
  });
}

function calculateLoad(load) {
  const costPerMile = Math.max(Number(elements.costPerMile.value) || 0, 0);
  const totalMiles = Number(load.loadedMiles || 0) + Number(load.deadhead || 0);
  const estimatedCost = totalMiles * costPerMile + Number(load.tolls || 0);
  const profit = Number(load.gross || 0) - estimatedCost;
  const grossPerTotalMile = totalMiles > 0 ? Number(load.gross || 0) / totalMiles : 0;
  const netPerTotalMile = totalMiles > 0 ? profit / totalMiles : 0;
  const deadheadPenalty = Math.min((Number(load.deadhead || 0) / 180) * 20, 20);
  const profitScore = Math.min(Math.max((netPerTotalMile / 1.6) * 45, 0), 45);
  const marketScore = ((Number(load.destinationQuality || 50)) / 100) * 25;
  const rateScore = Math.min((grossPerTotalMile / 3.2) * 20, 20);
  const equipmentBonus =
    elements.preferredEquipment.value &&
    load.equipment === elements.preferredEquipment.value ? 5 : 0;

  const score = Math.round(
    Math.max(
      0,
      Math.min(100, 10 + profitScore + marketScore + rateScore + equipmentBonus - deadheadPenalty)
    )
  );

  return {
    ...load,
    totalMiles,
    estimatedCost,
    profit,
    grossPerTotalMile,
    netPerTotalMile,
    score
  };
}

function recommendationData(load) {
  if (load.score >= 80) {
    return {
      label: "Recommended",
      className: "",
      reason: `Strong estimated return, ${load.deadhead} deadhead miles, and a favorable destination market.`
    };
  }

  if (load.score >= 62) {
    return {
      label: "Review",
      className: "review",
      reason: "Potentially useful, but review deadhead, appointment details, and destination conditions."
    };
  }

  return {
    label: "Low score",
    className: "avoid",
    reason: "The estimated margin or destination outlook may not justify this trip under your current profile."
  };
}

function loadCard(load) {
  const recommendation = recommendationData(load);
  const sourceLabel = load.isOnline ? load.source : `${load.source} · Demo`;

  return `
    <article class="load-card">
      <div class="load-card-main">
        <div class="route-block">
          <div class="route-line">
            <div class="route-city">
              <strong>${escapeHtml(load.origin)}</strong>
              <span>${escapeHtml(load.pickup)}</span>
            </div>
            <span class="arrow">→</span>
            <div class="route-city">
              <strong>${escapeHtml(load.destination)}</strong>
              <span>Destination score ${Number(load.destinationQuality || 0)}/100</span>
            </div>
          </div>

          <div class="load-meta">
            <span class="tag">${escapeHtml(load.equipment)}</span>
            <span class="tag">${escapeHtml(load.weight)}</span>
            <span class="tag">${escapeHtml(sourceLabel)}</span>
            <span class="tag">${escapeHtml(load.status)}</span>
          </div>
        </div>

        <div class="metric">
          <span>Gross rate</span>
          <strong>${currency(load.gross)}</strong>
        </div>

        <div class="metric">
          <span>Total miles</span>
          <strong>${load.totalMiles.toLocaleString()} mi</strong>
        </div>

        <div class="metric">
          <span>Est. profit</span>
          <strong class="positive">${currency(load.profit)}</strong>
        </div>

        <div class="recommendation ${recommendation.className}">
          <div class="recommendation-score">${load.score}</div>
          <strong>${recommendation.label}</strong>
        </div>
      </div>

      <div class="load-card-footer">
        <div class="reason">
          ${recommendation.reason}
          Gross per total mile: <strong>$${load.grossPerTotalMile.toFixed(2)}</strong>.
          Net per total mile: <strong>$${load.netPerTotalMile.toFixed(2)}</strong>.
        </div>
        <button class="view-button" type="button" data-load-id="${load.id}">
          View details
        </button>
      </div>
    </article>
  `;
}

function sortLoads(loadsToSort) {
  const sorted = [...loadsToSort];
  if (elements.sortBy.value === "profit") sorted.sort((a, b) => b.profit - a.profit);
  if (elements.sortBy.value === "rate") sorted.sort((a, b) => b.gross - a.gross);
  if (elements.sortBy.value === "deadhead") sorted.sort((a, b) => a.deadhead - b.deadhead);
  if (elements.sortBy.value === "score") sorted.sort((a, b) => b.score - a.score);
  return sorted;
}

function render() {
  const calculated = activeLoads.map(calculateLoad);
  const maxDeadhead = Math.max(Number(elements.maxDeadhead.value) || 0, 0);
  const eligible = calculated.filter(load => load.deadhead <= maxDeadhead);
  const sorted = sortLoads(eligible);
  const type = currentDataMode === "live" ? "online" : "demonstration";

  elements.resultCount.textContent =
    `${sorted.length} ${type} load${sorted.length === 1 ? "" : "s"} match your filters`;

  if (!sorted.length) {
    elements.loadList.innerHTML = `
      <div class="empty-state">
        <strong>No loads match these filters.</strong>
        <div>Try another city, equipment type, rate, or deadhead limit.</div>
      </div>
    `;
    return;
  }

  elements.loadList.innerHTML = sorted.map(loadCard).join("");
}

function filterLoads() {
  const origin = normalizeSearch(elements.origin.value);
  const destination = normalizeSearch(elements.destination.value);
  const equipment = elements.equipment.value;
  const minRate = Number(elements.minRate.value) || 0;

  activeLoads = allLoads.filter(load => {
    const originMatch = !origin || load.origin.toLowerCase().includes(origin);
    const destinationMatch = !destination || load.destination.toLowerCase().includes(destination);
    const equipmentMatch = !equipment || load.equipment === equipment;
    const rateMatch = Number(load.gross || 0) >= minRate;
    return originMatch && destinationMatch && equipmentMatch && rateMatch;
  });

  render();
}

function localProfileValues() {
  return {
    operating_cost_per_mile: Number(elements.costPerMile.value) || 1.55,
    max_deadhead: Number(elements.maxDeadhead.value) || 150,
    preferred_equipment: elements.preferredEquipment.value || null
  };
}

function saveLocalOperatingProfile() {
  localStorage.setItem(
    STORAGE_KEYS.profile,
    JSON.stringify({
      costPerMile: elements.costPerMile.value,
      maxDeadhead: elements.maxDeadhead.value,
      preferredEquipment: elements.preferredEquipment.value
    })
  );
}

async function saveOperatingProfile() {
  saveLocalOperatingProfile();
  if (!currentUser) return;

  window.clearTimeout(profileSaveTimer);
  profileSaveTimer = window.setTimeout(async () => {
    const { error } = await supabaseClient
      .from("driver_profiles")
      .upsert(
        {
          user_id: currentUser.id,
          ...localProfileValues(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (error) console.error("Could not save operating profile:", error);
  }, 350);
}

function restoreLocalOperatingProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || "null");
    if (!profile) return;
    elements.costPerMile.value = profile.costPerMile ?? "1.55";
    elements.maxDeadhead.value = profile.maxDeadhead ?? "150";
    elements.preferredEquipment.value = profile.preferredEquipment ?? "";
  } catch (error) {
    console.warn("Could not restore local operating profile", error);
  }
}

async function loadRemoteOperatingProfile() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("driver_profiles")
    .select("operating_cost_per_mile, max_deadhead, preferred_equipment")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load operating profile:", error);
    return;
  }

  if (!data) {
    await saveOperatingProfile();
    return;
  }

  elements.costPerMile.value = data.operating_cost_per_mile ?? "1.55";
  elements.maxDeadhead.value = data.max_deadhead ?? "150";
  elements.preferredEquipment.value = data.preferred_equipment ?? "";
  saveLocalOperatingProfile();
  render();
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");
}

async function ensureProfile(user) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select(
      "id, full_name, company_name, role, equipment, plan, subscription_status, trial_ends_at, is_admin"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.error("Could not load account profile:", error);
  if (data) return data;

  const metadata = user.user_metadata || {};
  const fallback = {
    id: user.id,
    full_name: metadata.full_name || user.email?.split("@")[0] || "TruckLoad user",
    company_name: metadata.company_name || null,
    role: metadata.role || "Owner-operator",
    equipment: metadata.equipment || "Dry Van",
    plan: metadata.plan || "Pro"
  };

  const { data: inserted, error: insertError } = await supabaseClient
    .from("profiles")
    .upsert(fallback, { onConflict: "id" })
    .select(
      "id, full_name, company_name, role, equipment, plan, subscription_status, trial_ends_at, is_admin"
    )
    .single();

  if (insertError) {
    console.error("Could not create account profile:", insertError);
    return { ...fallback, subscription_status: "trialing", trial_ends_at: null, is_admin: false };
  }

  return inserted;
}

function trialText(profile) {
  if (!profile?.trial_ends_at) return profile?.subscription_status || "Account active";
  const end = new Date(profile.trial_ends_at);
  const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
  if (profile.subscription_status === "trialing") {
    return `${days} trial day${days === 1 ? "" : "s"} remaining`;
  }
  return profile.subscription_status || "Account active";
}

function updateAdminVisibility() {
  const isAdmin = Boolean(currentProfile?.is_admin);
  elements.adminSection.classList.toggle("hidden", !isAdmin);
  elements.adminNavLink.classList.toggle("hidden", !isAdmin);

  if (isAdmin) {
    loadAdminLoads();
    loadProviderStatuses();
  }
}

async function updateAccountUi() {
  if (!currentUser) {
    currentProfile = null;
    elements.loginButton.classList.remove("hidden");
    elements.signupButton.classList.remove("hidden");
    elements.accountChip.classList.add("hidden");
    elements.adminSection.classList.add("hidden");
    elements.adminNavLink.classList.add("hidden");
    elements.sidebarAccountState.innerHTML = `
      <p>Create an account to save your profile securely and access online loads.</p>
      <button class="text-button" id="sidebarSignupDynamic" type="button">Create account →</button>
    `;
    document
      .getElementById("sidebarSignupDynamic")
      ?.addEventListener("click", () => openAuth("register"));
    return;
  }

  currentProfile = await ensureProfile(currentUser);
  const fullName =
    currentProfile?.full_name ||
    currentUser.user_metadata?.full_name ||
    currentUser.email?.split("@")[0] ||
    "Account";

  elements.loginButton.classList.add("hidden");
  elements.signupButton.classList.add("hidden");
  elements.accountChip.classList.remove("hidden");
  elements.accountName.textContent = fullName;
  elements.accountInitials.textContent = initials(fullName) || "TA";

  elements.sidebarAccountState.innerHTML = `
    <p><strong>${escapeHtml(fullName)}</strong></p>
    <p>${escapeHtml(currentProfile?.role || "User")} · ${escapeHtml(currentProfile?.plan || "Pro")} plan</p>
    <p>${escapeHtml(currentUser.email || "")}</p>
    <p>${escapeHtml(trialText(currentProfile))}</p>
    ${currentProfile?.is_admin ? "<p><strong>Administrator</strong></p>" : ""}
    <button class="text-button" id="signOutButton" type="button">Sign out →</button>
  `;

  document.getElementById("signOutButton")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
  });

  if (currentProfile?.equipment) elements.preferredEquipment.value = currentProfile.equipment;

  await loadRemoteOperatingProfile();
  updateAdminVisibility();
}

async function handleSession(session) {
  currentUser = session?.user || null;
  await updateAccountUi();
  await loadOnlineLoads();
  subscribeToLoadChanges();
}

async function initializeAuth() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.error("Could not restore Supabase session:", error);
  await handleSession(data?.session || null);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => handleSession(session), 0);
  });
}

function openModal(modal) {
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function switchAuthPanel(mode) {
  const isRegister = mode === "register";
  elements.registerTab.classList.toggle("active", isRegister);
  elements.signinTab.classList.toggle("active", !isRegister);
  elements.registerPanel.classList.toggle("hidden", !isRegister);
  elements.signinPanel.classList.toggle("hidden", isRegister);
  elements.registerMessage.textContent = "";
  elements.signinMessage.textContent = "";
}

function openAuth(mode = "register", plan = null) {
  switchAuthPanel(mode);
  if (plan) elements.selectedPlan.value = plan;
  openModal(elements.authModal);
}

function coordinatesAvailable(load) {
  return [
    load.originLat,
    load.originLon,
    load.destinationLat,
    load.destinationLon
  ].every(value => Number.isFinite(Number(value)));
}

function googleMapsUrl(load) {
  const origin = coordinatesAvailable(load)
    ? `${load.originLat},${load.originLon}`
    : load.origin;
  const destination = coordinatesAvailable(load)
    ? `${load.destinationLat},${load.destinationLon}`
    : load.destination;

  return (
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    "&travelmode=driving"
  );
}

function appleMapsUrl(load) {
  const source = coordinatesAvailable(load)
    ? `${load.originLat},${load.originLon}`
    : load.origin;
  const destination = coordinatesAvailable(load)
    ? `${load.destinationLat},${load.destinationLon}`
    : load.destination;

  return (
    "https://maps.apple.com/directions" +
    `?source=${encodeURIComponent(source)}` +
    `&destination=${encodeURIComponent(destination)}` +
    "&mode=driving"
  );
}

function destroyActiveMap() {
  if (!activeLoadMap) return;
  activeLoadMap.remove();
  activeLoadMap = null;
}

function renderLoadMap(load) {
  destroyActiveMap();

  const container = document.getElementById("loadRouteMap");
  if (!container || !coordinatesAvailable(load) || !window.L) return;

  const origin = [Number(load.originLat), Number(load.originLon)];
  const destination = [Number(load.destinationLat), Number(load.destinationLon)];

  activeLoadMap = L.map(container, {
    scrollWheelZoom: false,
    zoomControl: true
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(activeLoadMap);

  const originMarker = L.circleMarker(origin, {
    radius: 9,
    weight: 3,
    color: "#ffffff",
    fillColor: "#1478f2",
    fillOpacity: 1
  }).addTo(activeLoadMap);

  const destinationMarker = L.circleMarker(destination, {
    radius: 9,
    weight: 3,
    color: "#ffffff",
    fillColor: "#139764",
    fillOpacity: 1
  }).addTo(activeLoadMap);

  originMarker.bindPopup(
    `<strong>${escapeHtml(window.TLA_I18N?.translateString("Origin") || "Origin")}</strong><br>` +
    escapeHtml(load.origin)
  );

  destinationMarker.bindPopup(
    `<strong>${escapeHtml(window.TLA_I18N?.translateString("Destination") || "Destination")}</strong><br>` +
    escapeHtml(load.destination)
  );

  const referenceLine = L.polyline([origin, destination], {
    weight: 4,
    opacity: 0.72,
    dashArray: "9 8",
    color: "#536a7d"
  }).addTo(activeLoadMap);

  activeLoadMap.fitBounds(referenceLine.getBounds(), {
    padding: [36, 36],
    maxZoom: 9
  });

  window.setTimeout(() => activeLoadMap?.invalidateSize(), 120);
}

function showLoadDetails(loadId) {
  const rawLoad = allLoads.find(load => String(load.id) === String(loadId));
  if (!rawLoad) return;

  const load = calculateLoad(enrichLoadCoordinates(rawLoad));
  const recommendation = recommendationData(load);
  const hasCoordinates = coordinatesAvailable(load);

  const sourceAction =
    load.isOnline && load.sourceUrl
      ? `<a class="button button-primary full-button" href="${escapeHtml(load.sourceUrl)}" target="_blank" rel="noopener">Open original source</a>`
      : "";

  const mapMarkup = hasCoordinates
    ? `
      <section class="load-map-section">
        <div class="load-map-heading">
          <div>
            <h3>Route map</h3>
            <p>Geographic reference only — not truck-specific routing.</p>
          </div>
        </div>
        <div id="loadRouteMap" class="load-route-map" aria-label="Route map"></div>
        <div class="load-map-legend">
          <span class="map-legend-item"><span class="map-legend-dot map-origin-dot"></span>Origin marker</span>
          <span class="map-legend-item"><span class="map-legend-dot map-destination-dot"></span>Destination marker</span>
          <span class="map-legend-item"><span class="map-legend-dot map-route-dot"></span>Straight reference line</span>
        </div>
        <div class="map-actions">
          <a
            class="map-action-button"
            href="${escapeHtml(googleMapsUrl(load))}"
            target="_blank"
            rel="noopener"
          >Open in Google Maps</a>
          <a
            class="map-action-button"
            href="${escapeHtml(appleMapsUrl(load))}"
            target="_blank"
            rel="noopener"
          >Open in Apple Maps</a>
        </div>
      </section>
    `
    : `
      <section class="load-map-section">
        <div class="map-unavailable">
          <strong>Map unavailable</strong><br>
          Coordinates are not available for this load. Edit and save the load again using a location from the city list.
        </div>
      </section>
    `;

  elements.loadModalContent.innerHTML = `
    <p class="eyebrow dark-eyebrow">${load.isOnline ? "Online load" : "Demonstration load"}</p>
    <h2 id="loadModalTitle">${escapeHtml(load.origin)} to ${escapeHtml(load.destination)}</h2>
    <p class="modal-copy">
      Source: ${escapeHtml(load.source)} · Original reference: ${escapeHtml(load.sourceLoadId)}
    </p>

    <div class="load-detail-route">
      <div>
        <strong>${escapeHtml(load.origin)}</strong>
        <span>${escapeHtml(load.pickup)}</span>
      </div>
      <div class="route-arrow">→</div>
      <div>
        <strong>${escapeHtml(load.destination)}</strong>
        <span>${escapeHtml(load.delivery)}</span>
      </div>
    </div>

    <div class="load-detail-grid">
      <div class="detail-box"><span>Gross rate</span><strong>${currency(load.gross)}</strong></div>
      <div class="detail-box"><span>Estimated cost</span><strong>${currency(load.estimatedCost)}</strong></div>
      <div class="detail-box"><span>Estimated profit</span><strong>${currency(load.profit)}</strong></div>
      <div class="detail-box"><span>Loaded miles</span><strong>${load.loadedMiles} mi</strong></div>
      <div class="detail-box"><span>Deadhead</span><strong>${load.deadhead} mi</strong></div>
      <div class="detail-box"><span>Recommendation</span><strong>${load.score}/100</strong></div>
    </div>

    ${mapMarkup}

    <div class="detail-warning">
      ${escapeHtml(recommendation.reason)}
      Verify the original source, broker authority, insurance requirements, appointments, and rate confirmation before accepting freight.
    </div>
    ${sourceAction}
  `;

  openModal(elements.loadModal);

  if (hasCoordinates) {
    window.setTimeout(() => renderLoadMap(load), 80);
  }
}

function adminLoadPayload() {
  const origin = splitLocation(elements.adminOrigin.value);
  const destination = splitLocation(elements.adminDestination.value);
  const originLocation = resolveLocation(elements.adminOrigin.value);
  const destinationLocation = resolveLocation(elements.adminDestination.value);

  if (
    !origin.city || !origin.state || !origin.country ||
    !destination.city || !destination.state || !destination.country
  ) {
    throw new Error("Origin and destination must use the format City, ST, Country.");
  }

  if (!originLocation || !destinationLocation) {
    throw new Error(
      "Select origin and destination from the location list so their map coordinates can be saved."
    );
  }

  return {
    source_name: elements.adminSourceName.value.trim(),
    source_load_id: elements.adminSourceLoadId.value.trim(),
    origin_city: origin.city,
    origin_state: origin.state.toUpperCase(),
    origin_country: origin.country.toUpperCase(),
    origin_lat: Number(originLocation.lat),
    origin_lon: Number(originLocation.lon),
    destination_city: destination.city,
    destination_state: destination.state.toUpperCase(),
    destination_country: destination.country.toUpperCase(),
    destination_lat: Number(destinationLocation.lat),
    destination_lon: Number(destinationLocation.lon),
    equipment: elements.adminEquipment.value,
    gross_rate: Number(elements.adminGrossRate.value),
    loaded_miles: Number(elements.adminLoadedMiles.value),
    deadhead_miles: Number(elements.adminDeadheadMiles.value || 0),
    tolls: Number(elements.adminTolls.value || 0),
    weight_lbs: elements.adminWeight.value ? Number(elements.adminWeight.value) : null,
    pickup_at: elements.adminPickupAt.value ? new Date(elements.adminPickupAt.value).toISOString() : null,
    delivery_at: elements.adminDeliveryAt.value ? new Date(elements.adminDeliveryAt.value).toISOString() : null,
    broker_name: elements.adminBrokerName.value.trim() || null,
    broker_mc_number: elements.adminBrokerMc.value.trim() || null,
    destination_quality: Number(elements.adminDestinationQuality.value || 70),
    status: elements.adminStatus.value,
    expires_at: elements.adminExpiresAt.value ? new Date(elements.adminExpiresAt.value).toISOString() : null,
    created_by: currentUser.id,
    updated_at: new Date().toISOString()
  };
}

function resetAdminForm() {
  elements.adminLoadForm.reset();
  elements.adminLoadId.value = "";
  elements.adminDeadheadMiles.value = "0";
  elements.adminTolls.value = "0";
  elements.adminDestinationQuality.value = "70";
  elements.adminStatus.value = "available";
  elements.adminFormTitle.textContent = "Create an online load";
  elements.saveAdminLoadButton.textContent = "Publish load";
  elements.cancelLoadEdit.classList.add("hidden");
  elements.adminLoadMessage.textContent = "";
  elements.adminLoadMessage.className = "form-message";
}

function adminLoadRow(row) {
  const origin = formatLocation(row.origin_city, row.origin_state, row.origin_country || "US");
  const destination = formatLocation(
    row.destination_city,
    row.destination_state,
    row.destination_country || "US"
  );
  return `
    <article class="admin-load-row">
      <div class="admin-load-route">
        <span>${escapeHtml(origin)}</span>
        <span>→</span>
        <span>${escapeHtml(destination)}</span>
      </div>
      <div class="admin-load-meta">
        <span>${escapeHtml(row.source_name)}</span>
        <span>${escapeHtml(row.source_load_id)}</span>
        <span>${escapeHtml(row.equipment)}</span>
        <span>${currency(row.gross_rate)}</span>
        <span class="tag status-${escapeHtml(row.status)}">${escapeHtml(row.status)}</span>
      </div>
      <div class="admin-load-actions">
        <button class="admin-action-button" type="button" data-admin-action="edit" data-id="${row.id}">Edit</button>
        <button class="admin-action-button" type="button" data-admin-action="available" data-id="${row.id}">Available</button>
        <button class="admin-action-button" type="button" data-admin-action="reserved" data-id="${row.id}">Reserved</button>
        <button class="admin-action-button" type="button" data-admin-action="expired" data-id="${row.id}">Expired</button>
        <button class="admin-action-button danger" type="button" data-admin-action="delete" data-id="${row.id}">Delete</button>
      </div>
    </article>
  `;
}

async function loadAdminLoads() {
  if (!currentProfile?.is_admin) return;

  const { data, error } = await supabaseClient
    .from("loads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    elements.adminLoadCount.textContent = error.message;
    elements.adminLoadList.innerHTML = "";
    return;
  }

  const rows = data || [];
  elements.adminLoadCount.textContent = `${rows.length} load${rows.length === 1 ? "" : "s"} stored`;
  elements.adminLoadList.innerHTML = rows.length
    ? rows.map(adminLoadRow).join("")
    : `<div class="empty-state"><strong>No online loads yet.</strong><div>Create one with the form.</div></div>`;
}

async function editAdminLoad(id) {
  const { data, error } = await supabaseClient
    .from("loads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    elements.adminLoadMessage.textContent = error.message;
    return;
  }

  elements.adminLoadId.value = data.id;
  elements.adminSourceName.value = data.source_name || "";
  elements.adminSourceLoadId.value = data.source_load_id || "";
  elements.adminOrigin.value = formatLocation(
    data.origin_city,
    data.origin_state,
    data.origin_country || "US"
  );
  elements.adminDestination.value = formatLocation(
    data.destination_city,
    data.destination_state,
    data.destination_country || "US"
  );
  elements.adminEquipment.value = data.equipment || "Dry Van";
  elements.adminGrossRate.value = data.gross_rate ?? "";
  elements.adminWeight.value = data.weight_lbs ?? "";
  elements.adminLoadedMiles.value = data.loaded_miles ?? "";
  elements.adminDeadheadMiles.value = data.deadhead_miles ?? 0;
  elements.adminTolls.value = data.tolls ?? 0;
  elements.adminPickupAt.value = toLocalDateTimeInput(data.pickup_at);
  elements.adminDeliveryAt.value = toLocalDateTimeInput(data.delivery_at);
  elements.adminBrokerName.value = data.broker_name || "";
  elements.adminBrokerMc.value = data.broker_mc_number || "";
  elements.adminDestinationQuality.value = data.destination_quality ?? 70;
  elements.adminStatus.value = data.status || "available";
  elements.adminExpiresAt.value = toLocalDateTimeInput(data.expires_at);
  elements.adminFormTitle.textContent = "Edit online load";
  elements.saveAdminLoadButton.textContent = "Save changes";
  elements.cancelLoadEdit.classList.remove("hidden");
  elements.adminLoadForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function setAdminLoadStatus(id, status) {
  const { error } = await supabaseClient
    .from("loads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) window.alert(error.message);
  await loadAdminLoads();
  await loadOnlineLoads();
}

async function deleteAdminLoad(id) {
  if (!window.confirm("Delete this load permanently?")) return;

  const { error } = await supabaseClient.from("loads").delete().eq("id", id);
  if (error) window.alert(error.message);
  await loadAdminLoads();
  await loadOnlineLoads();
}

async function loadProviderStatuses() {
  if (!currentProfile?.is_admin) return;

  const { data, error } = await supabaseClient
    .from("data_sources")
    .select("provider_code, provider_name, status, last_sync_at, last_error")
    .order("provider_name");

  if (error || !data?.length) return;

  elements.providerGrid.innerHTML = data
    .map(source => {
      const statusClass =
        source.status === "connected" ? "connected" :
        source.status === "error" ? "error" : "pending";
      const detail = source.last_sync_at
        ? `Last sync ${formatDate(source.last_sync_at)}`
        : source.last_error || source.status;
      return `
        <div class="provider-card">
          <strong>${escapeHtml(source.provider_name)}</strong>
          <span class="provider-status ${statusClass}">${escapeHtml(detail)}</span>
        </div>
      `;
    })
    .join("");
}

async function syncProviders() {
  if (!currentProfile?.is_admin) return;

  elements.providerSyncMessage.className = "form-message";
  elements.providerSyncMessage.textContent = "Requesting provider sync…";
  elements.syncProvidersButton.disabled = true;

  const { data, error } = await supabaseClient.functions.invoke(CONFIG.syncFunctionName, {
    body: { requested_by: currentUser.id }
  });

  elements.syncProvidersButton.disabled = false;

  if (error) {
    elements.providerSyncMessage.textContent =
      `Sync function is not deployed or provider credentials are missing: ${error.message}`;
    return;
  }

  elements.providerSyncMessage.className = "form-message success";
  elements.providerSyncMessage.textContent =
    data?.message || "Synchronization request completed.";
  await loadProviderStatuses();
  await loadOnlineLoads();
}

elements.searchForm.addEventListener("submit", event => {
  event.preventDefault();
  filterLoads();
});

[elements.costPerMile, elements.maxDeadhead, elements.preferredEquipment].forEach(input => {
  input.addEventListener("input", () => {
    saveOperatingProfile();
    render();
  });
  input.addEventListener("change", () => {
    saveOperatingProfile();
    render();
  });
});

elements.sortBy.addEventListener("change", render);

elements.loadList.addEventListener("click", event => {
  const button = event.target.closest("[data-load-id]");
  if (!button) return;
  showLoadDetails(button.dataset.loadId);
});

elements.loginButton.addEventListener("click", () => openAuth("signin"));
elements.signupButton.addEventListener("click", () => openAuth("register"));
elements.sidebarSignupButton?.addEventListener("click", () => openAuth("register"));
elements.closeAuthModal.addEventListener("click", () => closeModal(elements.authModal));
elements.closeLoadModal.addEventListener("click", () => {
  destroyActiveMap();
  closeModal(elements.loadModal);
});
elements.registerTab.addEventListener("click", () => switchAuthPanel("register"));
elements.signinTab.addEventListener("click", () => switchAuthPanel("signin"));

document.querySelectorAll(".plan-button").forEach(button => {
  button.addEventListener("click", () => openAuth("register", button.dataset.plan));
});

[elements.authModal, elements.loadModal].forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      if (modal === elements.loadModal) destroyActiveMap();
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!elements.authModal.classList.contains("hidden")) closeModal(elements.authModal);
  if (!elements.loadModal.classList.contains("hidden")) {
    destroyActiveMap();
    closeModal(elements.loadModal);
  }
});

elements.registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  elements.registerMessage.className = "form-message";
  elements.registerMessage.textContent = "";

  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const selectedPlan = elements.selectedPlan.value;

  const metadata = {
    full_name: document.getElementById("fullName").value.trim(),
    company_name: document.getElementById("companyName").value.trim() || null,
    role: document.getElementById("accountRole").value,
    equipment: document.getElementById("registerEquipment").value,
    plan: selectedPlan
  };

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: APP_URL,
      data: metadata
    }
  });

  if (error) {
    elements.registerMessage.textContent = error.message;
    return;
  }

  elements.registerMessage.className = "form-message success";
  if (data.session) {
    elements.registerMessage.textContent =
      "Account created and signed in. Billing has not been activated.";
    elements.registerForm.reset();
    elements.selectedPlan.value = selectedPlan;
    window.setTimeout(() => closeModal(elements.authModal), 900);
  } else {
    elements.registerMessage.textContent =
      "Account created. Check your email and confirm the address before signing in.";
  }
});

elements.signinForm.addEventListener("submit", async event => {
  event.preventDefault();
  elements.signinMessage.className = "form-message";
  elements.signinMessage.textContent = "";

  const email = document.getElementById("signinEmail").value.trim().toLowerCase();
  const password = document.getElementById("signinPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    elements.signinMessage.textContent = error.message;
    return;
  }

  elements.signinMessage.className = "form-message success";
  elements.signinMessage.textContent = "Signed in.";
  elements.signinForm.reset();
  window.setTimeout(() => closeModal(elements.authModal), 650);
});

elements.accountChip.addEventListener("click", async () => {
  if (!currentUser) return;
  const fullName =
    currentProfile?.full_name ||
    currentUser.user_metadata?.full_name ||
    currentUser.email ||
    "Account";

  if (window.confirm(`${fullName}\n${currentProfile?.plan || "Pro"} plan\n\nSign out?`)) {
    await supabaseClient.auth.signOut();
  }
});

elements.adminLoadForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentProfile?.is_admin) return;

  elements.adminLoadMessage.className = "form-message";
  elements.adminLoadMessage.textContent = "";

  try {
    const payload = adminLoadPayload();
    const id = elements.adminLoadId.value;

    let result;
    if (id) {
      result = await supabaseClient.from("loads").update(payload).eq("id", id);
    } else {
      result = await supabaseClient.from("loads").insert(payload);
    }

    if (result.error) throw result.error;

    elements.adminLoadMessage.className = "form-message success";
    elements.adminLoadMessage.textContent = id ? "Load updated." : "Load published.";
    resetAdminForm();
    await loadAdminLoads();
    await loadOnlineLoads();
  } catch (error) {
    elements.adminLoadMessage.textContent = error.message || "Could not save the load.";
  }
});

elements.cancelLoadEdit.addEventListener("click", resetAdminForm);
elements.refreshAdminLoads.addEventListener("click", loadAdminLoads);
elements.syncProvidersButton.addEventListener("click", syncProviders);

elements.adminLoadList.addEventListener("click", event => {
  const button = event.target.closest("[data-admin-action]");
  if (!button) return;
  const { adminAction, id } = button.dataset;

  if (adminAction === "edit") editAdminLoad(id);
  if (["available", "reserved", "expired"].includes(adminAction)) {
    setAdminLoadStatus(id, adminAction);
  }
  if (adminAction === "delete") deleteAdminLoad(id);
});

setupAutocomplete(elements.origin, elements.originSuggestions, "origin");
setupAutocomplete(elements.destination, elements.destinationSuggestions, "destination");
restoreLocalOperatingProfile();
loadBaseData();
initializeAuth();


window.addEventListener("tla:languagechange", async () => {
  if (currentUser) {
    await loadOnlineLoads();
  } else {
    render();
  }

  if (currentProfile?.is_admin) {
    await loadAdminLoads();
    await loadProviderStatuses();
  }
});
