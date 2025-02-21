"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackService = void 0;
class PaystackService {
    constructor() {
        this.paystackSecretKey = 'sk_test_b27336978f0f77d84915d7e883b0f756f6d150e7';
        // async createTransferRecipient(payload: CreateTransferRecipientDto) {
        //   try {
        //     const response = await fetch(
        //       `https://api.paystack.co/transferrecipient`,
        //       {
        //         method: 'POST',
        //         headers: {
        //           Authorization: `Bearer ${this.paystackSecretKey}`,
        //           'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //           type: 'nuban',
        //           name: payload.accountName,
        //           account_number: payload.accountNumber,
        //           bank_code: payload.bankCode,
        //         }),
        //       },
        //     );
        //     const data = await response.json();
        //     if (data.status === false) {
        //       throw new BadRequestException(
        //         'Oops! There was an error\n This is not from you',
        //       );
        //     }
        //     return {
        //       status: true,
        //       data: data.data,
        //     };
        //   } catch (error) {
        //     return {
        //       status: false,
        //       message: 'Unable to create transfer recipient',
        //     };
        //   }
        // }
        // async initiateTransfer(payload: InitiateTransferDto) {
        //   try {
        //     const response = await fetch(`https://api.paystack.co/transfer`, {
        //       method: 'POST',
        //       headers: {
        //         Authorization: `Bearer ${this.paystackSecretKey}`,
        //         'Content-Type': 'application/json',
        //       },
        //       body: JSON.stringify({
        //         source: 'balance',
        //         amount: payload.amount * 100, // Converting from Naira to Kobo
        //         reason: payload.description,
        //         recipient: payload.recipient,
        //       }),
        //     });
        //     const data = await response.json();
        //     console.log('data', data);
        //     if (data.status === false) {
        //       return {
        //         status: false,
        //         message: data.message,
        //       };
        //     }
        //     return {
        //       status: true,
        //       data: data.data,
        //     };
        //   } catch (error) {
        //     return {
        //       status: false,
        //       message: 'Unable to initialize transfer',
        //     };
        //   }
        // }
        // async finalizeTransfer(payload: FinalizeTransferDto) {
        //   const response = await fetch(
        //     `https://api.paystack.co/transfer/finalize_transfer`,
        //     {
        //       method: 'POST',
        //       headers: {
        //         Authorization: `Bearer ${this.paystackSecretKey}`,
        //         'Content-Type': 'application/json',
        //       },
        //       body: JSON.stringify({
        //         transfer_code: payload.transferCode,
        //         otp: payload.otp,
        //       }),
        //     },
        //   );
        // }
    }
    initTransaction(email, amount, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const paystackSecretKey = process.env.PAYSTACK_KEY;
                const currentDate = new Date();
                const milliseconds = currentDate.getMilliseconds();
                const response = yield fetch('https://api.paystack.co/transaction/initialize', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.paystackSecretKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: amount * 100, // Amount in kobo (e.g., 10000 kobo = ₦100)
                        email: email,
                        reference: milliseconds,
                        metadata: {
                            userId,
                            amount,
                        },
                        //   callback_url: callback,
                    }),
                });
                const data = yield response.json();
                if (!data.status) {
                    return {
                        status: false,
                        message: 'Unable to initialize transactions',
                    };
                }
                return {
                    status: true,
                    message: 'Payment successfully initialize',
                    data: {
                        url: data.data.authorization_url,
                        reference: data.data.reference,
                    },
                };
            }
            catch (error) {
                console.error('Error in initializing transaction:', error);
                return {
                    status: false,
                    message: 'Unable to initialize transactions',
                    error: error,
                };
            }
        });
    }
    verifyTransaction(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${this.paystackSecretKey}`,
                    },
                });
                const data = yield response.json();
                if (!data.status) {
                    return {
                        status: false,
                        message: 'Transaction reference not found',
                    };
                }
                if (data.data.gateway_response != 'Successful') {
                    return {
                        status: false,
                        message: 'Transaction was not completed',
                    };
                }
                return {
                    status: true,
                    message: 'Transaction verified successfully',
                    data: data.data.metadata,
                };
            }
            catch (error) {
                console.error('Error in initializing transaction:', error);
                return {
                    status: false,
                    message: 'Unable to initialize transactions',
                    error: error,
                };
            }
        });
    }
}
exports.PaystackService = PaystackService;
