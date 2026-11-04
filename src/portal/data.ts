import { PLACES as P } from '../brain/cwn'
import type { Place } from '../brain/types'

const d = (n: number, h = 8) => { const x = new Date(); x.setDate(x.getDate() + n); x.setHours(h, 0, 0, 0); return x.toISOString() }

export type LoadStatus = 'quoted' | 'booked' | 'dispatched' | 'transit' | 'delivered' | 'invoiced' | 'paid'
export const LOAD_STAGES: { key: LoadStatus; label: string }[] = [
  { key: 'quoted', label: 'Quoted' }, { key: 'booked', label: 'Booked' }, { key: 'dispatched', label: 'Dispatched' },
  { key: 'transit', label: 'In transit' }, { key: 'delivered', label: 'Delivered' }, { key: 'invoiced', label: 'Invoiced' }, { key: 'paid', label: 'Paid' },
]

export interface Load {
  id: string; ref: string; customer: string; origin: Place; destination: Place
  pickup: string; delivery: string; pallets: number; weight: number; commodity: string
  rate: number; miles: number; truck?: string; driver?: string; status: LoadStatus
  pod?: boolean; bol?: boolean; notes?: string; liftgate?: boolean
  bolPath?: string; podPath?: string; podName?: string   // files in the company's private document storage
}
export interface Driver { id: string; name: string; phone: string; status: 'on duty' | 'off' | 'driving'; truck?: string; cdl: boolean; hired: string }
export interface Customer { id: string; name: string; type: 'Shipper' | 'Broker' | 'Partner' | 'Government'; contact: string; email: string; phone: string; city: string; terms: string; loads: number; revenue: number; lastLoad?: string; notes?: string }
export interface Comp { id: string; item: string; detail: string; due?: string; status: 'ok' | 'soon' | 'action' | 'missing' }
export interface Outreach { id: string; oppId: string; to: string; channel: 'Email' | 'Call' | 'LinkedIn'; subject: string; body: string; status: 'draft' | 'approved' | 'sent'; created: string }
export interface Activity { id: string; at: string; who: string; text: string; kind: 'load' | 'brain' | 'bid' | 'money' | 'sys' }

export const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Driver A', phone: '(804) 555-0141', status: 'driving', truck: '101', cdl: false, hired: '2025-08' },
  { id: 'd2', name: 'Driver B', phone: '(804) 555-0177', status: 'on duty', truck: '102', cdl: false, hired: '2025-09' },
  { id: 'd3', name: 'Driver C', phone: '(804) 555-0109', status: 'off', cdl: false, hired: '2026-03' },
]

export const LOADS: Load[] = [
  { id: 'ld1', ref: 'CWN-1041', customer: 'Atlantic Fixture Supply', origin: P.chesterfield, destination: P.raleigh, pickup: d(0, 7), delivery: d(0, 14), pallets: 8, weight: 9200, commodity: 'Store fixtures', rate: 640, miles: 165, truck: '101', driver: 'Driver A', status: 'transit', bol: true, liftgate: true },
  { id: 'ld2', ref: 'CWN-1042', customer: 'River City Building Supply', origin: P.richmond, destination: P.fredericksburg, pickup: d(0, 13), delivery: d(0, 16), pallets: 5, weight: 6100, commodity: 'Doors & millwork', rate: 395, miles: 62, truck: '102', driver: 'Driver B', status: 'dispatched', bol: true },
  { id: 'ld3', ref: 'CWN-1043', customer: 'Tidewater Beverage (broker)', origin: P.ashland, destination: P.norfolk, pickup: d(1, 6), delivery: d(1, 11), pallets: 10, weight: 9800, commodity: 'Bottled beverage', rate: 780, miles: 108, truck: '101', driver: 'Driver A', status: 'booked' },
  { id: 'ld4', ref: 'CWN-1044', customer: 'Petersburg Machine Works', origin: P.petersburg, destination: P.dc, pickup: d(1, 9), delivery: d(1, 13), pallets: 2, weight: 1800, commodity: 'Machine parts (expedited)', rate: 720, miles: 135, status: 'booked' },
  { id: 'ld5', ref: 'Q-2207', customer: 'Henrico Office Interiors', origin: P.henrico, destination: P.charlottesville, pickup: d(3, 8), delivery: d(3, 12), pallets: 6, weight: 4300, commodity: 'Office furniture', rate: 560, miles: 75, status: 'quoted', liftgate: true },
  { id: 'ld6', ref: 'Q-2208', customer: 'Colonial Medical Supply', origin: P.colonialHeights, destination: P.durham, pickup: d(4, 7), delivery: d(4, 12), pallets: 7, weight: 5200, commodity: 'Medical supplies (non-hazmat)', rate: 690, miles: 160, status: 'quoted' },
  { id: 'ld7', ref: 'CWN-1038', customer: 'Atlantic Fixture Supply', origin: P.chesterfield, destination: P.greensboro, pickup: d(-2, 7), delivery: d(-2, 13), pallets: 9, weight: 8800, commodity: 'Store fixtures', rate: 610, miles: 190, truck: '102', driver: 'Driver B', status: 'delivered', bol: true, pod: true },
  { id: 'ld12', ref: 'CWN-1040', customer: 'River City Building Supply', origin: P.richmond, destination: P.charlottesville, pickup: d(-1, 7), delivery: d(-1, 11), pallets: 7, weight: 7600, commodity: 'Windows & doors', rate: 520, miles: 78, truck: '101', driver: 'Driver A', status: 'delivered', bol: true, pod: true, liftgate: true },
  { id: 'ld13', ref: 'CWN-1039', customer: 'Colonial Medical Supply', origin: P.colonialHeights, destination: P.dc, pickup: d(-3, 6), delivery: d(-3, 10), pallets: 6, weight: 4800, commodity: 'Medical supplies (non-hazmat)', rate: 690, miles: 140, truck: '102', driver: 'Driver C', status: 'invoiced', bol: true, pod: true },
  { id: 'ld14', ref: 'CWN-1037', customer: 'Atlantic Fixture Supply', origin: P.chesterfield, destination: P.norfolk, pickup: d(-4, 7), delivery: d(-4, 11), pallets: 9, weight: 8700, commodity: 'Store fixtures', rate: 560, miles: 100, truck: '101', driver: 'Driver A', status: 'paid', bol: true, pod: true },
  { id: 'ld15', ref: 'CWN-1036', customer: 'Tidewater Beverage (broker)', origin: P.ashland, destination: P.norfolk, pickup: d(-6, 6), delivery: d(-6, 11), pallets: 10, weight: 9800, commodity: 'Bottled beverage', rate: 780, miles: 108, truck: '102', driver: 'Driver B', status: 'paid', bol: true, pod: true },
  { id: 'ld16', ref: 'CWN-1034', customer: 'Henrico Office Interiors', origin: P.henrico, destination: P.fredericksburg, pickup: d(-5, 12), delivery: d(-5, 15), pallets: 5, weight: 3900, commodity: 'Office furniture', rate: 430, miles: 60, truck: '102', driver: 'Driver C', status: 'invoiced', bol: true, pod: true, liftgate: true },
  { id: 'ld8', ref: 'CWN-1035', customer: 'River City Building Supply', origin: P.richmond, destination: P.williamsburg, pickup: d(-5, 8), delivery: d(-5, 11), pallets: 6, weight: 7000, commodity: 'Lumber & trim', rate: 410, miles: 55, truck: '101', driver: 'Driver A', status: 'invoiced', bol: true, pod: true },
  { id: 'ld9', ref: 'CWN-1031', customer: 'Tidewater Beverage (broker)', origin: P.ashland, destination: P.norfolk, pickup: d(-8, 6), delivery: d(-8, 11), pallets: 10, weight: 9800, commodity: 'Bottled beverage', rate: 780, miles: 108, truck: '102', driver: 'Driver C', status: 'invoiced', bol: true, pod: true },
  { id: 'ld10', ref: 'CWN-1027', customer: 'Henrico Office Interiors', origin: P.henrico, destination: P.richmond, pickup: d(-12, 9), delivery: d(-12, 12), pallets: 4, weight: 2900, commodity: 'Office furniture', rate: 365, miles: 18, truck: '101', driver: 'Driver A', status: 'paid', bol: true, pod: true },
  { id: 'ld11', ref: 'CWN-1024', customer: 'Atlantic Fixture Supply', origin: P.chesterfield, destination: P.raleigh, pickup: d(-15, 7), delivery: d(-15, 13), pallets: 8, weight: 9000, commodity: 'Store fixtures', rate: 640, miles: 165, truck: '102', driver: 'Driver B', status: 'paid', bol: true, pod: true },
]

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Atlantic Fixture Supply', type: 'Shipper', contact: 'Shipping desk', email: 'shipping@example.com', phone: '(804) 555-0190', city: 'Chesterfield, VA', terms: 'Net 30', loads: 14, revenue: 8840, lastLoad: d(0) },
  { id: 'c2', name: 'River City Building Supply', type: 'Shipper', contact: 'Yard manager', email: 'yard@example.com', phone: '(804) 555-0122', city: 'Richmond, VA', terms: 'Net 15', loads: 9, revenue: 3725, lastLoad: d(0) },
  { id: 'c3', name: 'Tidewater Beverage (broker)', type: 'Broker', contact: 'Carrier sales', email: 'carriers@example.com', phone: '(757) 555-0164', city: 'Norfolk, VA', terms: 'Quick pay 2%', loads: 11, revenue: 8580, lastLoad: d(1) },
  { id: 'c4', name: 'Henrico Office Interiors', type: 'Shipper', contact: 'Ops lead', email: 'ops@example.com', phone: '(804) 555-0133', city: 'Henrico, VA', terms: 'Net 30', loads: 5, revenue: 2120, lastLoad: d(-12) },
  { id: 'c6', name: 'Colonial Medical Supply', type: 'Shipper', contact: 'Warehouse lead', email: 'warehouse@example.com', phone: '(804) 555-0186', city: 'Colonial Heights, VA', terms: 'Net 30', loads: 4, revenue: 2760, lastLoad: d(-3) },
  { id: 'c5', name: 'Petersburg Machine Works', type: 'Shipper', contact: 'Plant manager', email: 'plant@example.com', phone: '(804) 555-0158', city: 'Petersburg, VA', terms: 'Net 30', loads: 1, revenue: 720, lastLoad: d(1) },
]

export const COMPLIANCE: Comp[] = [
  { id: 'k1', item: 'Auto liability (BIPD) $1,000,000', detail: 'Agency Insurance Co. of Maryland · Policy CA 0059350 · effective 07/22/2025', due: '2026-07-22', status: 'ok' },
  { id: 'k2', item: 'Cargo insurance', detail: 'Not on file. Most shippers and brokers ask for $100K', status: 'missing' },
  { id: 'k3', item: 'MCS-150 biennial update', detail: 'Last filed 01/31/2026', due: '2028-01-31', status: 'ok' },
  { id: 'k4', item: 'UCR registration', detail: 'Annual Unified Carrier Registration for the next calendar year', due: '2026-12-31', status: 'soon' },
  { id: 'k5', item: 'SAM.gov entity registration', detail: 'Required for federal bids (UEI + CAGE)', status: 'action' },
  { id: 'k6', item: 'Virginia eVA vendor registration', detail: 'Required for state and local bids', status: 'action' },
  { id: 'k7', item: 'SWaM certification (VA SBSD)', detail: 'Unlocks Virginia small-business set-asides', status: 'action' },
  { id: 'k8', item: 'Drug & alcohol consortium', detail: 'Confirm enrollment (required if any driver becomes CDL)', status: 'action' },
  { id: 'k9', item: 'Annual vehicle inspections', detail: 'Units 101 & 102', due: '2027-02-15', status: 'ok' },
]

export const ACTIVITY: Activity[] = [
  { id: 'a1', at: d(0, 7), who: 'Driver A', text: 'Picked up CWN-1041 at Chesterfield, 8 pallets, BOL uploaded', kind: 'load' },
  { id: 'a2', at: d(0, 6), who: 'Company Brain', text: 'Morning sweep: 19 opportunities scored, 6 rated Go', kind: 'brain' },
  { id: 'a3', at: d(-1, 16), who: 'Lawrence', text: 'Booked CWN-1043 Ashland → Norfolk, $780', kind: 'load' },
  { id: 'a4', at: d(-1, 11), who: 'Company Brain', text: 'Flagged: Chesterfield County relocation IFB due in 9 days', kind: 'bid' },
  { id: 'a5', at: d(-2, 15), who: 'Driver B', text: 'Delivered CWN-1038 Greensboro, POD signed', kind: 'load' },
  { id: 'a6', at: d(-3, 9), who: 'System', text: 'Payment received: CWN-1024 $640 from Atlantic Fixture Supply', kind: 'money' },
]
