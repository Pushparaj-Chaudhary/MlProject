import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  TreePine, 
  Cpu, 
  Award, 
  Compass, 
  Droplet, 
  Thermometer, 
  Scale, 
  CloudRain, 
  Activity,
  Layers,
  ChevronRight,
  Sprout,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Bug,
  Sparkles,
  Info,
  FlaskConical,
  Database
} from 'lucide-react';
import { CROP_DETAILS } from '../data/cropDetails';
import { api } from '../services/api';

export default function Results({ result, formData, setActiveTab }) {

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center glass-panel rounded-2xl p-8 border border-slate-800">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white">No Prediction Generated Yet</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Please navigate to the Crop Prediction tab and click "Analyze Conditions" to generate a live recommendation.
        </p>
        <button
          onClick={() => setActiveTab('predict')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
        >
          <span>Go to Prediction Form</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const {
    recommended_crop,
    models_agree,
    agreement_message,
    decision_tree,
    knn,
    top_predictions,
    confidence_explanation,
    input_summary,
    fertilizer_recommendation,
    irrigation_advisory,
    yield_projection
  } = result;


  const [activeDossierCrop, setActiveDossierCrop] = useState(recommended_crop.toLowerCase());
  const cropInfo = CROP_DETAILS[activeDossierCrop] || CROP_DETAILS[recommended_crop.toLowerCase()];


  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            INFERENCE REPORT & VERIFICATION
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Agricultural Recommendation</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('predict')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Test New Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('explanation')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Visual Model Trace</span>
          </button>
        </div>
      </div>

      {/* Main Recommended Crop Hero Card */}
      <div className="glass-panel rounded-3xl p-8 border border-emerald-500/40 glow-emerald relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RECOMMENDED CROP
              </span>
              {/* Model Agreement Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                models_agree 
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {models_agree ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{models_agree ? 'Models Agree (Consensus)' : 'Distinct Inductive Biases'}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <h2 className="text-5xl sm:text-6xl font-black capitalize tracking-tight text-white font-sans">
                {recommended_crop}
              </h2>
            </div>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Based on the 7 environmental and chemical parameters supplied, <strong className="text-emerald-300 capitalize">{recommended_crop}</strong> delivers the maximum ecological viability and historical yields.
            </p>
          </div>

          <div className="w-full md:w-auto bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Mathematical Confidence Breakdown
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-300">Decision Tree Confidence:</span>
                <span className="font-mono font-bold text-emerald-400">{decision_tree.confidence_percent}%</span>
              </div>
              <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${decision_tree.confidence_percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-6 pt-1">
                <span className="text-slate-300">KNN (K={knn.k}) Confidence:</span>
                <span className="font-mono font-bold text-blue-400">{knn.confidence_percent}%</span>
              </div>
              <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${knn.confidence_percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fertilizer Prescription Card (Trained on Kaggle Fertilizer Prediction Dataset) */}
      {fertilizer_recommendation && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  SOIL NUTRIENT INTERVENTION & ADVISORY
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Prescribed Fertilizer:</span>
                  <span className="px-3 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold border border-teal-500/40 text-base">
                    {fertilizer_recommendation.recommended_fertilizer}
                  </span>
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-mono">Nutrient Grade</span>
              <span className="text-xs font-bold text-slate-200">{fertilizer_recommendation.grade}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Nutrient Role</span>
              <p className="text-xs font-semibold text-emerald-300">{fertilizer_recommendation.target_nutrient}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {fertilizer_recommendation.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Soil Condition Diagnosis</span>
              {fertilizer_recommendation.diagnosis && fertilizer_recommendation.diagnosis.length > 0 ? (
                <ul className="text-[11px] text-slate-300 space-y-1">
                  {fertilizer_recommendation.diagnosis.map((diag, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{diag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-400">NPK levels are within balanced agronomic margins.</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Protocol</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {fertilizer_recommendation.application_tips}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Precision Irrigation & Water Demand (DATASET - Sheet1.csv — 2,880 records) */}
      {irrigation_advisory && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  PRECISION WATER MANAGEMENT (DATASET - SHEET1.CSV — 2,880 RECORDS)
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Daily Crop Water Demand:</span>
                  <span className="px-3 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-extrabold border border-blue-500/40 text-base">
                    {irrigation_advisory.daily_water_mm} mm / day
                  </span>
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-mono">Volumetric Requirement</span>
              <span className="text-xs font-bold text-cyan-300">
                {irrigation_advisory.liters_per_hectare_day?.toLocaleString()} L / ha / day
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended Irrigation Delivery</span>
              <p className="text-xs font-semibold text-blue-300">{irrigation_advisory.recommended_system}</p>
              <div className="text-[11px] text-slate-400 pt-1 space-y-1">
                <div><strong>System Efficiency:</strong> {irrigation_advisory.water_use_efficiency}</div>
                <div><strong>Evapotranspiration Index:</strong> {irrigation_advisory.evapotranspiration_index}x</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduling & Frequency</span>
              <p className="text-xs font-bold text-slate-200">{irrigation_advisory.recommended_frequency}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {irrigation_advisory.irrigation_note}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Critical Stage Timing</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {irrigation_advisory.critical_timing}
              </p>
              <div className="pt-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  irrigation_advisory.irrigation_status.includes('High')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {irrigation_advisory.irrigation_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global FAO Yield Forecast & Seedling Viability (yield_df.csv & cropdata_updated.csv — 45k+ records) */}
      {yield_projection && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-violet-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  GLOBAL FAO BENCHMARK & SEEDLING VIABILITY (YIELD_DF.CSV & CROPDATA_UPDATED.CSV)
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Projected Empirical Yield:</span>
                  <span className="px-3 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 font-extrabold border border-violet-500/40 text-base">
                    {yield_projection.projected_yield_tonnes_ha} t / ha
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({yield_projection.projected_yield_quintals_ha} Quintals / ha)
                  </span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                yield_projection.yield_variance_vs_india_pct >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {yield_projection.yield_variance_vs_india_pct >= 0 ? '+' : ''}{yield_projection.yield_variance_vs_india_pct}% vs India Avg
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Benchmark Comparisons</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">India Average:</span>
                  <span className="font-mono font-bold text-slate-200">{yield_projection.india_average_yield_tonnes} tonnes/ha</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Global FAO Average:</span>
                  <span className="font-mono font-bold text-slate-200">{yield_projection.global_average_yield_tonnes} tonnes/ha</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">FAO Crop Group:</span>
                  <span className="font-mono text-violet-300 text-[11px]">{yield_projection.fao_benchmark_crop}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Seedling Stage Moisture Viability
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">{yield_projection.seedling_viability_status}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{yield_projection.seedling_viability_score}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                <div 
                  className="bg-emerald-400 h-full rounded-full" 
                  style={{ width: `${yield_projection.seedling_viability_score}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block pt-1">
                Estimated Soil Moisture Index (MOI): <strong>{yield_projection.estimated_soil_moisture_index}%</strong>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Agronomic Management Advice
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {yield_projection.seedling_management_advice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Agronomic Dossier & Crop Details */}


      {cropInfo && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                  {cropInfo.category}
                </span>
                <span className="text-xs text-slate-400 font-mono italic">
                  Family: {cropInfo.family}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white capitalize flex items-center gap-2">
                <span>{cropInfo.name}</span>
                <span className="text-sm font-normal text-slate-400 italic">({cropInfo.scientificName})</span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-400/90 mt-1">{cropInfo.tagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Inspecting Dossier:</span>
              <span className="text-xs font-bold text-white capitalize bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                {cropInfo.name}
              </span>
            </div>
          </div>

          {/* Quick Agronomic Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Cultivation Season</span>
              </div>
              <p className="text-sm font-bold text-slate-200">{cropInfo.season}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Growth Duration</span>
              </div>
              <p className="text-sm font-bold text-slate-200">{cropInfo.duration}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Droplet className="w-4 h-4 text-blue-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Water Requirement</span>
              </div>
              <p className="text-sm font-bold text-slate-200">{cropInfo.waterNeed}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Yield Potential</span>
              </div>
              <p className="text-sm font-bold text-slate-200">{cropInfo.yieldPotential}</p>
            </div>
          </div>

          {/* Cultivation Guides & Practices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Soil Preference & Land Preparation</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cropInfo.soilPreference}</p>
              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <div><strong>Sowing Practice:</strong> {cropInfo.sowingMethod}</div>
                <div><strong>Harvesting Signs:</strong> {cropInfo.harvestingMethod}</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Fertilizer & NPK Nutrient Advisory</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cropInfo.fertilizerSchedule}</p>
              <div className="flex items-center gap-2 pt-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-950 text-blue-400 font-bold border border-slate-800">
                  Target N: {cropInfo.npkGuide?.N}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-bold border border-slate-800">
                  Target P: {cropInfo.npkGuide?.P}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-bold border border-slate-800">
                  Target K: {cropInfo.npkGuide?.K}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-400" />
                <span>Integrated Pest & Disease Management</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cropInfo.pestManagement}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Commercial Outlook & Economic Viability</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cropInfo.marketDemand}</p>
            </div>
          </div>
        </div>
      )}


      {/* Top 3 Alternative Candidates with Interactive Dossier Switcher */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Top Mathematical Crop Candidates</span>
          </h3>
          <span className="text-[11px] text-slate-400">Click any crop below to view its complete agronomic dossier above</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top_predictions.map((item, idx) => {
            const isSelected = activeDossierCrop === item.crop.toLowerCase();
            return (
              <div 
                key={idx}
                onClick={() => setActiveDossierCrop(item.crop.toLowerCase())}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : idx === 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Rank #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.round(item.combined_confidence * 100)}%
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-100 capitalize mt-1 flex items-center justify-between">
                  <span>{item.crop}</span>
                  {isSelected && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono">Active Dossier</span>}
                </h4>
                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>DT Confidence:</span>
                    <span className="font-mono text-slate-200">{Math.round(item.dt_confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KNN Confidence:</span>
                    <span className="font-mono text-slate-200">{Math.round(item.knn_confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Models Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model 1: Decision Tree Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Decision Tree Classifier</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Gini Impurity
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Predicted Crop:</span>
              <span className="font-bold text-slate-100 capitalize">{decision_tree.predicted_crop}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Leaf Node Purity:</span>
              <span className="font-mono font-bold text-emerald-400">{decision_tree.confidence_percent}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Leaf Training Samples:</span>
              <span className="font-mono text-slate-300">{decision_tree.leaf_samples} samples</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Decision Nodes Traversed:</span>
              <span className="font-mono text-slate-300">{decision_tree.decision_path.length} splits</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300">Terminal Decision Node:</span>
            <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
              {decision_tree.decision_path.length > 0 ? (
                <>
                  <span className="text-emerald-400">{decision_tree.decision_path[decision_tree.decision_path.length - 1].condition}</span>
                  {' '}— actual value: <span className="text-slate-200">{decision_tree.decision_path[decision_tree.decision_path.length - 1].actual_value}</span>
                </>
              ) : 'Direct leaf assignment'}
            </div>
          </div>
        </div>

        {/* Model 2: KNN Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">K-Nearest Neighbors</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              Euclidean Metric (K={knn.k})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Predicted Crop:</span>
              <span className="font-bold text-slate-100 capitalize">{knn.predicted_crop}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Voting Proportion:</span>
              <span className="font-mono font-bold text-blue-400">{knn.confidence_percent}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">K Nearest Parameter:</span>
              <span className="font-mono text-slate-300">K = {knn.k} instances</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Nearest Distance:</span>
              <span className="font-mono text-slate-300">
                {knn.nearest_neighbors?.[0]?.distance ? `${knn.nearest_neighbors[0].distance}` : 'Computed'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300">Voting Rationale:</span>
            <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
              {knn.confidence_explanation}
            </div>
          </div>
        </div>
      </div>

      {/* Summary of User Inputs & Environmental Profile */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Analyzed Environmental & Soil Profile</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Nitrogen</span>
            <span className="text-base font-extrabold text-blue-400 font-mono">{formData.N}</span>
            <span className="text-[10px] text-slate-500 block">kg/ha</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Phosphorus</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">{formData.P}</span>
            <span className="text-[10px] text-slate-500 block">kg/ha</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Potassium</span>
            <span className="text-base font-extrabold text-amber-400 font-mono">{formData.K}</span>
            <span className="text-[10px] text-slate-500 block">kg/ha</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Temperature</span>
            <span className="text-base font-extrabold text-rose-400 font-mono">{formData.temperature}°C</span>
            <span className="text-[10px] text-slate-500 block">Ambient</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Humidity</span>
            <span className="text-base font-extrabold text-cyan-400 font-mono">{formData.humidity}%</span>
            <span className="text-[10px] text-slate-500 block">Relative</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Soil pH</span>
            <span className="text-base font-extrabold text-violet-400 font-mono">{formData.ph}</span>
            <span className="text-[10px] text-slate-500 block">pH Index</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Rainfall</span>
            <span className="text-base font-extrabold text-sky-400 font-mono">{formData.rainfall}</span>
            <span className="text-[10px] text-slate-500 block">mm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
