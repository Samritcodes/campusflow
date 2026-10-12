import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Sparkles, Check } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth, getHomePathForRole } from '../context/AuthContext';

const INTEREST_OPTIONS = [
  'AI',
  'Web',
  'Hackathon',
  'Cultural',
  'Music',
  'Robotics',
  'IoT',
  'Cybersecurity',
  'Cloud',
  'Sports',
  'Design',
  'Workshop',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState(['AI', 'Web', 'Hackathon']);
  const [followedDepts, setFollowedDepts] = useState([]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    year_of_study: '3rd Year',
    roll_number: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest('/auth/departments.php')
      .then((res) => {
        const list = res.data?.departments || [];
        setDepartments(list);
        if (list.length > 0) {
          const firstId = Number(list[0].id);
          setForm((prev) => ({ ...prev, department_id: firstId }));
          setFollowedDepts([firstId]);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'department_id') {
      const numId = Number(value);
      setFollowedDepts((prev) => (prev.includes(numId) ? prev : [...prev, numId]));
    }
  };

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleFollowDept = (deptId) => {
    const numId = Number(deptId);
    setFollowedDepts((prev) =>
      prev.includes(numId) ? prev.filter((id) => id !== numId) : [...prev, numId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        interests: selectedInterests.length > 0 ? selectedInterests.join(', ') : 'AI, Web',
        followed_departments: followedDepts,
      };
      const newUser = await register(payload);
      navigate(getHomePathForRole(newUser.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <div className="mb-8">
        <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-primary)]">
          STUDENT REGISTRATION · PERSONALIZED FEED
        </p>
        <h1 className="font-editorial text-4xl text-[var(--cf-text)] mt-1">
          Create your campus profile
        </h1>
        <p className="text-sm text-[var(--cf-text-secondary)] mt-1.5">
          Select your interests and clubs so CampusFlow can curate your personal &ldquo;For You&rdquo; event feed.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-7">
        {error && (
          <div className="mb-5 p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="e.g. Rohan Sharma"
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] text-sm focus:outline-none focus:border-[var(--cf-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
                Campus Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="rohan@campusflow.edu"
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] text-sm focus:outline-none focus:border-[var(--cf-primary)]"
              />
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
                placeholder="CF2026CSE088"
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] text-sm font-mono-code focus:outline-none focus:border-[var(--cf-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
                Home Department
              </label>
              <select
                name="department_id"
                required
                value={form.department_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] text-sm focus:outline-none focus:border-[var(--cf-primary)]"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} — {dept.name}
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
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] text-sm focus:outline-none focus:border-[var(--cf-primary)]"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          {/* Interactive Interest Selector */}
          <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--cf-text)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
                Select Your Campus Interests
              </label>
              <span className="text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                {selectedInterests.length} selected
              </span>
            </div>
            <p className="text-[11px] text-[var(--cf-text-secondary)]">
              CampusFlow uses these topics to rank your personalized &ldquo;For You&rdquo; feed and recommend teammates.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {INTEREST_OPTIONS.map((tag) => {
                const active = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'border-[var(--cf-primary)] bg-[var(--cf-primary)] text-white'
                        : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow Additional Departments & Campus Communities */}
          {departments.length > 0 && (
            <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-2">
              <label className="block text-xs font-semibold text-[var(--cf-text)]">
                Follow Departments & Clubs for Updates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {departments.map((dept) => {
                  const isFollowed = followedDepts.includes(Number(dept.id));
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleFollowDept(dept.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-code border transition-colors cursor-pointer ${
                        isFollowed
                          ? 'border-[#059669] bg-[#059669]/10 text-[#059669] font-bold'
                          : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-secondary)]'
                      }`}
                    >
                      {isFollowed ? '✓ Following' : '+ Follow'} {dept.code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--cf-text)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] text-sm focus:outline-none focus:border-[var(--cf-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] disabled:opacity-50 font-semibold text-sm text-white transition-colors cursor-pointer mt-2"
          >
            {submitting ? 'Creating account...' : 'Complete registration'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[var(--cf-border)] text-center text-xs text-[var(--cf-text-secondary)]">
          Already registered?{' '}
          <Link to="/login" className="text-[var(--cf-primary)] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
