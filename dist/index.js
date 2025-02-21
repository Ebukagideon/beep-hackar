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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const ussd_route_1 = require("./ussd.route");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Sample Route
app.get("/", (req, res) => {
    res.send("Hello, Express with TypeScript!");
});
const MONGODB_URI = process.env.MONGODB_URI;
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        mongoose_1.default.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected To Database - Initial Connection");
    }
    catch (err) {
        console.log(`Initial Distribution API Database connection error occurred -`, err);
    }
}))();
app.post('/ussd', ussd_route_1.ussdRoute);
// app.post('/ussd', (req, res) => {
//   // Read the variables sent via POST from our API
//   const {
//       sessionId,
//       serviceCode,
//       phoneNumber,
//       text,
//   } = req.body;
//   let response = '';
//   if (text == '') {
//       // This is the first request. Note how we start the response with CON
//       console.log('sessionId', sessionId)
//       console.log('serviceCode', serviceCode)
//       console.log('phoneNumber', phoneNumber)
//       console.log('text', text)
//       response = `CON What would you like to check
//       1. My account
//       2. My phone number
//       2. My wife Name`;
//   } else if ( text == '1') {
//       // Business logic for first level response
//       response = `CON Choose account information you want to view
//       1. Account number`;
//   } else if ( text == '2') {
//       // Business logic for first level response
//       // This is a terminal request. Note how we start the response with END
//       response = `END Your phone number is ${phoneNumber}`;
//   } else if ( text == '1*1') {
//       // This is a second level response where the user selected 1 in the first instance
//       const accountNumber = 'ACC100101';
//       // This is a terminal request. Note how we start the response with END
//       response = `END Your account number is ${accountNumber}`;
//   }else if (text == '3'){
//       response = `END Your wife name is Zainab`;
//   }
//   // Send the response back to the API
//   res.set('Content-Type: text/plain');
//   res.send(response);
// });
// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
