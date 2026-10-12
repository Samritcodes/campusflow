import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Ticket,
  Bookmark,
  Pin,
  ArrowUpRight,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { formatEventDateLong, formatTime12h } from '../../utils/date';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const COLOR_STYLES = {
  vermilion: {
    label: 'Urgent / Coral',
    pill: 'bg-[var(--cf-primary)]/15 text-[var(--cf-primary)] border-[var(--cf-primary)]/35',
    dot: 'bg-[var(--cf-primary)]',
  },
  emerald: {
    label: 'Pass / Emerald',
    pill: 'bg-[var(--cf-success)]/15 text-[var(--cf-success)] border-[var(--cf-success)]/35',
    dot: 'bg-[var(--cf-success)]',
  },
  amber: {
    label: 'Deadline / Amber',
    pill: 'bg-amber-500/15 text-amber-600 border-amber-500/35',
    dot: 'bg-amber-500',
  },
  indigo: {
    label: 'Study / Indigo',
    pill: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/35',
    dot: 'bg-indigo-500',
  },
};

export default function CampusCalendarPage() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isOrganizer = location.pathname.startsWith('/organizer');
  const eventLinkPrefix = isAdmin
    ? '/admin/events'
    : isOrganizer
    ? '/organizer/events'
    : '/student/events';

  const [reminders, setReminders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default to October 2026 (current semester calendar)
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState('2026-10-15');

  // New Reminder Form State
  const [title, setTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [note, setNote] = useState('');
  const [colorTag, setColorTag] = useState('vermilion');
  const [linkedEventId, setLinkedEventId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadCalendar = useCallback(() => {
    setLoading(true);
    apiRequest('/calendar/index.php')
      .then((res) => {
        setReminders(res.data?.reminders || []);
        const evList = res.data?.events || [];
        setEvents(evList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const jumpToDate = (dateStr) => {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      setViewYear(Number(parts[0]));
      setViewMonth(Number(parts[1]) - 1);
      setSelectedDate(dateStr);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await apiRequest('/calendar/index.php', {
        method: 'POST',
        body: {
          action: 'create',
          title: title.trim(),
          reminder_date: selectedDate,
          reminder_time: reminderTime,
          note: note.trim(),
          color_tag: colorTag,
          event_id: linkedEventId ? Number(linkedEventId) : null,
        },
      });
      setTitle('');
      setNote('');
      setLinkedEventId('');
      setFeedback('Reminder marked on your calendar!');
      loadCalendar();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReminder = async (id) => {
    try {
      await apiRequest('/calendar/index.php', {
        method: 'POST',
        body: { action: 'toggle', id },
      });
      loadCalendar();
    } catch {
      // ignore
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await apiRequest('/calendar/index.php', {
        method: 'POST',
        body: { action: 'delete', id },
      });
      loadCalendar();
    } catch {
      // ignore
    }
  };

  // Build Calendar Grid Cells for viewYear & viewMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${viewYear}-${mStr}-${dStr}`;
      cells.push({
        day,
        dateStr,
        dayReminders: reminders.filter((r) => r.reminder_date === dateStr),
        dayEvents: events.filter((ev) => ev.event_date === dateStr),
      });
    }
    return cells;
  }, [viewYear, viewMonth, reminders, events]);

  const selectedDayReminders = useMemo(
    () => reminders.filter((r) => r.reminder_date === selectedDate),
    [reminders, selectedDate]
  );

  const selectedDayEvents = useMemo(
    () => events.filter((ev) => ev.event_date === selectedDate),
    [events, selectedDate]
  );

  const activeRemindersCount = reminders.filter((r) => !r.is_completed).length;

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--cf-border)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
            PERSONAL PLANNER & SCHEDULE
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)] mt-1">
            Campus calendar & reminders
          </h1>
          <p className="text-sm text-[var(--cf-text-secondary)] mt-1">
            Click any date to mark down personal reminders, deadlines, or view your registered campus events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-mono-code">
            <strong className="text-[var(--cf-primary)]">{activeRemindersCount}</strong> active reminders
          </span>
          <button
            type="button"
            onClick={() => jumpToDate('2026-10-15')}
            className="px-3.5 py-1.5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-xs font-semibold text-[var(--cf-text)] cursor-pointer"
          >
            Jump to Oct 2026 Events
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 8 COLS: Interactive Month Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden shadow-2xs">
            {/* Calendar Top Bar */}
            <div className="p-5 border-b border-[var(--cf-border)] flex items-center justify-between bg-[var(--cf-bg)]">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-[var(--cf-primary)]" />
                <h2 className="font-editorial text-3xl text-[var(--cf-text)]">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-[var(--cf-text)] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[var(--cf-primary)] text-[var(--cf-text)] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 border-b border-[var(--cf-border)] bg-[var(--cf-surface-muted)]/50 text-center">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2.5 text-[11px] font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-text-secondary)]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Day Cells */}
            {loading ? (
              <div className="p-16 text-center text-sm text-[var(--cf-text-secondary)]">
                Loading your calendar & reminders...
              </div>
            ) : (
              <div className="grid grid-cols-7 divide-x divide-y divide-[var(--cf-border)]">
                {calendarDays.map((cell, idx) => {
                  if (!cell) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[108px] bg-[var(--cf-bg)]/40 p-2"
                      />
                    );
                  }

                  const isSelected = cell.dateStr === selectedDate;
                  const hasItems = cell.dayReminders.length > 0 || cell.dayEvents.length > 0;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`min-h-[108px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[var(--cf-primary)]/8 ring-2 ring-inset ring-[var(--cf-primary)]'
                          : 'bg-[var(--cf-surface)] hover:bg-[var(--cf-bg)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-mono-code font-bold inline-flex items-center justify-center ${
                            isSelected
                              ? 'bg-[var(--cf-primary)] text-white'
                              : hasItems
                              ? 'text-[var(--cf-text)] font-extrabold'
                              : 'text-[var(--cf-text-secondary)]'
                          }`}
                        >
                          {cell.day}
                        </span>
                        {cell.dayReminders.length > 0 && (
                          <span className="text-[10px] font-mono-code font-bold text-[var(--cf-primary)]">
                            {cell.dayReminders.length}📌
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 space-y-1 overflow-hidden">
                        {/* Campus Events on this day */}
                        {cell.dayEvents.map((ev) => (
                          <div
                            key={`ev-${ev.id}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${
                              ev.is_registered
                                ? 'bg-[var(--cf-success)]/15 text-[var(--cf-success)] border-[var(--cf-success)]/30 font-semibold'
                                : ev.is_saved
                                ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                : 'bg-[var(--cf-bg)] text-[var(--cf-text)] border-[var(--cf-border)]'
                            }`}
                            title={ev.title}
                          >
                            {ev.is_registered ? '🎟️ ' : '• '}
                            {ev.title}
                          </div>
                        ))}

                        {/* Personal Reminders on this day */}
                        {cell.dayReminders.slice(0, 2).map((rem) => {
                          const style = COLOR_STYLES[rem.color_tag] || COLOR_STYLES.vermilion;
                          return (
                            <div
                              key={`rem-${rem.id}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${style.pill} ${
                                rem.is_completed ? 'line-through opacity-60' : ''
                              }`}
                              title={rem.title}
                            >
                              📌 {rem.title}
                            </div>
                          );
                        })}

                        {cell.dayReminders.length > 2 && (
                          <p className="text-[10px] font-mono-code text-[var(--cf-text-secondary)] pl-1">
                            +{cell.dayReminders.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend Footer */}
            <div className="px-5 py-3 bg-[var(--cf-bg)] border-t border-[var(--cf-border)] flex flex-wrap items-center gap-5 text-xs text-[var(--cf-text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cf-primary)]" />
                Personal Reminder (📌)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cf-success)]" />
                Registered Pass (🎟️)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Saved Event
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                Campus Event
              </span>
            </div>
          </div>

          {/* All Personal Reminders Overview */}
          <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[var(--cf-primary)]">
                  ALL MARKED REMINDERS ({reminders.length})
                </p>
                <h3 className="font-editorial text-2xl text-[var(--cf-text)]">
                  Your upcoming notes & deadlines
                </h3>
              </div>
            </div>

            {reminders.length === 0 ? (
              <p className="text-xs text-[var(--cf-text-secondary)] py-4">
                You haven’t marked down any reminders yet. Select any date on the calendar and add a note on the right!
              </p>
            ) : (
              <div className="divide-y divide-[var(--cf-border)]">
                {reminders.map((rem) => {
                  const style = COLOR_STYLES[rem.color_tag] || COLOR_STYLES.vermilion;
                  return (
                    <div
                      key={rem.id}
                      className="py-3 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleReminder(rem.id)}
                          className="mt-0.5 text-[var(--cf-text-secondary)] hover:text-[var(--cf-primary)] cursor-pointer"
                        >
                          {rem.is_completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--cf-success)]" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => jumpToDate(rem.reminder_date)}
                              className={`px-2 py-0.5 rounded border text-[10px] font-mono-code font-semibold cursor-pointer ${style.pill}`}
                            >
                              {formatEventDateLong(rem.reminder_date)} ·{' '}
                              {formatTime12h(rem.reminder_time)}
                            </button>
                            {rem.event_title && (
                              <Link
                                to={`${eventLinkPrefix}/${rem.event_slug}`}
                                className="text-[11px] font-semibold text-[var(--cf-primary)] hover:underline"
                              >
                                Linked: {rem.event_title} →
                              </Link>
                            )}
                          </div>
                          <p
                            className={`text-sm font-semibold mt-1 ${
                              rem.is_completed
                                ? 'line-through text-[var(--cf-text-secondary)]'
                                : 'text-[var(--cf-text)]'
                            }`}
                          >
                            {rem.title}
                          </p>
                          {rem.note && (
                            <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                              {rem.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(rem.id)}
                        title="Delete reminder"
                        className="p-1.5 rounded hover:bg-rose-500/10 text-[var(--cf-text-secondary)] hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 4 COLS: Day Inspector + "+ Mark Down Reminder" Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-5 shadow-2xs">
            <div className="border-b border-[var(--cf-border)] pb-4">
              <p className="text-[11px] font-mono-code font-semibold uppercase tracking-widest text-[var(--cf-primary)]">
                SELECTED DATE
              </p>
              <h2 className="font-editorial text-3xl text-[var(--cf-text)] mt-0.5">
                {formatEventDateLong(selectedDate)}
              </h2>
            </div>

            {feedback && (
              <div className="p-3 rounded-lg border border-[var(--cf-success)]/30 bg-[var(--cf-success)]/10 text-xs font-medium text-[var(--cf-success)]">
                {feedback}
              </div>
            )}

            {/* Events happening on Selected Date */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-mono-code font-semibold uppercase text-[var(--cf-text-secondary)]">
                CAMPUS EVENTS ON THIS DAY ({selectedDayEvents.length})
              </p>
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-[var(--cf-text-secondary)]">
                  No scheduled campus events on this date.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-code text-[10px] font-bold text-[var(--cf-primary)]">
                          {ev.department_code} · {formatTime12h(ev.start_time)}
                        </span>
                        {ev.is_registered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--cf-success)]/15 text-[var(--cf-success)] font-mono-code text-[10px] font-bold">
                            <Ticket className="w-3 h-3" /> {ev.my_reg_status}
                          </span>
                        ) : ev.is_saved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 font-mono-code text-[10px] font-bold">
                            <Bookmark className="w-3 h-3 fill-current" /> Saved
                          </span>
                        ) : null}
                      </div>
                      <Link
                        to={`${eventLinkPrefix}/${ev.slug}`}
                        className="font-bold text-sm text-[var(--cf-text)] hover:text-[var(--cf-primary)] flex items-center justify-between"
                      >
                        <span>{ev.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                      <p className="text-[11px] text-[var(--cf-text-secondary)]">{ev.venue}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Reminders on Selected Date */}
            <div className="pt-4 border-t border-[var(--cf-border)] space-y-2.5">
              <p className="text-[11px] font-mono-code font-semibold uppercase text-[var(--cf-text-secondary)]">
                YOUR REMINDERS ON THIS DAY ({selectedDayReminders.length})
              </p>
              {selectedDayReminders.length === 0 ? (
                <p className="text-xs text-[var(--cf-text-secondary)]">
                  No personal reminders marked for this day yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayReminders.map((rem) => {
                    const style = COLOR_STYLES[rem.color_tag] || COLOR_STYLES.vermilion;
                    return (
                      <div
                        key={rem.id}
                        className={`p-3 rounded-lg border flex items-start justify-between gap-2 text-xs ${style.pill}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(rem.id)}
                            className="mt-0.5 cursor-pointer"
                          >
                            {rem.is_completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <p
                              className={`font-bold ${
                                rem.is_completed ? 'line-through opacity-65' : ''
                              }`}
                            >
                              {rem.title}
                            </p>
                            <p className="font-mono-code text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {formatTime12h(rem.reminder_time)}
                            </p>
                            {rem.note && <p className="mt-1 opacity-90">{rem.note}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-1 opacity-75 hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form: Mark Down New Reminder on Selected Date */}
            <form
              onSubmit={handleAddReminder}
              className="pt-4 border-t border-[var(--cf-border)] space-y-3 text-xs"
            >
              <div className="flex items-center gap-1.5 font-mono-code font-bold uppercase text-[var(--cf-primary)]">
                <Pin className="w-3.5 h-3.5" />
                <span>Mark Down Reminder</span>
              </div>

              <div>
                <label className="block font-semibold text-[var(--cf-text)] mb-1">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Submit TechNova Prototype / Bring ID"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)] focus:outline-none focus:border-[var(--cf-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[var(--cf-text)] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => jumpToDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-[11px] text-[var(--cf-text)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--cf-text)] mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-border)] font-mono-code text-[11px] text-[var(--cf-text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--cf-text)] mb-1">
                  Color Tag
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(COLOR_STYLES).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColorTag(key)}
                      className={`py-1.5 px-2.5 rounded-md border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                        colorTag === key
                          ? cfg.pill
                          : 'border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text-secondary)]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--cf-text)] mb-1">
                  Link to Campus Event (Optional)
                </label>
                <select
                  value={linkedEventId}
                  onChange={(e) => setLinkedEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)]"
                >
                  <option value="">— Personal / General Note —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.event_date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--cf-text)] mb-1">
                  Short Note / Checklist (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add location, team meeting details, or checklist..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-border)] text-[var(--cf-text)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Saving Reminder...' : 'Mark on Calendar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
