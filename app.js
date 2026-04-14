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

/* =============================================
   DYNAMIC BACKGROUND + RAIN EFFECT
   ============================================= */

/**
 * Apply a CSS class on <body> based on weather condition string.
 * Triggers rain animation for rain/drizzle/thunderstorm conditions.
 * @param {string} mainWeather - e.g. "Rain", "Clear", "Clouds"
 */
function applyDynamicBackground(mainWeather) {
  const condition = mainWeather.toLowerCase();

  // Remove all condition classes
  document.body.classList.remove('rainy', 'stormy', 'sunny', 'cloudy', 'snowy', 'foggy');
  clearRainEffect();

  if (condition.includes('thunderstorm')) {
    document.body.classList.add('stormy');
    createRainEffect();
  } else if (condition.includes('drizzle') || condition.includes('rain')) {
    document.body.classList.add('rainy');
    createRainEffect();
  } else if (condition.includes('snow')) {
    document.body.classList.add('snowy');
  } else if (
    condition.includes('mist')  ||
    condition.includes('fog')   ||
    condition.includes('haze')  ||
    condition.includes('smoke') ||
    condition.includes('dust')  ||
    condition.includes('sand')  ||
    condition.includes('ash')   ||
    condition.includes('squall')||
    condition.includes('tornado')
  ) {
    document.body.classList.add('foggy');
  } else if (condition.includes('clear')) {
    document.body.classList.add('sunny');
  } else if (condition.includes('cloud')) {
    document.body.classList.add('cloudy');
  }
  // else: default dark-blue gradient remains
}

/** Create 80 animated raindrop elements inside the rain overlay div */
function createRainEffect() {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 80; i++) {
    const drop = document.createElement('div');
    drop.classList.add('raindrop');

    const leftPct  = (Math.random() * 100).toFixed(2);          // 0–100%
    const height   = Math.floor(Math.random() * 18) + 10;        // 10–28 px
    const duration = (Math.random() * 0.8 + 0.5).toFixed(2);    // 0.5–1.3 s
    const delay    = (Math.random() * 2).toFixed(2);             // 0–2 s

    drop.style.left              = `${leftPct}%`;
    drop.style.height            = `${height}px`;
    drop.style.animationDuration = `${duration}s`;
    drop.style.animationDelay   = `-${delay}s`; // negative delay for instant start at random phase

    fragment.appendChild(drop);
  }

  rainOverlay.appendChild(fragment);
}

/** Remove all raindrop elements from the overlay */
function clearRainEffect() {
  rainOverlay.innerHTML = '';
}

/* =============================================
   DISPLAY FUNCTIONS
   ============================================= */

/**
 * Render the current weather card.
 * Stores temperature values and calls applyDynamicBackground.
 * @param {object} data - OpenWeatherMap /weather response
 */
function displayWeather(data) {
  // Store temperatures
  currentTempC  = data.main.temp;
  currentFeelsC = data.main.feels_like;

  // City name + country
  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;

  // Current date/time
  cityDateEl.textContent = formatDate(new Date());

  // Weather icon
  const iconCode = data.weather[0].icon;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIconEl.alt = data.weather[0].description;

  // Temperature and feels-like (respects isCelsius)
  updateTempDisplay();

  // Description
  weatherDescEl.textContent = data.weather[0].description;

  // Stats
  humidityEl.textContent   = `${data.main.humidity}%`;
  windEl.textContent       = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
  visibilityEl.textContent = (data.visibility !== undefined)
    ? `${(data.visibility / 1000).toFixed(1)} km`
    : 'N/A';

  // Show the weather content section
  weatherContent.classList.remove('hidden');

  // Apply conditional background / rain
  applyDynamicBackground(data.weather[0].main);

  // Extreme temperature warning
  checkExtremeTemp(currentTempC);
}

/**
 * Render the 5-day forecast cards.
 * Groups forecast list by calendar day; picks the entry closest to 12:00 noon.
 * @param {object} data - OpenWeatherMap /forecast response
 */
function displayForecast(data) {
  const list = data.list;

  // Group entries by calendar date string (YYYY-MM-DD)
  const byDay = {};
  list.forEach(entry => {
    const dateStr = entry.dt_txt.split(' ')[0];
    if (!byDay[dateStr]) byDay[dateStr] = [];
    byDay[dateStr].push(entry);
  });

  // Exclude today; take up to 5 upcoming days
  const todayStr = new Date().toISOString().split('T')[0];
  const days = Object.keys(byDay)
    .filter(d => d !== todayStr)
    .slice(0, 5);

  forecastGrid.innerHTML = '';

  days.forEach(dayStr => {
    const entries = byDay[dayStr];

    // Pick the entry whose time is closest to 12:00:00
    const noonEntry = entries.reduce((best, cur) => {
      const curHour  = parseInt(cur.dt_txt.split(' ')[1].replace(/:/g, ''), 10);
      const bestHour = parseInt(best.dt_txt.split(' ')[1].replace(/:/g, ''), 10);
      return Math.abs(curHour - 120000) < Math.abs(bestHour - 120000) ? cur : best;
    });

    const date    = new Date(noonEntry.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const tempC   = Math.round(noonEntry.main.temp);
    const icon    = noonEntry.weather[0].icon;
    const desc    = noonEntry.weather[0].description;
    const wind    = (noonEntry.wind.speed * 3.6).toFixed(1);
    const hum     = noonEntry.main.humidity;

    const card = document.createElement('div');
    card.className = 'forecast-card rounded-2xl p-4 border border-white/10 text-center flex flex-col items-center gap-2';
    card.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)';

    card.innerHTML = `
      <p class="font-bold text-white text-sm">${dayName}</p>
      <p class="text-blue-200 text-xs">${dateNum}</p>
      <img
        src="https://openweathermap.org/img/wn/${icon}@2x.png"
        alt="${desc}"
        class="w-12 h-12 drop-shadow"
        loading="lazy"
      />
      <p class="text-white font-extrabold text-lg">${tempC}°C</p>
      <p class="text-blue-200 text-xs capitalize leading-tight">${desc}</p>
      <div class="flex gap-3 mt-1 text-xs text-blue-200/80">
        <span title="Humidity">💧 ${hum}%</span>
        <span title="Wind speed">🌬️ ${wind} km/h</span>
      </div>
    `;

    forecastGrid.appendChild(card);
  });
}

/* =============================================
   API FETCH FUNCTIONS
   ============================================= */

/**
 * Fetch current weather + 5-day forecast by city name (parallel requests).
 * @param {string} city
 */
async function fetchWeatherByCity(city) {
  showLoading();
  hideError();
  hideAlert();

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
    ]);

    if (!weatherRes.ok) {
      const errData = await weatherRes.json().catch(() => ({}));
      handleApiError(weatherRes.status, errData.message);
      return;
    }

    if (!forecastRes.ok) {
      const errData = await forecastRes.json().catch(() => ({}));
      handleApiError(forecastRes.status, errData.message);
      return;
    }

    const weatherData  = await weatherRes.json();
    const forecastData = await forecastRes.json();

    addRecentCity(weatherData.name); // use API-normalised city name
    displayWeather(weatherData);
    displayForecast(forecastData);

  } catch (err) {
    showError('Network error — please check your internet connection and try again.');
  } finally {
    hideLoading();
  }
}

/**
 * Fetch current weather + 5-day forecast by GPS coordinates (parallel requests).
 * @param {number} lat
 * @param {number} lon
 */
async function fetchWeatherByCoords(lat, lon) {
  showLoading();
  hideError();
  hideAlert();

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    if (!weatherRes.ok) {
      const errData = await weatherRes.json().catch(() => ({}));
      handleApiError(weatherRes.status, errData.message);
      return;
    }

    if (!forecastRes.ok) {
      const errData = await forecastRes.json().catch(() => ({}));
      handleApiError(forecastRes.status, errData.message);
      return;
    }

    const weatherData  = await weatherRes.json();
    const forecastData = await forecastRes.json();

    addRecentCity(weatherData.name);
    displayWeather(weatherData);
    displayForecast(forecastData);

  } catch (err) {
    showError('Network error — please check your internet connection and try again.');
  } finally {
    hideLoading();
  }
}

/* =============================================
   SEARCH TRIGGER & VALIDATION
   ============================================= */

function triggerSearch() {
  const city = cityInput.value.trim();

  if (!city) {
    showError('Please enter a city name to search.');
    return;
  }

  // Reject purely numeric input
  if (/^\d+$/.test(city)) {
    showError('City names cannot be purely numeric. Please enter a valid city name.');
    return;
  }

  // Allow letters (including accented), spaces, hyphens, apostrophes, commas, dots
  if (!/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s'\-,\.]+$/.test(city)) {
    showError('City name contains invalid characters. Please use letters, spaces, hyphens, or commas only.');
    return;
  }

  hideDropdown();
  fetchWeatherByCity(city);
}

/* =============================================
   EVENT LISTENERS
   ============================================= */

// Search button click
searchBtn.addEventListener('click', () => {
  triggerSearch();
});

// Enter key in input field
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    triggerSearch();
  }
});

// Typing in input — filter dropdown to matching recent cities
cityInput.addEventListener('input', () => {
  const val = cityInput.value.trim().toLowerCase();
  const all = getRecentCities();

  if (val === '') {
    if (all.length > 0) renderDropdown(all);
    else hideDropdown();
    return;
  }

  const filtered = all.filter(c => c.toLowerCase().startsWith(val));
  if (filtered.length > 0) {
    renderDropdown(filtered);
  } else {
    hideDropdown();
  }
});

// Focus on input — show all recent cities
cityInput.addEventListener('focus', () => {
  const all = getRecentCities();
  if (all.length > 0) renderDropdown(all);
});

// Click outside input/dropdown — close dropdown
document.addEventListener('click', (e) => {
  if (!cityInput.contains(e.target) && !dropdown.contains(e.target)) {
    hideDropdown();
  }
});

// GPS location button
locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser. Please search by city name instead.');
    return;
  }

  locationBtn.textContent = '⏳';
  locationBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationBtn.textContent = '📍';
      locationBtn.disabled = false;
      fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    (err) => {
      locationBtn.textContent = '📍';
      locationBtn.disabled = false;

      if (err.code === 1) { // PERMISSION_DENIED
        showError('Location access denied. Please allow location permissions in your browser and try again.');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        showError('Location information is unavailable. Please search by city name instead.');
      } else if (err.code === 3) { // TIMEOUT
        showError('Location request timed out. Please try again or search by city name.');
      } else {
        showError('Unable to retrieve your location. Please search by city name instead.');
      }
    },
    { timeout: 10000, maximumAge: 300000 }
  );
});

// Toggle to Celsius
btnCelsius.addEventListener('click', () => {
  if (!isCelsius) {
    isCelsius = true;
    btnCelsius.classList.add('active');
    btnFahrenheit.classList.remove('active');
    updateTempDisplay();
  }
});

// Toggle to Fahrenheit
btnFahrenheit.addEventListener('click', () => {
  if (isCelsius) {
    isCelsius = false;
    btnFahrenheit.classList.add('active');
    btnCelsius.classList.remove('active');
    updateTempDisplay();
  }
});

// Close error box
errorClose.addEventListener('click', hideError);

// Close alert box
alertClose.addEventListener('click', hideAlert);
