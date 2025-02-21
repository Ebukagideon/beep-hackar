"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserAccountDto {
    constructor(userAccount) {
        this.id = userAccount._id;
        this.phoneNumber = userAccount.phoneNumber;
        this.pin = userAccount.pin;
        this.publicKey = userAccount.publicKey;
        this.privateKey = userAccount.privateKey;
        this.balance = userAccount.balance;
        this.updatedAt = userAccount.updatedAt;
        this.createdAt = userAccount.createdAt;
    }
    get getModel() {
        return {
            _id: this.id,
            phoneNumber: this.phoneNumber,
            pin: this.pin,
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            balance: this.balance,
            updatedAt: this.updatedAt ? new Date(this.updatedAt) : undefined,
            createdAt: this.createdAt ? new Date(this.createdAt) : undefined,
        };
    }
    get getSecureRespons() {
        return {
            _id: this.id,
            phoneNumber: this.phoneNumber,
            publicKey: this.publicKey,
            balance: this.balance,
            updatedAt: this.updatedAt ? new Date(this.updatedAt) : undefined,
            createdAt: this.createdAt ? new Date(this.createdAt) : undefined,
        };
    }
}
exports.default = UserAccountDto;
