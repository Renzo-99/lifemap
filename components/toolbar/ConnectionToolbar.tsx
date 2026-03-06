'use client';

import { RELATIONSHIP_STYLES, RELATIONSHIP_TYPE_LABELS } from '@/lib/constants';
import type { RelationshipType } from '@/types';
import { cn } from '@/lib/utils';

interface ConnectionToolbarProps {
  activeRelationType: RelationshipType;
  onChangeRelationType: (type: RelationshipType) => void;
  connectMode: boolean;
  onToggleConnectMode: () => void;
}

const RELATION_TYPES: RelationshipType[] = [
  'family', 'friend', 'mentor', 'colleague', 'member',
  'collaborator', 'supports', 'influences', 'custom',
];

export function ConnectionToolbar({
  activeRelationType,
  onChangeRelationType,
  connectMode,
  onToggleConnectMode,
}: ConnectionToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-white/95 px-2 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#F2F4F6] backdrop-blur-sm">
      <span className="mr-1 text-[10px] font-medium text-[#B0B8C1] uppercase tracking-wider">연결:</span>
      {RELATION_TYPES.map((type) => {
        const style = RELATIONSHIP_STYLES[type];
        const isActive = activeRelationType === type;
        return (
          <button
            key={type}
            onClick={() => onChangeRelationType(type)}
            className={cn(
              'rounded-xl px-2 py-1 text-[11px] font-medium transition-all duration-150',
              isActive
                ? 'shadow-sm ring-1'
                : 'text-[#8B95A1] hover:bg-[#F9FAFB]'
            )}
            style={isActive ? {
              backgroundColor: style.color + '15',
              color: style.color,
              boxShadow: `0 0 0 1px ${style.color}`,
            } : undefined}
            title={RELATIONSHIP_TYPE_LABELS[type]}
          >
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: style.color }}
            />
            {RELATIONSHIP_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
