import { afterEach, describe, expect, it, vi } from 'vitest'
import { speakChinese } from './audio'

describe('speakChinese', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('can speak again after finishing and safely restarts an active utterance', () => {
    vi.useFakeTimers()
    const spoken: FakeUtterance[] = []
    const synthesis = {
      speaking: false,
      pending: false,
      paused: false,
      cancel: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn((utterance: FakeUtterance) => spoken.push(utterance)),
      getVoices: vi.fn(() => []),
    }

    class FakeUtterance {
      lang = ''
      rate = 1
      pitch = 1
      voice = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(public text: string) {}
    }

    vi.stubGlobal('window', {
      speechSynthesis: synthesis,
      setTimeout,
      clearTimeout,
    })
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)

    expect(speakChinese('你好')).toBe(true)
    expect(spoken).toHaveLength(1)
    spoken[0].onend?.()

    expect(speakChinese('再见')).toBe(true)
    expect(spoken).toHaveLength(2)

    synthesis.speaking = true
    expect(speakChinese('谢谢')).toBe(true)
    expect(synthesis.cancel).toHaveBeenCalledOnce()
    expect(spoken).toHaveLength(2)
    vi.advanceTimersByTime(100)
    expect(spoken).toHaveLength(3)
    expect(spoken[2].text).toBe('谢谢')
  })
})
