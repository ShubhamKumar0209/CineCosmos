import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Ticket, Film, MapPin, Calendar, Clock } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

const statusColors = {
  confirmed: 'var(--status-success)',
  pending: 'var(--status-warning)',
  failed: 'var(--status-error)',
  cancelled: 'var(--text-secondary)',
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await apiClient.get('/bookings/my-bookings');
        setBookings(data.data.bookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? A refund will be initiated.')) return;
    
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`);
      alert('Booking cancelled successfully and refund initiated.');
      setBookings(bookings.map(b => 
        b._id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading bookings…" />;

  return (
    <div className="main-content">
      <h1>My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <Ticket size={64} />
          <h2>No bookings yet</h2>
          <p>Browse movies and book your first show!</p>
          <Link to="/" className="btn btn-primary">Browse Movies</Link>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((b) => (
            <div key={b._id} className="booking-card">
              <div className="booking-card-poster">
                {b.showtime?.movie?.posterPath ? (
                  <img
                    src={`${TMDB_IMG}/w154${b.showtime.movie.posterPath}`}
                    alt={b.showtime.movie.title}
                  />
                ) : (
                  <div className="poster-placeholder"><Film size={32} /></div>
                )}
              </div>
              <div className="booking-card-info">
                <div className="booking-card-header">
                  <h3>{b.showtime?.movie?.title || 'Unknown Movie'}</h3>
                  <span
                    className="booking-status"
                    style={{ background: statusColors[b.status] || statusColors.pending }}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="booking-card-details">
                  {b.showtime?.theater && (
                    <span><MapPin size={14} /> {b.showtime.theater.name}</span>
                  )}
                  {b.showtime?.screen && (
                    <span>Screen: {b.showtime.screen.name}</span>
                  )}
                  {b.showtime?.startTime && (
                    <span>
                      <Calendar size={14} />{' '}
                      {new Date(b.showtime.startTime).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {'  '}
                      <Clock size={14} />{' '}
                      {new Date(b.showtime.startTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  <span>
                    <Ticket size={14} /> Seats: {b.seats.map((s) => s.label).join(', ')}
                  </span>
                </div>
                <div className="booking-card-footer">
                  <div className="booking-footer-left">
                    <span className="booking-ref">Ref: {b.bookingRef}</span>
                    <span className="booking-amount">₹{(b.totalAmount / 100).toFixed(0)}</span>
                  </div>
                  {b.status === 'confirmed' && (Date.now() - new Date(b.createdAt).getTime() <= 5 * 60 * 1000) && (
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => handleCancelBooking(b._id)}
                      style={{ borderColor: 'var(--status-error)', color: 'var(--status-error)' }}
                    >
                      Cancel & Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
