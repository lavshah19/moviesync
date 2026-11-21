import { Router } from "express";
import {
  createMovieODT,
  movieIdParamsODT,
  setWatchedODT,
  updateMovieODT,
} from "../validator/movie.validator.js";
import { validateBody, validateParams } from "../../../middleware/validate.js";
import { catchAsync } from "../../../utils/catchAsync.utils.js";
import authMiddleware from "../../../middleware/auth/authenticate.middleware.js";
import { MovieController } from "../controller/movie.controller.js";

const router = Router();

router.use(authMiddleware()); // every movie route needs a logged-in user

router.get("/", catchAsync(MovieController.list));
router.post("/", validateBody(createMovieODT), catchAsync(MovieController.create));
router.patch(
  "/:id",
  validateParams(movieIdParamsODT),
  validateBody(updateMovieODT),
  catchAsync(MovieController.update),
);
router.patch(
  "/:id/watched",
  validateParams(movieIdParamsODT),
  validateBody(setWatchedODT),
  catchAsync(MovieController.setWatched),
);
router.delete("/:id", validateParams(movieIdParamsODT), catchAsync(MovieController.remove));

export default router;
