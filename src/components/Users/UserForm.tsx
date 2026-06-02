import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../Common/Button';
import type { Database } from '../../types/supabase';

type UserRow = Database['public']['Tables']['users']['Row'];

interface FormData {
  full_name: string;
  email: string;
  password?: string;
  confirm_password?: string;
  role: 'Manager' | 'NMD';
  is_active: boolean;
}

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEdit = Boolean(id && id !== 'new');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: 'Manager',
      is_active: true,
    },
  });

  useEffect(() => {
    if (!isEdit) {
      setInitialLoading(false);
      return;
    }
    async function loadUser() {
      if (!id) return;
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        const user = data as UserRow;
        reset({
          full_name: user.full_name,
          email: user.email,
          role: user.role === 'Manager' ? 'Manager' : 'NMD',
          is_active: user.is_active,
        });
      }
      setInitialLoading(false);
    }
    loadUser();
  }, [id, isEdit, reset]);

  const onSubmit = async (values: FormData) => {
    if (!currentUser || currentUser.role !== 'MD') {
      toast.error('Only MD can manage users');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        if (!id) return;
        const { error } = await supabase
          .from('users')
          .update({
            full_name: values.full_name,
            role: values.role,
            is_active: values.is_active,
          } as any)
          .eq('id', id);

        if (error) throw error;
        toast.success('User updated');
      } else {
        if (!values.password) {
          toast.error('Password is required');
          setLoading(false);
          return;
        }
        if (values.password !== values.confirm_password) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Failed to create auth user');

        const newUser = {
          id: signUpData.user.id,
          email: values.email,
          full_name: values.full_name,
          role: values.role,
          restaurant_id: currentUser.restaurant_id,
          is_active: values.is_active,
        } as any;

        const { error: insertError } = await supabase
          .from('users')
          .insert(newUser);

        if (insertError) throw insertError;
        toast.success('User created');
      }
      navigate('/users');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">
        {isEdit ? 'Edit User' : 'Add User'}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm">Full Name</label>
          <input
            {...register('full_name', { required: true })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            {...register('email', { required: true })}
            className="border rounded px-2 py-1 w-full"
            disabled={isEdit}
          />
        </div>

        {!isEdit && (
          <>
            <div>
              <label className="block text-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: true, minLength: 6 })}
                  className="border rounded px-2 py-1 w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.198.253-2.338.668-3.379m1.546-2.025A9.97 9.97 0 0112 3c5.523 0 10 4.477 10 10 0 1.198-.253 2.338-.668 3.379M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirm_password', {
                    required: true,
                    validate: (value) => value === watch('password') || 'Passwords do not match',
                  })}
                  className="border rounded px-2 py-1 w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.198.253-2.338.668-3.379m1.546-2.025A9.97 9.97 0 0112 3c5.523 0 10 4.477 10 10 0 1.198-.253 2.338-.668 3.379M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm">Role</label>
          <select {...register('role')} className="border rounded px-2 py-1 w-full">
            <option value="Manager">Manager</option>
            <option value="NMD">NMD (View Only)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            MD accounts are created directly in the database by the system administrator.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('is_active')} />
          <label className="text-sm">Active</label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}