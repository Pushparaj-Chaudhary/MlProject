import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import { 
  BarChart3, 
  Layers, 
  CheckCircle, 
  Sparkles, 
  Droplets, 
  Flame, 
  Scale, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function DatasetAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState('npk');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [analyticsRes, statsRes] = await Promise.all([
          api.getAnalytics(),
          api.getDatasetStats()
        ]);
        setAnalytics(analyticsRes);
        setStats(statsRes);
      } catch (err) {
        setError(err.message || 'Failed to load dataset analytics');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);


  if (isLoading) {
    return (
      <div className="py-24 text-center glass-panel rounded-2xl p-8 max-w-xl mx-auto border border-slate-800 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Aggregating Dataset Analytics...</h3>
        <p className="text-xs text-slate-400">
          Calculating statistical moments, correlation tensors, and agronomic distributions.
        </p>
      </div>
    );
  }

  if (error || !analytics || !stats) {
    return (
      <div className="py-16 text-center glass-panel rounded-2xl p-8 max-w-xl mx-auto border border-rose-500/30 text-rose-300">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Analytics Load Failure</h3>
        <p className="text-xs mt-2">{error || 'Could not fetch dataset stats'}</p>
      </div>
    );
  }

  const cropAverages = stats.crop_averages || [];
  const featureStats = stats.feature_stats || {};
  const corrMatrix = stats.correlation_matrix || {};

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Agricultural Telemetry & Crop Science</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dataset Analytics & Feature Distributions</h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          In-depth exploratory analysis of the Crop Recommendation benchmark. Demonstrating verified data cleanliness, statistical variance, correlation coefficients, and feature telemetry across all {analytics.num_classes || 28} crop classes.
        </p>
      </div>

      {/* Primary Dataset Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total Records</span>
          <span className="text-2xl font-black text-white font-mono">{analytics.total_records}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">100 / Class (Balanced)</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Target Classes</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">{analytics.num_classes}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Unique Crops</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Input Features</span>
          <span className="text-2xl font-black text-cyan-400 font-mono">{analytics.features?.length || 7}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Continuous Numeric</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Missing (NaN)</span>
          <span className="text-2xl font-black text-teal-400 font-mono">{analytics.null_values}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">100% Clean</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Duplicates</span>
          <span className="text-2xl font-black text-violet-400 font-mono">{analytics.duplicate_records}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Zero Redundancy</span>
        </div>
      </div>



      {/* Key Agronomic Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Key Agronomic Extremes & Biological Insights</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.insights.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  {item.title}
                </span>
                <div className="flex items-baseline justify-between">
                  <h4 className="font-bold text-slate-100 capitalize text-sm">{item.crop}</h4>
                  <span className="font-mono text-xs font-bold text-emerald-400">{item.value}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Crop Average Charts */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Mean Requirements by Crop Variety</h3>
            <p className="text-xs text-slate-400">Comparing soil chemistry vs atmospheric demands across all {cropAverages.length || analytics.num_classes || 28} crop classes.</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMetricTab('npk')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeMetricTab === 'npk' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Soil N-P-K Nutrients
            </button>
            <button
              onClick={() => setActiveMetricTab('climatic')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeMetricTab === 'climatic' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rainfall & Temperature
            </button>
          </div>
        </div>

        <div className="h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetricTab === 'npk' ? (
              <BarChart data={cropAverages} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="label" stroke="#94a3b8" angle={-45} textAnchor="end" interval={0} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 15 }} />
                <Bar dataKey="N" name="Nitrogen (N)" fill="#3b82f6" />
                <Bar dataKey="P" name="Phosphorus (P)" fill="#10b981" />
                <Bar dataKey="K" name="Potassium (K)" fill="#f59e0b" />
              </BarChart>
            ) : (
              <BarChart data={cropAverages} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="label" stroke="#94a3b8" angle={-45} textAnchor="end" interval={0} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 15 }} />
                <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#0284c7" />
                <Bar dataKey="temperature" name="Temperature (°C)" fill="#ef4444" />
                <Bar dataKey="humidity" name="Humidity (%)" fill="#10b981" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Distribution Summary Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Descriptive Statistical Distributions (Moments)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-sans">
                <th className="py-3 px-4 font-semibold">Feature</th>
                <th className="py-3 px-4 font-semibold">Mean</th>
                <th className="py-3 px-4 font-semibold">Std Dev</th>
                <th className="py-3 px-4 font-semibold">Min</th>
                <th className="py-3 px-4 font-semibold">25% (Q1)</th>
                <th className="py-3 px-4 font-semibold">50% (Median)</th>
                <th className="py-3 px-4 font-semibold">75% (Q3)</th>
                <th className="py-3 px-4 font-semibold">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Object.entries(featureStats).map(([feat, s]) => (
                <tr key={feat} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-4 font-sans font-bold text-slate-200 capitalize">{feat}</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">{s.mean}</td>
                  <td className="py-2.5 px-4 text-slate-400">{s.std}</td>
                  <td className="py-2.5 px-4 text-slate-400">{s.min}</td>
                  <td className="py-2.5 px-4 text-slate-400">{s.q25}</td>
                  <td className="py-2.5 px-4 text-slate-300 font-semibold">{s.median}</td>
                  <td className="py-2.5 px-4 text-slate-400">{s.q75}</td>
                  <td className="py-2.5 px-4 text-slate-300">{s.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Heatmap Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Pearson Correlation Matrix Heatmap</h3>
          <p className="text-xs text-slate-400">
            Pairwise linear correlation coefficients between continuous soil and climatic parameters.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="bg-slate-900 text-slate-300 font-sans border-b border-slate-800">
                  <th className="py-2.5 px-3 text-left">Feature</th>
                  {Object.keys(corrMatrix).map((col) => (
                    <th key={col} className="py-2.5 px-2 capitalize">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(corrMatrix).map(([rowFeat, cols]) => (
                  <tr key={rowFeat}>
                    <td className="py-2.5 px-3 text-left font-sans font-semibold text-slate-300 capitalize bg-slate-900/60">
                      {rowFeat}
                    </td>
                    {Object.entries(cols).map(([colFeat, val]) => {
                      const num = Number(val);
                      let cellBg = 'bg-slate-900/30';
                      let textColor = 'text-slate-400';
                      if (num === 1.0) {
                        cellBg = 'bg-slate-800 text-slate-100 font-bold';
                      } else if (num > 0.4) {
                        cellBg = 'bg-emerald-500/20 text-emerald-300 font-bold';
                      } else if (num < -0.2) {
                        cellBg = 'bg-rose-500/20 text-rose-300 font-bold';
                      }
                      return (
                        <td key={colFeat} className={`py-2 px-2 ${cellBg} ${textColor}`}>
                          {num.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>



    </div>
  );
}
