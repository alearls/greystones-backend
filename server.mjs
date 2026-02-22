import express from "express";

const app = express();
const PORT = 3000;

// WEATHER (raw endpoint)
app.get("/weather", async (req, res) => {
  try {
    const r = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=53.148&longitude=-6.065&current_weather=true"
    );
    res.json(await r.json());
  } catch {
    res.status(500).json({ error: "weather failed" });
  }
});

// Helper: pick a simple icon based on conditions
function pickIcon({ temp, wind, rain }) {
  if (rain >= 3) return "heavy-rain";
  if (rain > 0) return "rain";
  if (wind >= 40) return "windy";
  if (temp < 3) return "cold";
  if (temp > 20) return "warm";
  return "cloudy-sun";
}

// Helper: school run impact
function schoolRunImpact({ temp, wind, rain }) {
  // Simple scoring
  let level = "Easy";
  let reasons = [];

  if (rain > 0 && rain < 1) {
    level = "Moderate";
    reasons.push("Light rain");
  }
  if (rain >= 1) {
    level = "Challenging";
    reasons.push("Rainy conditions");
  }
  if (wind >= 40) {
    level = "Challenging";
    reasons.push("Strong winds");
  }
  if (temp < 3) {
    level = "Challenging";
    reasons.push("Very cold");
  }

  if (reasons.length === 0) {
    reasons.push("Dry and calm, good for school run");
  }

  return {
    level, // Easy / Moderate / Challenging
    reasons,
  };
}

// Helper: suggestion / guidance
function suggestion({ temp, wind, rain }) {
  const tips = [];

  if (rain > 0) tips.push("Bring a rain jacket or umbrella");
  if (temp < 5) tips.push("Wear a warm coat and hat");
  if (wind >= 40) tips.push("Secure loose items and expect a blustery walk");
  if (rain === 0 && temp >= 5 && wind < 30) tips.push("Nice conditions for a walk");

  if (tips.length === 0) {
    return "Conditions are fine, no special preparation needed.";
  }

  return tips.join(". ") + ".";
}

// STATUS (MAIN ENDPOINT FOR APP)
app.get("/status", async (req, res) => {
  try {
    // 1. Fetch real weather
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=53.14&longitude=-6.06&current_weather=true&hourly=precipitation,temperature_2m,wind_speed_10m"
    );
    const weather = await weatherRes.json();

    const temp = weather.current_weather.temperature;
    const wind = weather.current_weather.windspeed;
    const rain = weather.hourly.precipitation[0];

    // 2. Generate smarter alert rules
    const alerts = [];

    // Rain alerts
    if (rain > 0 && rain < 1) alerts.push("Light rain expected");
    if (rain >= 1 && rain < 3) alerts.push("Moderate rain");
    if (rain >= 3) alerts.push("Heavy rain");

    // Wind alerts
    if (wind >= 20 && wind < 40) alerts.push("Breezy conditions");
    if (wind >= 40 && wind < 60) alerts.push("Strong winds");
    if (wind >= 60) alerts.push("Gale-force winds");

    // Temperature alerts
    if (temp < 5 && temp >= 0) alerts.push("Cold temperatures");
    if (temp < 0) alerts.push("Freezing conditions");

    // 3. Comfort rating
    let comfort = "Comfortable";
    if (temp < 5 || wind > 40 || rain > 1) comfort = "Uncomfortable";
    if (temp < 0 || wind > 60 || rain > 3) comfort = "Severe";

    // 4. Icon + school run + suggestion
    const icon = pickIcon({ temp, wind, rain });
    const schoolRun = schoolRunImpact({ temp, wind, rain });
    const advice = suggestion({ temp, wind, rain });

    // 5. AI-style summary
    let summary = `Greystones right now: ${temp}°C, wind ${wind} km/h, rain ${rain}mm.`;

    if (alerts.length === 0) {
      summary += " Conditions are calm with no alerts.";
    } else {
      summary += " Alerts: " + alerts.join(", ") + ".";
    }

    summary += ` Overall comfort: ${comfort}.`;
    summary += ` School run: ${schoolRun.level} (${schoolRun.reasons.join(", ")}).`;

    // 6. Send to app
    res.json({
      weather,
      alerts,
      comfort,
      icon,          // for UI icons
      schoolRun,     // { level, reasons }
      advice,        // text suggestion
      summary,       // main AI-style text
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.log("Status error:", err);
    res.status(500).json({ error: "status failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
