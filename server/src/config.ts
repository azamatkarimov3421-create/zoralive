export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'zoralive-super-secret-jwt-key-2026',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  economy: {
    // 1 Coin spent on gift -> Host receives 50% as Diamonds, Agency gets 10% bonus, Platform retains 40%
    hostDiamondShare: 0.5,
    agencyDiamondShare: 0.1,
    // 100 Diamonds = $1.00 USD equivalent for host withdrawals
    diamondsPerUsd: 100,
    minWithdrawDiamonds: 500, // $5 minimum payout
    diamondToCoinRate: 0.8, // 100 Diamonds -> 80 Coins instant conversion
  },
};
