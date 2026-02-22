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

    // 2. Generate simple alert rules
    const alerts = [];
    if (rain > 0) alerts.push(`Rain detected: ${rain}mm`);
    if (wind > 40) alerts.push(`High winds: ${wind} km/h`);
    if (temp < 3) alerts.push(`Freezing temperatures: ${temp}°C`);

    // 3. AI-style summary
    let summary = `Current conditions in Greystones: ${temp}°C, wind ${wind} km/h, rain ${rain}mm.`;
    if (alerts.length > 0) {
      summary += ` Alerts: ${alerts.join(", ")}.`;
    }

    // 4. Send to app
    res.json({
      weather,
      alerts,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.log("Status error:", err);
    res.status(500).json({ error: "status failed" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
