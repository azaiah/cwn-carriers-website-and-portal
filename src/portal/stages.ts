import type { OppKind, OppStatus } from '../brain/types'

// The pipeline uses one set of statuses for every kind of opportunity, but each
// kind gets the words that make sense for it (a load gets "Booked", a bid "Won").
export const PIPE: OppStatus[] = ['new', 'reviewing', 'pursuing', 'submitted', 'won', 'lost']

const WORDS: Record<OppKind, Record<OppStatus, string>> = {
  load: { new: 'Found', reviewing: 'Reviewing', pursuing: 'Negotiating', submitted: 'Offer sent', won: 'Booked', lost: 'Missed', passed: 'Passed' },
  bid: { new: 'New', reviewing: 'Reviewing', pursuing: 'Preparing bid', submitted: 'Submitted', won: 'Won', lost: 'Lost', passed: 'Passed' },
  lead: { new: 'New', reviewing: 'Researching', pursuing: 'Contacting', submitted: 'Proposal sent', won: 'Customer', lost: 'Lost', passed: 'Passed' },
  partner: { new: 'New', reviewing: 'Reviewing', pursuing: 'Applying', submitted: 'Applied', won: 'Approved', lost: 'Declined', passed: 'Passed' },
}
export const stageWord = (k: OppKind, s: OppStatus) => WORDS[k][s]

export const COLUMN: Record<OppStatus, { title: string; sub: string }> = {
  new: { title: 'New', sub: 'Found by the sweep, inbox or Load Finder' },
  reviewing: { title: 'Reviewing', sub: 'Looking it over' },
  pursuing: { title: 'Working it', sub: 'Negotiating, preparing, contacting' },
  submitted: { title: 'Sent', sub: 'Offer, bid or proposal is out' },
  won: { title: 'Won / Booked', sub: 'Loads go to Dispatch' },
  lost: { title: 'Lost', sub: 'Didn\'t get it' },
  passed: { title: 'Passed', sub: 'Not a fit' },
}
