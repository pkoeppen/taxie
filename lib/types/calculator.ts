import {
  CountryCode,
  Currency,
  US_FilingStatus,
  DE_FilingStatus,
  Schedule,
  US_States,
  US_MilitaryRank,
} from "../constants";

export type BaseTaxCalculatorOptions = {
  title?: string;
  currency?: Currency;
  principle?: number;
  apy?: number;
  years?: number;
  depositSchedule?: Schedule;
  compoundingSchedule?: Schedule;
  inflationRate?: number;
  expenses?: { name: string; amount: number }[];
};

export type US_TaxCalculatorOptions = BaseTaxCalculatorOptions & {
  country: CountryCode.US;
  state: US_States;
  filingStatus?: US_FilingStatus;
} & (
    | { salary: number; military?: never }
    | {
        salary?: never;
        military: {
          rank: US_MilitaryRank;
          serviceTime: number;
          location: number;
          dependents: boolean;
          bahJSON: any;
          mhaJSON: any;
        };
      }
  );

export type DE_TaxCalculatorOptions = BaseTaxCalculatorOptions & {
  country: CountryCode.DE;
  filingStatus?: DE_FilingStatus;
  salary: number;
  soliThreshold?: number;
  soliPercent?: number;
};

export type TaxCalculatorOptions =
  | US_TaxCalculatorOptions
  | DE_TaxCalculatorOptions;

export type Optional<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

export type UserFilter = {
  id: string;
  operator: string;
  threshold: string | number;
  order?: string;
};
