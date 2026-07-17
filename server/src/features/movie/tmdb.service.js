import axios from 'axios';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

const tmdbClient = axios.create({
  baseURL: config.tmdb.baseUrl,
  params: {
    api_key: config.tmdb.apiKey,
  },
});

/**
 * Fetch movie details including cast.
 * 
 * @param {number} tmdbId 
 */
export const fetchMovieDetails = async (tmdbId) => {
  try {
    const { data } = await tmdbClient.get(`/movie/${tmdbId}`, {
      params: {
        append_to_response: 'credits',
      },
    });

    const cast = data.credits?.cast?.slice(0, 10).map((actor) => ({
      name: actor.name,
      character: actor.character,
      profilePath: actor.profile_path,
    })) || [];

    const genres = data.genres?.map((g) => g.name) || [];

    return {
      tmdbId: data.id,
      title: data.title,
      overview: data.overview,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      releaseDate: data.release_date ? new Date(data.release_date) : null,
      genres,
      runtime: data.runtime,
      voteAverage: data.vote_average,
      cast,
    };
  } catch (error) {
    logger.error(`TMDB API Error (fetchMovieDetails ${tmdbId}): ${error.message}`);
    throw new AppError('Failed to fetch data from TMDB', HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
};

/**
 * Fetch a list of movies based on a TMDB endpoint (e.g., 'now_playing', 'upcoming').
 * 
 * @param {string} endpoint 
 * @param {number} page 
 */
export const fetchMoviesList = async (endpoint, page = 1) => {
  try {
    const { data } = await tmdbClient.get(`/movie/${endpoint}`, {
      params: {
        page,
        region: 'IN', // Assuming Indian context based on BookMyShow/Razorpay
      },
    });

    return data.results;
  } catch (error) {
    logger.error(`TMDB API Error (fetchMoviesList ${endpoint}): ${error.message}`);
    throw new AppError('Failed to fetch data from TMDB', HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
};
