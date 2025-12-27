import { z } from 'zod';
import { 
  insertLeagueSchema, 
  insertCompetitionSchema, 
  insertRaceSchema, 
  insertResultSchema,
  insertProfileSchema,
  insertTeamSchema,
  leagues, competitions, races, results, profiles, teams 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/profiles/me',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    }
  },
  leagues: {
    list: {
      method: 'GET' as const,
      path: '/api/leagues',
      responses: {
        200: z.array(z.custom<typeof leagues.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/leagues',
      input: insertLeagueSchema,
      responses: {
        201: z.custom<typeof leagues.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/leagues/:id',
      responses: {
        200: z.custom<typeof leagues.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  competitions: {
    list: {
      method: 'GET' as const,
      path: '/api/leagues/:id/competitions',
      responses: {
        200: z.array(z.custom<typeof competitions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/competitions',
      input: insertCompetitionSchema,
      responses: {
        201: z.custom<typeof competitions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  races: {
    list: {
      method: 'GET' as const,
      path: '/api/competitions/:id/races',
      responses: {
        200: z.array(z.custom<typeof races.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/races',
      input: insertRaceSchema,
      responses: {
        201: z.custom<typeof races.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/races/:id',
      responses: {
        200: z.custom<typeof races.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  results: {
    list: {
      method: 'GET' as const,
      path: '/api/races/:id/results',
      responses: {
        200: z.array(z.custom<typeof results.$inferSelect>()),
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/races/:id/results',
      input: z.array(insertResultSchema.omit({ raceId: true })),
      responses: {
        201: z.array(z.custom<typeof results.$inferSelect>()),
      },
    }
  },
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams',
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teams',
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
