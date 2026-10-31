/**
 * API Service for Crop Intelligence Frontend.
 * Uses VITE_API_URL environment variable for production deployments (e.g. Render),
 * falling back to empty string (local Vite proxy) during local development.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errData = await res.json();
        if (errData.detail) {
          if (Array.isArray(errData.detail)) {
            errorMsg = errData.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
          } else {
            errorMsg = errData.detail;
          }
        }
      } catch (e) {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err) {
    console.error(`Request to ${endpoint} failed:`, err);
    throw err;
  }
}

export const api = {
  checkHealth: () => fetchJson('/api/health'),
  getDatasetStats: () => fetchJson('/api/dataset/stats'),
  getModelsMetadata: () => fetchJson('/api/models'),
  getAnalytics: () => fetchJson('/api/analytics'),
  getEvaluation: () => fetchJson('/api/evaluate'),
  predictCrop: (data) => fetchJson('/api/predict', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  predictDecisionTree: (data) => fetchJson('/api/predict/decision-tree', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  predictKNN: (data) => fetchJson('/api/predict/knn', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  recommendFertilizer: (data) => fetchJson('/api/fertilizer/recommend', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getProductionAnalytics: (crop) => fetchJson(`/api/analytics/production${crop ? `?crop=${encodeURIComponent(crop)}` : ''}`),
  getDatasetCatalog: () => fetchJson('/api/analytics/datasets'),
};

