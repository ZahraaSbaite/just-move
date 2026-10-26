import { BRANCHES, INSTAGRAM_MEN } from '@/lib/brand'

export default function Stores() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-8">
      <h1 className="font-display text-7xl sm:text-8xl">Our stores</h1>
      <p className="mt-4 max-w-md text-ink/70">Come try it on — our team will help you find your size.</p>
      <div className="mt-12 grid gap-px bg-ink/10 md:grid-cols-3">
        {BRANCHES.map((b) => (
          <div key={b.name} className="bg-bone p-8">
            <p className="text-xs tracking-[0.2em] text-stone uppercase">{b.area}</p>
            <h2 className="mt-3 font-display text-4xl">{b.name}</h2>
            <a href={b.map} target="_blank" rel="noreferrer" className="mt-8 inline-block border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-bone">
              Get directions
            </a>
          </div>
        ))}
      </div>
      <p className="mt-10 text-sm text-stone">
        Questions? Message us on <a href={INSTAGRAM_MEN} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">Instagram</a>.
      </p>
    </div>
  )
}
