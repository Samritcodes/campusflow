import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfilePage() {
  const { user, refreshSession } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    department_id: user?.department_id || '',
    year_of_study: user?.year_of_study || '3rd Year',
    roll_number: user?.roll_number || '',
    interests: user?.interests || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Password Change State (Stage C)
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPw, setChangingPw] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  useEffect(() => {
    apiRequest('/auth/departments.php')
      .then((res) => setDepartments(res.data?.departments || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiRequest('/users/profile.php', {
        method: 'POST',
        body: form,
      });
      await refreshSession();
      setMessage({ type: 'success', text: res.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage(null);
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMessage({ type: 'error', text: 'New password and confirmation do not match' });
      return;
    }
    setChangingPw(true);
    try {
      const res = await apiRequest('/users/profile.php', {
        method: 'POST',
        body: {
          action: 'change_password',
          current_password: pwForm.current_password,
          new_password: pwForm.new_password,
        },
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPwMessage({ type: 'success', text: res.message });
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message });
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <header className="border-b border-[var(--cf-border)] pb-6">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
          STUDENT RECORD & SECURITY
        </p>
        <h1 className="font-editorial text-4xl text-[var(--cf-text)] mt-1">
          Academic profile
        </h1>
      </header>

      <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-7">
        {message && (
          <div
            className={`mb-5 p-3.5 rounded-md border text-xs font-medium ${
              message.type === 'success'
                ? 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={form.full_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
                Department
              </label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
                Academic Year
              </label>
              <select
                name="year_of_study"
                value={form.year_of_study}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Roll Number
            </label>
            <input
              type="text"
              name="roll_number"
              value={form.roll_number}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm font-mono-code text-[var(--cf-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Interests (Comma-separated for event recommendations)
            </label>
            <input
              type="text"
              name="interests"
              value={form.interests}
              onChange={handleChange}
              placeholder="AI, Web, Hackathon, Cultural, Robotics"
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save profile changes'}
          </button>
        </form>
      </div>

      {/* Password Change Section (Stage C) */}
      <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-7">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[var(--cf-primary)]" />
          <h2 className="font-editorial text-2xl text-[var(--cf-text)]">
            Update account password
          </h2>
        </div>

        {pwMessage && (
          <div
            className={`mb-5 p-3.5 rounded-md border text-xs font-medium ${
              pwMessage.type === 'success'
                ? 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
            }`}
          >
            {pwMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                minLength={6}
                required
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                minLength={6}
                required
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-sm text-[var(--cf-text)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPw}
            className="px-5 py-2.5 rounded-md bg-[var(--cf-text)] text-[var(--cf-bg)] text-xs font-semibold transition-colors cursor-pointer"
          >
            {changingPw ? 'Updating password...' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}
