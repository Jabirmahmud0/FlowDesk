'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText, Folder, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface DocumentNode {
    id: string;
    title: string;
    icon?: string;
    children?: DocumentNode[];
}

interface DocumentTreeProps {
    documents: DocumentNode[];
    workspaceId: string;
    orgId: string;
    activeId?: string;
}

export function DocumentTree({ documents, workspaceId, orgId, activeId }: DocumentTreeProps) {
    const router = useRouter();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleNavigate = (docId: string) => {
        router.push(`/${orgId}/${workspaceId}/docs/${docId}`);
    };

    return (
        <div className="space-y-1">
            {documents.map((doc) => (
                <TreeNode
                    key={doc.id}
                    node={doc}
                    expandedIds={expandedIds}
                    onToggle={toggleExpand}
                    onNavigate={handleNavigate}
                    activeId={activeId}
                    level={0}
                />
            ))}
        </div>
    );
}

interface TreeNodeProps {
    node: DocumentNode;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onNavigate: (id: string) => void;
    activeId?: string;
    level: number;
}

function TreeNode({ node, expandedIds, onToggle, onNavigate, activeId, level }: TreeNodeProps) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isActive = activeId === node.id;

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && 'hover:bg-muted'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onNavigate(node.id)}
            >
                {/* Expand/Collapse */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-6 w-6 shrink-0', hasChildren ? 'visible' : 'invisible')}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(node.id);
                    }}
                >
                    <ChevronRight
                        className={cn(
                            'h-4 w-4 transition-transform',
                            isExpanded && 'rotate-90'
                        )}
                    />
                </Button>

                {/* Icon */}
                {hasChildren ? (
                    <Folder className={cn('h-4 w-4 shrink-0', isActive ? 'text-current' : 'text-muted-foreground')} />
                ) : (
                    <FileText className={cn('h-4 w-4 shrink-0', isActive ? 'text-current' : 'text-muted-foreground')} />
                )}

                {/* Title */}
                <span className="flex-1 text-sm truncate">{node.title}</span>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity', isActive ? 'hover:bg-primary-foreground/10' : '')}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onNavigate(node.id)}>
                            Open
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Plus className="h-4 w-4 mr-2" />
                            New child page
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Children */}
            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {node.children!.map((child) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                expandedIds={expandedIds}
                                onToggle={onToggle}
                                onNavigate={onNavigate}
                                activeId={activeId}
                                level={level + 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
