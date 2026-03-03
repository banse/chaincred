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

export function isInBearMarket(timestamp: number): boolean {
  return BEAR_MARKET_PERIODS.some(
    (p) => timestamp >= p.startTimestamp && timestamp <= p.endTimestamp,
  );
}
