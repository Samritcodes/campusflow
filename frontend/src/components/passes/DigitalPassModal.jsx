import { useState } from 'react';
import { X, Printer, Trophy, ShieldCheck, Award } from 'lucide-react';
import { formatEventDateLong, formatTime12h } from '../../utils/date';
import CertificateModal from './CertificateModal';

export default function DigitalPassModal({ pass, onClose, onCancelPass, cancelling }) {
  const [showCertificate, setShowCertificate] = useState(false);

  if (!pass) return null;

  const statusStyles = {
    CONFIRMED: 'bg-[#059669]/10 text-[#059669] border-[#059669]/30',
    ATTENDED: 'bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/30',
    WAITLISTED: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    CANCELLED: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  };

  const badgeStyle = statusStyles[pass.status] || statusStyles.CONFIRMED;
  const amountPaid = Number(pass.amount_paid ?? pass.registration_fee ?? 0);
  const isPaidPass = amountPaid > 0 || pass.payment_status === 'PAID' || pass.payment_status === 'REFUNDED';
  const hasCertificate = pass.status === 'ATTENDED' || pass.status === 'COMPLETED';

  if (showCertificate) {
    return <CertificateModal pass={pass} onClose={() => setShowCertificate(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text)] shadow-2xl overflow-hidden">
        {/* Top Ticket Header */}
        <div className="px-6 py-4 border-b border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[#4F46E5]">
              CAMPUSFLOW · EVENT PASS
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--cf-surface-muted)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                {pass.category || 'CAMPUS EVENT'} · {pass.department_code} DEPT
              </span>
              <span className="text-[11px] font-mono-code font-bold px-2 py-0.5 rounded border border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text)]">
                {isPaidPass ? `PAID · ₹${amountPaid}` : 'FREE ENTRY'}
              </span>
            </div>
            <h2 className="font-editorial text-3xl leading-tight text-[var(--cf-text)] mt-1">
              {pass.event_title}
            </h2>
            {pass.prize_pool && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669] mt-1.5">
                <Trophy className="w-3.5 h-3.5" /> Prize Pool: {pass.prize_pool}
              </p>
            )}
          </div>

          {/* Perforated Divider */}
          <div className="border-t border-dashed border-[var(--cf-border)] pt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                PARTICIPANT
              </p>
              <p className="font-bold text-sm text-[var(--cf-text)] mt-0.5">
                {pass.student_name}
              </p>
              <p className="text-[var(--cf-text-secondary)] mt-0.5">
                {pass.student_department_code || pass.department_code} · {pass.year_of_study || 'Student'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                VENUE
              </p>
              <p className="font-bold text-sm text-[var(--cf-text)] mt-0.5">
                {pass.venue}
              </p>
              {pass.roll_number && (
                <p className="font-mono-code text-[11px] text-[var(--cf-text-secondary)] mt-0.5">
                  ID: {pass.roll_number}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                DATE
              </p>
              <p className="font-semibold text-[var(--cf-text)] mt-0.5">
                {formatEventDateLong(pass.event_date)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                TIME
              </p>
              <p className="font-mono-code font-semibold text-[var(--cf-text)] mt-0.5">
                {formatTime12h(pass.start_time)}
                {pass.end_time ? ` – ${formatTime12h(pass.end_time)}` : ''}
              </p>
            </div>
          </div>

          {/* Payment Gateway Receipt Block (for Paid Passes) */}
          {isPaidPass && (
            <div className="p-3 rounded-md border border-[#059669]/25 bg-[#059669]/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <div>
                  <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                    PAYMENT RECEIPT ({pass.payment_method || 'UPI / QR'})
                  </p>
                  <p className="font-mono-code text-xs font-semibold text-[var(--cf-text)]">
                    {pass.transaction_id || 'TXN-VERIFIED'}
                  </p>
                </div>
              </div>
              <span className="font-mono-code text-xs font-bold text-[#059669]">
                {pass.payment_status === 'REFUNDED' ? `REFUNDED ₹${amountPaid}` : `₹${amountPaid} PAID`}
              </span>
            </div>
          )}

          {/* Pass ID Block */}
          <div className="p-4 rounded-md border border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                PASS ID
              </p>
              <p className="font-mono-code text-base font-bold tracking-wider text-[var(--cf-text)] mt-0.5">
                {pass.pass_id}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-mono-code font-semibold border ${badgeStyle}`}>
              {pass.status} {pass.status === 'CONFIRMED' || pass.status === 'ATTENDED' ? '✓' : ''}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Pass
            </button>

            {hasCertificate && (
              <button
                type="button"
                onClick={() => setShowCertificate(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" /> Certificate
              </button>
            )}

            {onCancelPass && (pass.status === 'CONFIRMED' || pass.status === 'WAITLISTED') && (
              <button
                type="button"
                disabled={cancelling}
                onClick={() => onCancelPass(pass)}
                className="py-2.5 px-3.5 rounded-md border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : isPaidPass ? 'Cancel & Refund' : 'Cancel Pass'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
