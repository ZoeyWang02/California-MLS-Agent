import { query } from "../db.js";

export interface CityMarketSummary {
  City: string;
  sold_count: number;
  avg_close_price: number;
  avg_price_per_sqft: number;
  avg_dom: number;
  list_to_close_pct: number;
}

export async function getCityMarketSummary(): Promise<CityMarketSummary[]> {
  const sql = `
    SELECT
      City,
      COUNT(*)                                       AS sold_count,
      ROUND(AVG(ClosePrice), 0)                      AS avg_close_price,
      ROUND(AVG(ClosePrice / NULLIF(LivingArea,0)),0) AS avg_price_per_sqft,
      ROUND(AVG(DaysOnMarket), 1)                    AS avg_dom,
      ROUND(AVG(ClosePrice / NULLIF(ListPrice,0)) * 100, 1) AS list_to_close_pct
    FROM california_sold
    WHERE PropertyType = 'Residential'
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      AND LivingArea > 0
    GROUP BY City
    ORDER BY sold_count DESC
    LIMIT 25
  `;
  return query<CityMarketSummary>(sql);
}
