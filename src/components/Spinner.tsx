export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size]
  return (
    <span
      className={`inline-block ${sizeClass} animate-spin rounded-full border-2 border-current border-t-transparent text-blue-400`}
      role="status"
      aria-label="読み込み中"
    />
  )
}
