export type DeliveryRequestPayload = {
  address: string;
  originAddress?: string;
};

export type CoordinatePair = [number, number]; // [longitude, latitude]

export type GeocodeResult = {
  coordinates: CoordinatePair;
  name: string;
};

export type DeliveryQuote = {
  destinationAddress: string;
  distanceMiles: number;
  price: number;
  tierLabel: string;
  distanceSource: "driving" | "straight-line";
  originAddress: string;
  originCoordinates: CoordinatePair;
  destinationCoordinates: CoordinatePair;
};
