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
    let cancelled = false;
    setLoading(p => ({ ...p, makes: true }));
    fetchMakes().then(data => { if (!cancelled) setMakes(data); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(p => ({ ...p, makes: false })); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    let cancelled = false;
    setLoading(p => ({ ...p, models: true }));
    setSelectedModel('');
    setSelectedYear('');
    setSelectedVariant('');
    fetchModels(selectedMake).then(data => { if (!cancelled) setModels(data); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(p => ({ ...p, models: false })); });
    return () => { cancelled = true; };
  }, [selectedMake]);

  useEffect(() => {
    if (!selectedModel) { setYears([]); return; }
    let cancelled = false;
    setLoading(p => ({ ...p, years: true }));
    setSelectedYear('');
    setSelectedVariant('');
    fetchYears(selectedModel).then(data => { if (!cancelled) setYears(data); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(p => ({ ...p, years: false })); });
    return () => { cancelled = true; };
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedYear) { setVariants([]); return; }
    let cancelled = false;
    setLoading(p => ({ ...p, variants: true }));
    setSelectedVariant('');
    fetchVariants(selectedYear).then(data => { if (!cancelled) setVariants(data); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(p => ({ ...p, variants: false })); });
    return () => { cancelled = true; };
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
