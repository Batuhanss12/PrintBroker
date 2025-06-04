
import crypto from "crypto";

interface PayTRConfig {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: boolean;
}

interface PaymentRequest {
  planType: string;
  amount: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    companyName?: string;
    taxNumber?: string;
  };
  paymentMethod: string;
}

interface PayTRPaymentData {
  merchant_id: string;
  user_ip: string;
  merchant_oid: string;
  email: string;
  payment_amount: string;
  payment_type: string;
  installment_count: string;
  currency: string;
  test_mode: string;
  non_3d: string;
  merchant_ok_url: string;
  merchant_fail_url: string;
  user_name: string;
  user_address: string;
  user_phone: string;
  user_basket: string;
  debug_on: string;
  client_lang: string;
  paytr_token: string;
}

class PayTRService {
  private config: PayTRConfig;

  constructor() {
    this.config = {
      merchantId: process.env.PAYTR_MERCHANT_ID || "TEST_MERCHANT_ID",
      merchantKey: process.env.PAYTR_MERCHANT_KEY || "TEST_MERCHANT_KEY", 
      merchantSalt: process.env.PAYTR_MERCHANT_SALT || "TEST_MERCHANT_SALT",
      testMode: process.env.NODE_ENV !== "production"
    };
  }

  generateOrderId(): string {
    return `PC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createPayTRToken(data: any): string {
    const hashString = [
      this.config.merchantId,
      data.user_ip,
      data.merchant_oid,
      data.email,
      data.payment_amount,
      data.payment_type,
      data.installment_count,
      data.currency,
      data.test_mode,
      data.non_3d,
      this.config.merchantSalt
    ].join('');

    return crypto
      .createHmac('sha256', this.config.merchantKey)
      .update(hashString)
      .digest('base64');
  }

  async createPayment(request: PaymentRequest, userIp: string): Promise<{ success: boolean; paymentUrl?: string; paymentForm?: string; data?: any; message?: string }> {
    try {
      const orderId = this.generateOrderId();
      // Convert to kuruş (multiply by 100) and add VAT for firm plans
      const amount = request.planType === "firm" 
        ? Math.round(request.amount * 1.2 * 100) // Firm plan with VAT
        : Math.round(request.amount * 100); // Customer credit loading
      
      if (amount <= 0) {
        return {
          success: false,
          message: "Geçersiz ödeme tutarı"
        };
      }

      // Create user basket (required by PayTR)
      const productName = request.planType === "firm" ? "Firma Paketi" : "Kredi Yükleme";
      const userBasket = JSON.stringify([
        [productName, `${(amount / 100).toFixed(2)}`, 1]
      ]);

      const paymentData = {
        merchant_id: this.config.merchantId,
        user_ip: userIp,
        merchant_oid: orderId,
        email: request.customer.email,
        payment_amount: amount.toString(),
        payment_type: "card",
        installment_count: "0",
        currency: "TL",
        test_mode: this.config.testMode ? "1" : "0",
        non_3d: "0",
        merchant_ok_url: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/success`,
        merchant_fail_url: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/fail`,
        user_name: `${request.customer.firstName} ${request.customer.lastName}`,
        user_address: `${request.customer.address}, ${request.customer.city} ${request.customer.postalCode}`,
        user_phone: request.customer.phone,
        user_basket: userBasket,
        debug_on: this.config.testMode ? "1" : "0",
        client_lang: "tr",
        paytr_token: ""
      };

      // Generate PayTR token
      paymentData.paytr_token = this.createPayTRToken(paymentData);

      // PayTR Basic API - Token al
      const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST", 
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(paymentData as any).toString(),
      });

      const result = await response.text();
      console.log("PayTR Response:", result);
      
      if (result.startsWith("SUCCESS")) {
        // Token başarılı şekilde alındı
        const token = result.split(":")[1];
        const paymentUrl = `https://www.paytr.com/odeme/guvenli/${token}`;
        
        return {
          success: true,
          paymentUrl,
          data: {
            orderId,
            token,
            amount: amount / 100
          }
        };
      } else {
        console.error("PayTR Error:", result);
        return {
          success: false,
          message: result.includes("Test islem") ? "Test modunda doğru kart bilgilerini kullanın" : "Ödeme sistemi hatası"
        };
      }
    } catch (error) {
      console.error("PayTR Service Error:", error);
      return {
        success: false,
        message: "Ödeme işlemi başlatılamadı"
      };
    }
  }

  verifyCallback(data: any): boolean {
    try {
      const { merchant_oid, status, total_amount, hash } = data;
      
      const hashString = [
        merchant_oid,
        this.config.merchantSalt,
        status,
        total_amount
      ].join('');

      const calculatedHash = crypto
        .createHmac('sha256', this.config.merchantKey)
        .update(hashString)
        .digest('base64');

      return hash === calculatedHash;
    } catch (error) {
      console.error("Hash verification error:", error);
      return false;
    }
  }
}

export const paytrService = new PayTRService();
