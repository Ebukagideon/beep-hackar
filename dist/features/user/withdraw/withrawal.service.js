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
const paystack_service_1 = require("../../../shared/services/paystack/paystack.service");
class WithdrawalService {
    constructor({ userModel, transactionModel, encryptionRepo }) {
        this.paystackService = new paystack_service_1.PaystackService();
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            return `CON Enter PIN `;
        });
        this.verifyUser = (phoneNumber, pin) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            const veryPin = this._encryptionRepo.comparePassword(pin, checkUser.data.pin);
            if (!veryPin)
                return `END Incorrect PIN`;
            return `CON Enter Amount`;
        });
        this.enterAccountNumber = () => __awaiter(this, void 0, void 0, function* () {
            return `CON Enter Account Number`;
        });
        this.withdraw = (phoneNumber, amount, accountNumber) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            if (checkUser.data.balance < parseFloat(amount))
                return `END Insufficient bNGN balance`;
            const { id } = checkUser.data;
            // to do
            // check withdrawal login
            return `END Transaction in progress`;
        });
        this._userModel = userModel;
        this._transactionModel = transactionModel;
        this._encryptionRepo = encryptionRepo;
    }
    generateUniqueCode() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0'); // 2-digit day
        const minutes = String(now.getMinutes()).padStart(2, '0'); // 2-digit minutes
        const ms = String(now.getMilliseconds()).slice(-1); // Last digit of milliseconds
        return `${day}${minutes}${ms}`; // Example: "27154"
    }
}
exports.default = WithdrawalService;
