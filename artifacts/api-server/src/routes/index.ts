import { Router, type IRouter } from "express";
import healthRouter from "./health";
import parametersRouter from "./parameters";

const router: IRouter = Router();

router.use(healthRouter);
router.use(parametersRouter);

export default router;
