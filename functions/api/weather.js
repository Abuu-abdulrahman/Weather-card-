
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
    "https://api.openweathermap.org/data/2.5/weather"
  );

  apiUrl.searchParams.set("q", city.trim());
  apiUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY);
  apiUrl.searchParams.set("units", "metric");

  try {
    const response = await fetch(apiUrl);

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || "Unable to retrieve weather." },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Weather service temporarily unavailable." },
      { status: 502 }
    );
  }
}
