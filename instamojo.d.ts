declare module 'instamojo-nodejs' {
    interface Headers {
      'X-Api-Key': string;
      'X-Auth-Token': string;
    }
  
    interface PaymentData {
      purpose: string;
      amount: number;
      currency?: string;
      buyer_name?: string;
      email?: string;
      phone?: string | null;
      send_email?: boolean;
      send_sms?: boolean;
      allow_repeated_payments?: string;
      webhook?: string;
      redirect_url?: string;
      setWebhook(hook: string): void;
      setRedirectUrl(redirectUrl: string): void;
    }
  
    interface RefundRequest {
      payment_id: string;
      type: string; // Available : ['RFD', 'TNR', 'QFL', 'QNR', 'EWN', 'TAN', 'PTH']
      body?: string;
      setRefundAmount(refundAmount: number): void;
    }
  
    type Callback<T> = (error: any, result: T) => void;
  
    interface Instamojo {
      HEADERS: Headers;
      CURRENT_HOST: string;
      isSandboxMode(isSandbox: boolean): void;
      setKeys(apiKey: string, authKey: string): void;
      createPayment(data: PaymentData, callback: Callback<any>): void;
      seeAllLinks(callback: Callback<any>): void;
      getAllPaymentRequests(callback: Callback<any>): void;
      getPaymentRequestStatus(id: string, callback: Callback<any>): void;
      getPaymentDetails(payment_request_id: string, payment_id: string, callback: Callback<any>): void;
      createRefund(refundRequest: RefundRequest, callback: Callback<any>): void;
      getAllRefunds(callback: Callback<any>): void;
      getRefundDetails(id: string, callback: Callback<any>): void;
      PaymentData: { new(): PaymentData };
      RefundRequest: { new(): RefundRequest };
    }
  
    const instamojo: Instamojo;
    export = instamojo;
  }
  