import React from 'react';
import { 
  Sprout, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Thermometer, 
  Droplets, 
  FlaskConical, 
  CloudRain, 
  Atom, 
  CheckCircle, 
  Zap, 
  Scale, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function Home({ setActiveTab, onSelectPreset }) {
  const samplePresets = [
    {
      name: 'Rice (Monsoon Paddy)',
      badge: 'High Moisture & Rain',
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      data: { N: 90, P: 42, K: 43, temperature: 20.87, humidity: 82.0, ph: 6.5, rainfall: 202.9 }
    },
    {
      name: 'Wheat (Winter Cereal)',
      badge: 'Cool Temp & Moderate N',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      data: { N: 112, P: 50, K: 44, temperature: 20.5, humidity: 58.0, ph: 6.7, rainfall: 82.0 }
    },
    {
      name: 'Sugarcane (Tropical Cash)',
      badge: 'Heavy Feeder & High Rain',
      color: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
      data: { N: 145, P: 62, K: 105, temperature: 29.5, humidity: 78.0, ph: 6.8, rainfall: 195.0 }
    },
    {
      name: 'Chickpea (Dry Legume)',
      badge: 'Low Moisture & Neutral pH',
      color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
      data: { N: 40, P: 68, K: 79, temperature: 18.8, humidity: 16.8, ph: 7.3, rainfall: 79.5 }
    }
  ];

  const factors = [
    { name: 'Nitrogen (N)', unit: 'kg/ha', icon: Atom, desc: 'Essential for vegetative growth, leaves, and chlorophyl development.', range: '0 - 140' },
    { name: 'Phosphorus (P)', unit: 'kg/ha', icon: FlaskConical, desc: 'Stimulates root system formation, flowering, and seed production.', range: '5 - 145' },
    { name: 'Potassium (K)', unit: 'kg/ha', icon: Sparkles, desc: 'Regulates water retention, drought tolerance, and disease defense.', range: '5 - 205' },
    { name: 'Temperature', unit: '°C', icon: Thermometer, desc: 'Governs metabolic enzymes, seed germination, and photosynthetic rates.', range: '8°C - 44°C' },
    { name: 'Humidity', unit: '%', icon: Droplets, desc: 'Influences transpiration rates, moisture stress, and fungal viability.', range: '14% - 100%' },
    { name: 'Soil pH', unit: 'pH', icon: Scale, desc: 'Dictates nutrient solubility and mineral absorption efficiency.', range: '3.5 - 9.9' },
    { name: 'Rainfall', unit: 'mm', icon: CloudRain, desc: 'Annual precipitation determining groundwater hydrology and saturation.', range: '20 - 300 mm' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-8 overflow-hidden">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Machine Learning From Scratch — No Scikit-Learn Classifiers
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
            CROP <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">INTELLIGENCE</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-slate-300">
            Intelligent Crop Recommendation Engine Driven by Soil & Climatic Telemetry
          </p>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Predict the most ecologically and agronomically suitable crop for any farmland using mathematical implementations of 
            <span className="text-emerald-300 font-semibold"> Decision Tree</span> and 
            <span className="text-cyan-300 font-semibold"> K-Nearest Neighbors</span> built completely from first principles.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('predict')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Start Crop Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/60 hover:border-slate-600 transition-all duration-200"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Explore Model Benchmarks</span>
            </button>
          </div>
        </div>
      </section>

      {/* Preset Soil Profiles (Interactive Quick-Test) */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick-Test Archetypal Soil Presets
            </h2>
            <p className="text-xs text-slate-400">
              Select a pre-configured agro-climatic profile to immediately populate the prediction engine and run dual inference.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">28 Crop Classes Supported</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {samplePresets.map((preset, idx) => (
            <div
              key={idx}
              className="glass-card rounded-xl p-4 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.color}`}>
                  {preset.badge}
                </span>
                <h3 className="font-bold text-slate-200 text-sm mt-2">{preset.name}</h3>
                <div className="grid grid-cols-3 gap-1.5 mt-3 text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg">
                  <div>N: <span className="text-slate-200 font-semibold">{preset.data.N}</span></div>
                  <div>P: <span className="text-slate-200 font-semibold">{preset.data.P}</span></div>
                  <div>K: <span className="text-slate-200 font-semibold">{preset.data.K}</span></div>
                  <div>T: <span className="text-slate-200 font-semibold">{preset.data.temperature}°C</span></div>
                  <div>H: <span className="text-slate-200 font-semibold">{preset.data.humidity}%</span></div>
                  <div>R: <span className="text-slate-200 font-semibold">{preset.data.rainfall}</span></div>
                </div>
              </div>

              <button
                onClick={() => onSelectPreset(preset.data)}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 group-hover:border-emerald-500/50 transition-colors"
              >
                <span>Load & Recommend</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* The 7 Agro-Climatic Input Factors */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">The 7 Input Parameters</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-dimensional chemical and atmospheric features collected to capture the complete biological environment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {factors.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i} 
                className="glass-card rounded-xl p-5 border border-slate-800/80 hover:border-emerald-500/30 transition-all hover:bg-slate-800/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {f.unit}
                  </span>
                </div>
                <h3 className="font-bold text-slate-200 text-sm">{f.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Typical Range:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{f.range}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* The 2 ML Algorithms Implemented from Scratch */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model 1: Decision Tree */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">MODEL 1 — HIERARCHICAL RECURSION</span>
              <h3 className="text-lg font-bold text-white">Decision Tree Classifier</h3>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Constructed manually with pure NumPy arrays without relying on <code className="text-emerald-300">sklearn.tree</code>. Uses Gini Impurity and Entropy to locate the optimal feature split thresholds across multi-dimensional feature space.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gini impurity: $1 - \sum p_i^2$ & recursive best split</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Maximum depth & minimum sample split pruning</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Step-by-step human-readable decision path tracing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calculates relative feature importance by impurity drop</span>
            </li>
          </ul>
        </div>

        {/* Model 2: KNN */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">MODEL 2 — INSTANCE-BASED GEOMETRY</span>
              <h3 className="text-lg font-bold text-white">K-Nearest Neighbors Classifier</h3>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Instance-based learning algorithm built from scratch. Normalizes the 7 input features with a custom Min-Max scaler (fit strictly on training data) and calculates multi-dimensional Euclidean distances.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Euclidean metric: d(x, y) = &radic;&Sigma;(x_j - y_j)&sup2;</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Configurable K (default K=5) with deterministic voting</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Prevents data leakage with train-only fitted MinMax scaler</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Transparent retrieval of nearest training records & voting tallies</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
