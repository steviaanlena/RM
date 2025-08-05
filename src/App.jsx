import { useState } from 'react';
import './App.css';

function App() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Weather feature ranges for El Niño and La Niña
  const featureRanges = {
    u10: { 
      elNino: [-11.054672, 7.7734528], 
      laNina: [-13.78511, 7.89653] 
    },
    v10: { 
      elNino: [-10.202042, 6.925995], 
      laNina: [-10.954086, 9.750015] 
    },
    d2m: { 
      elNino: [292.1405, 299.39697], 
      laNina: [292.3739, 298.95984] 
    },
    t2m: { 
      elNino: [295.79492, 302.8485], 
      laNina: [294.292, 303.109] 
    },
    msl: { 
      elNino: [100543.25, 101353.625], 
      laNina: [100577.06, 101450.875] 
    },
    sst: { 
      elNino: [296.2981, 304.02832], 
      laNina: [294.98413, 304.18286] 
    },
    sp: { 
      elNino: [100542.37, 101353.875], 
      laNina: [100578.64, 101452.91] 
    },
    stl1: { 
      elNino: [296.29773, 304.02856], 
      laNina: [294.9851, 304.1825] 
    }
  };

  // Generate random value within a range
  const randomInRange = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  // Generate random weather features
  const generateWeatherFeatures = () => {
    const features = {};
    
    // Randomly choose El Niño or La Niña pattern (60% normal, 20% El Niño, 20% La Niña)
    const rand = Math.random();
    let pattern;
    if (rand < 0.6) {
      // Normal conditions - mix of both ranges
      pattern = 'normal';
    } else if (rand < 0.8) {
      pattern = 'elNino';
    } else {
      pattern = 'laNina';
    }

    Object.keys(featureRanges).forEach(feature => {
      if (pattern === 'normal') {
        // For normal conditions, randomly pick from either range
        const useElNino = Math.random() < 0.5;
        const range = useElNino ? featureRanges[feature].elNino : featureRanges[feature].laNina;
        features[feature] = randomInRange(range[0], range[1]);
      } else if (pattern === 'elNino') {
        const range = featureRanges[feature].elNino;
        features[feature] = randomInRange(range[0], range[1]);
      } else {
        const range = featureRanges[feature].laNina;
        features[feature] = randomInRange(range[0], range[1]);
      }
    });

    return { features, truePattern: pattern };
  };

  // Mock prediction based on generated features
  const mockPredict = (features) => {
    // Simple rule-based prediction based on key indicators
    let elNinoScore = 0;
    let laNinaScore = 0;

    // Temperature indicators (SST and T2M are key for ENSO)
    if (features.sst > 300) elNinoScore += 2;
    if (features.sst < 298) laNinaScore += 2;
    
    if (features.t2m > 299) elNinoScore += 1.5;
    if (features.t2m < 297) laNinaScore += 1.5;

    // Pressure indicators (MSL and SP)
    if (features.msl < 101000) elNinoScore += 1;
    if (features.msl > 101200) laNinaScore += 1;

    // Wind indicators
    if (Math.abs(features.u10) < 5) elNinoScore += 0.5;
    if (Math.abs(features.v10) > 7) laNinaScore += 0.5;

    // Add some randomness to make it more realistic
    elNinoScore += (Math.random() - 0.5) * 2;
    laNinaScore += (Math.random() - 0.5) * 2;

    // Determine prediction
    let prediction;
    let confidence;

    if (elNinoScore > laNinaScore + 1) {
      prediction = 'El Niño';
      confidence = Math.min(95, 60 + (elNinoScore - laNinaScore) * 10);
    } else if (laNinaScore > elNinoScore + 1) {
      prediction = 'La Niña';
      confidence = Math.min(95, 60 + (laNinaScore - elNinoScore) * 10);
    } else {
      prediction = 'Neutral/Normal';
      confidence = Math.min(90, 50 + Math.random() * 30);
    }

    return {
      prediction,
      confidence: Math.round(confidence),
      weather_data: features
    };
  };

  const handlePredict = async () => {
    if (!lat || !lon) {
      alert('Please enter both latitude and longitude');
      return;
    }

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (latitude < -90 || latitude > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }
    
    if (longitude < -180 || longitude > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    setLoading(true);
    setResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    try {
      // Generate random weather features
      const { features } = generateWeatherFeatures();
      
      // Make prediction
      const prediction = mockPredict(features);
      
      setResult(prediction);
    } catch (error) {
      alert('Error generating prediction');
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
          
          <div className="prediction-summary">
            <div className="prediction-card">
              <strong>Prediction:</strong>
              <div className={`prediction-value ${
                result.prediction === 'El Niño' ? 'el-nino' : 
                result.prediction === 'La Niña' ? 'la-nina' : 'neutral'
              }`}>
                {result.prediction}
              </div>
            </div>
            
            <div className="prediction-card">
              <strong>Confidence:</strong>
              <div className="prediction-value confidence-value">
                {result.confidence}%
              </div>
            </div>
          </div>

          <h3>🌡️ Weather Features:</h3>
          <ul>
            {Object.entries(result.weather_data).map(([key, value]) => (
              <li key={key}>
                <strong>{key.toUpperCase()}:</strong>
                <span>{value.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <h3>🌾Call to Action:</h3>

          <div className="call-to-action-box">
            {result.prediction === 'El Niño' && (
              <>
                {result.confidence <= 30 && <p>🌱 Continue regular crop management. No significant El Niño signs yet, but begin monitoring moisture levels and temperatures.</p>}
                {result.confidence > 30 && result.confidence <= 60 && <p>💧 Prepare for drier-than-usual conditions. Consider switching to drought-resistant crops and optimize irrigation use.</p>}
                {result.confidence > 60 && result.confidence <= 80 && <p>🔥 Strong El Niño signal. Delay water-intensive crops. Mulch fields and schedule irrigation efficiently. Coordinate with local agri offices for advisories.</p>}
                {result.confidence > 80 && <p>🚨 Severe El Niño expected. Implement drought contingency plans, protect seed banks, and activate crop insurance. Secure livestock water sources and shade structures.</p>}
              </>
            )}

            {result.prediction === 'La Niña' && (
              <>
                {result.confidence <= 30 && <p>🌱 Conditions mostly normal. Keep drainage systems maintained and monitor for heavy rainfall shifts.</p>}
                {result.confidence > 30 && result.confidence <= 60 && <p>🌧️ Expect wetter seasons. Plant short-cycle or flood-resilient crops. Check irrigation canals and prepare for delays in harvest logistics.</p>}
                {result.confidence > 60 && result.confidence <= 80 && <p>🌊 Strong La Niña signal. Watch for field saturation, boost pest control, and delay planting of flood-sensitive crops. Coordinate with farmer groups.</p>}
                {result.confidence > 80 && <p>🚨 Severe La Niña conditions likely. Harvest early if possible, reinforce bunds, and avoid lowland planting. Livestock should be relocated from flood-prone areas.</p>}
              </>
            )}

            {result.prediction === 'Neutral/Normal' && (
              <p>✅ Conditions are stable. Maintain standard planting schedules and continue normal operations. Monitor forecasts for any developing anomalies.</p>
            )}
          </div>

          
        </div>
      )}
    </div>
  );
}

export default App;