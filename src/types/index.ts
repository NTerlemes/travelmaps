export enum TravelStatus {
  NONE = 'none',
  VISITED = 'visited',
  LIVED = 'lived',
  FROM = 'from',
  CURRENT = 'current'
}

export interface Country {
  code: string;
  name: string;
  subdivisions: Subdivision[];
}

export interface Subdivision {
  code: string;
  name: string;
  countryCode: string;
}

export interface TravelData {
  countryCode: string;
  subdivisionCode?: string;
  status: TravelStatus;
}

export interface UserTravelMap {
  id: string;
  name: string;
  travelData: TravelData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MapColors {
  [TravelStatus.NONE]: string;
  [TravelStatus.VISITED]: string;
  [TravelStatus.LIVED]: string;
  [TravelStatus.FROM]: string;
  [TravelStatus.CURRENT]: string;
}