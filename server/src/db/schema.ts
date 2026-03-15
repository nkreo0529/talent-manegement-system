import { pgTable, text, timestamp, boolean, uuid, jsonb, pgEnum, varchar, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'member'])
export const jobTypeEnum = pgEnum('job_type', [
  'engineer',
  'designer',
  'product_manager',
  'sales',
  'marketing',
  'hr',
  'finance',
  'operations',
  'other',
])
export const evaluationGradeEnum = pgEnum('evaluation_grade', ['S', 'A', 'B', 'C', 'D'])
export const moodRatingEnum = pgEnum('mood_rating', ['1', '2', '3', '4', '5'])

// Teams table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  managerId: uuid('manager_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Employees table
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id'),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  nameKana: text('name_kana'),
  avatarUrl: text('avatar_url'),
  teamId: uuid('team_id').references(() => teams.id),
  jobTitle: text('job_title'),
  jobType: jobTypeEnum('job_type'),
  role: userRoleEnum('role').default('member').notNull(),
  hireDate: text('hire_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Strengths table (ストレングスファインダー結果)
export const strengths = pgTable('strengths', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  strengthsOrder: text('strengths_order').array().notNull(), // 34資質の順序
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// SPI Results table
export const spiResults = pgTable('spi_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  personalityTraits: jsonb('personality_traits').notNull(), // SpiPersonalityTraits
  workStyle: jsonb('work_style').notNull(), // SpiWorkStyle
  aptitudeScores: jsonb('aptitude_scores').notNull(), // SpiAptitudeScores
  testDate: text('test_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Careers table
export const careers = pgTable('careers', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  position: text('position').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  description: text('description'),
  isCurrent: boolean('is_current').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Evaluations table
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  evaluatorId: uuid('evaluator_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'restrict' }),
  period: text('period').notNull(), // e.g., "2024H1"
  overallGrade: evaluationGradeEnum('overall_grade').notNull(),
  strengthsComment: text('strengths_comment'),
  improvementsComment: text('improvements_comment'),
  goals: text('goals'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// One-on-One Notes table
export const oneOnOneNotes = pgTable('one_on_one_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  managerId: uuid('manager_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'restrict' }),
  meetingDate: text('meeting_date').notNull(),
  topics: text('topics').array().default([]),
  notes: text('notes'),
  actionItems: text('action_items').array().default([]),
  mood: moodRatingEnum('mood'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// AI Profiles table
export const aiProfiles = pgTable('ai_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  profileSummary: text('profile_summary').notNull(),
  workStyleAnalysis: text('work_style_analysis').notNull(),
  collaborationTips: text('collaboration_tips').notNull(),
  developmentSuggestions: text('development_suggestions').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  modelVersion: text('model_version').default('claude-3-opus').notNull(),
})

// AI Team Analysis table
export const aiTeamAnalysis = pgTable('ai_team_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  teamDynamics: text('team_dynamics').notNull(),
  strengthsDistribution: text('strengths_distribution').notNull(),
  potentialChallenges: text('potential_challenges').notNull(),
  recommendations: text('recommendations').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  modelVersion: text('model_version').default('claude-3-opus').notNull(),
})

// Relations
export const teamsRelations = relations(teams, ({ one, many }) => ({
  manager: one(employees, {
    fields: [teams.managerId],
    references: [employees.id],
  }),
  members: many(employees),
  aiAnalysis: many(aiTeamAnalysis),
}))

export const employeesRelations = relations(employees, ({ one, many }) => ({
  team: one(teams, {
    fields: [employees.teamId],
    references: [teams.id],
  }),
  strengths: one(strengths),
  spiResults: one(spiResults),
  aiProfile: one(aiProfiles),
  careers: many(careers),
  evaluations: many(evaluations),
  oneOnOneNotes: many(oneOnOneNotes),
}))

export const strengthsRelations = relations(strengths, ({ one }) => ({
  employee: one(employees, {
    fields: [strengths.employeeId],
    references: [employees.id],
  }),
}))

export const spiResultsRelations = relations(spiResults, ({ one }) => ({
  employee: one(employees, {
    fields: [spiResults.employeeId],
    references: [employees.id],
  }),
}))

export const careersRelations = relations(careers, ({ one }) => ({
  employee: one(employees, {
    fields: [careers.employeeId],
    references: [employees.id],
  }),
}))

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  employee: one(employees, {
    fields: [evaluations.employeeId],
    references: [employees.id],
  }),
  evaluator: one(employees, {
    fields: [evaluations.evaluatorId],
    references: [employees.id],
  }),
}))

export const oneOnOneNotesRelations = relations(oneOnOneNotes, ({ one }) => ({
  employee: one(employees, {
    fields: [oneOnOneNotes.employeeId],
    references: [employees.id],
  }),
  manager: one(employees, {
    fields: [oneOnOneNotes.managerId],
    references: [employees.id],
  }),
}))

export const aiProfilesRelations = relations(aiProfiles, ({ one }) => ({
  employee: one(employees, {
    fields: [aiProfiles.employeeId],
    references: [employees.id],
  }),
}))

export const aiTeamAnalysisRelations = relations(aiTeamAnalysis, ({ one }) => ({
  team: one(teams, {
    fields: [aiTeamAnalysis.teamId],
    references: [teams.id],
  }),
}))
