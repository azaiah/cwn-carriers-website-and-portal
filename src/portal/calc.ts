import type { Load } from './data'
import type { Brain } from '../brain/types'

const inDays = (iso: string, from: number, to: number) => { const t = new Date(iso).getTime(), now = Date.now(); return t >= now + from * 86400000 && t <= now + to * 86400000 }

export function loadStats(loads: Load[], b: Brain) {
  const earned = loads.filter(l => ['delivered', 'invoiced', 'paid'].includes(l.status))
  const week = earned.filter(l => inDays(l.delivery, -7, 0.5))
  const month = earned.filter(l => inDays(l.delivery, -30, 0.5))
  const receivable = loads.filter(l => l.status === 'invoiced' || l.status === 'delivered')
  const moving = loads.filter(l => ['dispatched', 'transit'].includes(l.status))
  const booked = loads.filter(l => l.status === 'booked')
  const quoted = loads.filter(l => l.status === 'quoted')
  const sum = (xs: Load[]) => xs.reduce((a, l) => a + l.rate, 0)
  const milesSum = (xs: Load[]) => xs.reduce((a, l) => a + l.miles, 0)
  const monthMiles = milesSum(month)
  const rpm = monthMiles ? sum(month) / monthMiles : 0
  const activeTrucks = b.fleet.filter(t => t.status === 'active').length || 1
  return {
    weekRevenue: sum(week), monthRevenue: sum(month), receivable: sum(receivable), receivableCount: receivable.length,
    moving, booked, quoted, pipelineValue: sum(booked) + sum(quoted), rpm, monthMiles,
    monthCost: monthMiles * b.money.costPerMile, monthMargin: sum(month) - monthMiles * b.money.costPerMile,
    weeklyTarget: b.money.weeklyTargetPerTruck * activeTrucks, activeTrucks,
  }
}

/** Truck #3 break-even: how many loaded miles / loads a week the new truck needs to pay for itself. */
export function truckThree(input: { payment: number; insurance: number; driverPayPerMile: number; fuelPerMile: number; maintPerMile: number; ratePerMile: number; weeklyMiles: number }) {
  const fixedWeekly = (input.payment + input.insurance) * 12 / 52
  const varPerMile = input.driverPayPerMile + input.fuelPerMile + input.maintPerMile
  const contribPerMile = input.ratePerMile - varPerMile
  const breakEvenMiles = contribPerMile > 0 ? fixedWeekly / contribPerMile : Infinity
  const weeklyProfit = input.weeklyMiles * contribPerMile - fixedWeekly
  return { fixedWeekly, varPerMile, contribPerMile, breakEvenMiles, weeklyProfit, annualProfit: weeklyProfit * 50, paybackOk: weeklyProfit > 0 }
}
