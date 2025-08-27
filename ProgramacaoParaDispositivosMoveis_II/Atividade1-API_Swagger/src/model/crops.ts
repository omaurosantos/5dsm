import { Crop, SoilType } from '../types'


// ⚠️ Intervalos são aproximados e servem como defaults; ajuste conforme sua região/dados.
export const CROPS: Crop[] = [
{ id: 'milho', nome: 'Milho', temp: { min: 18, max: 27 }, umidade: { min: 50, max: 70 }, solos: ['franco', 'argiloso', 'arenoso'] },
{ id: 'soja', nome: 'Soja', temp: { min: 20, max: 30 }, umidade: { min: 50, max: 70 }, solos: ['franco', 'argiloso'] },
{ id: 'trigo', nome: 'Trigo', temp: { min: 10, max: 25 }, umidade: { min: 40, max: 60 }, solos: ['argiloso', 'franco', 'siltoso'] },
{ id: 'arroz', nome: 'Arroz', temp: { min: 20, max: 35 }, umidade: { min: 70, max: 90 }, solos: ['argiloso', 'siltoso'] },
{ id: 'cafe', nome: 'Café', temp: { min: 18, max: 23 }, umidade: { min: 60, max: 80 }, solos: ['franco', 'argiloso'] },
{ id: 'cana', nome: 'Cana-de-açúcar', temp: { min: 20, max: 30 }, umidade: { min: 60, max: 80 }, solos: ['argiloso', 'franco'] },
{ id: 'algodao', nome: 'Algodão', temp: { min: 21, max: 30 }, umidade: { min: 40, max: 60 }, solos: ['arenoso', 'franco'] },
{ id: 'feijao', nome: 'Feijão', temp: { min: 18, max: 28 }, umidade: { min: 50, max: 70 }, solos: ['franco', 'argiloso'] },
{ id: 'cacau', nome: 'Cacau', temp: { min: 21, max: 32 }, umidade: { min: 70, max: 90 }, solos: ['argiloso', 'turfoso'] },
]


export const SOILS: SoilType[] = ['arenoso', 'argiloso', 'franco', 'siltoso', 'turfoso', 'calcario']