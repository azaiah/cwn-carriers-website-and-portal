// Local sweep: SAM_API_KEY=xxxx npm run sweep
// Writes public/data/sweep.json, which the portal's "Run sweep" button reads.
import { writeFileSync } from 'node:fs'
import { sweepSam } from '../netlify/functions/lib/sam.mjs'

const items = await sweepSam(process.env.SAM_API_KEY)
writeFileSync(new URL('../public/data/sweep.json', import.meta.url), JSON.stringify({ generated: new Date().toISOString(), items }, null, 2))
console.log(`Sweep complete: ${items.length} opportunities`)
