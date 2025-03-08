"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const event_listener_1 = require("./shared/services/blockchain/event_listener/event_listener");
dotenv_1.default.config();
// const app = express();
// const PORT = process.env.PORT || 5001;
// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// // Sample Route
// app.get("/", (req: Request, res: Response) => {
//   res.send("Hello, Express with TypeScript!");
// });
// const MONGODB_URI = process.env.MONGODB_URI as string;
// (async () => {
//     try {
//       mongoose.connect(MONGODB_URI, {
//       } as ConnectOptions);
//       console.log("Connected To Database - Initial Connection");
//     } catch (err) {
//       console.log(
//         `Initial Distribution API Database connection error occurred -`,
//         err
//       );
//     }
// })();
// app.post('/ussd', ussdRoute) 
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
(0, event_listener_1.listenForCreateIntentEvent)().catch((err) => {
    console.error("Error listening for events:", err);
});
// Start Server
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on http://localhost:${PORT}`);
// });
