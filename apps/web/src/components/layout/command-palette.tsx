'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useOrg } from '@/hooks/use-org';
import { Search, FileText, CheckSquare, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const { org } = useOrg();
    const router = useRouter();
    const params = useParams();
    const orgSlug = params?.orgSlug as string;
    const listRef = useRef<HTMLDivElement>(null);

    // Fetch workspaces for slug lookup
    const { data: workspaces } = trpc.workspace.list.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    // Build workspace lookup: workspaceId → slug
    const wsSlugMap = useMemo(() => {
        const map: Record<string, string> = {};
        workspaces?.forEach((ws: any) => {
            map[ws.id] = ws.slug;
        });
        return map;
    }, [workspaces]);

    // Keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { data: results, isLoading } = trpc.search.global.useQuery(
        { orgId: org?.id!, query },
        { enabled: !!org?.id && query.length >= 2 }
    );

    // Build flat list of all results for keyboard navigation
    const flatItems = useMemo(() => {
        if (!results) return [];
        const items: Array<{ type: string; item: any }> = [];
        results.tasks.forEach((t: any) => items.push({ type: 'task', item: t }));
        results.documents.forEach((d: any) => items.push({ type: 'document', item: d }));
        results.comments.forEach((c: any) => items.push({ type: 'comment', item: c }));
        return items;
    }, [results]);

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(0);
    }, [flatItems]);

    const handleSelect = useCallback((type: string, item: any) => {
        setOpen(false);
        setQuery('');

        if (!orgSlug) return;

        if (type === 'task') {
            // Navigate to the workspace board where this task's project lives
            const wsSlug = item.project?.workspaceId
                ? wsSlugMap[item.project.workspaceId]
                : null;
            if (wsSlug) {
                router.push(`/${orgSlug}/${wsSlug}/board`);
            }
        } else if (type === 'document') {
            // Navigate to workspace docs page
            const wsSlug = item.workspaceId ? wsSlugMap[item.workspaceId] : null;
            if (wsSlug) {
                router.push(`/${orgSlug}/${wsSlug}/docs`);
            }
        } else if (type === 'comment') {
            // Navigate to the board where the parent task's project lives
            // Comments have taskId but we might not have full project info
            // Navigate to the org dashboard as fallback
            router.push(`/${orgSlug}`);
        }
    }, [orgSlug, wsSlugMap, router]);

    // Keyboard navigation inside the dialog
    const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (flatItems.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = flatItems[activeIndex];
            if (selected) {
                handleSelect(selected.type, selected.item);
            }
        }
    }, [flatItems, activeIndex, handleSelect]);

    // Scroll active item into view
    useEffect(() => {
        const activeEl = listRef.current?.querySelector('[data-active="true"]');
        activeEl?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    // Track running index for rendering
    let runningIndex = 0;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-accent transition-colors w-64"
            >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search tasks, documents, comments..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleListKeyDown}
                            autoFocus
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>

                    <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2">
                        {query.length < 2 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Type at least 2 characters to search...
                            </p>
                        )}

                        {query.length >= 2 && !isLoading && results && (
                            <>
                                {/* Tasks */}
                                {results.tasks.length > 0 && (
                                    <div className="mb-3">
                                        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Tasks
                                        </p>
                                        {results.tasks.map((task: any) => {
                                            const idx = runningIndex++;
                                            return (
                                                <button
                                                    key={task.id}
                                                    data-active={idx === activeIndex}
                                                    onClick={() => handleSelect('task', task)}
                                                    className={cn(
                                                        'flex items-center gap-3 w-full p-2 text-sm rounded-md transition-colors text-left',
                                                        idx === activeIndex ? 'bg-accent' : 'hover:bg-accent/50',
                                                    )}
                                                >
                                                    <CheckSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate">{task.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {task.project?.name} • {task.status?.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Documents */}
                                {results.documents.length > 0 && (
                                    <div className="mb-3">
                                        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Documents
                                        </p>
                                        {results.documents.map((doc: any) => {
                                            const idx = runningIndex++;
                                            return (
                                                <button
                                                    key={doc.id}
                                                    data-active={idx === activeIndex}
                                                    onClick={() => handleSelect('document', doc)}
                                                    className={cn(
                                                        'flex items-center gap-3 w-full p-2 text-sm rounded-md transition-colors text-left',
                                                        idx === activeIndex ? 'bg-accent' : 'hover:bg-accent/50',
                                                    )}
                                                >
                                                    <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate">{doc.title}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Comments */}
                                {results.comments.length > 0 && (
                                    <div className="mb-3">
                                        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Comments
                                        </p>
                                        {results.comments.map((comment: any) => {
                                            const idx = runningIndex++;
                                            return (
                                                <button
                                                    key={comment.id}
                                                    data-active={idx === activeIndex}
                                                    onClick={() => handleSelect('comment', comment)}
                                                    className={cn(
                                                        'flex items-center gap-3 w-full p-2 text-sm rounded-md transition-colors text-left',
                                                        idx === activeIndex ? 'bg-accent' : 'hover:bg-accent/50',
                                                    )}
                                                >
                                                    <MessageSquare className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {typeof comment.content === 'string'
                                                                ? comment.content.substring(0, 80)
                                                                : 'Comment'}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {results.tasks.length === 0 && results.documents.length === 0 && results.comments.length === 0 && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        No results found for "{query}"
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

