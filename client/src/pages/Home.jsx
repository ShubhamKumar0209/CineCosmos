import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Star } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

import { Flame } from 'lucide-react';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [filter, setFilter] = useState('now_showing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/movies?status=${filter}`);
        setMovies(data.data.movies);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [filter]);

  return (
    <div className="main-content home-page">
      <div className="home-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {filter === 'now_showing' ? (
            <>
              Trending Now <Flame size={28} color="var(--primary)" />
            </>
          ) : (
            'Coming Soon'
          )}
        </h1>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'now_showing' ? 'active' : ''}`}
            onClick={() => setFilter('now_showing')}
          >
            Now Showing
          </button>
          <button
            className={`filter-tab ${filter === 'coming_soon' ? 'active' : ''}`}
            onClick={() => setFilter('coming_soon')}
          >
            Coming Soon
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading movies..." />
      ) : movies.length > 0 ? (
        <div className="movie-grid">
          {movies.map((movie) => (
            <Link to={`/movie/${movie._id}`} key={movie._id} className="movie-card">
              <div className="movie-card-poster">
                <img
                  src={movie.posterPath ? `${TMDB_IMG}/w500${movie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                  alt={movie.title}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster'; }}
                />
                {movie.voteAverage > 0 && (
                  <div className="movie-card-rating">
                    <Star size={12} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
                    {movie.voteAverage.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="movie-card-content">
                <div className="movie-card-title">{movie.title}</div>
                <p>
                  {movie.genres?.[0] || 'Movie'}
                  {movie.releaseDate && ` • ${new Date(movie.releaseDate).getFullYear()}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No movies found</h2>
          <p>Check back later or ask an admin to sync movies from TMDB.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
