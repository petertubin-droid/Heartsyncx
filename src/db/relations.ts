import { relations } from "drizzle-orm/relations";
import { plans, subscriptions, usersInAuth, subscriptionHistory, posts, featuredPosts, activityLogs, quizzes, advertisementLogs, categories, rssFeeds, authors, aiPromptHistory, emailTemplates, emailCampaigns, emailHistory, subscribers, emailEvents, apiKeys, apiLogs, rewardedUnlockHistory, aiGenerations, integrationCategories, integrations, siteSettings, websiteSettings, articleRevisions, readingStatistics, integrationSettings, integrationLogs, media, mediaUsage, trendingPosts, comments, profiles, premiumAccess, navigation, payments, rewardedUnlockSessions, transactions, rssImportHistory, invoices, rssImportedArticles, relatedPosts, userRoles, roles } from "./schema";

export const subscriptionsRelations = relations(subscriptions, ({one, many}) => ({
	plan: one(plans, {
		fields: [subscriptions.planId],
		references: [plans.id]
	}),
	payments: many(payments),
	invoices: many(invoices),
}));

export const plansRelations = relations(plans, ({many}) => ({
	subscriptions: many(subscriptions),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [subscriptionHistory.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	subscriptionHistories: many(subscriptionHistory),
	activityLogs: many(activityLogs),
	advertisementLogs: many(advertisementLogs),
	aiPromptHistories: many(aiPromptHistory),
	rewardedUnlockHistories: many(rewardedUnlockHistory),
	aiGenerations: many(aiGenerations),
	articleRevisions: many(articleRevisions),
	readingStatistics: many(readingStatistics),
	media: many(media),
	comments: many(comments),
	premiumAccesses_userId: many(premiumAccess, {
		relationName: "premiumAccess_userId_usersInAuth_id"
	}),
	premiumAccesses_grantedBy: many(premiumAccess, {
		relationName: "premiumAccess_grantedBy_usersInAuth_id"
	}),
	rewardedUnlockSessions: many(rewardedUnlockSessions),
	transactions: many(transactions),
	invoices: many(invoices),
}));

export const featuredPostsRelations = relations(featuredPosts, ({one}) => ({
	post: one(posts, {
		fields: [featuredPosts.postId],
		references: [posts.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	featuredPosts: many(featuredPosts),
	quizzes: many(quizzes),
	rewardedUnlockHistories: many(rewardedUnlockHistory),
	articleRevisions: many(articleRevisions),
	readingStatistics: many(readingStatistics),
	trendingPosts: many(trendingPosts),
	comments: many(comments),
	category: one(categories, {
		fields: [posts.categoryId],
		references: [categories.id]
	}),
	profile: one(profiles, {
		fields: [posts.authorId],
		references: [profiles.id]
	}),
	rewardedUnlockSessions: many(rewardedUnlockSessions),
	rssImportedArticles: many(rssImportedArticles),
	relatedPosts_postId: many(relatedPosts, {
		relationName: "relatedPosts_postId_posts_id"
	}),
	relatedPosts_relatedPostId: many(relatedPosts, {
		relationName: "relatedPosts_relatedPostId_posts_id"
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [activityLogs.userId],
		references: [usersInAuth.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one}) => ({
	post: one(posts, {
		fields: [quizzes.articleId],
		references: [posts.id]
	}),
}));

export const advertisementLogsRelations = relations(advertisementLogs, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [advertisementLogs.userId],
		references: [usersInAuth.id]
	}),
}));

export const rssFeedsRelations = relations(rssFeeds, ({one, many}) => ({
	category: one(categories, {
		fields: [rssFeeds.categoryId],
		references: [categories.id]
	}),
	author: one(authors, {
		fields: [rssFeeds.authorId],
		references: [authors.id]
	}),
	rssImportHistories: many(rssImportHistory),
	rssImportedArticles: many(rssImportedArticles),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	rssFeeds: many(rssFeeds),
	posts: many(posts),
}));

export const authorsRelations = relations(authors, ({many}) => ({
	rssFeeds: many(rssFeeds),
}));

export const aiPromptHistoryRelations = relations(aiPromptHistory, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [aiPromptHistory.userId],
		references: [usersInAuth.id]
	}),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({one, many}) => ({
	emailTemplate: one(emailTemplates, {
		fields: [emailCampaigns.templateId],
		references: [emailTemplates.id]
	}),
	emailHistories: many(emailHistory),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({many}) => ({
	emailCampaigns: many(emailCampaigns),
}));

export const emailHistoryRelations = relations(emailHistory, ({one, many}) => ({
	emailCampaign: one(emailCampaigns, {
		fields: [emailHistory.campaignId],
		references: [emailCampaigns.id]
	}),
	subscriber: one(subscribers, {
		fields: [emailHistory.subscriberId],
		references: [subscribers.id]
	}),
	emailEvents: many(emailEvents),
}));

export const subscribersRelations = relations(subscribers, ({many}) => ({
	emailHistories: many(emailHistory),
}));

export const emailEventsRelations = relations(emailEvents, ({one}) => ({
	emailHistory: one(emailHistory, {
		fields: [emailEvents.historyId],
		references: [emailHistory.id]
	}),
}));

export const apiLogsRelations = relations(apiLogs, ({one}) => ({
	apiKey: one(apiKeys, {
		fields: [apiLogs.apiKeyId],
		references: [apiKeys.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({many}) => ({
	apiLogs: many(apiLogs),
}));

export const rewardedUnlockHistoryRelations = relations(rewardedUnlockHistory, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [rewardedUnlockHistory.userId],
		references: [usersInAuth.id]
	}),
	post: one(posts, {
		fields: [rewardedUnlockHistory.postId],
		references: [posts.id]
	}),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [aiGenerations.userId],
		references: [usersInAuth.id]
	}),
}));

export const integrationsRelations = relations(integrations, ({one, many}) => ({
	integrationCategory: one(integrationCategories, {
		fields: [integrations.categoryId],
		references: [integrationCategories.id]
	}),
	integrationSettings: many(integrationSettings),
	integrationLogs: many(integrationLogs),
}));

export const integrationCategoriesRelations = relations(integrationCategories, ({many}) => ({
	integrations: many(integrations),
}));

export const websiteSettingsRelations = relations(websiteSettings, ({one}) => ({
	siteSetting: one(siteSettings, {
		fields: [websiteSettings.settingsRef],
		references: [siteSettings.id]
	}),
}));

export const siteSettingsRelations = relations(siteSettings, ({many}) => ({
	websiteSettings: many(websiteSettings),
}));

export const articleRevisionsRelations = relations(articleRevisions, ({one}) => ({
	post: one(posts, {
		fields: [articleRevisions.postId],
		references: [posts.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [articleRevisions.changedBy],
		references: [usersInAuth.id]
	}),
}));

export const readingStatisticsRelations = relations(readingStatistics, ({one}) => ({
	post: one(posts, {
		fields: [readingStatistics.postId],
		references: [posts.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [readingStatistics.userId],
		references: [usersInAuth.id]
	}),
}));

export const integrationSettingsRelations = relations(integrationSettings, ({one}) => ({
	integration: one(integrations, {
		fields: [integrationSettings.integrationId],
		references: [integrations.id]
	}),
}));

export const integrationLogsRelations = relations(integrationLogs, ({one}) => ({
	integration: one(integrations, {
		fields: [integrationLogs.integrationId],
		references: [integrations.id]
	}),
}));

export const mediaRelations = relations(media, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [media.uploadedBy],
		references: [usersInAuth.id]
	}),
	mediaUsages: many(mediaUsage),
}));

export const mediaUsageRelations = relations(mediaUsage, ({one}) => ({
	media: one(media, {
		fields: [mediaUsage.mediaId],
		references: [media.id]
	}),
}));

export const trendingPostsRelations = relations(trendingPosts, ({one}) => ({
	post: one(posts, {
		fields: [trendingPosts.postId],
		references: [posts.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [comments.userId],
		references: [usersInAuth.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	posts: many(posts),
	userRoles: many(userRoles),
}));

export const premiumAccessRelations = relations(premiumAccess, ({one}) => ({
	usersInAuth_userId: one(usersInAuth, {
		fields: [premiumAccess.userId],
		references: [usersInAuth.id],
		relationName: "premiumAccess_userId_usersInAuth_id"
	}),
	usersInAuth_grantedBy: one(usersInAuth, {
		fields: [premiumAccess.grantedBy],
		references: [usersInAuth.id],
		relationName: "premiumAccess_grantedBy_usersInAuth_id"
	}),
}));

export const navigationRelations = relations(navigation, ({one, many}) => ({
	navigation: one(navigation, {
		fields: [navigation.parentId],
		references: [navigation.id],
		relationName: "navigation_parentId_navigation_id"
	}),
	navigations: many(navigation, {
		relationName: "navigation_parentId_navigation_id"
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	subscription: one(subscriptions, {
		fields: [payments.subscriptionId],
		references: [subscriptions.id]
	}),
}));

export const rewardedUnlockSessionsRelations = relations(rewardedUnlockSessions, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [rewardedUnlockSessions.userId],
		references: [usersInAuth.id]
	}),
	post: one(posts, {
		fields: [rewardedUnlockSessions.postId],
		references: [posts.id]
	}),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [transactions.userId],
		references: [usersInAuth.id]
	}),
}));

export const rssImportHistoryRelations = relations(rssImportHistory, ({one}) => ({
	rssFeed: one(rssFeeds, {
		fields: [rssImportHistory.feedId],
		references: [rssFeeds.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [invoices.userId],
		references: [usersInAuth.id]
	}),
	subscription: one(subscriptions, {
		fields: [invoices.subscriptionId],
		references: [subscriptions.id]
	}),
}));

export const rssImportedArticlesRelations = relations(rssImportedArticles, ({one}) => ({
	rssFeed: one(rssFeeds, {
		fields: [rssImportedArticles.feedId],
		references: [rssFeeds.id]
	}),
	post: one(posts, {
		fields: [rssImportedArticles.postId],
		references: [posts.id]
	}),
}));

export const relatedPostsRelations = relations(relatedPosts, ({one}) => ({
	post_postId: one(posts, {
		fields: [relatedPosts.postId],
		references: [posts.id],
		relationName: "relatedPosts_postId_posts_id"
	}),
	post_relatedPostId: one(posts, {
		fields: [relatedPosts.relatedPostId],
		references: [posts.id],
		relationName: "relatedPosts_relatedPostId_posts_id"
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	profile: one(profiles, {
		fields: [userRoles.userId],
		references: [profiles.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	userRoles: many(userRoles),
}));