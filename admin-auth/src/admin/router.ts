import { Router , Request, Response, } from "express";
import passport from "passport";
import { login, register, testAdmin} from "./controller";
// import { RequestWithUser } from "./controller";

const router = Router();


// router.post("/register", async (req: Request, res: Response) => {
//     try {
//         await register(req, res)
//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

router.post("/register", register);
router.post("/login", login);
router.get("/admin", passport.authenticate("jwt", { session: false }), testAdmin);

  
export default router;
