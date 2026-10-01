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

The number of decimals per currency is defined in ISO 4217, and JavaScript already knows it:

```ts
function minorDigits(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency })
    .resolvedOptions().maximumFractionDigits ?? 2;
}

minorDigits("USD"); // 2
minorDigits("SAR"); // 2
minorDigits("KWD"); // 3
minorDigits("OMR"); // 3
```

Then convert with that, and round:

```ts
function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * 10 ** minorDigits(currency));
}

toMinorUnits(4.75, "USD"); // 475
toMinorUnits(4.75, "KWD"); // 4750
```

The `Math.round` is not decoration. Floating point gets these wrong in both currencies: `19.99 * 100` is `1998.9999999999998`, and `1.005 * 1000` is `1004.9999999999999`. Truncate either one and you are a unit short.

The same lookup fixes the display side. `Intl.NumberFormat` with a currency already prints `KWD 4.750` and `SAR 4.75`, so drop any `toFixed(2)` that formats prices by hand.

## Keep integers from end to end

The safest shape is to stop passing decimal prices around at all:

- Store prices as an integer in minor units, next to the currency code. Never as a float.
- Convert once, at the edge where a human typed a decimal price.
- Format once, at the edge where a human reads it.
- Read your payment provider's docs for the currencies you sell in. Some take minor units, some take a decimal amount, and some add their own rules for three-decimal currencies.

## Test the currency you don't use

A test suite that only checks USD will never find this. Add one case per decimal count you sell in: a two-decimal currency, a three-decimal one, and a zero-decimal one like the yen if you have it. Assert the exact integer that reaches the provider, not just that the payment succeeded.

If you sell or build for the Gulf, check that line before Kuwait checks it for you.
