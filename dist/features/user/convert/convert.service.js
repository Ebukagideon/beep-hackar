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
const transaction_response_1 = require("../../../shared/types/interfaces/responses/user/transaction.response");
class ConvertService {
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
        this.convertBNGNToBToken = (phoneNumber, amount) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            if (checkUser.data.balance < parseFloat(amount))
                return `END Insufficient bNGN balance`;
            const { id } = checkUser.data;
            // to do
            // do login to convert bNaira to bToken
            const newBalance = checkUser.data.balance - parseFloat(amount);
            const reference = this.generateUniqueCode();
            const newTransaction = yield this._transactionModel.createTransactionToDB({ userId: id, amount: parseFloat(amount), reference: reference, type: transaction_response_1.TransactionTypeEnum.DEBIT, status: transaction_response_1.TransactionStatus.COMPLETED });
            if (!newTransaction.data)
                return `END Unable to create transaction`;
            const updateBalance = yield this._userModel.updateAccount(phoneNumber, { balance: newBalance });
            if (!updateBalance.data)
                return `END Unable to carry out Transaction`;
            return `END Transaction in progress`;
        });
        this.convertBTokenToBNGN = (phoneNumber, amount) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            // to do
            // check blockchain balnce
            const { id } = checkUser.data;
            // to do
            // do login to convert bNaira to bToken
            const newBalance = checkUser.data.balance + parseFloat(amount);
            const reference = this.generateUniqueCode();
            const newTransaction = yield this._transactionModel.createTransactionToDB({ userId: id, amount: parseFloat(amount), reference: reference, type: transaction_response_1.TransactionTypeEnum.CREDIT, status: transaction_response_1.TransactionStatus.COMPLETED });
            if (!newTransaction.data)
                return `END Unable to create transaction`;
            const updateBalance = yield this._userModel.updateAccount(phoneNumber, { balance: newBalance });
            if (!updateBalance.data)
                return `END Unable to carry ou Transaction`;
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
exports.default = ConvertService;
