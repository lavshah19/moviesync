import createHttpError from "http-errors";
import type { Types } from "mongoose";
import { SYSTEM_ROLES, otherRole, type SystemRole } from "../../../constant/role.js";
import { isDuplicateKeyError } from "../../../utils/mongo.js";
import { AuthRepository } from "../../auth/repository/auth.repository.js";
import type { IMovie } from "../models/movie.model.js";
import { MovieRepository } from "../repository/movie.repository.js";
import type { MovieColumns, MovieDTO } from "../types/index.js";
import type { MovieText } from "../validator/movie.validator.js";

type MovieDoc = IMovie & { _id: Types.ObjectId };

const ALREADY_IN_LIST = "Already in their list.";
const NOT_FOUND = "Movie not found.";
const NOT_RECOMMENDER = "Only the person who suggested this movie can change it.";
const ALREADY_WATCHED = "Already watched, can't edit.";
const NOT_OWNER = "You can only tick movies in your own column.";

// Rules (PROJECT.md): you add to the OTHER person's column; the column owner ticks;
// the recommender edits (until watched) and deletes.
export class MovieService {
  static async list(): Promise<MovieColumns> {
    const columns = Object.fromEntries(SYSTEM_ROLES.map((r) => [r, [] as MovieDTO[]])) as MovieColumns;
    for (const movie of await MovieRepository.findAll()) {
      columns[movie.forRole].push(MovieService.toDTO(movie));
    }
    return columns;
  }

  static async create(userId: string, text: MovieText): Promise<MovieDTO> {
    const role = await MovieService.getRole(userId);
    try {
      // the server picks the column: never trust the client with forRole
      const movie = await MovieRepository.create({ ...text, forRole: otherRole(role), addedBy: userId });
      return MovieService.toDTO(movie);
    } catch (err) {
      if (isDuplicateKeyError(err, "title")) throw new createHttpError.Conflict(ALREADY_IN_LIST);
      throw err;
    }
  }

  static async update(userId: string, movieId: string, text: MovieText): Promise<MovieDTO> {
    const movie = await MovieRepository.findById(movieId);
    if (!movie) throw new createHttpError.NotFound(NOT_FOUND);
    if (!movie.addedBy.equals(userId)) throw new createHttpError.Forbidden(NOT_RECOMMENDER);
    if (movie.watchedAt) throw new createHttpError.Conflict(ALREADY_WATCHED);

    // exact same text: nothing to do, and don't stamp it "edited". Case-only fixes still go through.
    if (movie.title === text.title && movie.year === text.year) return MovieService.toDTO(movie);

    let updated;
    try {
      updated = await MovieRepository.updateTextIfUnwatched(movieId, userId, text);
    } catch (err) {
      if (isDuplicateKeyError(err, "title")) throw new createHttpError.Conflict(ALREADY_IN_LIST);
      throw err;
    }
    // passed the checks above but the guarded write didn't match: ticked or deleted meanwhile
    if (!updated) {
      const current = await MovieRepository.findById(movieId);
      throw current
        ? new createHttpError.Conflict(ALREADY_WATCHED)
        : new createHttpError.NotFound(NOT_FOUND);
    }
    return MovieService.toDTO(updated);
  }

  // Idempotent: ticking an already-watched movie returns it unchanged (keeps the first watchedAt).
  static async setWatched(userId: string, movieId: string, watched: boolean): Promise<MovieDTO> {
    const role = await MovieService.getRole(userId);
    const updated = await MovieRepository.setWatchedIfChanged(movieId, role, watched);
    if (updated) return MovieService.toDTO(updated);

    const movie = await MovieRepository.findById(movieId);
    if (!movie) throw new createHttpError.NotFound(NOT_FOUND);
    if (movie.forRole !== role) throw new createHttpError.Forbidden(NOT_OWNER);
    return MovieService.toDTO(movie); // already in the requested state
  }

  static async remove(userId: string, movieId: string): Promise<void> {
    if (await MovieRepository.deleteByRecommender(movieId, userId)) return;

    const movie = await MovieRepository.findById(movieId);
    if (!movie) throw new createHttpError.NotFound(NOT_FOUND);
    throw new createHttpError.Forbidden(NOT_RECOMMENDER);
  }

  // The access token only carries the user id; the role decides the column, so read it fresh.
  private static async getRole(userId: string): Promise<SystemRole> {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new createHttpError.Unauthorized("User not found.");
    return user.role;
  }

  static toDTO(movie: MovieDoc): MovieDTO {
    return {
      id: movie._id.toString(),
      title: movie.title,
      year: movie.year,
      forRole: movie.forRole,
      addedBy: movie.addedBy.toString(),
      watchedAt: movie.watchedAt,
      editedAt: movie.editedAt,
      createdAt: movie.createdAt,
    };
  }
}
