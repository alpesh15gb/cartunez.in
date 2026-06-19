import { useState, useEffect, useCallback } from 'react';
import { fetchMakes, fetchModels, fetchYears, fetchVariants } from '../lib/api';
import type { VehicleMake, VehicleModel, VehicleYear, VehicleVariant } from '../lib/api';

export function useVehicles() {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [years, setYears] = useState<VehicleYear[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [loading, setLoading] = useState({ makes: false, models: false, years: false, variants: false });

  useEffect(() => {
    setLoading(p => ({ ...p, makes: true }));
    fetchMakes().then(setMakes).catch(() => {}).finally(() => setLoading(p => ({ ...p, makes: false })));
  }, []);

  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    setLoading(p => ({ ...p, models: true }));
    setSelectedModel('');
    setSelectedYear('');
    setSelectedVariant('');
    fetchModels(selectedMake).then(setModels).catch(() => {}).finally(() => setLoading(p => ({ ...p, models: false })));
  }, [selectedMake]);

  useEffect(() => {
    if (!selectedModel) { setYears([]); return; }
    setLoading(p => ({ ...p, years: true }));
    setSelectedYear('');
    setSelectedVariant('');
    fetchYears(selectedModel).then(setYears).catch(() => {}).finally(() => setLoading(p => ({ ...p, years: false })));
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedYear) { setVariants([]); return; }
    setLoading(p => ({ ...p, variants: true }));
    setSelectedVariant('');
    fetchVariants(selectedYear).then(setVariants).catch(() => {}).finally(() => setLoading(p => ({ ...p, variants: false })));
  }, [selectedYear]);

  const reset = useCallback(() => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedVariant('');
  }, []);

  return {
    makes, models, years, variants,
    selectedMake, setSelectedMake,
    selectedModel, setSelectedModel,
    selectedYear, setSelectedYear,
    selectedVariant, setSelectedVariant,
    loading, reset,
  };
}
