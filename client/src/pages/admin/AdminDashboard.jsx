import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { RefreshCw, Plus, Film, MapPin, Building2, Clock } from 'lucide-react';

/* ================================================================
   Admin Dashboard — Tab-based management panel
   Tabs: Movies | Cities | Theaters | Showtimes
   ================================================================ */

/* ── Movies Tab ──────────────────────────────────────────────── */
const MoviesTab = () => {
  const { showToast } = useToast();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  const fetchMovies = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/movies');
      setMovies(data.data.movies);
    } catch { /* swallow */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const { data } = await apiClient.post('/movies/sync');
      setSyncResults(data.data);
      showToast('TMDB sync completed!', 'success');
      fetchMovies();
    } catch (err) {
      showToast(err.response?.data?.message || 'TMDB sync failed', 'error');
    } finally { setSyncing(false); }
  };

  if (loading) return <LoadingSpinner text="Loading movies…" />;

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2><Film size={20} /> Movies ({movies.length})</h2>
        <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
          <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
          {syncing ? 'Syncing…' : 'Sync from TMDB'}
        </button>
      </div>

      {syncResults && (
        <div className="sync-results">
          <span>Now Showing added: <strong>{syncResults.nowShowingAdded}</strong></span>
          <span>Coming Soon added: <strong>{syncResults.comingSoonAdded}</strong></span>
          <span>Updated: <strong>{syncResults.updated}</strong></span>
        </div>
      )}

      <div className="admin-grid">
        {movies.map((m) => (
          <div key={m._id} className="admin-card">
            <h4>{m.title}</h4>
            <p>{m.overview?.substring(0, 80)}…</p>
            <div className="card-meta">
              <span>{m.status?.replace('_', ' ')}</span>
              {m.runtime > 0 && <span>{m.runtime} min</span>}
              {m.genres?.[0] && <span>{m.genres[0]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Cities Tab ──────────────────────────────────────────────── */
const CitiesTab = () => {
  const { showToast } = useToast();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCities = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/cities');
      setCities(data.data.cities);
    } catch { /* swallow */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !state) { showToast('Name and state are required', 'error'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/cities', { name, state });
      showToast('City added!', 'success');
      setName(''); setState('');
      fetchCities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add city', 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner text="Loading cities…" />;

  return (
    <div className="admin-section">
      <h2><MapPin size={20} /> Cities ({cities.length})</h2>

      <form className="admin-form" onSubmit={handleAdd}>
        <h3><Plus size={16} /> Add City</h3>
        <div className="form-row">
          <div className="form-group">
            <label>City Name</label>
            <input className="form-input" placeholder="e.g. Mumbai" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>State</label>
            <input className="form-input" placeholder="e.g. Maharashtra" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add City'}
          </button>
        </div>
      </form>

      <div className="admin-grid">
        {cities.map((c) => (
          <div key={c._id} className="admin-card">
            <h4>{c.name}</h4>
            <p>{c.state}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Theaters Tab ────────────────────────────────────────────── */
const TheatersTab = () => {
  const { showToast } = useToast();
  const [theaters, setTheaters] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theater form
  const [tName, setTName] = useState('');
  const [tCity, setTCity] = useState('');
  const [tAddress, setTAddress] = useState('');
  const [tSubmitting, setTSubmitting] = useState(false);

  // Screen form
  const [sTheater, setSTheater] = useState('');
  const [sName, setSName] = useState('');
  const [sRows, setSRows] = useState('10');
  const [sCols, setSCols] = useState('15');
  const [sSubmitting, setSSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [theatersRes, citiesRes] = await Promise.all([
        apiClient.get('/theaters'),
        apiClient.get('/cities'),
      ]);
      setTheaters(theatersRes.data.data.theaters);
      setCities(citiesRes.data.data.cities);
    } catch { /* swallow */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTheater = async (e) => {
    e.preventDefault();
    if (!tName || !tCity || !tAddress) { showToast('All fields required', 'error'); return; }
    setTSubmitting(true);
    try {
      await apiClient.post('/theaters', { name: tName, city: tCity, address: tAddress });
      showToast('Theater added!', 'success');
      setTName(''); setTCity(''); setTAddress('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add theater', 'error');
    } finally { setTSubmitting(false); }
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    const rows = parseInt(sRows, 10);
    const cols = parseInt(sCols, 10);
    if (!sTheater || !sName || !rows || !cols) { showToast('All fields required', 'error'); return; }
    setSSubmitting(true);
    try {
      await apiClient.post(`/theaters/${sTheater}/screens`, {
        name: sName,
        seatLayout: {
          rows,
          columns: cols,
          aisleAfterRows: rows >= 6 ? [Math.floor(rows / 2)] : [],
          aisleAfterColumns: cols >= 10 ? [Math.floor(cols / 3), Math.floor((cols * 2) / 3)] : [],
          unavailableSeats: [],
        },
      });
      showToast('Screen added!', 'success');
      setSName(''); setSTheater(''); setSRows('10'); setSCols('15');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add screen', 'error');
    } finally { setSSubmitting(false); }
  };

  if (loading) return <LoadingSpinner text="Loading theaters…" />;

  return (
    <div className="admin-section">
      <h2><Building2 size={20} /> Theaters ({theaters.length})</h2>

      {/* Add Theater */}
      <form className="admin-form" onSubmit={handleAddTheater}>
        <h3><Plus size={16} /> Add Theater</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Theater Name</label>
            <input className="form-input" placeholder="e.g. PVR Cinemas" value={tName} onChange={(e) => setTName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>City</label>
            <select className="form-input" value={tCity} onChange={(e) => setTCity(e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Address</label>
          <input className="form-input" placeholder="Full address" value={tAddress} onChange={(e) => setTAddress(e.target.value)} />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" disabled={tSubmitting}>
            {tSubmitting ? 'Adding…' : 'Add Theater'}
          </button>
        </div>
      </form>

      {/* Add Screen */}
      <form className="admin-form" onSubmit={handleAddScreen}>
        <h3><Plus size={16} /> Add Screen to Theater</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Theater</label>
            <select className="form-input" value={sTheater} onChange={(e) => setSTheater(e.target.value)}>
              <option value="">Select theater</option>
              {theaters.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Screen Name</label>
            <input className="form-input" placeholder="e.g. Screen 1" value={sName} onChange={(e) => setSName(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Rows</label>
            <input className="form-input" type="number" min="1" max="26" value={sRows} onChange={(e) => setSRows(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Columns</label>
            <input className="form-input" type="number" min="1" max="30" value={sCols} onChange={(e) => setSCols(e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" disabled={sSubmitting}>
            {sSubmitting ? 'Adding…' : 'Add Screen'}
          </button>
        </div>
      </form>

      <div className="admin-grid">
        {theaters.map((t) => (
          <div key={t._id} className="admin-card">
            <h4>{t.name}</h4>
            <p>{t.address}</p>
            <div className="card-meta">
              <span>{t.city?.name || 'No city'}</span>
              <span>{t.screens?.length || 0} screen(s)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Showtimes Tab ───────────────────────────────────────────── */
const ShowtimesTab = () => {
  const { showToast } = useToast();
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stMovie, setStMovie] = useState('');
  const [stTheater, setStTheater] = useState('');
  const [stScreen, setStScreen] = useState('');
  const [stDate, setStDate] = useState('');
  const [stPrice, setStPrice] = useState('250');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [stRes, mRes, tRes] = await Promise.all([
        apiClient.get('/showtimes?all=true'),
        apiClient.get('/movies'),
        apiClient.get('/theaters'),
      ]);
      setShowtimes(stRes.data.data.showtimes);
      setMovies(mRes.data.data.movies);
      setTheaters(tRes.data.data.theaters);
    } catch { /* swallow */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedTheater = theaters.find((t) => t._id === stTheater);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!stMovie || !stScreen || !stDate || !stPrice) {
      showToast('All fields are required', 'error');
      return;
    }
    const priceInPaise = Math.round(parseFloat(stPrice) * 100);
    if (priceInPaise < 100) { showToast('Minimum price is ₹1', 'error'); return; }

    setSubmitting(true);
    try {
      await apiClient.post('/showtimes', {
        movie: stMovie,
        screen: stScreen,
        startTime: new Date(stDate).toISOString(),
        price: priceInPaise,
      });
      showToast('Showtime created!', 'success');
      setStMovie(''); setStTheater(''); setStScreen(''); setStDate(''); setStPrice('250');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create showtime', 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner text="Loading showtimes…" />;

  return (
    <div className="admin-section">
      <h2><Clock size={20} /> Showtimes ({showtimes.length})</h2>

      <form className="admin-form" onSubmit={handleCreate}>
        <h3><Plus size={16} /> Create Showtime</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Movie</label>
            <select className="form-input" value={stMovie} onChange={(e) => setStMovie(e.target.value)}>
              <option value="">Select movie</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Theater</label>
            <select className="form-input" value={stTheater} onChange={(e) => { setStTheater(e.target.value); setStScreen(''); }}>
              <option value="">Select theater</option>
              {theaters.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Screen</label>
            <select className="form-input" value={stScreen} onChange={(e) => setStScreen(e.target.value)} disabled={!stTheater}>
              <option value="">{stTheater ? 'Select screen' : 'Select theater first'}</option>
              {selectedTheater?.screens?.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.totalSeats} seats)</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date &amp; Time</label>
            <input className="form-input" type="datetime-local" value={stDate} onChange={(e) => setStDate(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Price per Seat (₹)</label>
            <input className="form-input" type="number" min="1" step="0.01" value={stPrice} onChange={(e) => setStPrice(e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Showtime'}
          </button>
        </div>
      </form>

      <div className="admin-grid">
        {showtimes.map((st) => (
          <div key={st._id} className="admin-card">
            <h4>{st.movie?.title || 'Unknown'}</h4>
            <p>{st.theater?.name} — {st.screen?.name}</p>
            <div className="card-meta">
              <span>
                {new Date(st.startTime).toLocaleString('en-IN', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span>₹{(st.price / 100).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Dashboard ──────────────────────────────────────────── */
const AdminDashboard = () => {
  const [tab, setTab] = useState('movies');

  const tabs = [
    { id: 'movies', label: 'Movies', icon: <Film size={16} /> },
    { id: 'cities', label: 'Cities', icon: <MapPin size={16} /> },
    { id: 'theaters', label: 'Theaters', icon: <Building2 size={16} /> },
    { id: 'showtimes', label: 'Showtimes', icon: <Clock size={16} /> },
  ];

  return (
    <div className="main-content admin-page">
      <h1>Admin Dashboard</h1>

      <div className="admin-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'movies' && <MoviesTab />}
      {tab === 'cities' && <CitiesTab />}
      {tab === 'theaters' && <TheatersTab />}
      {tab === 'showtimes' && <ShowtimesTab />}
    </div>
  );
};

export default AdminDashboard;
