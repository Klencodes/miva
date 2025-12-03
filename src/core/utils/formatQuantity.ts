export const formatQuantity = (quantity: number): string => {
    if (quantity % 1 === 0) {
      return quantity.toString();
    }

    const whole = Math.floor(quantity);
    const fraction = quantity % 1;
    let fractionString = "";
    let wholeString = whole > 0 ? whole.toString() : "";

    const tolerance = 0.0001;

    if (Math.abs(fraction - 0.5) < tolerance) {
      fractionString = "½";
    } else if (Math.abs(fraction - 0.25) < tolerance) {
      fractionString = "¼";
    } else if (Math.abs(fraction - 0.75) < tolerance) {
      fractionString = "¾";
    } else if (Math.abs(fraction - 0.333333) < tolerance) {
      fractionString = "⅓";
    } else if (Math.abs(fraction - 0.666666) < tolerance) {
      fractionString = "⅔";
    } else {
      return quantity?.toFixed(2);
    }

    return `${wholeString}${fractionString}`;
  };
  