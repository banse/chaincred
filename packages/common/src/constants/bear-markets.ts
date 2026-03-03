/** PRD 4.4 — Bear market periods (high-signal windows) */
export interface BearMarketPeriod {
  label: string;
  startTimestamp: number;
  endTimestamp: number;
}

export const BEAR_MARKET_PERIODS: BearMarketPeriod[] = [
  {
    label: 'Nov 2018 – Mar 2019',
    startTimestamp: 1541030400, // 2018-11-01
    endTimestamp: 1554076800,   // 2019-04-01
  },
  {
    label: 'May 2021 – Nov 2021',
    startTimestamp: 1619827200, // 2021-05-01
    endTimestamp: 1638316800,   // 2021-12-01
  },
  {
    label: 'Nov 2022 – Jan 2023',
    startTimestamp: 1667260800, // 2022-11-01
    endTimestamp: 1675209600,   // 2023-02-01
  },
];

/** Dynamic periods added at runtime via admin API */
const dynamicPeriods: BearMarketPeriod[] = [];

export function addBearMarketPeriod(period: BearMarketPeriod): void {
  dynamicPeriods.push(period);
}

export function removeBearMarketPeriod(label: string): boolean {
  const idx = dynamicPeriods.findIndex((p) => p.label === label);
  if (idx === -1) return false;
  dynamicPeriods.splice(idx, 1);
  return true;
}

export function getAllBearMarketPeriods(): BearMarketPeriod[] {
  return [...BEAR_MARKET_PERIODS, ...dynamicPeriods];
}

export function isInBearMarket(timestamp: number): boolean {
  return getAllBearMarketPeriods().some(
    (p) => timestamp >= p.startTimestamp && timestamp <= p.endTimestamp,
  );
}
