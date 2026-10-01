---
title: Your checkout is wrong in Kuwait
description: A lot of checkout code assumes every currency has two decimals. The Kuwaiti dinar, the Bahraini dinar and the Omani rial have three, so "multiply by 100" charges a tenth of the price and nothing crashes.
tag: Payments
date: "2026-10-01"
order: 0
query: kuwait city skyline
---

A lot of checkout code has this line somewhere:

```ts
const amountInCents = price * 100;
```

It works for dollars, euros, riyals and dirhams, so it passes every test. Then the shop starts selling in Kuwait and every order goes through for a tenth of the price. Nothing crashes, and nobody notices until the money is counted.

## Not every currency has two decimals

Payment APIs usually want the amount in the currency's smallest unit, as an integer. For most currencies that unit is a hundredth: 4.75 USD is 475 cents.

Three Gulf currencies split into a thousand instead:

- **Kuwaiti dinar (KWD):** 1 dinar = 1,000 fils
- **Bahraini dinar (BHD):** 1 dinar = 1,000 fils
- **Omani rial (OMR):** 1 rial = 1,000 baisa

So a KWD price is written 4.750, not 4.75, and its smallest unit is 4,750 fils. The Jordanian dinar and the Tunisian dinar work the same way. Next door, the Saudi riyal, the UAE dirham and the Qatari riyal all have two decimals.

Now run the line above on a 5 dinar order. 5 × 100 = 500, which the provider reads as 500 fils: half a dinar. The customer pays 0.500 KWD for a 5.000 KWD order. Off by ten, with no error anywhere.

The bug only shows up when you add a second Gulf country, which is exactly when you are least likely to retest the payment path.

## Ask for the number of decimals, don't assume it

The number of decimals per currency is set by ISO 4217, the standard currency list. The fix is to keep that number per currency instead of hard-coding 100:

```ts
// From ISO 4217. Add the currencies you sell in, and check them
// against your payment provider's docs.
const MINOR_DIGITS: Record<string, number> = {
  USD: 2, EUR: 2, SAR: 2, AED: 2, QAR: 2,
  KWD: 3, BHD: 3, OMR: 3, JOD: 3,
  JPY: 0,
};

function toMinorUnits(amount: number, currency: string): number {
  const digits = MINOR_DIGITS[currency];
  if (digits === undefined) throw new Error(`No minor units for ${currency}`);
  return Math.round(amount * 10 ** digits);
}

toMinorUnits(4.75, "USD"); // 475
toMinorUnits(4.75, "KWD"); // 4750
```

Two details in there matter.

The `Math.round` is not decoration. Floating point gets these wrong in both currencies: `19.99 * 100` is `1998.9999999999998`, and `1.005 * 1000` is `1004.9999999999999`. Truncate either one and you are a unit short.

The `throw` is on purpose too. A currency you never configured should fail loudly in testing, not fall back to 2 and undercharge quietly in production.

Why not let the browser tell you? `Intl.NumberFormat` knows that KWD shows three decimals, but it reads display rules, not the payment standard, and the two disagree for some currencies. It formats the Iraqi dinar with 0 decimals while ISO 4217 says 3. Payment providers have exceptions of their own as well: Stripe, for example, wants the Icelandic króna sent as if it had two decimals, though nobody can pay a fraction of one. So use `Intl` to show prices, and a table you control to charge them.

For display, `Intl.NumberFormat` with a currency already prints `KWD 4.750` and `SAR 4.75`, so drop any `toFixed(2)` that formats prices by hand.

## Keep integers from end to end

The safest shape is to stop passing decimal prices around at all:

- Store prices as an integer in minor units, next to the currency code. Never as a float.
- Convert once, at the edge where a human typed a decimal price.
- Format once, at the edge where a human reads it.
- Read your payment provider's docs for the currencies you sell in. Some take minor units, some take a decimal amount, and some add their own rules for three-decimal currencies.

## Test the currency you don't use

A test suite that only checks USD will never find this. Add one case per decimal count you sell in: a two-decimal currency, a three-decimal one, and a zero-decimal one like the yen if you have it. Assert the exact integer that reaches the provider, not just that the payment succeeded.

If you sell or build for the Gulf, check that line before a customer in Kuwait, Bahrain or Oman checks it for you.
