"use client";

import {
  FilterType,
  LocusData,
  LocusEnum,
  MetricData,
  MetricEnum,
  MetricKindData,
  MetricKindEnum,
  OperatorData,
  OperatorEnum,
  OrderByData,
  OrderByEnum,
} from "@/lib/constants/US/filters";
import { faCaretDown, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import React, { ChangeEventHandler, useState } from "react";

export default function DemographicFilter() {
  const [filters, setFilters] = useState<FilterType[]>([]);

  const [locus, setLocus] = useState(LocusEnum.City);
  const [metric, setMetric] = useState(MetricEnum.MedianIncome);
  const [metricKind, setMetricKind] = useState(MetricKindEnum.Total);
  const [operator, setOperator] = useState(OperatorEnum.GreaterThan);
  const [threshold, setThreshold] = useState<number | string>("");
  const [rangeMin, setRangeMin] = useState<number | string>("");
  const [rangeMax, setRangeMax] = useState<number | string>("");
  const [orderBy, setOrderBy] = useState(OrderByEnum.Descending);

  const metricOptions = Object.entries(MetricData).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const metricKindOptions = MetricData[metric].variants.map((variant) => ({
    value: variant,
    label: MetricKindData[variant].label,
  }));

  const locusOptions = Object.entries(LocusData).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const operatorOptions = Object.entries(OperatorData).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const orderByOptions = Object.entries(OrderByData).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const addFilterButtonDisabled =
    metric === undefined || operator === undefined || threshold === "";

  const handleLocusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocus(event.target.value as any);
  };

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMetric(event.target.value as any);
  };

  const handleMetricKindChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Reset threshold inputs when changing metric kind
    // from percent to integer, and vice versa.
    setThreshold("");
    setRangeMin("");
    setRangeMax("");
    setMetricKind(event.target.value as any);
  };

  const handleOperatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOperator(event.target.value as any);
  };

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return setThreshold("");
    const parsed = parseInt(value);
    if (isNaN(parsed)) return;
    if (parsed < 0) return;
    if (metricKind === MetricKindEnum.Percent && parsed > 100) return;
    setThreshold(parsed);
  };

  const handleRangeMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return setRangeMin("");
    const parsed = parseInt(value);
    if (isNaN(parsed)) return;
    if (parsed < 0) return;
    setRangeMin(parsed);
  };

  const handleRangeMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return setRangeMax("");
    const parsed = parseInt(value);
    if (isNaN(parsed)) return;
    if (parsed < 0) return;
    if (metricKind === MetricKindEnum.Percent && parsed > 100) return;
    setRangeMax(parsed);
  };

  const handleOrderByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderBy(event.target.value as any);
  };

  const handleAddFilter = () => {
    if (!addFilterButtonDisabled) {
      // Replace existing filters of the same metric.
      const newFilters = [...filters.filter((filter) => filter.metric !== metric)];

      const filter = {
        metric,
        metricKind,
        operator,
        threshold: typeof threshold === "string" ? parseFloat(threshold || "0") : threshold,
        rangeMin: typeof rangeMin === "string" ? parseFloat(rangeMin || "0") : rangeMin,
        rangeMax: typeof rangeMax === "string" ? parseFloat(rangeMax || "0") : rangeMax,
        orderBy,
      };

      newFilters.push(filter);
      setFilters(newFilters);
    }
  };

  const removeFilter = (metric: MetricEnum) => {
    const newFilters = [...filters];
    const index = newFilters.findIndex((filter) => filter.metric === metric);
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const router = useRouter();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = [`locus=${locus}`];

    for (const filter of filters) {
      const encodedFilter = encodeURIComponent(JSON.stringify(filter));
      params.push(`filters=${encodedFilter}`);
    }

    const uri = `/search?${params.join("&")}`;

    router.push(uri);
  };

  return (
    <form className="mb-6 mt-3 max-w-xl space-y-3 rounded-lg border p-3" onSubmit={handleSubmit}>
      <h1 className="text-center font-bold">Demographic Filters</h1>

      <div className="grid grid-cols-3 gap-2">
        <Select value={locus} options={locusOptions} onChange={handleLocusChange} />
        <Select value={metric} options={metricOptions} onChange={handleMetricChange} />
        <Select value={metricKind} options={metricKindOptions} onChange={handleMetricKindChange} />
        <Select value={operator} options={operatorOptions} onChange={handleOperatorChange} />

        {operator === OperatorEnum.Range ? (
          <div className="flex gap-2">
            <Input value={rangeMin} placeholder="Min" onChange={handleRangeMinChange} />
            <Input value={rangeMax} placeholder="Max" onChange={handleRangeMaxChange} />
          </div>
        ) : (
          <Input
            value={threshold}
            placeholder={metricKind === MetricKindEnum.Total ? "Value" : "%"}
            onChange={handleThresholdChange}
          />
        )}

        <Select value={orderBy} options={orderByOptions} onChange={handleOrderByChange} />

        <div className="flex justify-center pt-2">
          <button
            type="button"
            className={classNames("rounded p-3 text-white", {
              "bg-blue-600": !addFilterButtonDisabled,
              "pointer-events-none bg-blue-300": addFilterButtonDisabled,
            })}
            onClick={handleAddFilter}
            disabled={addFilterButtonDisabled}
          >
            Add Filter
          </button>
        </div>
      </div>

      {/* Selected Filters */}
      <div className="font-medium text-gray-800">Selected Filters</div>
      <div className="mb-3 flex flex-col gap-2">
        {filters.map((filter, i: number) => (
          <Filter filter={filter} remove={removeFilter} key={i} />
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <button className="rounded bg-blue-600 p-3 text-white">Update Results</button>
      </div>
    </form>
  );
}

interface SelectProps {
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
}
function Select({ value, options, onChange }: SelectProps) {
  return (
    <div className="group relative w-full">
      <select
        value={value}
        className="relative w-full cursor-pointer rounded border bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500"
        onChange={onChange}
      >
        {options.map((option, i) => (
          <option value={option.value} key={i}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-0 top-0 flex h-full w-8 items-center justify-center">
        <FontAwesomeIcon
          icon={faCaretDown}
          className="text-xs text-slate-400 group-hover:text-slate-500"
        />
      </div>
    </div>
  );
}

interface InputProps {
  value: number | string;
  placeholder: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}
function Input({ value, placeholder, onChange }: InputProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full rounded border p-2.5 text-sm shadow-inner focus:border-blue-500"
    />
  );
}

interface FilterProps {
  filter: FilterType;
  remove: (metric: MetricEnum) => void;
}
function Filter({ filter, remove }: FilterProps) {
  return (
    <div className="flex items-center rounded bg-gradient-to-tl from-stone-700 to-stone-500">
      <div className="flex gap-2 whitespace-nowrap px-3 text-sm font-medium uppercase text-white">
        <span>{MetricData[filter.metric].label}</span>
        <span>{OperatorData[filter.operator].label}</span>
        <span>{filter.threshold}</span>
        <span>{OrderByData[filter.orderBy].label}</span>
      </div>
      <button
        type="button"
        className="ml-auto flex aspect-square h-10 items-center justify-center text-stone-400 hover:text-white"
        onClick={() => remove(filter.metric)}
      >
        <FontAwesomeIcon icon={faClose} className="text-sm" />
      </button>
    </div>
  );
}
