
import React from 'react';
import { WeatherData } from '../types';

interface WeatherWidgetProps {
  data: WeatherData | null;
  isLoading: boolean;
}

const getWeatherIcon = (code: number, isDay: boolean) => {
    if (code === 0) return isDay ? '☀' : '🌙';
    if (code <= 3) return '☁';
    if (code <= 48) return '🌫';
    if (code <= 67) return '🌧';
    if (code <= 77) return '❄';
    if (code <= 82) return '🌧';
    if (code <= 86) return '❄';
    if (code <= 99) return '⚡';
    return '❓';
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 border-b border-slate-800 animate-pulse">
        <div className="h-4 bg-slate-800 w-1/2 mb-2"></div>
        <div className="h-8 bg-slate-800 w-3/4"></div>
      </div>
    );
  }

  // Handle Offline State gracefully
  if (!data || data.condition === 'Offline' || data.condition === 'System Offline') {
      return (
        <div className="p-4 border-b border-slate-800 relative overflow-hidden group opacity-60">
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <div className="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-1">Atmospheric Sensors</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-mono font-bold text-slate-500">OFFLINE</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-600 font-mono">RETRYING CONNECTION...</span>
                    </div>
                </div>
                <div className="text-2xl text-slate-700">
                    ⚠
                </div>
            </div>
        </div>
      );
  }

  // UV Color Logic
  const getUvColor = (uv: number = 0) => {
      if (uv <= 2) return 'text-green-500';
      if (uv <= 5) return 'text-yellow-500';
      if (uv <= 7) return 'text-orange-500';
      return 'text-red-500';
  };

  const currentHourIndex = new Date().getHours();
  // Get next 24 hours from hourly data if available
  const hourlyItems = data.hourly ? data.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((time, i) => {
      const idx = currentHourIndex + i;
      return {
          time,
          temp: data.hourly!.temperature_2m[idx],
          precip: data.hourly!.precipitation_probability[idx],
          uv: data.hourly!.uv_index[idx],
          code: data.hourly!.weather_code[idx]
      };
  }) : [];

  return (
    <div className="p-4 border-b border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Top Row: Temp & Condition */}
        <div className="flex justify-between items-start relative z-10 mb-3">
            <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Environmental Data</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-tech font-bold text-white tracking-tighter">{Math.round(data.temp)}°</span>
                    <span className="text-xs text-slate-400 font-mono uppercase truncate max-w-[100px]">{data.condition}</span>
                </div>
            </div>
            <div className="text-4xl text-cyan-500/50 filter drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">
               {data.condition.toLowerCase().includes('rain') || data.condition.toLowerCase().includes('drizzle') ? '🌧' : 
                data.condition.toLowerCase().includes('snow') ? '❄' :
                data.condition.toLowerCase().includes('cloud') ? '☁' : 
                data.condition.toLowerCase().includes('thunder') ? '⚡' : '☀'}
            </div>
        </div>

        {/* Bottom Grid: Detailed Metrics */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 relative z-10">
             {/* Wind */}
             <div className="flex items-center gap-1.5">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-cyan-600">
                    <path d="M10 2a.75.75 0 01.75.75v3.636l.995-1.55a.75.75 0 111.266.81l-1.957 3.05a.75.75 0 01-1.26 0l-1.957-3.05a.75.75 0 111.266-.81l.995 1.55V2.75A.75.75 0 0110 2zM5.555 3.328a.75.75 0 01.35 1.002l-.65 1.3a.75.75 0 11-1.342-.67l.65-1.3a.75.75 0 01.992-.332zM15.445 3.328a.75.75 0 00-.992.332l-.65 1.3a.75.75 0 101.342.67l.65-1.3a.75.75 0 00-.35-1.002z" />
                 </svg>
                 <span className="text-[10px] text-cyan-500 font-mono">WIND: <span className="text-slate-300">{data.windSpeed} km/h</span></span>
             </div>

             {/* Humidity */}
             <div className="flex items-center gap-1.5">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-600">
                    <path fillRule="evenodd" d="M10 2c-1.716 5.5-8 7.946-8 11.483C2 16.531 5.581 19 10 19s8-2.469 8-5.517C18 9.946 11.716 7.5 10 2zm-1.5 8.5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3z" clipRule="evenodd" />
                 </svg>
                 <span className="text-[10px] text-blue-400 font-mono">HUM: <span className="text-slate-300">{data.humidity !== undefined ? data.humidity : '--'}%</span></span>
             </div>

             {/* UV Index */}
             <div className="flex items-center gap-1.5">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${getUvColor(data.uvIndex)}`}>
                    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM4.343 4.343a.75.75 0 011.061 0l1.06 1.061a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.061zM14.596 14.596a.75.75 0 011.06 0l1.061 1.06a.75.75 0 11-1.06 1.061l-1.061-1.06a.75.75 0 010-1.061zM4.343 14.596a.75.75 0 010 1.061l-1.06 1.06a.75.75 0 11-1.061-1.06l1.06-1.061a.75.75 0 011.061 0zM14.596 4.343a.75.75 0 010 1.061l-1.061 1.06a.75.75 0 11-1.06-1.061l1.06-1.06a.75.75 0 011.061 0zM3.5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 013.5 10zM17.25 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                 </svg>
                 <span className={`text-[10px] ${getUvColor(data.uvIndex)} font-mono`}>UV IDX: <span className="text-slate-300">{data.uvIndex !== undefined ? data.uvIndex : '--'}</span></span>
             </div>

             {/* Feels Like */}
             <div className="flex items-center gap-1.5">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-orange-500">
                    <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 15.5A.75.75 0 002.84 18h11.156a.75.75 0 00.68-.494l2.5-7.5a.75.75 0 00-1.188-.857l-1.258 1.51-2.747-8.752z" />
                 </svg>
                 <span className="text-[10px] text-orange-400 font-mono">FEEL: <span className="text-slate-300">{data.feelsLike !== undefined ? Math.round(data.feelsLike) : '--'}°</span></span>
             </div>
        </div>

        {/* Hourly Forecast Section */}
        {hourlyItems.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-3 relative z-10">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Hourly Projection (24h)</div>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x mask-fade-right">
                    {hourlyItems.map((h, idx) => {
                        const date = new Date(h.time);
                        const hour = date.getHours();
                        const isDay = hour >= 6 && hour < 18; 
                        
                        return (
                            <div key={idx} className="flex flex-col items-center min-w-[50px] p-2 bg-slate-900/50 border border-slate-800 rounded snap-start hover:bg-slate-800 transition-colors shrink-0">
                                <span className="text-[9px] font-mono text-slate-400">{hour.toString().padStart(2, '0')}:00</span>
                                <span className="text-lg my-1 filter drop-shadow-md">{getWeatherIcon(h.code, isDay)}</span>
                                <span className="text-xs font-bold text-white">{Math.round(h.temp)}°</span>
                                <div className="flex flex-col items-center gap-0.5 mt-1 w-full">
                                    {h.precip > 0 && (
                                        <span className="text-[8px] font-bold text-blue-400">{h.precip}%</span>
                                    )}
                                    {h.uv > 0 && (
                                        <span className={`text-[8px] font-bold ${getUvColor(h.uv)}`}>UV {h.uv.toFixed(0)}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

export default WeatherWidget;
