import { Router, type IRouter } from "express";
import healthRouter from "./health";
import growthosRouter from "./growthos";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/growthos", growthosRouter);

export default router;
