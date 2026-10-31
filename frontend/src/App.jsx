import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Prediction from './pages/Prediction';
import Results from './pages/Results';
import ModelComparison from './pages/ModelComparison';
import DatasetAnalytics from './pages/DatasetAnalytics';
import ModelExplanation from './pages/ModelExplanation';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    N: 90,
    P: 42,
    K: 43,
    temperature: 20.87,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 202.9,
  });

  const [result, setResult] = useState(null);

  // Poll system health and run initial prediction on mount
  useEffect(() => {
    async function checkSystem() {
      try {
        const health = await api.checkHealth();
        setSystemStatus(health);
      } catch (err) {
        console.warn('Backend API connection check failed:', err);
        setSystemStatus({ status: 'degraded', error: err.message });
      }
    }
    checkSystem();

    // Run baseline prediction to prime results state
    handlePredict(formData, false);
  }, []);

  const handlePredict = async (dataToPredict = formData, switchTab = true) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.predictCrop(dataToPredict);
      setResult(res);
      if (switchTab) {
        setActiveTab('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      setError(err.message || 'Prediction failed. Ensure the FastAPI backend is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetData) => {
    setFormData(presetData);
    handlePredict(presetData, true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-radial-gradient">
      {/* Navbar with active tab & system status */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        systemStatus={systemStatus} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'home' && (
          <Home 
            setActiveTab={setActiveTab} 
            onSelectPreset={handleSelectPreset} 
          />
        )}

        {activeTab === 'predict' && (
          <Prediction
            formData={formData}
            setFormData={setFormData}
            onPredict={() => handlePredict(formData, true)}
            isLoading={isLoading}
            error={error}
          />
        )}

        {activeTab === 'results' && (
          <Results 
            result={result} 
            formData={formData} 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'comparison' && (
          <ModelComparison />
        )}

        {activeTab === 'analytics' && (
          <DatasetAnalytics />
        )}

        {activeTab === 'explanation' && (
          <ModelExplanation 
            result={result} 
            formData={formData} 
          />
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
