
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const city = url.searchParams.get("city");

  if (!city || city.trim().length > 100) {
    return Response.json(
      { error: "Please provide a valid city name." },
      { status: 400 }
    );
  }

  if (!env.OPENWEATHER_API_KEY) {
    return Response.json(
      { error: "Weather service is not configured." },
      { status: 500 }
    );
  }

  const apiUrl = new URL(
    "https://api.openweathermap.org/data/2.5/forecast"
  );

  apiUrl.searchParams.set("q", city.trim());
  apiUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY);
  apiUrl.searchParams.set("units", "metric");

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || "Unable to retrieve forecast." },
        { status: response.status }
      );
    }

    const timezone = data.city.timezone || 0;
    const days = {};

    for (const item of data.list) {
      const localDate = new Date(
        (item.dt + timezone) * 1000
      ).toISOString().slice(0, 10);

      if (!days[localDate]) {
        days[localDate] = {
          date: localDate,
          minTemp: item.main.temp_min,
          maxTemp: item.main.temp_max,
          rainProbability: 0,
          rainfall: 0,
          condition: item.weather[0].description
        };
      }

      const day = days[localDate];

      day.minTemp = Math.min(day.minTemp, item.main.temp_min);
      day.maxTemp = Math.max(day.maxTemp, item.main.temp_max);
      day.rainProbability = Math.max(
        day.rainProbability,
        item.pop || 0
      );
      day.rainfall += item.rain?.["3h"] || 0;
    }

    return Response.json({
      city: data.city.name,
      country: data.city.country,
      forecast: Object.values(days)
    });

  } catch {
    return Response.json(
      { error: "Forecast service temporarily unavailable." },
      { status: 502 }
    );
  }
}
