const demoUsers = [
  { id: "student-free", label: "Estudiante gratuito" },
  { id: "student-basic", label: "Estudiante básico" },
  { id: "student-pro", label: "Estudiante pro" }
];

export default function UserSelector({ selectedUserId, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-panel">
      <span className="text-sm font-medium text-slate-500">Usuario demo</span>
      <select
        value={selectedUserId}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-ocean"
      >
        {demoUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.label}
          </option>
        ))}
      </select>
    </label>
  );
}
