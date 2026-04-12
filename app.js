/* =============================================
   WeatherNow — app.js
   =============================================
   Replace 'YOUR_OPENWEATHERMAP_API_KEY' below
   with your actual API key from openweathermap.org
   ============================================= */

const API_KEY = 'c036c291b6fd820fc104013b082fc936';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/* ---------- State ---------- */
let currentTempC  = null;  // current temperature stored in Celsius
let currentFeelsC = null;  // feels-like temperature in Celsius
let isCelsius     = true;  // unit toggle state

/* ---------- DOM references ---------- */
const cityInput      = document.getElementById('city-input');
const searchBtn      = document.getElementById('search-btn');
const locationBtn    = document.getElementById('location-btn');
const dropdown       = document.getElementById('dropdown');
const dropdownList   = document.getElementById('dropdown-list');
const errorBox       = document.getElementById('error-box');
const errorMessage   = document.getElementById('error-message');
const errorClose     = document.getElementById('error-close');
const alertBox       = document.getElementById('alert-box');
const alertMessage   = document.getElementById('alert-message');
const alertClose     = document.getElementById('alert-close');
const loadingEl      = document.getElementById('loading');
const weatherContent = document.getElementById('weather-content');
const rainOverlay    = document.getElementById('rain-overlay');

// Current weather elements
const cityNameEl     = document.getElementById('city-name');
const cityDateEl     = document.getElementById('city-date');
const weatherIconEl  = document.getElementById('weather-icon');
const tempDisplayEl  = document.getElementById('temp-display');
const feelsLikeEl    = document.getElementById('feels-like');
const weatherDescEl  = document.getElementById('weather-desc');
const humidityEl     = document.getElementById('humidity-val');
const windEl         = document.getElementById('wind-val');
const visibilityEl   = document.getElementById('visibility-val');
const forecastGrid   = document.getElementById('forecast-grid');

// Unit toggle buttons
const btnCelsius     = document.getElementById('btn-celsius');
const btnFahrenheit  = document.getElementById('btn-fahrenheit');

/* =============================================
   UTILITY HELPERS
   ============================================= */

/** Convert Celsius to Fahrenheit */
function cToF(c) {
  return (c * 9 / 5) + 32;
}

/** Format a Date object to a readable locale string */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit'
  });
}

/* =============================================
   LOADING / ERROR / ALERT UI
   ============================================= */

function showLoading() {
  loadingEl.classList.remove('hidden');
  weatherContent.classList.add('hidden');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBox.classList.remove('hidden');
  weatherContent.classList.add('hidden');
}

function hideError() {
  errorBox.classList.add('hidden');
}

function showAlert(msg) {
  alertMessage.textContent = msg;
  alertBox.classList.remove('hidden');
}

function hideAlert() {
  alertBox.classList.add('hidden');
}

/** Map HTTP status codes / API messages to friendly error text */
function handleApiError(status, apiMsg) {
  if (status === 401) {
    showError(
      'API key rejected (401). If your key is newly created, it can take up to 2 hours to activate. Please wait and try again.'
    );
  } else if (status === 404) {
    showError('City not found. Please check the spelling and try again.');
  } else if (status === 429) {
    showError('Too many requests. Please wait a moment and try again.');
  } else {
    showError(
      `Weather service error (${status}): ${apiMsg || 'Unknown error. Please try again later.'}`
    );
  }
}

/** Show a weather alert if temperature is extreme */
function checkExtremeTemp(tempC) {
  if (tempC > 40) {
    showAlert(
      `⚠️ Extreme heat alert! Current temperature is ${Math.round(tempC)}°C — stay hydrated and avoid prolonged sun exposure.`
    );
  } else if (tempC < 0) {
    showAlert(
      `❄️ Freezing temperature alert! Current temperature is ${Math.round(tempC)}°C — dress warmly and watch for icy conditions.`
    );
  }
}

/* =============================================
   TEMPERATURE DISPLAY
   ============================================= */

/**
 * Update just the main temperature element based on isCelsius flag.
 * Also refreshes the "Feels like" line.
 */
function updateTempDisplay() {
  if (currentTempC === null) return;

  if (isCelsius) {
    tempDisplayEl.textContent = `${Math.round(currentTempC)}°C`;
  } else {
    tempDisplayEl.textContent = `${Math.round(cToF(currentTempC))}°F`;
  }

  // Update feels-like line if available
  if (currentFeelsC !== null) {
    if (isCelsius) {
      feelsLikeEl.textContent = `Feels like ${Math.round(currentFeelsC)}°C`;
    } else {
      feelsLikeEl.textContent = `Feels like ${Math.round(cToF(currentFeelsC))}°F`;
    }
  }
}

/* =============================================
   RECENT CITIES (localStorage)
   ============================================= */

const STORAGE_KEY = 'weathernow_recent_cities';

/** Normalize, deduplicate, keep max 10, save to localStorage */
function addRecentCity(city) {
  if (!city || !city.trim()) return;

  const normalized = city.trim().replace(/\b\w/g, c => c.toUpperCase());
  let cities = getRecentCities();

  // Remove duplicates (case-insensitive) then put at front
  cities = cities.filter(c => c.toLowerCase() !== normalized.toLowerCase());
  cities.unshift(normalized);

  if (cities.length > 10) cities = cities.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

/** Retrieve recent cities array from localStorage */
function getRecentCities() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Render (or update) the dropdown list.
 * @param {string[]} [cities] - filtered cities; defaults to all recent.
 */
function renderDropdown(cities) {
  if (!cities) cities = getRecentCities();

  if (cities.length === 0) {
    hideDropdown();
    return;
  }

  dropdownList.innerHTML = '';

  cities.forEach(city => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `<span class="city-icon">🕐</span><span>${city}</span>`;
    item.addEventListener('click', () => {
      cityInput.value = city;
      hideDropdown();
      triggerSearch();
    });
    dropdownList.appendChild(item);
  });

  dropdown.classList.remove('hidden');
}

function hideDropdown() {
  dropdown.classList.add('hidden');
  dropdownList.innerHTML = '';
}