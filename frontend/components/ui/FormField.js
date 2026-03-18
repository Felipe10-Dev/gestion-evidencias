export function FormField({ children, label }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  )
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className || ''}`}
    />
  )
}

export function TextAreaInput(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className || ''}`}
    />
  )
}

export function SelectInput(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className || ''}`}
    />
  )
}