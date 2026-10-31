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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  GitCompare, 
  CheckCircle, 
  Layers, 
  Cpu, 
  TrendingUp, 
  Award, 
  Table, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ModelComparison() {
  const [evalData, setEvalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    async function loadEvaluation() {
      try {
        setIsLoading(true);
        const data = await api.getEvaluation();
        setEvalData(data);
        if (data.class_names && data.class_names.length > 0) {
          setSelectedCrop(data.class_names[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load model evaluation metrics');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvaluation();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center glass-panel rounded-2xl p-8 max-w-xl mx-auto border border-slate-800 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Loading Live Model Evaluation Metrics...</h3>
        <p className="text-xs text-slate-400">
          Querying backend for real-time benchmark scores, 5-fold cross-validation statistics, and confusion matrices.
        </p>
      </div>
    );
  }

  if (error || !evalData) {
    return (
      <div className="py-16 text-center glass-panel rounded-2xl p-8 max-w-xl mx-auto border border-rose-500/30 text-rose-300">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Evaluation Data Error</h3>
        <p className="text-xs mt-2">{error || 'Could not load benchmark metrics'}</p>
      </div>
    );
  }

  const dt = evalData.decision_tree;
  const knn = evalData.knn;

  // Comparison Bar Chart Data
  const chartData = [
    {
      metric: 'Accuracy',
      'Decision Tree': Number((dt.accuracy * 100).toFixed(2)),
      'KNN (K=5)': Number((knn.accuracy * 100).toFixed(2)),
    },
    {
      metric: 'Macro Precision',
      'Decision Tree': Number((dt.macro_precision * 100).toFixed(2)),
      'KNN (K=5)': Number((knn.macro_precision * 100).toFixed(2)),
    },
    {
      metric: 'Macro Recall',
      'Decision Tree': Number((dt.macro_recall * 100).toFixed(2)),
      'KNN (K=5)': Number((knn.macro_recall * 100).toFixed(2)),
    },
    {
      metric: 'Macro F1',
      'Decision Tree': Number((dt.macro_f1 * 100).toFixed(2)),
      'KNN (K=5)': Number((knn.macro_f1 * 100).toFixed(2)),
    }
  ];

  // Radar Data
  const radarData = [
    { subject: 'Accuracy', DT: dt.accuracy * 100, KNN: knn.accuracy * 100, fullMark: 100 },
    { subject: 'Precision', DT: dt.macro_precision * 100, KNN: knn.macro_precision * 100, fullMark: 100 },
    { subject: 'Recall', DT: dt.macro_recall * 100, KNN: knn.macro_recall * 100, fullMark: 100 },
    { subject: 'F1 Score', DT: dt.macro_f1 * 100, KNN: knn.macro_f1 * 100, fullMark: 100 },
    { subject: 'CV Mean', DT: dt.cross_validation.accuracy_mean * 100, KNN: knn.cross_validation.accuracy_mean * 100, fullMark: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Empirical Performance Benchmarking</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Model Comparison Dashboard</h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Quantitative side-by-side comparison between the from-scratch 
          <span className="text-emerald-300 font-semibold"> Decision Tree Classifier</span> and 
          <span className="text-blue-300 font-semibold"> K-Nearest Neighbors Classifier</span> evaluated on an identical 80/20 stratified test split ({evalData.test_samples} test records across {evalData.num_classes} classes).
        </p>
      </div>

      {/* Top Benchmark Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Accuracy</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">Decision Tree:</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">{(dt.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">KNN (K=5):</span>
              <span className="text-lg font-extrabold text-blue-400 font-mono">{(knn.accuracy * 100).toFixed(2)}%</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block pt-1 border-t border-slate-800/80">
            Winner: <strong className="text-slate-200">{dt.accuracy >= knn.accuracy ? 'Decision Tree' : 'KNN'}</strong>
          </span>
        </div>

        {/* Macro Precision */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Macro Precision</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">Decision Tree:</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">{(dt.macro_precision * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">KNN (K=5):</span>
              <span className="text-lg font-extrabold text-blue-400 font-mono">{(knn.macro_precision * 100).toFixed(2)}%</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block pt-1 border-t border-slate-800/80">
            Unweighted average across {evalData.class_names?.length || 28} classes
          </span>
        </div>

        {/* Macro Recall */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Macro Recall</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">Decision Tree:</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">{(dt.macro_recall * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">KNN (K=5):</span>
              <span className="text-lg font-extrabold text-blue-400 font-mono">{(knn.macro_recall * 100).toFixed(2)}%</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block pt-1 border-t border-slate-800/80">
            True positive coverage rate
          </span>
        </div>

        {/* Macro F1 Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Macro F1 Score</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">Decision Tree:</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">{(dt.macro_f1 * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-300">KNN (K=5):</span>
              <span className="text-lg font-extrabold text-blue-400 font-mono">{(knn.macro_f1 * 100).toFixed(2)}%</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block pt-1 border-t border-slate-800/80">
            Harmonic mean of precision & recall
          </span>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Benchmark Score Comparison (%)</span>
          </h3>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[80, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val}%`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="Decision Tree" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="KNN (K=5)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Multi-Axis Competence</span>
          </h3>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[85, 100]} stroke="#475569" />
                <Radar name="Decision Tree" dataKey="DT" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Radar name="KNN (K=5)" dataKey="KNN" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Legend wrapperStyle={{ paddingTop: 5 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${Number(val).toFixed(2)}%`, '']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Manual 5-Fold Cross Validation Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-400" />
              <span>5-Fold Stratified Cross-Validation (K=5)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across 5 non-overlapping stratified folds. Confirms generalization stability across unseen splits.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
            Folds: 5 | Seed: 42
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <th className="py-3 px-4 font-semibold">Algorithm</th>
                <th className="py-3 px-4 font-semibold">Fold 1</th>
                <th className="py-3 px-4 font-semibold">Fold 2</th>
                <th className="py-3 px-4 font-semibold">Fold 3</th>
                <th className="py-3 px-4 font-semibold">Fold 4</th>
                <th className="py-3 px-4 font-semibold">Fold 5</th>
                <th className="py-3 px-4 font-semibold text-emerald-400">Mean Accuracy ± Std</th>
                <th className="py-3 px-4 font-semibold text-cyan-400">Mean Macro F1 ± Std</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-sans font-bold text-emerald-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Decision Tree (Scratch)
                </td>
                {dt.cross_validation.fold_accuracies?.map((acc, i) => (
                  <td key={i} className="py-3 px-4 text-slate-300">{(acc * 100).toFixed(2)}%</td>
                ))}
                <td className="py-3 px-4 font-bold text-emerald-400">
                  {(dt.cross_validation.accuracy_mean * 100).toFixed(2)}% ± {(dt.cross_validation.accuracy_std * 100).toFixed(2)}%
                </td>
                <td className="py-3 px-4 font-bold text-cyan-400">
                  {(dt.cross_validation.macro_f1_mean * 100).toFixed(2)}% ± {(dt.cross_validation.macro_f1_std * 100).toFixed(2)}%
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-sans font-bold text-blue-300 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" />
                  KNN Classifier (Scratch, K=5)
                </td>
                {knn.cross_validation.fold_accuracies?.map((acc, i) => (
                  <td key={i} className="py-3 px-4 text-slate-300">{(acc * 100).toFixed(2)}%</td>
                ))}
                <td className="py-3 px-4 font-bold text-emerald-400">
                  {(knn.cross_validation.accuracy_mean * 100).toFixed(2)}% ± {(knn.cross_validation.accuracy_std * 100).toFixed(2)}%
                </td>
                <td className="py-3 px-4 font-bold text-cyan-400">
                  {(knn.cross_validation.macro_f1_mean * 100).toFixed(2)}% ± {(knn.cross_validation.macro_f1_std * 100).toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Class Evaluation Metrics Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Class-Specific Performance Inspector</h3>
            <p className="text-xs text-slate-400">Inspect precision, recall, and support for any of the {evalData.class_names?.length || 28} individual crop types.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Crop:</label>
            <select
              value={selectedCrop || ''}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 capitalize font-medium focus:outline-none focus:border-emerald-500"
            >
              {evalData.class_names?.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCrop && dt.per_class[selectedCrop] && knn.per_class[selectedCrop] && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400">Decision Tree — {selectedCrop.toUpperCase()}</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 text-slate-300">
                <div className="bg-slate-950 p-2 rounded">
                  <span className="text-[10px] text-slate-500 block">Precision</span>
                  <span className="font-bold text-emerald-300">{(dt.per_class[selectedCrop].precision * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded">
                  <span className="text-[10px] text-slate-500 block">Recall</span>
                  <span className="font-bold text-emerald-300">{(dt.per_class[selectedCrop].recall * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded">
                  <span className="text-[10px] text-slate-500 block">F1-Score</span>
                  <span className="font-bold text-emerald-300">{(dt.per_class[selectedCrop].f1_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-blue-400">KNN (K=5) — {selectedCrop.toUpperCase()}</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 text-slate-300">
                <div className="bg-slate-950 p-2 rounded">
                  <span className="text-[10px] text-slate-500 block">Precision</span>
                  <span className="font-bold text-blue-300">{(knn.per_class[selectedCrop].precision * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded">
                  <span className="text-[10px] text-slate-500 block">Recall</span>
                  <span className="font-bold text-blue-300">{(knn.per_class[selectedCrop].recall * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded">
                  <span className="text-[10px] text-slate-500 block">F1-Score</span>
                  <span className="font-bold text-blue-300">{(knn.per_class[selectedCrop].f1_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
