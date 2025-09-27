'use client';

import React, { useState, useEffect } from 'react';
import { WORK_DAY_START, TIME_SLOT_MINUTES, PX_PER_TIME_SLOT } from '@/lib/types/calendar';

interface CurrentTimeLineProps {
  selectedDate: string;
}

export function CurrentTimeLine({ selectedDate }: CurrentTimeLineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if the selected date is today
      const today = new Date().toISOString().split('T')[0];
      setIsVisible(selectedDate === today);
    };

    // Initial update
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Don't render if not visible (not today)
  if (!isVisible) return null;

  // Calculate position based on current time
  const now = currentTime;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Check if current time is within work day range
  const workDayStartMinutes = WORK_DAY_START * 60;
  const workDayEndMinutes = 21 * 60; // 21:00
  
  if (totalMinutes < workDayStartMinutes || totalMinutes > workDayEndMinutes) {
    return null;
  }

  // Calculate pixel position from start of work day
  const minutesFromStart = totalMinutes - workDayStartMinutes;
  const topPosition = (minutesFromStart / TIME_SLOT_MINUTES) * PX_PER_TIME_SLOT;

  // Format current time for display
  const timeString = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{
        top: `${topPosition}px`,
      }}
    >
      {/* Time indicator line */}
      <div className="relative">
        {/* Red line across the grid */}
        <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-sm" />
        
        {/* Time label on the left */}
        <div className="absolute left-2 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg font-mono">
          {timeString}
        </div>
        
        {/* Arrow/dot indicator */}
        <div className="absolute left-0 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-sm" />
      </div>
    </div>
  );
}
