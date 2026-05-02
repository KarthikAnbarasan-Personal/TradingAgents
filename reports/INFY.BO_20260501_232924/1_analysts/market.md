## INFY.BO Technical Trend Report (as of 2026-04-30)

### Most relevant indicators selected (8, non-redundant)
1. **close_10_ema** – captures the very recent momentum shift (fast trend).
2. **close_50_sma** – medium-term trend and “fair value” dynamic support/resistance.
3. **close_200_sma** – long-term regime filter (risk-on vs risk-off).
4. **macd** – momentum/trend-change confirmation.
5. **macdh** – momentum *acceleration/deceleration* (early inflection).
6. **rsi** – gauges oversold/relief potential and reversal risk.
7. **boll_ub** – upper volatility envelope to assess “breakout exhaustion”/volatility regime.
8. **atr** – quantifies current volatility for stops/position sizing.

*(These avoid redundancy by not overusing multiple oscillators/duplicative band components—e.g., using only boll_ub with RSI for oscillator context.)*

---

## 1) Price context: sharp downside break into the end of April
From the OHLCV you provided, the stock sold off aggressively into late April:
- **2026-04-16 close ~1318.6**
- **2026-04-24 close ~1154.5** (major breakdown day)
- **2026-04-29 close ~1167.5**
- **2026-04-30 close ~116? (last close shown 1167.5 on 2026-04-29; 04-30 is “current trading date” for indicators)**

This looks like a transition from a **recovery/sideways** phase earlier in April into a **downtrend leg**.

---

## 2) Trend structure: bearish across 10 EMA / 50 SMA / 200 SMA
### Short-term (10 EMA): deteriorating and rolling over
- **close_10_ema (2026-04-30): ~1212.47**
- Recent 10 EMA values were higher (e.g., ~1300–1400 earlier in April), meaning the short-term trend has **fully turned down**.
- With the market closing near the **mid/low teens ~1160–1170** region while 10 EMA is **~1212**, price is **below** the fast trend proxy → rallies are likely to be sold unless price reclaims the EMA.

### Medium-term (50 SMA): price now well below
- **close_50_sma (2026-04-30): ~1285.08**
- That’s a large gap vs current price (~1167–1170). When price is this far below the 50 SMA, you typically get:
  - weak “mean reversion” attempts
  - overhead supply until price can close back above the 50 SMA zone.

### Long-term (200 SMA): strong bearish regime filter
- **close_200_sma (2026-04-30): ~1468.14**
- Price is far below the 200 SMA → long-term trend bias remains **bearish / risk-off**, so any rallies are statistically more likely to be **corrective** rather than immediately trend-reversing.

**Actionable takeaway:** trend-following longs are lower probability until INFY.BO reclaims at least **10 EMA** and ideally climbs back toward **50 SMA**.

---

## 3) Momentum: MACD strongly negative, but histogram suggests momentum may be stabilizing
### MACD line: deeply negative (bearish momentum)
- **macd (2026-04-30): ~ -37.03**
- MACD was much less negative earlier in April (e.g., around -2 to -30 range), then moved lower into month-end → this confirms a **trend leg down** rather than a small dip.

### MACD histogram: turning from very positive to sharply negative (strong momentum loss)
- **macdh (2026-04-30): ~ -12.46**
- However, note the pattern:
  - Histogram was **positive** earlier (e.g., **+9.18 on 2026-04-15**, **+10.10 on 2026-04-13**),
  - then collapsed and is now **negative** (e.g., -8.82 on 04-24, ~-0.78 on 04-23, then deeper negatives into the 20s/low 30s).
  
This usually indicates: the market had upside momentum earlier, but the selloff accelerated and now momentum is **bearish again**. That doesn’t automatically mean a bottom is in—just that the “down impulse” is active.

**Actionable takeaway:** For longs, you’d want macdh to begin rising toward zero (momentum stabilization) *while price reclaims at least 10 EMA*. Otherwise, bounces may be traps.

---

## 4) RSI: nearing oversold territory (relief-bounce risk is rising)
- **rsi (2026-04-30): ~35.78**
- Recent days:
  - **~50–57** around early/mid-April
  - down to **~27.35 on 04-24**
  - now back up slightly above 35.

Interpretation:
- RSI < 40 often corresponds to **weak tape / bearish bias**
- But the fact RSI moved from ~27 → ~36 suggests sellers may be **losing immediate control**, increasing odds of a **short-term relief bounce**.
- Still, it’s not “strong reversal” RSI (>50). So this is more consistent with **oversold bounce potential**, not a confirmed trend change.

**Actionable takeaway:** treat this as *bounce setup* conditions, not as a full buy signal. Confirmation matters (see sections on EMA reclaim + MACD histogram behavior).

---

## 5) Bollinger context (using upper band): volatility regime is high, and price is far from the “upper reference”
- **boll_ub (2026-04-30): ~1401.08**
- That upper band value is extremely above price, consistent with the idea that:
  - recent volatility expanded (bands widened),
  - but price is trading far below the upper envelope—so “breakout” conditions are not present.
  
In practical terms, this supports the trend view: rallies must fight through overhead moving averages, and current trading is within a bearish/extended move.

---

## 6) ATR: volatility elevated → risk control must be tighter
- **atr (2026-04-30): ~36.85**
- ATR has been elevated in the 35–40 range through April’s end, consistent with larger daily ranges during the selloff.

**Actionable takeaway (risk sizing):**
- If you’re trading tactically, consider stop distances on the order of **~1 ATR** (or fraction like 0.5 ATR for tighter momentum trades), rather than using a fixed-point stop.
- With ATR ~37, a move of **₹35–₹40** is not “unusual noise”—it’s normal volatility.

---

## Practical trade ideas (non-personalized, actionable)
### Scenario A (higher probability): bearish continuation / failed bounces
Condition checklist:
- Price remains **below close_10_ema (~1212)**,
- MACD histogram stays **negative** or fails to rise toward zero,
- RSI struggles to reclaim **~50** on rebounds.

What to do:
- Look for **sell-the-rip** setups into any rebound toward short-term resistance (10 EMA zone first).

### Scenario B (oversold relief bounce): countertrend but tradable
Condition checklist:
- RSI holds above ~30–35 without breaking down again,
- macdh starts climbing (less negative) toward 0,
- price attempts to reclaim **10 EMA** (or at least closes meaningfully above recent support).

What to do:
- If long on bounce: keep position sizing smaller and stops dynamic using **ATR**.

---

## Key points summary

| Category | Indicator / Level | Latest (2026-04-30) | What it implies | Trader action |
|---|---|---:|---|---|
| Short-term trend | **close_10_ema** | ~1212.47 | Price likely below fast trend → rallies capped | Wait for reclaim or use bounce strategies only with strict risk |
| Medium-term trend | **close_50_sma** | ~1285.08 | Large overhead; bearish medium bias | Avoid trend longs until price meaningfully recovers |
| Long-term regime | **close_200_sma** | ~1468.14 | Price far below → long-term risk-off | Treat rallies as corrective unless/until structure flips |
| Momentum (trend) | **macd** | ~ -37.03 | Bearish momentum regime | Confirm continuation if stays deeply negative |
| Momentum (acceleration) | **macdh** | ~ -12.46 | Down impulse active; watch for rise toward 0 | Long only if histogram improves materially |
| Oversold/relief risk | **rsi** | ~35.78 | Bearish, but off the lows → relief bounce possible | Prefer “bounce” tactics, require confirmation |
| Volatility regime | **boll_ub** | ~1401.08 | Price far below upper band → no breakout | Don’t expect band-riding upside yet |
| Risk management | **atr** | ~36.85 | Elevated daily movement | Use ATR-based stops/position sizing |

If you want, tell me your trading horizon (intraday / swing / long-term) and whether you prefer **trend-following** or **mean-reversion**—I can translate the indicator state into a tighter, rule-based plan.