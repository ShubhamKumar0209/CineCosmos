import Movie from './movie.model.js';
import * as tmdbService from './tmdb.service.js';
import { MOVIE_STATUS, TMDB_CACHE_TTL_HOURS } from '../../utils/constants.js';
import logger from '../../utils/logger.js';

/**
 * Fetch movies from DB.
 */
export const getAllMovies = async (query = {}) => {
  return await Movie.find(query).sort({ releaseDate: -1 });
};

export const getMovieById = async (id) => {
  return await Movie.findById(id);
};

/**
 * Sync movies from TMDB to MongoDB.
 * Categorizes based on endpoint (now_playing -> now_showing, upcoming -> coming_soon).
 */
export const syncMoviesFromTMDB = async () => {
  logger.info('Starting TMDB sync...');
  const results = {
    nowShowingAdded: 0,
    comingSoonAdded: 0,
    updated: 0,
  };

  const processMovies = async (endpoint, status) => {
    // Fetch top 2 pages for demo purposes
    for (let page = 1; page <= 2; page++) {
      const tmdbMovies = await tmdbService.fetchMoviesList(endpoint, page);
      
      for (const tmdbMovie of tmdbMovies) {
        const existingMovie = await Movie.findOne({ tmdbId: tmdbMovie.id });

        if (existingMovie) {
          // Check if TTL expired or just update lastSyncedAt
          const hoursSinceSync = Math.abs(new Date() - existingMovie.lastSyncedAt) / 36e5;
          if (hoursSinceSync > TMDB_CACHE_TTL_HOURS) {
            const details = await tmdbService.fetchMovieDetails(tmdbMovie.id);
            await Movie.updateOne({ tmdbId: tmdbMovie.id }, { ...details, status, lastSyncedAt: new Date() });
            results.updated++;
          }
        } else {
          // Fetch full details and insert
          const details = await tmdbService.fetchMovieDetails(tmdbMovie.id);
          await Movie.create({ ...details, status, lastSyncedAt: new Date() });
          
          if (status === MOVIE_STATUS.NOW_SHOWING) results.nowShowingAdded++;
          else results.comingSoonAdded++;
        }
      }
    }
  };

  await processMovies('now_playing', MOVIE_STATUS.NOW_SHOWING);
  await processMovies('upcoming', MOVIE_STATUS.COMING_SOON);

  logger.info(`TMDB sync complete. Results: ${JSON.stringify(results)}`);
  return results;
};
