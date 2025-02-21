"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionTypeEnum = void 0;
var TransactionTypeEnum;
(function (TransactionTypeEnum) {
    TransactionTypeEnum["CREDIT"] = "credit";
    TransactionTypeEnum["DEBIT"] = "debit";
})(TransactionTypeEnum || (exports.TransactionTypeEnum = TransactionTypeEnum = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "complete";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
