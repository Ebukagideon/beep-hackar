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
const termii_1 = require("../../../shared/services/sms/termii");
const transaction_response_1 = require("../../../shared/types/interfaces/responses/user/transaction.response");
const mobileNumberFormatter_1 = require("../../../shared/constant/mobileNumberFormatter");
class DepositService {
    constructor({ userModel, transactionModel, encryptionRepo }) {
        this.paystackService = new paystack_service_1.PaystackService();
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            return `CON Enter PIN `;
        });
        this.enterreference = () => __awaiter(this, void 0, void 0, function* () {
            return `CON Enter reference code `;
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
        this.initializeDeposit = (phoneNumber, amount) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            const { id } = checkUser.data;
            const initDeposit = yield this.paystackService.initTransaction('akinyemisaheedwale@gmail.com', parseFloat(amount), id);
            if (!initDeposit.status)
                return `END ${initDeposit.message}`;
            const newTransaction = yield this._transactionModel.createTransactionToDB({ userId: id, amount: parseFloat(amount), reference: (_a = initDeposit.data) === null || _a === void 0 ? void 0 : _a.reference, type: transaction_response_1.TransactionTypeEnum.CREDIT, status: transaction_response_1.TransactionStatus.PENDING });
            if (!newTransaction.data)
                return `END Unable to create transaction`;
            let mobileNumber = (0, mobileNumberFormatter_1.modifiedPhoneNumber)(phoneNumber);
            const text = `Hello dear, please use this link ${(_b = initDeposit.data) === null || _b === void 0 ? void 0 : _b.url} complete your transaction and also use this code ${(_c = initDeposit.data) === null || _c === void 0 ? void 0 : _c.reference} to verify your transaction`;
            (0, termii_1.sendSms)(mobileNumber, text);
            return `END  Dear Customer, you will receive an SMS with link for payment and reference code for verificcation shortly`;
        });
        this.verifyDeposit = (phoneNumber, reference) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            const { id } = checkUser.data;
            const checkTransaction = yield this._transactionModel.checkIfExist({ reference });
            if (!checkTransaction.data)
                return `END No transaction found`;
            if (checkTransaction.data.status == transaction_response_1.TransactionStatus.PENDING) {
                const verifyDeposit = yield this.paystackService.verifyTransaction(reference);
                if (!verifyDeposit.status)
                    return `END ${verifyDeposit.message}`;
                const updateTransactionStatus = yield this._transactionModel.updateTransation(checkTransaction.data.id, { status: transaction_response_1.TransactionStatus.COMPLETED });
                if (!updateTransactionStatus.data)
                    return `END Unable to update transaction`;
                const newBalance = checkUser.data.balance + checkTransaction.data.amount;
                const updateBalance = yield this._userModel.updateAccount(phoneNumber, { balance: newBalance });
                if (!updateBalance.data)
                    return `END Unable to verify Transaction`;
                return `END Transaction verified successfully`;
            }
            else {
                return `END Unable to verify transaction or transaction already Verified`;
            }
        });
        this._userModel = userModel;
        this._transactionModel = transactionModel;
        this._encryptionRepo = encryptionRepo;
    }
}
exports.default = DepositService;
