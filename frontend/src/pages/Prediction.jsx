import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Atom, 
  FlaskConical, 
  Thermometer, 
  Droplets, 
  Scale, 
  CloudRain,
  ChevronRight
} from 'lucide-react';

export default function Prediction({
  formData,
  setFormData,
  onPredict,
  isLoading,
  error
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const inputConfigs = [
    {
      id: 'N',
      label: 'Nitrogen (N)',
      unit: 'kg/ha',
      min: 0,
      max: 140,
      step: 1,
      icon: Atom,
      color: 'text-blue-400',
      tooltip: 'Essential macro-nutrient for vegetative foliage growth, leafy mass, and chlorophyll synthesis.',
      agriAdvice: 'Paddy & Cotton require high N (>70); Legumes like Chickpea require lower N (20-40) due to biological nitrogen fixation.'
    },
    {
      id: 'P',
      label: 'Phosphorus (P)',
      unit: 'kg/ha',
      min: 5,
      max: 145,
      step: 1,
      icon: FlaskConical,
      color: 'text-emerald-400',
      tooltip: 'Promotes root elongation, early seedling vigor, bloom induction, and fruit maturation.',
      agriAdvice: 'Pulses, Apple and Grapes demand elevated Phosphorus levels (>60 kg/ha).'
    },
    {
      id: 'K',
      label: 'Potassium (K)',
      unit: 'kg/ha',
      min: 5,
      max: 205,
      step: 1,
      icon: Sparkles,
      color: 'text-amber-400',
      tooltip: 'Controls plant stomatal transpiration, cellular osmotic potential, and disease immunity.',
      agriAdvice: 'Grapes and Apples exhibit extreme Potassium requirements (190-205 kg/ha).'
    },
    {
      id: 'temperature',
      label: 'Ambient Temperature',
      unit: '°C',
      min: 8.0,
      max: 45.0,
      step: 0.1,
      icon: Thermometer,
      color: 'text-rose-400',
      tooltip: 'Average ambient daytime temperature of the cultivating geographical zone.',
      agriAdvice: 'Rice and Papaya favor 22°C–32°C; Grapes and Pomegranates handle wide variations.'
    },
    {
      id: 'humidity',
      label: 'Relative Humidity',
      unit: '%',
      min: 14.0,
      max: 100.0,
      step: 0.1,
      icon: Droplets,
      color: 'text-cyan-400',
      tooltip: 'Atmospheric moisture percentage around the agricultural canopy.',
      agriAdvice: 'Rice, Coconut & Jute need high humidity (>80%); Chickpea demands arid air (<30%).'
    },
    {
      id: 'ph',
      label: 'Soil pH Level',
      unit: 'pH',
      min: 3.5,
      max: 9.9,
      step: 0.05,
      icon: Scale,
      color: 'text-violet-400',
      tooltip: 'Measure of soil acidity or alkalinity affecting bio-availability of essential minerals.',
      agriAdvice: '6.0 to 7.2 is optimal for general crops; Tea/Coffee favor mild acidity.'
    },
    {
      id: 'rainfall',
      label: 'Annual Rainfall',
      unit: 'mm',
      min: 20.0,
      max: 300.0,
      step: 0.5,
      icon: CloudRain,
      color: 'text-sky-400',
      tooltip: 'Mean annual precipitation or equivalent irrigation water depth in millimeters.',
      agriAdvice: 'Rice requires 200–300 mm; Muskmelon & Chickpea survive on under 80 mm.'
    }
  ];

  const presets = [
    { name: 'Rice (Monsoon)', data: { N: 90, P: 42, K: 43, temperature: 20.9, humidity: 82.0, ph: 6.5, rainfall: 202.9 } },
    { name: 'Wheat (Winter Cereal)', data: { N: 112, P: 50, K: 44, temperature: 20.5, humidity: 58.0, ph: 6.7, rainfall: 82.0 } },
    { name: 'Sugarcane (Tropical Cash)', data: { N: 145, P: 62, K: 105, temperature: 29.5, humidity: 78.0, ph: 6.8, rainfall: 195.0 } },
    { name: 'Apple (Temperate)', data: { N: 20, P: 135, K: 198, temperature: 22.5, humidity: 92.3, ph: 5.9, rainfall: 110.0 } },
    { name: 'Coffee (Highland)', data: { N: 100, P: 25, K: 30, temperature: 24.5, humidity: 62.0, ph: 6.7, rainfall: 170.0 } },
    { name: 'Chickpea (Arid)', data: { N: 40, P: 68, K: 79, temperature: 18.8, humidity: 16.8, ph: 7.3, rainfall: 79.5 } },
    { name: 'Watermelon (Warm Sand)', data: { N: 100, P: 18, K: 50, temperature: 26.0, humidity: 85.0, ph: 6.5, rainfall: 50.0 } },
    { name: 'Cotton (Subtropical)', data: { N: 118, P: 48, K: 20, temperature: 24.8, humidity: 80.2, ph: 6.8, rainfall: 80.0 } },
  ];

  const handleChange = (field, val) => {
    const num = parseFloat(val);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  const handleReset = () => {
    setFormData({
      N: 90,
      P: 42,
      K: 43,
      temperature: 25.6,
      humidity: 80.0,
      ph: 6.5,
      rainfall: 200.0
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(formData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Soil & Environmental Profiler</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Crop Recommendation Analysis</h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Input your soil chemistry metrics and regional meteorological data. The system executes simultaneous inference across the from-scratch 
          <span className="text-emerald-300 font-semibold"> Decision Tree</span> and 
          <span className="text-cyan-300 font-semibold"> K-Nearest Neighbors</span> classifiers to deliver a validated recommendation.
        </p>
      </div>

      {/* Quick Load Presets Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
          <span className="text-xs font-bold text-slate-300">Quick-Load Demonstrator Presets:</span>
          <span className="text-[11px] text-slate-500">Click to instantly populate calibrated real-world conditions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setFormData(preset.data)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
            >
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prediction Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-base font-bold text-slate-200">Environmental & Soil Metrics (7 Parameters)</h2>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {inputConfigs.map((config) => {
            const Icon = config.icon;
            const val = formData[config.id] ?? 0;
            const isHovered = activeTooltip === config.id;

            return (
              <div 
                key={config.id} 
                className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/70 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <label htmlFor={config.id} className="text-xs font-semibold text-slate-200">
                      {config.label}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setActiveTooltip(config.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="text-slate-500 hover:text-slate-300"
                        title={config.tooltip}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      {isHovered && (
                        <div className="absolute z-20 left-0 bottom-full mb-2 w-64 p-2.5 rounded-lg bg-slate-800 text-[11px] text-slate-200 shadow-xl border border-slate-700 pointer-events-none leading-relaxed">
                          <p className="font-semibold text-emerald-400 mb-1">{config.label}</p>
                          <p className="text-slate-300">{config.tooltip}</p>
                          <p className="mt-1 text-[10px] text-slate-400 italic">{config.agriAdvice}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      id={config.id}
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={val}
                      onChange={(e) => handleChange(config.id, e.target.value)}
                      className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right text-xs font-mono font-semibold text-emerald-300 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-12 text-left">
                      {config.unit}
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="pt-2">
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={val}
                    onChange={(e) => handleChange(config.id, e.target.value)}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>Min: {config.min}</span>
                    <span>Max: {config.max}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Dual inference: Decision Tree & K-Nearest Neighbors</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Executing Mathematical Pipeline...</span>
              </>
            ) : (
              <>
                <span>Analyze Conditions</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
