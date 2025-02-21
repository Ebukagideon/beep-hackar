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
exports.UserAccount = void 0;
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const userAccount_dto_1 = __importDefault(require("../../../../types/dtos/user/userAccount.dto"));
const UserAccountSchema = new mongoose_1.Schema({
    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    pin: {
        type: String
    },
    publicKey: {
        type: String,
    },
    privateKey: {
        type: String,
    },
    balance: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: String
    },
    createdAt: {
        type: String
    },
});
UserAccountSchema.plugin(mongoose_paginate_v2_1.default);
exports.UserAccount = (0, mongoose_1.model)("UserAccount", UserAccountSchema);
class UserAccountModel {
    constructor() {
        this.createAccountToDB = (details) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.UserAccount.create(details);
                if (data) {
                    return { status: true, data: new userAccount_dto_1.default(data) };
                }
                else {
                    return { status: false, error: "Couldn't create account" };
                }
            }
            catch (error) {
                return { status: false, error };
            }
        });
        this.checkIfExist = (details) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.UserAccount.findOne(details);
                if (data) {
                    return { status: true, data: new userAccount_dto_1.default(data) };
                }
                else {
                    return { status: false, error: "no account find" };
                }
            }
            catch (error) {
                return { status: false, error };
            }
        });
        this.updateAccount = (phoneNumber, details) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.UserAccount.findOneAndUpdate({ phoneNumber }, details, { new: true });
                if (data) {
                    return { status: true, data: new userAccount_dto_1.default(data) };
                }
                else {
                    return { status: false, error: "Unable to update configuration" };
                }
            }
            catch (error) {
                return { status: false, error };
            }
        });
        this.UserAccount = exports.UserAccount;
    }
}
exports.default = UserAccountModel;
