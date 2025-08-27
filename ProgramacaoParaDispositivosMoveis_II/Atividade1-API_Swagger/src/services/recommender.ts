import { CROPS } from '../model/crops'
import type { Crop, Input, Range as ValueRange } from '../types'

// e use ValueRange localmente:
const span = (r: ValueRange) => Math.max(1, r.max - r.min)

function rangePenalty(value: number, ideal: ValueRange): number {
// Retorna penalidade normalizada [0, 1]
if (value >= ideal.min && value <= ideal.max) return 0
if (value < ideal.min) return (ideal.min - value) / span(ideal)
return (value - ideal.max) / span(ideal)
}


function scoreCrop(input: Input, crop: Crop) {
// Solo incompatível desclassifica
if (!crop.solos.includes(input.tipoSolo)) {
return { score: 0, disqualified: true, details: { tempPen: 1, humPen: 1, soil: 'incompatível' } }
}
const tempPen = rangePenalty(input.temperatura, crop.temp)
const humPen = rangePenalty(input.umidade, crop.umidade)


// pesos
const wTemp = 0.6
const wHum = 0.4


const penalty = wTemp * tempPen + wHum * humPen // [0..1]
const score = Math.max(0, Math.round((1 - penalty) * 100))


return {
score,
disqualified: false,
details: {
tempPen,
humPen,
soil: 'ok'
}
}
}


export interface RecommendationResult {
cultura: string
score: number
explicacao: string
}


export function recommend(input: Input): RecommendationResult[] {
const ranked = CROPS.map((c) => {
const s = scoreCrop(input, c)
const explicacao = s.disqualified
? `Solo incompatível com ${c.nome}.`
: `Temperatura: penalidade ${s.details.tempPen.toFixed(2)}; Umidade: penalidade ${s.details.humPen.toFixed(2)}; Solo: ${s.details.soil}.`


return { crop: c, score: s.score, disqualified: s.disqualified, explicacao }
})
.filter(r => !r.disqualified)
.sort((a, b) => b.score - a.score)


return ranked.map(r => ({ cultura: r.crop.nome, score: r.score, explicacao: r.explicacao }))
}


export function explainFor(input: Input, culturaIdOuNome: string) {
const target = CROPS.find(c => c.id === culturaIdOuNome || c.nome.toLowerCase() === culturaIdOuNome.toLowerCase())
if (!target) return { found: false as const, message: 'Cultura não encontrada' }
const { score, disqualified, details } = scoreCrop(input, target)
if (disqualified) return { found: true as const, explicacao: `Solo incompatível com ${target.nome}.`, score }
return {
found: true as const,
score,
explicacao: `Para ${target.nome}: temperatura ideal ${target.temp.min}–${target.temp.max}°C (penalidade ${details.tempPen.toFixed(2)}), umidade ideal ${target.umidade.min}–${target.umidade.max}% (penalidade ${details.humPen.toFixed(2)}), solo compatível.`
}
}