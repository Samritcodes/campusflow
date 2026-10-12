import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Ticket,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Bookmark,
  Star,
  Pencil,
  X,
  Users,
  CalendarPlus,
  Download,
  Clock,
  ScrollText,
  Award,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatEventDateLong, formatTime12h } from '../utils/date';
import DigitalPassModal from '../components/passes/DigitalPassModal';
import CertificateModal from '../components/passes/CertificateModal';
import PaymentCheckoutModal from '../components/payments/PaymentCheckoutModal';
import EventCommunityAndResources from '../components/events/EventCommunityAndResources';

export default function EventDetails() {
  const { slug } = useParams();
  const location = useLocation();
  const { user, refreshSession } = useAuth();

  const isStudentWorkspace = location.pathname.startsWith('/student');
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const isOrganizerWorkspace = location.pathname.startsWith('/organizer');
  const isInsideWorkspace = isStudentWorkspace || isAdminWorkspace || isOrganizerWorkspace;

  const isStaff =
    user && ['ADMIN', 'DEPARTMENT_MANAGER', 'ORGANIZER'].includes(user.role);

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [managing, setManaging] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [activePassModal, setActivePassModal] = useState(null);
  const [certificatePass, setCertificatePass] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Feature #1 + Squad Code Join + Campus Community Networking State
  const [useTeamReg, setUseTeamReg] = useState(false);
  const [teamMode, setTeamMode] = useState('create'); // 'create' | 'join'
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [shareProfile, setShareProfile] = useState(true);
  const [lookingForTeam, setLookingForTeam] = useState(false);
  const [teammateNote, setTeammateNote] = useState('');

  // Edit Event Modal State (Stage A + Feature #5)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Staff announcement inline form
  const [showBulletinForm, setShowBulletinForm] = useState(false);
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinMessage, setBulletinMessage] = useState('');
  const [bulletinPriority, setBulletinPriority] = useState('IMPORTANT');

  // Student 1-5 Star Rating & Feedback State (Stage B)
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadEvent = useCallback(() => {
    setLoading(true);
    apiRequest(`/events/show.php?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        const ev = res.data?.event || null;
        setEvent(ev);
        if (ev) {
          if (ev.category === 'Hackathon') {
            setUseTeamReg(true);
          }
          setEditForm({
            event_id: ev.id,
            title: ev.title,
            category: ev.category,
            venue: ev.venue,
            event_date: ev.event_date,
            start_time: (ev.start_time || '10:00').slice(0, 5),
            end_time: (ev.end_time || '13:00').slice(0, 5),
            capacity: ev.capacity,
            registration_fee: ev.registration_fee || 0,
            prize_pool: ev.prize_pool || '',
            banner_url: ev.banner_url || '',
            description: ev.description || '',
            agenda_text: ev.agenda_text || '',
            rules_text: ev.rules_text || '',
          });
          if (ev.my_feedback) {
            setRatingVal(ev.my_feedback.rating || 5);
            setRatingComment(ev.my_feedback.comment || '');
          }
        }
        if (ev && isStaff) {
          apiRequest(`/events/manage.php?event_id=${ev.id}`)
            .then((pRes) => setParticipants(pRes.data?.participants || []))
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, isStaff]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const executeRegistration = async (paymentPayload = {}) => {
    if (!event) return;
    const feeAmount = Number(event.registration_fee || 0);
    if (feeAmount > 0 && (!paymentPayload.order_id || !paymentPayload.payment_signature)) {
      setShowPaymentModal(true);
      return;
    }
    setRegistering(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/registrations/register.php', {
        method: 'POST',
        body: {
          event_id: event.id,
          team_name: useTeamReg && teamMode === 'create' ? teamName.trim() : '',
          team_members: useTeamReg && teamMode === 'create' ? teamMembers.trim() : '',
          join_team_code: useTeamReg && teamMode === 'join' ? joinTeamCode.trim().toUpperCase() : '',
          share_profile: shareProfile,
          looking_for_team: lookingForTeam,
          teammate_note: lookingForTeam ? teammateNote.trim() : '',
          ...paymentPayload,
        },
      });
      setShowPaymentModal(false);
      await refreshSession();
      loadEvent();
      setFeedback({ type: 'success', text: res.message });
      if (res.data?.pass) {
        setActivePassModal(res.data.pass);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
      throw err;
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterClick = () => {
    if (!event) return;
    if (useTeamReg && teamMode === 'create' && !teamName.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please enter a Team / Squad Name or switch to Join Existing Squad.',
      });
      return;
    }
    if (useTeamReg && teamMode === 'join' && !joinTeamCode.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please enter a valid Squad Invite Code (e.g. TEAM-NEUR).',
      });
      return;
    }
    const fee = Number(event.registration_fee || 0);
    if (fee > 0) {
      setShowPaymentModal(true);
    } else {
      executeRegistration();
    }
  };

  const handleToggleBookmark = async () => {
    if (!event || !user) return;
    try {
      const res = await apiRequest('/events/bookmark.php', {
        method: 'POST',
        body: { event_id: event.id },
      });
      setEvent((prev) => (prev ? { ...prev, is_saved: Boolean(res.data?.saved) } : prev));
      setFeedback({ type: 'success', text: res.message });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleMarkEventReminder = async () => {
    if (!event || !user) return;
    try {
      const res = await apiRequest('/calendar/index.php', {
        method: 'POST',
        body: {
          action: 'create',
          event_id: event.id,
          title: `Event Reminder: ${event.title}`,
          reminder_date: event.event_date,
          reminder_time: (event.start_time || '10:00').slice(0, 5),
          note: `Venue: ${event.venue} · ${event.department_code}`,
          color_tag: 'vermilion',
        },
      });
      setFeedback({
        type: 'success',
        text: `${res.message} View it anytime in your Calendar & Reminders.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!event) return;
    setSubmittingReview(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/events/feedback.php', {
        method: 'POST',
        body: {
          event_id: event.id,
          rating: ratingVal,
          comment: ratingComment,
        },
      });
      setFeedback({ type: 'success', text: res.message });
      loadEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSaveEditedEvent = async (e) => {
    e.preventDefault();
    if (!editForm) return;
    setManaging(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/events/update.php', {
        method: 'POST',
        body: editForm,
      });
      setShowEditModal(false);
      setFeedback({ type: 'success', text: res.message });
      loadEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setManaging(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event) return;
    setCancelling(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/registrations/cancel.php', {
        method: 'POST',
        body: { event_id: event.id },
      });
      await refreshSession();
      loadEvent();
      setActivePassModal(null);
      setFeedback({ type: 'success', text: res.message });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const handleStaffAction = async (action, extra = {}) => {
    if (!event) return;
    setManaging(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/events/manage.php', {
        method: 'POST',
        body: { event_id: event.id, action, ...extra },
      });
      setFeedback({ type: 'success', text: res.message });
      loadEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setManaging(false);
    }
  };

  const handleMarkParticipantAttended = async (passId) => {
    setManaging(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/registrations/verify.php', {
        method: 'POST',
        body: { pass_id: passId, action: 'mark_attended' },
      });
      setFeedback({ type: 'success', text: res.message });
      loadEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setManaging(false);
    }
  };

  const handlePostBulletin = async (e) => {
    e.preventDefault();
    if (!event) return;
    setManaging(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/announcements/create.php', {
        method: 'POST',
        body: {
          title: bulletinTitle,
          message: bulletinMessage,
          priority: bulletinPriority,
          department_id: event.department_id,
          event_id: event.id,
        },
      });
      setBulletinTitle('');
      setBulletinMessage('');
      setShowBulletinForm(false);
      setFeedback({ type: 'success', text: res.message });
      loadEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setManaging(false);
    }
  };

  // Feature #4: Export Participant Roster as UTF-8 CSV for Staff
  const handleDownloadRosterCSV = () => {
    if (!event || participants.length === 0) return;
    const headers = [
      'Pass ID',
      'Student Name',
      'Email',
      'Department',
      'Year',
      'Roll Number',
      'Team Name',
      'Team Code',
      'Team Members',
      'Status',
      'Award / Rank',
      'Payment Status',
      'Amount Paid (INR)',
      'Transaction ID',
      'Registered At',
    ];
    const escapeCsv = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = participants.map((p) =>
      [
        p.pass_id,
        p.student_name,
        p.email,
        p.student_department_code,
        p.year_of_study,
        p.roll_number || '',
        p.team_name || '',
        p.team_code || '',
        p.team_members || '',
        p.status,
        p.award_title || '',
        p.payment_status || 'FREE',
        p.amount_paid || 0,
        p.transaction_id || '',
        p.registered_at || '',
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.slug || 'event'}-roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Feature #4: Download .ics Calendar Invite for Students
  const handleDownloadICS = () => {
    if (!event) return;
    const dateClean = (event.event_date || '2026-04-15').replace(/-/g, '');
    const startClean = (event.start_time || '10:00:00').replace(/:/g, '').padEnd(6, '0').slice(0, 6);
    const endClean = (event.end_time || '13:00:00').replace(/:/g, '').padEnd(6, '0').slice(0, 6);
    const passInfo = event.my_registration?.pass_id
      ? `\\nCampusFlow Pass ID: ${event.my_registration.pass_id}`
      : '';
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampusFlow//University Event Management//EN',
      'BEGIN:VEVENT',
      `UID:campusflow-event-${event.id}@campusflow.edu`,
      `DTSTAMP:${dateClean}T090000Z`,
      `DTSTART:${dateClean}T${startClean}`,
      `DTEND:${dateClean}T${endClean}`,
      `SUMMARY:${event.title} (${event.department_code})`,
      `LOCATION:${event.venue}`,
      `DESCRIPTION:${(event.description || '').replace(/\r?\n/g, '\\n')}${passInfo}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.slug || 'campusflow-event'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildPassPayload = () => {
    if (!event || !event.my_registration) return null;
    return {
      pass_id: event.my_registration.pass_id,
      status: event.my_registration.status,
      amount_paid: event.my_registration.amount_paid,
      payment_status: event.my_registration.payment_status,
      payment_method: event.my_registration.payment_method,
      transaction_id: event.my_registration.transaction_id,
      team_name: event.my_registration.team_name,
      team_code: event.my_registration.team_code,
      team_members: event.my_registration.team_members,
      award_title: event.my_registration.award_title,
      event_id: event.id,
      event_title: event.title,
      category: event.category,
      department_code: event.department_code,
      department_name: event.department_name,
      venue: event.venue,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      registration_fee: event.registration_fee,
      prize_pool: event.prize_pool,
      student_name: user?.full_name,
      student_department_code: user?.department_code,
      year_of_study: user?.year_of_study,
      roll_number: user?.roll_number,
    };
  };

  const openExistingPassModal = () => {
    const payload = buildPassPayload();
    if (payload) setActivePassModal(payload);
  };

  const openCertificateFromEvent = () => {
    const payload = buildPassPayload();
    if (payload) setCertificatePass(payload);
  };

  const backLink = isAdminWorkspace
    ? '/admin'
    : isOrganizerWorkspace
    ? '/organizer'
    : isStudentWorkspace
    ? '/student/discover'
    : '/events';

  if (loading) {
    return (
      <div className={isInsideWorkspace ? 'py-12' : 'max-w-5xl mx-auto px-6 py-12'}>
        <p className="text-sm text-[var(--cf-text-secondary)]">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={isInsideWorkspace ? 'py-12' : 'max-w-5xl mx-auto px-6 py-12'}>
        <p className="text-sm text-rose-600">{error || 'Event not found'}</p>
      </div>
    );
  }

  const seatsRemaining = Math.max(0, event.capacity - event.registered_count);
  const fee = Number(event.registration_fee || 0);
  const myReg = event.my_registration;
  const isActiveReg = myReg && myReg.status !== 'CANCELLED';
  const canManageThisEvent =
    user?.role === 'ADMIN' ||
    (isStaff && Number(user?.department_id) === Number(event.department_id));

  const agendaLines = (event.agenda_text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  const rulesLines = (event.rules_text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  return (
    <div className={isInsideWorkspace ? 'space-y-8' : 'max-w-5xl mx-auto px-6 py-12 space-y-8'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backLink}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        {user && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkEventReminder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-primary)] hover:border-[var(--cf-primary)] transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
              Mark Reminder on Calendar
            </button>

            {!isStaff && (
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                  event.is_saved
                    ? 'border-[var(--cf-primary)] bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]'
                    : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${event.is_saved ? 'fill-current' : ''}`} />
                {event.is_saved ? 'Saved to Bookmarks' : 'Save Event'}
              </button>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-md border text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Editorial Cover Banner */}
      <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden">
        <div className="aspect-[21/9] bg-[var(--cf-surface-muted)] overflow-hidden border-b border-[var(--cf-border)]">
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Editorial Description + Agenda + Rules + Winners Podium + Staff Roster + Ratings */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code uppercase text-[var(--cf-primary)] mb-2">
                <span>{event.category}</span>
                <span>·</span>
                <span>{event.department_name} ({event.department_code})</span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text)]">
                  {event.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border font-bold ${
                    fee > 0
                      ? 'border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]'
                      : 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
                  }`}
                >
                  {fee > 0 ? `ENTRY: ₹${fee}` : 'FREE ENTRY'}
                </span>
                {event.avg_rating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold">
                    <Star className="w-3 h-3 fill-current" /> {event.avg_rating} ({event.feedback_count})
                  </span>
                )}
              </div>
              <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] leading-tight">
                {event.title}
              </h1>

              {event.prize_pool && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#059669]/30 bg-[#059669]/5 text-xs font-semibold text-[#059669]">
                  <Trophy className="w-4 h-4" />
                  <span>Prize Pool & Participant Rewards: {event.prize_pool}</span>
                </div>
              )}
            </div>

            {/* Feature #2: Winners Podium & Hall of Fame */}
            {event.winners?.length > 0 && (
              <div className="p-5 rounded-lg border-2 border-amber-500/40 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-mono-code font-bold uppercase tracking-wider text-amber-600">
                    OFFICIAL WINNERS PODIUM & HONORS
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.winners.map((w, idx) => (
                    <div
                      key={`${w.pass_id}-${idx}`}
                      className="p-3.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="inline-block text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30 mb-1.5">
                          🏆 {w.award_title}
                        </span>
                        <p className="text-sm font-bold text-[var(--cf-text)]">{w.student_name}</p>
                        <p className="text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                          {w.student_department_code} · {w.year_of_study}
                        </p>
                        {w.team_name && (
                          <p className="text-[11px] font-mono-code font-semibold text-[var(--cf-primary)] mt-1">
                            Squad: {w.team_name}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono-code text-[var(--cf-text-secondary)]">
                        {w.pass_id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[var(--cf-border)]">
              <h2 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-text-secondary)] mb-3">
                ABOUT THIS EVENT
              </h2>
              <p className="text-sm text-[var(--cf-text)] leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Feature #5: Event Schedule & Itinerary Timeline */}
            {agendaLines.length > 0 && (
              <div className="pt-6 border-t border-[var(--cf-border)]">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[var(--cf-primary)]" />
                  <h2 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-text-secondary)]">
                    EVENT SCHEDULE & ITINERARY
                  </h2>
                </div>
                <div className="space-y-2.5 border-l-2 border-[var(--cf-primary)]/30 pl-4 ml-1.5">
                  {agendaLines.map((item, i) => {
                    const parts = item.split(/\s*[—–-]\s*/);
                    const hasTimePrefix = parts.length > 1 && /\d/.test(parts[0]);
                    return (
                      <div key={i} className="relative text-xs">
                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--cf-primary)] border-2 border-[var(--cf-surface)]" />
                        {hasTimePrefix ? (
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                            <span className="font-mono-code font-bold text-[var(--cf-primary)] shrink-0">
                              {parts[0]}
                            </span>
                            <span className="text-[var(--cf-text)] font-medium">
                              {parts.slice(1).join(' — ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--cf-text)]">{item}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feature #5: Rules & Eligibility Guidelines */}
            {rulesLines.length > 0 && (
              <div className="pt-6 border-t border-[var(--cf-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <ScrollText className="w-4 h-4 text-[#059669]" />
                  <h2 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-text-secondary)]">
                    RULES, ELIGIBILITY & GUIDELINES
                  </h2>
                </div>
                <div className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-2">
                  {rulesLines.map((rule, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--cf-text)]">
                      <span className="font-mono-code font-bold text-[#059669] mt-0.5">0{i + 1}.</span>
                      <span className="leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.announcements?.length > 0 && (
              <div className="pt-6 border-t border-[var(--cf-border)]">
                <h2 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-text-secondary)] mb-3">
                  ORGANIZER UPDATES
                </h2>
                <div className="space-y-3">
                  {event.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)]"
                    >
                      <p className="text-xs font-bold text-[var(--cf-text)]">{ann.title}</p>
                      <p className="text-xs text-[var(--cf-text-secondary)] mt-1">{ann.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAFF VIEW: Registered Participants Roster + CSV Export + Award Assignment */}
            {isStaff && (
              <div className="pt-6 border-t border-[var(--cf-border)]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-primary)]">
                    REGISTERED PARTICIPANTS & PASS ROSTER ({participants.length})
                  </h2>
                  {participants.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadRosterCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] hover:border-[var(--cf-primary)] text-[11px] font-mono-code font-semibold text-[var(--cf-text)] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--cf-primary)]" /> Export Roster (.CSV)
                    </button>
                  )}
                </div>

                {participants.length === 0 ? (
                  <p className="text-xs text-[var(--cf-text-secondary)] py-3">
                    No student passes issued for this event yet.
                  </p>
                ) : (
                  <div className="rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--cf-border)] font-mono-code text-[10px] uppercase text-[var(--cf-text-secondary)]">
                          <th className="py-2.5 px-3">Pass ID</th>
                          <th className="py-2.5 px-3">Student & Squad</th>
                          <th className="py-2.5 px-3">Payment / Receipt</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Honors / Podium</th>
                          <th className="py-2.5 px-3 text-right">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--cf-border)]">
                        {participants.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2.5 px-3 font-mono-code font-semibold text-[var(--cf-primary)]">
                              {p.pass_id}
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-[var(--cf-text)]">{p.student_name}</p>
                              <p className="text-[11px] text-[var(--cf-text-secondary)]">
                                {p.student_department_code} · {p.year_of_study}{' '}
                                {p.roll_number ? `· ${p.roll_number}` : ''}
                              </p>
                              {p.team_name && (
                                <p className="text-[11px] font-mono-code font-semibold text-[var(--cf-primary)] mt-0.5">
                                  Squad: {p.team_name} {p.team_code ? `(${p.team_code})` : ''}
                                  {p.team_members ? ` · [${p.team_members}]` : ''}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono-code text-[11px]">
                              {Number(p.amount_paid || 0) > 0 ? (
                                <div>
                                  <span className="font-semibold text-[#059669]">
                                    {p.payment_status} · ₹{Number(p.amount_paid)}
                                  </span>
                                  <p className="text-[10px] text-[var(--cf-text-secondary)]">
                                    {p.transaction_id || p.payment_method}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[var(--cf-text-secondary)]">FREE</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono-code">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  p.status === 'ATTENDED' || p.status === 'CONFIRMED'
                                    ? 'bg-[#059669]/10 text-[#059669]'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {canManageThisEvent && p.status !== 'CANCELLED' ? (
                                <select
                                  disabled={managing}
                                  value={p.award_title || ''}
                                  onChange={(e) =>
                                    handleStaffAction('assign_award', {
                                      pass_id: p.pass_id,
                                      award_title: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)] text-[11px] font-mono-code text-[var(--cf-text)]"
                                >
                                  <option value="">— Participant —</option>
                                  <option value="1st Place Winner">🏆 1st Place Winner</option>
                                  <option value="2nd Place Runner-Up">🥈 2nd Place Runner-Up</option>
                                  <option value="3rd Place Winner">🥉 3rd Place Winner</option>
                                  <option value="Finalist">⭐ Finalist</option>
                                </select>
                              ) : p.award_title ? (
                                <span className="text-[11px] font-mono-code font-bold text-amber-600">
                                  🏆 {p.award_title}
                                </span>
                              ) : (
                                <span className="text-[var(--cf-text-secondary)]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {p.status === 'CONFIRMED' && canManageThisEvent ? (
                                <button
                                  type="button"
                                  disabled={managing}
                                  onClick={() => handleMarkParticipantAttended(p.pass_id)}
                                  className="px-2.5 py-1 rounded bg-[#059669] hover:bg-[#047857] text-white font-semibold text-[11px] cursor-pointer"
                                >
                                  Mark Attended ✓
                                </button>
                              ) : p.status === 'ATTENDED' ? (
                                <span className="inline-flex items-center gap-1 text-[#059669] font-mono-code text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                </span>
                              ) : (
                                <span className="text-[var(--cf-text-secondary)]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* EVENT RESOURCE HUB, CAMPUS COMMUNITY DIRECTORY & Q&A BOARD */}
            <EventCommunityAndResources
              event={event}
              user={user}
              canManage={canManageThisEvent}
              onRefresh={loadEvent}
              onSelectSquadCode={(code) => {
                setUseTeamReg(true);
                setTeamMode('join');
                setJoinTeamCode(code);
                setFeedback({
                  type: 'success',
                  text: `Squad Code ${code} selected! Click Register in the pass box to join this squad.`,
                });
              }}
            />

            {/* PARTICIPANT FEEDBACK & RATINGS SECTION (Stage B) */}
            <div className="pt-6 border-t border-[var(--cf-border)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-text-secondary)]">
                  PARTICIPANT FEEDBACK & RATINGS ({event.feedback_count || 0})
                </h2>
                {event.avg_rating && (
                  <span className="text-xs font-mono-code font-bold text-amber-600">
                    ★ {event.avg_rating} / 5.0
                  </span>
                )}
              </div>

              {isActiveReg && !isStaff && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--cf-text)]">
                      {event.my_feedback ? 'Update your rating & feedback' : 'Rate your experience'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingVal(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= ratingVal
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-[var(--cf-text-secondary)]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your thoughts on the session, speakers, or organization..."
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-xs text-[var(--cf-text)]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-1.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold cursor-pointer"
                    >
                      {submittingReview ? 'Saving...' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              )}

              {event.feedback?.length > 0 ? (
                <div className="space-y-3">
                  {event.feedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[var(--cf-text)]">
                          {fb.student_name}{' '}
                          <span className="font-mono-code text-[11px] text-[var(--cf-text-secondary)]">
                            ({fb.student_department_code || 'Student'})
                          </span>
                        </span>
                        <span className="font-mono-code font-bold text-amber-500">
                          {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                        </span>
                      </div>
                      {fb.comment && (
                        <p className="text-[var(--cf-text-secondary)] leading-relaxed">{fb.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--cf-text-secondary)]">
                  No participant reviews submitted yet.
                </p>
              )}
            </div>
          </div>

          {/* Right: Schedule, Venue, Ticket Fee & Role-Specific Action Box */}
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] p-6 space-y-5">
              {/* Ticket Fee & Prize Highlight */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--cf-border)]">
                <div>
                  <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                    PASS ENTRY FEE
                  </p>
                  <p className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                    {fee > 0 ? `₹${fee}` : 'Free'}
                  </p>
                </div>
                {fee > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono-code font-semibold bg-[#059669]/10 text-[#059669] border border-[#059669]/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> CampusFlow Pay
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                    DATE & TIME
                  </p>
                  <p className="text-sm font-bold text-[var(--cf-text)] mt-1">
                    {formatEventDateLong(event.event_date)}
                  </p>
                  <p className="text-xs font-mono-code text-[var(--cf-text-secondary)] mt-0.5">
                    {formatTime12h(event.start_time)} – {formatTime12h(event.end_time)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadICS}
                  title="Download .ics Calendar Invite"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-[10px] font-mono-code font-semibold text-[var(--cf-text)] cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-[var(--cf-primary)]" /> .ICS
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--cf-border)]">
                <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  VENUE
                </p>
                <p className="text-sm font-bold text-[var(--cf-text)] mt-1">{event.venue}</p>
              </div>

              <div className="pt-4 border-t border-[var(--cf-border)]">
                <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  ORGANIZER
                </p>
                <p className="text-sm font-semibold text-[var(--cf-text)] mt-1">
                  {event.organizer_name}
                </p>
                <p className="text-xs text-[var(--cf-text-secondary)]">{event.department_name}</p>
              </div>

              <div className="pt-4 border-t border-[var(--cf-border)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--cf-text-secondary)]">Registration</span>
                  <span className="font-mono-code font-semibold text-[var(--cf-text)]">
                    {event.registered_count} / {event.capacity}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--cf-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--cf-primary)]"
                    style={{
                      width: `${Math.min(100, Math.round((event.registered_count / event.capacity) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[var(--cf-text-secondary)] mt-1.5">
                  {seatsRemaining > 0 ? `${seatsRemaining} seats remaining` : 'Event full — waitlist open'}
                </p>
              </div>

              {/* ROLE-SPECIFIC ACTION BLOCK */}
              <div className="pt-4 border-t border-[var(--cf-border)] space-y-3">
                {isStaff ? (
                  canManageThisEvent ? (
                    <div className="space-y-3">
                      <p className="text-[11px] font-mono-code font-semibold uppercase text-[var(--cf-primary)]">
                        {user.role.replace('_', ' ')} CONTROLS
                      </p>

                      <div>
                        <label className="block text-[11px] text-[var(--cf-text-secondary)] mb-1">
                          Event Status
                        </label>
                        <select
                          disabled={managing}
                          value={event.status}
                          onChange={(e) => handleStaffAction('update_status', { status: e.target.value })}
                          className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-xs font-mono-code text-[var(--cf-text)]"
                        >
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="ONGOING">ONGOING</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-xs font-semibold text-[var(--cf-text)] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Event Details & Schedule
                      </button>

                      <button
                        type="button"
                        disabled={managing}
                        onClick={() => handleStaffAction('toggle_featured')}
                        className="w-full py-2 px-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-xs font-semibold text-[var(--cf-text)] transition-colors cursor-pointer"
                      >
                        {event.is_featured ? '★ Featured on Homepage (Remove)' : '☆ Feature on Homepage'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowBulletinForm((v) => !v)}
                        className="w-full py-2.5 px-3 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {showBulletinForm ? 'Close Bulletin Form' : '+ Post Event Update'}
                      </button>

                      {showBulletinForm && (
                        <form onSubmit={handlePostBulletin} className="pt-2 space-y-2.5 text-xs">
                          <input
                            type="text"
                            required
                            placeholder="Update title..."
                            value={bulletinTitle}
                            onChange={(e) => setBulletinTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)]"
                          />
                          <textarea
                            rows={3}
                            required
                            placeholder="Message for participants..."
                            value={bulletinMessage}
                            onChange={(e) => setBulletinMessage(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)]"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={bulletinPriority}
                              onChange={(e) => setBulletinPriority(e.target.value)}
                              className="px-2.5 py-1.5 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[11px]"
                            >
                              <option value="NORMAL">NORMAL</option>
                              <option value="IMPORTANT">IMPORTANT</option>
                              <option value="URGENT">URGENT</option>
                            </select>
                            <button
                              type="submit"
                              disabled={managing}
                              className="px-3.5 py-1.5 rounded bg-[var(--cf-text)] text-[var(--cf-bg)] font-semibold cursor-pointer"
                            >
                              Publish
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs text-[var(--cf-text-secondary)]">
                      Viewing as <strong className="text-[var(--cf-text)]">{user.role.replace('_', ' ')}</strong> ({user.department_code}). This event is managed by {event.department_code} Department.
                    </div>
                  )
                ) : isActiveReg ? (
                  <>
                    <div className="p-3.5 rounded-md border border-[#059669]/30 bg-[#059669]/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#059669]">
                          REGISTERED · {myReg.status} ✓
                        </p>
                        {myReg.award_title && (
                          <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 border border-amber-500/40">
                            🏆 {myReg.award_title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono-code text-[var(--cf-text)]">
                        Pass ID: {myReg.pass_id}
                      </p>
                      {myReg.team_name && (
                        <div className="pt-1 border-t border-[#059669]/20 text-[11px] font-mono-code">
                          <p className="font-semibold text-[var(--cf-primary)]">
                            Squad: {myReg.team_name} {myReg.team_code ? `(${myReg.team_code})` : ''}
                          </p>
                          {myReg.team_members && (
                            <p className="text-[var(--cf-text-secondary)]">
                              Members: {myReg.team_members}
                            </p>
                          )}
                        </div>
                      )}
                      {Number(myReg.amount_paid || 0) > 0 && (
                        <p className="text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                          Paid ₹{Number(myReg.amount_paid)} · {myReg.transaction_id || myReg.payment_method}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={openExistingPassModal}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" /> View Digital Pass & Receipt
                    </button>

                    {(myReg.status === 'ATTENDED' || Boolean(myReg.award_title)) && (
                      <button
                        type="button"
                        onClick={openCertificateFromEvent}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-white font-semibold text-xs transition-colors cursor-pointer ${
                          myReg.award_title
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-[#059669] hover:bg-[#047857]'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />{' '}
                        {myReg.award_title ? 'View Merit Certificate' : 'View Participation Certificate'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleDownloadICS}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-[var(--cf-text)] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-[var(--cf-primary)]" /> Add to Calendar (.ics)
                    </button>

                    {(myReg.status === 'CONFIRMED' || myReg.status === 'WAITLISTED') && (
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={handleCancelRegistration}
                        className="w-full py-2 px-4 rounded-md border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {cancelling
                          ? 'Cancelling...'
                          : Number(myReg.amount_paid || 0) > 0
                          ? 'Cancel pass & request refund'
                          : 'Cancel registration'}
                      </button>
                    )}
                  </>
                ) : user ? (
                  <div className="space-y-3">
                    {/* Feature #1 + Squad Code Join: Team / Squad Registration Toggle */}
                    <div className="p-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-2.5 text-xs">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--cf-text)]">
                          <Users className="w-3.5 h-3.5 text-[var(--cf-primary)]" /> Register as a Team / Squad
                        </span>
                        <input
                          type="checkbox"
                          checked={useTeamReg}
                          onChange={(e) => setUseTeamReg(e.target.checked)}
                          className="accent-[var(--cf-primary)] cursor-pointer"
                        />
                      </label>

                      {useTeamReg && (
                        <div className="space-y-2.5 pt-2 border-t border-[var(--cf-border)]">
                          <div className="grid grid-cols-2 gap-1.5 p-1 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)]">
                            <button
                              type="button"
                              onClick={() => setTeamMode('create')}
                              className={`py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                teamMode === 'create'
                                  ? 'bg-[var(--cf-primary)] text-white'
                                  : 'text-[var(--cf-text-secondary)]'
                              }`}
                            >
                              Create New Squad
                            </button>
                            <button
                              type="button"
                              onClick={() => setTeamMode('join')}
                              className={`py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                teamMode === 'join'
                                  ? 'bg-[var(--cf-primary)] text-white'
                                  : 'text-[var(--cf-text-secondary)]'
                              }`}
                            >
                              Join by Squad Code
                            </button>
                          </div>

                          {teamMode === 'create' ? (
                            <>
                              <div>
                                <label className="block text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-1">
                                  TEAM / SQUAD NAME *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. ByteCraft AI"
                                  value={teamName}
                                  onChange={(e) => setTeamName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)] text-xs text-[var(--cf-text)]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-1">
                                  TEAMMATES (NAMES & DEPT)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Riya (ECE), Kabir (CSE)"
                                  value={teamMembers}
                                  onChange={(e) => setTeamMembers(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)] text-xs text-[var(--cf-text)]"
                                />
                              </div>
                            </>
                          ) : (
                            <div>
                              <label className="block text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-1">
                                ENTER SQUAD INVITE CODE *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. TEAM-NEUR"
                                value={joinTeamCode}
                                onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)] text-xs font-mono-code uppercase text-[var(--cf-text)]"
                              />
                              <p className="text-[10px] text-[var(--cf-text-secondary)] mt-1">
                                Links your personal pass & certificate to your leader&apos;s squad.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Campus Community Consent & Teammate Finder Toggle */}
                    <div className="p-3 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-2 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shareProfile}
                          onChange={(e) => setShareProfile(e.target.checked)}
                          className="accent-[var(--cf-primary)] mt-0.5 cursor-pointer"
                        />
                        <span className="text-[11px] text-[var(--cf-text-secondary)] leading-snug">
                          Show my profile in this event&apos;s <strong className="text-[var(--cf-text)]">Campus Community Directory</strong>
                        </span>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lookingForTeam}
                          onChange={(e) => setLookingForTeam(e.target.checked)}
                          className="accent-[#059669] mt-0.5 cursor-pointer"
                        />
                        <span className="text-[11px] text-[var(--cf-text-secondary)] leading-snug">
                          Highlight me as <strong className="text-[#059669]">Looking for Teammates</strong>
                        </span>
                      </label>

                      {lookingForTeam && (
                        <input
                          type="text"
                          placeholder="Skills or role needed (e.g. Need UI/UX or ML dev)..."
                          value={teammateNote}
                          onChange={(e) => setTeammateNote(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)] text-xs text-[var(--cf-text)]"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={registering}
                      onClick={handleRegisterClick}
                      className="w-full py-3 px-4 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      {registering
                        ? 'Generating CampusFlow Pass...'
                        : fee > 0
                        ? `Pay ₹${fee} & ${
                            useTeamReg
                              ? teamMode === 'join'
                                ? 'Join Squad'
                                : 'Register Squad'
                              : 'Register for Pass'
                          }`
                        : seatsRemaining > 0
                        ? `${
                            useTeamReg
                              ? teamMode === 'join'
                                ? 'Join Squad & Get Pass'
                                : 'Register Squad for Event'
                              : 'Register for Event'
                          } (Free)`
                        : 'Join waitlist'}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="block text-center w-full py-2.5 px-4 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white font-semibold text-xs transition-colors"
                  >
                    {fee > 0 ? `Sign in to purchase pass (₹${fee})` : 'Sign in to register'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Event Modal (Stage A + Feature #5 Agenda & Rules) */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--cf-border)] pb-3">
              <h3 className="font-editorial text-2xl text-[var(--cf-text)]">Edit event details & schedule</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Tech Talk">Tech Talk</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={editForm.venue}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.event_date}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    min={event.registered_count || 1}
                    required
                    value={editForm.capacity}
                    onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={editForm.registration_fee}
                    onChange={(e) => setEditForm({ ...editForm, registration_fee: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Prize Pool</label>
                  <input
                    type="text"
                    value={editForm.prize_pool}
                    onChange={(e) => setEditForm({ ...editForm, prize_pool: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={editForm.banner_url}
                  onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Event Schedule & Itinerary (One slot per line, e.g. 10:00 AM — Opening Keynote)
                </label>
                <textarea
                  rows={4}
                  value={editForm.agenda_text}
                  onChange={(e) => setEditForm({ ...editForm, agenda_text: e.target.value })}
                  placeholder="• 10:00 AM — Registration & Welcome&#10;• 11:00 AM — Hands-on Session"
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Rules & Eligibility Guidelines (One rule per line)
                </label>
                <textarea
                  rows={3}
                  value={editForm.rules_text}
                  onChange={(e) => setEditForm({ ...editForm, rules_text: e.target.value })}
                  placeholder="• Open to all departments&#10;• Carry valid university ID card"
                  className="w-full px-3 py-2 rounded-md bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-md border border-[var(--cf-border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={managing}
                  className="px-4 py-2 rounded-md bg-[var(--cf-primary)] text-white font-semibold cursor-pointer"
                >
                  {managing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentCheckoutModal
          event={event}
          user={user}
          submitting={registering}
          onClose={() => setShowPaymentModal(false)}
          onConfirmPayment={(paymentData) => executeRegistration(paymentData)}
        />
      )}

      <DigitalPassModal
        pass={activePassModal}
        onClose={() => setActivePassModal(null)}
        onCancelPass={handleCancelRegistration}
        cancelling={cancelling}
      />

      <CertificateModal
        pass={certificatePass}
        onClose={() => setCertificatePass(null)}
      />
    </div>
  );
}
