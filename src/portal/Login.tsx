import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, KeyRound, Mail } from 'lucide-react'
import { Logo } from '../components/Logo'
import { googleEnabled, supabase } from '../lib/supabase'

type View = 'signin' | 'signup' | 'forgot' | 'recovery'

/** Sign-in for the live portal. Accounts are invite-only: the database only lets
 *  an email into CWN's data if the owner invited it. */
export function Login({ onDemo, recovery = false, notice }: { onDemo: () => void; recovery?: boolean; notice?: string }) {
  const [view, setView] = useState<View>(recovery ? 'recovery' : 'signin')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(notice ? { ok: false, text: notice } : null)
  const back = `${window.location.origin}${import.meta.env.BASE_URL}portal`
  // Links in emails get opened on phones, where "localhost" means nothing. When testing
  // on a computer, send email links to the live site instead.
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
  const emailBack = local ? 'https://cwn-carriers-website-portal.netlify.app/portal' : back
  const [google, setGoogle] = useState(false)
  useEffect(() => { googleEnabled().then(setGoogle) }, [])
  const withGoogle = async () => {
    setBusy(true); setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back, queryParams: { prompt: 'select_account' } } })
    if (error) { setMsg({ ok: false, text: error.message }); setBusy(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null)
    try {
      if (view === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
        if (error) setMsg({ ok: false, text: error.message === 'Invalid login credentials' ? 'That email and password don\'t match. Try again or reset your password.' : error.message })
      } else if (view === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pw, options: { emailRedirectTo: emailBack } })
        if (error) setMsg({ ok: false, text: error.message })
        else if (!data.session) setMsg({ ok: true, text: `Check ${email.trim()} for a confirmation link, then come back and sign in.` })
      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: emailBack })
        setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'If that email has an account, a reset link is on its way.' })
      } else {
        const { error } = await supabase.auth.updateUser({ password: pw })
        setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Password updated. You\'re signed in.' })
      }
    } finally { setBusy(false) }
  }

  const title = { signin: 'Sign in', signup: 'Create your account', forgot: 'Reset your password', recovery: 'Set a new password' }[view]
  return (
    <div className="min-h-screen tex-asphalt relative overflow-hidden grid place-items-center p-4">
      <img src={`${import.meta.env.BASE_URL}assets/photos/route-night.webp`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-onyx/90 via-onyx/60 to-onyx/30" />
      <div className="relative w-full max-w-md bg-onyx-850/95 ring-1 ring-white/10 shadow-[0_40px_100px_-30px_#000] tex-grain">
        <div className="p-8 pb-6 border-b border-white/10">
          <Logo className="h-12 w-auto" />
          <div className="eyebrow mt-7">Operations portal</div>
          <h1 className="h-display text-[38px] mt-1">{title}</h1>
          {view === 'signup' && <p className="text-graphite-300 text-sm mt-1">Use the email your company invited. Pick a password you'll remember.</p>}
        </div>
        {google && (view === 'signin' || view === 'signup') && <div className="px-8 pt-6">
          <button type="button" onClick={withGoogle} disabled={busy} className="w-full h-12 flex items-center justify-center gap-3 bg-white text-[#1f1f1f] font-semibold text-[15px] hover:bg-ivory disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mt-5 text-[11px] font-mono uppercase tracking-[.16em] text-graphite-400"><span className="flex-1 h-px bg-white/10" />or use email<span className="flex-1 h-px bg-white/10" /></div>
        </div>}
        <form onSubmit={submit} className="p-8 pt-6 grid gap-3">
          {view !== 'recovery' && <label><span className="label">Email</span><div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" /><input type="email" required autoComplete="email" className="input pl-9" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@cwn-carriers.com" /></div></label>}
          {view !== 'forgot' && <label><span className="label">{view === 'recovery' ? 'New password' : 'Password'}</span><div className="relative"><KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" /><input type="password" required minLength={8} autoComplete={view === 'signin' ? 'current-password' : 'new-password'} className="input pl-9" value={pw} onChange={e => setPw(e.target.value)} /></div></label>}
          {msg && <div className={`text-[13.5px] px-3 py-2 ring-1 ${msg.ok ? 'bg-signal-green/10 ring-signal-green/30 text-signal-green' : 'bg-crimson/10 ring-crimson/40 text-crimson-400'}`}>{msg.text}</div>}
          <button disabled={busy} className="btn btn-red w-full mt-1 disabled:opacity-50">{busy ? 'One moment…' : { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset link', recovery: 'Save password' }[view]} <ArrowRight size={16} /></button>
          <div className="flex flex-wrap justify-between gap-2 text-[13px] text-graphite-300 mt-1">
            {view === 'signin' && <><button type="button" onClick={() => setView('signup')} className="hover:text-white">First time? Create your account</button><button type="button" onClick={() => setView('forgot')} className="hover:text-white">Forgot password</button></>}
            {(view === 'signup' || view === 'forgot') && <button type="button" onClick={() => setView('signin')} className="hover:text-white">← Back to sign in</button>}
          </div>
        </form>
        <div className="px-8 py-4 border-t border-white/10 flex justify-between items-center text-[12px] font-mono uppercase tracking-[.14em] text-graphite-400">
          <Link to="/" className="hover:text-white">← Website</Link>
          <button onClick={onDemo} className="hover:text-white">Try the demo →</button>
        </div>
      </div>
    </div>
  )
}

export function NoAccess({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen tex-asphalt grid place-items-center p-4">
      <div className="w-full max-w-md bg-onyx-850 ring-1 ring-white/10 p-8">
        <Logo className="h-10 w-auto" />
        <h1 className="h-display text-[32px] mt-6">Not invited yet</h1>
        <p className="text-graphite-300 mt-2">{email} is signed in, but no company has invited this email. Ask the owner to invite it from Fleet &amp; Drivers → Team, then sign in again.</p>
        <button onClick={onSignOut} className="btn btn-ghost mt-6">Sign out</button>
      </div>
    </div>
  )
}
