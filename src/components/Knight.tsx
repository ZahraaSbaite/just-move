// The Just Move mark: gold knight with the fallen king. Size it with a height class (width follows).
// `solid` paints it in the current text colour instead of gold foil.
export default function Knight({ className = '', solid = false }: { className?: string; solid?: boolean }) {
  if (solid) {
    return (
      <span
        aria-hidden
        className={`inline-block aspect-[863/900] bg-current ${className}`}
        style={{
          maskImage: 'url(/logo-mark.png)',
          WebkitMaskImage: 'url(/logo-mark.png)',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
      />
    )
  }
  return <img src="/logo-mark-foil.png" alt="" aria-hidden className={`inline-block aspect-[863/900] w-auto ${className}`} />
}
