# WeatherNow

A real-time weather forecast web application built with HTML, Tailwind CSS, and vanilla JavaScript, powered by the OpenWeatherMap API.

---

## 🔗 GitHub Repository

👉 https: https://github.com/roshnikri03/Weather-Forecast-Application
👉 Clone using HTTPS: https://github.com/roshnikri03/Weather-Forecast-Application.git

## Features

- **City search** — type any city name and press Search or Enter
- **GPS location search** — one-click weather for your current location via browser geolocation
- **Recent cities dropdown** — last 10 searched cities stored in localStorage; shown on input focus or while typing; hidden by default
- **Current weather card** — city name, country, live date/time, weather icon, temperature, feels like, weather description
- **Temperature unit toggle** — switch between °C and °F on the current weather card only
- **3 stat boxes** — Humidity, Wind Speed (km/h), Visibility (km)
- **5-day forecast** — one card per day with date, icon, temperature, description, wind, and humidity
- **Dynamic backgrounds** — body gradient changes based on weather condition (sunny, cloudy, rainy, stormy, snowy, foggy)
- **Animated rain overlay** — 80 raindrop elements animate when weather is Rain, Drizzle, or Thunderstorm
- **Extreme temperature alerts** — dismissable orange alert for temperatures above 40°C or below 0°C
- **Input validation** — friendly red error messages for empty input, numeric-only input, or invalid characters (no JS alert() calls)
- **API error handling** — human-readable messages for 401, 404, 429, and network errors
- **Fully responsive** — optimised for desktop, iPad Mini (768px), and iPhone SE (375px)

---

## Setup Instructions

### 1. Get a free OpenWeatherMap API key

1. Go to [https://openweathermap.org/](https://openweathermap.org/) and create a free account.
2. After logging in, navigate to **API keys** under your profile menu.
3. Copy your default API key (or generate a new one).
4. Note: new API keys may take up to 2 hours to activate.

### 2. Add your API key to the project

Open `app.js` in any text editor and replace the placeholder on line 10:

```javascript
// Before
const API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

// After (example)
const API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
```

### 3. Run the application

Simply open `weather_forcasting_page.html` in any modern web browser — no build tools, no server, no npm install required.

```
Double-click weather_forcasting_page.html
  OR
Right-click weather_forcasting_page.html > Open with > Chrome / Firefox / Edge
```

> Tip: For the GPS location feature to work, your browser must allow location access. Most browsers require HTTPS or localhost for geolocation; if the 📍 button does not work when opening the file directly, use a local server such as VS Code Live Server.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and semantic markup |
| Tailwind CSS (CDN) | Utility-first responsive styling |
| Vanilla JavaScript (ES2020) | All interactivity, API calls, DOM manipulation |
| OpenWeatherMap API | Current weather (`/weather`) and forecast (`/forecast`) data |
| localStorage | Persisting recent city search history |
| CSS `@keyframes` | Animated rain effect |
| Browser Geolocation API | GPS-based weather lookup |

---

## File Structure

```
Weather project/
├── weather_forcasting_page.html  — App shell, Tailwind CDN, all UI markup
├── weather_forecast_style.css    — Weather condition body classes, rain animation, hover effects
├── app.js                        — All JavaScript: fetch, display, validation, events
└── README.md                     — This file
```

---

## API Endpoints Used

| Endpoint | Usage |
|---|---|
| `GET /weather?q={city}` | Current weather by city name |
| `GET /weather?lat={lat}&lon={lon}` | Current weather by coordinates |
| `GET /forecast?q={city}` | 5-day / 3-hour forecast by city name |
| `GET /forecast?lat={lat}&lon={lon}` | 5-day / 3-hour forecast by coordinates |

Weather icon images are loaded from:
```
https://openweathermap.org/img/wn/{icon}@2x.png
```

---

## Notes

- Wind speed from the API is in **m/s**; the app converts it to **km/h** (multiplied by 3.6).
- The 5-day forecast picks one entry per calendar day — whichever 3-hour slot is closest to **12:00 noon**.
- Today's date is excluded from the forecast grid; the next 5 calendar days are shown.
- The temperature unit toggle (°C / °F) applies only to the current weather card, not the forecast cards.
