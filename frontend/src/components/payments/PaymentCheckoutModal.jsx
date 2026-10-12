import { useState } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  CreditCard,
  Landmark,
  Trophy,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { apiRequest } from '../../services/api';

export default function PaymentCheckoutModal({
  event,
  user,
  onClose,
  onConfirmPayment,
  submitting,
}) {
  // Step 1: Payment Instrument State (No pre-filled fake credentials!)
  const [step, setStep] = useState(1); // 1 = Instrument Entry, 2 = 6-Digit OTP Challenge
  const [method, setMethod] = useState('UPI / QR');
  const [upiMode, setUpiMode] = useState('UPI_ID'); // 'UPI_ID' or 'QR_UTR'
  const [upiId, setUpiId] = useState('');
  const [utrReference, setUtrReference] = useState('');

  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [selectedBank, setSelectedBank] = useState('State Bank of India (Campus Branch)');
  const [netbankingUserId, setNetbankingUserId] = useState('');

  // Step 2: Server Order & OTP Challenge State
  const [orderData, setOrderData] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!event) return null;

  const fee = Number(event.registration_fee || 0);

  const formatCardNumberInput = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  // Step 1 -> Create Server-Side Payment Order & Generate OTP Challenge
  const handleInitiateOrder = async (e) => {
    e.preventDefault();
    if (processing || submitting) return;

    setProcessing(true);
    setErrorMsg(null);

    try {
      const res = await apiRequest('/payments/create-order.php', {
        method: 'POST',
        body: {
          event_id: event.id,
          payment_method: method,
          upi_mode: upiMode,
          upi_id: upiId.trim(),
          utr_reference: utrReference.trim(),
          card_holder: cardHolder.trim(),
          card_number: cardNumber,
          card_expiry: cardExpiry.trim(),
          card_cvv: cardCvv.trim(),
          bank_name: selectedBank,
          netbanking_user_id: netbankingUserId.trim(),
        },
      });

      if (res.data?.order) {
        setOrderData(res.data.order);
        setOtpInput('');
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Step 2 -> Verify 6-Digit OTP with Server & Receive Cryptographic HMAC Signature
  const handleVerifyOtpAndMintPass = async (e) => {
    e.preventDefault();
    if (!orderData || processing || submitting) return;

    setProcessing(true);
    setErrorMsg(null);

    try {
      const verifyRes = await apiRequest('/payments/verify-order.php', {
        method: 'POST',
        body: {
          order_id: orderData.order_id,
          otp_code: otpInput.trim(),
        },
      });

      const v = verifyRes.data?.verification;
      if (!v || !v.payment_signature) {
        throw new Error('Payment signature verification failed.');
      }

      // Pass verified order_id and HMAC payment_signature to register.php
      await onConfirmPayment({
        order_id: v.order_id,
        payment_signature: v.payment_signature,
        payment_method: v.payment_method,
        transaction_id: v.transaction_id,
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text)] shadow-2xl overflow-hidden">
        {/* Top Gateway Bar */}
        <div className="px-6 py-4 border-b border-[var(--cf-border)] bg-[var(--cf-bg)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--cf-success)]" />
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[var(--cf-text)]">
              CAMPUSFLOW PAY · 2-STEP VERIFIED GATEWAY
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing || submitting}
            className="p-1 rounded hover:bg-[var(--cf-surface-muted)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="px-6 py-2.5 bg-[var(--cf-surface-muted)]/60 border-b border-[var(--cf-border)] flex items-center justify-between text-[11px] font-mono-code">
          <span className={step === 1 ? 'font-bold text-[var(--cf-primary)]' : 'text-[var(--cf-success)] font-semibold'}>
            01. Payment Details {step > 1 ? '✓' : ''}
          </span>
          <span className="text-[var(--cf-text-secondary)]">→</span>
          <span className={step === 2 ? 'font-bold text-[var(--cf-primary)]' : 'text-[var(--cf-text-secondary)]'}>
            02. 6-Digit OTP & Signature Verification
          </span>
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Event & Order Summary */}
          <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-2.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono-code uppercase text-[var(--cf-primary)] font-semibold">
                  {event.category} · {event.department_code} DEPT
                </p>
                <h3 className="font-editorial text-2xl text-[var(--cf-text)] leading-snug">
                  {event.title}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-mono-code uppercase text-[var(--cf-text-secondary)]">
                  PAYABLE AMOUNT
                </p>
                <p className="font-editorial text-3xl text-[var(--cf-text)]">₹{fee}</p>
              </div>
            </div>

            {event.prize_pool && (
              <div className="pt-2 border-t border-dashed border-[var(--cf-border)] flex items-center gap-2 text-xs text-[var(--cf-success)] font-medium">
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Rewards & Prize Pool: <strong>{event.prize_pool}</strong>
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--cf-border)] flex items-center justify-between text-[11px] text-[var(--cf-text-secondary)]">
              <span>
                Participant: <strong className="text-[var(--cf-text)]">{user?.full_name}</strong>
              </span>
              <span className="font-mono-code">HMAC-SHA256 Protected</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-600 flex items-start gap-2.5 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleInitiateOrder} className="space-y-4">
              {/* Payment Method Selector Tabs */}
              <div>
                <p className="text-[11px] font-mono-code uppercase text-[var(--cf-text-secondary)] mb-2">
                  SELECT PAYMENT METHOD
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI / QR', label: 'UPI / QR', icon: QrCode },
                    { id: 'Credit / Debit Card', label: 'Card', icon: CreditCard },
                    { id: 'NetBanking', label: 'NetBanking', icon: Landmark },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = method === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setMethod(tab.id);
                          setErrorMsg(null);
                        }}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'border-[var(--cf-primary)] bg-[var(--cf-primary)]/10 text-[var(--cf-primary)]'
                            : 'border-[var(--cf-border)] bg-[var(--cf-bg)] text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method 1: UPI / QR */}
              {method === 'UPI / QR' && (
                <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-4">
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUpiMode('UPI_ID')}
                      className={`flex-1 py-1.5 px-2.5 rounded border font-semibold cursor-pointer ${
                        upiMode === 'UPI_ID'
                          ? 'bg-[var(--cf-surface)] border-[var(--cf-primary)] text-[var(--cf-primary)]'
                          : 'border-[var(--cf-border)] text-[var(--cf-text-secondary)]'
                      }`}
                    >
                      UPI Collect (VPA + OTP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiMode('QR_UTR')}
                      className={`flex-1 py-1.5 px-2.5 rounded border font-semibold cursor-pointer ${
                        upiMode === 'QR_UTR'
                          ? 'bg-[var(--cf-surface)] border-[var(--cf-primary)] text-[var(--cf-primary)]'
                          : 'border-[var(--cf-border)] text-[var(--cf-text-secondary)]'
                      }`}
                    >
                      Scan QR + 12-Digit UTR
                    </button>
                  </div>

                  {upiMode === 'QR_UTR' && (
                    <div className="flex items-center gap-4 p-3 rounded border border-[var(--cf-border)] bg-[var(--cf-surface)]">
                      <div className="w-20 h-20 rounded border border-[var(--cf-border)] bg-white p-2 shrink-0 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-2 border-neutral-900 bg-neutral-900/20" />
                          <div className="w-2 h-2 bg-neutral-900" />
                          <div className="w-4 h-4 border-2 border-neutral-900 bg-neutral-900/20" />
                        </div>
                        <div className="flex justify-around items-center">
                          <div className="w-2 h-2 bg-neutral-900" />
                          <div className="w-5 h-5 bg-[var(--cf-primary)] rounded-xs" />
                          <div className="w-2 h-2 bg-neutral-900" />
                        </div>
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-2 border-neutral-900 bg-neutral-900/20" />
                          <div className="w-3 h-2 bg-neutral-900" />
                          <div className="w-3 h-3 bg-neutral-900" />
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-[var(--cf-text)]">
                          Scan ₹{fee} QR with GPay, PhonePe, or Paytm
                        </p>
                        <p className="text-[var(--cf-text-secondary)]">
                          Merchant VPA:{' '}
                          <span className="font-mono-code text-[var(--cf-text)]">
                            campusflow.events@sbi
                          </span>
                        </p>
                        <p className="text-[11px] text-[var(--cf-primary)] font-medium">
                          After scanning, enter your 12-digit UPI Reference / UTR below.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                      Your UPI ID (VPA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okaxis or rollno@ybl"
                      className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-xs font-mono-code text-[var(--cf-text)] focus:outline-none focus:border-[var(--cf-primary)]"
                    />
                  </div>

                  {upiMode === 'QR_UTR' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                        12-Digit UPI UTR / Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={utrReference}
                        onChange={(e) => setUtrReference(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 428190341829 (12 digits)"
                        className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-xs font-mono-code text-[var(--cf-text)] focus:outline-none focus:border-[var(--cf-primary)]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Method 2: Credit / Debit Card */}
              {method === 'Credit / Debit Card' && (
                <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] text-[var(--cf-text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                      16-Digit Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[var(--cf-text)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                        Expiry (MM/YY) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="08/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                        className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[var(--cf-text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                        CVV *
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[var(--cf-text)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Method 3: NetBanking */}
              {method === 'NetBanking' && (
                <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1.5">
                      Select Supported Bank *
                    </label>
                    <div className="space-y-1.5">
                      {[
                        'State Bank of India (Campus Branch)',
                        'HDFC Bank Corporate Portal',
                        'ICICI Bank',
                        'Axis Bank',
                      ].map((bank) => (
                        <label
                          key={bank}
                          className={`flex items-center justify-between p-2.5 rounded border cursor-pointer ${
                            selectedBank === bank
                              ? 'border-[var(--cf-primary)] bg-[var(--cf-primary)]/5 text-[var(--cf-text)] font-semibold'
                              : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-secondary)]'
                          }`}
                        >
                          <span>{bank}</span>
                          <input
                            type="radio"
                            name="bank"
                            checked={selectedBank === bank}
                            onChange={() => setSelectedBank(bank)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1">
                      NetBanking Customer ID / User ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={netbankingUserId}
                      onChange={(e) => setNetbankingUserId(e.target.value)}
                      placeholder="Enter Customer ID (min 4 chars)"
                      className="w-full px-3 py-2 rounded-md bg-[var(--cf-surface)] border border-[var(--cf-border)] font-mono-code text-[var(--cf-text)]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing || submitting}
                  className="py-2.5 px-4 rounded-lg border border-[var(--cf-border)] text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[var(--cf-primary)] hover:bg-[var(--cf-primary-hover)] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {processing ? 'Initiating Payment Order...' : `Request Verification OTP (₹${fee}) →`}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT BANK / UPI OTP CHALLENGE & SIGNATURE VERIFICATION */
            <form onSubmit={handleVerifyOtpAndMintPass} className="space-y-4">
              <div className="p-4 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--cf-border)] pb-2.5">
                  <span className="font-mono-code text-[11px] text-[var(--cf-text-secondary)]">
                    ORDER ID: <strong className="text-[var(--cf-text)]">{orderData?.order_id}</strong>
                  </span>
                  <span className="font-mono-code text-[11px] text-[var(--cf-success)] font-semibold">
                    AWAITING OTP
                  </span>
                </div>

                <p className="text-[var(--cf-text-secondary)]">
                  Instrument:{' '}
                  <strong className="font-mono-code text-[var(--cf-text)]">
                    {orderData?.masked_instrument}
                  </strong>
                </p>

                {/* Simulated Bank SMS OTP Notification for Campus Testing */}
                <div className="p-3 rounded-md border border-amber-500/40 bg-amber-500/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-amber-600">
                      BANK / UPI 3DS SMS DISPATCH (TEST GATEWAY)
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpInput(String(orderData?.bank_otp_simulation || ''))}
                      className="text-[10px] font-mono-code font-bold underline text-[var(--cf-primary)] cursor-pointer"
                    >
                      Auto-fill OTP
                    </button>
                  </div>
                  <p className="text-xs text-[var(--cf-text)]">
                    Your one-time verification code for ₹{fee} is{' '}
                    <strong className="font-mono-code text-sm px-1.5 py-0.5 rounded bg-[var(--cf-surface)] border border-[var(--cf-border)]">
                      {orderData?.bank_otp_simulation}
                    </strong>
                    . Entering any other code will be rejected by the server.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cf-text)] mb-1.5">
                    Enter 6-Digit Bank / UPI Verification OTP *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[var(--cf-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--cf-surface)] border border-[var(--cf-border)] text-base font-mono-code tracking-[0.25em] font-bold text-[var(--cf-text)] focus:outline-none focus:border-[var(--cf-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg(null);
                  }}
                  disabled={processing || submitting}
                  className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-lg border border-[var(--cf-border)] text-xs font-semibold text-[var(--cf-text-secondary)] hover:text-[var(--cf-text)] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={processing || submitting || otpInput.length !== 6}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[var(--cf-success)] hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold transition-opacity cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processing || submitting
                    ? 'Verifying OTP & Signature...'
                    : `Verify OTP & Pay ₹${fee}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
