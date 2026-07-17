import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import apiClient from '../../api/client.js';
import '../../styles/GlobalSearch.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

const GlobalSearch = ({ closeMenu }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const res = await apiClient.get(`/movies?search=${query}`);
        setResults(res.data.data.movies.slice(0, 5)); // Show top 5
      } catch (err) {
        console.error('Search failed:', err);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (movieId) => {
    setIsFocused(false);
    setQuery('');
    if (closeMenu) closeMenu();
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="global-search-container" ref={dropdownRef}>
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
      </div>

      {isFocused && query.length >= 2 && (
        <div className="search-dropdown">
          {results.length > 0 ? (
            results.map((movie) => (
              <div
                key={movie._id}
                className="search-item"
                onClick={() => handleSelect(movie._id)}
              >
                <img
                  src={
                    movie.posterPath
                      ? `${TMDB_IMG}/w92${movie.posterPath}`
                      : 'https://via.placeholder.com/45x68?text=No+Img'
                  }
                  alt={movie.title}
                  className="search-item-poster"
                />
                <div className="search-item-info">
                  <strong>{movie.title}</strong>
                  <small>
                    {movie.genres?.slice(0, 2).join(', ')} •{' '}
                    {new Date(movie.releaseDate).getFullYear()}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="search-empty">No movies found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
