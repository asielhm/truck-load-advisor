const CONFIG = {
  dataMode: "demo",
  localLoadsFile: "loads.json",
  localCitiesFile: "cities.json",
  // Later, replace with your secure backend endpoint, never a private API key in browser code.
  liveLoadsEndpoint: ""
};

const STORAGE_KEYS = {
  users: "truckLoadAdvisorDemoUsers",
  session: "truckLoadAdvisorDemoSession",
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

function saveOperatingProfile() {
  const profile = {
    costPerMile: elements.costPerMile.value,
    maxDeadhead: elements.maxDeadhead.value,
    preferredEquipment: elements.preferredEquipment.value
  };
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

function restoreOperatingProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || "null");
    if (!profile) return;
    elements.costPerMile.value = profile.costPerMile ?? "1.55";
    elements.maxDeadhead.value = profile.maxDeadhead ?? "150";
    elements.preferredEquipment.value = profile.preferredEquipment ?? "";
  } catch (error) {
    console.warn("Could not restore operating profile", error);
  }
}

async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error("Secure browser hashing is unavailable.");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
  } catch {
    return null;
  }
}

function setSession(user) {
  const safeSession = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    plan: user.plan,
    equipment: user.equipment
  };
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(safeSession));
  updateAccountUi();
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
  updateAccountUi();
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");
}

function updateAccountUi() {
  const session = getSession();

  if (!session) {
    elements.loginButton.classList.remove("hidden");
    elements.signupButton.classList.remove("hidden");
    elements.accountChip.classList.add("hidden");
    elements.sidebarAccountState.innerHTML = `
      <p>Create a demo account to save your operating profile and selected plan on this device.</p>
      <button class="text-button" id="sidebarSignupDynamic" type="button">Create account →</button>
    `;
    document.getElementById("sidebarSignupDynamic")?.addEventListener("click", () => openAuth("register"));
    return;
  }

  elements.loginButton.classList.add("hidden");
  elements.signupButton.classList.add("hidden");
  elements.accountChip.classList.remove("hidden");
  elements.accountName.textContent = session.fullName;
  elements.accountInitials.textContent = initials(session.fullName) || "TA";
  elements.sidebarAccountState.innerHTML = `
    <p><strong>${escapeHtml(session.fullName)}</strong></p>
    <p>${escapeHtml(session.role)} · ${escapeHtml(session.plan)} plan</p>
    <p>${escapeHtml(session.email)}</p>
    <button class="text-button" id="signOutButton" type="button">Sign out →</button>
  `;
  document.getElementById("signOutButton")?.addEventListener("click", clearSession);

  if (session.equipment) {
    elements.preferredEquipment.value = session.equipment;
  }
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

  try {
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const users = getUsers();

    if (users.some(user => user.email === email)) {
      throw new Error("An account with this email already exists on this device.");
    }

    const password = document.getElementById("registerPassword").value;
    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);

    const user = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      fullName: document.getElementById("fullName").value.trim(),
      companyName: document.getElementById("companyName").value.trim(),
      email,
      role: document.getElementById("accountRole").value,
      equipment: document.getElementById("registerEquipment").value,
      plan: elements.selectedPlan.value,
      salt,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
    setSession(user);
    elements.registerMessage.className = "form-message success";
    elements.registerMessage.textContent = "Demo account created. No payment was collected.";
    elements.registerForm.reset();
    elements.selectedPlan.value = user.plan;

    window.setTimeout(() => closeModal(elements.authModal), 900);
  } catch (error) {
    elements.registerMessage.textContent = error.message || "Could not create the account.";
  }
});

elements.signinForm.addEventListener("submit", async event => {
  event.preventDefault();
  elements.signinMessage.className = "form-message";
  elements.signinMessage.textContent = "";

  try {
    const email = document.getElementById("signinEmail").value.trim().toLowerCase();
    const password = document.getElementById("signinPassword").value;
    const user = getUsers().find(candidate => candidate.email === email);

    if (!user) throw new Error("No demo account was found with this email.");

    const attemptedHash = await hashPassword(password, user.salt);
    if (attemptedHash !== user.passwordHash) throw new Error("Incorrect password.");

    setSession(user);
    elements.signinMessage.className = "form-message success";
    elements.signinMessage.textContent = "Signed in.";
    elements.signinForm.reset();

    window.setTimeout(() => closeModal(elements.authModal), 700);
  } catch (error) {
    elements.signinMessage.textContent = error.message || "Could not sign in.";
  }
});

elements.accountChip.addEventListener("click", () => {
  const session = getSession();
  if (!session) return;

  const wantsSignOut = window.confirm(
    `${session.fullName}\n${session.plan} plan\n\nSign out of this demonstration account?`
  );
  if (wantsSignOut) clearSession();
});

setupAutocomplete(elements.origin, elements.originSuggestions, "origin");
setupAutocomplete(elements.destination, elements.destinationSuggestions, "destination");
restoreOperatingProfile();
updateAccountUi();
loadInitialData();
