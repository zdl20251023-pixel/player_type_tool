import { record } from '../analysis/strategy'
import { text } from '../profiles/catalog'
import { fromFixture, type ScenarioFixture } from './index'
import { validateScenario } from './validate'

export function validFixtures(value: unknown, expectedCount?: number): ScenarioFixture[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 100 ||
    (expectedCount !== undefined && value.length !== expectedCount)
  ) {
    throw new Error('场景数量必须为 1..100，且与指定数量一致')
  }
  const ids = new Set<string>()
  const routes = new Set<string>()
  return (value as unknown[]).map((item) => {
    const obj = record(item)
    const id = text(obj.id, '场景 ID', 40)
    if (!/^[A-Za-z0-9-]+$/.test(id) || ids.has(id)) {
      throw new Error('场景 ID 非法或重复')
    }
    ids.add(id)
    if (!Number.isInteger(obj.hero) || Number(obj.hero) < 0 || Number(obj.hero) > 5) {
      throw new Error(`${id}: Hero 必须为 0..5`)
    }
    if (!['preflop', 'flop', 'turn', 'river'].includes(String(obj.street))) {
      throw new Error(`${id}: 街道无效`)
    }
    if (typeof obj.line !== 'string' || obj.line.length > 4000) {
      throw new Error(`${id}: 行动线无效`)
    }
    const fixture: ScenarioFixture = {
      id,
      hero: Number(obj.hero),
      cards: text(obj.cards, '底牌', 4),
      street: obj.street as ScenarioFixture['street'],
      line: obj.line.trim(),
      description: text(obj.description, '设计目的', 500),
      category: text(obj.category, '场景类型', 100),
      history: text(obj.history, '路线说明', 2000),
    }
    const key = JSON.stringify([fixture.hero, fixture.cards, fixture.line])
    if (routes.has(key)) {
      throw new Error(`${id}: 重复场景路线`)
    }
    routes.add(key)
    validateScenario(fromFixture(fixture))
    return fixture
  })
}
