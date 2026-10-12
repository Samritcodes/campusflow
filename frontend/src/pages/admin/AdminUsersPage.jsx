import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isDeptManager = currentUser?.role === 'DEPARTMENT_MANAGER';
  const availableRoles = isDeptManager
    ? ['STUDENT', 'ORGANIZER']
    : ['STUDENT', 'ORGANIZER', 'DEPARTMENT_MANAGER', 'ADMIN'];

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiRequest('/admin/users.php'),
      apiRequest('/auth/departments.php'),
    ])
      .then(([uRes, dRes]) => {
        setUsers(uRes.data?.users || []);
        setDepartments(dRes.data?.departments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (targetUser, newRole, newDeptId) => {
    setUpdatingId(targetUser.id);
    setFeedback(null);
    try {
      const res = await apiRequest('/admin/users.php', {
        method: 'POST',
        body: {
          user_id: targetUser.id,
          role: newRole,
          department_id: newRole === 'ADMIN' ? null : (newDeptId ?? targetUser.department_id),
        },
      });
      setFeedback({ type: 'success', text: `${targetUser.full_name}: ${res.message}` });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--cf-border)] pb-6">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
          {isDeptManager
            ? `${currentUser?.department_code} DEPARTMENT GOVERNANCE`
            : 'CAMPUS-WIDE ACCESS CONTROL'}
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
          {isDeptManager
            ? `${currentUser?.department_name} members & organizers`
            : 'Users & role assignment'}
        </h1>
        <p className="text-sm text-[var(--cf-text-secondary)] mt-1.5 max-w-2xl">
          {isDeptManager
            ? `Showing members enrolled in ${currentUser?.department_code}. You can promote students in your department to ORGANIZER.`
            : 'Manage roles and department assignments across the entire university. System Admins operate campus-wide across all departments.'}
        </p>
      </header>

      {feedback && (
        <div
          className={`p-3.5 rounded-md border text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--cf-text-secondary)]">Loading members...</p>
      ) : (
        <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--cf-border)] text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] bg-[var(--cf-bg)]">
                <th className="py-3 px-4">Name & Email</th>
                <th className="py-3 px-4">Department Scope</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-border)] text-sm">
              {users.map((u) => {
                const isSelf = Number(u.id) === Number(currentUser?.id);
                const isTargetAdmin = u.role === 'ADMIN';

                return (
                  <tr key={u.id} className="hover:bg-[var(--cf-surface-muted)]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[var(--cf-text)]">
                        {u.full_name}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-mono-code text-[var(--cf-text-secondary)]">
                        {u.email} {u.roll_number ? `· ${u.roll_number}` : ''}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      {isTargetAdmin ? (
                        <span className="text-xs font-mono-code text-[var(--cf-primary)] font-semibold">
                          ALL DEPARTMENTS (SYSTEM)
                        </span>
                      ) : isDeptManager ? (
                        <span className="text-xs font-mono-code text-[var(--cf-text)]">
                          {u.department_code} — {u.department_name}
                        </span>
                      ) : (
                        <select
                          disabled={updatingId === u.id}
                          value={u.department_id || ''}
                          onChange={(e) => handleRoleChange(u, u.role, Number(e.target.value))}
                          className="px-2.5 py-1 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)] text-xs font-mono-code text-[var(--cf-text)]"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.code} — {d.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono-code text-xs px-2.5 py-1 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] font-semibold">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <select
                        disabled={isSelf || updatingId === u.id || (isDeptManager && isTargetAdmin)}
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u,
                            e.target.value,
                            u.department_id || departments[0]?.id || 1
                          )
                        }
                        className="px-3 py-1.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-xs font-mono-code text-[var(--cf-text)] disabled:opacity-50 cursor-pointer"
                      >
                        {availableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
