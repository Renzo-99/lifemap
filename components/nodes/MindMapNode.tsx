'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import type { LifeMapNodeData } from '@/types';
import { cn } from '@/lib/utils';

type MindMapNodeType = Node<LifeMapNodeData, 'mindmap'>;

function MindMapNodeComponent({ id, data, selected }: NodeProps<MindMapNodeType>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const { updateNodeData } = useReactFlow();

  const isCenter = (data as any)._isCenter;
  const isCollapsed = (data as any)._isCollapsed;
  const childCount = (data as any)._childCount || 0;
  const depth = (data as any)._depth || 0;

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditLabel(data.label);
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editLabel.trim() && editLabel !== data.label) {
      updateNodeData(id, { label: editLabel.trim() });
    }
  }, [id, editLabel, data.label, updateNodeData]);

  // 중심 노드
  if (isCenter) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-white shadow-lg',
          selected && 'ring-4 ring-blue-300'
        )}
        style={{ minWidth: 140 }}
        onDoubleClick={handleDoubleClick}
      >
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-300 !border-blue-400" />
        <Handle type="source" position={Position.Left} className="!w-3 !h-3 !bg-blue-300 !border-blue-400" />
        <Handle type="source" position={Position.Top} className="!w-3 !h-3 !bg-blue-300 !border-blue-400" />
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-300 !border-blue-400" />

        {isEditing ? (
          <input
            className="w-full bg-transparent text-center text-sm font-bold outline-none placeholder-blue-200"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); }}
            autoFocus
          />
        ) : (
          <span className="text-sm font-bold">{data.label}</span>
        )}
      </div>
    );
  }

  // 1차 가지 (depth 1)
  if (depth === 1) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border-2 bg-white px-4 py-2 shadow-sm transition-all',
          selected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        )}
        style={{ minWidth: 100 }}
        onDoubleClick={handleDoubleClick}
      >
        <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-400" />
        <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-400" />

        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: data.color }}
        />

        {isEditing ? (
          <input
            className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); }}
            autoFocus
          />
        ) : (
          <span className="text-sm font-semibold text-gray-800">{data.label}</span>
        )}

        {isCollapsed && childCount > 0 && (
          <span className="ml-1 rounded-full bg-gray-200 px-1.5 text-[10px] font-medium text-gray-500">
            +{childCount}
          </span>
        )}
      </div>
    );
  }

  // 2차+ 가지 (depth 2+)
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 transition-all',
        selected ? 'border-blue-400 shadow-sm ring-1 ring-blue-200' : 'border-gray-150 hover:border-gray-300'
      )}
      style={{ minWidth: 80 }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-300" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-300" />

      {isEditing ? (
        <input
          className="w-full bg-transparent text-xs text-gray-700 outline-none"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); }}
          autoFocus
        />
      ) : (
        <span className="text-xs text-gray-700">{data.label}</span>
      )}

      {isCollapsed && childCount > 0 && (
        <span className="ml-1 rounded-full bg-gray-100 px-1 text-[9px] font-medium text-gray-400">
          +{childCount}
        </span>
      )}
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
