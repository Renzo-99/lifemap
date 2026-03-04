'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node, NodeResizer } from '@xyflow/react';
import type { LifeMapNodeData } from '@/types';
import { cn } from '@/lib/utils';

type GroupNodeType = Node<LifeMapNodeData, 'group'>;

function GroupNodeComponent({ id, data, selected }: NodeProps<GroupNodeType>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const { updateNodeData } = useReactFlow();

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

  return (
    <div
      className={cn(
        'relative h-full w-full rounded-2xl border-2 border-dashed bg-slate-50/60',
        selected ? 'border-blue-400 bg-blue-50/40' : 'border-slate-300'
      )}
    >
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-blue-400"
        handleClassName="!w-2.5 !h-2.5 !bg-blue-500 !border-blue-500 !rounded-sm"
      />

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-400 !border-slate-400" />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-slate-400 !border-slate-400" />

      <div
        className="absolute -top-0 left-3 flex items-center gap-1.5 rounded-b-lg bg-slate-200/80 px-3 py-1"
        onDoubleClick={handleDoubleClick}
      >
        <span className="text-xs">📁</span>
        {isEditing ? (
          <input
            className="w-24 border-b border-blue-400 bg-transparent text-xs font-semibold text-slate-700 outline-none"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            autoFocus
          />
        ) : (
          <span className="text-xs font-semibold text-slate-700">{data.label}</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-400 !border-slate-400" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-slate-400 !border-slate-400" />
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
