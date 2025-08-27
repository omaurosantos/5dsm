import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'


export const validateBody = (schema: ZodSchema) =>
(req: Request, res: Response, next: NextFunction) => {
const parse = schema.safeParse(req.body)
if (!parse.success) {
return res.status(400).json({
message: 'Erro de validação',
issues: parse.error.issues
})
}
// substitui body pelo parsed tipado
req.body = parse.data
next()
}