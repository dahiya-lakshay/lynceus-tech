import { useState } from 'react'

const CHANNELS = ['ATM', 'Online', 'Branch']
const TX_TYPES = ['Debit', 'Credit']
const CUSTOMER_SEGMENTS = ['Savings', 'Checking', 'Business']
const TRANSACTION_CATEGORIES = ['ATM', 'POS', 'Online', 'Transfer', 'Bill Payment']
const PAYMENT_METHODS = ['Card', 'UPI', 'Net Banking', 'Wallet', 'Wire Transfer']
const MERCHANT_CATEGORIES = ['Retail', 'Grocery', 'Travel', 'Electronics', 'Healthcare', 'Gaming', 'Crypto']

// Fields the backend requires but this panel no longer surfaces (per the
// redesign brief). Sent with sensible fixed defaults so /api/predict still
// receives a valid payload — nothing about the API contract changes.
const HIDDEN_DEFAULTS = {
  CustomerAge: 35,
  CustomerOccupation: 'Not Specified',
  TransactionDuration: 60,
}

// One day before the transaction time, so TimeSinceLastTransaction still
// computes a plausible value without asking the analyst to enter it.
function impliedPreviousDate(transactionDateStr) {
  const match = transactionDateStr.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/)
  if (!match) return transactionDateStr
  const [, dd, mm, yyyy, hh, min] = match
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min))
  d.setDate(d.getDate() - 1)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PRESETS = {
  typical: {
    label: 'Typical transaction',
    values: {
      AccountID: 'AC00455',
      TransactionAmount: '68.40',
      TransactionType: 'Debit',
      Location: 'Houston',
      DeviceID: 'D000051',
      'IP Address': '13.149.61.4',
      MerchantID: 'M052',
      Channel: 'ATM',
      LoginAttempts: '1',
      AccountBalance: '9820.10',
      TransactionDate: '21-07-2026 09:15',
      CustomerSegment: 'Checking',
      TransactionCategory: 'ATM',
      PaymentMethod: 'Card',
      MerchantCategory: 'Retail',
    },
  },
  suspicious: {
    label: 'Suspicious pattern',
    values: {
      AccountID: 'AC00455',
      TransactionAmount: '4820.00',
      TransactionType: 'Debit',
      Location: 'Unknown',
      DeviceID: 'D999912',
      'IP Address': '203.0.113.77',
      MerchantID: 'M999',
      Channel: 'Online',
      LoginAttempts: '5',
      AccountBalance: '112.50',
      TransactionDate: '21-07-2026 03:12',
      CustomerSegment: 'Savings',
      TransactionCategory: 'Online',
      PaymentMethod: 'Wallet',
      MerchantCategory: 'Crypto',
    },
  },
}

const FIELDS = [
  { name: 'AccountID', label: 'Account ID', type: 'text', placeholder: 'optional' },
  { name: 'TransactionAmount', label: 'Amount ($)', type: 'number', step: '0.01' },
  { name: 'TransactionDate', label: 'Transaction Time', type: 'text', placeholder: 'DD-MM-YYYY HH:MM' },
  { name: 'TransactionType', label: 'Type', type: 'select', options: TX_TYPES },
  { name: 'Channel', label: 'Channel', type: 'select', options: CHANNELS },
  { name: 'CustomerSegment', label: 'Customer Segment', type: 'select', options: CUSTOMER_SEGMENTS },
  { name: 'TransactionCategory', label: 'Transaction Category', type: 'select', options: TRANSACTION_CATEGORIES },
  { name: 'PaymentMethod', label: 'Payment Method', type: 'select', options: PAYMENT_METHODS },
  { name: 'MerchantCategory', label: 'Merchant Category', type: 'select', options: MERCHANT_CATEGORIES },
  { name: 'Location', label: 'Location', type: 'text' },
  { name: 'MerchantID', label: 'Merchant ID', type: 'text' },
  { name: 'DeviceID', label: 'Device ID', type: 'text' },
  { name: 'IP Address', label: 'IP Address', type: 'text' },
  { name: 'LoginAttempts', label: 'Login Attempts', type: 'number' },
  { name: 'AccountBalance', label: 'Account Balance ($)', type: 'number', step: '0.01' },
]

export default function TransactionForm({ onSubmit, loading }) {
  const [values, setValues] = useState(PRESETS.typical.values)

  const update = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const applyPreset = (key) => setValues(PRESETS[key].values)

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...values,
      AccountID: values.AccountID || null,
      TransactionAmount: parseFloat(values.TransactionAmount),
      LoginAttempts: parseInt(values.LoginAttempts, 10),
      AccountBalance: parseFloat(values.AccountBalance),
      PreviousTransactionDate: impliedPreviousDate(values.TransactionDate),
      ...HIDDEN_DEFAULTS,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ledger-600 bg-ledger-800/40 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-slate-50">Transaction Details</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              type="button"
              key={key}
              onClick={() => applyPreset(key)}
              className="rounded-md border border-ledger-600 px-2.5 py-1 font-mono text-[11px] text-slate-400 transition hover:border-signal-amber hover:text-signal-amber"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.name} className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">
              {field.label}
            </span>
            {field.type === 'select' ? (
              <select
                value={values[field.name]}
                onChange={(e) => update(field.name, e.target.value)}
                className="rounded-md border border-ledger-600 bg-ledger-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-signal-amber"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                step={field.step}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(e) => update(field.name, e.target.value)}
                required={field.name !== 'AccountID'}
                className="rounded-md border border-ledger-600 bg-ledger-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-signal-amber"
              />
            )}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-md bg-signal-amber py-3 font-mono text-sm font-semibold text-ledger-950 shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Scoring transaction…' : 'Score This Transaction'}
      </button>
    </form>
  )
}
