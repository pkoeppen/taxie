export const DAYS_IN_YEAR = 365;
export const AVG_INFLATION_RATE = 0.04;

export enum CountryCode {
  US = "US",
  DE = "DE",
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
}

export const CurrencySymbol = {
  [Currency.USD]: "$",
  [Currency.EUR]: "€",
};

export const CurrencyMap = {
  [CountryCode.US]: Currency.USD,
  [CountryCode.DE]: Currency.EUR,
};

export const ExchangeRates = {
  // All rates relative to USD.
  [Currency.USD]: 1,
  [Currency.EUR]: 1.09,
};

export enum Schedule {
  Yearly = 1,
  Biannually = 2,
  Quarterly = 4,
  Bimonthly = 6,
  Monthly = 12,
  Biweekly = 24,
  Weekly = 52,
  Daily = 365,
}
