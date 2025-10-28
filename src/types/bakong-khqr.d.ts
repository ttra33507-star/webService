declare module 'bakong-khqr' {
  export const khqrData: {
    currency: {
      usd: number;
      khr: number;
    };
    merchantType: {
      merchant: string;
      individual: string;
    };
  };

  export class IndividualInfo {
    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      optional?: Record<string, unknown>,
    );
  }

  export class MerchantInfo extends IndividualInfo {
    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      merchantID: string,
      acquiringBank: string,
      optional?: Record<string, unknown>,
    );
  }

  export interface KhqrResult {
    status: {
      code: number;
      message?: string | null;
    };
    data: {
      qr: string;
    };
  }

  export class BakongKHQR {
    generateIndividual(info: IndividualInfo): KhqrResult;
    generateMerchant(info: MerchantInfo): KhqrResult;
  }
}
