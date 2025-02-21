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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ussdRoute = void 0;
const index_1 = __importDefault(require("./shared/services/database/user/Account/index"));
const index_2 = __importDefault(require("./shared/services/database/user/transaction/index"));
const index_3 = __importDefault(require("./shared/services/encryption/index"));
const auth_service_1 = __importDefault(require("./features/user/auth/auth.service"));
const deposite_service_1 = __importDefault(require("./features/user/deposit/deposite.service"));
const convert_service_1 = __importDefault(require("./features/user/convert/convert.service"));
const transfer_service_1 = __importDefault(require("./features/user/transfer/transfer.service"));
const withrawal_service_1 = __importDefault(require("./features/user/withdraw/withrawal.service"));
const encryptionRepo = new index_3.default();
const userModel = new index_1.default();
const transactionModel = new index_2.default();
const authService = new auth_service_1.default({ userModel, encryptionRepo });
const depositService = new deposite_service_1.default({ userModel, transactionModel, encryptionRepo });
const convertService = new convert_service_1.default({ userModel, transactionModel, encryptionRepo });
const transferService = new transfer_service_1.default({ userModel, transactionModel, encryptionRepo });
const withdrawalService = new withrawal_service_1.default({ userModel, transactionModel, encryptionRepo });
const ussdRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId, serviceCode, phoneNumber, text, } = req.body;
    console.log('sessionId', sessionId);
    console.log('serviceCode', serviceCode);
    console.log('phoneNumber', phoneNumber);
    console.log('text', text);
    let response = '';
    if (text == '') {
        response = yield authService.start(phoneNumber);
    }
    else if (text == '11') {
        response = yield authService.createAccount(phoneNumber);
    }
    else if (text == '11*1') {
        response = yield authService.enterPin();
    }
    else if (text.startsWith('11*1*')) {
        let pin = text.split('*')[2];
        response = yield authService.createPin(phoneNumber, pin);
    }
    else if (text == '12') {
        response = yield authService.enterPin();
    }
    else if (text.startsWith('12*')) {
        let pin = text.split('*')[1];
        response = yield authService.createPin(phoneNumber, pin);
    }
    else if (text == '1') {
        response = yield depositService.start();
    }
    else if (text.startsWith('1*')) {
        let parts = text.split('*');
        if (parts.length == 2) {
            let pin = text.split('*')[1];
            response = yield depositService.verifyUser(phoneNumber, pin);
        }
        else if (parts.length === 3) {
            let amount = text.split('*')[2];
            response = yield depositService.initializeDeposit(phoneNumber, amount);
        }
    }
    else if (text == '4') {
        response = yield depositService.enterreference();
    }
    else if (text.startsWith('4*')) {
        let reference = text.split('*')[1];
        response = yield depositService.verifyDeposit(phoneNumber, reference);
    }
    else if (text == '7') {
        response = yield authService.enterPin();
    }
    else if (text.startsWith('7*')) {
        let pin = text.split('*')[1];
        response = yield authService.getBalance(phoneNumber, pin);
    }
    else if (text == '5') {
        response = yield convertService.start();
    }
    if (text.startsWith('5*')) {
        let parts = text.split('*');
        if (parts.length == 2) {
            let pin = text.split('*')[1];
            response = yield convertService.verifyUser(phoneNumber, pin);
        }
        else if (parts.length === 3) {
            let amount = text.split('*')[2];
            response = yield convertService.convertBNGNToBToken(phoneNumber, amount);
        }
    }
    else if (text == '6') {
        response = yield convertService.start();
    }
    if (text.startsWith('6*')) {
        let parts = text.split('*');
        if (parts.length == 2) {
            let pin = text.split('*')[1];
            response = yield convertService.verifyUser(phoneNumber, pin);
        }
        else if (parts.length === 3) {
            let amount = text.split('*')[2];
            response = yield convertService.convertBTokenToBNGN(phoneNumber, amount);
        }
    }
    else if (text == '2') {
        response = yield transferService.start();
    }
    if (text.startsWith('2*')) {
        let parts = text.split('*');
        if (parts.length == 2) {
            let pin = text.split('*')[1];
            response = yield transferService.verifyUser(phoneNumber, pin);
        }
        else if (parts.length === 3) {
            response = yield transferService.enterAddress();
        }
        else if (parts.length === 4) {
            let amount = text.split('*')[2];
            let address = text.split('*')[3];
            response = yield transferService.transfer(phoneNumber, amount, address);
        }
    }
    else if (text == '3') {
        response = yield withdrawalService.start();
    }
    if (text.startsWith('3*')) {
        let parts = text.split('*');
        if (parts.length == 2) {
            let pin = text.split('*')[1];
            response = yield withdrawalService.verifyUser(phoneNumber, pin);
        }
        else if (parts.length === 3) {
            response = yield withdrawalService.enterAccountNumber();
        }
        else if (parts.length === 4) {
            let amount = text.split('*')[2];
            let account = text.split('*')[3];
            response = yield withdrawalService.withdraw(phoneNumber, amount, account);
        }
    }
    res.set('Content-Type: text/plain');
    res.send(response);
});
exports.ussdRoute = ussdRoute;
