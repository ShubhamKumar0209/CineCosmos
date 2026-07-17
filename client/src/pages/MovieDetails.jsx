import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Star, Clock, Calendar, MapPin } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, showtimesRes, citiesRes] = await Promise.all([
          apiClient.get(`/movies/${id}`),
          apiClient.get(`/showtimes?movie=${id}`),
          apiClient.get('/cities'),
        ]);
        setMovie(movieRes.data.data.movie);
        setShowtimes(showtimesRes.data.data.showtimes);
        
        const citiesList = citiesRes.data.data.cities || [];
        setCities(citiesList);
        if (citiesList.length > 0) {
          setSelectedCity(citiesList[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Generate next 7 days for the date selector
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (loading) return <LoadingSpinner size="lg" text="Loading movie details…" />;
  if (!movie) {
    return (
      <div className="main-content">
        <h1>Movie not found</h1>
        <p>The movie you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  // Filter and group showtimes
  const filteredShowtimes = showtimes.filter((st) => {
    // Check city match
    if (selectedCity && st.city && st.city !== selectedCity && st.city._id !== selectedCity) {
      return false;
    }
    
    // Check date match
    if (selectedDate) {
      const stDate = new Date(st.startTime);
      stDate.setHours(0, 0, 0, 0);
      const selDate = new Date(selectedDate);
      if (stDate.getTime() !== selDate.getTime()) {
        return false;
      }
    }
    
    return true;
  });

  const byTheater = filteredShowtimes.reduce((acc, st) => {
    const tid = st.theater._id;
    if (!acc[tid]) acc[tid] = { theater: st.theater, times: [] };
    acc[tid].times.push(st);
    return acc;
  }, {});

  return (
    <div className="movie-details-page">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div
        className="movie-hero"
        style={{
          backgroundImage: movie.backdropPath
            ? `url(${TMDB_IMG}/w1280${movie.backdropPath})`
            : 'none',
        }}
      >
        <div className="movie-hero-overlay">
          <div className="movie-hero-content">
            <img
              className="movie-hero-poster"
              src={
                movie.posterPath
                  ? `${TMDB_IMG}/w500${movie.posterPath}`
                  : 'https://via.placeholder.com/300x450?text=No+Poster'
              }
              alt={movie.title}
            />
            <div className="movie-hero-info">
              <h1>{movie.title}</h1>
              <div className="movie-meta">
                {movie.voteAverage > 0 && (
                  <span className="movie-rating">
                    <Star size={18} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
                    {movie.voteAverage.toFixed(1)}/10
                  </span>
                )}
                {movie.runtime > 0 && (
                  <span>
                    <Clock size={16} />
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
                {movie.releaseDate && (
                  <span>
                    <Calendar size={16} />
                    {new Date(movie.releaseDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {movie.genres?.length > 0 && (
                <div className="movie-genres">
                  {movie.genres.map((g) => (
                    <span key={g} className="genre-chip">{g}</span>
                  ))}
                </div>
              )}

              <p className="movie-overview">{movie.overview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Filters ───────────────────────────────── */}
      <section className="movie-section filters-section">
        <div className="filters-container">
          <div className="filter-group city-filter">
            <label htmlFor="city-select">Select City</label>
            <div className="custom-select-wrapper">
              <MapPin size={18} className="select-icon" />
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="city-select"
              >
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group date-filter">
            <label>Select Date</label>
            <div className="date-carousel">
              {next7Days.map((date, i) => {
                const dateStr = date.toISOString();
                const isSelected = selectedDate === dateStr;
                const isToday = i === 0;
                const isTomorrow = i === 1;
                
                let dayLabel = date.toLocaleDateString('en-IN', { weekday: 'short' });
                if (isToday) dayLabel = 'Today';
                else if (isTomorrow) dayLabel = 'Tomorrow';

                return (
                  <button
                    key={dateStr}
                    className={`date-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className="date-day">{dayLabel}</span>
                    <span className="date-num">{date.getDate()}</span>
                    <span className="date-month">
                      {date.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cast ──────────────────────────────────────────── */}
      {movie.cast?.length > 0 && (
        <section className="movie-section">
          <h2>Cast</h2>
          <div className="cast-grid">
            {movie.cast.map((actor, i) => (
              <div key={i} className="cast-card">
                <img
                  src={
                    actor.profilePath
                      ? `${TMDB_IMG}/w185${actor.profilePath}`
                      : 'https://via.placeholder.com/185x278?text=No+Photo'
                  }
                  alt={actor.name}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/185x278?text=No+Photo'; }}
                />
                <div className="cast-info">
                  <strong>{actor.name}</strong>
                  <small>{actor.character}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Showtimes ─────────────────────────────────────── */}
      <section className="movie-section">
        <h2>Showtimes</h2>
        {Object.keys(byTheater).length > 0 ? (
          <div className="showtimes-list">
            {Object.values(byTheater).map(({ theater, times }) => (
              <div key={theater._id} className="theater-showtimes">
                <div className="theater-info">
                  <h3>{theater.name}</h3>
                  <p><MapPin size={14} /> {theater.address}</p>
                </div>
                <div className="showtime-chips">
                  {times.map((st) => (
                    <button
                      key={st._id}
                      className="showtime-chip"
                      onClick={() => navigate(`/book/${st._id}`)}
                    >
                      <span className="showtime-time">
                        {new Date(st.startTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="showtime-price">₹{(st.price / 100).toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No showtimes available for this movie yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MovieDetails;
