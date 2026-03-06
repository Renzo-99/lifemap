'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import type { LifeMapNodeData } from '@/types';
import { cn } from '@/lib/utils';

type BaseNodeType = Node<LifeMapNodeData>;

const DEFAULT_ICONS: Record<string, string> = {
  person: '👤',
  organization: '🏢',
  activity: '📋',
  goal: '🎯',
};

function BaseNodeComponent({ id, data, selected }: NodeProps<BaseNodeType>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const { updateNodeData } = useReactFlow();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditLabel(data.label);
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editLabel.trim() && editLabel !== data.label) {
      updateNodeData(id, { label: editLabel.trim() });
    }
  }, [id, editLabel, data.label, updateNodeData]);

  const defaultIcon = DEFAULT_ICONS[data.type] || '📌';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 bg-white px-4 py-3 transition-all duration-150 ease-in-out',
        selected
          ? 'border-[#3182F6] ring-2 ring-[#3182F6]/20 shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
          : 'border-[#E5E8EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
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
        {data.avatar ? (
          <img src={data.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span>{data.icon || defaultIcon}</span>
        )}
      </div>

      {isEditing ? (
        <input
          className="mt-1 w-full border-b border-[#3182F6] bg-transparent text-center text-sm font-semibold outline-none"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          autoFocus
        />
      ) : (
        <span className="mt-1 text-sm font-semibold text-[#333D4B] text-center leading-tight">
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

export const BaseNode = memo(BaseNodeComponent);
