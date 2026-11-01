// Netlify Forms submit (works on the deployed site; harmless in previews)
export async function submitForm(name: string, data: Record<string, string>) {
  const body = new URLSearchParams({ 'form-name': name, ...data }).toString()
  try {
    await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  } catch { /* preview/offline */ }
  // Hand-off to the portal demo so the Company Brain scores website quotes instantly
  try {
    const key = 'cwn-inbound'
    const list = JSON.parse(localStorage.getItem(key) ?? '[]')
    list.unshift({ form: name, at: new Date().toISOString(), ...data })
    localStorage.setItem(key, JSON.stringify(list.slice(0, 30)))
  } catch { /* storage unavailable */ }
}
