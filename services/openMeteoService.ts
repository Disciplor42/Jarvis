
import { WeatherData } from '../types';

const WMO_CODES: {[key: number]: string} = {
  0: 'Clear Sky',
  1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
  80: 'Rain Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Heavy Hail'
};

// Default coordinates (Stark Tower / NYC) to use if Geolocation fails
const DEFAULT_LOC = { lat: 40.758896, lon: -73.985130 };

export const fetchLocation = (): Promise<{lat: number, lon: number}> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOC);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
          console.warn("Geolocation access denied or failed. Defaulting to Grid coordinates.");
          resolve(DEFAULT_LOC);
      },
      { timeout: 10000 }
    );
  });
};

export const fetchWeather = async (): Promise<WeatherData> => {
  try {
    const { lat, lon } = await fetchLocation();
    
    // Fetch Weather with additional metrics including UV Index (Hourly & Daily Max)
    // hourly now includes: temp, uv, precip, humidity, feels_like, wind, weather_code
    // forecast_days=2 to ensure we have next 24 hours
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,uv_index,precipitation_probability,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=uv_index_max&timezone=auto&forecast_days=2`
    ).catch(e => {
        console.warn("Weather API Network Error:", e.message);
        return null;
    });
    
    if (!response || !response.ok) {
        return {
            temp: 0,
            condition: 'Offline',
            windSpeed: 0,
            isDay: true,
            locationName: 'Sensors Offline'
        };
    }
    
    const data = await response.json();
    const current = data.current;
    
    // Calculate Current UV based on current hour
    const currentHour = new Date().getHours();
    const currentUV = data.hourly?.uv_index?.[currentHour] ?? 0;
    const maxUV = data.daily?.uv_index_max?.[0] ?? 0;

    return {
      temp: current.temperature_2m,
      condition: WMO_CODES[current.weather_code] || 'Unknown',
      windSpeed: current.wind_speed_10m,
      isDay: current.is_day === 1,
      locationName: `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`,
      humidity: current.relative_humidity_2m,
      feelsLike: current.apparent_temperature,
      precipitation: current.precipitation,
      uvIndex: currentUV,
      uvIndexMax: maxUV,
      hourly: data.hourly
    };
  } catch (e) {
    console.error("OpenMeteo Service Error:", e);
    return {
            temp: 0,
            condition: 'Offline',
            windSpeed: 0,
            isDay: true,
            locationName: 'Offline'
    };
  }
};
