import { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Clock, MapPin, Film } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

/**
 * Convert 1-based row number to a letter label: 1→A, 2→B, …, 26→Z
 */
const getRowLabel = (row) => String.fromCharCode(64 + row);

const SeatSelection = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showtime, setShowtime] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  /* ── Fetch showtime details + seat availability ──────────── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stRes, seatsRes] = await Promise.all([
          apiClient.get(`/showtimes/${showtimeId}`),
          apiClient.get(`/showtimes/${showtimeId}/seats`),
        ]);
        setShowtime(stRes.data.data.showtime);
        setSeatData(seatsRes.data.data);
      } catch (error) {
        showToast('Failed to load showtime data', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId]);

  /* ── Seat-status helpers ─────────────────────────────────── */
  const isSeatBooked = useCallback(
    (r, c) => seatData?.bookedSeats?.some((s) => s.row === r && s.col === c),
    [seatData],
  );
  const isSeatLocked = useCallback(
    (r, c) => seatData?.lockedSeats?.some((s) => s.row === r && s.col === c),
    [seatData],
  );
  const isSeatUnavailable = useCallback(
    (r, c) => seatData?.seatLayout?.unavailableSeats?.some((s) => s.row === r && s.col === c),
    [seatData],
  );
  const isSeatSelected = useCallback(
    (r, c) => selectedSeats.some((s) => s.row === r && s.col === c),
    [selectedSeats],
  );

  /* ── Toggle a seat ──────────────────────────────────────── */
  const toggleSeat = (row, col) => {
    if (isSeatBooked(row, col) || isSeatLocked(row, col) || isSeatUnavailable(row, col)) return;

    if (isSeatSelected(row, col)) {
      setSelectedSeats((prev) => prev.filter((s) => !(s.row === row && s.col === col)));
    } else {
      if (selectedSeats.length >= 10) {
        showToast('Maximum 10 seats per booking', 'error');
        return;
      }
      const label = `${getRowLabel(row)}${col}`;
      setSelectedSeats((prev) => [...prev, { row, col, label }]);
    }
  };

  /* ── Razorpay Standard Checkout Flow ─────────────────────── */
  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat', 'error');
      return;
    }

    setBooking(true);
    try {
      /* STEP 1 — Backend: create Razorpay order + pending booking */
      const { data } = await apiClient.post('/bookings/initialize', {
        showtimeId,
        seats: selectedSeats,
      });

      const { booking: bookingDoc, order } = data.data;

      /* STEP 2 — Frontend: Open Razorpay checkout modal */
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!window.Razorpay || !razorpayKeyId) {
        showToast('Payment gateway is not available. Please try again later.', 'error');
        setBooking(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,          // in paise
        currency: order.currency,      // INR
        name: 'CineCosmos',
        description: `${showtime.movie.title} — ${selectedSeats.map((s) => s.label).join(', ')}`,
        order_id: order.id,            // Razorpay order_id from backend

        /* STEP 3 — On payment success → verify signature on backend */
        handler: async (response) => {
          try {
            await apiClient.post(`/bookings/${bookingDoc._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast('Payment successful! Booking confirmed.', 'success');
            navigate(`/booking-confirmation/${bookingDoc._id}`);
          } catch (verifyErr) {
            showToast(
              verifyErr.response?.data?.message || 'Payment verification failed.',
              'error',
            );
          }
        },

        /* Handle user dismissing the modal */
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled. Your seat lock will expire in 5 minutes.', 'info');
            setBooking(false);
          },
        },

        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },

        theme: { color: '#d4af37' },
      };

      const rzp = new window.Razorpay(options);

      /* Handle payment failure event */
      rzp.on('payment.failed', (resp) => {
        showToast(
          resp.error?.description || 'Payment failed. Please try again.',
          'error',
        );
        setBooking(false);
      });

      rzp.open();
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to initialize booking.',
        'error',
      );
    } finally {
      setBooking(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────── */
  if (loading) return <LoadingSpinner size="lg" text="Loading seats…" />;
  if (!showtime || !seatData) {
    return (
      <div className="main-content">
        <h1>Showtime not found</h1>
      </div>
    );
  }

  const { seatLayout } = seatData;
  const pricePerSeat = showtime.price / 100; // paise → rupees
  const totalAmount = selectedSeats.length * pricePerSeat;

  return (
    <div className="seat-selection-page">
      {/* ── Info Bar ──────────────────────────────────────── */}
      <div className="showtime-info-bar">
        <div className="showtime-info-movie">
          <Film size={20} />
          <strong>{showtime.movie.title}</strong>
        </div>
        <div className="showtime-info-details">
          <span>
            <MapPin size={16} /> {showtime.theater.name}
          </span>
          <span>
            <Clock size={16} />{' '}
            {new Date(showtime.startTime).toLocaleString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>Screen: {showtime.screen.name}</span>
        </div>
      </div>

      <div className="seat-layout-container">
        {/* ── Seat Map ──────────────────────────────────── */}
        <div className="seat-map-wrapper">
          <div className="screen-indicator">
            <div className="screen-curve"></div>
            <span>SCREEN</span>
          </div>

          <div className="seat-grid">
            {Array.from({ length: seatLayout.rows }, (_, ri) => {
              const row = ri + 1;
              const aisleBelow = seatLayout.aisleAfterRows?.includes(row);
              return (
                <div key={row}>
                  <div className="seat-row">
                    <span className="row-label">{getRowLabel(row)}</span>
                    {Array.from({ length: seatLayout.columns }, (_, ci) => {
                      const col = ci + 1;
                      const colAisle = seatLayout.aisleAfterColumns?.includes(col);

                      const booked = isSeatBooked(row, col);
                      const locked = isSeatLocked(row, col);
                      const unavail = isSeatUnavailable(row, col);
                      const selected = isSeatSelected(row, col);

                      let cls = 'seat';
                      if (unavail) cls += ' seat-unavailable';
                      else if (booked) cls += ' seat-booked';
                      else if (locked) cls += ' seat-locked';
                      else if (selected) cls += ' seat-selected';
                      else cls += ' seat-available';

                      return (
                        <Fragment key={col}>
                          <button
                            className={cls}
                            onClick={() => toggleSeat(row, col)}
                            disabled={booked || locked || unavail}
                            title={`${getRowLabel(row)}${col}`}
                          >
                            {col}
                          </button>
                          {colAisle && <span className="aisle-gap-col" />}
                        </Fragment>
                      );
                    })}
                    <span className="row-label">{getRowLabel(row)}</span>
                  </div>
                  {aisleBelow && <div className="aisle-gap-row" />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="seat-legend">
            <div className="legend-item">
              <span className="seat seat-available legend-seat" /> Available
            </div>
            <div className="legend-item">
              <span className="seat seat-selected legend-seat" /> Selected
            </div>
            <div className="legend-item">
              <span className="seat seat-booked legend-seat" /> Booked
            </div>
            <div className="legend-item">
              <span className="seat seat-locked legend-seat" /> Locked
            </div>
          </div>
        </div>

        {/* ── Booking Summary Sidebar ──────────────────── */}
        <div className="booking-summary">
          <h3>Booking Summary</h3>

          <div className="summary-movie">
            {showtime.movie.posterPath && (
              <img
                src={`${TMDB_IMG}/w154${showtime.movie.posterPath}`}
                alt={showtime.movie.title}
              />
            )}
            <div>
              <strong>{showtime.movie.title}</strong>
              <p>
                {new Date(showtime.startTime).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p>
                {new Date(showtime.startTime).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {selectedSeats.length > 0 ? (
            <>
              <div className="summary-seats">
                <span>Seats:</span>
                <span className="selected-seats-list">
                  {selectedSeats.map((s) => s.label).join(', ')}
                </span>
              </div>
              <div className="summary-row">
                <span>{selectedSeats.length} × ₹{pricePerSeat}</span>
                <span>₹{totalAmount}</span>
              </div>
              <hr />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleBooking}
                disabled={booking}
              >
                {booking ? 'Processing…' : `Pay ₹${totalAmount}`}
              </button>
            </>
          ) : (
            <p className="no-seats-msg">Select seats to see the summary</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
