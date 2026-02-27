'use client';

import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Activity as ActivityIcon, Filter, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_TYPES = [
    { value: 'CREATE', label: 'Created' },
    { value: 'UPDATE', label: 'Updated' },
    { value: 'DELETE', label: 'Deleted' },
    { value: 'MOVE', label: 'Moved' },
    { value: 'ASSIGN', label: 'Assigned' },
    { value: 'COMMENT', label: 'Commented' },
];

export default function ActivityPage() {
    const { org } = useOrg();
    const [filterAction, setFilterAction] = useState<string | undefined>();
    const [filterUserId, setFilterUserId] = useState<string | undefined>();
    const [filterProjectId, setFilterProjectId] = useState<string | undefined>();

    const hasFilters = filterAction || filterUserId || filterProjectId;

    const { data: logs, isLoading } = trpc.activity.list.useQuery(
        {
            orgId: org?.id!,
            limit: 100,
            action: filterAction,
            userId: filterUserId,
            projectId: filterProjectId,
        },
        { enabled: !!org?.id }
    );

    const { data: members } = trpc.members.list.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const { data: projects } = trpc.project.list.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const clearFilters = () => {
        setFilterAction(undefined);
        setFilterUserId(undefined);
        setFilterProjectId(undefined);
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
                <p className="text-muted-foreground text-sm">
                    Recent actions in {org?.name}
                </p>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />

                <Select
                    value={filterAction || ''}
                    onValueChange={(v) => setFilterAction(v || undefined)}
                >
                    <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Action type" />
                    </SelectTrigger>
                    <SelectContent>
                        {ACTION_TYPES.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                                {a.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filterUserId || ''}
                    onValueChange={(v) => setFilterUserId(v || undefined)}
                >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All members" />
                    </SelectTrigger>
                    <SelectContent>
                        {members?.map((m: any) => (
                            <SelectItem key={m.user?.id || m.userId} value={m.user?.id || m.userId}>
                                {m.user?.name || m.user?.email || 'Unknown'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filterProjectId || ''}
                    onValueChange={(v) => setFilterProjectId(v || undefined)}
                >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                        {projects?.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={clearFilters}>
                        <X className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                )}

                {hasFilters && (
                    <Badge variant="secondary" className="text-xs">
                        {logs?.length ?? 0} results
                    </Badge>
                )}
            </div>

            <div className="h-[calc(100vh-260px)] border rounded-md p-4 overflow-y-auto">
                <div className="space-y-2">
                    {logs?.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            {hasFilters ? 'No activity matches your filters.' : 'No activity recorded yet.'}
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {logs?.map((log: any, index: number) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15, delay: index * 0.02 }}
                                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <Avatar className="h-9 w-9 mt-0.5">
                                        <AvatarFallback>
                                            {log.user?.name?.[0] || log.user?.email?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-semibold">{log.user?.name || log.user?.email}</span>
                                            <span className="font-normal text-muted-foreground"> {formatAction(log)}</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </p>
                                            {log.project && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                                    {log.project.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                                        {log.action}
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatAction(log: any) {
    const action = log.action?.toLowerCase() || 'performed';
    const entityType = log.entityType?.toLowerCase() || '';

    const actionMap: Record<string, string> = {
        create: 'created',
        update: 'updated',
        delete: 'deleted',
        move: 'moved',
        assign: 'assigned',
        comment: 'commented on',
    };

    const verb = actionMap[action] || `${action}d`;
    return entityType ? `${verb} a ${entityType}` : verb;
}
