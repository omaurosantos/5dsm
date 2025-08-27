export type SoilType =
| 'arenoso'
| 'argiloso'
| 'franco'
| 'siltoso'
| 'turfoso'
| 'calcario'
;


export interface Range { min: number; max: number }


export interface Crop {
id: string
nome: string
temp: Range
umidade: Range
solos: SoilType[]
notas?: string
}


export interface Input {
temperatura: number
umidade: number
tipoSolo: SoilType
}