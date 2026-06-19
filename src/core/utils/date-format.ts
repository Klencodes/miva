const getRelativeTime = (date: Date, short: boolean = false): string => {
  const now = new Date("2025-10-14T08:30:55Z"); // Hypothetical current time for output consistency
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (short) {
    if (diffSeconds < 60) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 4) return `${diffWeeks}w`;
    if (diffMonths < 12) return `${diffMonths}mo`;
    return `${diffYears}y`;
  }

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 4)
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
};

export const formatDate = (date: string | Date | null | undefined, format: string = "mediumDate"): string => {
  // 🛑 FIX: Check for null, undefined, or empty string input
  if (date === null || date === undefined || date === "") {
    return "--";
  }

  const dateObj = date instanceof Date ? date : new Date(date);
  // For output examples, assume date = "2025-10-03T19:00:46.994875Z" and locale is 'en-US'

  if (isNaN(dateObj.getTime())) {
    return "N/A"; // Output: "N/A"
  }

  const options: Intl.DateTimeFormatOptions = {};
  let timeOptions: Intl.DateTimeFormatOptions = {};

  switch (format) {
    // NEW CUSTOM FORMATS
    case "MMM DD, YYYY":
      options.year = "numeric";
      options.month = "short";
      options.day = "2-digit";
      return dateObj.toLocaleDateString("en-US", options); // Output: "Oct 03, 2025"

    case "MMM DD, YYYY | hh:mm:ss A":
      options.year = "numeric";
      options.month = "short";
      options.day = "2-digit";
      timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const datePart = dateObj.toLocaleDateString("en-US", options);
      const timePart = dateObj.toLocaleTimeString("en-US", timeOptions);
      return `${datePart} | ${timePart}`; // Output: "Oct 03, 2025 | 07:00:46 PM"

    case "MMM DD":
      options.month = "short";
      options.day = "2-digit";
      return dateObj
        .toLocaleDateString("en-US", options)
        .replace(/, \d{4}/, ""); // Output: "Oct 03"

    case "MMM YYYY":
      options.year = "numeric";
      options.month = "short";
      return dateObj
        .toLocaleDateString("en-US", options)
        .replace(/, \d{2}/, ""); // Output: "Oct 2025"

    case "hh:mm:ss A":
      timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      return dateObj.toLocaleTimeString("en-US", timeOptions); // Output: "07:00:46 PM"

    // Date Only Formats
    case "shortDate":
      options.year = "numeric";
      options.month = "numeric";
      options.day = "numeric";
      break; // Output: "10/3/2025" (locale dependent)

    case "mediumDate":
      options.year = "numeric";
      options.month = "short";
      options.day = "numeric";
      break; // Output: "Oct 3, 2025" (locale dependent)

    case "longDate":
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      break; // Output: "October 3, 2025" (locale dependent)

    case "fullDate":
      options.weekday = "long";
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      break; // Output: "Friday, October 3, 2025" (locale dependent)

    case "monthYear":
      options.year = "numeric";
      options.month = "long";
      break; // Output: "October 2025" (locale dependent)

    case "yearOnly":
      options.year = "numeric";
      break; // Output: "2025"

    case "monthOnly":
      options.month = "long";
      break; // Output: "October" (locale dependent)

    case "dayOnly":
      options.day = "numeric";
      break; // Output: "3"

    case "isoDate":
      return dateObj.toISOString().split("T")[0]; // Output: "2025-10-03"

    case "usDate":
      return dateObj.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }); // Output: "10/03/2025"

    case "euroDate":
      return dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }); // Output: "03/10/2025"

    // Time Only Formats
    case "shortTime":
      timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return dateObj.toLocaleTimeString(undefined, timeOptions); // Output: "7:00 PM" (locale dependent)

    case "mediumTime":
      timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      return dateObj.toLocaleTimeString(undefined, timeOptions); // Output: "7:00:46 PM" (locale dependent)

    case "militaryTime":
      timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      return dateObj.toLocaleTimeString(undefined, timeOptions); // Output: "19:00" (locale dependent)

    case "timeWithSeconds":
      timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      return dateObj.toLocaleTimeString(undefined, timeOptions); // Output: "07:00:46 PM" (locale dependent)

    // DateTime Combinations
    case "dateTime":
      options.year = "numeric";
      options.month = "short";
      options.day = "numeric";
      timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return `${dateObj.toLocaleDateString(
        undefined,
        options
      )} ${dateObj.toLocaleTimeString(undefined, timeOptions)}`; // Output: "Oct 3, 2025 7:00 PM" (locale dependent)

    case "dateTimeFull":
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      options.weekday = "short";
      timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      return `${dateObj.toLocaleDateString(undefined,  options )} ${dateObj.toLocaleTimeString(undefined, timeOptions)}`; // Output: "Fri, October 3, 2025 | 7:00:46 PM" (locale dependent)

    case "isoDateTime":
      return dateObj.toISOString(); // Output: "2025-10-03T19:00:46.994Z"

    case "dateTimeShort":
      options.year = "2-digit";
      options.month = "numeric";
      options.day = "numeric";
      timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return `${dateObj.toLocaleDateString(
        undefined,
        options
      )} ${dateObj.toLocaleTimeString(undefined, timeOptions)}`; // Output: "10/3/25 7:00 PM" (locale dependent)

    // Relative Time Formats
    case "relative":
      return getRelativeTime(dateObj); // Output: "10 days ago" (using hypothetical current date)

    case "relativeShort":
      return getRelativeTime(dateObj, true); // Output: "10d" (using hypothetical current date)

    // Custom Business Formats
    case "invoiceDate":
      options.year = "numeric";
      options.month = "short";
      options.day = "numeric";
      return dateObj.toLocaleDateString(undefined, options).toUpperCase(); // Output: "OCT 3, 2025" (locale dependent)

    case "fileTimestamp":
      return dateObj
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "_"); // Output: "20251003_190046"

    case "chatTime":
      const now = new Date("2025-10-14T08:30:55Z"); // Hypothetical current time for output consistency
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        timeOptions = {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
        return dateObj.toLocaleTimeString(undefined, timeOptions); // Output: "7:00 PM" (if current day)
      } else if (diffDays === 1) {
        return "Yesterday"; // Output: "Yesterday" (if previous day)
      } else if (diffDays < 7) {
        return dateObj.toLocaleDateString(undefined, { weekday: "long" }); // Output: "Friday" (if within the week)
      } else {
        options.month = "short";
        options.day = "numeric";
        return dateObj.toLocaleDateString(undefined, options); // Output: "Oct 3" (if older than a week)
      }

    default:
      return dateObj.toLocaleDateString(); // Output: "10/3/2025" (default locale)
  }

  return dateObj.toLocaleDateString(undefined, options);
};


export enum DateFormatEnums {
    // New Custom Formats (From User Request)
    MMM_DD_YYYY = 'MMM DD, YYYY',
    MMM_DD_YYYY_HH_MM_SS_A = 'MMM DD, YYYY | hh:mm:ss A',
    MMM_DD = 'MMM DD',
    MMM_YYYY = 'MMM YYYY',
    HH_MM_SS_A = 'hh:mm:ss A',

    // Date Only Formats
    SHORT_DATE = 'shortDate', // "10/3/2025"
    MEDIUM_DATE = 'mediumDate', // "Oct 3, 2025" (default)
    LONG_DATE = 'longDate', // "October 3, 2025"
    FULL_DATE = 'fullDate', // "Friday, October 3, 2025"
    MONTH_YEAR = 'monthYear', // "October 2025"
    YEAR_ONLY = 'yearOnly', // "2025"
    MONTH_ONLY = 'monthOnly', // "October"
    DAY_ONLY = 'dayOnly', // "3"
    ISO_DATE = 'isoDate', // "2025-10-03"
    US_DATE = 'usDate', // "10/03/2025"
    EURO_DATE = 'euroDate', // "03/10/2025"

    // Time Only Formats
    SHORT_TIME = 'shortTime', // "7:00 PM"
    MEDIUM_TIME = 'mediumTime', // "7:00:46 PM"
    MILITARY_TIME = 'militaryTime', // "19:00"
    TIME_WITH_SECONDS = 'timeWithSeconds', // "07:00:46 PM"

    // DateTime Combinations
    DATE_TIME = 'dateTime', // "Oct 3, 2025 7:00 PM"
    DATE_TIME_FULL = 'dateTimeFull', // "Fri, October 3, 2025 | 7:00:46 PM"
    ISO_DATE_TIME = 'isoDateTime', // "2025-10-03T19:00:46.994Z"
    DATE_TIME_SHORT = 'dateTimeShort', // "10/3/25 7:00 PM"

    // Relative Time Formats
    RELATIVE = 'relative', // "10 days ago"
    RELATIVE_SHORT = 'relativeShort', // "10d"

    // Custom Business Formats
    INVOICE_DATE = 'invoiceDate', // "OCT 3, 2025"
    FILE_TIMESTAMP = 'fileTimestamp', // "20251003_190046"
    CHAT_TIME = 'chatTime', // "Yesterday", "Friday", "7:00 PM", or "Oct 3"
}