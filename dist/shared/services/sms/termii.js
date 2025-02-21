"use strict";
// import fetch from "node-fetch";
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
exports.sendSms = void 0;
const sendSms = (to, sms) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        to,
        from: process.env.TERMII_SENDER_ID,
        sms,
        type: "plain",
        api_key: process.env.TERMI_API_KEY,
        // channel: "dnd",
        channel: "generic",
    };
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    fetch("https://api.ng.termii.com/api/sms/send", options)
        .then((response) => {
        console.log("sent message ", response.body);
    })
        .catch((error) => {
        console.error(error);
        throw error;
    });
});
exports.sendSms = sendSms;
