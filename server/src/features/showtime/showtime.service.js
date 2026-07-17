import Showtime from './showtime.model.js';
import Movie from '../movie/movie.model.js';
import Screen from '../theater/screen.model.js';
import Theater from '../theater/theater.model.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS, REDIS_PREFIXES } from '../../utils/constants.js';
import { getRedisClient } from '../../config/redis.js';

export const createShowtime = async (showtimeData) => {
  const { movie: movieId, screen: screenId, startTime, price } = showtimeData;

  const movie = await Movie.findById(movieId);
  if (!movie) throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);

  const screen = await Screen.findById(screenId).populate('theater');
  if (!screen) throw new AppError('Screen not found', HTTP_STATUS.NOT_FOUND);

  const theater = screen.theater;

  // Calculate end time (runtime in minutes + 30 mins buffer for cleaning)
  const durationMs = (movie.runtime + 30) * 60 * 1000;
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMs);

  // Overlap Validation
  const overlappingShowtimes = await Showtime.find({
    screen: screenId,
    $or: [
      { startTime: { $lt: end }, endTime: { $gt: start } }, // overlap condition
    ],
  });

  if (overlappingShowtimes.length > 0) {
    throw new AppError('Screen is already booked for this time slot (including 30 min buffer).', HTTP_STATUS.CONFLICT);
  }

  const showtime = await Showtime.create({
    movie: movieId,
    screen: screenId,
    theater: theater._id,
    city: theater.city,
    startTime: start,
    endTime: end,
    price,
  });

  return showtime;
};

export const getShowtimes = async (query = {}) => {
  return await Showtime.find(query)
    .populate('movie', 'title posterPath runtime')
    .populate('theater', 'name address')
    .populate('screen', 'name')
    .sort({ startTime: 1 });
};

export const getShowtimeDetails = async (id) => {
  const showtime = await Showtime.findById(id)
    .populate('movie', 'title posterPath runtime genres')
    .populate('theater', 'name address')
    .populate('screen', 'name seatLayout totalSeats');

  if (!showtime) throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);

  return showtime;
};

export const getSeatAvailability = async (showtimeId) => {
  const showtime = await Showtime.findById(showtimeId).populate('screen', 'seatLayout totalSeats');
  if (!showtime) throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);

  const bookedSeats = showtime.bookedSeats; // permanently booked
  const redis = getRedisClient();
  
  // Find locked seats in Redis
  const lockedKeys = await redis.keys(`${REDIS_PREFIXES.SEAT_LOCK}:${showtimeId}:*`);
  const lockedSeats = lockedKeys.map((key) => {
    const parts = key.split(':');
    return { row: parseInt(parts[2], 10), col: parseInt(parts[3], 10) };
  });

  return {
    seatLayout: showtime.screen.seatLayout,
    totalSeats: showtime.screen.totalSeats,
    bookedSeats,
    lockedSeats, // Temporarily locked (in checkout)
  };
};

/**
 * Automatically generates showtimes for any empty days in the next 7 days.
 * Ensures an 8 AM to 11 PM packed schedule and guarantees all movies are available in all cities.
 */
export const generateRollingShowtimes = async () => {
  logger.info('Starting rolling showtime generator...');
  
  const nowShowingMovies = await Movie.find({ status: 'now_showing' });
  if (nowShowingMovies.length === 0) {
    logger.warn('No now_showing movies available to schedule.');
    return;
  }

  const allTheaters = await Theater.find({});
  const allScreens = await Screen.find({});
  
  // Group theaters by city
  const theatersByCity = {};
  for (const theater of allTheaters) {
    if (!theatersByCity[theater.city]) {
      theatersByCity[theater.city] = [];
    }
    const screensForTheater = allScreens.filter(s => s.theater.toString() === theater._id.toString());
    theatersByCity[theater.city].push({ theater, screens: screensForTheater });
  }

  let totalGenerated = 0;
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Scan the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Check if we already have showtimes for this date anywhere in the system
    const existingShowtimesCount = await Showtime.countDocuments({
      startTime: { $gte: targetDate, $lt: nextDate }
    });

    if (existingShowtimesCount > 0) {
      logger.info(`Showtimes already exist for ${targetDate.toDateString()} (Count: ${existingShowtimesCount}). Skipping generation.`);
      continue;
    }

    logger.info(`Generating showtimes for empty date: ${targetDate.toDateString()}`);
    let dailyCount = 0;

    // Distribute movies round-robin per city
    for (const cityId of Object.keys(theatersByCity)) {
      const cityTheaters = theatersByCity[cityId];
      const allScreensInCity = [];
      
      for (const { theater, screens } of cityTheaters) {
        for (const screen of screens) {
          allScreensInCity.push({ theater, screen, assignedMovies: [] });
        }
      }

      // Round-robin assign movies
      let screenIndex = 0;
      for (const movie of nowShowingMovies) {
        if (allScreensInCity.length > 0) {
          allScreensInCity[screenIndex % allScreensInCity.length].assignedMovies.push(movie);
          screenIndex++;
        }
      }

      // Schedule the day for each screen
      for (const { theater, screen, assignedMovies } of allScreensInCity) {
        const screenMovies = assignedMovies.length > 0 ? assignedMovies : [nowShowingMovies[0]];
        
        let currentSlotTime = new Date(targetDate);
        currentSlotTime.setHours(8, 0, 0, 0); // 8:00 AM

        const cutoffTime = new Date(targetDate);
        cutoffTime.setHours(23, 0, 0, 0); // 11:00 PM

        let mIndex = 0;
        while (true) {
          const movie = screenMovies[mIndex % screenMovies.length];
          const runtimeMins = movie.runtime || 150;
          const endDate = new Date(currentSlotTime.getTime() + runtimeMins * 60000);

          if (endDate > cutoffTime) break;

          if (currentSlotTime >= new Date()) {
            const price = (Math.floor(Math.random() * 5) * 50 + 150) * 100;
            
            await Showtime.create({
              movie: movie._id,
              theater: theater._id,
              screen: screen._id,
              city: theater.city,
              startTime: new Date(currentSlotTime),
              endTime: endDate,
              price: price
            });
            dailyCount++;
          }

          // 30 min prep
          currentSlotTime = new Date(endDate.getTime() + 30 * 60000);
          mIndex++;
        }
      }
    }
    
    totalGenerated += dailyCount;
    logger.info(`Generated ${dailyCount} showtimes for ${targetDate.toDateString()}`);
  }

  logger.info(`Rolling showtime generation complete. Total new showtimes: ${totalGenerated}`);
};
