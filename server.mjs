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

    // 4. AI-style summary
    let summary = `Greystones right now: ${temp}°C, wind ${wind} km/h, rain ${rain}mm.`;

    if (alerts.length === 0) {
      summary += " Conditions are calm with no alerts.";
    } else {
      summary += " Alerts: " + alerts.join(", ") + ".";
    }

    summary += ` Overall comfort: ${comfort}.`;

    // 5. Send to app
    res.json({
      weather,
      alerts,
      comfort,
      summary,
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
