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
exports.BeepTxClient = void 0;
class BeepTxClient {
    constructor(signingClient) {
        this.signingClient = signingClient;
    }
    createIntent(creator, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ creator: creator }, params), { amount: params.amount.toString() });
            return yield this.signingClient.signAndBroadcast(creator, [{
                    typeUrl: "/beep.intent.MsgCreateIntent",
                    value: msg
                }], "auto");
        });
    }
    acceptIntent(executor, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ executor: executor }, params), { id: params.id.toString() });
            return yield this.signingClient.signAndBroadcast(executor, [{
                    typeUrl: "/beep.intent.MsgAcceptIntent",
                    value: msg
                }], "auto");
        });
    }
    createDenom(creator, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ owner: creator }, params), { maxSupply: params.maxSupply.toString() });
            return yield this.signingClient.signAndBroadcast(creator, [{
                    typeUrl: "/beep.tokenfactory.MsgCreateDenom",
                    value: msg
                }], "auto");
        });
    }
    updateDenom(owner, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ owner }, params), { maxSupply: params.maxSupply.toString() });
            return yield this.signingClient.signAndBroadcast(owner, [{
                    typeUrl: "/beep.tokenfactory.MsgUpdateDenom",
                    value: msg
                }], "auto");
        });
    }
    mintToken(owner, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ owner }, params), { recipient: params.recipient.toString() });
            return yield this.signingClient.signAndBroadcast(owner, [{
                    typeUrl: "/beep.tokenfactory.MsgMintTokens",
                    value: msg
                }], "auto");
        });
    }
    transferToken(sender, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ sender }, params), { amount: params.amount.toString() });
            return yield this.signingClient.signAndBroadcast(sender, [{
                    typeUrl: "/beep.tokenfactory.MsgTransferTokens",
                    value: msg
                }], "auto");
        });
    }
    burnToken(signer, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = Object.assign(Object.assign({ signer }, params), { denom: params.denom.toString() });
            return yield this.signingClient.signAndBroadcast(signer, [{
                    typeUrl: "/beep.tokenfactory.MsgBurnTokens",
                    value: msg
                }], "auto");
        });
    }
}
exports.BeepTxClient = BeepTxClient;
