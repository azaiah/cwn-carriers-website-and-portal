import type { Brain, Place } from './types'

// Verified facts come from FMCSA census / L&I data (pulled Nov 2026).
// Anything Lawrence still needs to confirm is listed in `unknowns` and shown
// in the portal's Company Brain completeness meter.
export const HOME: Place = { city: 'Chesterfield', state: 'VA', lat: 37.377, lng: -77.505 }

export const DEFAULT_BRAIN: Brain = {
  version: 1,
  company: {
    legalName: 'Commonwealth Nationwide Carriers LLC',
    dba: 'CWN Carriers',
    owner: 'Lawrence Samuel',
    usdot: '4444839',
    mc: '1750751',
    address: '6824 Rossville Dr, Chesterfield, VA 23832',
    phone: '(804) 787-4757',
    cell: '(804) 603-6242',
    email: 'lsamuel@cwn-carriers.com',
    authorityServed: '2025-08-15',
    insuranceEffective: '2025-07-22',
    mcs150: '2026-01-31',
    operation: 'Interstate · Authorized for hire · Common authority',
    cargo: ['General freight'],
  },
  home: HOME,
  fleet: [
    { id: 't1', unit: '101', type: 'box26', label: 'Box truck', liftgate: null, maxPallets: 12, maxLbs: 10000, status: 'active' },
    { id: 't2', unit: '102', type: 'box26', label: 'Box truck', liftgate: null, maxPallets: 12, maxLbs: 10000, status: 'active' },
    { id: 't3', unit: '103', type: 'box26', label: 'Truck #3 (planned)', liftgate: true, maxPallets: 12, maxLbs: 10000, status: 'planned' },
  ],
  drivers: { total: 3, cdl: 0, endorsements: [], weekends: true, overnight: false },
  insurance: { autoLiability: 1_000_000, cargo: null, generalLiability: null, insurer: 'Agency Insurance Company of Maryland' },
  registrations: { sam: null, eva: null, usps: null, certifications: [] },
  service: {
    modes: ['LTL', 'Partial', 'Final mile', 'Expedited', 'Dedicated route'],
    radiusMiles: 250,
    preferredStates: ['VA', 'NC', 'MD', 'DC', 'DE'],
    neverHaul: ['Hazmat', 'Livestock', 'Household moves'],
    loves: ['Palletized freight', 'B2B deliveries', 'Recurring routes'],
  },
  money: { rateFloorPerMile: 2.6, minPerLoad: 350, costPerMile: 1.85, weeklyTargetPerTruck: 3500 },
  goals: { govContracts: true, dedicatedRoutes: true, thirdTruck: true, brokerAuthority: false, revenue12mo: 420000 },
  weights: { fit: 30, profit: 25, distance: 15, recurrence: 15, winnability: 10, urgency: 5 },
  unknowns: [
    'Exact truck year / make / model and box length',
    'Liftgate on trucks 101 and 102?',
    'Cargo insurance limit',
    'General liability coverage',
    'SAM.gov registration (UEI / CAGE)',
    'Virginia eVA vendor registration',
    'SWaM / DBE / MBE certifications',
    'Real rate per mile and cost per mile',
    'Top 5 current customers and brokers',
    'Lanes run most often',
  ],
}

// Rough city coordinates used for distance scoring and the lanes map
export const PLACES: Record<string, Place> = {
  chesterfield: HOME,
  richmond: { city: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.436 },
  petersburg: { city: 'Petersburg', state: 'VA', lat: 37.2279, lng: -77.4019 },
  colonialHeights: { city: 'Colonial Heights', state: 'VA', lat: 37.268, lng: -77.4072 },
  hopewell: { city: 'Hopewell', state: 'VA', lat: 37.3043, lng: -77.2872 },
  chester: { city: 'Chester', state: 'VA', lat: 37.3568, lng: -77.4419 },
  henrico: { city: 'Henrico', state: 'VA', lat: 37.5059, lng: -77.3328 },
  ashland: { city: 'Ashland', state: 'VA', lat: 37.759, lng: -77.4797 },
  fortLee: { city: 'Fort Lee', state: 'VA', lat: 37.2433, lng: -77.3364 },
  newKent: { city: 'New Kent', state: 'VA', lat: 37.5168, lng: -76.979 },
  williamsburg: { city: 'Williamsburg', state: 'VA', lat: 37.2707, lng: -76.7075 },
  norfolk: { city: 'Norfolk', state: 'VA', lat: 36.8508, lng: -76.2859 },
  suffolk: { city: 'Suffolk', state: 'VA', lat: 36.7282, lng: -76.5836 },
  charlottesville: { city: 'Charlottesville', state: 'VA', lat: 38.0293, lng: -78.4767 },
  fredericksburg: { city: 'Fredericksburg', state: 'VA', lat: 38.3032, lng: -77.4605 },
  goochland: { city: 'Goochland', state: 'VA', lat: 37.6843, lng: -77.8853 },
  lynchburg: { city: 'Lynchburg', state: 'VA', lat: 37.4138, lng: -79.1422 },
  roanoke: { city: 'Roanoke', state: 'VA', lat: 37.271, lng: -79.9414 },
  dc: { city: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369 },
  baltimore: { city: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
  raleigh: { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  durham: { city: 'Durham', state: 'NC', lat: 35.994, lng: -78.8986 },
  greensboro: { city: 'Greensboro', state: 'NC', lat: 36.0726, lng: -79.792 },
  charlotte: { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  wilmingtonDE: { city: 'Wilmington', state: 'DE', lat: 39.7391, lng: -75.5398 },
  philadelphia: { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  atlanta: { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  columbia: { city: 'Columbia', state: 'SC', lat: 34.0007, lng: -81.0348 },
}
