import { ORIGIN_ADDRESS } from "@/lib/config";
import { CoordinatePair, DeliveryQuote, GeocodeResult } from "@/types/delivery";
import { getPricingForDistance } from "@/lib/pricing";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OSRM_BASE = "https://router.project-osrm.org";

const buildUserAgent = () => {
  const contact = process.env.OSM_CONTACT?.trim();
  return contact
    ? `delivery-fee-calculator (contact: ${contact})`
    : "delivery-fee-calculator (set OSM_CONTACT to add contact info)";
};

const REQUEST_HEADERS = {
  "User-Agent": buildUserAgent(),
};

async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    cache: "no-store",
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error("Unable to reach geocoding service");
  }

  const payload = await response.json();
  const feature = payload?.[0];

  if (!feature) {
    throw new Error(`No match found for ${address}`);
  }

  const lon = Number(feature.lon);
  const lat = Number(feature.lat);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error(`Invalid coordinates returned for ${address}`);
  }

  return {
    coordinates: [lon, lat],
    name: feature.display_name ?? address,
  };
}

function haversineMiles([lon1, lat1]: CoordinatePair, [lon2, lat2]: CoordinatePair) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

async function fetchDrivingDistance(origin: CoordinatePair, destination: CoordinatePair): Promise<number | null> {
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url = new URL(`${OSRM_BASE}/route/v1/driving/${coords}`);
  url.searchParams.set("overview", "false");
  url.searchParams.set("alternatives", "false");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const distanceMeters = payload.routes?.[0]?.distance;
  if (typeof distanceMeters !== "number") {
    return null;
  }

  return distanceMeters / 1609.34;
}

const cloneCoordinates = (coords: CoordinatePair): CoordinatePair => [coords[0], coords[1]];

export async function buildDeliveryQuote(destinationAddress: string, originAddress?: string): Promise<DeliveryQuote> {
  const resolvedOriginAddress = originAddress?.trim() || ORIGIN_ADDRESS;

  const [origin, destination] = await Promise.all([
    geocodeAddress(resolvedOriginAddress),
    geocodeAddress(destinationAddress),
  ]);

  let distanceMiles = await fetchDrivingDistance(origin.coordinates, destination.coordinates);
  let distanceSource: DeliveryQuote["distanceSource"] = "driving";

  if (distanceMiles === null) {
    distanceMiles = haversineMiles(origin.coordinates, destination.coordinates);
    distanceSource = "straight-line";
  }

  const tier = getPricingForDistance(distanceMiles);

  return {
    destinationAddress: destination.name,
    distanceMiles: Number(distanceMiles.toFixed(2)),
    price: tier.price,
    tierLabel: tier.label,
    distanceSource,
    originAddress: resolvedOriginAddress,
    originCoordinates: cloneCoordinates(origin.coordinates),
    destinationCoordinates: cloneCoordinates(destination.coordinates),
  };
}
