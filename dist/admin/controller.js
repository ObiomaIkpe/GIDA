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
exports.testAdmin = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_jwt_1 = require("passport-jwt");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// Function to validate input manually
const validateRegisterInput = (data) => {
    if (!data.email || !data.email.includes("@")) {
        return "Invalid email format.";
    }
    if (!data.password || data.password.length < 6) {
        return "Password must be at least 6 characters long.";
    }
    if (!data.name || data.name.length < 2) {
        return "Name must be at least 2 characters long.";
    }
    return null;
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        // Validate input
        const validationError = validateRegisterInput({ email, password, name });
        if (validationError) {
            res.status(400).json({ error: validationError });
        }
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Create user in the database
        const user = yield prisma.user.create({
            data: { email, password: hashedPassword, name },
        });
        res.status(201).json({
            message: "User registered successfully",
            user: { id: user.id, email: user.email, name: user.name },
        });
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Generate a JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1d" });
        // Send the token back to the client
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.login = login;
// passport authentication
const opts = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'secret',
};
passport_1.default.use(new passport_jwt_1.Strategy(opts, (jwt_payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // find the user by ID from the JWT payload
        console.log("jwt payload:", jwt_payload);
        const user = yield prisma.user.findUnique({
            where: { id: jwt_payload.userId },
        });
        if (user) {
            return done(null, Object.assign(Object.assign({}, user), { isAdmin: jwt_payload.isAdmin }));
        }
        else {
            return done(null, false);
        }
    }
    catch (error) {
        return done(error, false);
    }
})));
const testAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        if (!user) {
            res.status(403).json({ message: "Access denied. Admins only." });
            return;
        }
        if (!user.isAdmin) {
            res.status(403).json({ message: "Access denied. Admins only." });
            return;
        }
        res.json({ message: "Welcome, Admin!" });
    }
    catch (error) {
        console.log(error);
    }
});
exports.testAdmin = testAdmin;
