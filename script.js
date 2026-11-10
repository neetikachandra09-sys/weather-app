const $ = id => document.getElementById(id);

const NAMES = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Heavy rain", 71: "Snow", 73: "Snow", 75: "Heavy snow",
  80: "Showers", 81: "Showers", 82: "Heavy showers",
  95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm"
};

// Simple line icons
const CLOUD = '<path d="M18 42a9 9 0 0 1-1-17.9A13 13 0 0 1 42 22a10 10 0 0 1 2 20z"/>';
const ICONS = {
  sun:   '<circle cx="32" cy="32" r="10"/><path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4"/>',
  moon:  '<path d="M44 40A18 18 0 0 1 24 14a18 18 0 1 0 20 26z"/>',
  cloud: CLOUD,
  rain:  CLOUD + '<path d="M22 50l-3 7M32 50l-3 7M42 50l-3 7"/>',
  snow:  CLOUD + '<path d="M22 52h.1M32 55h.1M42 52h.1"/>',
  storm: CLOUD + '<path d="M34 44l-6 8h8l-6 8"/>',
  fog:   '<path d="M12 24h40M8 34h40M16 44h40"/>'
};

// Pick a color scheme + icon for the weather: [background, text, icon]
function theme(code, day) {
  if (code >= 95) return ["#4a3f63", "#f3eefc", "storm"];
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return ["#dce8f1", "#1d2b38", "snow"];
  if (code >= 51) return ["#587f9f", "#f4f8fb", "rain"];
  if (code === 45 || code === 48) return ["#c9c5bb", "#262521", "fog"];
  if (code >= 2) return ["#b7c2cd", "#1d242b", "cloud"];
  return day ? ["#f4c542", "#241c05", "sun"] : ["#1f2a44", "#eef1fa", "moon"];
}

let data = null;
let useF = false;

// Draw the weather on the page
function show() {
  const { place, c } = data;
  const [bg, fg, icon] = theme(c.weather_code, c.is_day);
  const t = v => Math.round(useF ? v * 9 / 5 + 32 : v) + "°";

  document.documentElement.style.setProperty("--bg", bg);
  document.documentElement.style.setProperty("--fg", fg);

  $("icon").innerHTML = ICONS[icon];
  $("place").textContent = `${place.name}, ${place.country_code || place.country}`;
  $("temp").textContent = t(c.temperature_2m);
  $("desc").textContent = NAMES[c.weather_code] || "—";
  $("feels").textContent = t(c.apparent_temperature);
  $("hum").textContent = c.relative_humidity_2m + "%";
  $("wind").textContent = Math.round(c.wind_speed_10m) + " km/h";
  $("unit").textContent = useF ? "Switch to °C" : "Switch to °F";

  $("hint").hidden = true;
  $("result").hidden = false;
}

// Look up a city, then fetch its weather
async function search() {
  const city = $("city").value.trim();
  if (!city) return;
  $("error").textContent = "";

  try {
    // 1. City name -> coordinates
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geo = await geoRes.json();
    if (!geo.results) {
      $("error").textContent = `Couldn't find “${city}”.`;
      return;
    }
    const place = geo.results[0];

    // 2. Coordinates -> current weather
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day`;
    const wxRes = await fetch(url);
    const c = (await wxRes.json()).current;

    data = { place, c };
    show();
  } catch (err) {
    console.error(err);
    $("error").textContent = `Error: ${err.message}. If this says "Failed to fetch", the page can't reach open-meteo.com.`;
  }
}

// Events
$("go").addEventListener("click", search);
$("city").addEventListener("keydown", e => e.key === "Enter" && search());
$("unit").addEventListener("click", () => { useF = !useF; show(); });
document.querySelectorAll(".chip").forEach(b =>
  b.addEventListener("click", () => { $("city").value = b.textContent; search(); })
);

// Icons on the start screen
$("landing").innerHTML = ["sun", "cloud", "rain", "snow", "storm"]
  .map(k => `<svg viewBox="0 0 64 64">${ICONS[k]}</svg>`).join("");