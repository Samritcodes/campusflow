import { useState } from 'react';
import {
  FolderKanban,
  ExternalLink,
  Plus,
  Trash2,
  Users,
  Sparkles,
  MessageSquare,
  Pin,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { apiRequest } from '../../services/api';

const RESOURCE_LABELS = {
  PROBLEM_STATEMENT: 'Problem Statement',
  SLIDES: 'Slides & Deck',
  GITHUB_REPO: 'GitHub Repository',
  PHOTO_GALLERY: 'Photo Gallery',
  DOCUMENT: 'Reference Doc',
};

const TOPIC_BADGES = {
  QUESTION: {
    label: 'Question / FAQ',
    cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  },
  TEAMMATE_FINDER: {
    label: 'Looking for Teammates',
    cls: 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]',
  },
  GENERAL: {
    label: 'Discussion',
    cls: 'border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]',
  },
};

export default function EventCommunityAndResources({
  event,
  user,
  canManage,
  onRefresh,
  onSelectSquadCode,
}) {
  const resources = event.resources || [];
  const attendees = event.community_attendees || [];
  const discussions = event.discussions || [];
  const myReg = event.my_registration;
  const isActiveReg = myReg && myReg.status !== 'CANCELLED';

  // Resource Hub Form State (Staff)
  const [showResForm, setShowResForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('PROBLEM_STATEMENT');
  const [resUrl, setResUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Networking Consent & Teammate Finder State (Registered Student)
  const [showNetEdit, setShowNetEdit] = useState(false);
  const [shareProfile, setShareProfile] = useState(
    myReg ? Boolean(myReg.share_profile) : true
  );
  const [lookingForTeam, setLookingForTeam] = useState(
    myReg ? Boolean(myReg.looking_for_team) : false
  );
  const [teammateNote, setTeammateNote] = useState(myReg?.teammate_note || '');

  // Discussion / Q&A State
  const [topicTag, setTopicTag] = useState('QUESTION');
  const [discMessage, setDiscMessage] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyPinned, setReplyPinned] = useState(true);
  const [filterTeammatesOnly, setFilterTeammatesOnly] = useState(false);

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest('/events/community.php', {
        method: 'POST',
        body: {
          action: 'add_resource',
          event_id: event.id,
          title: resTitle.trim(),
          resource_type: resType,
          url: resUrl.trim(),
        },
      });
      setResTitle('');
      setResUrl('');
      setShowResForm(false);
      setStatusMsg({ type: 'success', text: res.message });
      onRefresh();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    setBusy(true);
    try {
      await apiRequest('/events/community.php', {
        method: 'POST',
        body: { action: 'delete_resource', resource_id: resourceId },
      });
      onRefresh();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNetworking = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest('/events/community.php', {
        method: 'POST',
        body: {
          action: 'update_networking',
          event_id: event.id,
          share_profile: shareProfile,
          looking_for_team: lookingForTeam,
          teammate_note: teammateNote.trim(),
        },
      });
      setShowNetEdit(false);
      setStatusMsg({ type: 'success', text: res.message });
      onRefresh();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handlePostDiscussion = async (e) => {
    e.preventDefault();
    if (!discMessage.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest('/events/community.php', {
        method: 'POST',
        body: {
          action: 'post_discussion',
          event_id: event.id,
          topic_tag: topicTag,
          message: discMessage.trim(),
        },
      });
      setDiscMessage('');
      setStatusMsg({ type: 'success', text: res.message });
      onRefresh();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handlePostOfficialReply = async (e, discussionId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await apiRequest('/events/community.php', {
        method: 'POST',
        body: {
          action: 'reply_discussion',
          discussion_id: discussionId,
          official_reply: replyText.trim(),
          is_pinned: replyPinned,
        },
      });
      setReplyingToId(null);
      setReplyText('');
      setStatusMsg({ type: 'success', text: res.message });
      onRefresh();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDiscussion = async (discussionId) => {
    setBusy(true);
    try {
      await apiRequest('/events/community.php', {
        method: 'POST',
        body: { action: 'delete_discussion', discussion_id: discussionId },
      });
      onRefresh();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const visibleAttendees = filterTeammatesOnly
    ? attendees.filter((a) => a.looking_for_team)
    : attendees;

  const lookingCount = attendees.filter((a) => a.looking_for_team).length;

  return (
    <div className="space-y-8 pt-6 border-t border-[var(--cf-border)]">
      {statusMsg && (
        <div
          className={`p-3.5 rounded-md border text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'border-[#059669]/30 bg-[#059669]/10 text-[#059669]'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* 1. Event Resource Hub & Materials */}
      {(resources.length > 0 || canManage) && (
        <section className="p-5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono-code font-bold uppercase tracking-wider text-[var(--cf-primary)] flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4" />
                EVENT RESOURCE HUB & MATERIALS ({resources.length})
              </p>
              <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
                Official problem statements, workshop decks, starter repositories, and event media.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowResForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--cf-primary)] text-white text-xs font-semibold hover:bg-[var(--cf-primary-hover)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showResForm ? 'Cancel' : 'Attach Resource'}
              </button>
            )}
          </div>

          {canManage && showResForm && (
            <form
              onSubmit={handleAddResource}
              className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    required
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="e.g. Official Hackathon Problem Statements PDF"
                    className="w-full px-3 py-2 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-1">
                    Material Type
                  </label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text)]"
                  >
                    <option value="PROBLEM_STATEMENT">Problem Statement</option>
                    <option value="SLIDES">Slides & Deck</option>
                    <option value="GITHUB_REPO">GitHub Repository</option>
                    <option value="PHOTO_GALLERY">Photo Gallery</option>
                    <option value="DOCUMENT">Reference Document</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  required
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs font-mono-code text-[var(--cf-text)]"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded bg-[var(--cf-primary)] text-white text-xs font-semibold cursor-pointer"
                >
                  Publish Link
                </button>
              </div>
            </form>
          )}

          {resources.length === 0 ? (
            <p className="text-xs text-[var(--cf-text-secondary)]">
              No resources attached yet. Organizers can publish slides, repos, or problem statements here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[var(--cf-primary)]/10 text-[var(--cf-primary)] mb-1">
                      {RESOURCE_LABELS[r.resource_type] || r.resource_type}
                    </span>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs font-bold text-[var(--cf-text)] hover:text-[var(--cf-primary)] truncate"
                    >
                      {r.title}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-primary)]"
                      title="Open Resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(r.id)}
                        className="p-1.5 rounded border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-rose-600 cursor-pointer"
                        title="Remove Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. Campus Community: Consent-Based Attendee Directory & Teammate Finder */}
      <section className="p-5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono-code font-bold uppercase tracking-wider text-[var(--cf-primary)] flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              CAMPUS COMMUNITY · ATTENDEE NETWORK & TEAMMATE FINDER ({attendees.length})
            </p>
            <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
              Connect with fellow students who opted in to share their profile or are looking for hackathon/event teammates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lookingCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTeammatesOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                  filterTeammatesOnly
                    ? 'border-[#059669] bg-[#059669] text-white'
                    : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text)]'
                }`}
              >
                Looking for Teammates ({lookingCount})
              </button>
            )}

            {isActiveReg && (
              <button
                type="button"
                onClick={() => setShowNetEdit((v) => !v)}
                className="px-3 py-1.5 rounded-md border border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/10 text-[var(--cf-primary)] text-xs font-semibold cursor-pointer"
              >
                {showNetEdit ? 'Close Preferences' : 'My Visibility & Teammate Status'}
              </button>
            )}
          </div>
        </div>

        {/* Registered Student's Consent & Teammate Finder Editor */}
        {isActiveReg && showNetEdit && (
          <form
            onSubmit={handleSaveNetworking}
            className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-3"
          >
            <p className="text-xs font-mono-code font-bold uppercase text-[var(--cf-text)]">
              YOUR COMMUNITY PRIVACY & TEAMMATE STATUS
            </p>
            <label className="flex items-center gap-2 text-xs text-[var(--cf-text)] cursor-pointer">
              <input
                type="checkbox"
                checked={shareProfile}
                onChange={(e) => setShareProfile(e.target.checked)}
                className="accent-[var(--cf-primary)]"
              />
              Consent to show my name, department, and interests in this event&apos;s Attendee Directory
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--cf-text)] cursor-pointer">
              <input
                type="checkbox"
                checked={lookingForTeam}
                onChange={(e) => setLookingForTeam(e.target.checked)}
                className="accent-[#059669]"
              />
              Highlight my profile with a &ldquo;Looking for Teammates&rdquo; badge
            </label>
            {lookingForTeam && (
              <div>
                <label className="block text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-1">
                  Teammate Pitch / Skills Note
                </label>
                <input
                  type="text"
                  value={teammateNote}
                  onChange={(e) => setTeammateNote(e.target.value)}
                  placeholder="e.g. Looking for a React dev or ML engineer to join our squad!"
                  className="w-full px-3 py-2 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text)]"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-1.5 rounded bg-[var(--cf-primary)] text-white text-xs font-semibold cursor-pointer"
            >
              Save Community Preferences
            </button>
          </form>
        )}

        {visibleAttendees.length === 0 ? (
          <p className="text-xs text-[var(--cf-text-secondary)]">
            No attendees in this view yet. Register and opt in to connect with fellow participants!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleAttendees.map((att) => (
              <div
                key={att.student_id}
                className="p-3.5 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[var(--cf-text)]">
                      {att.student_name}
                    </p>
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text-secondary)]">
                      {att.student_department_code || 'CAMPUS'} · {att.year_of_study}
                    </span>
                  </div>

                  {att.interests && (
                    <p className="text-[11px] text-[var(--cf-text-secondary)] mt-1">
                      Interests:{' '}
                      <span className="text-[var(--cf-text)] font-medium">{att.interests}</span>
                    </p>
                  )}

                  {att.team_name && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[var(--cf-bg)] border border-[var(--cf-border)]">
                      <span className="text-[11px] font-semibold text-[var(--cf-text)]">
                        Squad: {att.team_name}
                      </span>
                      {att.team_code && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono-code font-bold text-[var(--cf-primary)]">
                            {att.team_code}
                          </span>
                          {!isActiveReg &&
                            user?.role === 'STUDENT' &&
                            onSelectSquadCode && (
                              <button
                                type="button"
                                onClick={() => onSelectSquadCode(att.team_code)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--cf-primary)] text-white text-[10px] font-semibold cursor-pointer"
                                title="Fill this Squad Code in the registration box"
                              >
                                <UserPlus className="w-2.5 h-2.5" /> Join
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {att.looking_for_team && (
                    <div className="mt-2 p-2 rounded border border-[#059669]/30 bg-[#059669]/10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono-code font-bold uppercase text-[#059669]">
                        <Sparkles className="w-3 h-3" /> LOOKING FOR TEAMMATES
                      </span>
                      {att.teammate_note && (
                        <p className="text-xs text-[var(--cf-text)] mt-0.5">
                          &ldquo;{att.teammate_note}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Event Discussion Space & Q&A Board */}
      <section className="p-5 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-5">
        <div>
          <p className="text-xs font-mono-code font-bold uppercase tracking-wider text-[var(--cf-primary)] flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            EVENT DISCUSSION SPACE & Q&A BOARD ({discussions.length})
          </p>
          <p className="text-xs text-[var(--cf-text-secondary)] mt-0.5">
            Ask organizers questions, pitch your hackathon idea, or find squad members.
          </p>
        </div>

        {/* Post New Question / Teammate Pitch Form */}
        {user ? (
          <form
            onSubmit={handlePostDiscussion}
            className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--cf-text)]">
                Start a thread as {user.full_name}
              </span>
              <div className="flex items-center gap-1.5">
                {['QUESTION', 'TEAMMATE_FINDER', 'GENERAL'].map((tKey) => (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setTopicTag(tKey)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono-code font-semibold border transition-colors cursor-pointer ${
                      topicTag === tKey
                        ? 'border-[var(--cf-primary)] bg-[var(--cf-primary)] text-white'
                        : 'border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text-secondary)]'
                    }`}
                  >
                    {TOPIC_BADGES[tKey].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={discMessage}
                onChange={(e) => setDiscMessage(e.target.value)}
                placeholder={
                  topicTag === 'TEAMMATE_FINDER'
                    ? 'Share your squad code or what skills you are looking for...'
                    : 'Ask a question about eligibility, equipment, schedule, or rules...'
                }
                className="flex-1 px-3.5 py-2 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text)] focus:outline-none focus:border-[var(--cf-primary)]"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                Post to Board
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-[var(--cf-text-secondary)]">
            Sign in to ask questions or post in the Event Discussion Space.
          </p>
        )}

        {/* Discussion Threads */}
        {discussions.length === 0 ? (
          <p className="text-xs text-[var(--cf-text-secondary)]">
            No questions or discussions yet. Be the first to start the conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {discussions.map((d) => {
              const badge = TOPIC_BADGES[d.topic_tag] || TOPIC_BADGES.GENERAL;
              const canDelete =
                canManage || (user && Number(user.id) === Number(d.user_id));

              return (
                <div
                  key={d.id}
                  className={`p-4 rounded-md border bg-[var(--cf-surface)] space-y-3 ${
                    d.is_pinned
                      ? 'border-[var(--cf-primary)]/40'
                      : 'border-[var(--cf-border)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {d.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[var(--cf-primary)] text-white">
                          <Pin className="w-2.5 h-2.5" /> PINNED FAQ
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-mono-code font-bold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-bold text-[var(--cf-text)]">
                        {d.author_name}
                      </span>
                      <span className="text-[11px] font-mono-code text-[var(--cf-text-secondary)]">
                        ({d.author_department_code || d.author_role})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(replyingToId === d.id ? null : d.id);
                            setReplyText(d.official_reply || '');
                            setReplyPinned(Boolean(d.is_pinned));
                          }}
                          className="text-[11px] font-mono-code font-semibold text-[var(--cf-primary)] hover:underline cursor-pointer"
                        >
                          {d.official_reply ? 'Edit Official Reply' : 'Reply as Organizer'}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDiscussion(d.id)}
                          className="text-[var(--cf-text-secondary)] hover:text-rose-600 cursor-pointer"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--cf-text)] leading-relaxed">
                    {d.message}
                  </p>

                  {/* Official Organizer Reply Box */}
                  {d.official_reply && (
                    <div className="p-3 rounded border border-[#059669]/30 bg-[#059669]/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono-code font-bold uppercase text-[#059669]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        OFFICIAL ORGANIZER RESPONSE · {d.replied_by_name || 'Event Staff'}
                      </div>
                      <p className="text-xs text-[var(--cf-text)] leading-relaxed">
                        {d.official_reply}
                      </p>
                    </div>
                  )}

                  {/* Inline Staff Reply Editor */}
                  {canManage && replyingToId === d.id && (
                    <form
                      onSubmit={(e) => handlePostOfficialReply(e, d.id)}
                      className="pt-2 border-t border-[var(--cf-border)] space-y-2"
                    >
                      <textarea
                        rows={2}
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write an official organizer answer..."
                        className="w-full px-3 py-2 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text)]"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-[var(--cf-text-secondary)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={replyPinned}
                            onChange={(e) => setReplyPinned(e.target.checked)}
                            className="accent-[var(--cf-primary)]"
                          />
                          Pin to top of Event Q&A Board
                        </label>
                        <button
                          type="submit"
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#059669] text-white text-xs font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Publish Official Reply
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
