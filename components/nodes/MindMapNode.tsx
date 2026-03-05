'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import type { LifeMapNodeData } from '@/types';
import { cn } from '@/lib/utils';

type MindMapNodeType = Node<LifeMapNodeData, 'mindmap'>;

// 투명 핸들 (트리 커넥터에서는 핸들 점이 보이면 안 됨)
const HANDLE_HIDDEN = '!w-1 !h-1 !bg-transparent !border-transparent !min-w-0 !min-h-0';

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

  // 공통 핸들 (4방향, 투명)
  const handles = (
    <>
      <Handle type="source" id="right" position={Position.Right} className={HANDLE_HIDDEN} />
      <Handle type="source" id="left" position={Position.Left} className={HANDLE_HIDDEN} />
      <Handle type="source" id="bottom" position={Position.Bottom} className={HANDLE_HIDDEN} />
      <Handle type="target" id="left" position={Position.Left} className={HANDLE_HIDDEN} />
      <Handle type="target" id="right" position={Position.Right} className={HANDLE_HIDDEN} />
      <Handle type="target" id="top" position={Position.Top} className={HANDLE_HIDDEN} />
    </>
  );

  // 중심 노드
  if (isCenter) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 bg-gradient-to-br from-blue-500 to-blue-600 px-5 py-2.5 text-white shadow-md',
          selected && 'ring-4 ring-blue-300'
        )}
        style={{ minWidth: 120 }}
        onDoubleClick={handleDoubleClick}
      >
        {handles}
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
          'flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 shadow-sm transition-all',
          selected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        )}
        onDoubleClick={handleDoubleClick}
      >
        {handles}
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
          <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{data.label}</span>
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
        'flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1 transition-all',
        selected ? 'border-blue-400 shadow-sm ring-1 ring-blue-200' : 'border-gray-150 hover:border-gray-300'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {handles}
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
        <span className="text-xs text-gray-700 whitespace-nowrap">{data.label}</span>
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
