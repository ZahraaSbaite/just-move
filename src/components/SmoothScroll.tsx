import { ReactLenis, useLenis, type LenisRef } from 'lenis/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

// Keeps ScrollTrigger in sync with Lenis. Must live inside <ReactLenis>.
function ScrollTriggerSync() {
  useLenis(ScrollTrigger.update)
  return null
}

// Drives Lenis from GSAP's ticker so ScrollTrigger and smooth scroll share one frame loop.
// The Lenis instance is created after this component mounts, so read it from the ref each frame.
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    return () => gsap.ticker.remove(update)
  }, [])

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1 }}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  )
}
