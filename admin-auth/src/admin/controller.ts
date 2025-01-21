
import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import dotenv from 'dotenv';


import { Strategy as JwtStrategy, ExtractJwt,StrategyOptions  } from "passport-jwt";

dotenv.config()
const prisma = new PrismaClient();


// Define a TypeScript interface for user input
interface RegisterInput {
  email: string;
  password: string;
  name: string;
}


// Function to validate input manually
const validateRegisterInput = (data: RegisterInput): string | null => {
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

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body as RegisterInput;

    // Validate input
    const validationError = validateRegisterInput({ email, password, name });
    if (validationError) {
      res.status(400).json({ error: validationError });
    }

    

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


interface LoginInput {
  email: string
  password: string
}

export const login = async (req: Request, res: Response) => {
  try {
      const {email, password} : LoginInput = req.body;

      const user = await prisma.user.findUnique({
        where: {email},
      });

      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin }, 
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1d" }
    );

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
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



// passport authentication
const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'secret',

}

passport.use(
  new JwtStrategy(opts, async(jwt_payload, done) => {
    try {
      // find the user by ID from the JWT payload
      console.log("jwt payload:", jwt_payload)
      const user = await prisma.user.findUnique({
        where: {id: jwt_payload.userId},
      });

      if (user) {
        return done (null, {...user, isAdmin: jwt_payload.isAdmin});
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false)
    }
  })
)


interface User {
  role: string;
  isAdmin: boolean
}

interface RequestWithUser extends Request{
  user: User;
}

export const testAdmin = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  const user = req.user as User
  try {
    if ( !user ) {
      res.status(403).json({ message: "Access denied. Admins only." });
      return
    }
    if ( !user.isAdmin ) {
      res.status(403).json({ message: "Access denied. Admins only." });
      return
    }
    res.json({ message: "Welcome, Admin!" })


  } catch (error) {
console.log(error)
  }
  

}