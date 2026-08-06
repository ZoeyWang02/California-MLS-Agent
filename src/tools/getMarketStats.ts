import { query } from "../db.js";

export interface CityMarketSummary {
  City: string;
  sold_count: number;
  avg_close_price: number;
  median_close_price: number;
  avg_price_per_sqft: number;
  avg_dom: number;
  list_to_close_pct: number;
}

export async function getCityMarketSummary(): Promise<CityMarketSummary[]> {
  // MySQL has no built-in MEDIAN(); the standard workaround is to rank rows
  // within each city by ClosePrice and average the one (odd count) or two
  // (even count) middle-ranked rows.
  const sql = `
    WITH stats AS (
      SELECT
        City,
        ClosePrice,
        ROW_NUMBER() OVER (PARTITION BY City ORDER BY ClosePrice) AS rn,
        COUNT(*) OVER (PARTITION BY City) AS cnt,
        ROUND(AVG(ClosePrice) OVER (PARTITION BY City), 0) AS avg_close_price,
        ROUND(AVG(ClosePrice / NULLIF(LivingArea,0)) OVER (PARTITION BY City), 0) AS avg_price_per_sqft,
        ROUND(AVG(DaysOnMarket) OVER (PARTITION BY City), 1) AS avg_dom,
        ROUND(AVG(ClosePrice / NULLIF(ListPrice,0)) OVER (PARTITION BY City) * 100, 1) AS list_to_close_pct
      FROM california_sold
      WHERE PropertyType = 'Residential'
        AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND LivingArea > 0
    )
    SELECT
      City,
      cnt          AS sold_count,
      avg_close_price,
      ROUND(AVG(ClosePrice), 0) AS median_close_price,
      avg_price_per_sqft,
      avg_dom,
      list_to_close_pct
    FROM stats
    WHERE rn IN (FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2))
    GROUP BY City, cnt, avg_close_price, avg_price_per_sqft, avg_dom, list_to_close_pct
    ORDER BY sold_count DESC
    LIMIT 25
  `;
  return query<CityMarketSummary>(sql);
}
