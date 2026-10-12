import { X, Printer, Award, ShieldCheck, Trophy } from 'lucide-react';
import { formatEventDateLong } from '../../utils/date';

export default function CertificateModal({ pass, onClose }) {
  if (!pass) return null;

  const isMerit = Boolean(pass.award_title);
  const certId = `${isMerit ? 'MERIT' : 'CERT'}-${pass.pass_id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text)] shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-6 py-3.5 border-b border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMerit ? (
              <Trophy className="w-4 h-4 text-amber-500" />
            ) : (
              <Award className="w-4 h-4 text-[#059669]" />
            )}
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[var(--cf-text)]">
              {isMerit ? 'OFFICIAL MERIT & EXCELLENCE CREDENTIAL' : 'OFFICIAL PARTICIPATION CREDENTIAL'} · {certId}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--cf-surface-muted)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Certificate Canvas */}
        <div className="p-6 sm:p-8">
          <div
            className={`rounded-md border-2 p-8 text-center space-y-6 relative ${
              isMerit
                ? 'border-amber-500/50 bg-[var(--cf-bg)]'
                : 'border-[var(--cf-border)] bg-[var(--cf-bg)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--cf-primary)]/30 bg-[var(--cf-primary)]/10 text-[var(--cf-primary)] text-[10px] font-mono-code uppercase tracking-widest font-bold">
                CAMPUSFLOW · UNIVERSITY EVENT RECORD
              </div>
              {isMerit && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-600 text-[10px] font-mono-code uppercase tracking-widest font-bold">
                  <Trophy className="w-3 h-3" /> {pass.award_title}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-editorial text-4xl sm:text-5xl text-[var(--cf-text)]">
                {isMerit ? 'Certificate of Merit & Excellence' : 'Certificate of Participation'}
              </h2>
              <p className="text-xs font-mono-code uppercase tracking-widest text-[var(--cf-text-secondary)] mt-2">
                THIS IS PROUDLY PRESENTED TO
              </p>
            </div>

            <div className="py-3 border-y border-dashed border-[var(--cf-border)] max-w-md mx-auto">
              <p className="font-editorial text-3xl sm:text-4xl text-[var(--cf-primary)]">
                {pass.student_name}
              </p>
              <p className="text-xs font-mono-code text-[var(--cf-text-secondary)] mt-1">
                {pass.student_department_code || pass.department_code} Department
                {pass.year_of_study ? ` · ${pass.year_of_study}` : ''}
                {pass.roll_number ? ` · Roll No: ${pass.roll_number}` : ''}
              </p>
              {pass.team_name && (
                <p className="text-xs font-mono-code font-semibold text-[#059669] mt-1">
                  Squad: {pass.team_name} {pass.team_code ? `(${pass.team_code})` : ''}
                </p>
              )}
            </div>

            <p className="text-sm text-[var(--cf-text)] max-w-lg mx-auto leading-relaxed">
              {isMerit ? (
                <>
                  in recognition of achieving{' '}
                  <strong className="font-semibold text-amber-600">{pass.award_title}</strong> in the{' '}
                </>
              ) : (
                <>for active participation and verified attendance in the </>
              )}
              <strong className="font-semibold">{pass.category || 'Campus Event'}</strong>{' '}
              titled <strong className="font-semibold">“{pass.event_title}”</strong>, hosted by the{' '}
              <strong className="font-semibold">
                {pass.department_name || `${pass.department_code} Department`}
              </strong>{' '}
              at {pass.venue} on {formatEventDateLong(pass.event_date)}.
            </p>

            {/* Signatures & Verification Footer */}
            <div className="pt-6 border-t border-[var(--cf-border)] grid grid-cols-3 gap-4 items-end text-left text-xs">
              <div>
                <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  CREDENTIAL ID
                </p>
                <p className="font-mono-code font-bold text-[var(--cf-text)] mt-0.5">
                  {certId}
                </p>
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#059669]/10 text-[#059669] border border-[#059669]/30 font-mono-code text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> {isMerit ? 'HONORS VERIFIED' : 'ATTENDED & VERIFIED'}
                </span>
              </div>
              <div className="text-right">
                <p className="font-editorial text-lg text-[var(--cf-text)]">
                  {pass.department_code} Council
                </p>
                <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  ISSUING AUTHORITY
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-md border border-[var(--cf-border)] text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save Certificate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
