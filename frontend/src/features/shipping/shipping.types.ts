export enum RateType {
  FLAT = 'FLAT',
  WEIGHT = 'WEIGHT',
  PRICE = 'PRICE',
}

export interface CreateShippingMethodDto {
  name: string;
  code: string;
  description?: string;
  estimatedDays: string;
}

export interface CreateShippingZoneDto {
  methodId: string;
  name: string;
  countries: string[];
  states: string[];
  pincodes: string[];
  rateType: RateType;
  rate: number;
  freeAbove?: number;
  maxWeight?: number;
}

export interface CalculateShippingDto {
  country: string;
  state: string;
  pincode?: string;
  weight?: number;
  orderAmount?: number;
}

export interface ShippingMethodResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  estimatedDays: string;
  isActive: boolean;
}

export interface ShippingZoneResponse {
  id: string;
  methodId: string;
  name: string;
  countries: string[];
  states: string[];
  pincodes: string[];
  rateType: RateType;
  rate: number;
  freeAbove?: number;
  maxWeight?: number;
}

export interface ShippingCalculationResponse {
  methodCode: string;
  methodName: string;
  rate: number;
  estimatedDelivery: string;
  freeShipping: boolean;
}
