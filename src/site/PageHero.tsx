import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function PageHero({ eyebrow, title, sub, children, photo, pos = 'center' }: { eyebrow: string; title: ReactNode; sub?: string; children?: ReactNode; photo?: string; pos?: string }) {
  return (
    <section className="relative overflow-hidden tex-asphalt border-b border-white/10">
      {photo ? <>
        <img src={`${import.meta.env.BASE_URL}assets/photos/${photo}.webp`} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: pos }} />
        <div className="absolute inset-0 bg-gradient-to-r from-onyx via-onyx/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-onyx/80 to-transparent" />
      </> : <>
        <div className="absolute inset-0 tex-lanes opacity-70" />
        <div className="absolute -right-24 top-0 bottom-0 w-[28%] bg-crimson -skew-x-[16deg] origin-top hidden md:block" />
        <div className="absolute right-[24%] top-0 bottom-0 w-2 bg-ivory -skew-x-[16deg] origin-top hidden md:block" />
      </>}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="max-w-3xl">
          <div className="eyebrow mb-4">{eyebrow}</div>
          <h1 className="h-display text-[48px] md:text-[78px]">{title}</h1>
          {sub && <p className="text-graphite-200 text-[18px] mt-5 max-w-2xl leading-relaxed">{sub}</p>}
          {children}
        </motion.div>
      </div>
      <div className="road-line" />
    </section>
  )
}
