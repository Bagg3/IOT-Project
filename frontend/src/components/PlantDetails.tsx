import { type CellSnapshot } from '../lib/api';
import { activateWater, adjustLight } from '../lib/actuator';
import { useHistoricalData } from '../hooks/useHistoricalData';
import { useState } from 'react';
import { formatHistoricalData } from '../lib/plantDetailsHelpers';
import { PlantReadings } from './plant-details/PlantReadings';
import { ActuatorButtons } from './plant-details/ActuatorButtons';
import { TrendChart } from './plant-details/TrendChart';

interface PlantDetailsProps {
  cell: CellSnapshot;
  rackNumber?: number | null;
}

export default function PlantDetails({ cell, rackNumber }: PlantDetailsProps) {
  const [waterStatus, setWaterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lightStatus, setLightStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { data: historicalData, isLoading: isHistoryLoading } = useHistoricalData(
    rackNumber ?? null,
    cell.row,
    cell.column,
    10000
  );

  const chartData = formatHistoricalData(historicalData ?? []);

  const handleWaterAction = async () => {
    setWaterStatus('loading');
    try {
      const response = await activateWater(rackNumber ?? 1, cell.row, cell.column);
      if (response.success) {
        setWaterStatus('success');
        setTimeout(() => setWaterStatus('idle'), 2000);
      } else {
        setWaterStatus('error');
        setTimeout(() => setWaterStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('[UI] Water action failed:', error);
      setWaterStatus('error');
      setTimeout(() => setWaterStatus('idle'), 2000);
    }
  };

  const handleLightAction = async () => {
    setLightStatus('loading');
    try {
      const response = await adjustLight(rackNumber ?? 1, cell.row, cell.column);
      if (response.success) {
        setLightStatus('success');
        setTimeout(() => setLightStatus('idle'), 2000);
      } else {
        setLightStatus('error');
        setTimeout(() => setLightStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('[UI] Light action failed:', error);
      setLightStatus('error');
      setTimeout(() => setLightStatus('idle'), 2000);
    }
  };

  return (
    <div className='space-y-3'>
      <div className='rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2'>
        <PlantReadings moisturePercent={cell.moisturePercent} lightPercent={cell.lightPercent} />
        <ActuatorButtons
          waterStatus={waterStatus}
          lightStatus={lightStatus}
          onWater={handleWaterAction}
          onLight={handleLightAction}
        />
      </div>

      <div className='space-y-1'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xs font-semibold text-slate-700 uppercase tracking-wide'>5-Minute Trends</h3>
          {isHistoryLoading && <span className='text-xs text-slate-500'>Updating</span>}
        </div>
        <TrendChart chartData={chartData} isLoading={isHistoryLoading} />
      </div>
    </div>
  );
}
