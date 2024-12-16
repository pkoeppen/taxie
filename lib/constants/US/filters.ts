export enum MetricKindEnum {
  Total = "Total",
  Percent = "Percent",
}

export const MetricKindData = {
  [MetricKindEnum.Total]: {
    label: "Total",
  },
  [MetricKindEnum.Percent]: {
    label: "Percent",
  },
};

export enum LocusEnum {
  ZIP = "ZIP",
  City = "City",
  County = "County",
  State = "State",
}

export const LocusData = {
  [LocusEnum.ZIP]: {
    label: "ZIP",
  },
  [LocusEnum.City]: {
    label: "City",
  },
  [LocusEnum.County]: {
    label: "County",
  },
  [LocusEnum.State]: {
    label: "State",
  },
};

export enum MetricEnum {
  MedianIncome = "MedianIncome",
  PopulationTotal = "PopulationTotal",
  PopulationMale = "PopulationMale",
  PopulationFemale = "PopulationFemale",
  PopulationWhite = "PopulationWhite",
  PopulationBlack = "PopulationBlack",
  PopulationHispanic = "PopulationHispanic",
  PopulationAsian = "PopulationAsian",
  PopulationNative = "PopulationNative",
  PopulationPacific = "PopulationPacific",
  PopulationOther = "PopulationOther",
}

export const MetricData = {
  [MetricEnum.MedianIncome]: {
    id: "S2001_C01_002",
    variants: [MetricKindEnum.Total],
    label: "Median Income",
    short: "Income",
    emoji: "💸",
  },
  [MetricEnum.PopulationTotal]: {
    id: "DP05_0001",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Total",
    short: "Total pop.",
    emoji: "👫",
  },
  [MetricEnum.PopulationMale]: {
    id: "DP05_0002",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Male",
    short: "Male pop.",
    emoji: "♂️",
  },
  [MetricEnum.PopulationFemale]: {
    id: "DP05_0003",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Female",
    short: "Female pop.",
    emoji: "♂️",
  },
  [MetricEnum.PopulationWhite]: {
    id: "DP05_0037",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, White",
    short: "White pop.",
    emoji: "🧑🏻",
  },
  [MetricEnum.PopulationBlack]: {
    id: "DP05_0038",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Black",
    short: "Black pop.",
    emoji: "🐵",
  },
  [MetricEnum.PopulationHispanic]: {
    id: "DP05_0071",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Hispanic",
    short: "Hispanic pop.",
    emoji: "👨🏾‍🌾",
  },
  [MetricEnum.PopulationAsian]: {
    id: "DP05_0044",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Asian",
    short: "Asian pop.",
    emoji: "😑",
  },
  [MetricEnum.PopulationNative]: {
    id: "DP05_0039",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, American Indian",
    short: "Native pop.",
    emoji: "🧑🏾",
  },
  [MetricEnum.PopulationPacific]: {
    id: "DP05_0052",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Pacific Islander",
    short: "Pacific pop.",
    emoji: "🧑🏾",
  },
  [MetricEnum.PopulationOther]: {
    id: "DP05_0057",
    variants: [MetricKindEnum.Total, MetricKindEnum.Percent],
    label: "Population, Other",
    short: "Other pop.",
    emoji: "👽",
  },
};

export enum OperatorEnum {
  GreaterThan = "GreaterThan",
  LessThan = "LessThan",
  EqualTo = "EqualTo",
  Range = "Range",
}

export const OperatorData = {
  [OperatorEnum.GreaterThan]: {
    label: "Greater than",
  },
  [OperatorEnum.LessThan]: {
    label: "Less than",
  },
  [OperatorEnum.EqualTo]: {
    label: "Equal to",
  },
  [OperatorEnum.Range]: {
    label: "Range",
  },
};

export enum OrderByEnum {
  Ascending = "Ascending",
  Descending = "Descending",
}

export const OrderByData = {
  [OrderByEnum.Ascending]: {
    id: "asc",
    label: "Ascending",
  },
  [OrderByEnum.Descending]: {
    id: "desc",
    label: "Descending",
  },
};

export type FilterType = {
  metric: MetricEnum;
  metricKind: MetricKindEnum;
  operator: OperatorEnum;
  threshold: number;
  rangeMin: number;
  rangeMax: number;
  orderBy: OrderByEnum;
};
