import { describe, expect, it } from 'vitest'
import { exportResumeConfig, importResumeConfig } from '../engine/serializer'
import { defaultResumeData } from '../store/defaultData'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('serializer', () => {
  it('rejects empty input', () => {
    expect(() => importResumeConfig('   ')).toThrow(/empty/i)
  })

  it('rejects malformed json and yaml', () => {
    expect(() => importResumeConfig('{"version":')).toThrow(/Failed to parse JSON/)
    expect(() => importResumeConfig('version: 1\nmeta: [')).toThrow(/Failed to parse YAML/)
  })

  it('rejects oversized input payloads', () => {
    expect(() => importResumeConfig('a'.repeat(500_001))).toThrow(/too large/i)
  })

  it('rejects invalid priority and missing required fields', () => {
    const invalidPriority = clone(defaultResumeData)
    invalidPriority.target_lines[0].vectors.backend = 'critical' as never
    expect(() => importResumeConfig(JSON.stringify(invalidPriority))).toThrow(/must, strong, optional, exclude/)

    const missingName = clone(defaultResumeData) as unknown as Record<string, unknown>
    delete (missingName.meta as Record<string, unknown>).name
    expect(() => importResumeConfig(JSON.stringify(missingName))).toThrow(/meta.name/)
  })

  it('rejects missing required top-level arrays', () => {
    const missingRoles = clone(defaultResumeData) as unknown as Record<string, unknown>
    delete missingRoles.roles
    expect(() => importResumeConfig(JSON.stringify(missingRoles))).toThrow(/roles must be an array/)
  })

  it('rejects invalid version types and NaN', () => {
    const invalidVersion = clone(defaultResumeData) as unknown as Record<string, unknown>
    invalidVersion.version = '1'
    expect(() => importResumeConfig(JSON.stringify(invalidVersion))).toThrow(/version must be a number/)

    const nanVersion = `version: .nan
meta:
  name: Jane
  email: jane@example.com
  phone: '555'
  location: SF
  links: []
vectors: []
target_lines: []
profiles: []
skill_groups: []
roles: []
projects: []
education: []
`
    expect(() => importResumeConfig(nanVersion)).toThrow(/version must be a number/)
  })

  it('round-trips yaml and json exports', () => {
    const source = clone(defaultResumeData)

    const yaml = exportResumeConfig(source)
    const fromYaml = importResumeConfig(yaml)
    expect(fromYaml.format).toBe('yaml')
    expect(fromYaml.data).toEqual(source)

    const json = exportResumeConfig(source, 'json')
    const fromJson = importResumeConfig(json)
    expect(fromJson.format).toBe('json')
    expect(fromJson.data).toEqual(source)
  })

  it('supports explicit import format hints', () => {
    const source = clone(defaultResumeData)
    const yaml = exportResumeConfig(source, 'yaml')

    const parsedYaml = importResumeConfig(yaml, 'yaml')
    expect(parsedYaml.format).toBe('yaml')
    expect(parsedYaml.data).toEqual(source)
    expect(() => importResumeConfig(yaml, 'json')).toThrow(/Failed to parse JSON/)
  })

  it('rejects forbidden object keys in imported data', () => {
    const source = exportResumeConfig(clone(defaultResumeData), 'json')
    const withProto = source.replace('{', '{"__proto__":{"polluted":true},')
    expect(() => importResumeConfig(withProto, 'json')).toThrow(/unsupported key/i)
  })

  it('rejects YAML tags outside the JSON schema', () => {
    const tagged = `version: 1
meta: !!js/function >
  function () { return "not-allowed"; }
vectors: []
target_lines: []
profiles: []
skill_groups: []
roles: []
projects: []
education: []
`

    expect(() => importResumeConfig(tagged)).toThrow(/Failed to parse YAML/)
  })
})
