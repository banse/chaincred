export type BadgeType =
  | 'builder'
  | 'governor'
  | 'explorer'
  | 'og'
  | 'multichain'
  | 'trusted'
  | 'power-user';

export interface Badge {
  type: BadgeType;
  label: string;
  description: string;
  color: string;
  earned: boolean;
  earnedAt?: number;
}

export interface BadgeCriteria {
  type: BadgeType;
  check: string;
}

export interface WalletBadges {
  address: string;
  badges: Badge[];
}
