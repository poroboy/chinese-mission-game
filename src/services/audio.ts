export type SpeechOptions = {
  enabled?: boolean
  rate?: number
  voiceURI?: string
}

export function getChineseVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('zh'))
}

export function speakChinese(text: string, options: SpeechOptions = {}): boolean {
  if (options.enabled === false || !('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
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
  window.speechSynthesis.speak(utterance)
  return true
}
