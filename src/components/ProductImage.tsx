import type { Gender } from '@/types'

// Shows the product photo, or a tonal placeholder until photos are uploaded.
export default function ProductImage({
  src,
  name,
  gender,
  className = '',
  eager = false,
}: {
  src?: string | null
  name: string
  gender?: Gender
  className?: string
  eager?: boolean
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }
  return (
    <div
      role="img"
      aria-label={name}
      className={`flex h-full w-full items-end p-5 ${
        gender === 'women' ? 'bg-[#e2d9cb] text-[#6b5e4c]' : 'bg-[#dcd6cb] text-[#5a564e]'
      } ${className}`}
    >
      <span className="font-display text-2xl leading-none italic opacity-80">{name}</span>
    </div>
  )
}
