import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';
import './styles.css';
import './i18n';

const TOKEN_KEY = 'agriyield_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest(path, method = 'GET', body = null) {
  const headers = { Accept: 'application/json' };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data !== undefined ? data.data : data;
}

function ProtectedRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: t('tabs.home') },
    { to: '/predict', label: t('tabs.predict') },
    { to: '/history', label: t('tabs.history') },
    { to: '/profile', label: t('tabs.profile') },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-icon">A</div>
          <div>
            <h1>AgriYield</h1>
            <small>Smart Farming</small>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          {t('profile.logout')}
        </button>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/api/auth/login', 'POST', {
        identifier: identifier.trim(),
        password,
      });
      setToken(response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon large">A</div>
          <h2>AgriYield</h2>
        </div>
        <h3>Welcome back</h3>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email or mobile number</span>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or mobile" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link-row">
          New here?
          <button className="text-link" onClick={() => navigate('/register')}>
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/api/auth/register', 'POST', {
        name: name.trim(),
        identifier: identifier.trim(),
        password,
      });
      setToken(response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon large">A</div>
          <h2>AgriYield</h2>
        </div>
        <h3>Create account</h3>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
          </label>
          <label>
            <span>Email or mobile number</span>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or mobile" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link-row">
          Already have an account?
          <button className="text-link" onClick={() => navigate('/login')}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [farms, setFarms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [farmList, predictionList] = await Promise.all([
          apiRequest('/api/farms'),
          apiRequest('/api/predictions'),
        ]);

        if (!active) return;

        setFarms(farmList || []);
        setPredictions(predictionList || []);

        let lat = 28.7041;
        let lon = 77.1025;

        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
              });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch (geoError) {
            console.warn('Using default coordinates for weather view:', geoError);
          }
        }

        const weatherData = await apiRequest(`/api/weather?lat=${lat}&lon=${lon}`);
        if (active) {
          setWeather(weatherData);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load dashboard data');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('dashboard.welcome_back')}</p>
          <h2>{t('dashboard.smart_farm_hub')}</h2>
        </div>
      </header>

      {error && <div className="alert-box error-box">{error}</div>}

      <div className="stats-grid">
        <div className="stat-tile highlight">
          <span>{t('dashboard.active_fields')}</span>
          <strong>{farms.length}</strong>
        </div>
        <div className="stat-tile">
          <span>{t('dashboard.ai_models_run')}</span>
          <strong>{predictions.length}</strong>
        </div>
        <div className="stat-tile">
          <span>{t('dashboard.humidity')}</span>
          <strong>{weather ? `${weather.humidity}%` : '--'}</strong>
        </div>
        <div className="stat-tile">
          <span>{t('dashboard.rain')}</span>
          <strong>{weather ? `${weather.rainfall} mm` : '--'}</strong>
        </div>
      </div>

      <div className="cards-grid">
        <article className="panel weather-panel">
          <h3>Weather overview</h3>
          {loading ? <div className="loader">Loading...</div> : weather ? (
            <>
              <div className="weather-main">
                <div>
                  <p className="small-label">Location</p>
                  <h4>{weather.location}</h4>
                </div>
                <div className="temp-box">{Math.round(weather.temperature)}°C</div>
              </div>
              <p>{weather.condition || 'Clear skies'}</p>
              <ul className="bullet-list">
                {weather.recommendations?.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </>
          ) : <p>No weather information</p>}
        </article>

        <article className="panel">
          <h3>Field summary</h3>
          {farms.length ? (
            <ul className="list-stack">
              {farms.slice(0, 4).map((farm) => (
                <li key={farm._id}>
                  <span>{farm.name}</span>
                  <strong>{farm.area} ha</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('dashboard.no_fields_yet')}</p>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>{t('dashboard.recent_predictions')}</h3>
        </div>
        {predictions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Yield</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictions.slice(0, 5).map((prediction) => (
                  <tr key={prediction._id}>
                    <td>{prediction.crop || 'Crop'}</td>
                    <td>{prediction.predictedYield ? `${prediction.predictedYield.toFixed(2)} t/ha` : 'N/A'}</td>
                    <td>{prediction.aiConfidenceScore ? `${prediction.aiConfidenceScore.toFixed(0)}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('dashboard.no_predictions')}</p>
        )}
      </article>
    </div>
  );
}

function PredictPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    crop: '41',
    year: '2024',
    season: '1',
    state: '27',
    soilType: 'alluvial',
    temperature: '28',
    rainfall: '800',
    humidity: '70',
    N: '80',
    P: '40',
    K: '40',
    pH: '6.5',
    fertilizer: '150',
    pesticide: '1.2',
    area: '2.5',
  });

  useEffect(() => {
    async function loadFarms() {
      try {
        const farmList = await apiRequest('/api/farms');
        setFarms(farmList || []);
        if (farmList?.[0]) {
          setSelectedFarm(farmList[0]._id);
          setForm((prev) => ({ ...prev, area: String(farmList[0].area || prev.area) }));
        }
      } catch (err) {
        console.warn(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFarms();
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const payload = {
        ...form,
        area: Number(form.area),
        crop: Number(form.crop),
        year: Number(form.year),
        season: Number(form.season),
        state: Number(form.state),
        temperature: Number(form.temperature),
        rainfall: Number(form.rainfall),
        humidity: Number(form.humidity),
        N: Number(form.N),
        P: Number(form.P),
        K: Number(form.K),
        pH: Number(form.pH),
        fertilizer: Number(form.fertilizer),
        pesticide: Number(form.pesticide),
        farmId: selectedFarm || undefined,
      };

      const prediction = await apiRequest('/api/ai/predict', 'POST', payload);
      setResult(prediction);
    } catch (err) {
      setResult({ error: err.message || 'Prediction failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI prediction</p>
          <h2>Yield model setup</h2>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="prediction-form panel">
        <div className="form-grid">
          <label>
            <span>Farm</span>
            <select value={selectedFarm} onChange={(e) => setSelectedFarm(e.target.value)} disabled={loading || !farms.length}>
              {farms.length ? farms.map((farm) => (
                <option key={farm._id} value={farm._id}>{farm.name}</option>
              )) : <option value="">No farms</option>}
            </select>
          </label>

          <label>
            <span>Crop</span>
            <select value={form.crop} onChange={(e) => updateField('crop', e.target.value)}>
              <option value="41">Rice</option>
              <option value="54">Wheat</option>
              <option value="24">Maize</option>
              <option value="47">Sugarcane</option>
              <option value="11">Cotton</option>
              <option value="38">Potato</option>
              <option value="31">Onion</option>
              <option value="3">Banana</option>
              <option value="4">Barley</option>
            </select>
          </label>

          <label>
            <span>Year</span>
            <input value={form.year} onChange={(e) => updateField('year', e.target.value)} />
          </label>

          <label>
            <span>Season</span>
            <select value={form.season} onChange={(e) => updateField('season', e.target.value)}>
              <option value="1">Kharif</option>
              <option value="2">Rabi</option>
              <option value="3">Summer</option>
              <option value="4">Whole Year</option>
            </select>
          </label>

          <label>
            <span>State</span>
            <select value={form.state} onChange={(e) => updateField('state', e.target.value)}>
              <option value="27">Uttar Pradesh</option>
              <option value="15">Maharashtra</option>
              <option value="14">Madhya Pradesh</option>
              <option value="22">Punjab</option>
              <option value="8">Haryana</option>
              <option value="5">Delhi</option>
            </select>
          </label>

          <label>
            <span>Soil type</span>
            <select value={form.soilType} onChange={(e) => updateField('soilType', e.target.value)}>
              <option value="alluvial">Alluvial</option>
              <option value="black">Black</option>
              <option value="red">Red</option>
              <option value="sandy">Sandy</option>
            </select>
          </label>

          <label>
            <span>Area (ha)</span>
            <input value={form.area} onChange={(e) => updateField('area', e.target.value)} />
          </label>

          <label>
            <span>Temperature (°C)</span>
            <input value={form.temperature} onChange={(e) => updateField('temperature', e.target.value)} />
          </label>

          <label>
            <span>Rainfall (mm)</span>
            <input value={form.rainfall} onChange={(e) => updateField('rainfall', e.target.value)} />
          </label>

          <label>
            <span>Humidity (%)</span>
            <input value={form.humidity} onChange={(e) => updateField('humidity', e.target.value)} />
          </label>

          <label>
            <span>N</span>
            <input value={form.N} onChange={(e) => updateField('N', e.target.value)} />
          </label>

          <label>
            <span>P</span>
            <input value={form.P} onChange={(e) => updateField('P', e.target.value)} />
          </label>

          <label>
            <span>K</span>
            <input value={form.K} onChange={(e) => updateField('K', e.target.value)} />
          </label>

          <label>
            <span>pH</span>
            <input value={form.pH} onChange={(e) => updateField('pH', e.target.value)} />
          </label>

          <label>
            <span>Fertilizer</span>
            <input value={form.fertilizer} onChange={(e) => updateField('fertilizer', e.target.value)} />
          </label>

          <label>
            <span>Pesticide</span>
            <input value={form.pesticide} onChange={(e) => updateField('pesticide', e.target.value)} />
          </label>
        </div>

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Running prediction...' : 'Run prediction'}
        </button>
      </form>

      {result && (
        <div className="panel result-box">
          {result.error ? (
            <p className="error-text">{result.error}</p>
          ) : (
            <>
              <h3>Prediction result</h3>
              <div className="result-stats">
                <div>
                  <span>Yield</span>
                  <strong>{Number(result.predicted_yield_per_area || 0).toFixed(2)} t/ha</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{Number(result.ai_confidence_score || 0).toFixed(0)}%</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const list = await apiRequest('/api/predictions');
        setPredictions(list || []);
      } catch (err) {
        console.warn(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Archive</p>
          <h2>Prediction history</h2>
        </div>
      </header>

      <div className="panel">
        {loading ? (
          <div className="loader">Loading...</div>
        ) : predictions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Field</th>
                  <th>Yield</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((item) => (
                  <tr key={item._id}>
                    <td>{item.crop || 'Crop'}</td>
                    <td>{item.farm?.name || 'Farm'}</td>
                    <td>{item.predictedYield ? `${item.predictedYield.toFixed(2)} t/ha` : 'N/A'}</td>
                    <td>{item.aiConfidenceScore ? `${item.aiConfidenceScore.toFixed(0)}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No predictions have been recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest('/api/auth/me');
        setProfile(data || null);
      } catch (err) {
        console.warn(err.message);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Farm account</h2>
        </div>
      </header>

      <div className="panel profile-panel">
        <div className="profile-header">
          <div className="avatar">{profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}</div>
          <div>
            <h3>{profile?.name || 'AgriYield user'}</h3>
            <p>{profile?.email || profile?.phone || 'No additional contact info'}</p>
          </div>
        </div>

        <div className="info-grid">
          <div>
            <span>Role</span>
            <strong>Farmer</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{profile?.phone || 'Not available'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{profile?.email || 'Not available'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
