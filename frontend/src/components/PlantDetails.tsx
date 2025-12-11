import { type CellSnapshot } from '../lib';
import { useHistoricalData, useActivateWater, useAdjustLight } from '../hooks';
import { useEffect, useState } from 'react';
import { formatHistoricalData } from '../lib/plantDetailsHelpers';
import { PlantReadings } from './plant-details/PlantReadings';
import { ActuatorButtons } from './plant-details/ActuatorButtons';
import { TrendChart } from './plant-details/TrendChart';

interface PlantDetailsProps {
  cell: CellSnapshot;
  rackNumber?: number | null;
}

export default function PlantDetails({ cell, rackNumber }: PlantDetailsProps) {
  const waterMutation = useActivateWater();
  const lightMutation = useAdjustLight();
  const [timeInterval, setTimeInterval] = useState<number>(1); // Default to 1 hour

  const { data: historicalData, isLoading: isHistoryLoading } = useHistoricalData(
    rackNumber ?? null,
    cell.row,
    cell.column,
    timeInterval,
    10000
  );

  const chartData = formatHistoricalData(historicalData ?? []);

  const handleWaterAction = () => {
    if (rackNumber === null || rackNumber === undefined) return;
    
    waterMutation.mutate({
      rackNumber,
      row: cell.row,
      column: cell.column
    });
  };

  const handleLightAction = () => {
    if (rackNumber === null || rackNumber === undefined) return;
    
    lightMutation.mutate({
      rackNumber,
      row: cell.row,
      column: cell.column
    });
  };

  // Map mutation states to status for backward compatibility
  const waterStatus = waterMutation.isPending ? 'loading' 
    : waterMutation.isSuccess ? 'success'
    : waterMutation.isError ? 'error'
    : 'idle';

  const lightStatus = lightMutation.isPending ? 'loading'
    : lightMutation.isSuccess ? 'success'
    : lightMutation.isError ? 'error'
    : 'idle';

  // Auto-reset success/error states after 2 seconds
  useEffect(() => {
    if (waterMutation.isSuccess || waterMutation.isError) {
      const timer = setTimeout(() => waterMutation.reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [waterMutation.isSuccess, waterMutation.isError, waterMutation]);

  useEffect(() => {
    if (lightMutation.isSuccess || lightMutation.isError) {
      const timer = setTimeout(() => lightMutation.reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [lightMutation.isSuccess, lightMutation.isError, lightMutation]);

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
        <TrendChart 
          chartData={chartData} 
          isLoading={isHistoryLoading} 
          timeInterval={timeInterval}
          onTimeIntervalChange={setTimeInterval}
        />
      </div>
    </div>
  );
}
