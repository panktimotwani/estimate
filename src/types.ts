/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Item {
  id: string;
  name: string;
  unit: string;
  rate: number;
  category?: string;
  requiresSize?: boolean;
  useInches?: boolean;
}

export interface EstimateLineItem {
  id: string;
  itemId: string;
  name: string;
  unit: string;
  rate: number;
  quantity: number;
  length?: number;
  width?: number;
  requiresSize?: boolean;
  useInches?: boolean;
  subDescription?: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientName: string;
  clientAddress?: string;
  clientContact?: string;
  salespersonName?: string;
  date: string;
  items: EstimateLineItem[];
  freightCharge?: number;
  labourCharge?: number;
  discount?: number;
  total: number;
}

export const MEASURING_UNITS = [
  "kg",
  "gram",
  "nos",
  "pcs",
  "mtr",
  "sq.ft",
  "sq.mtr",
  "lit",
  "bag",
  "set",
  "box"
] as const;
