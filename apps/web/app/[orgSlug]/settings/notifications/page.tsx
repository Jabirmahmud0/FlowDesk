'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Bell, Mail, MessageSquare, Clock, AtSign, CheckSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type NotificationSettings = {
    emailNotifications: boolean;
    taskAssignments: boolean;
    taskUpdates: boolean;
    comments: boolean;
    mentions: boolean;
    dueSoon: boolean;
};

const defaultSettings: NotificationSettings = {
    emailNotifications: true,
    taskAssignments: true,
    taskUpdates: true,
    comments: true,
    mentions: true,
    dueSoon: true,
};

export default function NotificationsSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);

    const { data: fetchedSettings, isLoading } = trpc.user.getNotificationSettings.useQuery();

    const updateSettingsMutation = trpc.user.updateNotificationSettings.useMutation({
        onSuccess: () => {
            toast({
                title: 'Settings saved',
                description: 'Your notification preferences have been updated.',
            });
            setIsSaving(false);
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
            setIsSaving(false);
        },
    });

    useEffect(() => {
        if (fetchedSettings) {
            setSettings(fetchedSettings);
        }
    }, [fetchedSettings]);

    const handleToggle = (key: keyof NotificationSettings) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        updateSettingsMutation.mutate(settings);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Notifications Header */}
            <div>
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your notification preferences and delivery settings.
                </p>
            </div>
            <Separator />

            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Notifications
                    </CardTitle>
                    <CardDescription>
                        Choose when you want to receive email notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Email Notifications</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications via email
                            </p>
                        </div>
                        <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={() => handleToggle('emailNotifications')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Activity Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Activity Notifications
                    </CardTitle>
                    <CardDescription>
                        Get notified about activities related to your work.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Task Assignments</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                When you are assigned to a task
                            </p>
                        </div>
                        <Switch
                            checked={settings.taskAssignments}
                            onCheckedChange={() => handleToggle('taskAssignments')}
                            disabled={!settings.emailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Task Updates</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                When tasks you follow are updated
                            </p>
                        </div>
                        <Switch
                            checked={settings.taskUpdates}
                            onCheckedChange={() => handleToggle('taskUpdates')}
                            disabled={!settings.emailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Comments</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                When someone comments on your tasks or documents
                            </p>
                        </div>
                        <Switch
                            checked={settings.comments}
                            onCheckedChange={() => handleToggle('comments')}
                            disabled={!settings.emailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <AtSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Mentions</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                When someone mentions you in a comment or description
                            </p>
                        </div>
                        <Switch
                            checked={settings.mentions}
                            onCheckedChange={() => handleToggle('mentions')}
                            disabled={!settings.emailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Due Soon Reminders</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Reminders for tasks approaching their due date
                            </p>
                        </div>
                        <Switch
                            checked={settings.dueSoon}
                            onCheckedChange={() => handleToggle('dueSoon')}
                            disabled={!settings.emailNotifications}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Tips</CardTitle>
                    <CardDescription>
                        Make the most of your notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                            <span>
                                Turn off email notifications if you prefer in-app notifications only
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                            <span>
                                Enable mentions to never miss when someone needs your input
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                            <span>
                                Due soon reminders help you stay on top of deadlines
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
