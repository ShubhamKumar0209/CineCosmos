import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { CheckCircle, Clock, AlertCircle, Ticket, Film, MapPin, Calendar } from 'lucide-react';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await apiClient.get('/bookings/my-bookings');
        const found = data.data.bookings.find((b) => b._id === id);
        setBooking(found || null);
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" text="Loading booking…" />;
  if (!booking) {
    return (
      <div className="main-content">
        <h1>Booking not found</h1>
        <p>We couldn&apos;t find this booking. It may have expired.</p>
      </div>
    );
  }

  const statusMap = {
    confirmed: { icon: <CheckCircle size={48} />, color: 'var(--status-success)', label: 'Booking Confirmed!' },
    pending:   { icon: <Clock size={48} />,       color: 'var(--status-warning)', label: 'Payment Pending' },
    failed:    { icon: <AlertCircle size={48} />,  color: 'var(--status-error)',   label: 'Payment Failed' },
  };
  const status = statusMap[booking.status] || statusMap.pending;

  return (
    <div className="main-content confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-status" style={{ color: status.color }}>
          {status.icon}
          <h1>{status.label}</h1>
        </div>

        <div className="eticket">
          <div className="eticket-header">
            <Ticket size={20} />
            <span>E-TICKET</span>
            <span className="booking-ref">{booking.bookingRef}</span>
          </div>

          <div className="eticket-body">
            {booking.showtime?.movie && (
              <div className="eticket-row">
                <Film size={18} />
                <div>
                  <strong>{booking.showtime.movie.title}</strong>
                </div>
              </div>
            )}
            {booking.showtime?.theater && (
              <div className="eticket-row">
                <MapPin size={18} />
                <div>
                  <strong>{booking.showtime.theater.name}</strong>
                  <p>{booking.showtime.theater.address}</p>
                </div>
              </div>
            )}
            {booking.showtime?.startTime && (
              <div className="eticket-row">
                <Calendar size={18} />
                <div>
                  <strong>
                    {new Date(booking.showtime.startTime).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                  <p>
                    {new Date(booking.showtime.startTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}
            <div className="eticket-row">
              <span className="eticket-label">Seats</span>
              <span className="eticket-seats">{booking.seats.map((s) => s.label).join(', ')}</span>
            </div>
            <div className="eticket-row">
              <span className="eticket-label">Amount</span>
              <span className="eticket-amount">₹{(booking.totalAmount / 100).toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to="/my-bookings" className="btn btn-outline">View All Bookings</Link>
          <Link to="/" className="btn btn-primary">Browse Movies</Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
