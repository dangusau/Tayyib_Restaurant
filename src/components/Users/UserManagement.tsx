import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import type { User } from '../../types';
import Button from '../Common/Button';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    setUsers((data as User[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (user: User) => {
    const newActive = !user.is_active;
    const { error } = await supabase
      .from('users')
      .update({ is_active: newActive } as any)
      .eq('id', user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${user.full_name} ${newActive ? 'activated' : 'deactivated'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newActive } : u))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">User Management</h2>
        <Button onClick={() => navigate('/users/new')}>+ Add User</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.full_name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/users/${u.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={u.is_active ? 'danger' : 'secondary'}
                    onClick={() => toggleActive(u)}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}