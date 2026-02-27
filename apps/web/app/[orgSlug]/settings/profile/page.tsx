'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, User as UserIcon, Mail, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileSettingsPage() {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const utils = trpc.useUtils();

    const { data: user, isLoading } = trpc.user.getProfile.useQuery(undefined, {
        retry: false,
    });

    const updateProfileMutation = trpc.user.updateProfile.useMutation({
        onSuccess: () => {
            toast({
                title: 'Profile updated',
                description: 'Your profile has been updated successfully.',
            });
            utils.user.getProfile.invalidate();
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
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSave = () => {
        if (!name.trim()) {
            toast({
                title: 'Error',
                description: 'Name is required',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        updateProfileMutation.mutate({
            name: name.trim(),
            email: email.trim(),
        });
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
            {/* Profile Header */}
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your personal information and profile settings.
                </p>
            </div>
            <Separator />

            {/* Avatar */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Profile Picture
                    </CardTitle>
                    <CardDescription>
                        Update your profile picture and how you appear to others.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.image || undefined} />
                            <AvatarFallback className="text-lg">
                                {user?.name?.[0] || user?.email?.[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <Button variant="outline" size="sm" disabled>
                                <Camera className="mr-2 h-4 w-4" />
                                Change Picture
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Profile picture upload coming soon.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Personal Information
                    </CardTitle>
                    <CardDescription>
                        Update your name and email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex gap-2">
                            <Mail className="h-5 w-5 text-muted-foreground self-center" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This is the email address associated with your account.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button 
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                        Details about your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">User ID</span>
                            <span className="text-sm font-mono">{user?.id?.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Member Since</span>
                            <span className="text-sm">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-muted-foreground">Email Verified</span>
                            <span className="text-sm">
                                {user?.emailVerified ? (
                                    <span className="text-green-600">Verified</span>
                                ) : (
                                    <span className="text-amber-600">Not verified</span>
                                )}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
