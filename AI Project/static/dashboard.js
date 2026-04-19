/* ============================================
   SMART ROUTE DELIVERY PLANNER - dashboard.js
   OPTIMIZED VERSION
   ============================================ */

'use strict';

// ================================================
//  AUTH GUARD
// ================================================
(function authGuard() {
  const session = localStorage.getItem('srdp_session');
  if (!session) { window.location.href = 'index.html'; return; }
  try {
    const parsed = JSON.parse(session);
    if (!parsed || !parsed.username || Date.now() > parsed.expires) {
      localStorage.removeItem('srdp_session');
      window.location.href = 'index.html';
    }
  } catch {
    localStorage.removeItem('srdp_session');
    window.location.href = 'index.html';
  }
})();

// ================================================
//  NODE LOCATIONS
// ================================================
const NODE_LOCATIONS = {
  A: { lat: 24.9335, lng: 67.1120, name: "UIT University, Gulshan Block 7" },
  B: { lat: 24.9298, lng: 67.1085, name: "Gulshan Chowrangi" },
  C: { lat: 24.9215, lng: 67.1020, name: "NIPA Chowrangi" },
  D: { lat: 24.9145, lng: 67.0920, name: "Liaquatabad" },
  E: { lat: 24.9055, lng: 67.0850, name: "Teen Hatti" },
  F: { lat: 24.8940, lng: 67.0800, name: "Guru Mandir" },
  G: { lat: 24.8850, lng: 67.0700, name: "MA Jinnah Road" },
  H: { lat: 24.8607, lng: 67.0011, name: "Saddar Karachi" }
};

// GRAPH is now handled by the backend API.

// ================================================
//  STATE
// ================================================
let map = null;
let markers = {};
let currentLine = null;
let glowLine = null;
let tileLayer = null;
let darkMode = true;
let routeDrawn = false;

// ================================================
//  CACHED DOM
// ================================================
const DOM = {};

function cacheDom() {
  DOM.startSelect = document.getElementById('startSelect');
  DOM.endSelect = document.getElementById('endSelect');
  DOM.planBtn = document.getElementById('planRouteBtn');
  DOM.planBtnText = DOM.planBtn?.querySelector('.plan-btn-text');
  DOM.planBtnLoader = DOM.planBtn?.querySelector('.plan-btn-loader');
  DOM.mapStatus = document.getElementById('mapStatus');
  DOM.summarySection = document.getElementById('summarySection');
  DOM.summaryDist = document.getElementById('summaryDist');
  DOM.summaryTime = document.getElementById('summaryTime');
  DOM.summaryFuel = document.getElementById('summaryFuel');
  DOM.summaryReason = document.getElementById('summaryReason');
  DOM.routeIndicator = document.getElementById('routeColorIndicator');
  DOM.rciDot = document.getElementById('rciDot');
  DOM.rciLabel = document.getElementById('rciLabel');
  DOM.sidebar = document.getElementById('dashSidebar');
  DOM.overlay = document.getElementById('sidebarOverlay');
  DOM.toastContainer = document.getElementById('toastContainer');
  DOM.navTime = document.getElementById('navTime');
  DOM.profileAvatar = document.getElementById('profileAvatar');
  DOM.profileName = document.getElementById('profileName');
  DOM.themeBtn = document.getElementById('themeBtn');
  DOM.chips = {
    traffic: document.getElementById('chip-traffic'),
    fuel: document.getElementById('chip-fuel'),
    roads: document.getElementById('chip-roads')
  };
  DOM.algoStat = document.querySelector('.stats-bar-val-algo');
}

// ================================================
//  INIT
// ================================================
document.addEventListener('DOMContentLoaded', function () {
  cacheDom();
  initUser();
  initClock();
  initMap();
  populateDropdowns();
  addMarkers();
  initSidebarToggle();
  showToast('Select locations to plan a route.', 'info', 'Ready');
});

// ================================================
//  USER
// ================================================
function initUser() {
  try {
    const session = JSON.parse(localStorage.getItem('srdp_session'));
    const initial = session.username.charAt(0).toUpperCase();
    if (DOM.profileAvatar) DOM.profileAvatar.textContent = initial;
    if (DOM.profileName) DOM.profileName.textContent = session.username;
  } catch (e) {}
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {}
  localStorage.removeItem('srdp_session');
  showToast('Logging out...', 'success', 'Goodbye!');
  setTimeout(() => { window.location.href = 'index.html'; }, 600);
}

// ================================================
//  CLOCK
// ================================================
function initClock() {
  if (!DOM.navTime) return;
  function tick() {
    DOM.navTime.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

// ================================================
//  MAP
// ================================================
function initMap() {
  map = L.map('map', {
    center: [24.9000, 67.0800],
    zoom: 13,
    zoomControl: true,
    attributionControl: true
  });
  setDarkTile();
}

function setDarkTile() {
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM &copy; CARTO',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);
  darkMode = true;
  if (DOM.themeBtn) DOM.themeBtn.innerHTML = '<i class="bi bi-sun"></i>';
}

function setLightTile() {
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM', maxZoom: 19
  }).addTo(map);
  darkMode = false;
  if (DOM.themeBtn) DOM.themeBtn.innerHTML = '<i class="bi bi-moon-stars"></i>';
}

function toggleMapTheme() {
  darkMode ? setLightTile() : setDarkTile();
  showToast(darkMode ? 'Dark theme' : 'Light theme', 'info', 'Theme');
}

function resetMapView() {
  if (map) map.setView([24.9000, 67.0800], 13, { animate: true });
}

// ================================================
//  MARKERS
// ================================================
function addMarkers() {
  const colors = {
    A: '#3b82f6', B: '#22c55e', C: '#f59e0b', D: '#ef4444',
    E: '#8b5cf6', F: '#06b6d4', G: '#f97316', H: '#ec4899'
  };

  Object.entries(NODE_LOCATIONS).forEach(([key, loc]) => {
    const color = colors[key];
    const icon = L.divIcon({
      html: '<div style="width:28px;height:28px;background:'+color+';border:2px solid rgba(255,255,255,0.85);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer;">'+key+'</div>',
      className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: icon });
    marker.bindPopup('<div class="popup-node">Node '+key+'</div><div class="popup-header">'+loc.name+'</div><div class="popup-sub">'+loc.lat.toFixed(4)+', '+loc.lng.toFixed(4)+'</div>', { maxWidth: 180 });

    marker.on('click', function () {
      if (DOM.startSelect && !DOM.startSelect.value) {
        DOM.startSelect.value = key;
        handleDropdownSelection();
      } else if (DOM.endSelect && !DOM.endSelect.value) {
        DOM.endSelect.value = key;
        handleDropdownSelection();
      }
    });

    marker.addTo(map);
    markers[key] = marker;
  });
}

// ================================================
//  DROPDOWNS
// ================================================
function populateDropdowns() {
  Object.entries(NODE_LOCATIONS).forEach(([key, loc]) => {
    const opt1 = new Option(key + ' — ' + loc.name, key);
    const opt2 = new Option(key + ' — ' + loc.name, key);
    DOM.startSelect.appendChild(opt1);
    DOM.endSelect.appendChild(opt2);
  });
}

function handleDropdownSelection() {
  const startKey = DOM.startSelect.value;
  const endKey = DOM.endSelect.value;

  // Highlight markers
  Object.entries(markers).forEach(([key, marker]) => {
    const el = marker.getElement();
    if (!el) return;
    const inner = el.querySelector('div');
    if (!inner) return;
    if (key === startKey) {
      inner.style.transform = 'scale(1.2)';
      inner.style.boxShadow = '0 0 12px rgba(34,197,94,0.7)';
    } else if (key === endKey) {
      inner.style.transform = 'scale(1.2)';
      inner.style.boxShadow = '0 0 12px rgba(239,68,68,0.7)';
    } else {
      inner.style.transform = '';
      inner.style.boxShadow = '';
    }
  });

  // Update status
  if (startKey && endKey) {
    if (startKey === endKey) {
      DOM.mapStatus.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2" style="color:#f59e0b"></i>Start and End must be different!';
      DOM.mapStatus.style.borderColor = 'rgba(239,68,68,0.4)';
    } else {
      DOM.mapStatus.innerHTML = '<i class="bi bi-check-circle me-2" style="color:#22c55e"></i>Ready: <strong>'+NODE_LOCATIONS[startKey].name+'</strong> → <strong>'+NODE_LOCATIONS[endKey].name+'</strong>';
      DOM.mapStatus.style.borderColor = 'rgba(34,197,94,0.3)';
    }
  } else if (startKey) {
    DOM.mapStatus.innerHTML = '<i class="bi bi-info-circle me-2"></i>Select <strong>End Location</strong>';
    DOM.mapStatus.style.borderColor = '';
  } else {
    DOM.mapStatus.innerHTML = '<i class="bi bi-info-circle me-2"></i>Select start and end locations';
    DOM.mapStatus.style.borderColor = '';
  }
}

// ================================================
//  OPTIONS
// ================================================
function getSelectedOptions() {
  const opts = [];
  if (document.getElementById('optTraffic').checked) opts.push('traffic');
  if (document.getElementById('optFuel').checked) opts.push('fuel');
  if (document.getElementById('optRoads').checked) opts.push('roads');
  return opts;
}

function getRouteColor(options) {
  if (!options || options.length === 0) return '#0b3d91';
  if (options.length > 1) return '#800080';
  switch (options[0]) {
    case 'traffic': return '#00c9a7';
    case 'fuel': return '#b59b00';
    case 'roads': return '#c4a484';
    default: return '#0b3d91';
  }
}

function getRouteColorLabel(options) {
  if (!options || options.length === 0) return 'Default Route';
  if (options.length > 1) return 'Multi-Optimized';
  switch (options[0]) {
    case 'traffic': return 'Less Traffic';
    case 'fuel': return 'Fuel Efficient';
    case 'roads': return 'Better Roads';
    default: return 'Default Route';
  }
}

// Path calculations are now handled by the backend API.

// ================================================
//  DRAW ROUTE
// ================================================
function drawRoute(path, options) {
  // Remove old route
  if (currentLine) {
    map.removeLayer(currentLine);
    if (glowLine) map.removeLayer(glowLine);
    currentLine = null;
    glowLine = null;
  }

  const color = getRouteColor(options);
  const latlngs = path.map(k => [NODE_LOCATIONS[k].lat, NODE_LOCATIONS[k].lng]);

  // Glow
  glowLine = L.polyline(latlngs, {
    color: color, weight: 10, opacity: 0.15, smoothFactor: 1
  }).addTo(map);

  // Main line
  currentLine = L.polyline(latlngs, {
    color: color, weight: 4, opacity: 0.9,
    lineCap: 'round', lineJoin: 'round'
  }).addTo(map);

  // Fit bounds
  map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50], animate: true, duration: 0.6 });

  // Update indicator
  if (DOM.routeIndicator) {
    DOM.routeIndicator.classList.remove('d-none');
    DOM.rciDot.style.background = color;
    DOM.rciLabel.textContent = getRouteColorLabel(options);
  }

  routeDrawn = true;
}

// ================================================
//  PLAN ROUTE (BACKEND VERSION)
// ================================================
async function planRoute() {
  const startKey = DOM.startSelect.value;
  const endKey = DOM.endSelect.value;

  if (!startKey || !endKey) {
    showToast('Select both Start and End.', 'warning', 'Missing');
    return;
  }
  if (startKey === endKey) {
    showToast('Start and End must differ.', 'error', 'Invalid');
    return;
  }

  // Loading
  DOM.planBtnText.classList.add('d-none');
  DOM.planBtnLoader.classList.remove('d-none');
  DOM.planBtn.disabled = true;

  try {
    const options = getSelectedOptions();
    
    // AI auto-selects algorithm - no user choice needed

    const response = await fetch('/api/plan_route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        start: startKey, 
        end: endKey, 
        options: options
      })
    });

    const data = await response.json();

    DOM.planBtnText.classList.remove('d-none');
    DOM.planBtnLoader.classList.add('d-none');
    DOM.planBtn.disabled = false;

    if (data.success) {
      const result = data.result;
      const path = result.path;
      const dist = result.total_dist;
      const algo = result.algorithm;
      const reason = result.reason;

      drawRoute(path, options);
      updateSummary(path, dist, options, algo, reason);

      if (DOM.algoStat) {
        DOM.algoStat.textContent = algo ? algo.toUpperCase() : 'AI';
      }

      DOM.mapStatus.innerHTML = '<i class="bi bi-check-circle me-2" style="color:#22c55e"></i>Route: <strong>'+path.join(' → ')+'</strong> ('+dist.toFixed(1)+' km)';
      DOM.mapStatus.style.borderColor = 'rgba(34,197,94,0.4)';
      showToast(path.length-1+' stops, '+dist.toFixed(1)+' km via '+algo, 'success', 'Route Found!');
    } else {
      showToast(data.message || 'No route found.', 'error', 'Error');
    }
  } catch (err) {
    DOM.planBtnText.classList.remove('d-none');
    DOM.planBtnLoader.classList.add('d-none');
    DOM.planBtn.disabled = false;
    showToast('Server connection error.', 'error', 'Error');
  }
}

// ================================================
 //  UPDATE SUMMARY
 // ================================================
 function updateSummary(path, distance, options, algorithm, reason) {
   const timeMin = Math.round((distance / 30) * 60);
   const fuelUsed = ((distance / 100) * 6.5).toFixed(2);

   DOM.summaryDist.textContent = distance.toFixed(1) + ' km';
   DOM.summaryTime.textContent = timeMin < 60 ? timeMin + ' min' : Math.floor(timeMin/60) + 'h ' + (timeMin%60) + 'm';
   DOM.summaryFuel.textContent = '~' + fuelUsed + ' L';

   let reasoning = reason || '';
   if (!reasoning) {
     if (!options || options.length === 0) {
       reasoning = 'Shortest path via ' + path.join(' → ') + ' using ' + (algorithm || 'A*');
     } else if (options.length > 1) {
       reasoning = 'Multi-optimized: ' + options.join(' + ') + '. Path: ' + path.join(' → ');
     } else {
       const map = {
         traffic: 'Avoided high-traffic zones. Via ' + path.join(' → ') + '.',
         fuel: 'Fuel-efficient route via ' + path.join(' → ') + '.',
         roads: 'Best road quality via ' + path.join(' → ') + '.'
       };
       reasoning = map[options[0]] || 'Optimal path via ' + path.join(' → ');
     }
   }
   DOM.summaryReason.textContent = reasoning;
   DOM.summarySection.style.display = 'block';
 }

// ================================================
//  CLEAR ROUTE
// ================================================
function clearRoute() {
  if (currentLine) { map.removeLayer(currentLine); currentLine = null; }
  if (glowLine) { map.removeLayer(glowLine); glowLine = null; }

  // Reset markers
  Object.values(markers).forEach(function(marker) {
    const el = marker.getElement();
    if (!el) return;
    const inner = el.querySelector('div');
    if (inner) { inner.style.transform = ''; inner.style.boxShadow = ''; }
    marker.closePopup();
  });

  DOM.startSelect.value = '';
  DOM.endSelect.value = '';
  document.getElementById('optTraffic').checked = false;
  document.getElementById('optFuel').checked = false;
  document.getElementById('optRoads').checked = false;
  handleOptionChange();

  DOM.summarySection.style.display = 'none';
  if (DOM.routeIndicator) DOM.routeIndicator.classList.add('d-none');
  DOM.mapStatus.innerHTML = '<i class="bi bi-info-circle me-2"></i>Select start and end locations';
  DOM.mapStatus.style.borderColor = '';

  resetMapView();
  routeDrawn = false;
  showToast('Route cleared.', 'info', 'Cleared');
}

// ================================================
//  OPTION CHANGE
// ================================================
function handleOptionChange() {
  const options = getSelectedOptions();
  const color = getRouteColor(options);

  Object.entries(DOM.chips).forEach(function(entry) {
    const key = entry[0], chip = entry[1];
    if (!chip) return;
    const inner = chip.querySelector('.chip-inner');
    if (inner) {
      inner.style.borderColor = options.includes(key) ? color : '';
      inner.style.boxShadow = options.includes(key) ? '0 0 0 1px ' + color + '40' : '';
    }
  });

  if (routeDrawn && currentLine) {
    const sk = DOM.startSelect.value, ek = DOM.endSelect.value;
    if (sk && ek && sk !== ek) {
      const result = dijkstra(GRAPH, sk, ek, options);
      if (result && result.path) {
        drawRoute(result.path, options);
        updateSummary(result.path, calculatePathDistance(result.path), options);
      }
    }
  }
}

// ================================================
//  SIDEBAR
// ================================================
function initSidebarToggle() {
  var toggleBtn = document.getElementById('sidebarToggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', function () {
    var isMobile = window.innerWidth < 992;
    if (isMobile) {
      DOM.sidebar.classList.toggle('mobile-open');
      DOM.overlay.classList.toggle('active');
    } else {
      DOM.sidebar.classList.toggle('collapsed');
    }
    setTimeout(function() { if (map) map.invalidateSize(); }, 350);
  });
}

function closeSidebar() {
  DOM.sidebar.classList.remove('mobile-open');
  DOM.overlay.classList.remove('active');
}

var resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    if (window.innerWidth >= 992) {
      DOM.sidebar.classList.remove('mobile-open');
      DOM.overlay.classList.remove('active');
    }
    if (map) map.invalidateSize();
  }, 100);
});

// ================================================
//  TOAST
// ================================================
function showToast(message, type, title) {
  if (!DOM.toastContainer) return;
  type = type || 'info';
  title = title || '';

  var icons = {
    success: { icon: 'bi-check-circle-fill', color: '#22c55e' },
    error: { icon: 'bi-x-circle-fill', color: '#ef4444' },
    warning: { icon: 'bi-exclamation-triangle-fill', color: '#f59e0b' },
    info: { icon: 'bi-info-circle-fill', color: '#3b82f6' }
  };
  var ic = icons[type] || icons.info;

  var toast = document.createElement('div');
  toast.className = 'toast-msg ' + type;
  toast.innerHTML = '<i class="bi ' + ic.icon + ' toast-icon" style="color:' + ic.color + '"></i><div class="toast-content">' + (title ? '<div class="toast-title">' + title + '</div>' : '') + '<div class="toast-body">' + message + '</div></div>';

  DOM.toastContainer.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 3000);
}
