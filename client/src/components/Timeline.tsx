import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

type TimelineItem = {
  id: number | string;
  title: string;
  description?: string;
  timestamp: Date;
  icon?: LucideIcon;
};

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  // Sort items by timestamp, newest first
  const sortedItems = [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-4">
      {sortedItems.map((item, index) => {
        const Icon = item.icon;
        
        return (
          <div key={item.id} className="relative pl-8">
            {/* Vertical line */}
            {index !== sortedItems.length - 1 && (
              <div 
                className="absolute top-6 bottom-0 left-[13px] w-0.5 bg-emerald-700/30"
                aria-hidden="true"
              />
            )}
            
            {/* Timeline dot */}
            <div 
              className="absolute top-1 left-0 flex items-center justify-center w-7 h-7 rounded-full border-2 border-emerald-700/60 bg-emerald-900/80"
              aria-hidden="true"
            >
              {Icon ? (
                <Icon className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </div>
            
            {/* Content */}
            <div className="pb-6">
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-emerald-100">{item.title}</h4>
                <time className="text-xs text-emerald-400 mb-1">
                  {formatTimeAgo(item.timestamp)}
                </time>
                {item.description && (
                  <p className="mt-1 text-xs text-emerald-300">{item.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}