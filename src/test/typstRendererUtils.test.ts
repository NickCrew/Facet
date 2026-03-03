import { describe, expect, it } from 'vitest'
import { isVariableFont, toPdfPageCount } from '../utils/typstRendererUtils'

describe('typstRendererUtils', () => {
  describe('toPdfPageCount', () => {
    it('counts pages in a mock PDF buffer', () => {
      const pdfContent = '%PDF-1.7\n1 0 obj\n<< /Type /Page >>\nendobj\n2 0 obj\n<< /Type /Page >>\nendobj\n%%EOF'
      const bytes = new TextEncoder().encode(pdfContent)
      expect(toPdfPageCount(bytes)).toBe(2)
    })

    it('defaults to 1 if no pages found', () => {
      const bytes = new Uint8Array([1, 2, 3])
      expect(toPdfPageCount(bytes)).toBe(1)
    })
  })

  describe('isVariableFont', () => {
    it('returns false for empty or small buffers', () => {
      expect(isVariableFont(new Uint8Array([]))).toBe(false)
      expect(isVariableFont(new Uint8Array([1, 2, 3]))).toBe(false)
    })

    it('identifies variable fonts by fvar table tag', () => {
      // Create a mock OpenType header with 1 table
      const buffer = new ArrayBuffer(32)
      const view = new DataView(buffer)
      
      // sfntVersion (0x00010000 for TrueType)
      view.setUint32(0, 0x00010000)
      // numTables = 1
      view.setUint16(4, 1)
      
      // Table record at offset 12
      // tag 'fvar'
      view.setUint8(12, 'f'.charCodeAt(0))
      view.setUint8(13, 'v'.charCodeAt(0))
      view.setUint8(14, 'a'.charCodeAt(0))
      view.setUint8(15, 'r'.charCodeAt(0))
      
      expect(isVariableFont(new Uint8Array(buffer))).toBe(true)
    })

    it('returns false if fvar tag is missing', () => {
      const buffer = new ArrayBuffer(32)
      const view = new DataView(buffer)
      view.setUint16(4, 1)
      view.setUint8(12, 'h'.charCodeAt(0)) // tag 'head'
      view.setUint8(13, 'e'.charCodeAt(0))
      view.setUint8(14, 'a'.charCodeAt(0))
      view.setUint8(15, 'd'.charCodeAt(0))
      
      expect(isVariableFont(new Uint8Array(buffer))).toBe(false)
    })
  })
})
