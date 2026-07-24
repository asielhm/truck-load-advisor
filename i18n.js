(() => {
  "use strict";

  const LANGUAGE_STORAGE_KEY = "truckLoadAdvisorLanguage";

  const es = {
    "Language": "Idioma",
    "Supabase accounts are connected. Live freight will appear after authorized provider integrations are approved and configured.":
      "Las cuentas de Supabase están conectadas. Las cargas reales aparecerán cuando las integraciones autorizadas sean aprobadas y configuradas.",
    "Find Loads": "Buscar cargas",
    "Pricing": "Precios",
    "Data Sources": "Fuentes de datos",
    "Admin": "Administración",
    "Sign in": "Iniciar sesión",
    "Create account": "Crear cuenta",
    "Account": "Cuenta",
    "Load profitability intelligence": "Inteligencia de rentabilidad de cargas",
    "Find freight that improves your whole trip.": "Encontrá cargas que mejoren la rentabilidad de todo tu viaje.",
    "Search by origin and destination, estimate operating profit, compare deadhead, and evaluate the market you will enter after delivery.":
      "Buscá por origen y destino, estimá la ganancia operativa, compará las millas vacías y evaluá el mercado al que llegarás después de la entrega.",
    "Search loads": "Buscar cargas",
    "View membership plans": "Ver planes",
    "✓ Mobile-first": "✓ Optimizado para celulares",
    "✓ Personalized costs": "✓ Costos personalizados",
    "✓ Supabase online data": "✓ Datos online en Supabase",
    "Top recommendation": "Mejor recomendación",
    "Demo data": "Datos de demostración",
    "Online loads": "Cargas online",
    "Pickup today": "Retiro hoy",
    "Dry Van": "Caja seca",
    "Reefer": "Refrigerado",
    "Flatbed": "Plataforma",
    "Power Only": "Solo tractora",
    "Gross": "Bruto",
    "Total miles": "Millas totales",
    "Est. profit": "Ganancia estimada",
    "Excellent fit": "Excelente opción",
    "Low deadhead · strong reload market": "Pocas millas vacías · buen mercado de recarga",
    "Freight search": "Búsqueda de cargas",
    "Search available loads": "Buscar cargas disponibles",
    "Start typing a city or state and select a matching location.":
      "Comenzá a escribir una ciudad, estado o provincia y seleccioná una coincidencia.",
    "Sample loads": "Cargas de muestra",
    "Origin": "Origen",
    "Destination": "Destino",
    "Equipment": "Equipo",
    "All equipment": "Todos los equipos",
    "Minimum gross": "Bruto mínimo",
    "Search": "Buscar",
    "Operating profile": "Perfil operativo",
    "Used to estimate your load profitability.": "Se utiliza para estimar la rentabilidad de cada carga.",
    "Operating cost / mile": "Costo operativo por milla",
    "Maximum deadhead": "Máximo de millas vacías",
    "Preferred equipment": "Equipo preferido",
    "No preference": "Sin preferencia",
    "Current estimates include total mileage, operating cost, and listed tolls. Live fuel, toll, HOS, and market information will be connected later.":
      "Las estimaciones actuales incluyen millas totales, costo operativo y peajes informados. Más adelante se conectarán combustible, peajes, horas de servicio y datos de mercado en tiempo real.",
    "Account status": "Estado de la cuenta",
    "Create a secure account to save your operating profile online.":
      "Creá una cuenta segura para guardar tu perfil operativo online.",
    "Create account →": "Crear cuenta →",
    "Recommended loads": "Cargas recomendadas",
    "Loading freight…": "Cargando cargas…",
    "Best recommendation": "Mejor recomendación",
    "Highest estimated profit": "Mayor ganancia estimada",
    "Highest gross rate": "Mayor tarifa bruta",
    "Lowest deadhead": "Menos millas vacías",
    "Membership": "Suscripción",
    "Simple pricing for owner-operators and fleets.": "Precios simples para propietarios-operadores y flotas.",
    "Launch prices are intended for profitability analysis, alerts, saved preferences, and organization of authorized freight sources.":
      "Los precios iniciales incluyen análisis de rentabilidad, alertas, preferencias guardadas y organización de fuentes de cargas autorizadas.",
    "14-day free trial · Cancel anytime · Prices in USD":
      "Prueba gratis de 14 días · Cancelá cuando quieras · Precios en USD",
    "Starter": "Inicial",
    "/month": "/mes",
    "For one driver testing smarter load selection.":
      "Para un conductor que empieza a elegir cargas de forma más inteligente.",
    "1 driver profile": "1 perfil de conductor",
    "Load search and filters": "Búsqueda y filtros de cargas",
    "Profit and deadhead estimates": "Estimaciones de ganancia y millas vacías",
    "Saved preferences": "Preferencias guardadas",
    "Email support": "Soporte por correo",
    "Start free trial": "Comenzar prueba gratis",
    "Recommended": "Recomendado",
    "For active owner-operators who search freight daily.":
      "Para propietarios-operadores activos que buscan cargas todos los días.",
    "Everything in Starter": "Todo lo incluido en Inicial",
    "Personalized recommendation score": "Puntuación de recomendación personalizada",
    "Destination-market analysis": "Análisis del mercado de destino",
    "Real-time load alerts when connected": "Alertas de cargas en tiempo real cuando estén conectadas",
    "Multiple authorized source connections": "Varias fuentes autorizadas conectadas",
    "Fleet": "Flota",
    "For small fleets coordinating several trucks.":
      "Para flotas pequeñas que coordinan varios camiones.",
    "Up to 5 driver profiles": "Hasta 5 perfiles de conductores",
    "Shared fleet dashboard": "Panel compartido de flota",
    "Truck-by-truck recommendations": "Recomendaciones para cada camión",
    "Team member accounts": "Cuentas para miembros del equipo",
    "Priority support": "Soporte prioritario",
    "Billing is not active yet. Final plans may change after API, infrastructure, licensing, and support costs are confirmed.":
      "La facturación todavía no está activa. Los planes finales pueden cambiar cuando se confirmen los costos de API, infraestructura, licencias y soporte.",
    "Live-data architecture": "Arquitectura de datos en vivo",
    "Prepared for authorized freight integrations.": "Preparado para integraciones de cargas autorizadas.",
    "GitHub Pages displays the application, while Supabase stores users and normalized loads. Provider credentials must remain in a Supabase Edge Function, never in this public browser code.":
      "GitHub Pages muestra la aplicación y Supabase almacena los usuarios y las cargas normalizadas. Las credenciales de los proveedores deben permanecer en una Edge Function de Supabase, nunca en el código público del navegador.",
    "Supabase online load table": "Tabla de cargas online en Supabase",
    "Authenticated users automatically receive available, non-expired loads from the database.":
      "Los usuarios autenticados reciben automáticamente las cargas disponibles y no vencidas de la base de datos.",
    "Truckstop, 123Loadboard, DAT and RXO": "Truckstop, 123Loadboard, DAT y RXO",
    "Each integration requires provider approval, credentials, and its permitted display rules.":
      "Cada integración requiere aprobación, credenciales y reglas de visualización autorizadas por el proveedor.",
    "Scheduled synchronization": "Sincronización programada",
    "A protected Edge Function will import, normalize, deduplicate, update, and expire freight automatically.":
      "Una Edge Function protegida importará, normalizará, eliminará duplicados, actualizará y vencerá cargas automáticamente.",
    "Administrator": "Administrador",
    "Manage online loads and sources": "Administrar cargas y fuentes online",
    "Your approved administrator account can create or edit loads and request a source synchronization. Provider sync remains inactive until credentials are configured.":
      "Tu cuenta administradora puede crear o editar cargas y solicitar la sincronización de fuentes. La sincronización seguirá inactiva hasta configurar las credenciales.",
    "Admin access": "Acceso de administrador",
    "Provider connections": "Conexiones con proveedores",
    "Credentials are stored only in Supabase Edge Function secrets.":
      "Las credenciales se guardan únicamente como secretos de las Edge Functions de Supabase.",
    "Sync providers": "Sincronizar proveedores",
    "Pending credentials": "Credenciales pendientes",
    "Pending approval": "Aprobación pendiente",
    "Create an online load": "Crear una carga online",
    "Enter only freight that you have permission to display.":
      "Ingresá únicamente cargas que tengas autorización para mostrar.",
    "Cancel edit": "Cancelar edición",
    "Source name": "Nombre de la fuente",
    "Source load ID": "ID de carga de la fuente",
    "Gross rate": "Tarifa bruta",
    "Weight (lb)": "Peso (lb)",
    "Loaded miles": "Millas cargadas",
    "Deadhead miles": "Millas vacías",
    "Estimated tolls": "Peajes estimados",
    "Pickup time": "Horario de retiro",
    "Delivery time": "Horario de entrega",
    "Broker name": "Nombre del broker",
    "Broker MC number": "Número MC del broker",
    "Destination score": "Puntuación del destino",
    "Status": "Estado",
    "Available": "Disponible",
    "Reserved": "Reservada",
    "Expired": "Vencida",
    "Expires at": "Vence el",
    "Publish load": "Publicar carga",
    "Loads stored in Supabase": "Cargas guardadas en Supabase",
    "Loading…": "Cargando…",
    "Refresh": "Actualizar",
    "Prototype for a future U.S. carrier decision-support platform.":
      "Prototipo de una futura plataforma de apoyo a decisiones para transportistas de Estados Unidos y Canadá.",
    "Demonstration and development environment. External load data may only be displayed under authorization from its original provider.":
      "Entorno de demostración y desarrollo. Los datos externos de cargas solo pueden mostrarse con autorización de su proveedor original.",
    "Location autocomplete data derived from": "Datos de autocompletado de ubicaciones derivados de",
    "licensed under CC BY 4.0.": "con licencia CC BY 4.0.",
    "Secure registration": "Registro seguro",
    "Create your account": "Creá tu cuenta",
    "Your account is managed by Supabase Auth. You may need to confirm your email before signing in.":
      "Tu cuenta es administrada por Supabase Auth. Es posible que debas confirmar tu correo antes de iniciar sesión.",
    "Full name": "Nombre completo",
    "Company name": "Nombre de la empresa",
    "Email": "Correo electrónico",
    "Account type": "Tipo de cuenta",
    "Owner-operator": "Propietario-operador",
    "Carrier": "Transportista",
    "Dispatcher": "Despachador",
    "Fleet manager": "Gerente de flota",
    "Primary equipment": "Equipo principal",
    "Password": "Contraseña",
    "Selected plan": "Plan seleccionado",
    "Starter — $29/month": "Inicial — USD 29/mes",
    "Pro — $49/month": "Pro — USD 49/mes",
    "Fleet — $69/month": "Flota — USD 69/mes",
    "I understand that billing is not active yet and no payment will be collected.":
      "Entiendo que la facturación todavía no está activa y que no se realizará ningún cobro.",
    "Welcome back": "Bienvenido nuevamente",
    "Use the email and password registered with TruckLoad Advisor.":
      "Usá el correo y la contraseña registrados en TruckLoad Advisor.",
    "No matching city found": "No se encontró una ciudad coincidente",
    "Data files are missing.": "Faltan archivos de datos.",
    "No loads match these filters.": "Ninguna carga coincide con estos filtros.",
    "Try another city, equipment type, rate, or deadhead limit.":
      "Probá con otra ciudad, tipo de equipo, tarifa o límite de millas vacías.",
    "Open original source": "Abrir fuente original",
    "Online load": "Carga online",
    "Demonstration load": "Carga de demostración",
    "Original reference": "Referencia original",
    "Estimated cost": "Costo estimado",
    "Recommendation": "Recomendación",
    "Verify the original source, broker authority, insurance requirements, appointments, and rate confirmation before accepting freight.":
      "Verificá la fuente original, la autoridad del broker, los requisitos de seguro, los turnos y la confirmación de tarifa antes de aceptar la carga.",
    "Edit": "Editar",
    "Delete": "Eliminar",
    "Edit online load": "Editar carga online",
    "Save changes": "Guardar cambios",
    "Load updated.": "Carga actualizada.",
    "Load published.": "Carga publicada.",
    "No online loads yet.": "Todavía no hay cargas online.",
    "Create one with the form.": "Creá una con el formulario.",
    "Requesting provider sync…": "Solicitando sincronización de proveedores…",
    "Signed in.": "Sesión iniciada.",
    "Administrator access required.": "Se requiere acceso de administrador.",
    "Origin and destination must use the format City, ST, Country.":
      "El origen y el destino deben usar el formato Ciudad, Estado/Provincia, País.",
    "Delete this load permanently?": "¿Eliminar esta carga permanentemente?",
    "Sign out?": "¿Cerrar sesión?",
    "Sign out →": "Cerrar sesión →",
    "Account active": "Cuenta activa",
    "User": "Usuario",
    "plan": "plan",
    "available": "disponible",
    "reserved": "reservada",
    "expired": "vencida",
    "Appointment pending": "Horario pendiente",
    "Weight not listed": "Peso no informado",
    "Broker not listed": "Broker no informado",
    "Demo": "Demostración",
    "Review": "Revisar",

    "Start typing a city, state, province, or country and select a matching location.":
      "Comenzá a escribir una ciudad, estado, provincia o país y seleccioná una coincidencia.",
    "Route map": "Mapa del recorrido",
    "Geographic reference only — not truck-specific routing.":
      "Referencia geográfica únicamente; no es un ruteo específico para camiones.",
    "Origin marker": "Marcador de origen",
    "Destination marker": "Marcador de destino",
    "Straight reference line": "Línea recta de referencia",
    "Open in Google Maps": "Abrir en Google Maps",
    "Open in Apple Maps": "Abrir en Apple Maps",
    "Map unavailable": "Mapa no disponible",
    "Coordinates are not available for this load. Edit and save the load again using a location from the city list.":
      "No hay coordenadas disponibles para esta carga. Editala y volvé a guardarla seleccionando una ubicación de la lista.",
    "Select origin and destination from the location list so their map coordinates can be saved.":
      "Seleccioná el origen y el destino desde la lista para poder guardar sus coordenadas en el mapa.",
    "Origin and destination must use the format City, ST, Country.":
      "El origen y el destino deben usar el formato Ciudad, Estado/Provincia, País.",
    "to": "a",

    "Box Truck": "Camión caja",
    "Rate unavailable": "Tarifa no disponible",
    "Rate needed": "Falta la tarifa",
    "Manual public summary": "Resumen público manual",
    "The public listing does not include the gross rate, so profit and recommendation score cannot be calculated yet.":
      "La publicación pública no incluye la tarifa bruta, por lo que todavía no se pueden calcular la ganancia ni la puntuación de recomendación.",
    "This record was entered manually from a public listing summary. Rate, broker and contact details were not published.":
      "Este registro fue ingresado manualmente desde un resumen público. No se publicaron la tarifa, el broker ni los datos de contacto.",
    "Low score": "Puntuación baja"
  };

  const attrMap = {
    "e.g. Dallas, TX, US": "ej. Dallas, TX, US",
    "e.g. Atlanta, GA, US": "ej. Atlanta, GA, US",
    "Dallas, TX, US": "Dallas, TX, US",
    "Atlanta, GA, US": "Atlanta, GA, US",
    "Direct broker": "Broker directo",
    "LOAD-1001": "CARGA-1001",
    "Optional": "Opcional"
  };

  const originalText = new WeakMap();
  let currentLanguage = getInitialLanguage();

  function getInitialLanguage() {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
    return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
  }

  function interpolate(template, values = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : `{${key}}`
    );
  }

  function translateDynamic(text) {
    let match;

    match = text.match(/^(\d+) online load(s)? match your filters$/);
    if (match) return `${match[1]} carga${match[1] === "1" ? "" : "s"} online coincide${match[1] === "1" ? "" : "n"} con tus filtros`;

    match = text.match(/^(\d+) demonstration load(s)? match your filters$/);
    if (match) return `${match[1]} carga${match[1] === "1" ? "" : "s"} de demostración coincide${match[1] === "1" ? "" : "n"} con tus filtros`;

    match = text.match(/^(\d+) load(s)? stored$/);
    if (match) return `${match[1]} carga${match[1] === "1" ? "" : "s"} guardada${match[1] === "1" ? "" : "s"}`;

    match = text.match(/^(\d+) trial day(s)? remaining$/);
    if (match) return `Queda${match[1] === "1" ? "" : "n"} ${match[1]} día${match[1] === "1" ? "" : "s"} de prueba`;

    match = text.match(/^(.+) · (Starter|Pro|Fleet) plan$/);
    if (match) {
      const plan = match[2] === "Starter" ? "Inicial" : match[2] === "Fleet" ? "Flota" : "Pro";
      return `${match[1]} · plan ${plan}`;
    }

    match = text.match(/^Source: (.+) · Original reference: (.+)$/);
    if (match) return `Fuente: ${match[1]} · Referencia original: ${match[2]}`;

    match = text.match(/^Last sync (.+)$/);
    if (match) return `Última sincronización: ${match[1]}`;

    match = text.match(/^Credentials are present, but (.+)$/);
    if (match) return `Las credenciales están presentes, pero ${match[1]}`;

    match = text.match(/^Strong estimated return, (\d+) deadhead miles, and a favorable destination market\.(.*)$/);
    if (match) return `Buen retorno estimado, ${match[1]} millas vacías y un mercado de destino favorable.${translateRateSuffix(match[2])}`;

    match = text.match(/^Potentially useful, but review deadhead, appointment details, and destination conditions\.(.*)$/);
    if (match) return `Puede ser conveniente, pero revisá las millas vacías, los turnos y las condiciones del destino.${translateRateSuffix(match[1])}`;

    match = text.match(/^The estimated margin or destination outlook may not justify this trip under your current profile\.(.*)$/);
    if (match) return `El margen estimado o el mercado de destino pueden no justificar este viaje con tu perfil actual.${translateRateSuffix(match[1])}`;

    match = text.match(/^Gross per total mile: \$([0-9.]+)\. Net per total mile: \$([0-9.]+)\.$/);
    if (match) return `Bruto por milla total: USD ${match[1]}. Neto por milla total: USD ${match[2]}.`;

    match = text.match(/^An account with this email already exists/);
    if (match) return "Ya existe una cuenta con este correo electrónico.";

    match = text.match(/^Invalid login credentials$/i);
    if (match) return "Correo o contraseña incorrectos.";

    match = text.match(/^Email not confirmed$/i);
    if (match) return "El correo todavía no fue confirmado.";

    match = text.match(/^Password should be at least (\d+) characters/i);
    if (match) return `La contraseña debe tener al menos ${match[1]} caracteres.`;

    return null;
  }

  function translateRateSuffix(suffix) {
    if (!suffix) return "";
    const match = suffix.match(/\s*Gross per total mile: \$([0-9.]+)\. Net per total mile: \$([0-9.]+)\./);
    if (!match) return suffix;
    return ` Bruto por milla total: USD ${match[1]}. Neto por milla total: USD ${match[2]}.`;
  }

  function translateString(text) {
    if (currentLanguage !== "es") return text;
    return es[text] ?? translateDynamic(text) ?? text;
  }

  function translateTextNode(node) {
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    if (node.parentElement?.closest("[data-no-i18n]")) return;

    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);

    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    const core = source.trim();
    const translated = currentLanguage === "es" ? translateString(core) : core;
    const next = `${leading}${translated}${trailing}`;

    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(root = document) {
    root.querySelectorAll?.("input[placeholder], textarea[placeholder]").forEach(element => {
      if (!element.dataset.originalPlaceholder) {
        element.dataset.originalPlaceholder = element.getAttribute("placeholder") || "";
      }
      const original = element.dataset.originalPlaceholder;
      element.setAttribute(
        "placeholder",
        currentLanguage === "es" ? (attrMap[original] ?? es[original] ?? original) : original
      );
    });

    root.querySelectorAll?.("[title]").forEach(element => {
      if (!element.dataset.originalTitle) element.dataset.originalTitle = element.title;
      const original = element.dataset.originalTitle;
      element.title = currentLanguage === "es" ? translateString(original) : original;
    });

    root.querySelectorAll?.("[aria-label]").forEach(element => {
      if (!element.dataset.originalAriaLabel) {
        element.dataset.originalAriaLabel = element.getAttribute("aria-label") || "";
      }
      const original = element.dataset.originalAriaLabel;
      element.setAttribute(
        "aria-label",
        currentLanguage === "es" ? translateString(original) : original
      );
    });
  }

  function translateTree(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    translateAttributes(root === document.body ? document : root);
  }

  function setLanguage(language, persist = true) {
    if (language !== "en" && language !== "es") return;
    currentLanguage = language;
    document.documentElement.lang = language;

    if (persist) localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

    const select = document.getElementById("languageSelect");
    if (select) select.value = language;

    document.title =
      language === "es"
        ? "TruckLoad Advisor | Cargas rentables"
        : "TruckLoad Advisor";

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.content =
        language === "es"
          ? "TruckLoad Advisor ayuda a transportistas de Estados Unidos y Canadá a comparar cargas por ganancia estimada, millas vacías y mercado de destino."
          : "TruckLoad Advisor helps U.S. and Canadian carriers compare freight by estimated profit, deadhead, and destination market.";
    }

    translateTree(document.body);

    window.dispatchEvent(
      new CustomEvent("tla:languagechange", { detail: { language } })
    );
  }

  function getLocale() {
    return currentLanguage === "es" ? "es-AR" : "en-US";
  }

  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);

  window.alert = message => nativeAlert(translateString(String(message)));
  window.confirm = message => nativeConfirm(
    String(message)
      .split("\n")
      .map(line => translateString(line))
      .join("\n")
  );

  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") {
        translateTextNode(record.target);
      }

      for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          translateTextNode(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          translateTree(node);
        }
      }
    }
  });

  window.TLA_I18N = {
    setLanguage,
    getLanguage: () => currentLanguage,
    getLocale,
    t: (key, values) => {
      const base = currentLanguage === "es" ? (es[key] ?? key) : key;
      return interpolate(base, values);
    },
    translateString
  };

  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("languageSelect");
    if (select) {
      select.value = currentLanguage;
      select.addEventListener("change", event => {
        setLanguage(event.target.value);
      });
    }

    translateTree(document.body);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
    setLanguage(currentLanguage, false);
  });
})();
