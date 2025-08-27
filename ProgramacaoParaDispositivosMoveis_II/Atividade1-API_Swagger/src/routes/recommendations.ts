import { Router } from 'express'
import { z } from 'zod'
import { validateBody } from '../middleware/validate'
import { recommend, explainFor } from '../services/recommender'

const router = Router()

const InputSchema = z.object({
  temperatura: z.number(),
  umidade: z.number().min(0).max(100),
  tipoSolo: z.enum(['arenoso','argiloso','franco','siltoso','turfoso','calcario'])
})
type Input = z.infer<typeof InputSchema>

// POST /v1/recommendations - Top 1
router.post('/recommendations', validateBody(InputSchema), (req, res) => {
  const input = req.body as Input
  const ranked = recommend(input)
  if (ranked.length === 0) {
    return res.status(200).json({
      culturaRecomendada: null,
      score: 0,
      explicacao: 'Nenhuma cultura compatível com o tipo de solo informado.'
    })
  }
  const top = ranked[0]
  res.json({ culturaRecomendada: top.cultura, score: top.score, explicacao: top.explicacao })
})

// POST /v1/recommendations/ranked - Lista ranqueada
const RankedSchema = InputSchema.extend({
  k: z.number().min(1).max(20).optional(),
  incluirExplicacao: z.boolean().optional()
})
router.post('/recommendations/ranked', validateBody(RankedSchema), (req, res) => {
  const { k = 5, incluirExplicacao = false, ...input } = req.body as z.infer<typeof RankedSchema>
  const ranked = recommend(input as Input).slice(0, k)
  res.json({
    recomendacoes: incluirExplicacao ? ranked : ranked.map(r => ({ cultura: r.cultura, score: r.score }))
  })
})

// POST /v1/recommendations/explain - Explica pontuação
const ExplainSchema = InputSchema.extend({ cultura: z.string() })
router.post('/recommendations/explain', validateBody(ExplainSchema), (req, res) => {
  const { cultura, ...input } = req.body as z.infer<typeof ExplainSchema>
  const result = explainFor(input as Input, cultura)
  if (!result.found) return res.status(404).json({ message: 'Cultura não encontrada' })
  res.json({ score: result.score, explicacao: result.explicacao })
})

export default router
