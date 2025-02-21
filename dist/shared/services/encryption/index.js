"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
class EncryptionRepo {
    constructor() {
        this.encryptToken = (data, secret) => {
            // return jwt.sign(data, process.env.SECRET_ENCRYPTION_KEY!);
            return jsonwebtoken_1.default.sign(data, secret);
        };
        this.decryptToken = (data, secret) => {
            // return jwt.verify(data, process.env.SECRET_ENCRYPTION_KEY!) as string;
            return jsonwebtoken_1.default.verify(data, secret);
        };
        this.encryptPassword = (password) => {
            return this.bcrypt.hashSync(password, 10);
        };
        this.comparePassword = (password, userPassword) => {
            return this.bcrypt.compareSync(password, userPassword);
        };
        this.jwt = jsonwebtoken_1.default;
        this.uuid = uuid_1.v4;
        this.bcrypt = bcryptjs_1.default;
    }
}
exports.default = EncryptionRepo;
