"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TransactionDto {
    constructor(usertransaction) {
        this.id = usertransaction._id;
        this.userId = usertransaction.userId,
            this.amount = usertransaction.amount;
        this.reference = usertransaction.reference;
        this.type = usertransaction.type;
        this.status = usertransaction.status;
        this.updatedAt = usertransaction.updatedAt;
        this.createdAt = usertransaction.createdAt;
    }
    get getModel() {
        return {
            _id: this.id,
            userId: this.userId,
            amount: this.amount,
            reference: this.reference,
            type: this.type,
            status: this.status,
            updatedAt: this.updatedAt ? new Date(this.updatedAt) : undefined,
            createdAt: this.createdAt ? new Date(this.createdAt) : undefined,
        };
    }
}
exports.default = TransactionDto;
