import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { PersonNode } from '@/components/nodes/PersonNode';
import { OrganizationNode } from '@/components/nodes/OrganizationNode';
import { ActivityNode } from '@/components/nodes/ActivityNode';
import { GoalNode } from '@/components/nodes/GoalNode';
import { GroupNode } from '@/components/nodes/GroupNode';
import { RelationshipEdge } from '@/components/edges/RelationshipEdge';

export const canvasNodeTypes: NodeTypes = {
  person: PersonNode,
  organization: OrganizationNode,
  activity: ActivityNode,
  goal: GoalNode,
  group: GroupNode,
};

export const canvasEdgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};
