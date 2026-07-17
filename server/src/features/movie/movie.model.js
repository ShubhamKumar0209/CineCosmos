import mongoose from 'mongoose';
import { MOVIE_STATUS } from '../../utils/constants.js';

const castSchema = new mongoose.Schema(
  {
    name: String,
    character: String,
    profilePath: String,
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    overview: {
      type: String,
      trim: true,
    },
    posterPath: String,
    backdropPath: String,
    releaseDate: Date,
    genres: [String],
    runtime: Number, // in minutes
    voteAverage: Number,
    cast: [castSchema],
    status: {
      type: String,
      enum: Object.values(MOVIE_STATUS),
      required: true,
      index: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
