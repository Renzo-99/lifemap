'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { LifeMapNodeData } from '@/types';
import { cn } from '@/lib/utils';

type ActivityNodeType = Node<LifeMapNodeData, 'activity'>;

function ActivityNodeComponent({ data, selected }: NodeProps<ActivityNodeType>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditLabel(data.label);
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-shadow',
        selected ? 'border-green-500 shadow-md ring-2 ring-green-200' : 'border-gray-200'
      )}
      style={{ minWidth: 120, minHeight: 70 }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400" />

      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
        style={{ backgroundColor: data.color + '20', color: data.color }}
      >
        <span>{data.icon || '📋'}</span>
      </div>

      {isEditing ? (
        <input
          className="mt-1 w-full border-b border-green-400 bg-transparent text-center text-sm font-semibold outline-none"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          autoFocus
        />
      ) : (
        <span className="mt-1 text-sm font-semibold text-gray-800 text-center leading-tight">
          {data.label}
        </span>
      )}

      {data.tags.length > 0 && (
        <div className="mt-1 flex gap-1">
          {data.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: data.color + '15', color: data.color }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  );
}

export const ActivityNode = memo(ActivityNodeComponent);
