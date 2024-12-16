import {
  FilterType,
  LocusEnum,
  MetricData,
  MetricEnum,
  MetricKindEnum,
  OperatorEnum,
  OrderByEnum,
} from "@/lib/constants/US/filters";
import { db } from "@/lib/postgres";
import { DB } from "@/lib/types/db";
import { QueryCreator, sql } from "kysely";

interface QueryOptions {
  locus: LocusEnum;
  filters: FilterType[];
}
export async function executeQuery({ locus, filters }: QueryOptions) {
  //
  console.log("\n\n\n");
  const foo = await db
    .with("balls", (db) =>
      db
        .with("percent", (db) =>
          db
            .selectFrom("acs_metric")
            .selectAll()
            .where("acs_metric.id", "=", `DP05_0037PE`),
        )
        .with("total", (db) =>
          db
            .selectFrom("acs_metric")
            .selectAll()
            .where("acs_metric.id", "=", `DP05_0037E`),
        )
        .selectFrom("percent")
        .innerJoin("total", "total.zip_code", "percent.zip_code")
        .innerJoin("zip", "zip.zip_code", "percent.zip_code")
        .select([
          "zip.city_name",
          sql`
          ROUND(
            (SUM(percent.estimate * total.estimate) / NULLIF(SUM(total.estimate), 0)
          )::NUMERIC, 1)
        `.as("wavg"),
        ])
        .groupBy(["zip.city_name"]),
    )
    .selectFrom("acs_metric")
    .innerJoin("zip", "zip.zip_code", "acs_metric.zip_code")
    .innerJoin("balls", "balls.city_name", "zip.city_name")
    .select(["zip.city_name", "balls.wavg"])
    .where("balls.wavg", "is not", null)
    .groupBy(["zip.city_name", "balls.wavg"])
    .limit(20)
    .orderBy("balls.wavg", "desc")
    .compile();

  console.log("result:", foo.sql);
  console.log("\n\n\n");
  //

  const groupByExpression = getGroupByExpression(locus);

  const _filters = [
    {
      metric: MetricEnum.MedianIncome,
      metricKind: MetricKindEnum.Total,
      operator: OperatorEnum.GreaterThan,
      threshold: 30000,
      rangeMin: 0,
      rangeMax: 0,
      orderBy: OrderByEnum.Descending,
    },
    {
      metric: MetricEnum.PopulationWhite,
      metricKind: MetricKindEnum.Percent,
      operator: OperatorEnum.GreaterThan,
      threshold: 70,
      rangeMin: 0,
      rangeMax: 0,
      orderBy: OrderByEnum.Descending,
    },
  ];

  console.log("filters:", _filters);

  let base = db;

  // let base = db
  //   .selectFrom("acs_metric")
  //   .select(["acs_metric.zip_code", sql`AVG(COALESCE(acs_metric.estimate, 0))`.as("avg")])
  //   .where("acs_metric.estimate", "is not", null);
  //.leftJoin("zip", "zip.zip_code", "acs_metric.zip_code");

  for (let i = 0; i < _filters.length; i++) {
    const filter = _filters[i];
    const filterId = `filter-${i}`;
    const baseMetricId = MetricData[filter.metric].id;
    const metricId =
      baseMetricId + (filter.metricKind === MetricKindEnum.Total ? "E" : "PE");

    if (filter.metric === MetricEnum.MedianIncome) {
      base = withAverage(base, filterId, metricId, groupByExpression);
    } else if (filter.metricKind === MetricKindEnum.Total) {
      base = withSum(base, filterId, metricId, groupByExpression);
    } else if (filter.metricKind === MetricKindEnum.Percent) {
      base = withWeightedAverage(
        base,
        filterId,
        baseMetricId,
        groupByExpression,
      );
      const foo = await base
        .selectFrom("acs_metric")
        .innerJoin("filter-0")
        .groupBy(groupByExpression)
        .limit(20)
        .offset(0)
        .compile();
      console.log("foo:", foo);
    } else {
      throw new Error(`Unable to determine SELECT expression`);
    }
  }

  base = base
    .selectFrom("acs_metric")
    .innerJoin("filter-0")
    .groupBy(groupByExpression)
    .limit(20)
    .offset(0);

  const { sql: query } = await base.compile();
  const result = await base.execute();

  console.log("\n", query, "\n");
  console.log("result:", result);
}

function getGroupByExpression(locus: LocusEnum) {
  if (locus === LocusEnum.ZIP) {
    return "zip.zip_code";
  }
  if (locus === LocusEnum.City) {
    return "zip.city_name";
  }
  if (locus === LocusEnum.County) {
    return "zip.county_name";
  }
  if (locus === LocusEnum.State) {
    return "zip.state_id";
  }
  throw new Error(`Unable to determine GROUP BY expression`);
}

function withSum(
  base: QueryCreator<DB>,
  filterId: string,
  metricId: string,
  groupByExpression: string,
) {
  return base.with(filterId, (db) =>
    db
      .selectFrom("acs_metric")
      .select([sql`SUM(acs_metric.estimate)`.as("sum")])
      .where("acs_metric.id", "=", metricId)
      .groupBy(groupByExpression as any),
  );
}

function withAverage(
  base: QueryCreator<DB>,
  filterId: string,
  metricId: string,
  groupByExpression: string,
) {
  return base.with(filterId, (db) =>
    db
      .selectFrom("acs_metric")
      .select([sql`ROUND(AVG(acs_metric.estimate), 2)`.as("avg")])
      .where("acs_metric.id", "=", metricId)
      .groupBy(groupByExpression as any),
  );
}

function withWeightedAverage(
  base: QueryCreator<DB>,
  filterId: string,
  baseMetricId: string,
  groupByExpression: string,
) {
  return base.with(filterId, (db) =>
    db
      .with("percent", (db) =>
        db
          .selectFrom("acs_metric")
          .selectAll()
          .where("acs_metric.id", "=", `${baseMetricId}PE`),
      )
      .with("total", (db) =>
        db
          .selectFrom("acs_metric")
          .selectAll()
          .where("acs_metric.id", "=", `${baseMetricId}E`),
      )
      .selectFrom("percent")
      .select([
        sql`
          ROUND(
            (SUM(percent.estimate * total.estimate) / NULLIF(SUM(total.estimate), 0)
          ), 1)
        `.as("wavg"),
      ])
      .innerJoin("total", "total.zip_code", "percent.zip_code")
      .innerJoin("zip", "zip.zip_code", "percent.zip_code")
      .groupBy(groupByExpression as any),
  );
}

// export class Query {
//   private constructor() {}

//   public static async run(query: QueryData) {
//     let sql;
//     if (query.locus === Locus.ZIP) {
//       sql = this.buildQuery(query);
//     } else {
//       sql = this.buildAggregateQuery(query);
//     }

//     sql += " LIMIT 12 OFFSET 0";

//     const formatted = sqlFormat(sql, { language: "postgresql" });
//     logger.verbose(`\n${formatted}`);

//     // TODO: Index ACS metrics to reduce long "order by" times?

//     console.log(query);
//     return null;

//     const res = await client.query(sql);
//     return res.rows;
//   }

//   private static buildQuery(queryData: QueryData) {
//     const _with = [];
//     const _select = [];
//     const _join = [];
//     const _order = [];

//     for (let i = 0; i < queryData.criteria.length; i++) {
//       const c = queryData.criteria[i];
//       if (!c.label) {
//         c.label = c.id;
//       }
//       const id = `C${i}`;
//       _with.push(
//         `${id} AS (SELECT zip_code, estimate FROM acs_metric WHERE id = '${c.id}' AND estimate ${c.operator} ${c.threshold})`,
//       );
//       _select.push(`${id}.estimate AS ` + c.label);
//       if (i > 0) {
//         _join.push(`JOIN ${id} ON C0.zip_code = ${id}.zip_code`);
//       }
//       if (c.order) {
//         _order.push(`${id}.estimate ${c.order.toUpperCase()}`);
//       }
//     }

//     const sql = [
//       "WITH",
//       _with.join(", "),
//       "SELECT",
//       "geo.city_name,",
//       "geo.county_name,",
//       "geo.state_id,",
//       "geo.zip_code,",
//       _select.join(", "),
//       "FROM C0",
//       _join.join(" "),
//       "JOIN zip geo ON C0.zip_code = geo.zip_code",
//       _order.length ? "ORDER BY " + _order.join(", ") : "",
//     ].join(" ");

//     return sql;
//   }

//   private static buildAggregateQuery(queryData: QueryData) {
//     const selectors = ["state_id"];
//     if (queryData.locus === Locus.County) {
//       selectors.unshift("county_name");
//     }
//     if (queryData.locus === Locus.City) {
//       selectors.unshift("city_name", "county_name");
//     }

//     const _with: string[] = [];
//     const _select = selectors.map((s) => `C0.${s}`);
//     const _join: string[] = [];
//     const _where: string[] = [];
//     const _order: string[] = [];

//     const processCriterion = (c: Criterion, id: string, addWhere = true) => {
//       if (!c.label) {
//         c.label = c.id;
//       }

//       const geo = selectors.map((s) => `geo.${s}`).join(", ");
//       const subselect = [geo];
//       const aggregate = ACSMetricData[c.id].aggregate;

//       if (aggregate === Aggregate.Sum) {
//         subselect.push(`SUM(acs_metric.estimate) AS ${c.label}`);
//       }
//       if (aggregate === Aggregate.Average) {
//         subselect.push(`ROUND(AVG(acs_metric.estimate)::NUMERIC, 2) AS ${c.label}`);
//       }

//       if (aggregate === Aggregate.WeightedAverage) {
//         subselect.push(
//           `ROUND((SUM(p.estimate * e.estimate) / NULLIF(SUM(e.estimate), 0))::NUMERIC, 1) AS ${c.label}`,
//         );
//         const estimateId = c.id.replace(/PE$/, "E");
//         _with.push(
//           `${id} AS (SELECT ${subselect.join(", ")} ` +
//             `FROM acs_metric p JOIN acs_metric e ON p.zip_code = e.zip_code AND p.id = '${c.id}' AND e.id = '${estimateId}' ` +
//             `JOIN zip geo ON geo.zip_code = p.zip_code ` +
//             `WHERE p.id = '${c.id}' GROUP BY ${geo})`,
//         );
//       } else {
//         _with.push(
//           `${id} AS (SELECT ${subselect.join(", ")} ` +
//             `FROM acs_metric JOIN zip geo ON geo.zip_code = acs_metric.zip_code ` +
//             `WHERE acs_metric.id = '${c.id}' GROUP BY ${geo})`,
//         );
//       }

//       _select.push(`${id}.${c.label} AS "${c.label}"`);

//       if (id !== "C0") {
//         _join.push(`JOIN ${id} ON ${selectors.map((s) => `${id}.${s} = C0.${s}`).join(" AND ")}`);
//       }

//       if (c.operator) {
//         _where.push(`${id}.${c.label} ${c.operator} ${c.threshold}`);
//       }

//       if (c.order) {
//         _order.push(`${c.label} ${c.order.toUpperCase()}`);
//       }
//     };

//     let i = 0;
//     while (i < queryData.criteria.length) {
//       processCriterion(queryData.criteria[i], `C${i}`);
//       i++;
//     }

//     if (!queryData.criteria.find((c) => c.id === ACSMetric.MedianIncome)) {
//       processCriterion(
//         {
//           id: ACSMetric.MedianIncome,
//         } as Criterion,
//         `C${i++}`,
//       );
//     }
//     if (!queryData.criteria.find((c) => c.id === ACSMetric.TotalPopulation)) {
//       processCriterion(
//         {
//           id: ACSMetric.TotalPopulation,
//         } as Criterion,
//         `C${i++}`,
//       );
//     }

//     const sql = [
//       "WITH",
//       _with.join(", "),
//       "SELECT",
//       _select.join(", "),
//       "FROM C0",
//       _join.join(" "),
//       `WHERE`,
//       _where.join(" AND "),
//       _order.length ? "ORDER BY " + _order.join(", ") : "",
//     ].join(" ");

//     return sql;
//   }
// }
