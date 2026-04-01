import { Router, type IRouter } from "express";
import businessProfileRouter from "./business-profile";
import weeklyCalendarRouter from "./weekly-calendar";
import generateCaptionsRouter from "./generate-captions";
import festivalTrendsRouter from "./festival-trends";
import adRecommendationsRouter from "./ad-recommendations";
import performanceMetricsRouter from "./performance-metrics";
import generatePostImageRouter from "./generate-post-image";
import trackPhotoDownloadRouter from "./track-photo-download";

const router: IRouter = Router();

router.use(businessProfileRouter);
router.use(weeklyCalendarRouter);
router.use(generateCaptionsRouter);
router.use(festivalTrendsRouter);
router.use(adRecommendationsRouter);
router.use(performanceMetricsRouter);
router.use(generatePostImageRouter);
router.use(trackPhotoDownloadRouter);

export default router;
