export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Agro Recommender API',
    version: '1.0.0',
    description: 'API para recomendação de culturas agrícolas a partir de temperatura, umidade e tipo de solo.'
  },
  servers: [{ url: '/v1', description: 'v1 base path' }],
  components: {
    schemas: {
      Input: {
        type: 'object',
        required: ['temperatura', 'umidade', 'tipoSolo'],
        properties: {
          temperatura: { type: 'number', example: 24 },
          umidade: { type: 'number', minimum: 0, maximum: 100, example: 65 },
          tipoSolo: { type: 'string', enum: ['arenoso','argiloso','franco','siltoso','turfoso','calcario'], example: 'franco' }
        }
      },
      Recommendation: {
        type: 'object',
        properties: {
          cultura: { type: 'string', example: 'Milho' },
          score: { type: 'integer', example: 87 },
          explicacao: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/recommendations': {
      post: {
        summary: 'Recomenda a melhor cultura (top 1)',
        tags: ['Recomendações'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Input' } } }
        },
        responses: {
          200: {
            description: 'Cultura recomendada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    culturaRecomendada: { type: 'string', example: 'Milho' },
                    score: { type: 'integer', example: 87 },
                    explicacao: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/recommendations/ranked': {
      post: {
        summary: 'Lista ranqueada de culturas',
        tags: ['Recomendações'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Input' },
                  {
                    type: 'object',
                    properties: {
                      k: { type: 'integer', default: 5 },
                      incluirExplicacao: { type: 'boolean', default: false }
                    }
                  }
                ]
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Lista ranqueada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recomendacoes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Recommendation' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/recommendations/explain': {
      post: {
        summary: 'Explica a pontuação para uma cultura específica',
        tags: ['Recomendações'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['temperatura','umidade','tipoSolo','cultura'],
                properties: {
                  temperatura: { type: 'number' },
                  umidade: { type: 'number', minimum: 0, maximum: 100 },
                  tipoSolo: { type: 'string', enum: ['arenoso','argiloso','franco','siltoso','turfoso','calcario'] },
                  cultura: { type: 'string', example: 'milho' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Explicação da pontuação',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    score: { type: 'integer' },
                    explicacao: { type: 'string' }
                  }
                }
              }
            }
          },
          404: { description: 'Cultura não encontrada' }
        }
      }
    },
    '/crops': {
      get: {
        summary: 'Lista metadados de culturas suportadas',
        tags: ['Metadados'],
        responses: {
          200: { description: 'OK' }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Metadados'],
        responses: { 200: { description: 'OK' } }
      }
    }
  }
} as const