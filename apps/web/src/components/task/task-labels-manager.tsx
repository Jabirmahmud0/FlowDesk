'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Palette } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TaskLabelsManager() {
    const { org } = useOrg();
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<{ id: string; name: string; color: string } | null>(null);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

    const { data: labels, isLoading, refetch } = trpc.task.labelsByOrg.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const createLabel = trpc.task.createLabel.useMutation({
        onSuccess: () => {
            toast({ title: 'Label created' });
            setIsCreateOpen(false);
            setNewLabelName('');
            setNewLabelColor('#3b82f6');
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const updateLabel = trpc.task.updateLabel.useMutation({
        onSuccess: () => {
            toast({ title: 'Label updated' });
            setEditingLabel(null);
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const deleteLabel = trpc.task.deleteLabel.useMutation({
        onSuccess: () => {
            toast({ title: 'Label deleted' });
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const handleCreate = () => {
        if (!org?.id || !newLabelName.trim()) return;
        createLabel.mutate({
            orgId: org.id,
            name: newLabelName.trim(),
            color: newLabelColor,
        });
    };

    const handleUpdate = () => {
        if (!editingLabel || !org?.id) return;
        updateLabel.mutate({
            id: editingLabel.id,
            orgId: org.id,
            name: editingLabel.name,
            color: editingLabel.color,
        });
    };

    const presetColors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16',
        '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#f43f5e', '#64748b', '#000000', '#ffffff',
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        <div>
                            <CardTitle>Task Labels</CardTitle>
                            <CardDescription>
                                Create and manage labels to organize tasks
                            </CardDescription>
                        </div>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                New Label
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Label</DialogTitle>
                                <DialogDescription>
                                    Give your label a name and color
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        placeholder="e.g., Bug, Feature, Urgent"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={newLabelColor}
                                            onChange={(e) => setNewLabelColor(e.target.value)}
                                            className="w-12 h-10"
                                        />
                                        <Input
                                            value={newLabelColor}
                                            onChange={(e) => setNewLabelColor(e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-8 gap-1 mt-2">
                                        {presetColors.map((color) => (
                                            <button
                                                key={color}
                                                className={cn(
                                                    'w-6 h-6 rounded border-2 transition-transform hover:scale-110',
                                                    newLabelColor === color && 'border-primary scale-110'
                                                )}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setNewLabelColor(color)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={createLabel.isPending}>
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading labels...</p>
                ) : labels?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No labels yet. Create one to get started.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {labels?.map((label) => (
                            <Badge
                                key={label.id}
                                className="text-white px-3 py-1 text-sm"
                                style={{ backgroundColor: label.color }}
                            >
                                {label.name}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="ml-1 hover:bg-white/20 rounded p-0.5 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setEditingLabel({ id: label.id, name: label.name, color: label.color })}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => deleteLabel.mutate({ id: label.id })}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={!!editingLabel} onOpenChange={() => setEditingLabel(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Label</DialogTitle>
                            <DialogDescription>
                                Update label name and color
                            </DialogDescription>
                        </DialogHeader>
                        {editingLabel && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={editingLabel.name}
                                        onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={editingLabel.color}
                                            onChange={(e) => setEditingLabel({ ...editingLabel, color: e.target.value })}
                                            className="w-12 h-10"
                                        />
                                        <Input
                                            value={editingLabel.color}
                                            onChange={(e) => setEditingLabel({ ...editingLabel, color: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingLabel(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdate} disabled={updateLabel.isPending}>
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
