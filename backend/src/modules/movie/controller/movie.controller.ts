import type { Request, Response } from "express";
import { StatusCodes } from "../../../constant/statusCode.js";
import { MovieService } from "../services/movie.service.js";
import type {
  CreateMovieInput,
  SetWatchedInput,
  UpdateMovieInput,
} from "../validator/movie.validator.js";

// plain object of arrow functions: safe to pass to the router unbound
export const MovieController = {
  list: async (_req: Request, res: Response) => {
    const columns = await MovieService.list();

    res.status(StatusCodes.OK).json({
      success: true,
      data: { columns },
    });
  },

  create: async (req: Request, res: Response) => {
    const { movie: text } = req.body as CreateMovieInput;
    const movie = await MovieService.create(req.user.id, text);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Movie suggested",
      data: { movie },
    });
  },

  update: async (req: Request, res: Response) => {
    const { movie: text } = req.body as UpdateMovieInput;
    const movie = await MovieService.update(req.user.id, req.params.id as string, text);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Movie updated",
      data: { movie },
    });
  },

  setWatched: async (req: Request, res: Response) => {
    const { watched } = req.body as SetWatchedInput;
    const movie = await MovieService.setWatched(req.user.id, req.params.id as string, watched);

    res.status(StatusCodes.OK).json({
      success: true,
      message: watched ? "Marked as watched" : "Marked as not watched",
      data: { movie },
    });
  },

  remove: async (req: Request, res: Response) => {
    await MovieService.remove(req.user.id, req.params.id as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Movie removed",
    });
  },
};
