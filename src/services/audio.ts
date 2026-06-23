export type SpeechOptions = {
  enabled?: boolean
  rate?: number
  voiceURI?: string
}

let activeUtterance: SpeechSynthesisUtterance | null = null
let pendingStart: number | null = null
let speechRequestId = 0

export function getChineseVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('zh'))
}

export function speakChinese(text: string, options: SpeechOptions = {}): boolean {
  if (options.enabled === false || !('speechSynthesis' in window)) return false
  const synthesis = window.speechSynthesis
  const requestId = ++speechRequestId

  if (pendingStart !== null) {
    window.clearTimeout(pendingStart)
    pendingStart = null
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = options.rate ?? 0.7
  utterance.pitch = 0.96
  const voices = getChineseVoices()
  utterance.voice = voices.find((voice) => voice.voiceURI === options.voiceURI)
    ?? voices.find((voice) => /Tingting|Xiaoxiao|Mandarin|普通话/i.test(voice.name))
    ?? voices.find((voice) => voice.lang.toLowerCase() === 'zh-cn')
    ?? voices[0]
    ?? null

  const release = () => {
    if (speechRequestId === requestId) activeUtterance = null
  }
  utterance.onend = release
  utterance.onerror = release

  const start = () => {
    pendingStart = null
    if (speechRequestId !== requestId) return
    activeUtterance = utterance
    synthesis.resume()
    synthesis.speak(utterance)

    // WebKit can leave speechSynthesis paused after a cancelled utterance.
    window.setTimeout(() => {
      if (speechRequestId === requestId && synthesis.paused) synthesis.resume()
    }, 160)
  }

  if (synthesis.speaking || synthesis.pending || activeUtterance) {
    synthesis.cancel()
    // Safari/macOS needs a short gap before the next utterance is queued.
    pendingStart = window.setTimeout(start, 90)
  } else {
    start()
  }
  return true
}
