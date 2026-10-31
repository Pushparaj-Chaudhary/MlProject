import React, { useState } from 'react';
import { 
  Binary, 
  GitFork, 
  Network, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X, 
  HelpCircle, 
  Compass, 
  Layers, 
  Cpu, 
  Sparkles,
  ArrowDown
} from 'lucide-react';

export default function ModelExplanation({ result, formData }) {
  const [activeModelTab, setActiveModelTab] = useState('tree');

  const dt = result?.decision_tree;
  const knn = result?.knn;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Binary className="w-3.5 h-3.5" />
          <span>Academic Viva & Mathematical Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Model Mechanics & Prediction Tracing</h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Step-by-step visualization demonstrating how each from-scratch algorithm processed the user's specific inputs:
          the Decision Tree's recursive split path vs the K-Nearest Neighbors' Euclidean proximity sphere.
        </p>
      </div>

      {/* Algorithm Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveModelTab('tree')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeModelTab === 'tree'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <GitFork className="w-4 h-4 text-emerald-400" />
          <span>Decision Tree: Hierarchical Decision Traversal</span>
        </button>

        <button
          onClick={() => setActiveModelTab('knn')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeModelTab === 'knn'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Network className="w-4 h-4 text-blue-400" />
          <span>KNN: Normalized Euclidean Neighbors (K={knn?.k || 5})</span>
        </button>
      </div>

      {/* Model 1: Decision Tree Path Explainer */}
      {activeModelTab === 'tree' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-emerald-400" />
                  <span>Decision Path Trace (Root to Leaf)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  At each node, the feature is evaluated against the Gini-optimal threshold. The input vector is routed left or right until a terminal leaf node is reached.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                Terminal Leaf: <span className="capitalize">{dt?.predicted_crop || 'None'}</span> ({dt?.confidence_percent || 0}%)
              </div>
            </div>

            {/* Path Steps Visualizer */}
            {dt?.decision_path && dt.decision_path.length > 0 ? (
              <div className="space-y-3 pt-4">
                {dt.decision_path.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Line connector */}
                    {idx < dt.decision_path.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800 -mb-4 z-0" />
                    )}

                    {/* Step number circle */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border ${
                      step.satisfied 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Step details card */}
                    <div className="flex-1 glass-card p-4 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white capitalize">{step.feature}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                            Depth: {step.depth}
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          step.satisfied 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          Condition {step.satisfied ? 'Satisfied (<=)' : 'Not Satisfied (>)'} → Branch {step.direction}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg text-slate-300">
                        <div>Split Test: <strong className="text-slate-200">{step.condition}</strong></div>
                        <div>Input Value: <strong className="text-emerald-400">{step.actual_value}</strong></div>
                        <div>Node Impurity (Gini): <span className="text-slate-400">{step.impurity}</span></div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Final Leaf Node */}
                <div className="relative flex items-start gap-4 pt-2">
                  <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-lg shadow-emerald-500/30">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="flex-1 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Terminal Prediction Leaf</span>
                      <span className="text-xs font-mono font-bold text-emerald-300">Samples: {dt?.leaf_samples}</span>
                    </div>
                    <h4 className="text-xl font-black text-white capitalize font-sans">{dt?.predicted_crop}</h4>
                    <p className="text-xs text-slate-400">
                      Leaf node purity: 100% of training instances falling into this node belong to '{dt?.predicted_crop}'.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active decision path. Run a crop prediction first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Model 2: KNN Nearest Neighbors Explainer */}
      {activeModelTab === 'knn' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-400" />
                  <span>Euclidean Geometry & Nearest Training Neighbors</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Features were normalized with the train-fitted Min-Max Scaler: x_norm = (x - min) / (max - min).
                  Distances to all 1,760 training samples were calculated, and the K={knn?.k || 5} closest points voted.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold">
                Selected Class: <span className="capitalize">{knn?.predicted_crop || 'None'}</span> ({knn?.confidence_percent || 0}%)
              </div>
            </div>

            {/* Voting Distribution Rationale */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300">Majority Voting Mechanics:</span>
              <p className="text-slate-400 leading-relaxed font-mono">
                {knn?.confidence_explanation || 'No KNN explanation available yet.'}
              </p>
            </div>

            {/* Nearest Neighbors Cards */}
            {knn?.nearest_neighbors && knn.nearest_neighbors.length > 0 ? (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Top {knn.nearest_neighbors.length} Closest Training Instances:
                </span>

                <div className="grid grid-cols-1 gap-3">
                  {knn.nearest_neighbors.map((nb) => (
                    <div 
                      key={nb.rank}
                      className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-bold flex items-center justify-center text-xs">
                          #{nb.rank}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-200 capitalize text-sm">{nb.crop_label}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                              Dist: {nb.distance}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">Historical Training Record</span>
                        </div>
                      </div>

                      {/* Raw features breakdown */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg">
                        {Object.entries(nb.raw_features).map(([f, val]) => (
                          <span key={f} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {f}: <strong className="text-slate-200">{val}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Run prediction to populate neighbor telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
