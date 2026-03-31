import React, { useState, useEffect } from "react";
import { Button } from "../../../ui";
import { IProduct } from "../../../core/interfaces/IProduct";

// ─── Exported helpers (used by ModernStore, CartContent, orders prep) ─────────

/**
 * How many base pieces does one unit of `quantityType` consume?
 * - "units" / the product's selling_unit → selling_unit_quantity (full pack)
 * - anything else (piece, sachet, strip …) → 1
 */
export const resolvePiecesPerUnit = (
  quantityType: string,
  product: { selling_unit_quantity: number; selling_unit?: string }
): number => {
  if (!quantityType) return 1;
  const isFullPack =
    quantityType === "units" ||
    quantityType.toLowerCase() === (product.selling_unit || "").toLowerCase();
  return isFullPack ? product.selling_unit_quantity : 1;
};

/**
 * Unit price for the given quantityType.
 * Full-pack sale  → price_per_unit
 * Individual sale → price_per_piece (calculated if missing)
 */
export const resolveUnitPrice = (
  quantityType: string,
  product: {
    selling_unit?: string;
    selling_unit_quantity: number;
    price_per_unit: number;
    price_per_piece?: number;
  }
): number => {
  const piecesPerUnit = resolvePiecesPerUnit(quantityType, product);
  if (piecesPerUnit > 1) return product.price_per_unit;
  return (
    product.price_per_piece ||
    product.price_per_unit / (product.selling_unit_quantity || 1)
  );
};

// ─── Local label helpers ──────────────────────────────────────────────────────

/** "3 strips" / "1 strip" */
const pieceStr = (n: number, label: string) =>
  `${n} ${label}${n !== 1 ? "s" : ""}`;

/** "2 packs" / "1 pack" */
const packStr = (n: number, label: string) =>
  `${n} ${label}${n !== 1 ? "s" : ""}`;

/**
 * Stock summary shown inside the modal info strip.
 * e.g. "122 strips (12 packs 2 strips)" or "12 pieces (3 sacks)"
 */
const stockSummary = (
  totalPieces: number,
  totalPacks: number,
  remainingPieces: number,
  pieceLabel: string,
  packLabel: string,
  sellingQty: number
): string => {
  if (sellingQty <= 1) return pieceStr(totalPieces, pieceLabel);

  const packPart  = totalPacks > 0 ? packStr(totalPacks, packLabel) : "";
  const piecePart = remainingPieces > 0 ? pieceStr(remainingPieces, pieceLabel) : "";
  const breakdown = [packPart, piecePart].filter(Boolean).join(" ");

  return `${pieceStr(totalPieces, pieceLabel)}${breakdown ? ` (${breakdown})` : ""}`;
};

/**
 * Equivalent quantity label shown in the price summary.
 * Pieces mode  → "≈ 1.2 packs" / "= 1 pack"
 * Pack mode    → "= 24 pieces"
 */
const equivalentStr = (
  qty: number,
  isPiecesMode: boolean,
  sellingQty: number,
  pieceLabel: string,
  packLabel: string
): string => {
  if (isPiecesMode) {
    const packs = qty / sellingQty;
    return `≈ ${packs % 1 === 0 ? packs : packs.toFixed(2)} ${packLabel}${packs !== 1 ? "s" : ""}`;
  }
  const pieces = qty * sellingQty;
  return `= ${pieceStr(pieces, pieceLabel)}`;
};

// ─── Fractional selling helpers ───────────────────────────────────────────────

/** Products that support fractional (1/4, 1/2, 3/4, 1) selling only */
const isFractionalProduct = (name: string): boolean => {
  const lower = (name || "").toLowerCase();
  return lower.includes("indomie") || lower.includes("spaghetti");
};

const FRACTIONS: { label: string; value: number }[] = [
  { label: "¼", value: 0.25 },
  { label: "½", value: 0.5 },
  { label: "¾", value: 0.75 },
  // { label: "1", value: 1 },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomQuantityModalProps {
  product: IProduct;
  currentQuantity?: number;
  currentIsPieces?: boolean;
  isOpen: boolean;
  onClose: () => void;
  /** quantity, isPieces flag, quantityType string ("units" | content_unit_type) */
  onSubmit: (quantity: number, isPieces: boolean, quantityType: string) => void;
}

type SellMode = "pieces" | "containers";

const CustomQuantityModal: React.FC<CustomQuantityModalProps> = ({
  product,
  currentQuantity,
  currentIsPieces = true,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<SellMode>("pieces");
  const [quantity, setQuantity] = useState<string>("1");
  const [error, setError] = useState<string>("");
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // ── fractional state ──────────────────────────────────────────────────────
  const isFractional = isFractionalProduct(product.short_name || product.name || "");
  // How many whole packs are selected in fractional mode
  const [fracPackCount, setFracPackCount] = useState<number>(1);
  // Which fraction of a pack is selected (0.25 / 0.5 / 0.75 / 1)
  const [selectedFraction, setSelectedFraction] = useState<number>(1);

  // Derived product values
  const sellingQty  = product.selling_unit_quantity || 1;
  const pieceLabel  = product.content_unit_type || product.content_unit || "piece";
  const packLabel   = product.selling_unit || "box";

  const pricePerPiece =
    product.price_per_piece ||
    product.price_per_unit / (sellingQty || 1);
  const pricePerPack = product.price_per_unit;

  // Safe stock
  const availablePieces =
    product.stock_in_pieces ?? (product.stock || 0) * sellingQty;
  const availablePacks  = Math.floor(availablePieces / sellingQty);
  // Leftover pieces that don't fill a full pack (used for the info strip)
  const leftoverPieces  = availablePieces % sellingQty;

  // ── initialise on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !product) return;

    if (currentQuantity && currentQuantity > 0) {
      setIsEditMode(true);
      if (currentIsPieces && !product.allow_pieces_sell) {
        const packs = Math.ceil(currentQuantity / sellingQty);
        setQuantity(packs.toString());
        setMode("containers");
      } else {
        setQuantity(currentQuantity.toString());
        setMode(currentIsPieces ? "pieces" : "containers");
      }
    } else {
      setIsEditMode(false);
      setQuantity("1");
      setMode(product.allow_pieces_sell && sellingQty > 1 ? "pieces" : "containers");
    }

    // Reset fractional state
    setFracPackCount(1);
    setSelectedFraction(1);
    setSelectedQuick(null);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, currentQuantity, currentIsPieces]);

  if (!isOpen || !product) return null;

  // ── derived from current mode ─────────────────────────────────────────────
  const isPiecesMode = mode === "pieces";
  const unitPrice    = isPiecesMode ? pricePerPiece : pricePerPack;
  const unitLabel    = isPiecesMode ? pieceLabel : packLabel;
  const maxAvailable = isPiecesMode ? availablePieces : availablePacks;

  const qty             = parseFloat(quantity) || 0;
  const totalPrice      = qty * unitPrice;
  const requestedPieces = isPiecesMode ? qty : qty * sellingQty;

  // Quick-pick buttons (1–5, capped at available stock)
  const quickOptions = Array.from(
    { length: Math.min(5, Math.floor(maxAvailable)) },
    (_, i) => i + 1
  );

  // ── fractional derived ────────────────────────────────────────────────────
  // Total quantity in "packs" for fractional mode (e.g. 2 packs + ½ = 2.5)
  const fracTotalPacks  = fracPackCount - 1 + selectedFraction; // packs are 1-based selector
  const fracTotalPieces = fracTotalPacks * sellingQty;
  const fracTotalPrice  = fracTotalPacks * pricePerPack;

  // ── validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const n = parseFloat(quantity);

    if (isNaN(n) || n <= 0) {
      setError("Quantity must be greater than 0");
      return false;
    }

    if (!isPiecesMode && !Number.isInteger(n)) {
      setError(`Number of ${packLabel}s must be a whole number`);
      return false;
    }

    // When editing, allow up to (available + what was already in the cart line)
    let maxPieces = availablePieces;
    if (isEditMode && currentQuantity) {
      maxPieces += currentIsPieces
        ? currentQuantity
        : currentQuantity * sellingQty;
    }

    if (requestedPieces > maxPieces) {
      // Show the limit in the mode's own unit (pieces or packs)
      const maxInMode = isPiecesMode
        ? maxPieces
        : Math.floor(maxPieces / sellingQty);
      setError(
        `Only ${isPiecesMode ? pieceStr(maxInMode, pieceLabel) : packStr(maxInMode, packLabel)} available`
      );
      return false;
    }

    return true;
  };

  const validateFractional = (): boolean => {
    if (fracTotalPacks <= 0) {
      setError("Please select a quantity");
      return false;
    }
    if (fracTotalPieces > availablePieces) {
      setError(`Only ${packStr(availablePacks, packLabel)} available`);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (isFractional) {
      if (!validateFractional()) return;
      // Submit as fractional packs → quantityType "units" so resolvePiecesPerUnit
      // returns sellingQty, making the pieces deduction correct
      onSubmit(fracTotalPacks, false, "units");
      onClose();
      return;
    }
    if (!validate()) return;
    const quantityType = isPiecesMode ? pieceLabel : "units";
    onSubmit(parseFloat(quantity), isPiecesMode, quantityType);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  handleSubmit();
    if (e.key === "Escape") onClose();
  };

  const handleQuantityChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
      setSelectedQuick(null);
      if (error) setError("");
    }
  };

  const selectQuick = (n: number) => {
    setQuantity(n.toString());
    setSelectedQuick(n);
    setError("");
  };

  const switchMode = (next: SellMode) => {
    setMode(next);
    setQuantity("1");
    setSelectedQuick(null);
    setError("");
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary-10 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-text">
              {isEditMode ? "Update Quantity" : "Add to Cart"}
            </h3>
            <p className="text-sm text-text-light mt-0.5">{product.short_name}</p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-text p-1">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">

          {/* Product info strip */}
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <img
              src={product.image_url}
              alt={product.image_alt}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text text-sm truncate">{product.short_name}</p>
              <p className="text-xs text-text-light">
                {sellingQty}×{product.content_measurement}{product.content_unit} per {packLabel}
              </p>
              <p className="text-xs text-text-light mt-0.5">
                {stockSummary(availablePieces, availablePacks, leftoverPieces, pieceLabel, packLabel, sellingQty)} available
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-primary text-sm">
                GHS {pricePerPack.toFixed(2)}/{packLabel}
              </p>
              {sellingQty > 1 && (
                <p className="text-xs text-text-light">
                  GHS {pricePerPiece.toFixed(2)}/{pieceLabel}
                </p>
              )}
            </div>
          </div>

          {/* ── FRACTIONAL MODE (Indomie / Spaghetti) ── */}
          {isFractional ? (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 bg-info-5 border border-info-20 rounded-lg">
                <i className="ri-information-line text-info mt-0.5"></i>
                <p className="text-xs text-info">
                  This product is sold in fractions. Select how many {packLabel}s
                  and the fraction below.
                </p>
              </div>

              {/* Pack count stepper */}
              <div>
                <p className="text-xs text-text-light uppercase tracking-wide mb-2 font-medium">
                  Number of {packLabel}s
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setFracPackCount((p) => Math.max(1, p - 1));
                      setError("");
                    }}
                    className="w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center text-text hover:border-primary transition-colors disabled:opacity-40"
                    disabled={fracPackCount <= 1}
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <span className="text-2xl font-bold text-text w-10 text-center">
                    {fracPackCount - 1}
                  </span>
                  <button
                    onClick={() => {
                      setFracPackCount((p) => Math.min(p + 1, availablePacks + 1));
                      setError("");
                    }}
                    className="w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center text-text hover:border-primary transition-colors"
                  >
                    <i className="ri-add-line"></i>
                  </button>
                  <span className="text-sm text-text-light">
                    whole {packLabel}{fracPackCount - 1 !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Fraction selector */}
              <div>
                <p className="text-xs text-text-light uppercase tracking-wide mb-2 font-medium">
                  Fraction of a {packLabel}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {FRACTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSelectedFraction(value);
                        setError("");
                      }}
                      className={`py-3 rounded-lg border text-center font-semibold text-lg transition-all ${
                        selectedFraction === value
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-background border-border hover:border-primary text-text"
                      }`}
                    >
                      {label}
                      <div className="text-xs font-normal opacity-70 mt-0.5">
                        GHS {(value * pricePerPack).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fractional price summary */}
              {fracTotalPacks > 0 && (
                <div className="p-3 bg-background rounded-lg space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-light">Selected:</span>
                    <span className="text-text font-medium">
                      {fracPackCount - 1 > 0 && `${fracPackCount - 1} whole + `}
                      {FRACTIONS.find((f) => f.value === selectedFraction)?.label}
                      {packLabel}
                      <span className="text-text-light">
                        (= {fracTotalPacks} {packLabel}s)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light">Stock used:</span>
                    <span className="text-text">
                      ≈ {Math.ceil(fracTotalPieces)} {pieceLabel}s
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border pt-1.5 mt-1.5">
                    <span className="text-text">Total:</span>
                    <span className="text-primary text-base">
                      GHS {fracTotalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-danger text-sm flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  {error}
                </p>
              )}
            </div>
          ) : (
            /* ── NORMAL MODE (all other products) ── */
            <>
              {/* Mode toggle */}
              {product.allow_pieces_sell && sellingQty > 1 && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-lg">
                  <button
                    onClick={() => switchMode("pieces")}
                    className={`py-2.5 rounded-md text-sm font-medium transition-all ${
                      mode === "pieces"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-light hover:text-text"
                    }`}
                  >
                    By {pieceLabel}
                    <span className="block text-xs opacity-75 font-normal">
                      GHS {pricePerPiece.toFixed(2)} each
                    </span>
                  </button>
                  <button
                    onClick={() => switchMode("containers")}
                    className={`py-2.5 rounded-md text-sm font-medium transition-all ${
                      mode === "containers"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-light hover:text-text"
                    }`}
                  >
                    By {packLabel}
                    <span className="block text-xs opacity-75 font-normal">
                      GHS {pricePerPack.toFixed(2)} each
                    </span>
                  </button>
                </div>
              )}

              {/* Quick picks */}
              {quickOptions.length > 0 && (
                <div>
                  <p className="text-xs text-text-light uppercase tracking-wide mb-2 font-medium">
                    Quick select
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {quickOptions.map((n) => (
                      <button
                        key={n}
                        onClick={() => selectQuick(n)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          selectedQuick === n
                            ? "bg-primary border-primary text-white"
                            : "bg-background border-border hover:border-primary text-text"
                        }`}
                      >
                        <div className="font-semibold text-sm">{n}</div>
                        <div className="text-xs opacity-70">
                          GHS {(n * unitPrice).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom quantity input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-text">
                    Quantity ({unitLabel}s):
                  </label>
                  <span className="text-xs text-text-light">
                    Max:{" "}
                    {isPiecesMode
                      ? pieceStr(availablePieces, pieceLabel)
                      : packStr(availablePacks, packLabel)}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-border rounded-lg px-4 py-3 text-xl font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                    placeholder={`Enter ${unitLabel}s`}
                    min="1"
                    step="1"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light text-sm pointer-events-none">
                    {unitLabel}{qty !== 1 ? "s" : ""}
                  </span>
                </div>

                {error && (
                  <p className="mt-1.5 text-danger text-sm flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {error}
                  </p>
                )}
              </div>

              {/* Price summary */}
              {qty > 0 && (
                <div className="p-3 bg-background rounded-lg space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-light">Unit price:</span>
                    <span className="text-text">
                      GHS {unitPrice.toFixed(2)} / {unitLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light">Quantity:</span>
                    <span className="text-text">
                      {isPiecesMode ? pieceStr(qty, pieceLabel) : packStr(qty, packLabel)}
                      {sellingQty > 1 && (
                        <span className="text-text-light ml-1.5">
                          ({equivalentStr(qty, isPiecesMode, sellingQty, pieceLabel, packLabel)})
                        </span>
                      )}
                    </span>
                  </div>
                  {sellingQty > 1 && (
                    <div className="flex justify-between">
                      <span className="text-text-light">Stock used:</span>
                      <span className="text-text">
                        {pieceStr(Math.round(requestedPieces), pieceLabel)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-border pt-1.5 mt-1.5">
                    <span className="text-text">Total:</span>
                    <span className="text-primary text-base">
                      GHS {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={
              isFractional
                ? fracTotalPacks <= 0
                : !quantity || parseFloat(quantity) <= 0
            }
          >
            {isEditMode ? "Update" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomQuantityModal;