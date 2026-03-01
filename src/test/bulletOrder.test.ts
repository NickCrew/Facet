import { describe, expect, it } from 'vitest'
import { hasCustomVectorOrder, resolveEffectiveBulletOrders } from '../utils/bulletOrder'

describe('bulletOrder utils', () => {
  it('uses default order as fallback when a vector does not define one', () => {
    const orders = {
      all: {
        roleA: ['b1', 'b2'],
      },
      backend: {
        roleB: ['b3', 'b4'],
      },
    }

    expect(resolveEffectiveBulletOrders(orders, 'backend')).toEqual({
      roleA: ['b1', 'b2'],
      roleB: ['b3', 'b4'],
    })
  })

  it('detects custom vector ordering relative to default', () => {
    const orders = {
      all: {
        roleA: ['b1', 'b2'],
      },
      backend: {
        roleA: ['b2', 'b1'],
      },
    }

    expect(hasCustomVectorOrder('backend', 'roleA', orders)).toBe(true)
    expect(hasCustomVectorOrder('backend', 'roleB', orders)).toBe(false)
    expect(hasCustomVectorOrder('all', 'roleA', orders)).toBe(false)
  })
})
