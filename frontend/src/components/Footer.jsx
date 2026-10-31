import React from 'react';
import { ShieldAlert, Cpu, Database, Award } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-10 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200 text-sm">CROP INTELLIGENCE</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">v1.0</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Academic crop recommendation platform demonstrating high-performance Decision Tree and K-Nearest Neighbors classifiers engineered completely from scratch in Python with NumPy.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Core Architecture
          </h4>
          <ul className="space-y-1.5 text-[11px]">
            <li>Scratch Decision Tree (Gini / Entropy)</li>
            <li>Scratch KNN (Euclidean & MinMax Normalization)</li>
            <li>Zero scikit-learn model dependencies</li>
            <li>FastAPI backend & React dashboard</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Dataset Provenance
          </h4>
          <p className="text-[11px] leading-relaxed">
            Kaggle Crop Recommendation Benchmark. 2,800 records across 28 crop classes with 7 environmental & chemical soil parameters.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Academic Disclaimer
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-400">
            This platform is an educational machine-learning recommendation system. Field planting decisions should always consider local agricultural extension advice, pest advisories, and micro-climatic observations.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <p>© 2026 CROP INTELLIGENCE — Machine Learning Project.</p>
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('comparison')} className="hover:text-emerald-400 transition-colors">
            Benchmark Metrics
          </button>
          <span>•</span>
          <button onClick={() => setActiveTab('explanation')} className="hover:text-emerald-400 transition-colors">
            Model Explanations
          </button>
        </div>
      </div>
    </footer>
  );
}
