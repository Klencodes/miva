/**
 * Format a whole integer quantity with its unit label.
 * e.g. formatQuantity(3) → "3"
 */
export const formatQuantity = (quantity: number): string => {
  return quantity?.toString() ?? "0";
};

/**
 * Format a stock/quantity value that may contain both full packs and
 * leftover individual pieces.
 *
 * Parameters
 * ----------
 * stockInPieces    – total pieces in stock (e.g. 122)
 * packUnit         – label for the full-pack container (e.g. "pack", "sack", "box")
 * pieceUnit        – label for one individual piece  (e.g. "strip", "piece", "kg")
 * piecesPerPack    – how many pieces make one full pack (e.g. 10)
 *
 * Examples
 * --------
 *   formatStockLabel(122, "pack",  "strip",  10)  → "12 packs 2 strips"
 *   formatStockLabel(12,  "sack",  "piece",  4)   → "3 sacks"
 *   formatStockLabel(13,  "sack",  "piece",  4)   → "3 sacks 1 piece"
 *   formatStockLabel(3,   "bag",   "piece",  1)   → "3 bags"
 *   formatStockLabel(0,   "bag",   "piece",  1)   → "0 bags"
 */
export const formatStockLabel = (
  stockInPieces: number,
  packUnit: string,
  pieceUnit: string,
  piecesPerPack: number
): string => {
  const safeStock = Math.max(0, Math.floor(stockInPieces));
  const safePPP   = Math.max(1, piecesPerPack);

  const fullPacks     = Math.floor(safeStock / safePPP);
  const remainingPieces = safeStock % safePPP;

  const packLabel  = (n: number) => `${n} ${packUnit}${n !== 1 ? "s" : ""}`;
  const pieceLabel = (n: number) => `${n} ${pieceUnit}${n !== 1 ? "s" : ""}`;

  // When piecesPerPack === 1 there is no sub-unit — just show pack count
  if (safePPP === 1) {
    return packLabel(safeStock);
  }

  if (fullPacks === 0 && remainingPieces === 0) {
    return `0 ${packUnit}s`;
  }

  if (fullPacks > 0 && remainingPieces > 0) {
    return `${packLabel(fullPacks)} ${pieceLabel(remainingPieces)}`;
  }

  if (fullPacks > 0) {
    return packLabel(fullPacks);
  }

  // Less than one full pack — only pieces remain
  return pieceLabel(remainingPieces);
};

/**
 * Convenience wrapper used by the product card badge.
 * Returns e.g. "3 packs 5 strips left" / "2 boxes 4 pieces left"
 */
export const formatStockBadge = (
  stockInPieces: number,
  packUnit: string,
  pieceUnit: string,
  piecesPerPack: number
): string => `${formatStockLabel(stockInPieces, packUnit, pieceUnit, piecesPerPack)} left`;

/**
 * Original formatQuantityWithPieces — kept for backward-compat.
 * Prefer formatStockLabel for new call-sites.
 *
 * quantity      – value in pack units (may be fractional, e.g. 12.2 packs)
 * unit          – pack unit label (e.g. "pack")
 * unitQuantity  – pieces per pack
 * pieceUnit     – piece unit label (defaults to "piece")
 */
export const formatQuantityWithPieces = (
  quantity: number,
  unit: string,
  unitQuantity: number,
  pieceUnit: string
): string => {
  if (quantity <= 0) return `0 ${unit}s`;

  if (quantity % 1 === 0) {
    // Whole number — no fractional pieces
    return `${quantity} ${unit}${quantity !== 1 ? "s" : ""}`;
  }

  const wholePacks      = Math.floor(quantity);
  const fractionalPack  = quantity % 1;
  const remainingPieces = Math.round(fractionalPack * unitQuantity);

  const packPart  = wholePacks > 0
    ? `${wholePacks} ${unit}${wholePacks !== 1 ? "s" : ""}`
    : "";
  const piecePart = remainingPieces > 0
    ? `${remainingPieces} ${pieceUnit}${remainingPieces !== 1 ? "s" : ""}`
    : "";

  return [packPart, piecePart].filter(Boolean).join(" ");
};

/**
 * Fraction-aware version — shows ½ pack, ¼ sack etc. when the decimal
 * matches a common fraction; falls back to piece count otherwise.
 */
export const formatQuantityWithPiecesAndFractions = (
  quantity: number,
  unit: string = "",
  unitQuantity: number = 1,
  pieceUnit: string = "piece"
): string => {
  if (quantity <= 0) return `0 ${unit}s`;

  if (quantity % 1 === 0) {
    return `${quantity} ${unit}${quantity !== 1 ? "s" : ""}`;
  }

  const whole   = Math.floor(quantity);
  const decimal = quantity % 1;
  const tol     = 0.0001;

  const FRACTIONS: Array<[number, string]> = [
    [0.5,      "½"],
    [0.25,     "¼"],
    [0.75,     "¾"],
    [1 / 3,    "⅓"],
    [2 / 3,    "⅔"],
    [1 / 8,    "⅛"],
    [3 / 8,    "⅜"],
    [5 / 8,    "⅝"],
    [7 / 8,    "⅞"],
  ];

  const matched = FRACTIONS.find(([val]) => Math.abs(decimal - val) < tol);

  if (matched) {
    const [, symbol] = matched;
    const prefix = whole > 0 ? `${whole}` : "";
    return `${prefix}${symbol} ${unit}${whole > 1 ? "s" : ""}`.trim();
  }

  // No common fraction — show as whole packs + leftover pieces
  return formatQuantityWithPieces(quantity, unit, unitQuantity, pieceUnit);
};