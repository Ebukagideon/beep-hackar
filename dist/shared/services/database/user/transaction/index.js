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
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const transaction_response_1 = require("../../../../types/interfaces/responses/user/transaction.response");
const transaction_dto_1 = __importDefault(require("../../../../types/dtos/user/transaction.dto"));
const TransactionSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        unique: true
    },
    type: {
        type: String,
        enum: transaction_response_1.TransactionTypeEnum
    },
    status: {
        type: String,
        enum: transaction_response_1.TransactionStatus
    },
    updatedAt: {
        type: String
    },
    createdAt: {
        type: String
    },
});
TransactionSchema.plugin(mongoose_paginate_v2_1.default);
exports.Transaction = (0, mongoose_1.model)("Transaction", TransactionSchema);
class TransactionModel {
    constructor() {
        this.createTransactionToDB = (details) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.Transaction.create(details);
                if (data) {
                    return { status: true, data: new transaction_dto_1.default(data) };
                }
                else {
                    return { status: false, error: "Couldn't create transaction" };
                }
            }
            catch (error) {
                return { status: false, error };
            }
        });
        this.checkIfExist = (details) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.Transaction.findOne(details);
                if (data) {
                    return { status: true, data: new transaction_dto_1.default(data) };
                }
                else {
                    return { status: false, error: "no transaction find" };
                }
            }
            catch (error) {
                return { status: false, error };
            }
        });
        this.updateTransation = (id, details) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.Transaction.findOneAndUpdate({ _id: id }, details, { new: true });
                if (data) {
                    return { status: true, data: new transaction_dto_1.default(data) };
                }
                else {
                    return { status: false, error: "Unable to update transaction" };
                }
            }
            catch (error) {
                return { status: false, error };
            }
        });
        this.Transaction = exports.Transaction;
    }
}
exports.default = TransactionModel;
