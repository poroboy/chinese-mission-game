export function speakChinese(text: string, enabled = true): boolean {
  if (!enabled || !('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.82
  const voices = window.speechSynthesis.getVoices()
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith('zh')) ?? null
  window.speechSynthesis.speak(utterance)
  return true
}
