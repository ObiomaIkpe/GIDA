"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const controller_1 = require("./controller");
// import { RequestWithUser } from "./controller";
const router = (0, express_1.Router)();
// router.post("/register", async (req: Request, res: Response) => {
//     try {
//         await register(req, res)
//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });
router.post("/register", controller_1.register);
router.post("/login", controller_1.login);
router.get("/admin", passport_1.default.authenticate("jwt", { session: false }), controller_1.testAdmin);
exports.default = router;
