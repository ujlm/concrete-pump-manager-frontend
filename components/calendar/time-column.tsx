'use client';

import React from 'react';

interface TimeColumnProps {
  timeSlots: { time: string; displayTime: string }[];
}

export function TimeColumn({ timeSlots }: TimeColumnProps) {
  return (
    <div className="flex-shrink-0 w-12 sm:w-16 border-r bg-gray-50/50 sticky left-0 z-10">
      {/* Header spacer */}
      <div className="h-12 sm:h-16 border-b bg-background" />

      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((slot, index) => {
          const isHourMark = slot.time.endsWith(':00');
          const isHalfHour = slot.time.endsWith(':30');

          return (
            <div
              key={slot.time}
              className={`h-8 border-b border-gray-200 flex items-center justify-center relative ${
                isHourMark ? 'bg-gray-100/50' : ''
              }`}
            >
              {/* Show time label only on hour marks and half hours */}
              {(isHourMark || isHalfHour) && (
                <div className="text-xs sm:text-xs text-muted-foreground font-mono leading-none">
                  <span className="hidden sm:inline">{slot.time}</span>
                  <span className="sm:hidden">{slot.time.split(':')[0]}</span>
                </div>
              )}

              {/* Hour marker line */}
              {isHourMark && (
                <div className="absolute right-0 top-0 w-2 h-px bg-gray-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}