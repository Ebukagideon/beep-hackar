"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
const dotenv_1 = __importDefault(require("dotenv"));
const mono_chain_beep_1 = require("./mono-chain-beep");
dotenv_1.default.config();
const example = () => __awaiter(void 0, void 0, void 0, function* () {
    // Upload successful, code ID: 10906
    // Contract instantiated at: neutron13r9m3cn8zu6rnmkepajnm04zrry4g24exy9tunslseet0s9wrkkstcmkhr
    try {
        const CONTRACT_ADDRESS = "neutron13r9m3cn8zu6rnmkepajnm04zrry4g24exy9tunslseet0s9wrkkstcmkhr";
        const RPC_ENDPOINT = "https://rpc-palvus.pion-1.ntrn.tech";
        const MNEMONIC = process.env.MNEMONIC;
        const tATOM = "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj";
        const tNGN = "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp";
        const client = new mono_chain_beep_1.BeepContractClient(CONTRACT_ADDRESS, RPC_ENDPOINT);
        yield client.connect(MNEMONIC);
        // increase tATOM allowance 
        let atomAllowanceRes = yield client.increaseAllowance(tATOM, CONTRACT_ADDRESS, "10");
        console.log("Increase Allowance Transaction Result:", atomAllowanceRes);
        // Execute example
        const result = yield client.createIntent([{
                token: "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj",
                amount: "10",
                is_native: false
            }], [{
                token: "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp",
                amount: "50",
                is_native: false,
                target_address: undefined
            }], {
            token: "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj",
            amount: "1",
            is_native: false
        }, undefined, []);
        console.log("Create Intent Transaction Result:", result);
        // increase allowance 
        let ngnAllowanceRes = yield client.increaseAllowance(tNGN, CONTRACT_ADDRESS, "50");
        console.log("Increase Allowance Transaction Result:", ngnAllowanceRes);
        let res = yield client.fillIntent("intent52ff63e02bee532efa520d74b113b032a847eee4", // Change to your own intent id
        [{
                token: "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp",
                amount: "50",
                is_native: false,
                target_address: undefined
            }]);
        console.log("Fill Intent Transaction Result:", res);
        // Query examples
        const config = yield client.getConfig();
        console.log("Contract config:", config);
        const intents = yield client.listIntents(undefined, 10);
        console.log("First 10 intents:", JSON.stringify(intents));
        const userNonce = yield client.getUserNonce("neutron107nhk9pqhp446fr0fc83z0v82rg9guy8runkuz");
        console.log("User nonce:", userNonce);
    }
    catch (error) {
        console.error("Error:", error);
    }
});
example().catch(console.error);
__exportStar(require("./mono-chain-beep"), exports);
