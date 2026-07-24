const CONFIG = {
  dataMode: "demo",
  localLoadsFile: "loads.json",
  localCitiesFile: "cities.json",
  // Later, replace with your secure backend endpoint, never a private API key in browser code.
  liveLoadsEndpoint: ""
};

const STORAGE_KEYS = {
  profile: "truckLoadAdvisorOperatingProfile"
};

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
  loadModalContent: document.getElementById("loadModalContent")
};

let allLoads = [];
let activeLoads = [];
let cities = [];
let autocompleteState = {
  origin: { index: -1, matches: [] },
  destination: { index: -1, matches: [] }
};

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${url}: ${response.status}`);
  }
  return response.json();
}

async function loadInitialData() {
  try {
    const [loadedLoads, loadedCities] = await Promise.all([
      fetchJson(CONFIG.localLoadsFile),
      fetchJson(CONFIG.localCitiesFile)
    ]);

    allLoads = Array.isArray(loadedLoads) ? loadedLoads : [];
    cities = Array.isArray(loadedCities) ? loadedCities : [];
    activeLoads = [...allLoads];
    render();
  } catch (error) {
    console.error(error);
    elements.resultCount.textContent = "The sample-data files could not be loaded.";
    elements.loadList.innerHTML = `
      <div class="error-state">
        <strong>Data files are missing.</strong>
        <div>Upload <code>loads.json</code> and <code>cities.json</code> to the same GitHub folder as this page.</div>
      </div>
    `;
  }
}

function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

function cityMatches(query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return cities.slice(0, 10);

  return cities
    .map(city => {
      const lower = city.toLowerCase();
      const starts = lower.startsWith(normalized);
      const wordStarts = lower.split(/[\s,.-]+/).some(word => word.startsWith(normalized));
      const contains = lower.includes(normalized);
      return {
        city,
        rank: starts ? 0 : wordStarts ? 1 : contains ? 2 : 99,
        position: lower.indexOf(normalized)
      };
    })
    .filter(item => item.rank < 99)
    .sort((a, b) => a.rank - b.rank || a.position - b.position || a.city.localeCompare(b.city))
    .slice(0, 12)
    .map(item => item.city);
}

function highlightMatch(city, query) {
  const normalized = query.trim();
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
    if (!input.contains(event.target) && !menu.contains(event.target)) {
      close();
    }
  });
}

function calculateLoad(load) {
  const costPerMile = Math.max(Number(elements.costPerMile.value) || 0, 0);
  const totalMiles = load.loadedMiles + load.deadhead;
  const estimatedCost = totalMiles * costPerMile + (load.tolls || 0);
  const profit = load.gross - estimatedCost;
  const grossPerTotalMile = load.gross / totalMiles;
  const netPerTotalMile = profit / totalMiles;
  const deadheadPenalty = Math.min((load.deadhead / 180) * 20, 20);
  const profitScore = Math.min(Math.max((netPerTotalMile / 1.6) * 45, 0), 45);
  const marketScore = ((load.destinationQuality || 50) / 100) * 25;
  const rateScore = Math.min((grossPerTotalMile / 3.2) * 20, 20);
  const equipmentBonus =
    elements.preferredEquipment.value && load.equipment === elements.preferredEquipment.value ? 5 : 0;

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
              <span>Destination score ${load.destinationQuality}/100</span>
            </div>
          </div>

          <div class="load-meta">
            <span class="tag">${escapeHtml(load.equipment)}</span>
            <span class="tag">${escapeHtml(load.weight)}</span>
            <span class="tag">${escapeHtml(load.source)}</span>
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

  elements.resultCount.textContent =
    `${sorted.length} demonstration load${sorted.length === 1 ? "" : "s"} match your filters`;

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
    const rateMatch = load.gross >= minRate;

    return originMatch && destinationMatch && equipmentMatch && rateMatch;
  });

  render();
}

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

let currentUser = null;
let currentProfile = null;
let profileSaveTimer = null;

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
    const values = localProfileValues();

    const { error } = await supabaseClient
      .from("driver_profiles")
      .upsert(
        {
          user_id: currentUser.id,
          ...values,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Could not save operating profile:", error);
    }
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
      "id, full_name, company_name, role, equipment, plan, subscription_status, trial_ends_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load account profile:", error);
  }

  if (data) return data;

  const metadata = user.user_metadata || {};
  const fallbackProfile = {
    id: user.id,
    full_name: metadata.full_name || user.email?.split("@")[0] || "TruckLoad user",
    company_name: metadata.company_name || null,
    role: metadata.role || "Owner-operator",
    equipment: metadata.equipment || "Dry Van",
    plan: metadata.plan || "Pro"
  };

  const { data: inserted, error: insertError } = await supabaseClient
    .from("profiles")
    .upsert(fallbackProfile, { onConflict: "id" })
    .select(
      "id, full_name, company_name, role, equipment, plan, subscription_status, trial_ends_at"
    )
    .single();

  if (insertError) {
    console.error("Could not create account profile:", insertError);
    return {
      ...fallbackProfile,
      subscription_status: "trialing",
      trial_ends_at: null
    };
  }

  return inserted;
}

function trialText(profile) {
  if (!profile?.trial_ends_at) return profile?.subscription_status || "Account active";

  const end = new Date(profile.trial_ends_at);
  const days = Math.max(
    0,
    Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (profile.subscription_status === "trialing") {
    return `${days} trial day${days === 1 ? "" : "s"} remaining`;
  }

  return profile.subscription_status || "Account active";
}

async function updateAccountUi() {
  if (!currentUser) {
    currentProfile = null;
    elements.loginButton.classList.remove("hidden");
    elements.signupButton.classList.remove("hidden");
    elements.accountChip.classList.add("hidden");
    elements.sidebarAccountState.innerHTML = `
      <p>Create an account to save your profile securely and access it from another device.</p>
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
    <p>${escapeHtml(currentProfile?.role || "User")} · ${escapeHtml(
      currentProfile?.plan || "Pro"
    )} plan</p>
    <p>${escapeHtml(currentUser.email || "")}</p>
    <p>${escapeHtml(trialText(currentProfile))}</p>
    <button class="text-button" id="signOutButton" type="button">Sign out →</button>
  `;

  document.getElementById("signOutButton")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
  });

  if (currentProfile?.equipment) {
    elements.preferredEquipment.value = currentProfile.equipment;
  }

  await loadRemoteOperatingProfile();
}

async function handleSession(session) {
  currentUser = session?.user || null;
  await updateAccountUi();
}

async function initializeAuth() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Could not restore Supabase session:", error);
  }

  await handleSession(data?.session || null);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      handleSession(session);
    }, 0);
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

function showLoadDetails(loadId) {
  const rawLoad = allLoads.find(load => String(load.id) === String(loadId));
  if (!rawLoad) return;

  const load = calculateLoad(rawLoad);
  const recommendation = recommendationData(load);

  elements.loadModalContent.innerHTML = `
    <p class="eyebrow dark-eyebrow">Demonstration load</p>
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
      <div class="detail-box">
        <span>Gross rate</span>
        <strong>${currency(load.gross)}</strong>
      </div>
      <div class="detail-box">
        <span>Estimated cost</span>
        <strong>${currency(load.estimatedCost)}</strong>
      </div>
      <div class="detail-box">
        <span>Estimated profit</span>
        <strong>${currency(load.profit)}</strong>
      </div>
      <div class="detail-box">
        <span>Loaded miles</span>
        <strong>${load.loadedMiles} mi</strong>
      </div>
      <div class="detail-box">
        <span>Deadhead</span>
        <strong>${load.deadhead} mi</strong>
      </div>
      <div class="detail-box">
        <span>Recommendation</span>
        <strong>${load.score}/100</strong>
      </div>
    </div>

    <div class="detail-warning">
      ${escapeHtml(recommendation.reason)}
      This freight is fictional. A production record will include verified broker authority,
      real pickup requirements, timestamps, and an authorized booking method.
    </div>
  `;

  openModal(elements.loadModal);
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
elements.closeLoadModal.addEventListener("click", () => closeModal(elements.loadModal));
elements.registerTab.addEventListener("click", () => switchAuthPanel("register"));
elements.signinTab.addEventListener("click", () => switchAuthPanel("signin"));

document.querySelectorAll(".plan-button").forEach(button => {
  button.addEventListener("click", () => openAuth("register", button.dataset.plan));
});

[elements.authModal, elements.loadModal].forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!elements.authModal.classList.contains("hidden")) closeModal(elements.authModal);
  if (!elements.loadModal.classList.contains("hidden")) closeModal(elements.loadModal);
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

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

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

  const wantsSignOut = window.confirm(
    `${fullName}\n${currentProfile?.plan || "Pro"} plan\n\nSign out?`
  );

  if (wantsSignOut) {
    await supabaseClient.auth.signOut();
  }
});

setupAutocomplete(elements.origin, elements.originSuggestions, "origin");
setupAutocomplete(elements.destination, elements.destinationSuggestions, "destination");
restoreLocalOperatingProfile();
loadInitialData();
initializeAuth();
