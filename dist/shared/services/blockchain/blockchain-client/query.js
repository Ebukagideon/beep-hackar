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
exports.BeepQueryClient = void 0;
class BeepQueryClient {
    constructor(queryClient) {
        this.queryClient = queryClient;
    }
    getDenom(denom) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "/beep.tokenfactory.Query/Denom";
            const request = new Uint8Array(Buffer.from(JSON.stringify({ denom })));
            const response = yield this.queryClient.queryAbci(path, request);
            return JSON.parse(new TextDecoder().decode(response.value));
        });
    }
    listDenoms() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "/beep.tokenfactory.Query/DenomAll";
            const request = new Uint8Array();
            const response = yield this.queryClient.queryAbci(path, request);
            return JSON.parse(new TextDecoder().decode(response.value)).denoms;
        });
    }
    getIntent(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "/beep.intent.Query/Intents";
            const request = new Uint8Array(Buffer.from(JSON.stringify({ id })));
            const response = yield this.queryClient.queryAbci(path, request);
            return JSON.parse(new TextDecoder().decode(response.value));
        });
    }
    listIntents() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "/beep.intent.Query/IntentsAll";
            const request = new Uint8Array();
            const response = yield this.queryClient.queryAbci(path, request);
            return JSON.parse(new TextDecoder().decode(response.value)).intents;
        });
    }
}
exports.BeepQueryClient = BeepQueryClient;
