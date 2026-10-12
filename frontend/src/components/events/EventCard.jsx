import { Link } from 'react-router-dom';
import { ArrowUpRight, Calendar, MapPin, Bookmark } from 'lucide-react';
import { formatEventDateShort, formatTime12h } from '../../utils/date';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80';

export default function EventCard({ event, linkPrefix = '/events', onToggleSave }) {
  const eventUrl = `${linkPrefix}/${event.slug}`;
  const regStatus = event.my_registration?.status;
  const isRegistered = regStatus === 'CONFIRMED' || regStatus === 'ATTENDED';
  const fee = Number(event.registration_fee || 0);
  const seatsLeft = Math.max(0, (event.capacity || 0) - (event.registered_count || 0));

  return (
    <article className="group rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-[var(--cf-primary)]/60 hover:-translate-y-0.5 shadow-2xs">
      {/* Standardized 16:10 Event Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--cf-surface-muted)] border-b border-[var(--cf-border)]">
        <Link to={eventUrl} className="block w-full h-full">
          <img
            src={event.banner_url || FALLBACK_IMAGE}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </Link>

        {/* Top Left: Category + Department Pill */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2 pointer-events-none">
          <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-[var(--cf-surface)]/95 text-[var(--cf-text)] shadow-xs">
            {event.category}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono-code font-semibold bg-black/65 text-white backdrop-blur-xs">
            {event.department_code}
          </span>
        </div>

        {/* Top Right: Bookmark button or Registration Status */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
          {isRegistered ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono-code font-semibold bg-[var(--cf-success)] text-white shadow-xs">
              {regStatus === 'ATTENDED' ? 'Attended ✓' : 'Registered ✓'}
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono-code font-bold shadow-xs ${
                fee > 0
                  ? 'bg-[var(--cf-surface)]/95 text-[var(--cf-text)]'
                  : 'bg-[var(--cf-success)] text-white'
              }`}
            >
              {fee > 0 ? `₹${fee}` : 'Free'}
            </span>
          )}

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(event.id);
              }}
              title={event.is_saved ? 'Remove from saved' : 'Save event'}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                event.is_saved
                  ? 'bg-[var(--cf-primary)] border-[var(--cf-primary)] text-white'
                  : 'bg-[var(--cf-surface)]/90 border-[var(--cf-border)] text-[var(--cf-text)] hover:border-[var(--cf-primary)]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${event.is_saved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Editorial Body — Clean, Readable Hierarchy */}
      <div className="p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-3">
          {/* Easy-to-scan Date & Time */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--cf-primary)]">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {formatEventDateShort(event.event_date)} · {formatTime12h(event.start_time)}
            </span>
          </div>

          {/* Prominent Event Title */}
          <Link to={eventUrl} className="block">
            <h3 className="font-editorial text-2xl sm:text-[26px] leading-[1.18] text-[var(--cf-text)] group-hover:text-[var(--cf-primary)] transition-colors line-clamp-2">
              {event.title}
            </h3>
          </Link>

          {/* Readable 2-line Summary */}
          <p className="text-sm text-[var(--cf-text-secondary)] line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Clean Bottom Meta: Venue + Action */}
        <div className="pt-4 border-t border-[var(--cf-border)] space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--cf-text-secondary)]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--cf-text)] truncate">
              <MapPin className="w-3.5 h-3.5 text-[var(--cf-text-secondary)] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </span>
            <span className="font-mono-code shrink-0">
              {seatsLeft > 0 ? `${seatsLeft} seats left` : 'Waitlist'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {event.prize_pool ? (
              <span className="text-xs font-semibold text-[var(--cf-success)] truncate max-w-[65%]">
                🏆 {event.prize_pool}
              </span>
            ) : (
              <span className="text-xs text-[var(--cf-text-secondary)]">
                {event.registered_count} registered
              </span>
            )}

            <Link
              to={eventUrl}
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--cf-text)] group-hover:text-[var(--cf-primary)] transition-colors"
            >
              <span>{isRegistered ? 'View pass' : 'Event details'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

