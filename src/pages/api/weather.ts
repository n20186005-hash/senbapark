import type { APIRoute } from 'astro';

// 千波公園（千波湖）の座標
const LAT = 36.370985;
const LON = 140.4541765;

// サーバー側で短くキャッシュし、外部へ向かうリクエストを抑える
const CACHE_TTL_MS = 30 * 60 * 1000;

let cache: { ts: number; payload: unknown } | null = null;

export const prerender = false;

function json(body: unknown, ok: boolean, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': ok ? 'public, max-age=1800, s-maxage=1800' : 'no-store',
    },
  });
}

export const GET: APIRoute = async () => {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return json(cache.payload, true);
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(LAT));
  url.searchParams.set('longitude', String(LON));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,is_day'
  );
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max'
  );
  url.searchParams.set('timezone', 'Asia/Tokyo');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return json({ error: 'upstream_unavailable' }, false, 502);
    const data = await res.json();
    cache = { ts: Date.now(), payload: data };
    return json(data, true);
  } catch {
    if (cache) return json(cache.payload, true);
    return json({ error: 'weather_unavailable' }, false, 503);
  }
};
