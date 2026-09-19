import { pgTable, index, unique, pgPolicy, text, boolean, timestamp, foreignKey, jsonb, uuid, integer, numeric, check, serial, bigint, pgSchema } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const authSchema = pgSchema("auth");
export const usersInAuth = authSchema.table("users", {
	id: uuid("id").primaryKey().notNull(),
	email: text("email"),
	rawUserMetaData: jsonb("raw_user_meta_data"),
	createdAt: timestamp("created_at"),
});



export const pages = pgTable("pages", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	content: text().notNull(),
	pageType: text("page_type").default('custom'),
	isDeleted: boolean("is_deleted").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
}, (table) => [
	index("idx_pages_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("pages_slug_key").on(table.slug),
	pgPolicy("Public read pages", { as: "permissive", for: "select", to: ["public"], using: sql`(is_deleted = false)` }),
	pgPolicy("Admins full management pages", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass pages", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const subscriptions = pgTable("subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	planId: text("plan_id"),
	status: text().default('active'),
	currentPeriodEnd: text("current_period_end"),
	autoRenew: boolean("auto_renew").default(true),
	currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	gateway: text().default('stripe'),
	gatewaySubscriptionId: text("gateway_subscription_id"),
	metadata: jsonb().default({}),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	index("idx_subscriptions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_subscriptions_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plans.id],
			name: "subscriptions_plan_id_plans_id_fk"
		}),
	pgPolicy("Users select own subscriptions", { as: "permissive", for: "select", to: ["public"], using: sql`((auth.uid())::text = user_id)` }),
	pgPolicy("Service role full bypass subscriptions", { as: "permissive", for: "all", to: ["service_role"] }),
	pgPolicy("Admins full management subscriptions", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass subscriptions", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const integrationCategories = pgTable("integration_categories", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
}, (table) => [
	pgPolicy("App user bypass integration_categories", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const subscriptionHistory = pgTable("subscription_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	action: text().notNull(),
	details: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscription_history_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass subscription_history", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const featuredPosts = pgTable("featured_posts", {
	postId: text("post_id").primaryKey().notNull(),
	position: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "featured_posts_post_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public read featured_posts", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass featured_posts", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const userSettings = pgTable("user_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id"),
	theme: text().default('light'),
	notificationsEnabled: boolean("notifications_enabled").default(true),
	ttsVoicePreference: text("tts_voice_preference"),
	ttsSpeedPreference: numeric("tts_speed_preference").default('1.0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("user_settings_user_id_key").on(table.userId),
	pgPolicy("Users manage own settings", { as: "permissive", for: "all", to: ["public"], using: sql`((auth.uid())::text = user_id)` }),
	pgPolicy("Service role full bypass user_settings", { as: "permissive", for: "all", to: ["service_role"] }),
	pgPolicy("App user bypass user_settings", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	userEmail: text("user_email"),
	action: text().notNull(),
	details: jsonb().default({}),
	ipAddress: text("ip_address"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("idx_activity_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass activity_logs", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const quizzes = pgTable("quizzes", {
	id: text().primaryKey().notNull(),
	articleId: text("article_id"),
	title: text().notNull(),
	questions: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("idx_quizzes_article_id").using("btree", table.articleId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [posts.id],
			name: "quizzes_article_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public read quizzes", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Admins full management quizzes", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass quizzes", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const aiProviders = pgTable("ai_providers", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	apiKeyEnvVar: text("api_key_env_var"),
	apiUrl: text("api_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("App user bypass ai_providers", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const dashboardStats = pgTable("dashboard_stats", {
	id: text().primaryKey().notNull(),
	keyName: text("key_name").notNull(),
	value: numeric().default('0.0'),
	jsonData: jsonb("json_data").default({}),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("App user bypass dashboard_stats", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const seoSettings = pgTable("seo_settings", {
	id: text().default('singleton').primaryKey().notNull(),
	googleVerification: text("google_verification"),
	metaTitleSuffix: text("meta_title_suffix").default(' | Heartsync'),
	defaultKeywords: text("default_keywords").array().default([""]),
	ogImage: text("og_image"),
	sitemapLastGenerated: timestamp("sitemap_last_generated", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Public read seo_settings", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass seo_settings", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
	check("seo_singleton", sql`id = 'singleton'::text`),
]);

export const analytics = pgTable("analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventType: text("event_type").notNull(),
	path: text(),
	referrer: text(),
	userAgent: text("user_agent"),
	ipHashed: text("ip_hashed"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Anyone insert analytics logs", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("App user bypass analytics", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const adminUsers = pgTable("admin_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	role: text().default('admin'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("admin_users_email_key").on(table.email),
	pgPolicy("App user bypass admin_users", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const advertisementLogs = pgTable("advertisement_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	adProvider: text("ad_provider").default('google_adsense'),
	adType: text("ad_type").default('interstitial'),
	status: text().default('served'),
	cpmEst: numeric("cpm_est").default('0.0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "advertisement_logs_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass advertisement_logs", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const rssFeeds = pgTable("rss_feeds", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	feedUrl: text("feed_url").notNull(),
	status: text().default('active'),
	categoryId: text("category_id"),
	authorId: text("author_id"),
	autoPublish: boolean("auto_publish").default(false),
	frequencyHours: integer("frequency_hours").default(24),
	lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "rss_feeds_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [authors.id],
			name: "rss_feeds_author_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass rss_feeds", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const aiPromptHistory = pgTable("ai_prompt_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	model: text().notNull(),
	tokensUsed: integer("tokens_used").default(0),
	costEst: numeric("cost_est").default('0.0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_prompt_history_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass ai_prompt_history", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const footer = pgTable("footer", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionTitle: text("section_title").notNull(),
	links: jsonb().default([]),
	position: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Public read footer", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass footer", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const redirects = pgTable("redirects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sourcePath: text("source_path").notNull(),
	targetPath: text("target_path").notNull(),
	statusCode: integer("status_code").default(301),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("redirects_source_path_key").on(table.sourcePath),
	pgPolicy("App user bypass redirects", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const aiSettings = pgTable("ai_settings", {
	id: text().default('singleton').primaryKey().notNull(),
	enabled: boolean().default(true),
	defaultProvider: text("default_provider").default('google_gemini'),
	defaultModel: text("default_model").default('gemini-1.5-flash'),
	maxTokensLimit: integer("max_tokens_limit").default(2048),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("App user bypass ai_settings", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
	check("ai_settings_singleton", sql`id = 'singleton'::text`),
]);

export const emailTemplates = pgTable("email_templates", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	subject: text(),
	htmlBody: text("html_body").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("App user bypass email_templates", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const emailCampaigns = pgTable("email_campaigns", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	subject: text().notNull(),
	content: text().notNull(),
	templateId: text("template_id"),
	status: text().default('draft'),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	recipientsCount: integer("recipients_count").default(0),
}, (table) => [
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [emailTemplates.id],
			name: "email_campaigns_template_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass email_campaigns", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const emailHistory = pgTable("email_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: text("campaign_id").notNull(),
	subscriberId: text("subscriber_id").notNull(),
	status: text().default('sent'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [emailCampaigns.id],
			name: "email_history_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subscriberId],
			foreignColumns: [subscribers.id],
			name: "email_history_subscriber_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass email_history", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const emailEvents = pgTable("email_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	historyId: uuid("history_id"),
	eventType: text("event_type").notNull(),
	urlClicked: text("url_clicked"),
	userAgent: text("user_agent"),
	ipAddress: text("ip_address"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.historyId],
			foreignColumns: [emailHistory.id],
			name: "email_events_history_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass email_events", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const apiKeys = pgTable("api_keys", {
	id: text().primaryKey().notNull(),
	keyPrefix: text("key_prefix").notNull(),
	name: text().notNull(),
	permissions: text().array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	status: text().default('active'),
}, (table) => [
	pgPolicy("App user bypass api_keys", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const apiLogs = pgTable("api_logs", {
	id: text().primaryKey().notNull(),
	apiKeyId: text("api_key_id"),
	route: text().notNull(),
	method: text().notNull(),
	statusCode: integer("status_code").notNull(),
	responseTimeMs: integer("response_time_ms").notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.apiKeyId],
			foreignColumns: [apiKeys.id],
			name: "api_logs_api_key_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass api_logs", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const cookiePreferences = pgTable("cookie_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userEmail: text("user_email"),
	analyticsGranted: boolean("analytics_granted").default(false),
	marketingGranted: boolean("marketing_granted").default(false),
	necessaryGranted: boolean("necessary_granted").default(true),
	ipAddress: text("ip_address"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Anyone save cookie preferences", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("App user bypass cookie_preferences", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const userSessions = pgTable("user_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Users select own sessions", { as: "permissive", for: "select", to: ["public"], using: sql`((auth.uid())::text = user_id)` }),
	pgPolicy("App user bypass user_sessions", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const rewardedUnlockHistory = pgTable("rewarded_unlock_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	postId: text("post_id").notNull(),
	durationSeconds: integer("duration_seconds").default(3600),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "rewarded_unlock_history_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "rewarded_unlock_history_post_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass rewarded_unlock_history", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const aiGenerations = pgTable("ai_generations", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id"),
	prompt: text().notNull(),
	generatedContent: text("generated_content").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	feature: text().default('article_generator'),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_generations_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users manage own ai generations", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("App user bypass ai_generations", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const integrations = pgTable("integrations", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	categoryId: text("category_id"),
	isEnabled: boolean("is_enabled").default(false),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [integrationCategories.id],
			name: "integrations_category_id_fkey"
		}),
	pgPolicy("Admins full management integrations", { as: "permissive", for: "all", to: ["public"], using: sql`has_role(auth.uid(), ARRAY['admin'::text])` }),
	pgPolicy("App user bypass integrations", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const sites = pgTable("sites", {
	id: text().primaryKey().notNull(),
	domain: text().notNull(),
	subdomain: text(),
	name: text().notNull(),
	status: text().default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("sites_domain_key").on(table.domain),
	unique("sites_subdomain_key").on(table.subdomain),
	pgPolicy("App user bypass sites", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const tags = pgTable("tags", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("tags_slug_key").on(table.slug),
	pgPolicy("Public read tags", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass tags", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const websiteSettings = pgTable("website_settings", {
	id: text().default('singleton').primaryKey().notNull(),
	settingsRef: text("settings_ref"),
	lastUpdated: timestamp("last_updated", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.settingsRef],
			foreignColumns: [siteSettings.id],
			name: "website_settings_settings_ref_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public read website_settings", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass website_settings", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
	check("website_singleton_chk", sql`id = 'singleton'::text`),
]);

export const articleRevisions = pgTable("article_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	content: text().notNull(),
	title: text().notNull(),
	excerpt: text(),
	changedBy: uuid("changed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "article_revisions_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "article_revisions_changed_by_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass article_revisions", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const readingStatistics = pgTable("reading_statistics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	userId: uuid("user_id"),
	scrollDepth: integer("scroll_depth").default(0),
	timeSpentSeconds: integer("time_spent_seconds").default(0),
	completed: boolean().default(false),
	device: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "reading_statistics_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reading_statistics_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass reading_statistics", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const integrationSettings = pgTable("integration_settings", {
	id: text().primaryKey().notNull(),
	integrationId: text("integration_id"),
	key: text().notNull(),
	value: text(),
	isSensitive: boolean("is_sensitive").default(false),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.integrationId],
			foreignColumns: [integrations.id],
			name: "integration_settings_integration_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass integration_settings", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const integrationLogs = pgTable("integration_logs", {
	id: text().primaryKey().notNull(),
	integrationId: text("integration_id"),
	action: text().notNull(),
	status: text().default('success'),
	details: text(),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
	userId: text("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.integrationId],
			foreignColumns: [integrations.id],
			name: "integration_logs_integration_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass integration_logs", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	uid: text().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_uid_unique").on(table.uid),
	pgPolicy("App user bypass users", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const media = pgTable("media", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	filename: text().notNull(),
	url: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	mimeType: text("mime_type"),
	altText: text("alt_text"),
	folderPath: text("folder_path").default('/'),
	uploadedBy: uuid("uploaded_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	index("idx_media_uploaded_by").using("btree", table.uploadedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "media_uploaded_by_fkey"
		}).onDelete("set null"),
	pgPolicy("Admins full management media", { as: "permissive", for: "all", to: ["public"], using: sql`has_role(auth.uid(), ARRAY['admin'::text, 'editor'::text, 'author'::text])` }),
	pgPolicy("App user bypass media", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	name: text(),
	role: text().default('author'),
	avatarUrl: text("avatar_url"),
	bio: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	settings: jsonb().default({}),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	isSuspended: boolean("is_suspended").default(false),
	fullName: text("full_name"),
	username: text(),
	status: text().default('active'),
}, (table) => [
	index("idx_profiles_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("profiles_username_key").on(table.username),
	pgPolicy("Public read profiles", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users edit own profile", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Service role full bypass profiles", { as: "permissive", for: "all", to: ["service_role"] }),
	pgPolicy("Admins full management profiles", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass profiles", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const mediaUsage = pgTable("media_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mediaId: text("media_id").notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.mediaId],
			foreignColumns: [media.id],
			name: "media_usage_media_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass media_usage", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const trendingPosts = pgTable("trending_posts", {
	postId: text("post_id").primaryKey().notNull(),
	score: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "trending_posts_post_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public read trending_posts", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass trending_posts", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const auditLogs = pgTable("audit_logs", {
	id: text().primaryKey().notNull(),
	action: text().notNull(),
	userId: text("user_id"),
	userEmail: text("user_email"),
	timestamp: text().notNull(),
	details: text(),
	userName: text("user_name").default('system'),
	target: text(),
}, (table) => [
	index("idx_audit_timestamp").using("btree", table.timestamp.desc().nullsFirst().op("text_ops")),
	pgPolicy("Admins full management audit_logs", { as: "permissive", for: "all", to: ["public"], using: sql`has_role(auth.uid(), ARRAY['admin'::text])` }),
	pgPolicy("App user bypass audit_logs", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const adminNotifications = pgTable("admin_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	message: text(),
	type: text().default('info'),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("App user bypass admin_notifications", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	postId: text("post_id"),
	userName: text("user_name").notNull(),
	userEmail: text("user_email").notNull(),
	userAvatar: text("user_avatar"),
	content: text().notNull(),
	createdAt: text("created_at").notNull(),
	parentId: text("parent_id"),
	isApproved: boolean("is_approved").default(false),
	userId: uuid("user_id"),
}, (table) => [
	index("idx_comments_approved").using("btree", table.isApproved.asc().nullsLast().op("bool_ops")),
	index("idx_comments_created_at").using("btree", table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_comments_post").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("idx_comments_post_id").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Anyone insert comments", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("Admins full management comments", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Public read comments", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("App user bypass comments", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const testimonials = pgTable("testimonials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authorName: text("author_name").notNull(),
	authorRole: text("author_role").default('Patient/Couple'),
	content: text().notNull(),
	avatarUrl: text("avatar_url"),
	rating: integer().default(5),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Public read testimonials", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass testimonials", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const posts = pgTable("posts", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	excerpt: text(),
	content: text().notNull(),
	status: text().default('draft'),
	publishDate: text("publish_date"),
	featuredImage: text("featured_image"),
	readTime: integer("read_time").default(5),
	categoryId: text("category_id"),
	authorId: uuid("author_id"),
	tags: jsonb(),
	likes: integer().default(0),
	reactions: jsonb(),
	views: integer().default(0),
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),
	keywords: jsonb(),
	allowComments: boolean("allow_comments").default(true),
	isPremium: boolean("is_premium").default(false),
	price: numeric().default('0'),
	accessLevel: text("access_level").default('free'),
	publishAt: text("publish_at"),
	ttsEnabled: boolean("tts_enabled").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	index("idx_posts_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_posts_author_id").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_posts_category").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("idx_posts_category_id").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("idx_posts_publish_date").using("btree", table.publishDate.desc().nullsFirst().op("text_ops")),
	index("idx_posts_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_posts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "posts_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "posts_author_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("posts_slug_unique").on(table.slug),
	pgPolicy("Service role full bypass posts", { as: "permissive", for: "all", to: ["service_role"], using: sql`true` }),
	pgPolicy("Admins full management posts", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Public read posts", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("App user bypass posts", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	unique("roles_name_key").on(table.name),
]);

export const premiumAccess = pgTable("premium_access", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	grantedBy: uuid("granted_by"),
	reason: text(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "premium_access_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [users.id],
			name: "premium_access_granted_by_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass premium_access", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const navigation = pgTable("navigation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	label: text().notNull(),
	url: text().notNull(),
	position: integer().notNull(),
	parentId: uuid("parent_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "navigation_parent_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Public read navigation", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass navigation", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const banners = pgTable("banners", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	content: text(),
	link: text(),
	active: boolean().default(true),
	type: text().default('info'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Public read banners", { as: "permissive", for: "select", to: ["public"], using: sql`(active = true)` }),
	pgPolicy("App user bypass banners", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const subscribers = pgTable("subscribers", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	source: text().default('footer'),
	status: text().default('active'),
	subscribedAt: text("subscribed_at"),
	unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_subscribers_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_subscribers_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("subscribers_email_unique").on(table.email),
	pgPolicy("Anyone register subscriber", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("Admins full management subscribers", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass subscribers", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const payments = pgTable("payments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	amount: numeric().notNull(),
	status: text().default('succeeded'),
	createdAt: text("created_at"),
	subscriptionId: text("subscription_id"),
	gatewayPaymentIntentId: text("gateway_payment_intent_id"),
	fee: numeric({ precision: 10, scale:  2 }).default('0.0'),
	metadata: jsonb().default({}),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	index("idx_payments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_payments_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptions.id],
			name: "payments_subscription_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users select own payments", { as: "permissive", for: "select", to: ["public"], using: sql`((auth.uid())::text = user_id)` }),
	pgPolicy("Service role full bypass payments", { as: "permissive", for: "all", to: ["service_role"] }),
	pgPolicy("Admins full management payments", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass payments", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const webhookLogs = pgTable("webhook_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gateway: text().notNull(),
	eventType: text("event_type").notNull(),
	payload: jsonb().notNull(),
	processed: boolean().default(false),
	error: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("App user bypass webhook_logs", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const rewardedUnlockSessions = pgTable("rewarded_unlock_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	postId: text("post_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "rewarded_unlock_sessions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "rewarded_unlock_sessions_post_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users select own unlock sessions", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("App user bypass rewarded_unlock_sessions", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	type: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: text().default('USD'),
	status: text().default('succeeded'),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transactions_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users select own transactions", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("App user bypass transactions", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const rssImportHistory = pgTable("rss_import_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	feedId: text("feed_id").notNull(),
	articlesFound: integer("articles_found").default(0),
	articlesImported: integer("articles_imported").default(0),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feedId],
			foreignColumns: [rssFeeds.id],
			name: "rss_import_history_feed_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("App user bypass rss_import_history", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const invoices = pgTable("invoices", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	subscriptionId: text("subscription_id"),
	invoiceNumber: text("invoice_number"),
	amountDue: numeric("amount_due", { precision: 10, scale:  2 }).notNull(),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }).notNull(),
	status: text().default('paid'),
	pdfUrl: text("pdf_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "invoices_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptions.id],
			name: "invoices_subscription_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users select own invoices", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("App user bypass invoices", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const rssImportedArticles = pgTable("rss_imported_articles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	feedId: text("feed_id").notNull(),
	externalGuid: text("external_guid").notNull(),
	externalLink: text("external_link").notNull(),
	title: text().notNull(),
	importStatus: text("import_status").default('imported'),
	postId: text("post_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feedId],
			foreignColumns: [rssFeeds.id],
			name: "rss_imported_articles_feed_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "rss_imported_articles_post_id_fkey"
		}).onDelete("set null"),
	pgPolicy("App user bypass rss_imported_articles", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"], using: sql`true`, withCheck: sql`true`  }),
]);

export const categories = pgTable("categories", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	color: text(),
	icon: text(),
	featuredImage: text("featured_image"),
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),
	seoKeywords: jsonb("seo_keywords"),
	isPremium: boolean("is_premium").default(false),
	price: numeric().default('0'),
}, (table) => [
	index("idx_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("categories_slug_unique").on(table.slug),
	pgPolicy("Service role full bypass categories", { as: "permissive", for: "all", to: ["service_role"], using: sql`true` }),
	pgPolicy("Admins full management categories", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Public read categories", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("App user bypass categories", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const siteSettings = pgTable("site_settings", {
	id: text().primaryKey().notNull(),
	siteName: text("site_name").notNull(),
	siteDescription: text("site_description"),
	adsenseClientId: text("adsense_client_id"),
	adsenseActive: boolean("adsense_active").default(false),
	newsletterWelcomeMsg: text("newsletter_welcome_msg"),
	aiAssistantEnabled: boolean("ai_assistant_enabled").default(true),
	recaptchaEnabled: boolean("recaptcha_enabled").default(false),
	logoUrl: text("logo_url"),
	primaryColor: text("primary_color"),
	secondaryColor: text("secondary_color"),
	accentColor: text("accent_color"),
	brandFont: text("brand_font"),
	brandTheme: text("brand_theme"),
	brandAnimation: text("brand_animation"),
	socialLinks: jsonb("social_links"),
	extraApiKeys: jsonb("extra_api_keys"),
	headerSettings: jsonb("header_settings"),
	heroSettings: jsonb("hero_settings"),
	rawSettings: jsonb("raw_settings"),
	homepageTopics: jsonb("homepage_topics").default([]),
	homepageTopicsTitle: text("homepage_topics_title").default('EXPLORE BY TOPIC'),
	homepageTopicsSubheading: text("homepage_topics_subheading").default('Explore expert insights, practical guidance, and inspiring stories.'),
	homepageTopicsColumns: integer("homepage_topics_columns").default(3),
	homepageTopicsAnimationsEnabled: boolean("homepage_topics_animations_enabled").default(true),
	homepageCategoriesEnabled: boolean("homepage_categories_enabled").default(true),
	homepageInsightsTitle: text("homepage_insights_title").default('Relationship Insights'),
	homepageInsightsDesc: text("homepage_insights_desc").default('Discover your attachment patterns, emotional needs, and relational style.'),
	homepageInsightsIcon: text("homepage_insights_icon").default('Heart'),
	homepageInsightsEnabled: boolean("homepage_insights_enabled").default(true),
	homepageInsightsOrder: integer("homepage_insights_order").default(4),
	homepagePremiumTitle: text("homepage_premium_title").default('UNLOCK PREMIUM ACCESS'),
	homepagePremiumDesc: text("homepage_premium_desc").default('Get unlimited access to relationship assessments, expert insights, and workshops.'),
	homepagePremiumCtaText: text("homepage_premium_cta_text").default('START FREE TRIAL'),
	homepagePremiumEnabled: boolean("homepage_premium_enabled").default(true),
	homepagePremiumOrder: integer("homepage_premium_order").default(5),
	relatedBlockEnabled: boolean("related_block_enabled").default(true),
	relatedBlockTitle: text("related_block_title").default('You may also like'),
	relatedBlockCount: integer("related_block_count").default(3),
	relatedBlockStyle: text("related_block_style").default('grid'),
	ttsGlobalEnabled: boolean("tts_global_enabled").default(true),
	ttsDefaultVoice: text("tts_default_voice").default('female'),
	ttsDefaultSpeed: numeric("tts_default_speed").default('1.0'),
	ttsPlayerPosition: text("tts_player_position").default('top'),
	ttsPlayerStyle: text("tts_player_style").default('button'),
	ttsVoiceGender: text("tts_voice_gender").default('female'),
	ttsSelectedVoice: text("tts_selected_voice").default('samantha'),
	ttsProvider: text("tts_provider").default('webspeech'),
	elevenlabsApiKey: text("elevenlabs_api_key").default(''),
	ttsSelectedVoiceId: text("tts_selected_voice_id").default(''),
	ttsVoiceCache: jsonb("tts_voice_cache").default([]),
	ttsStability: numeric("tts_stability").default('0.55'),
	ttsSimilarityBoost: numeric("tts_similarity_boost").default('0.75'),
	ttsStyle: numeric("tts_style").default('0.0'),
	ttsLastVoiceSync: text("tts_last_voice_sync").default(''),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	adminRegistrationMode: text("admin_registration_mode").default('open'),
}, (table) => [
	pgPolicy("Service role full bypass site_settings", { as: "permissive", for: "all", to: ["service_role"], using: sql`true` }),
	pgPolicy("Admins full management site_settings", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Public read site_settings", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("App user bypass site_settings", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const authors = pgTable("authors", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	avatarUrl: text("avatar_url"),
	bio: text(),
	roleTag: text("role_tag").default('Relationship Advisor'),
	role: text(),
	socialLinks: jsonb("social_links").default({}),
	isDeleted: boolean("is_deleted").default(false),
}, (table) => [
	pgPolicy("Public read authors", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass authors", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const contactMessages = pgTable("contact_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	message: text().notNull(),
	status: text().default('unread'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	pgPolicy("Anyone insert contact message", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("App user bypass contact_messages", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const plans = pgTable("plans", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric().default('0'),
	interval: text().default('month'),
	features: jsonb(),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
	priceMonthly: numeric("price_monthly", { precision: 10, scale:  2 }).default('0'),
	priceYearly: numeric("price_yearly", { precision: 10, scale:  2 }).default('0'),
}, (table) => [
	pgPolicy("Public read plans", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
	pgPolicy("Admins full management plans", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("App user bypass plans", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const relatedPosts = pgTable("related_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	relatedPostId: text("related_post_id").notNull(),
	score: numeric().default('0.5'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "related_posts_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.relatedPostId],
			foreignColumns: [posts.id],
			name: "related_posts_related_post_id_fkey"
		}).onDelete("cascade"),
	unique("unique_related_pair").on(table.postId, table.relatedPostId),
	pgPolicy("Public read related_posts", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("App user bypass related_posts", { as: "permissive", for: "all", to: ["ai_studio_admin", "ai_studio_app_user"] }),
]);

export const userRoles = pgTable("user_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	roleId: uuid("role_id"),
	assignedBy: uuid("assigned_by"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_fkey"
		}).onDelete("cascade"),
	unique("user_roles_user_id_role_id_key").on(table.roleId, table.userId),
	pgPolicy("Public read user_roles", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Only Super Admin can edit user_roles", { as: "permissive", for: "all", to: ["public"] }),
]);

export const adZones = pgTable("ad_zones", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slot: text().default('sidebar'),
	pricing: text().default('CPM'),
	active: boolean().default(true),
	codeTemplate: text("code_template"),
	sizeLabel: text("size_label").default('Responsive'),
	impressions: integer().default(0),
	clicks: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	pgPolicy("Public read ad_zones", { as: "permissive", for: "select", to: ["public"], using: sql`(active = true)` }),
	pgPolicy("Admins full ad_zones", { as: "permissive", for: "all", to: ["public"] }),
]);

export const adProviders = pgTable("ad_providers", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	type: text().default('adsense'),
	pubId: text("pub_id"),
	slot: text().default('sidebar_top'),
	active: boolean().default(true),
	code: text(),
	cpmEstimate: text("cpm_estimate").default('$12.50'),
	customSize: text("custom_size").default('Responsive'),
	lazyLoadDelay: text("lazy_load_delay").default('none'),
	geoTarget: text("geo_target").default('worldwide'),
	isConsentCompliant: boolean("is_consent_compliant").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	pgPolicy("Public read ad_providers", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins full ad_providers", { as: "permissive", for: "all", to: ["public"] }),
]);

export const sponsorshipCampaigns = pgTable("sponsorship_campaigns", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	url: text(),
	impressions: integer().default(0),
	clicks: integer().default(0),
	status: text().default('Active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`),
}, (table) => [
	pgPolicy("Public read sponsorship_campaigns", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins full sponsorship_campaigns", { as: "permissive", for: "all", to: ["public"] }),
]);
