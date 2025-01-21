import express from "express";
import authRoutes from "./admin/router.js";
import passport from "passport";

const app = express();
app.use(express.json());

app.use(passport.initialize());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
