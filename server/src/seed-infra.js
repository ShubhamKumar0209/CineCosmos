import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import City from './features/city/city.model.js';
import Theater from './features/theater/theater.model.js';
import Screen from './features/theater/screen.model.js';
import Movie from './features/movie/movie.model.js';
import Showtime from './features/showtime/showtime.model.js';
import { syncMoviesFromTMDB } from './features/movie/movie.service.js';

const seedInfra = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Sync TMDB Movies (Clear existing first to remove dummy data)
    await Movie.deleteMany({});
    let movies = await Movie.find({});
    if (movies.length === 0) {
      console.log('🎬 No movies found. Attempting to sync from TMDB...');
      try {
        await syncMoviesFromTMDB();
      } catch (err) {
        console.log('⚠️ TMDB Sync failed (possibly blocked by ISP or network error). Falling back to dummy movies...');
        
        // --- ISP BLOCKED WORKAROUND: Hardcoded Real TMDB Movies ---
        const dummyMovies = [
          {
            tmdbId: 1339713,
            title: "Obsession",
            overview: "After breaking the mysterious 'One Wish Willow' to win his crush's heart, a hopeless romantic finds himself getting exactly what he asked for but soon discovers that some desires come at a dark, sinister price.",
            releaseDate: new Date("2026-05-13"),
            status: "now_showing",
            genres: ["Horror", "Thriller"],
            runtime: 110,
            voteAverage: 8.2,
            posterPath: "/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg",
            backdropPath: "/r013C8Me2bZ0pUi0OWJRh0h7MzT.jpg",
            cast: [{ name: "Famous Actor", character: "Hero" }]
          },
          {
            tmdbId: 1084244,
            title: "Toy Story 5",
            overview: "When Bonnie receives a Lilypad tablet as a gift and becomes obsessed, Buzz, Woody, Jessie and the rest of the gang's jobs become exponentially harder when they have to go head to head with the all-new threat to playtime.",
            releaseDate: new Date("2026-06-17"),
            status: "now_showing",
            genres: ["Animation", "Family", "Comedy", "Adventure"],
            runtime: 100,
            voteAverage: 7.4,
            posterPath: "/sfQtVlIHljToOwYjhe21KPGzZWK.jpg",
            backdropPath: "/qjTqY5coNiz6sVtPng40IzltsoN.jpg",
            cast: [{ name: "Tom Hanks", character: "Woody" }]
          },
          {
            tmdbId: 1108427,
            title: "Moana 2",
            overview: "Teenage Moana answers the Ocean's call and, for the first time, voyages beyond the reef of her island of Motunui with infamous demigod Maui on an unforgettable journey.",
            releaseDate: new Date("2026-07-08"),
            status: "now_showing",
            genres: ["Family", "Adventure", "Animation"],
            runtime: 105,
            voteAverage: 5.7,
            posterPath: "/zKVgiv5qHCvCLT4A2ymJi5QeXDH.jpg",
            backdropPath: "/mMkJq4dkQwfDieB9wRC9yPxDWv9.jpg",
            cast: [{ name: "Auli'i Cravalho", character: "Moana" }]
          },
          {
            tmdbId: 1275779,
            title: "Disclosure Day",
            overview: "A cybersecurity expert becomes a whistleblower after uncovering secrets about aliens, putting him on the run from a corporation.",
            releaseDate: new Date("2026-06-10"),
            status: "now_showing",
            genres: ["Science Fiction", "Thriller"],
            runtime: 125,
            voteAverage: 6.7,
            posterPath: "/AnJ8IQJI23hNpYXVNaythu061Ru.jpg",
            backdropPath: "/gVczdWWAkBCuwEV1v9cg7ELfdhT.jpg",
            cast: []
          },
          {
            tmdbId: 936075,
            title: "Michael",
            overview: "The story of Michael Jackson, one of the most influential artists the world has ever known, and his life beyond the music.",
            releaseDate: new Date("2026-04-22"),
            status: "now_showing",
            genres: ["Music", "Drama"],
            runtime: 140,
            voteAverage: 8.7,
            posterPath: "/zm0KAbOjlt9eR5y7vDiL2dEOwMl.jpg",
            backdropPath: "/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg",
            cast: [{ name: "Jaafar Jackson", character: "Michael Jackson" }]
          }
        ];
        
        await Movie.insertMany(dummyMovies);
        console.log('✅ Created 50 dummy movies as a fallback.');
      }
      movies = await Movie.find({});
    } else {
      console.log(`✅ Found ${movies.length} movies in DB`);
    }

    if (movies.length === 0) {
      console.log('❌ No movies available. Cannot proceed.');
      process.exit(1);
    }

    // 2. Additional Cities
    const newCities = [
      { name: 'Mumbai', state: 'Maharashtra' },
      { name: 'Delhi', state: 'Delhi' },
      { name: 'Bengaluru', state: 'Karnataka' },
      { name: 'Hyderabad', state: 'Telangana' },
      { name: 'Chennai', state: 'Tamil Nadu' },
      { name: 'Pune', state: 'Maharashtra' },
      { name: 'Kolkata', state: 'West Bengal' },
      { name: 'Ahmedabad', state: 'Gujarat' },
      { name: 'Chandigarh', state: 'Chandigarh' }
    ];

    console.log('🏙️ Creating Cities...');
    for (const city of newCities) {
      const exists = await City.findOne({ name: city.name });
      if (!exists) {
        await City.create(city);
      }
    }
    const allCities = await City.find({});

    // 3. Theaters & Screens
    console.log('🍿 Creating Theaters and Screens...');
    const createdTheaters = [];
    
    const realTheatersMap = {
      'Mumbai': [
        { brand: 'PVR', name: 'PVR Icon', address: 'Phoenix Palladium, Lower Parel' },
        { brand: 'INOX', name: 'INOX Megaplex', address: 'Inorbit Mall, Malad West' },
        { brand: 'Cinepolis', name: 'Cinepolis VIP', address: 'Andheri West' },
        { brand: 'PVR', name: 'PVR Premiere', address: 'Juhu' }
      ],
      'Delhi': [
        { brand: 'PVR', name: 'PVR Director\'s Cut', address: 'Ambience Mall, Vasant Kunj' },
        { brand: 'INOX', name: 'INOX Laserplex', address: 'Nehru Place' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'DLF Avenue, Saket' },
        { brand: 'PVR', name: 'PVR IMAX', address: 'Select Citywalk, Saket' }
      ],
      'Bengaluru': [
        { brand: 'PVR', name: 'PVR Superplex', address: 'Orion Mall, Rajajinagar' },
        { brand: 'INOX', name: 'INOX Insignia', address: 'Forum Mall, Koramangala' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'Nexus Shantiniketan, Whitefield' },
        { brand: 'PVR', name: 'PVR PXL', address: 'Phoenix Marketcity, Whitefield' }
      ],
      'Hyderabad': [
        { brand: 'INOX', name: 'INOX', address: 'GVK One Mall, Banjara Hills' },
        { brand: 'PVR', name: 'PVR', address: 'Inorbit Mall, Madhapur' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'Mantra Mall, Attapur' },
        { brand: 'AMB', name: 'AMB Cinemas', address: 'Sarath City Capital Mall, Kondapur' }
      ],
      'Chennai': [
        { brand: 'PVR', name: 'PVR', address: 'VR Mall, Anna Nagar' },
        { brand: 'INOX', name: 'INOX', address: 'Express Avenue, Royapettah' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'BSR Mall, OMR' }
      ],
      'Pune': [
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'Westend Mall, Aundh' },
        { brand: 'PVR', name: 'PVR', address: 'Phoenix Marketcity, Viman Nagar' },
        { brand: 'INOX', name: 'INOX', address: 'Amanora Mall, Hadapsar' }
      ],
      'Kolkata': [
        { brand: 'PVR', name: 'PVR', address: 'South City Mall, Jadavpur' },
        { brand: 'INOX', name: 'INOX', address: 'Quest Mall, Ballygunge' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'Acropolis Mall, Kasba' }
      ],
      'Ahmedabad': [
        { brand: 'PVR', name: 'PVR', address: 'Acropolis Mall, Thaltej' },
        { brand: 'INOX', name: 'INOX', address: 'Alpha One, Vastrapur' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'Ahmedabad One Mall' }
      ],
      'Chandigarh': [
        { brand: 'PVR', name: 'PVR', address: 'Elante Mall, Industrial Area' },
        { brand: 'Cinepolis', name: 'Cinepolis', address: 'TDI Mall, Sector 17' }
      ]
    };

    for (const city of allCities) {
      const cityTheaters = realTheatersMap[city.name] || [];

      for (const tData of cityTheaters) {
        let theater = await Theater.findOne({ name: tData.name, city: city._id });
        if (!theater) {
          theater = await Theater.create({
            name: tData.name,
            city: city._id,
            address: tData.address
          });
        }

        // Create screens for this theater if it doesn't have any
        const existingScreens = await Screen.find({ theater: theater._id });
        const screens = [...existingScreens];

        if (existingScreens.length === 0) {
          const numScreens = Math.floor(Math.random() * 3) + 3; // 3 to 5 screens
          for (let s = 1; s <= numScreens; s++) {
            const screen = await Screen.create({
              name: `Screen ${s}`,
              theater: theater._id,
              totalSeats: 150,
              seatLayout: {
                rows: 10,
                columns: 15,
                aisleAfterRows: [5],
                aisleAfterColumns: [5, 10],
                unavailableSeats: []
              }
            });
            screens.push(screen);
          }
          // Update theater with screen references
          theater.screens = screens.map(sc => sc._id);
          await theater.save();
        }

        createdTheaters.push({ theater, screens });
      }
    }

    // 4. Realistic Showtimes
    console.log('🕒 Creating Showtimes for the next 7 days...');
    await Showtime.deleteMany({}); // Clear old showtimes to avoid clutter

    const nowShowingMovies = movies.filter(m => m.status === 'now_showing');
    if (nowShowingMovies.length === 0) {
      console.log('⚠️ No movies with status "now_showing" found. Using all movies.');
      nowShowingMovies.push(...movies);
    }

    // Group theaters by city to ensure every movie is shown in every city
    const theatersByCity = {};
    for (const { theater, screens } of createdTheaters) {
      if (!theatersByCity[theater.city]) {
        theatersByCity[theater.city] = [];
      }
      theatersByCity[theater.city].push({ theater, screens });
    }

    let showtimesCreated = 0;
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0); // Start of today

    // For each city, distribute all movies across its screens
    for (const cityId of Object.keys(theatersByCity)) {
      const cityTheaters = theatersByCity[cityId];
      const allScreensInCity = [];
      for (const { theater, screens } of cityTheaters) {
        for (const screen of screens) {
          allScreensInCity.push({ theater, screen, assignedMovies: [] });
        }
      }

      // Round-robin assign all nowShowingMovies to the screens in this city
      let screenIndex = 0;
      for (const movie of nowShowingMovies) {
        allScreensInCity[screenIndex % allScreensInCity.length].assignedMovies.push(movie);
        screenIndex++;
      }

      // Schedule the assigned movies for each screen
      for (const { theater, screen, assignedMovies } of allScreensInCity) {
        // If a screen got no movies (unlikely if movies > screens), assign a random one
        const screenMovies = assignedMovies.length > 0 ? assignedMovies : [nowShowingMovies[0]];

        // Schedule for the next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const currentDate = new Date(baseDate);
          currentDate.setDate(currentDate.getDate() + dayOffset);

          // Showtimes: Start at 8:00 AM and end by 12:00 AM
          let currentSlotTime = new Date(currentDate);
          currentSlotTime.setHours(8, 0, 0, 0);

          const cutoffTime = new Date(currentDate);
          cutoffTime.setDate(cutoffTime.getDate() + 1); // Next day
          cutoffTime.setHours(0, 0, 0, 0); // 12:00 AM Midnight strict cutoff

          let i = 0;
          while (true) {
            const movie = screenMovies[i % screenMovies.length];
            const runtimeMins = movie.runtime || 150;
            const endDate = new Date(currentSlotTime.getTime() + runtimeMins * 60000);

            // If the movie ends after 12:00 AM, we stop scheduling for today
            if (endDate > cutoffTime) {
              break;
            }

            // Only create the showtime if it's in the future
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
              showtimesCreated++;
            }

            // Next slot starts 30 mins after this movie ends (cleaning and prep)
            currentSlotTime = new Date(endDate.getTime() + 30 * 60000);
            
            // Round up to nearest 5 minutes
            const remainder = currentSlotTime.getMinutes() % 5;
            if (remainder !== 0) {
              currentSlotTime.setMinutes(currentSlotTime.getMinutes() + (5 - remainder));
            }
            currentSlotTime.setSeconds(0);
            currentSlotTime.setMilliseconds(0);
            
            i++;
          }
        }
      }
    }

    console.log(`✅ Successfully created ${showtimesCreated} realistic showtimes!`);
    console.log('🎉 Seeding completely finished.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Infrastructure seeding failed:', error);
    process.exit(1);
  }
};

seedInfra();
