import { useState } from 'react';
import './App.css';

function App() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!lat || !lon) {
      alert('Please enter both latitude and longitude');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Prediction failed.');
      }
    } catch (error) {
      alert('Error connecting to backend');
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <h1>🌍 El Niño / La Niña Predictor</h1>

      <div className="input-group">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <br></br>
       
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
        />
        <br></br>
        <br></br>
        <br></br>
        
        <button onClick={handlePredict} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </div>

      {result && (
        <div className="result-box">
          <h2>📊 Prediction Result</h2>
          <p><strong>Prediction:</strong> {result.prediction}</p>
          <p><strong>Confidence:</strong> {result.confidence}%</p>

          <h3>Weather Features:</h3>
          <ul>
            {Object.entries(result.weather_data).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value.toFixed(2)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
