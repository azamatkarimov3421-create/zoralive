import { v4 as uuid } from 'uuid';
import { db, runTransaction } from '../db/database';
import { config } from '../config';

function recordLedger(
  userId: string,
  currency: 'COINS' | 'DIAMONDS',
  amount: number,
  balanceAfter: number,
  txType: string,
  description: string,
  refId?: string
) {
  db.prepare(
    `INSERT INTO ledger (id, user_id, currency, amount, balance_after, tx_type, description, ref_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uuid(), userId, currency, amount, balanceAfter, txType, description, refId || null, new Date().toISOString());
}

export function creditCoins(userId: string, amount: number, txType: string, description: string, refId?: string) {
  if (amount <= 0) throw new Error('Summa musbat bo‘lishi kerak');
  return runTransaction(() => {
    const user = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    const newCoins = Number(user.coins) + amount;
    db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(newCoins, userId);
    recordLedger(userId, 'COINS', amount, newCoins, txType, description, refId);
    return { coins: newCoins };
  });
}

export function debitCoins(userId: string, amount: number, txType: string, description: string, refId?: string) {
  if (amount <= 0) throw new Error('Summa musbat bo‘lishi kerak');
  return runTransaction(() => {
    const user = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    if (Number(user.coins) < amount) throw new Error('Tangalar yetarli emas');
    const newCoins = Number(user.coins) - amount;
    db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(newCoins, userId);
    recordLedger(userId, 'COINS', -amount, newCoins, txType, description, refId);
    return { coins: newCoins };
  });
}

export function processGiftTransfer(params: {
  senderId: string;
  receiverId: string;
  giftId: string;
  quantity: number;
  roomId?: string;
}) {
  const qty = Math.max(1, Math.min(999, Math.floor(params.quantity || 1)));
  return runTransaction(() => {
    const gift = db.prepare('SELECT * FROM gifts WHERE id = ? AND is_active = 1').get(params.giftId);
    if (!gift) throw new Error('Sovg‘a topilmadi');

    const sender = db.prepare('SELECT * FROM users WHERE id = ?').get(params.senderId);
    const receiver = db.prepare('SELECT * FROM users WHERE id = ?').get(params.receiverId);
    if (!sender || !receiver) throw new Error('Foydalanuvchi topilmadi');

    const totalCost = Number(gift.price) * qty;
    if (Number(sender.coins) < totalCost) {
      throw new Error('Tangalar yetarli emas! Hamyonni to‘ldiring.');
    }

    const newSenderCoins = Number(sender.coins) - totalCost;
    const newSenderWealth = Number(sender.wealth_xp) + totalCost;
    db.prepare('UPDATE users SET coins = ?, wealth_xp = ? WHERE id = ?').run(
      newSenderCoins,
      newSenderWealth,
      sender.id
    );
    recordLedger(
      sender.id,
      'COINS',
      -totalCost,
      newSenderCoins,
      'GIFT_SEND',
      `${gift.name_uz} x${qty} -> ${receiver.display_name}`,
      params.roomId
    );

    const hostDiamonds = Math.max(1, Math.floor(totalCost * config.economy.hostDiamondShare));
    const newReceiverDiamonds = Number(receiver.diamonds) + hostDiamonds;
    const newReceiverCharm = Number(receiver.charm_xp) + totalCost;
    db.prepare('UPDATE users SET diamonds = ?, charm_xp = ? WHERE id = ?').run(
      newReceiverDiamonds,
      newReceiverCharm,
      receiver.id
    );
    recordLedger(
      receiver.id,
      'DIAMONDS',
      hostDiamonds,
      newReceiverDiamonds,
      'GIFT_RECEIVE',
      `${sender.display_name} dan ${gift.name_uz} x${qty}`,
      params.roomId
    );

    // Agency commission bonus if receiver belongs to an agency
    let agencyBonus = 0;
    if (receiver.agency_id) {
      const agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(receiver.agency_id);
      if (agency) {
        const rate = Number(agency.commission_rate || config.economy.agencyDiamondShare);
        agencyBonus = Math.floor(totalCost * rate);
        if (agencyBonus > 0) {
          db.prepare('UPDATE agencies SET total_earned = total_earned + ? WHERE id = ?').run(
            agencyBonus,
            agency.id
          );
          const owner = db.prepare('SELECT id, diamonds FROM users WHERE id = ?').get(agency.owner_id);
          if (owner) {
            const ownerDiamonds = Number(owner.diamonds) + agencyBonus;
            db.prepare('UPDATE users SET diamonds = ? WHERE id = ?').run(ownerDiamonds, owner.id);
            recordLedger(
              owner.id,
              'DIAMONDS',
              agencyBonus,
              ownerDiamonds,
              'AGENCY_BONUS',
              `Agentlik komissiyasi (${receiver.display_name})`,
              agency.id
            );
          }
        }
      }
    }

    if (params.roomId) {
      db.prepare('UPDATE rooms SET total_gifts = total_gifts + ? WHERE id = ?').run(totalCost, params.roomId);
    }

    if (sender.family_id) {
      db.prepare('UPDATE families SET honor_xp = honor_xp + ? WHERE id = ?').run(totalCost, sender.family_id);
    }
    if (receiver.family_id && receiver.family_id !== sender.family_id) {
      db.prepare('UPDATE families SET honor_xp = honor_xp + ? WHERE id = ?').run(totalCost, receiver.family_id);
    }

    return {
      gift,
      quantity: qty,
      totalCost,
      hostDiamonds,
      agencyBonus,
      senderCoins: newSenderCoins,
      receiverDiamonds: newReceiverDiamonds,
      senderName: sender.display_name,
      senderAvatar: sender.avatar,
      senderVip: sender.vip_level,
      receiverName: receiver.display_name,
    };
  });
}

export function exchangeDiamondsToCoins(userId: string, diamondsAmount: number) {
  const amt = Math.floor(diamondsAmount);
  if (amt < 10) throw new Error('Kamida 10 ta olmos almashtirish mumkin');
  return runTransaction(() => {
    const user = db.prepare('SELECT id, coins, diamonds FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    if (Number(user.diamonds) < amt) throw new Error('Olmoslar yetarli emas');

    const coinsGain = Math.floor(amt * config.economy.diamondToCoinRate);
    const newDiamonds = Number(user.diamonds) - amt;
    const newCoins = Number(user.coins) + coinsGain;

    db.prepare('UPDATE users SET diamonds = ?, coins = ? WHERE id = ?').run(newDiamonds, newCoins, userId);
    recordLedger(userId, 'DIAMONDS', -amt, newDiamonds, 'EXCHANGE', `${amt} olmos -> ${coinsGain} tanga`);
    recordLedger(userId, 'COINS', coinsGain, newCoins, 'EXCHANGE', `${amt} olmosdan konvertatsiya`);

    return { coins: newCoins, diamonds: newDiamonds, coinsGain };
  });
}

export function createWithdrawalRequest(params: {
  userId: string;
  diamondsAmount: number;
  method: string;
  destination: string;
  kycFullName: string;
}) {
  const amt = Math.floor(params.diamondsAmount);
  if (amt < config.economy.minWithdrawDiamonds) {
    throw new Error(`Minimal yechib olish miqdori ${config.economy.minWithdrawDiamonds} olmos`);
  }
  return runTransaction(() => {
    const user = db.prepare('SELECT id, diamonds FROM users WHERE id = ?').get(params.userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    if (Number(user.diamonds) < amt) throw new Error('Olmoslar yetarli emas');

    const newDiamonds = Number(user.diamonds) - amt;
    db.prepare('UPDATE users SET diamonds = ? WHERE id = ?').run(newDiamonds, params.userId);

    const usdAmount = Number((amt / config.economy.diamondsPerUsd).toFixed(2));
    const reqId = uuid();
    db.prepare(
      `INSERT INTO payout_requests (id, user_id, diamonds_amount, usd_amount, method, destination, kyc_full_name, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
    ).run(
      reqId,
      params.userId,
      amt,
      usdAmount,
      params.method,
      params.destination,
      params.kycFullName,
      new Date().toISOString()
    );

    recordLedger(
      params.userId,
      'DIAMONDS',
      -amt,
      newDiamonds,
      'WITHDRAW',
      `Pul yechish so‘rovi (${params.method}: ${usdAmount} USD)`,
      reqId
    );

    return { id: reqId, diamonds: newDiamonds, usdAmount };
  });
}
