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
const termii_1 = require("../../../shared/services/sms/termii");
const mobileNumberFormatter_1 = require("../../../shared/constant/mobileNumberFormatter");
// import BlockchainAccount from "../../../shared/services/blockchain/account";
class AuthService {
    // private blockchain = new BlockchainAccount()
    constructor({ userModel, encryptionRepo }) {
        this.start = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.status) {
                return `CON Carrier info
            11. Create account
            0. Exist
            `;
            }
            if (!((_a = checkUser.data) === null || _a === void 0 ? void 0 : _a.pin)) {
                return `CON Carrier info
            12. Create pin
            0. Back`;
            }
            return `CON Carrier info
        1. Deposit
        2. Transfer bTokn
        3. Withdraw bNGN
        4. verify deposit transaction
        5. convert bNGN to bToken
        6. convert bToken to bNGN
        7. balance
        0. Back`;
        });
        this.createAccount = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (checkUser.data)
                return `END You already have account`;
            // const blockChainAccount = await this.blockchain.createAccount()
            const publicKey = "generalpublickeururu";
            const privateKey = this._encryptionRepo.encryptToken("general994848900044", process.env.ENCRYTION_KEY);
            const createAccount = yield this._userModel.createAccountToDB({ phoneNumber, publicKey, privateKey });
            if (!createAccount.data)
                return `END Unable to create account`;
            return `CON Carrier info
        1. Create pin
        0. Back`;
        });
        this.enterPin = () => __awaiter(this, void 0, void 0, function* () {
            return `CON Enter PIN`;
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
        this.createPin = (phoneNumber, pin) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            if ((_a = checkUser.data) === null || _a === void 0 ? void 0 : _a.pin)
                return `END PIN already created`;
            if (pin.length !== 4)
                return `END Invalid PIN format. Please enter a 4-digit PIN.`;
            const hashPin = this._encryptionRepo.encryptPassword(pin);
            const createPin = yield this._userModel.updateAccount(phoneNumber, { pin: hashPin });
            if (!createPin.data)
                return `END Unable to save pin`;
            return `END PIN created successfully.`;
        });
        this.getBalance = (phoneNumber, pin) => __awaiter(this, void 0, void 0, function* () {
            const checkUser = yield this._userModel.checkIfExist({ phoneNumber });
            if (!checkUser.data)
                return `END Unable to get your account`;
            const veryPin = this._encryptionRepo.comparePassword(pin, checkUser.data.pin);
            if (!veryPin)
                return `END Incorrect PIN`;
            // to do 
            //get the real bToken balance from blockchain
            const bTokenBalance = 20;
            const bNGNBalance = checkUser.data.balance;
            let mobileNumber = (0, mobileNumberFormatter_1.modifiedPhoneNumber)(phoneNumber);
            const text = `bNGN balance: ${bNGNBalance}, bToken balance: ${bTokenBalance}`;
            (0, termii_1.sendSms)(mobileNumber, text);
            return `END bNGN balance: ${bNGNBalance}
        bToken balance: ${bTokenBalance}`;
        });
        this._userModel = userModel;
        this._encryptionRepo = encryptionRepo;
    }
}
exports.default = AuthService;
