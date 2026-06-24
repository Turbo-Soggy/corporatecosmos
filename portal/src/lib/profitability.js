// Classify the free-text `profitability_status` (32+ distinct variants in the data:
// "Profitable", "Loss-making", "Not yet profitable", "Currently unprofitable",
// "Loss narrowing, working toward EBITDA profitability", "Near break-even", ...).
// A naive /profit/i match is wrong — it flags "unprofitable" and "Not yet profitable"
// as profitable. Shared by the KPI bar (% profitable) and the leaderboard (row color)
// so the two never disagree.

const NEGATED = /\bnot\b|unprofit|pre-?profit|\bnear\b|approach|toward|targeting|growth-stage|cost center|r&d-focused/;
const LOSS = /\bloss\b|loss[-\s]?making|unprofit|operating loss/;
const POSITIVE = /profitab|\bprofit\b|cash flow positive|fcf positive/;

/** 'profit' | 'loss' | 'unknown'. Only a clean positive assertion counts as profit. */
export function profitState(raw) {
  const s = String(raw ?? '').toLowerCase().trim();
  if (!s || /^(na|n\/a|none|tbd|not applicable)$/.test(s)) return 'unknown';
  if (LOSS.test(s)) return 'loss';
  if (POSITIVE.test(s) && !NEGATED.test(s)) return 'profit';
  return 'unknown'; // "near break-even", "pre-profit", "approaching", "cost center", ...
}
