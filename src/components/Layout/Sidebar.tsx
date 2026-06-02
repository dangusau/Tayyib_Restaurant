import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);

  // All links visible to MD; for other roles we filter (but MD sees everything)
  const links = [
    { to: '/', label: 'Dashboard', roles: ['MD', 'Manager', 'NMD'] },
    { to: '/transactions', label: 'Transactions', roles: ['MD', 'Manager', 'NMD'] },
    { to: '/transactions/new', label: '+ New Transaction', roles: ['MD', 'Manager'] },
    { to: '/users', label: 'User Management', roles: ['MD'] },
  ];

  const visibleLinks = user?.role === 'MD'
    ? links
    : links.filter(l => l.roles.includes(user?.role ?? ''));

  return (
    <>
      {/* Dark overlay when sidebar is open on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 w-64 bg-white shadow-lg z-30 transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4 border-b flex items-center gap-3">
          <img src="/tayyib.jpg" alt="Logo" className="h-8 w-auto" />
          <h2 className="text-xl font-bold text-primary">Tayyib</h2>
        </div>

        <nav className="p-3 space-y-1">
          {visibleLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}