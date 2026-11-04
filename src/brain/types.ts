export type Equipment = 'box26' | 'box16' | 'cargoVan' | 'tractor53' | 'van53' | 'flatbed' | 'reefer' | 'hotshot' | 'powerOnly' | 'any'
export type OppKind = 'bid' | 'lead' | 'load' | 'partner'
export type OppStatus = 'new' | 'reviewing' | 'pursuing' | 'submitted' | 'won' | 'lost' | 'passed'
export type Recurrence = 'one-time' | 'weekly' | 'daily' | 'contract'

export interface Place { city: string; state: string; lat: number; lng: number }

export interface Opportunity {
  id: string
  kind: OppKind
  title: string
  org: string
  source: string
  sourceUrl?: string
  origin: Place
  destination?: Place
  equipment: Equipment
  needsCDL: boolean
  hazmat: boolean
  needsLiftgate?: boolean
  minAutoLiability?: number
  minCargo?: number
  setAside?: string[]
  naics?: string
  estValue: number          // estimated annual (contracts) or per-load (loads), USD
  valueBasis: 'annual' | 'per-load'
  miles?: number            // loaded miles per run, if known
  recurrence: Recurrence
  postedDate: string
  dueDate?: string
  contact?: string
  summary: string
  why?: string              // research-backed fit thesis
  status: OppStatus
  sample: boolean           // true = illustrative format; sweep replaces with live postings
  tags?: string[]
  // ---- load details (Load Finder) ----
  pickupDate?: string       // ISO date the load is available
  weightLbs?: number
  pallets?: number
  lengthFt?: number
  fullLoad?: boolean        // posted as a full truckload (needs the whole trailer)
  rateKnown?: boolean       // false = no rate posted, estValue is our estimate
  broker?: { name?: string; mc?: string; phone?: string; email?: string }
  raw?: string              // the original text the load was parsed from
}

export interface Truck {
  id: string; unit: string; type: Equipment; label: string; year?: number; make?: string; model?: string
  liftgate: boolean | null; maxPallets: number | null; maxLbs: number | null; status: 'active' | 'shop' | 'planned'
}

export interface Brain {
  version: number
  company: {
    legalName: string; dba: string; owner: string; usdot: string; mc: string
    address: string; phone: string; cell: string; email: string
    authorityServed: string; insuranceEffective: string; mcs150: string
    operation: string; cargo: string[]
  }
  home: Place
  fleet: Truck[]
  drivers: { total: number; cdl: number; endorsements: string[]; weekends: boolean; overnight: boolean }
  insurance: { autoLiability: number; cargo: number | null; generalLiability: number | null; insurer: string }
  registrations: { sam: boolean | null; eva: boolean | null; usps: boolean | null; certifications: string[] }
  service: {
    modes: string[]
    radiusMiles: number
    preferredStates: string[]
    neverHaul: string[]
    loves: string[]
  }
  money: { rateFloorPerMile: number; minPerLoad: number; costPerMile: number; weeklyTargetPerTruck: number }
  goals: { govContracts: boolean; dedicatedRoutes: boolean; thirdTruck: boolean; brokerAuthority: boolean; revenue12mo: number }
  weights: { fit: number; profit: number; distance: number; recurrence: number; winnability: number; urgency: number }
  unknowns: string[]        // facts still needed from Lawrence
}

export interface Reason { kind: 'plus' | 'minus' | 'stop' | 'info'; text: string }
export interface Scored { score: number; grade: 'A' | 'B' | 'C' | 'D'; verdict: 'Go' | 'Maybe' | 'Pass'; reasons: Reason[]; distance: number }
