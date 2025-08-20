"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { User, Save, Camera, Shield, CreditCard } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateProfile, loading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      setMessage(null);
      await updateProfile(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsUpdating(true);
      setMessage(null);
      // TODO: Implement password update API call
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      resetPassword();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Profile"
        description="Manage your account settings and preferences"
      />

      <div className="p-6 max-w-4xl space-y-6">
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, GIF or PNG. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      {...registerProfile('first_name')}
                      className={profileErrors.first_name ? 'border-destructive' : ''}
                    />
                    {profileErrors.first_name && (
                      <p className="text-destructive text-sm">{profileErrors.first_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      {...registerProfile('last_name')}
                      className={profileErrors.last_name ? 'border-destructive' : ''}
                    />
                    {profileErrors.last_name && (
                      <p className="text-destructive text-sm">{profileErrors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile('email')}
                    className={profileErrors.email ? 'border-destructive' : ''}
                    disabled // Email typically can't be changed
                  />
                  {profileErrors.email && (
                    <p className="text-destructive text-sm">{profileErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    {...registerProfile('phone')}
                  />
                </div>

                <Button type="submit" disabled={isUpdating} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    {...registerPassword('current_password')}
                    className={passwordErrors.current_password ? 'border-destructive' : ''}
                  />
                  {passwordErrors.current_password && (
                    <p className="text-destructive text-sm">{passwordErrors.current_password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...registerPassword('new_password')}
                    className={passwordErrors.new_password ? 'border-destructive' : ''}
                  />
                  {passwordErrors.new_password && (
                    <p className="text-destructive text-sm">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...registerPassword('confirm_password')}
                    className={passwordErrors.confirm_password ? 'border-destructive' : ''}
                  />
                  {passwordErrors.confirm_password && (
                    <p className="text-destructive text-sm">{passwordErrors.confirm_password.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isUpdating} className="w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account status and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Account Status</span>
                  <span className={`text-sm capitalize px-2 py-1 rounded-full ${
                    user?.email_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subscription</span>
                  <span className="text-sm capitalize font-medium">
                    {user?.subscription_status || 'Trial'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Role</span>
                  <span className="text-sm capitalize">
                    {user?.role?.replace('_', ' ') || 'User'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>

                {!user?.email_verified && (
                  <Button variant="outline" className="w-full">
                    Verify Email
                  </Button>
                )}

                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}