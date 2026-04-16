interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWords?: number;
}

export default function TextInput({
  value,
  onChange,
  placeholder = 'Enter text here...',
  maxWords = 5000,
}: TextInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxWords * 10}
      rows={12}
      className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
    />
  );
}
