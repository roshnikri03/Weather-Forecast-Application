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