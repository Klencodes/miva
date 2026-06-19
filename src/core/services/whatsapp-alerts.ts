// src/core/services/whatsapp-alerts.ts

export interface LowStockProduct {
  short_name: string;
  stock: number;
  selling_unit: string;
  stock_in_pieces?: number;
  content_unit_type?: string;
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// Fill these in your .env file:
//   REACT_APP_WHATSAPP_NUMBER=233247740704        ← no + sign
//   REACT_APP_CALLMEBOT_API_KEY=xxxxxxx           ← from CallMeBot activation (see below)
//   REACT_APP_EMAILJS_SERVICE_ID=service_xxxxxx
//   REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxxx
//   REACT_APP_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxx
//   REACT_APP_ALERT_EMAIL=you@example.com
//
// ─── CallMeBot Setup (one-time, takes ~1 min) ────────────────────────────────
//   1. Save this number in your WhatsApp contacts: +34 644 81 58 78
//   2. Send it this exact message via WhatsApp: "I allow callmebot to send me messages"
//   3. You'll receive your personal apikey in reply — paste it into REACT_APP_CALLMEBOT_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

interface WhatsAppConfig {
  WHATSAPP_NUMBER: string;
  CALLMEBOT_API_KEY: string;
  ALERT_EMAIL: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  isDevelopment: boolean;
}

const getWhatsAppConfig = (): WhatsAppConfig => {
  // Detect if running in Electron
  const isElectron =
    typeof window !== "undefined" && (window as any).electron !== undefined;

  // Detect development mode
  const isDevelopment =
    process.env.REACT_APP_ENV === "development" ||
    process.env.NODE_ENV === "development" ||
    (!isElectron &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"));

  return {
    WHATSAPP_NUMBER: process.env.REACT_APP_WHATSAPP_NUMBER || "233247740704",
    CALLMEBOT_API_KEY: process.env.REACT_APP_CALLMEBOT_API_KEY || "",
    ALERT_EMAIL: process.env.REACT_APP_ALERT_EMAIL || "",
    EMAILJS_SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID || "",
    EMAILJS_TEMPLATE_ID: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "",
    EMAILJS_PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "",
    isDevelopment,
  };
};

const whatsAppConfig = getWhatsAppConfig();

// Log config for debugging (only in development)
if (whatsAppConfig.isDevelopment) {
  console.log("📱 WhatsApp Config:", {
    WHATSAPP_NUMBER: whatsAppConfig.WHATSAPP_NUMBER,
    hasApiKey: !!whatsAppConfig.CALLMEBOT_API_KEY,
    hasEmailJS: !!(
      whatsAppConfig.EMAILJS_SERVICE_ID && whatsAppConfig.EMAILJS_TEMPLATE_ID
    ),
  });
}

// ─── WHATSAPP (CallMeBot) ────────────────────────────────────────────────────
export const whatsappAlertService = {

  // Main entry — called from useStockAlerts hook
  async sendViaTwilio(products: LowStockProduct[]): Promise<void> {
    return this.send(products);
  },

  async send(products: LowStockProduct[]): Promise<void> {
    const message = this.buildStockMessage(products);
    await this._sendRaw(message);
  },

  async sendRawMessage(message: string): Promise<void> {
    await this._sendRaw(message);
  },

  async _sendRaw(message: string): Promise<void> {
    if (!whatsAppConfig.CALLMEBOT_API_KEY) {
      console.warn("CallMeBot API key not set — opening wa.me link instead");
      this._openFallbackLink(message);
      return;
    }

    // Clean phone number (remove any + or spaces)
    const cleanPhone = whatsAppConfig.WHATSAPP_NUMBER.replace(/[+\s]/g, "");

    const encoded = encodeURIComponent(message);

    // CallMeBot API endpoint — sends to YOUR OWN number (the one you activated with)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encoded}&apikey=${whatsAppConfig.CALLMEBOT_API_KEY}`;

    try {
      const response = await fetch(url);

      if (response.ok) {
        const result = await response.text();
        console.log("CallMeBot response:", result);

        // CallMeBot returns plain text; errors usually contain "ERROR" or non-200 status
        if (result.toLowerCase().includes("error")) {
          console.error("CallMeBot API error:", result);
          this._openFallbackLink(message);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("CallMeBot send failed:", err);
      this._openFallbackLink(message);
    }
  },

  _openFallbackLink(message: string): void {
    const cleanPhone = whatsAppConfig.WHATSAPP_NUMBER.replace(/[+\s]/g, "");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
  },

  buildStockMessage(products: LowStockProduct[]): string {
    const lines = products.map((p) =>
      p.stock === 0
        ? `- ${p.short_name}: OUT OF STOCK`
        : `- ${p.short_name}: Low — ${p.stock} ${p.selling_unit}(s) left`
    );
    return [
      `📦 Stock Alert - ${new Date().toLocaleString()}`,
      "",
      ...lines,
      "",
      "Please restock soon.",
    ].join("\n");
  },

  buildSalesReportMessage(params: {
    storeName: string;
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    topOrders: { code: string; total: number; method: string }[];
    extraCount: number;
  }): string {
    const {
      storeName,
      totalSales,
      totalOrders,
      avgOrderValue,
      topOrders,
      extraCount,
    } = params;
    const orderLines = topOrders
      .map((o) => `- ${o.code}: GHS ${o.total.toFixed(2)} (${o.method})`)
      .join("\n");

    return [
      `📊 DAILY SALES REPORT`,
      `Store: ${storeName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Time: ${new Date().toLocaleTimeString()}`,
      ``,
      `FINANCIAL SUMMARY`,
      `Total Sales: GHS ${totalSales.toFixed(2)}`,
      `Total Orders: ${totalOrders}`,
      `Avg Order Value: GHS ${avgOrderValue.toFixed(2)}`,
      ``,
      `TOP ORDERS`,
      orderLines,
      extraCount > 0 ? `...and ${extraCount} more orders` : "",
      ``,
      `Auto-generated — System logged out after 6PM GMT`,
    ]
      .filter(Boolean)
      .join("\n");
  },
};

// ─── EMAIL (EmailJS — free, no backend needed) ───────────────────────────────
// Setup: https://www.emailjs.com → free plan = 200 emails/month
// 1. Create account → Add Email Service (Gmail works)
// 2. Create Email Template with variables: {{subject}}, {{message}}, {{to_email}}
// 3. Copy Service ID, Template ID, Public Key into .env

export const emailAlertService = {

  async sendEmail(params: {
    subject: string;
    message: string;
    toEmail?: string;
  }): Promise<boolean> {
    const { subject, message, toEmail } = params;

    if (
      !whatsAppConfig.EMAILJS_SERVICE_ID ||
      !whatsAppConfig.EMAILJS_TEMPLATE_ID ||
      !whatsAppConfig.EMAILJS_PUBLIC_KEY
    ) {
      if (whatsAppConfig.isDevelopment) {
        console.warn("EmailJS not configured — skipping email");
      }
      return false;
    }

    try {
      // EmailJS loaded via CDN in index.html
      const emailjs = (window as any).emailjs;
      if (!emailjs) {
        console.warn("EmailJS SDK not loaded — add script to index.html");
        return false;
      }

      await emailjs.send(
        whatsAppConfig.EMAILJS_SERVICE_ID,
        whatsAppConfig.EMAILJS_TEMPLATE_ID,
        {
          subject,
          message,
          to_email: toEmail || whatsAppConfig.ALERT_EMAIL,
        },
        whatsAppConfig.EMAILJS_PUBLIC_KEY
      );

      if (whatsAppConfig.isDevelopment) {
        console.log("Email sent successfully");
      }
      return true;
    } catch (err) {
      console.error("EmailJS send failed:", err);
      return false;
    }
  },

  async sendStockAlert(products: LowStockProduct[]): Promise<boolean> {
    const lines = products.map((p) =>
      p.stock === 0
        ? `${p.short_name}: OUT OF STOCK`
        : `${p.short_name}: Low stock — ${p.stock} ${p.selling_unit}(s) remaining`
    );
    return this.sendEmail({
      subject: `⚠️ Low Stock Alert — ${new Date().toLocaleDateString()}`,
      message: ["The following products need restocking:", "", ...lines].join(
        "\n"
      ),
    });
  },

  async sendSalesReport(params: {
    storeName: string;
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    orderLines: string[];
  }): Promise<boolean> {
    const { storeName, totalSales, totalOrders, avgOrderValue, orderLines } =
      params;
    const message = [
      `Store: ${storeName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `--- Financial Summary ---`,
      `Total Sales: GHS ${totalSales.toFixed(2)}`,
      `Total Orders: ${totalOrders}`,
      `Average Order: GHS ${avgOrderValue.toFixed(2)}`,
      ``,
      `--- Orders ---`,
      ...orderLines,
    ].join("\n");

    return this.sendEmail({
      subject: `📊 Daily Sales Report — ${storeName} — ${new Date().toLocaleDateString()}`,
      message,
    });
  },
};