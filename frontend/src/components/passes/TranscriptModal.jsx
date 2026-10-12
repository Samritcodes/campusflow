import { X, Printer, Award, CheckCircle2, ShieldCheck, Trophy } from 'lucide-react';
import { formatEventDateLong } from '../../utils/date';

export default function TranscriptModal({ user, passes = [], onClose }) {
  if (!user) return null;

  const activePasses = passes.filter((p) => p.status !== 'CANCELLED');
  const attendedPasses = activePasses.filter(
    (p) => p.status === 'ATTENDED' || Boolean(p.award_title)
  );
  const awardsWon = activePasses.filter((p) => Boolean(p.award_title));

  const computePoints = (p) => {
    let pts = 0;
    if (p.status === 'ATTENDED' || p.award_title) {
      pts += 10;
      if (p.category === 'Hackathon') pts += 15;
    } else if (p.status === 'CONFIRMED') {
      pts += 5;
    }
    if (p.award_title) {
      pts += 25;
    }
    return pts;
  };

  const totalPoints = activePasses.reduce((sum, p) => sum + computePoints(p), 0);
  const transcriptId = `CCA-26-${(user.roll_number || `U${user.id}`).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text)] shadow-2xl overflow-hidden my-8">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[var(--cf-primary)]" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-[var(--cf-primary)]">
              CO-CURRICULAR ACHIEVEMENT TRANSCRIPT (CCA PASSPORT)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] text-white text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save Official PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md border border-[var(--cf-border)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Transcript Body */}
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[var(--cf-text)]">
            <div>
              <p className="text-xs font-mono-code font-bold uppercase tracking-widest text-[var(--cf-primary)]">
                CAMPUSFLOW UNIVERSITY · OFFICE OF STUDENT ACTIVITIES
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[var(--cf-text)] mt-1">
                Co-Curricular Achievement Transcript
              </h2>
              <p className="text-xs text-[var(--cf-text-secondary)] mt-1">
                Verified record of technical, cultural, and competitive campus participation
              </p>
            </div>
            <div className="sm:text-right font-mono-code text-xs space-y-1">
              <p className="font-bold text-[var(--cf-primary)]">{transcriptId}</p>
              <p className="text-[var(--cf-text-secondary)]">
                Issued: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#059669]/10 text-[#059669] border border-[#059669]/30 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" /> VERIFIED RECORD
              </span>
            </div>
          </div>

          {/* Student Identity & Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-2 text-xs">
              <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                STUDENT CREDENTIALS
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[var(--cf-text-secondary)] block">Full Name</span>
                  <strong className="text-sm text-[var(--cf-text)]">{user.full_name}</strong>
                </div>
                <div>
                  <span className="text-[var(--cf-text-secondary)] block">Roll Number</span>
                  <strong className="font-mono-code text-sm text-[var(--cf-text)]">
                    {user.roll_number || 'VERIFIED-STUDENT'}
                  </strong>
                </div>
                <div>
                  <span className="text-[var(--cf-text-secondary)] block">Department</span>
                  <strong className="text-[var(--cf-text)]">
                    {user.department_name || user.department_code || 'Campus'}
                  </strong>
                </div>
                <div>
                  <span className="text-[var(--cf-text-secondary)] block">Academic Year</span>
                  <strong className="text-[var(--cf-text)]">{user.year_of_study || 'Student'}</strong>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] flex flex-col justify-between">
                <span className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  ATTENDED
                </span>
                <p className="font-editorial text-3xl text-[#059669] mt-1">
                  {attendedPasses.length}
                </p>
                <span className="text-[10px] text-[var(--cf-text-secondary)]">
                  {activePasses.length} total registered
                </span>
              </div>

              <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] flex flex-col justify-between">
                <span className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  AWARDS WON
                </span>
                <p className="font-editorial text-3xl text-amber-600 mt-1">
                  {awardsWon.length}
                </p>
                <span className="text-[10px] text-[var(--cf-text-secondary)]">
                  Merit & Podiums
                </span>
              </div>

              <div className="p-4 rounded-lg border border-[var(--cf-primary)]/40 bg-[var(--cf-primary)]/5 flex flex-col justify-between">
                <span className="text-[10px] font-mono-code uppercase text-[var(--cf-primary)] font-bold">
                  CCA CREDITS
                </span>
                <p className="font-editorial text-3xl text-[var(--cf-primary)] mt-1">
                  {totalPoints}
                </p>
                <span className="text-[10px] text-[var(--cf-text-secondary)]">
                  Activity Points
                </span>
              </div>
            </div>
          </div>

          {/* Complete Activity Ledger */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-[var(--cf-text-secondary)]">
              VERIFIED EVENT & COMPETITION LEDGER
            </h3>

            {activePasses.length === 0 ? (
              <p className="p-6 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] text-xs text-[var(--cf-text-secondary)]">
                No verified event registrations on record yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--cf-border)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--cf-border)] bg-[var(--cf-bg)] text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                      <th className="py-2.5 px-3">Pass ID</th>
                      <th className="py-2.5 px-3">Event & Department</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Squad / Role</th>
                      <th className="py-2.5 px-3">Verification / Award</th>
                      <th className="py-2.5 px-3 text-right">CCA Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cf-border)]">
                    {activePasses.map((p) => {
                      const pts = computePoints(p);
                      return (
                        <tr key={p.pass_id} className="bg-[var(--cf-surface)]">
                          <td className="py-2.5 px-3 font-mono-code font-semibold text-[var(--cf-primary)]">
                            {p.pass_id}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-[var(--cf-text)]">{p.event_title}</p>
                            <p className="text-[11px] text-[var(--cf-text-secondary)]">
                              {p.department_name || p.department_code}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 font-mono-code text-[11px]">
                            {p.category}
                          </td>
                          <td className="py-2.5 px-3 font-mono-code text-[11px] text-[var(--cf-text-secondary)]">
                            {formatEventDateLong(p.event_date)}
                          </td>
                          <td className="py-2.5 px-3">
                            {p.team_name ? (
                              <span className="font-mono-code text-[11px] font-semibold">
                                Squad: {p.team_name}
                              </span>
                            ) : (
                              <span className="text-[var(--cf-text-secondary)]">Individual</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {p.award_title ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30 font-mono-code text-[10px] font-bold">
                                  <Trophy className="w-3 h-3" /> {p.award_title}
                                </span>
                              ) : p.status === 'ATTENDED' ? (
                                <span className="inline-flex items-center gap-1 text-[#059669] font-mono-code text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                                </span>
                              ) : (
                                <span className="font-mono-code text-[11px] text-[var(--cf-text-secondary)]">
                                  {p.status}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-code font-bold text-[var(--cf-text)]">
                            +{pts}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Footer */}
          <div className="pt-6 border-t border-[var(--cf-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-[var(--cf-text-secondary)]">
            <p>
              Automatically generated and cryptographically indexed by <strong className="text-[var(--cf-text)]">CampusFlow Digital Pass Ledger</strong>.
            </p>
            <p className="font-mono-code">
              Document Ref: {transcriptId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
