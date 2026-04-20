/**
 * StyleGuru Weather Analytics Service
 * ════════════════════════════════════════════════════════
 * Uses Geo-location + Open-Meteo for real-time style context.
 */

// Mapping Open-Meteo WMO Codes to StyleGuru Engine Contexts
const WMO_MAP = {
  0: 'sunny', 1: 'pleasant', 2: 'pleasant', 3: 'cloudy', // Fair
  45: 'cloudy', 48: 'cloudy',                         // Fog
  51: 'rainy', 53: 'rainy', 55: 'rainy',               // Drizzle
  61: 'rainy', 63: 'rainy', 65: 'rainy',               // Rain
  71: 'cold', 73: 'cold', 75: 'cold',                  // Snow
  80: 'rainy', 81: 'rainy', 82: 'rainy',               // Showers
  95: 'rainy',                                        // Thunder
};

export const getLocalWeather = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[Weather] Geolocation not supported');
      return resolve({ condition: 'sunny', temp: 25, city: 'Unknown' });
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        
        const code = data.current_weather?.weathercode || 0;
        const temp = data.current_weather?.temperature || 25;
        
        // Map to StyleGuru conditions
        let condition = WMO_MAP[code] || 'pleasant';
        if (temp > 32) condition = 'hot';
        if (temp < 15) condition = 'cold';

        console.log(`[Weather] Service Synchronized: ${condition} (${temp}°C)`);
        
        resolve({ 
            condition, 
            temp, 
            code,
            timestamp: Date.now()
        });
      } catch (e) {
        console.error('[Weather] Fetch failed:', e);
        resolve({ condition: 'sunny', temp: 25 });
      }
    }, (err) => {
      console.warn('[Weather] Permission denied or error:', err);
      resolve({ condition: 'sunny', temp: 25 });
    }, { timeout: 10000 });
  });
};

/**
 * Predicts weather for a 7-day window (Mocked for Demo reliability, feeds real data if available)
 */
export const getWeeklyForecast = async () => {
    // In a real app, we'd fetch the 7-day forecast from Open-Meteo
    // For the predictor demo, we'll return a mix of real + varied data
    const base = await getLocalWeather();
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const forecast = {};
    
    days.forEach((day, i) => {
        // Vary the condition slightly for demo purposes
        const variations = ['sunny', 'pleasant', 'cloudy', 'rainy', 'hot', 'cold'];
        forecast[day] = i === 0 ? base : { 
            condition: variations[(base.code + i) % variations.length],
            temp: base.temp + (i % 2 === 0 ? 2 : -2)
        };
    });
    
    return forecast;
};
