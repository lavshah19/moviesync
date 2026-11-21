import type { SystemRole } from "../../../constant/role.js";
import { Movie } from "../models/movie.model.js";
import type { MovieText } from "../validator/movie.validator.js";

// Writes put the permission/state rule in the filter, so the check and the write are one
// atomic operation: no window where a movie is ticked between "can I edit?" and the edit.
// A null / 0 result means "didn't match"; the service works out why.
export class MovieRepository {
  // ponytail: no pagination, two people's lists stay small; page by createdAt if that changes
  static async findAll() {
    return Movie.find().sort({ createdAt: -1 }).lean();
  }

  static async findById(id: string) {
    return Movie.findById(id).lean();
  }

  static async create(data: MovieText & { forRole: SystemRole; addedBy: string }) {
    return (await Movie.create(data)).toObject();
  }

  static async updateTextIfUnwatched(id: string, addedBy: string, { title, year }: MovieText) {
    return Movie.findOneAndUpdate(
      { _id: id, addedBy, watchedAt: null },
      { $set: { title, year, editedAt: new Date() } },
      { returnDocument: "after", runValidators: true },
    ).lean();
  }

  // Only matches when the state actually changes, so re-ticking keeps the original watchedAt.
  static async setWatchedIfChanged(id: string, forRole: SystemRole, watched: boolean) {
    return Movie.findOneAndUpdate(
      { _id: id, forRole, watchedAt: watched ? null : { $ne: null } },
      { $set: { watchedAt: watched ? new Date() : null } },
      { returnDocument: "after" },
    ).lean();
  }

  static async deleteByRecommender(id: string, addedBy: string) {
    const { deletedCount } = await Movie.deleteOne({ _id: id, addedBy });
    return deletedCount === 1;
  }
}
