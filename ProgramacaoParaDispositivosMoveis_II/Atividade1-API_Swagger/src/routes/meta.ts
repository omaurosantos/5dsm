import { Router } from 'express'
import { CROPS, SOILS } from '../model/crops'


const router = Router()

router.get('/crops', (_req, res) => {
res.json({
total: CROPS.length,
items: CROPS.map(c => ({ id: c.id, nome: c.nome, intervalos: { temperatura: c.temp, umidade: c.umidade }, solos: c.solos }))
})
})

router.get('/health', (_req, res) => {
res.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' })
})


export default router