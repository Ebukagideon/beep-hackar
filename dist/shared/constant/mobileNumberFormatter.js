"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifiedPhoneNumber = void 0;
const modifiedPhoneNumber = (mobileNumber) => {
    if (mobileNumber.charAt(0) === "0") {
        let n = mobileNumber.substring(1);
        return "234" + n.toString();
    }
    else if (mobileNumber.startsWith("+234")) {
        let n = mobileNumber.substring(4);
        return "234" + n.toString();
    }
    else {
        return mobileNumber.toString();
    }
};
exports.modifiedPhoneNumber = modifiedPhoneNumber;
