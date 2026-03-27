export type DeliveryRequestPayload = {
  address: string;
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
  originCoordinates: CoordinatePair;
  destinationCoordinates: CoordinatePair;
};
