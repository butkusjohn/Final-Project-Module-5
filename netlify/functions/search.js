export default async (request) => {
  const query = new URL(request.url).searchParams.get("s");

  if (!query || !query.trim()) {
    return Response.json({ error: "Enter a search term." }, { status: 400 });
  }

  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "API key is not configured." }, { status: 500 });
  }

  const params = new URLSearchParams({ apikey: apiKey, s: query });

  try {
    const response = await fetch(`https://www.omdbapi.com/?${params}`);

    if (!response.ok) {
      return Response.json({ error: "OMDb request failed." }, { status: 502 });
    }

    return Response.json(await response.json());
  } catch {
    console.error("Could not reach OMDb.");
    return Response.json({ error: "Could not reach OMDb." }, { status: 502 });
  }
};