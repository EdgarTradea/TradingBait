import {
  AccountDeletionRequest,
  AddManualTradeData,
  AffiliateApprovalRequest,
  AffiliateRegistrationRequest,
  AffiliateSystemHealthCheckData,
  AnalyzeFileStructureData,
  AnalyzeGroupsData,
  AnalyzeTradesData,
  ApplyDiscountData,
  ApplyDiscountRequest,
  ApproveAffiliateData,
  AssessDataQualityData,
  AuditMissingUsersData,
  AuditSingleUserData,
  AutoInitializeUserData,
  AutoResolveIssuesData,
  AutoResolveIssuesPayload,
  BackfillEvaluationIdsData,
  BasicHealthCheckData,
  BodyAnalyzeFileStructure,
  BodyProcessFile,
  BodyUploadImage,
  BodyUploadTradeScreenshot,
  BulkEditRequest,
  BulkEditTradesData,
  BulkImportTradesData,
  BulkTradeRequest,
  BusinessMetricsHealthCheckData,
  CalculateCommissionCostData,
  CalculateFifoForTradesData,
  CancelSubscriptionData,
  CancelTrialData,
  CancelTrialRequest,
  CheckFeatureLimitData,
  CheckHealthData,
  CheckNotificationPreferenceData,
  CheckReviewsData,
  CheckStripeConnectionData,
  CheckTrafficAlertsData,
  CheckUserStatusData,
  CleanupCorruptedEntriesData,
  CleanupLegacyStorageEndpointData,
  ClearHistoricalDataData,
  CommissionCalculationRequest,
  ComprehensivePatternAnalysisStandaloneData,
  ConflictResolutionRequest,
  ConnectPlatformData,
  ConnectRequest,
  CorsStatusData,
  CreateCheckoutRequest,
  CreateCustomMoodRequest,
  CreateDiscountData,
  CreateEvaluationData,
  CreateHabitDefinitionData,
  CreateHabitRequest,
  CreateJournalEntryData,
  CreateJournalEntryRequest,
  CreateManualTradeData,
  CreateMoodDefinitionData,
  CreateOrUpdateCurrentWeeklyIntentionsData,
  CreateProductRequest,
  CreateRefundData,
  CreateStripeCheckoutData,
  CreateStripeProductData,
  CreateSubscriptionCheckoutData,
  CreateSubscriptionCheckoutRequest,
  CreateTicketData,
  CreateTrialCheckout2Data,
  CreateTrialCheckoutData,
  CreateTrialCheckoutRequest,
  CreateTrialRequest,
  CreateTrialSubscriptionData,
  CreateWeeklyIntentionsRequest,
  CreateWeeklyReviewData,
  CreateWithdrawalData,
  DailyStatsRequest,
  DataExportRequest,
  DeleteAccountData,
  DeleteAccountTradesData,
  DeleteAccountTradesRequest,
  DeleteAllTradesData,
  DeleteAllUserTradesData,
  DeleteDiscountData,
  DeleteEvaluationData,
  DeleteHabitDefinitionData,
  DeleteImageData,
  DeleteJournalEntryData,
  DeleteManualTradeData,
  DeleteMoodDefinitionData,
  DeleteRefundData,
  DeleteTradeScreenshotData,
  DeleteTradesByAccountData,
  DeleteTradesByEvaluationData,
  DeleteTradesData,
  DeleteWithdrawalData,
  DetectCorruptedEntriesData,
  DisconnectPlatformData,
  DiscountCreateRequest,
  DiscountHealthCheckData,
  DiscountUpdateRequest,
  DownloadTechnicalAssessmentData,
  EarlyAccessSignupData,
  EarlyAccessSignupRequest,
  EditTradeData,
  EvaluationRequest,
  ExportEarlyAccessSignupsData,
  ExportPersonalDataData,
  ExtractMissingFirstTradeData,
  FifoCalculationRequest,
  FifoHealthCheckData,
  GenerateDailyMetricsData,
  GenerateReferralLinkData,
  GetAffiliateEarningsData,
  GetAffiliateProfileData,
  GetAffiliateProgramAnalyticsData,
  GetAnalyticsSystemHealthData,
  GetAppleTouchIconData,
  GetAuditLogData,
  GetAvailablePropFirmsData,
  GetAvailableStrategiesData,
  GetBehavioralInsightsData,
  GetBusinessMetricsData,
  GetCategoryQuestionsData,
  GetComprehensiveBusinessMetricsData,
  GetCurrentWeeklyIntentionsData,
  GetCustomerPortalUrlData,
  GetDarkFaviconData,
  GetDataRetentionInfoData,
  GetDiscountAnalyticsData,
  GetDiscountData,
  GetEarlyAccessSignupsData,
  GetEarlyAccessStatsData,
  GetEndpointAnalyticsData,
  GetErrorReportsData,
  GetEvaluationsData,
  GetFaviconIcoData,
  GetFaviconPngData,
  GetFeatureUnlockStatusData,
  GetFinancialSummaryData,
  GetHabitDefinitionsData,
  GetHistoricalMetricsData,
  GetHistoricalTrendsData,
  GetImageData,
  GetInfrastructureHealthData,
  GetIssueDetailsData,
  GetJournalAnalyticsData,
  GetJournalEntriesData,
  GetJournalEntryByDateData,
  GetLightFaviconData,
  GetLogoData,
  GetMainLogoData,
  GetMigrationStatusData,
  GetMoodDefinitionsData,
  GetNotificationStatsData,
  GetOgImageData,
  GetPerformanceMetricsData,
  GetPlatformConnectionData,
  GetPropFirmCommissionInfoData,
  GetPublicScreenshotData,
  GetRealTimeSummaryData,
  GetRealtimeStatsData,
  GetReviewScheduleData,
  GetStreakDataData,
  GetSubscriptionFailureStatsData,
  GetSupportCategoriesData,
  GetSystemHealth2Data,
  GetSystemHealthData,
  GetTagSuggestionsData,
  GetTicketCategoriesData,
  GetTicketData,
  GetTradeScreenshotData,
  GetTransactionData,
  GetTransactionHistoryData,
  GetTrialStatusData,
  GetTrialUsersData,
  GetTwitterImageData,
  GetUsageInfoData,
  GetUserAnalyticsData,
  GetUserBehaviorData,
  GetUserBillingInfoData,
  GetUserEvaluationsData,
  GetUserGroupsData,
  GetUserJournalEntriesData,
  GetUserPropFirmPreferenceData,
  GetUserTradesData,
  GetWaitlistStatsData,
  GetWeeklyIntentionsHistoryData,
  GetWeeklyReviewData,
  GlobalOptionsHandlerData,
  GrantSubscriptionData,
  GroupAnalysisRequest,
  GroupingHealthCheckData,
  GroupingRequest,
  HelpfulVoteRequest,
  HistoricalAnalyticsHealthCheckData,
  InitializeHistoricalDataData,
  InitializeUserData,
  ListAffiliatesData,
  ListAllReferralsData,
  ListAllUsersData,
  ListDiscountsData,
  ListStripeProductsData,
  ListTicketsData,
  ListTradeScreenshotsData,
  ListUserImagesData,
  ListWeeklyReviewsData,
  LogFailureRequest,
  LogSubscriptionFailureData,
  ManualTradeEntry,
  ManualTradeRequest,
  MarkSignupConfirmedData,
  MigrateHabitsFromJournalsData,
  MigrateJournalDataEndpointData,
  MigrateUserDataEndpointData,
  MigrationDryRunData,
  MigrationExecuteData,
  MigrationStatusData,
  NotificationSignupRequest,
  OptionsTrialStatusData,
  OptionsUserStatusData,
  PatternAnalysisRequest,
  PatternRecognitionHealthData,
  PingData,
  ProNotificationRequest,
  ProcessFileData,
  PropFirmHealthCheckData,
  PropFirmPreferenceRequest,
  ReactivateSubscriptionData,
  ReferralLinkRequest,
  RefundRequest,
  RegisterAffiliateData,
  RepairTradesDatetimeData,
  RepairTradesRequest,
  RepairUserTradesData,
  ResolveConflictData,
  RestoreSubscriptionData,
  ReviewAutomationHealthCheckData,
  RevokeSubscriptionData,
  SaveJournalEntryData,
  SearchKnowledgeBaseData,
  SearchRequest,
  SendSupportEmailData,
  SendWelcomeEmailData,
  SetUserPropFirmPreferenceData,
  SignupForAiCoachNotificationsData,
  SignupForProNotificationsData,
  StripeWebhookHandlerData,
  SubscriptionAuditHealthCheckData,
  SubscriptionManagementRequest,
  SubscriptionRestoreRequest,
  SupportEmailRequest,
  SupportTicketRequest,
  SyncPlatformTradesData,
  TestAdminData,
  TestEndpointData,
  TrackAnalyticsUserEventData,
  TrackFeatureUsageData,
  TrackReferralConversionData,
  TrackReferralSignupData,
  TrackUserEventData,
  TrackingEvent,
  TradeDeleteRequest,
  TradeEditRequest,
  TradingJournalHealthCheckData,
  TradingPlatformHealthCheckData,
  TrialCheckoutRequest,
  TrialHealthCheckData,
  TrialUsageUpdate,
  TriggerMonthlyReviewEndpointData,
  TriggerReviewsData,
  TriggerSundayResetData,
  TriggerWeeklyReviewEndpointData,
  UpdateCustomMoodRequest,
  UpdateDiscountData,
  UpdateHabitDefinitionData,
  UpdateHabitRequest,
  UpdateJournalEntryData,
  UpdateJournalEntryRequest,
  UpdateManualTradeData,
  UpdateMoodDefinitionData,
  UploadImageData,
  UploadTradeScreenshotData,
  UserActivityEvent,
  UserInitializationHealthCheckData,
  UserInitializationRequest,
  VoteHelpfulData,
  WebhookHealthCheckData,
  WeeklyIntentionsHealthCheckData,
  WeeklyReviewCreate,
  WelcomeEmailRequest,
  WithdrawalRequest,
} from "./data-contracts";

export namespace Apiclient {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Get current trial status for the user
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name get_trial_status
   * @summary Get Trial Status
   * @request GET:/routes/trial-management/status
   */
  export namespace get_trial_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTrialStatusData;
  }

  /**
   * @description Handle preflight CORS requests for trial status
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name options_trial_status
   * @summary Options Trial Status
   * @request OPTIONS:/routes/trial-management/status
   */
  export namespace options_trial_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OptionsTrialStatusData;
  }

  /**
   * @description Create a new trial subscription with Stripe
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name create_trial_subscription
   * @summary Create Trial Subscription
   * @request POST:/routes/trial-management/create
   */
  export namespace create_trial_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateTrialRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTrialSubscriptionData;
  }

  /**
   * @description Track usage of trial features
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name track_feature_usage
   * @summary Track Feature Usage
   * @request POST:/routes/trial-management/track-usage
   */
  export namespace track_feature_usage {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrialUsageUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = TrackFeatureUsageData;
  }

  /**
   * @description Check if user can use a specific feature
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name check_feature_limit
   * @summary Check Feature Limit
   * @request GET:/routes/trial-management/check-limit/{feature_type}
   */
  export namespace check_feature_limit {
    export type RequestParams = {
      /** Feature Type */
      featureType: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckFeatureLimitData;
  }

  /**
   * @description Cancel trial subscription to avoid charges
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name cancel_trial
   * @summary Cancel Trial
   * @request POST:/routes/trial-management/cancel
   */
  export namespace cancel_trial {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CancelTrialRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CancelTrialData;
  }

  /**
   * @description Admin endpoint to view all trial users
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name get_trial_users
   * @summary Get Trial Users
   * @request GET:/routes/trial-management/admin/users
   */
  export namespace get_trial_users {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTrialUsersData;
  }

  /**
   * @description Health check for trial management system
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name trial_health_check
   * @summary Trial Health Check
   * @request GET:/routes/trial-management/health
   */
  export namespace trial_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TrialHealthCheckData;
  }

  /**
   * @description Delete all trades for a specific account/evaluation
   * @tags dbtn/module:trade_deletion, dbtn/hasAuth
   * @name delete_account_trades
   * @summary Delete Account Trades
   * @request DELETE:/routes/trades/account
   */
  export namespace delete_account_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DeleteAccountTradesRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteAccountTradesData;
  }

  /**
   * @description Delete all trades for the authenticated user across all accounts
   * @tags dbtn/module:trade_deletion, dbtn/hasAuth
   * @name delete_all_user_trades
   * @summary Delete All User Trades
   * @request DELETE:/routes/trades/all
   */
  export namespace delete_all_user_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteAllUserTradesData;
  }

  /**
   * @description Analyze the structure of an uploaded trading file using OpenAI
   * @tags dbtn/module:file_analysis, dbtn/hasAuth
   * @name analyze_file_structure
   * @summary Analyze File Structure
   * @request POST:/routes/analyze-structure
   */
  export namespace analyze_file_structure {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyAnalyzeFileStructure;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeFileStructureData;
  }

  /**
   * @description Process uploaded file and save trades to specified evaluation
   * @tags dbtn/module:file_analysis, dbtn/hasAuth
   * @name process_file
   * @summary Process File
   * @request POST:/routes/process-file
   */
  export namespace process_file {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Analysis */
      analysis: string;
      /** Evaluation Id */
      evaluation_id: string;
      /** Broker Timezone */
      broker_timezone: string;
    };
    export type RequestBody = BodyProcessFile;
    export type RequestHeaders = {};
    export type ResponseBody = ProcessFileData;
  }

  /**
   * @description Health check for FIFO calculation API
   * @tags dbtn/module:fifo_calculation, dbtn/hasAuth
   * @name fifo_health_check
   * @summary Fifo Health Check
   * @request GET:/routes/health
   */
  export namespace fifo_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = FifoHealthCheckData;
  }

  /**
   * @description Handle preflight CORS requests for user status check
   * @tags dbtn/module:user_status, dbtn/hasAuth
   * @name options_user_status
   * @summary Options User Status
   * @request OPTIONS:/routes/user-status/check
   */
  export namespace options_user_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = OptionsUserStatusData;
  }

  /**
   * @description Check if the authenticated user has an active subscription
   * @tags dbtn/module:user_status, dbtn/hasAuth
   * @name check_user_status
   * @summary Check User Status
   * @request GET:/routes/user-status/check
   */
  export namespace check_user_status {
    export type RequestParams = {};
    export type RequestQuery = {
      /**  T */
      _t?: number | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckUserStatusData;
  }

  /**
   * @description Assess data quality for user's trades
   * @tags dbtn/module:data_quality, dbtn/hasAuth
   * @name assess_data_quality
   * @summary Assess Data Quality
   * @request POST:/routes/data-quality/assess
   */
  export namespace assess_data_quality {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AssessDataQualityData;
  }

  /**
   * @description Get detailed information about a specific data quality issue
   * @tags dbtn/module:data_quality, dbtn/hasAuth
   * @name get_issue_details
   * @summary Get Issue Details
   * @request GET:/routes/data-quality/issues/{issue_id}
   */
  export namespace get_issue_details {
    export type RequestParams = {
      /** Issue Id */
      issueId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetIssueDetailsData;
  }

  /**
   * @description Automatically resolve resolvable issues
   * @tags dbtn/module:data_quality, dbtn/hasAuth
   * @name auto_resolve_issues
   * @summary Auto Resolve Issues
   * @request POST:/routes/data-quality/resolve-auto
   */
  export namespace auto_resolve_issues {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AutoResolveIssuesPayload;
    export type RequestHeaders = {};
    export type ResponseBody = AutoResolveIssuesData;
  }

  /**
   * @description Health check for trading journal API
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name trading_journal_health_check
   * @summary Trading Journal Health Check
   * @request GET:/routes/routes/health
   */
  export namespace trading_journal_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TradingJournalHealthCheckData;
  }

  /**
   * @description Create a new journal entry
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name create_journal_entry
   * @summary Create Journal Entry
   * @request POST:/routes/routes/entries
   */
  export namespace create_journal_entry {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateJournalEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateJournalEntryData;
  }

  /**
   * @description Get journal entries for user with pagination
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_journal_entries
   * @summary Get Journal Entries
   * @request GET:/routes/routes/entries
   */
  export namespace get_journal_entries {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 30
       */
      limit?: number;
      /**
       * Offset
       * @default 0
       */
      offset?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetJournalEntriesData;
  }

  /**
   * @description Get a specific journal entry by date
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_journal_entry_by_date
   * @summary Get Journal Entry By Date
   * @request GET:/routes/routes/entries/{entry_date}
   */
  export namespace get_journal_entry_by_date {
    export type RequestParams = {
      /** Entry Date */
      entryDate: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetJournalEntryByDateData;
  }

  /**
   * @description Update an existing journal entry
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name update_journal_entry
   * @summary Update Journal Entry
   * @request PUT:/routes/routes/entries/{entry_date}
   */
  export namespace update_journal_entry {
    export type RequestParams = {
      /** Entry Date */
      entryDate: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateJournalEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateJournalEntryData;
  }

  /**
   * @description Delete a journal entry
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name delete_journal_entry
   * @summary Delete Journal Entry
   * @request DELETE:/routes/routes/entries/{entry_date}
   */
  export namespace delete_journal_entry {
    export type RequestParams = {
      /** Entry Date */
      entryDate: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteJournalEntryData;
  }

  /**
   * @description Get all habit definitions for the user
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_habit_definitions
   * @summary Get Habit Definitions
   * @request GET:/routes/routes/habits
   */
  export namespace get_habit_definitions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHabitDefinitionsData;
  }

  /**
   * @description Create a new habit definition
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name create_habit_definition
   * @summary Create Habit Definition
   * @request POST:/routes/routes/habits
   */
  export namespace create_habit_definition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateHabitRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateHabitDefinitionData;
  }

  /**
   * @description Update an existing habit definition
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name update_habit_definition
   * @summary Update Habit Definition
   * @request PUT:/routes/routes/habits/{habit_id}
   */
  export namespace update_habit_definition {
    export type RequestParams = {
      /** Habit Id */
      habitId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateHabitRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateHabitDefinitionData;
  }

  /**
   * @description Soft delete a habit definition (mark as inactive)
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name delete_habit_definition
   * @summary Delete Habit Definition
   * @request DELETE:/routes/routes/habits/{habit_id}
   */
  export namespace delete_habit_definition {
    export type RequestParams = {
      /** Habit Id */
      habitId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteHabitDefinitionData;
  }

  /**
   * @description Get all mood definitions for the user
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_mood_definitions
   * @summary Get Mood Definitions
   * @request GET:/routes/routes/moods
   */
  export namespace get_mood_definitions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMoodDefinitionsData;
  }

  /**
   * @description Create a new mood definition
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name create_mood_definition
   * @summary Create Mood Definition
   * @request POST:/routes/routes/moods
   */
  export namespace create_mood_definition {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCustomMoodRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateMoodDefinitionData;
  }

  /**
   * @description Update an existing mood definition
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name update_mood_definition
   * @summary Update Mood Definition
   * @request PUT:/routes/routes/moods/{mood_id}
   */
  export namespace update_mood_definition {
    export type RequestParams = {
      /** Mood Id */
      moodId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateCustomMoodRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMoodDefinitionData;
  }

  /**
   * @description Soft delete a mood definition (mark as inactive)
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name delete_mood_definition
   * @summary Delete Mood Definition
   * @request DELETE:/routes/routes/moods/{mood_id}
   */
  export namespace delete_mood_definition {
    export type RequestParams = {
      /** Mood Id */
      moodId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteMoodDefinitionData;
  }

  /**
   * @description Get comprehensive streak data including streaks and calendar
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_streak_data
   * @summary Get Streak Data
   * @request GET:/routes/routes/streaks
   */
  export namespace get_streak_data {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * @default 90
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStreakDataData;
  }

  /**
   * @description Get behavioral insights based on journal entries
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_behavioral_insights
   * @summary Get Behavioral Insights
   * @request GET:/routes/routes/insights
   */
  export namespace get_behavioral_insights {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * @default 30
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBehavioralInsightsData;
  }

  /**
   * @description Get comprehensive journal analytics including trading performance
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_journal_analytics
   * @summary Get Journal Analytics
   * @request GET:/routes/routes/analytics
   */
  export namespace get_journal_analytics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * @default 30
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetJournalAnalyticsData;
  }

  /**
   * @description One-time migration to extract habit definitions from existing journal entries
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name migrate_habits_from_journals
   * @summary Migrate Habits From Journals
   * @request POST:/routes/routes/migrate-habits
   */
  export namespace migrate_habits_from_journals {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateHabitsFromJournalsData;
  }

  /**
   * @description Unified save endpoint - creates new entry or updates existing one (upsert pattern)
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name save_journal_entry
   * @summary Save Journal Entry
   * @request POST:/routes/routes/save-entry
   */
  export namespace save_journal_entry {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateJournalEntryRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SaveJournalEntryData;
  }

  /**
   * @description Edit a single trade with validation and audit trail
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name edit_trade
   * @summary Edit Trade
   * @request POST:/routes/manual-intervention/edit-trade
   */
  export namespace edit_trade {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TradeEditRequest;
    export type RequestHeaders = {};
    export type ResponseBody = EditTradeData;
  }

  /**
   * @description Edit multiple trades with the same changes
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name bulk_edit_trades
   * @summary Bulk Edit Trades
   * @request POST:/routes/manual-intervention/bulk-edit
   */
  export namespace bulk_edit_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkEditRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkEditTradesData;
  }

  /**
   * @description Manually add a new trade
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name add_manual_trade
   * @summary Add Manual Trade
   * @request POST:/routes/manual-intervention/add-trade
   */
  export namespace add_manual_trade {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ManualTradeEntry;
    export type RequestHeaders = {};
    export type ResponseBody = AddManualTradeData;
  }

  /**
   * @description Delete multiple trades
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name delete_trades
   * @summary Delete Trades
   * @request POST:/routes/manual-intervention/delete-trades
   */
  export namespace delete_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TradeDeleteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTradesData;
  }

  /**
   * @description Resolve a data conflict
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name resolve_conflict
   * @summary Resolve Conflict
   * @request POST:/routes/manual-intervention/resolve-conflict
   */
  export namespace resolve_conflict {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ConflictResolutionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ResolveConflictData;
  }

  /**
   * @description Get audit log for user's manual interventions
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name get_audit_log
   * @summary Get Audit Log
   * @request GET:/routes/manual-intervention/audit-log
   */
  export namespace get_audit_log {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAuditLogData;
  }

  /**
   * @description Backfill evaluationId for existing manual trades that don't have this field
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name backfill_evaluation_ids
   * @summary Backfill Evaluation Ids
   * @request POST:/routes/manual-intervention/backfill-evaluation-ids
   */
  export namespace backfill_evaluation_ids {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BackfillEvaluationIdsData;
  }

  /**
   * @description Health check for historical analytics system
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name historical_analytics_health_check
   * @summary Historical Analytics Health Check
   * @request GET:/routes/historical-analytics/health
   */
  export namespace historical_analytics_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HistoricalAnalyticsHealthCheckData;
  }

  /**
   * @description Track a user activity event for historical analytics
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name track_user_event
   * @summary Track User Event
   * @request POST:/routes/historical-analytics/track-event
   */
  export namespace track_user_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UserActivityEvent;
    export type RequestHeaders = {};
    export type ResponseBody = TrackUserEventData;
  }

  /**
   * @description Generate daily metrics from collected events
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name generate_daily_metrics
   * @summary Generate Daily Metrics
   * @request POST:/routes/historical-analytics/generate-daily-metrics
   */
  export namespace generate_daily_metrics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DailyStatsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateDailyMetricsData;
  }

  /**
   * @description Get historical user metrics for the specified number of days
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name get_historical_metrics
   * @summary Get Historical Metrics
   * @request GET:/routes/historical-analytics/metrics
   */
  export namespace get_historical_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days Back
       * @default 30
       */
      days_back?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHistoricalMetricsData;
  }

  /**
   * @description Initialize historical data collection and backfill recent data
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name initialize_historical_data
   * @summary Initialize Historical Data
   * @request POST:/routes/historical-analytics/initialize-historical-data
   */
  export namespace initialize_historical_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeHistoricalDataData;
  }

  /**
   * @description Clear all historical analytics data (use with caution)
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name clear_historical_data
   * @summary Clear Historical Data
   * @request DELETE:/routes/historical-analytics/clear-data
   */
  export namespace clear_historical_data {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Confirm
       * @default false
       */
      confirm?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearHistoricalDataData;
  }

  /**
   * @description Get all support categories
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_support_categories
   * @summary Get Support Categories
   * @request GET:/routes/support/categories
   */
  export namespace get_support_categories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSupportCategoriesData;
  }

  /**
   * @description Get all questions for a specific category
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_category_questions
   * @summary Get Category Questions
   * @request GET:/routes/support/categories/{category_id}/questions
   */
  export namespace get_category_questions {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCategoryQuestionsData;
  }

  /**
   * @description Search the knowledge base
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name search_knowledge_base
   * @summary Search Knowledge Base
   * @request POST:/routes/support/search
   */
  export namespace search_knowledge_base {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SearchRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SearchKnowledgeBaseData;
  }

  /**
   * @description Vote on whether a question was helpful
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name vote_helpful
   * @summary Vote Helpful
   * @request POST:/routes/support/questions/{question_id}/helpful
   */
  export namespace vote_helpful {
    export type RequestParams = {
      /** Question Id */
      questionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = HelpfulVoteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = VoteHelpfulData;
  }

  /**
   * @description Create a new support ticket and send emails
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name create_ticket
   * @summary Create Ticket
   * @request POST:/routes/support/tickets
   */
  export namespace create_ticket {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SupportTicketRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTicketData;
  }

  /**
   * @description List recent support tickets
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name list_tickets
   * @summary List Tickets
   * @request GET:/routes/support/tickets
   */
  export namespace list_tickets {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTicketsData;
  }

  /**
   * @description Get ticket details by ID
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_ticket
   * @summary Get Ticket
   * @request GET:/routes/support/tickets/{ticket_id}
   */
  export namespace get_ticket {
    export type RequestParams = {
      /** Ticket Id */
      ticketId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTicketData;
  }

  /**
   * @description Get available ticket categories
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_ticket_categories
   * @summary Get Ticket Categories
   * @request GET:/routes/support/ticket-categories
   */
  export namespace get_ticket_categories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTicketCategoriesData;
  }

  /**
   * @description Health check endpoint for discount management
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name discount_health_check
   * @summary Discount Health Check
   * @request GET:/routes/discount-management/health
   */
  export namespace discount_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiscountHealthCheckData;
  }

  /**
   * @description Create a new discount code (admin only)
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name create_discount
   * @summary Create Discount
   * @request POST:/routes/discount-management/discounts
   */
  export namespace create_discount {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DiscountCreateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateDiscountData;
  }

  /**
   * @description List all discount codes (admin only)
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name list_discounts
   * @summary List Discounts
   * @request GET:/routes/discount-management/discounts
   */
  export namespace list_discounts {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Active Only
       * @default false
       */
      active_only?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListDiscountsData;
  }

  /**
   * @description Get a specific discount by ID (admin only)
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name get_discount
   * @summary Get Discount
   * @request GET:/routes/discount-management/discounts/{discount_id}
   */
  export namespace get_discount {
    export type RequestParams = {
      /** Discount Id */
      discountId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDiscountData;
  }

  /**
   * @description Update a discount code (admin only)
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name update_discount
   * @summary Update Discount
   * @request PUT:/routes/discount-management/discounts/{discount_id}
   */
  export namespace update_discount {
    export type RequestParams = {
      /** Discount Id */
      discountId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = DiscountUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateDiscountData;
  }

  /**
   * @description Delete a discount code (admin only)
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name delete_discount
   * @summary Delete Discount
   * @request DELETE:/routes/discount-management/discounts/{discount_id}
   */
  export namespace delete_discount {
    export type RequestParams = {
      /** Discount Id */
      discountId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteDiscountData;
  }

  /**
   * @description Apply and validate a discount code for a customer
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name apply_discount
   * @summary Apply Discount
   * @request POST:/routes/discount-management/apply-discount
   */
  export namespace apply_discount {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ApplyDiscountRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ApplyDiscountData;
  }

  /**
   * @description Get discount usage analytics (admin only)
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name get_discount_analytics
   * @summary Get Discount Analytics
   * @request GET:/routes/discount-management/analytics
   */
  export namespace get_discount_analytics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDiscountAnalyticsData;
  }

  /**
   * @description Get comprehensive infrastructure health status. Requires authentication to prevent abuse.
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name get_infrastructure_health
   * @summary Get Infrastructure Health
   * @request GET:/routes/infrastructure/health
   */
  export namespace get_infrastructure_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInfrastructureHealthData;
  }

  /**
   * @description Get statistics on recent subscription verification failures. Requires authentication to protect sensitive monitoring data.
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name get_subscription_failure_stats
   * @summary Get Subscription Failure Stats
   * @request GET:/routes/infrastructure/subscription-failures
   */
  export namespace get_subscription_failure_stats {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * @default 24
       */
      hours?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSubscriptionFailureStatsData;
  }

  /**
   * @description Log a subscription verification failure for monitoring. Used by the frontend when retries are exhausted.
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name log_subscription_failure
   * @summary Log Subscription Failure
   * @request POST:/routes/infrastructure/log-subscription-failure
   */
  export namespace log_subscription_failure {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogFailureRequest;
    export type RequestHeaders = {};
    export type ResponseBody = LogSubscriptionFailureData;
  }

  /**
   * @description Public health check endpoint for load balancers and monitoring. Returns basic system status without sensitive details.
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name get_system_health
   * @summary Get System Health
   * @request GET:/routes/infrastructure/system-health
   */
  export namespace get_system_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSystemHealthData;
  }

  /**
   * @description Get comprehensive billing information for the current user
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name get_user_billing_info
   * @summary Get User Billing Info
   * @request GET:/routes/user-billing/info
   */
  export namespace get_user_billing_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserBillingInfoData;
  }

  /**
   * @description Create and return Stripe Customer Portal URL for subscription management
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name get_customer_portal_url
   * @summary Get Customer Portal Url
   * @request GET:/routes/user-billing/customer-portal
   */
  export namespace get_customer_portal_url {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerPortalUrlData;
  }

  /**
   * @description Get current usage statistics and limits for the user
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name get_usage_info
   * @summary Get Usage Info
   * @request GET:/routes/user-billing/usage
   */
  export namespace get_usage_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUsageInfoData;
  }

  /**
   * @description Cancel user's subscription at period end
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name cancel_subscription
   * @summary Cancel Subscription
   * @request POST:/routes/user-billing/cancel-subscription
   */
  export namespace cancel_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CancelSubscriptionData;
  }

  /**
   * @description Reactivate a subscription that was scheduled for cancellation
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name reactivate_subscription
   * @summary Reactivate Subscription
   * @request POST:/routes/user-billing/reactivate-subscription
   */
  export namespace reactivate_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ReactivateSubscriptionData;
  }

  /**
   * No description
   * @tags dbtn/module:repair_trades_simple, dbtn/hasAuth
   * @name test_endpoint
   * @summary Test Endpoint
   * @request GET:/routes/repair-trades-simple/test
   */
  export namespace test_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestEndpointData;
  }

  /**
   * @description Simple repair for the specific user with missing datetime fields
   * @tags dbtn/module:repair_trades_simple, dbtn/hasAuth
   * @name repair_user_trades
   * @summary Repair User Trades
   * @request POST:/routes/repair-trades-simple/repair-user-trades
   */
  export namespace repair_user_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RepairUserTradesData;
  }

  /**
   * @description Health check for prop firm management system
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name prop_firm_health_check
   * @summary Prop Firm Health Check
   * @request GET:/routes/prop-firms/health
   */
  export namespace prop_firm_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PropFirmHealthCheckData;
  }

  /**
   * @description Get list of available prop firms and user's current selection
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name get_available_prop_firms
   * @summary Get Available Prop Firms
   * @request GET:/routes/prop-firms/list
   */
  export namespace get_available_prop_firms {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailablePropFirmsData;
  }

  /**
   * @description Set user's prop firm preference
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name set_user_prop_firm_preference
   * @summary Set User Prop Firm Preference
   * @request POST:/routes/prop-firms/set-preference
   */
  export namespace set_user_prop_firm_preference {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PropFirmPreferenceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetUserPropFirmPreferenceData;
  }

  /**
   * @description Get detailed commission information for a specific prop firm
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name get_prop_firm_commission_info
   * @summary Get Prop Firm Commission Info
   * @request GET:/routes/prop-firms/commission-info/{prop_firm}
   */
  export namespace get_prop_firm_commission_info {
    export type RequestParams = {
      /** Prop Firm */
      propFirm: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPropFirmCommissionInfoData;
  }

  /**
   * @description Calculate commission cost for a specific trade
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name calculate_commission_cost
   * @summary Calculate Commission Cost
   * @request POST:/routes/prop-firms/calculate-commission
   */
  export namespace calculate_commission_cost {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CommissionCalculationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateCommissionCostData;
  }

  /**
   * @description Get user's current prop firm preference and commission info
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name get_user_prop_firm_preference
   * @summary Get User Prop Firm Preference
   * @request GET:/routes/prop-firms/user-preference
   */
  export namespace get_user_prop_firm_preference {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserPropFirmPreferenceData;
  }

  /**
   * @description Basic unauthenticated health check endpoint for monitoring
   * @tags dbtn/module:health_check, dbtn/hasAuth
   * @name basic_health_check
   * @summary Basic Health Check
   * @request GET:/routes/health/check
   */
  export namespace basic_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BasicHealthCheckData;
  }

  /**
   * @description Simple ping endpoint
   * @tags dbtn/module:health_check, dbtn/hasAuth
   * @name ping
   * @summary Ping
   * @request GET:/routes/health/ping
   */
  export namespace ping {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PingData;
  }

  /**
   * @description Preview what would be migrated — no writes to Firestore.
   * @tags migration, dbtn/module:journal_migration, dbtn/hasAuth
   * @name migration_dry_run
   * @summary Migration Dry Run
   * @request POST:/routes/journal-migration/dry-run
   */
  export namespace migration_dry_run {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrationDryRunData;
  }

  /**
   * @description Execute the migration — write all journal data from Riff storage to Firestore.
   * @tags migration, dbtn/module:journal_migration, dbtn/hasAuth
   * @name migration_execute
   * @summary Migration Execute
   * @request POST:/routes/journal-migration/execute
   */
  export namespace migration_execute {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrationExecuteData;
  }

  /**
   * @description Compare record counts between Riff storage and Firestore.
   * @tags migration, dbtn/module:journal_migration, dbtn/hasAuth
   * @name migration_status
   * @summary Migration Status
   * @request GET:/routes/journal-migration/status
   */
  export namespace migration_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrationStatusData;
  }

  /**
   * @description Get user's trades for public dashboard (no auth required)
   * @tags dbtn/module:public_data, dbtn/hasAuth
   * @name get_user_trades
   * @summary Get User Trades
   * @request GET:/routes/public-data/trades/{user_id}
   */
  export namespace get_user_trades {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserTradesData;
  }

  /**
   * @description Get user's evaluations for public dashboard (no auth required)
   * @tags dbtn/module:public_data, dbtn/hasAuth
   * @name get_user_evaluations
   * @summary Get User Evaluations
   * @request GET:/routes/public-data/evaluations/{user_id}
   */
  export namespace get_user_evaluations {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserEvaluationsData;
  }

  /**
   * @description Get user's journal entries for public dashboard (no auth required)
   * @tags dbtn/module:public_data, dbtn/hasAuth
   * @name get_user_journal_entries
   * @summary Get User Journal Entries
   * @request GET:/routes/public-data/journal/{user_id}
   */
  export namespace get_user_journal_entries {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserJournalEntriesData;
  }

  /**
   * @description Get current week's intentions
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name get_current_weekly_intentions
   * @summary Get Current Weekly Intentions
   * @request GET:/routes/weekly-intentions/current
   */
  export namespace get_current_weekly_intentions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentWeeklyIntentionsData;
  }

  /**
   * @description Create or update current week's intentions (only allowed on Sunday)
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name create_or_update_current_weekly_intentions
   * @summary Create Or Update Current Weekly Intentions
   * @request POST:/routes/weekly-intentions/current
   */
  export namespace create_or_update_current_weekly_intentions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateWeeklyIntentionsRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateOrUpdateCurrentWeeklyIntentionsData;
  }

  /**
   * @description Get all weekly intentions (current and archived)
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name get_weekly_intentions_history
   * @summary Get Weekly Intentions History
   * @request GET:/routes/weekly-intentions/history
   */
  export namespace get_weekly_intentions_history {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWeeklyIntentionsHistoryData;
  }

  /**
   * @description Manually trigger Sunday reset (archives previous weeks)
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name trigger_sunday_reset
   * @summary Trigger Sunday Reset
   * @request POST:/routes/weekly-intentions/sunday-reset
   */
  export namespace trigger_sunday_reset {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TriggerSundayResetData;
  }

  /**
   * @description Health check for weekly intentions API
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name weekly_intentions_health_check
   * @summary Weekly Intentions Health Check
   * @request GET:/routes/weekly-intentions/health
   */
  export namespace weekly_intentions_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = WeeklyIntentionsHealthCheckData;
  }

  /**
   * @description Store user preference for Pro tier notifications and discount eligibility
   * @tags dbtn/module:pro_notifications, dbtn/hasAuth
   * @name signup_for_pro_notifications
   * @summary Signup For Pro Notifications
   * @request POST:/routes/pro-notifications/signup
   */
  export namespace signup_for_pro_notifications {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProNotificationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SignupForProNotificationsData;
  }

  /**
   * @description Check if user has already signed up for Pro notifications
   * @tags dbtn/module:pro_notifications, dbtn/hasAuth
   * @name check_notification_preference
   * @summary Check Notification Preference
   * @request GET:/routes/pro-notifications/check/{user_id}
   */
  export namespace check_notification_preference {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckNotificationPreferenceData;
  }

  /**
   * @description Get Pro waitlist statistics (admin only for now)
   * @tags dbtn/module:pro_notifications, dbtn/hasAuth
   * @name get_waitlist_stats
   * @summary Get Waitlist Stats
   * @request GET:/routes/pro-notifications/stats
   */
  export namespace get_waitlist_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWaitlistStatsData;
  }

  /**
   * @description Global OPTIONS handler for all CORS preflight requests
   * @tags dbtn/module:global_cors, dbtn/hasAuth
   * @name global_options_handler
   * @summary Global Options Handler
   * @request OPTIONS:/routes/{full_path}
   */
  export namespace global_options_handler {
    export type RequestParams = {
      /** Full Path */
      fullPath: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GlobalOptionsHandlerData;
  }

  /**
   * @description Detect corrupted journal entries for the current user
   * @tags dbtn/module:journal_cleanup, dbtn/hasAuth
   * @name detect_corrupted_entries
   * @summary Detect Corrupted Entries
   * @request GET:/routes/detect-corrupted-entries
   */
  export namespace detect_corrupted_entries {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DetectCorruptedEntriesData;
  }

  /**
   * @description Clean up corrupted journal entries by removing them and creating backups
   * @tags dbtn/module:journal_cleanup, dbtn/hasAuth
   * @name cleanup_corrupted_entries
   * @summary Cleanup Corrupted Entries
   * @request POST:/routes/cleanup-corrupted-entries
   */
  export namespace cleanup_corrupted_entries {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CleanupCorruptedEntriesData;
  }

  /**
   * @description Download the TradingBait technical assessment PDF.
   * @tags dbtn/module:pdf_export, dbtn/hasAuth
   * @name download_technical_assessment
   * @summary Download Technical Assessment
   * @request GET:/routes/pdf/technical-assessment
   */
  export namespace download_technical_assessment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DownloadTechnicalAssessmentData;
  }

  /**
   * @description Health check for review automation API
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name review_automation_health_check
   * @summary Review Automation Health Check
   * @request GET:/routes/review-automation/health
   */
  export namespace review_automation_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ReviewAutomationHealthCheckData;
  }

  /**
   * @description Check if any reviews are due for the user
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name check_reviews
   * @summary Check Reviews
   * @request POST:/routes/review-automation/check
   */
  export namespace check_reviews {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckReviewsData;
  }

  /**
   * @description Manually trigger review checks and automation
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name trigger_reviews
   * @summary Trigger Reviews
   * @request POST:/routes/review-automation/trigger
   */
  export namespace trigger_reviews {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TriggerReviewsData;
  }

  /**
   * @description Manually trigger weekly review
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name trigger_weekly_review_endpoint
   * @summary Trigger Weekly Review Endpoint
   * @request POST:/routes/review-automation/trigger/weekly
   */
  export namespace trigger_weekly_review_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TriggerWeeklyReviewEndpointData;
  }

  /**
   * @description Manually trigger monthly review
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name trigger_monthly_review_endpoint
   * @summary Trigger Monthly Review Endpoint
   * @request POST:/routes/review-automation/trigger/monthly
   */
  export namespace trigger_monthly_review_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TriggerMonthlyReviewEndpointData;
  }

  /**
   * @description Get user's review schedule and history
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name get_review_schedule
   * @summary Get Review Schedule
   * @request GET:/routes/review-automation/schedule
   */
  export namespace get_review_schedule {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetReviewScheduleData;
  }

  /**
   * @description Health check for affiliate system
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name affiliate_system_health_check
   * @summary Affiliate System Health Check
   * @request GET:/routes/affiliate/health
   */
  export namespace affiliate_system_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AffiliateSystemHealthCheckData;
  }

  /**
   * @description Register a new affiliate
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name register_affiliate
   * @summary Register Affiliate
   * @request POST:/routes/affiliate/register
   */
  export namespace register_affiliate {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AffiliateRegistrationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RegisterAffiliateData;
  }

  /**
   * @description Get affiliate profile and analytics
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name get_affiliate_profile
   * @summary Get Affiliate Profile
   * @request GET:/routes/affiliate/profile
   */
  export namespace get_affiliate_profile {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAffiliateProfileData;
  }

  /**
   * @description Generate a new referral link for affiliate
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name generate_referral_link
   * @summary Generate Referral Link
   * @request POST:/routes/affiliate/generate-link
   */
  export namespace generate_referral_link {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ReferralLinkRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateReferralLinkData;
  }

  /**
   * @description Get detailed earnings information for affiliate
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name get_affiliate_earnings
   * @summary Get Affiliate Earnings
   * @request GET:/routes/affiliate/earnings
   */
  export namespace get_affiliate_earnings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAffiliateEarningsData;
  }

  /**
   * @description Track when a referred user signs up (called during user registration)
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name track_referral_signup
   * @summary Track Referral Signup
   * @request POST:/routes/affiliate/track-signup
   */
  export namespace track_referral_signup {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Referred User Id */
      referred_user_id: string;
      /** Referred Email */
      referred_email: string;
      /** Referral Code */
      referral_code?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TrackReferralSignupData;
  }

  /**
   * @description Track when a referred user converts to paid subscription
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name track_referral_conversion
   * @summary Track Referral Conversion
   * @request POST:/routes/affiliate/track-conversion
   */
  export namespace track_referral_conversion {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
      /** Subscription Id */
      subscription_id: string;
      /** Payment Amount */
      payment_amount: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TrackReferralConversionData;
  }

  /**
   * @description Get feature unlock status based on user activity
   * @tags dbtn/module:feature_unlock, dbtn/hasAuth
   * @name get_feature_unlock_status
   * @summary Get Feature Unlock Status
   * @request GET:/routes/feature-unlock-status
   */
  export namespace get_feature_unlock_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFeatureUnlockStatusData;
  }

  /**
   * @description Handle Stripe webhook events
   * @tags dbtn/module:stripe_webhooks, dbtn/hasAuth
   * @name stripe_webhook_handler
   * @summary Stripe Webhook Handler
   * @request POST:/routes/stripe-webhooks/webhook
   */
  export namespace stripe_webhook_handler {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Stripe-Signature */
      "stripe-signature"?: string;
    };
    export type ResponseBody = StripeWebhookHandlerData;
  }

  /**
   * @description Health check for webhook system
   * @tags dbtn/module:stripe_webhooks, dbtn/hasAuth
   * @name webhook_health_check
   * @summary Webhook Health Check
   * @request GET:/routes/stripe-webhooks/health
   */
  export namespace webhook_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = WebhookHealthCheckData;
  }

  /**
   * @description Get performance analytics for the specified time period
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_performance_metrics
   * @summary Get Performance Metrics
   * @request GET:/routes/analytics/performance
   */
  export namespace get_performance_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * @min 1
       * @max 168
       * @default 24
       */
      hours?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPerformanceMetricsData;
  }

  /**
   * @description Get real-time performance statistics
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_realtime_stats
   * @summary Get Realtime Stats
   * @request GET:/routes/analytics/realtime
   */
  export namespace get_realtime_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealtimeStatsData;
  }

  /**
   * @description Get error reports from the specified time period
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_error_reports
   * @summary Get Error Reports
   * @request GET:/routes/analytics/errors
   */
  export namespace get_error_reports {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * @min 1
       * @max 168
       * @default 24
       */
      hours?: number;
      /** Severity */
      severity?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetErrorReportsData;
  }

  /**
   * @description Get user behavior analytics
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_user_analytics
   * @summary Get User Analytics
   * @request GET:/routes/analytics/user-analytics
   */
  export namespace get_user_analytics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * @min 1
       * @max 168
       * @default 24
       */
      hours?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserAnalyticsData;
  }

  /**
   * @description Get system health metrics
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_analytics_system_health
   * @summary Get Analytics System Health
   * @request GET:/routes/analytics/health
   */
  export namespace get_analytics_system_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAnalyticsSystemHealthData;
  }

  /**
   * @description Track a user event for analytics
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name track_analytics_user_event
   * @summary Track Analytics User Event
   * @request POST:/routes/analytics/track-event
   */
  export namespace track_analytics_user_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrackingEvent;
    export type RequestHeaders = {};
    export type ResponseBody = TrackAnalyticsUserEventData;
  }

  /**
   * @description Migrate all journal data to unified format
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name migrate_journal_data_endpoint
   * @summary Migrate Journal Data Endpoint
   * @request POST:/routes/migration/migrate-journal-data
   */
  export namespace migrate_journal_data_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateJournalDataEndpointData;
  }

  /**
   * @description Migrate journal data for the authenticated user only
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name migrate_user_data_endpoint
   * @summary Migrate User Data Endpoint
   * @request POST:/routes/migration/migrate-user-data
   */
  export namespace migrate_user_data_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateUserDataEndpointData;
  }

  /**
   * @description Clean up legacy storage files (admin only)
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name cleanup_legacy_storage_endpoint
   * @summary Cleanup Legacy Storage Endpoint
   * @request POST:/routes/migration/cleanup-legacy-storage
   */
  export namespace cleanup_legacy_storage_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Dry Run
       * @default true
       */
      dry_run?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CleanupLegacyStorageEndpointData;
  }

  /**
   * @description Get status of migration for the current user
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name get_migration_status
   * @summary Get Migration Status
   * @request GET:/routes/migration/migration-status
   */
  export namespace get_migration_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMigrationStatusData;
  }

  /**
   * @description Create a new weekly review
   * @tags dbtn/module:weekly_reviews, dbtn/hasAuth
   * @name create_weekly_review
   * @summary Create Weekly Review
   * @request POST:/routes/weekly-reviews
   */
  export namespace create_weekly_review {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WeeklyReviewCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateWeeklyReviewData;
  }

  /**
   * @description List all weekly reviews for a user with pagination
   * @tags dbtn/module:weekly_reviews, dbtn/hasAuth
   * @name list_weekly_reviews
   * @summary List Weekly Reviews
   * @request GET:/routes/weekly-reviews
   */
  export namespace list_weekly_reviews {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page
       * @default 1
       */
      page?: number;
      /**
       * Limit
       * @default 10
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListWeeklyReviewsData;
  }

  /**
   * @description Get a specific weekly review with daily summaries and chart images
   * @tags dbtn/module:weekly_reviews, dbtn/hasAuth
   * @name get_weekly_review
   * @summary Get Weekly Review
   * @request GET:/routes/weekly-reviews/{review_id}
   */
  export namespace get_weekly_review {
    export type RequestParams = {
      /** Review Id */
      reviewId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWeeklyReviewData;
  }

  /**
   * @description Serve light theme favicon
   * @tags dbtn/module:static_assets
   * @name get_light_favicon
   * @summary Get Light Favicon
   * @request GET:/routes/light.ico
   */
  export namespace get_light_favicon {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLightFaviconData;
  }

  /**
   * @description Serve dark theme favicon
   * @tags dbtn/module:static_assets
   * @name get_dark_favicon
   * @summary Get Dark Favicon
   * @request GET:/routes/dark.ico
   */
  export namespace get_dark_favicon {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDarkFaviconData;
  }

  /**
   * @description Serve favicon.ico file
   * @tags dbtn/module:static_assets
   * @name get_favicon_ico
   * @summary Get Favicon Ico
   * @request GET:/routes/favicon.ico
   */
  export namespace get_favicon_ico {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFaviconIcoData;
  }

  /**
   * @description Repair trades that are missing openTime/closeTime by extracting from raw_row_data
   * @tags dbtn/module:repair_trades, dbtn/hasAuth
   * @name repair_trades_datetime
   * @summary Repair Trades Datetime
   * @request POST:/routes/repair-trades
   */
  export namespace repair_trades_datetime {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RepairTradesRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RepairTradesDatetimeData;
  }

  /**
   * @description Extract the first trade that AI used for column mapping but didn't import
   * @tags dbtn/module:repair_trades, dbtn/hasAuth
   * @name extract_missing_first_trade
   * @summary Extract Missing First Trade
   * @request POST:/routes/extract-missing-first-trade
   */
  export namespace extract_missing_first_trade {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExtractMissingFirstTradeData;
  }

  /**
   * @description Analyze and group trades using multiple strategies
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name analyze_trades
   * @summary Analyze Trades
   * @request POST:/routes/trade-grouping/analyze-trades
   */
  export namespace analyze_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GroupingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeTradesData;
  }

  /**
   * @description Get stored grouping results for a user
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name get_user_groups
   * @summary Get User Groups
   * @request GET:/routes/trade-grouping/user-groups/{user_id}
   */
  export namespace get_user_groups {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {
      /**
       * Limit
       * @min 1
       * @max 200
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserGroupsData;
  }

  /**
   * @description Perform detailed analysis on specific trade groups
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name analyze_groups
   * @summary Analyze Groups
   * @request POST:/routes/trade-grouping/analyze-groups
   */
  export namespace analyze_groups {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GroupAnalysisRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeGroupsData;
  }

  /**
   * @description Get available grouping strategies and their descriptions
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name get_available_strategies
   * @summary Get Available Strategies
   * @request GET:/routes/trade-grouping/strategies
   */
  export namespace get_available_strategies {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailableStrategiesData;
  }

  /**
   * @description Health check for trade grouping service
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name grouping_health_check
   * @summary Grouping Health Check
   * @request GET:/routes/trade-grouping/health
   */
  export namespace grouping_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GroupingHealthCheckData;
  }

  /**
   * @description Check CORS configuration status
   * @tags dbtn/module:global_cors, dbtn/hasAuth
   * @name cors_status
   * @summary Cors Status
   * @request GET:/routes/cors-status
   */
  export namespace cors_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CorsStatusData;
  }

  /**
   * @description Initialize a new user in Firestore and our storage systems
   * @tags dbtn/module:user_initialization, dbtn/hasAuth
   * @name initialize_user
   * @summary Initialize User
   * @request POST:/routes/user-initialization/initialize-user
   */
  export namespace initialize_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UserInitializationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = InitializeUserData;
  }

  /**
   * @description Auto-initialize the current authenticated user
   * @tags dbtn/module:user_initialization, dbtn/hasAuth
   * @name auto_initialize_user
   * @summary Auto Initialize User
   * @request POST:/routes/user-initialization/auto-initialize
   */
  export namespace auto_initialize_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AutoInitializeUserData;
  }

  /**
   * @description Health check for user initialization system
   * @tags dbtn/module:user_initialization, dbtn/hasAuth
   * @name user_initialization_health_check
   * @summary User Initialization Health Check
   * @request GET:/routes/user-initialization/health
   */
  export namespace user_initialization_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = UserInitializationHealthCheckData;
  }

  /**
   * @description Send welcome email to new users after signup
   * @tags dbtn/module:welcome_email, dbtn/hasAuth
   * @name send_welcome_email
   * @summary Send Welcome Email
   * @request POST:/routes/send-welcome-email
   */
  export namespace send_welcome_email {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WelcomeEmailRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendWelcomeEmailData;
  }

  /**
   * @description Serve favicon PNG files (16x16, 32x32)
   * @tags dbtn/module:static_assets
   * @name get_favicon_png
   * @summary Get Favicon Png
   * @request GET:/routes/favicon-{size}.png
   */
  export namespace get_favicon_png {
    export type RequestParams = {
      /** Size */
      size: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFaviconPngData;
  }

  /**
   * @description Serve Apple Touch Icon (180x180)
   * @tags dbtn/module:static_assets
   * @name get_apple_touch_icon
   * @summary Get Apple Touch Icon
   * @request GET:/routes/apple-touch-icon.png
   */
  export namespace get_apple_touch_icon {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAppleTouchIconData;
  }

  /**
   * @description Serve logo files in various sizes and formats
   * @tags dbtn/module:static_assets
   * @name get_logo
   * @summary Get Logo
   * @request GET:/routes/logo-{size}.{format}
   */
  export namespace get_logo {
    export type RequestParams = {
      /** Size */
      size: string;
      /** Format */
      format: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLogoData;
  }

  /**
   * @description Serve Open Graph image (1200x630)
   * @tags dbtn/module:static_assets
   * @name get_og_image
   * @summary Get Og Image
   * @request GET:/routes/og-image.png
   */
  export namespace get_og_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOgImageData;
  }

  /**
   * @description Serve Twitter card image (1200x675)
   * @tags dbtn/module:static_assets
   * @name get_twitter_image
   * @summary Get Twitter Image
   * @request GET:/routes/twitter-image.png
   */
  export namespace get_twitter_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTwitterImageData;
  }

  /**
   * @description Serve main logo (512x512)
   * @tags dbtn/module:static_assets
   * @name get_main_logo
   * @summary Get Main Logo
   * @request GET:/routes/logo.png
   */
  export namespace get_main_logo {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMainLogoData;
  }

  /**
   * @description Handle early access email signup with duplicate prevention and confirmation email.
   * @tags dbtn/module:early_access_signup, dbtn/hasAuth
   * @name early_access_signup
   * @summary Early Access Signup
   * @request POST:/routes/early-access-signup
   */
  export namespace early_access_signup {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EarlyAccessSignupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = EarlyAccessSignupData;
  }

  /**
   * @description Get early access signup statistics (for admin use).
   * @tags dbtn/module:early_access_signup, dbtn/hasAuth
   * @name get_early_access_stats
   * @summary Get Early Access Stats
   * @request GET:/routes/early-access-stats
   */
  export namespace get_early_access_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEarlyAccessStatsData;
  }

  /**
   * @description Upload chart screenshot or other trading-related images
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name upload_image
   * @summary Upload Image
   * @request POST:/routes/image-upload/upload
   */
  export namespace upload_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadImage;
    export type RequestHeaders = {};
    export type ResponseBody = UploadImageData;
  }

  /**
   * @description Retrieve an uploaded image
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name get_image
   * @summary Get Image
   * @request GET:/routes/image-upload/image/{image_id}
   */
  export namespace get_image {
    export type RequestParams = {
      /** Image Id */
      imageId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetImageData;
  }

  /**
   * @description Delete an uploaded image
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name delete_image
   * @summary Delete Image
   * @request DELETE:/routes/image-upload/image/{image_id}
   */
  export namespace delete_image {
    export type RequestParams = {
      /** Image Id */
      imageId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteImageData;
  }

  /**
   * @description List all images uploaded by the user
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name list_user_images
   * @summary List User Images
   * @request GET:/routes/image-upload/list
   */
  export namespace list_user_images {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListUserImagesData;
  }

  /**
   * @description Create a withdrawal request for funded accounts. Immediate processing - no approval workflow.
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name create_withdrawal
   * @summary Create Withdrawal
   * @request POST:/routes/withdrawals
   */
  export namespace create_withdrawal {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WithdrawalRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateWithdrawalData;
  }

  /**
   * @description Delete a withdrawal transaction and restore the amount to evaluation balance. Only allows deletion of recent transactions (within 48 hours).
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name delete_withdrawal
   * @summary Delete Withdrawal
   * @request DELETE:/routes/withdrawals/{transaction_id}
   */
  export namespace delete_withdrawal {
    export type RequestParams = {
      /** Transaction Id */
      transactionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteWithdrawalData;
  }

  /**
   * @description Create a refund for evaluation costs. Immediate processing - no approval workflow. Impacts business P&L as cost mitigation.
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name create_refund
   * @summary Create Refund
   * @request POST:/routes/refunds
   */
  export namespace create_refund {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RefundRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateRefundData;
  }

  /**
   * @description Delete a refund transaction and remove it from evaluation transactions. Only allows deletion of recent transactions (within 48 hours).
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name delete_refund
   * @summary Delete Refund
   * @request DELETE:/routes/refunds/{transaction_id}
   */
  export namespace delete_refund {
    export type RequestParams = {
      /** Transaction Id */
      transactionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteRefundData;
  }

  /**
   * @description Get transaction history for user. Optional filtering by transaction type (withdrawal, refund, deposit).
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name get_transaction_history
   * @summary Get Transaction History
   * @request GET:/routes/transactions
   */
  export namespace get_transaction_history {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Transaction Type */
      transaction_type?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTransactionHistoryData;
  }

  /**
   * @description Get specific transaction details.
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name get_transaction
   * @summary Get Transaction
   * @request GET:/routes/transactions/{transaction_id}
   */
  export namespace get_transaction {
    export type RequestParams = {
      /** Transaction Id */
      transactionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTransactionData;
  }

  /**
   * @description Get financial summary showing business impact of withdrawals and refunds.
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name get_financial_summary
   * @summary Get Financial Summary
   * @request GET:/routes/financial-summary
   */
  export namespace get_financial_summary {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Period
       * @default "monthly"
       */
      period?: string;
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFinancialSummaryData;
  }

  /**
   * @description Perform comprehensive pattern analysis using advanced AI recognition
   * @tags dbtn/module:comprehensive_pattern_analysis, dbtn/hasAuth
   * @name comprehensive_pattern_analysis_standalone
   * @summary Comprehensive Pattern Analysis Standalone
   * @request POST:/routes/comprehensive-pattern-analysis
   */
  export namespace comprehensive_pattern_analysis_standalone {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PatternAnalysisRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ComprehensivePatternAnalysisStandaloneData;
  }

  /**
   * @description Health check for pattern recognition system
   * @tags dbtn/module:comprehensive_pattern_analysis, dbtn/hasAuth
   * @name pattern_recognition_health
   * @summary Pattern Recognition Health
   * @request GET:/routes/pattern-recognition-health
   */
  export namespace pattern_recognition_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PatternRecognitionHealthData;
  }

  /**
   * @description Calculate FIFO P&L for trades with optional grouping
   * @tags dbtn/module:fifo_calculation, dbtn/hasAuth
   * @name calculate_fifo_for_trades
   * @summary Calculate Fifo For Trades
   * @request POST:/routes/calculate-fifo
   */
  export namespace calculate_fifo_for_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FifoCalculationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateFifoForTradesData;
  }

  /**
   * @description Get all early access signups (admin only)
   * @tags dbtn/module:admin_early_access, dbtn/hasAuth
   * @name get_early_access_signups
   * @summary Get Early Access Signups
   * @request GET:/routes/admin/early-access/signups
   */
  export namespace get_early_access_signups {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEarlyAccessSignupsData;
  }

  /**
   * @description Export early access signups as CSV data (admin only)
   * @tags dbtn/module:admin_early_access, dbtn/hasAuth
   * @name export_early_access_signups
   * @summary Export Early Access Signups
   * @request POST:/routes/admin/early-access/export
   */
  export namespace export_early_access_signups {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportEarlyAccessSignupsData;
  }

  /**
   * @description Manually mark an email as confirmed (admin only)
   * @tags dbtn/module:admin_early_access, dbtn/hasAuth
   * @name mark_signup_confirmed
   * @summary Mark Signup Confirmed
   * @request POST:/routes/admin/early-access/mark-confirmed/{email}
   */
  export namespace mark_signup_confirmed {
    export type RequestParams = {
      /** Email */
      email: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MarkSignupConfirmedData;
  }

  /**
   * @description Health check for subscription audit system
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name subscription_audit_health_check
   * @summary Subscription Audit Health Check
   * @request GET:/routes/subscription-audit/health
   */
  export namespace subscription_audit_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SubscriptionAuditHealthCheckData;
  }

  /**
   * @description Audit subscription data for a single user
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name audit_single_user
   * @summary Audit Single User
   * @request POST:/routes/subscription-audit/audit-user
   */
  export namespace audit_single_user {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Email */
      user_email: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AuditSingleUserData;
  }

  /**
   * @description Audit all users known to have missing subscriptions
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name audit_missing_users
   * @summary Audit Missing Users
   * @request POST:/routes/subscription-audit/audit-missing-users
   */
  export namespace audit_missing_users {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AuditMissingUsersData;
  }

  /**
   * @description Restore missing subscription record for a user
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name restore_subscription
   * @summary Restore Subscription
   * @request POST:/routes/subscription-audit/restore-subscription
   */
  export namespace restore_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SubscriptionRestoreRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RestoreSubscriptionData;
  }

  /**
   * @description Create a new manual trade entry with rich metadata
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name create_manual_trade
   * @summary Create Manual Trade
   * @request POST:/routes/manual-trades/create
   */
  export namespace create_manual_trade {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ManualTradeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateManualTradeData;
  }

  /**
   * @description Get tag suggestions based on user's previous tag usage
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name get_tag_suggestions
   * @summary Get Tag Suggestions
   * @request GET:/routes/manual-trades/tag-suggestions
   */
  export namespace get_tag_suggestions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTagSuggestionsData;
  }

  /**
   * @description Update an existing manual trade
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name update_manual_trade
   * @summary Update Manual Trade
   * @request PUT:/routes/manual-trades/update/{trade_id}
   */
  export namespace update_manual_trade {
    export type RequestParams = {
      /** Trade Id */
      tradeId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ManualTradeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateManualTradeData;
  }

  /**
   * @description Delete a manual trade
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name delete_manual_trade
   * @summary Delete Manual Trade
   * @request DELETE:/routes/manual-trades/delete/{trade_id}
   */
  export namespace delete_manual_trade {
    export type RequestParams = {
      /** Trade Id */
      tradeId: string;
    };
    export type RequestQuery = {
      /** Evaluation Id */
      evaluation_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteManualTradeData;
  }

  /**
   * @description Register user for AI Coach launch notifications
   * @tags dbtn/module:ai_coach_notifications, dbtn/hasAuth
   * @name signup_for_ai_coach_notifications
   * @summary Signup For Ai Coach Notifications
   * @request POST:/routes/ai-coach-notifications/signup
   */
  export namespace signup_for_ai_coach_notifications {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NotificationSignupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SignupForAiCoachNotificationsData;
  }

  /**
   * @description Get statistics about AI Coach notification signups
   * @tags dbtn/module:ai_coach_notifications, dbtn/hasAuth
   * @name get_notification_stats
   * @summary Get Notification Stats
   * @request GET:/routes/ai-coach-notifications/stats
   */
  export namespace get_notification_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetNotificationStatsData;
  }

  /**
   * @description Export user's personal data in compliance with GDPR Article 15 (Right of access)
   * @tags dbtn/module:gdpr_compliance, dbtn/hasAuth
   * @name export_personal_data
   * @summary Export Personal Data
   * @request POST:/routes/export-personal-data
   */
  export namespace export_personal_data {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DataExportRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ExportPersonalDataData;
  }

  /**
   * @description Delete user account with smart data anonymization in compliance with GDPR Article 17 (Right to erasure)
   * @tags dbtn/module:gdpr_compliance, dbtn/hasAuth
   * @name delete_account
   * @summary Delete Account
   * @request POST:/routes/delete-account
   */
  export namespace delete_account {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AccountDeletionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteAccountData;
  }

  /**
   * @description Get information about what data is stored and retention policies
   * @tags dbtn/module:gdpr_compliance, dbtn/hasAuth
   * @name get_data_retention_info
   * @summary Get Data Retention Info
   * @request GET:/routes/data-retention-info
   */
  export namespace get_data_retention_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDataRetentionInfoData;
  }

  /**
   * @description Delete ALL trades for the user - both within evaluations and orphaned trades
   * @tags dbtn/module:trade_management, dbtn/hasAuth
   * @name delete_all_trades
   * @summary Delete All Trades
   * @request DELETE:/routes/all-trades
   */
  export namespace delete_all_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteAllTradesData;
  }

  /**
   * @description Delete all trades for a specific account ID WITHOUT deleting the evaluations
   * @tags dbtn/module:trade_management, dbtn/hasAuth
   * @name delete_trades_by_account
   * @summary Delete Trades By Account
   * @request DELETE:/routes/trades-by-account/{account_id}
   */
  export namespace delete_trades_by_account {
    export type RequestParams = {
      /** Account Id */
      accountId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTradesByAccountData;
  }

  /**
   * @description Delete all trades for a specific evaluation WITHOUT deleting the evaluation itself
   * @tags dbtn/module:trade_management, dbtn/hasAuth
   * @name delete_trades_by_evaluation
   * @summary Delete Trades By Evaluation
   * @request DELETE:/routes/trades-by-evaluation/{evaluation_id}
   */
  export namespace delete_trades_by_evaluation {
    export type RequestParams = {
      /** Evaluation Id */
      evaluationId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTradesByEvaluationData;
  }

  /**
   * @description Creates a Stripe checkout session for a free trial.
   * @tags dbtn/module:stripe, dbtn/hasAuth
   * @name create_trial_checkout
   * @summary Create Trial Checkout
   * @request POST:/routes/create-trial-checkout
   */
  export namespace create_trial_checkout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrialCheckoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTrialCheckoutData;
  }

  /**
   * @description List all screenshots for a specific trade
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name list_trade_screenshots
   * @summary List Trade Screenshots
   * @request GET:/routes/trade-screenshots/list/{trade_id}
   */
  export namespace list_trade_screenshots {
    export type RequestParams = {
      /** Trade Id */
      tradeId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTradeScreenshotsData;
  }

  /**
   * @description Upload a screenshot for a specific trade
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name upload_trade_screenshot
   * @summary Upload Trade Screenshot
   * @request POST:/routes/trade-screenshots/upload/{trade_id}
   */
  export namespace upload_trade_screenshot {
    export type RequestParams = {
      /** Trade Id */
      tradeId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = BodyUploadTradeScreenshot;
    export type RequestHeaders = {};
    export type ResponseBody = UploadTradeScreenshotData;
  }

  /**
   * @description Serve screenshot publicly (no authentication required)
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name get_public_screenshot
   * @summary Get Public Screenshot
   * @request GET:/routes/trade-screenshots/public/{screenshot_id}
   */
  export namespace get_public_screenshot {
    export type RequestParams = {
      /** Screenshot Id */
      screenshotId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPublicScreenshotData;
  }

  /**
   * @description Serve screenshot via /image/ path for backward compatibility
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name get_trade_screenshot
   * @summary Get Trade Screenshot
   * @request GET:/routes/trade-screenshots/image/{screenshot_id}
   */
  export namespace get_trade_screenshot {
    export type RequestParams = {
      /** Screenshot Id */
      screenshotId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTradeScreenshotData;
  }

  /**
   * @description Delete a specific screenshot
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name delete_trade_screenshot
   * @summary Delete Trade Screenshot
   * @request DELETE:/routes/trade-screenshots/delete/{screenshot_id}
   */
  export namespace delete_trade_screenshot {
    export type RequestParams = {
      /** Screenshot Id */
      screenshotId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTradeScreenshotData;
  }

  /**
   * @description Health check for trading platform API
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name trading_platform_health_check
   * @summary Trading Platform Health Check
   * @request GET:/routes/trading-platform/health
   */
  export namespace trading_platform_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TradingPlatformHealthCheckData;
  }

  /**
   * @description Connect to a trading platform (MT4, MT5)
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name connect_platform
   * @summary Connect Platform
   * @request POST:/routes/trading-platform/connect
   */
  export namespace connect_platform {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ConnectRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ConnectPlatformData;
  }

  /**
   * @description Get platform connection status
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name get_platform_connection
   * @summary Get Platform Connection
   * @request GET:/routes/trading-platform/connection/{platform}
   */
  export namespace get_platform_connection {
    export type RequestParams = {
      /** Platform */
      platform: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlatformConnectionData;
  }

  /**
   * @description Disconnect from a trading platform
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name disconnect_platform
   * @summary Disconnect Platform
   * @request DELETE:/routes/trading-platform/connection/{platform}
   */
  export namespace disconnect_platform {
    export type RequestParams = {
      /** Platform */
      platform: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DisconnectPlatformData;
  }

  /**
   * @description Sync trades from connected platform
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name sync_platform_trades
   * @summary Sync Platform Trades
   * @request POST:/routes/trading-platform/sync/{platform}
   */
  export namespace sync_platform_trades {
    export type RequestParams = {
      /** Platform */
      platform: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SyncPlatformTradesData;
  }

  /**
   * @description Get all evaluations for user
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name get_evaluations
   * @summary Get Evaluations
   * @request GET:/routes/trading-platform/evaluations
   */
  export namespace get_evaluations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEvaluationsData;
  }

  /**
   * @description Create a new trading evaluation
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name create_evaluation
   * @summary Create Evaluation
   * @request POST:/routes/trading-platform/evaluations
   */
  export namespace create_evaluation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EvaluationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateEvaluationData;
  }

  /**
   * @description Delete an evaluation and all its trades
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name delete_evaluation
   * @summary Delete Evaluation
   * @request DELETE:/routes/trading-platform/evaluations/{evaluation_id}
   */
  export namespace delete_evaluation {
    export type RequestParams = {
      /** Evaluation Id */
      evaluationId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteEvaluationData;
  }

  /**
   * @description Import multiple trades from AI parser into a specific evaluation
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name bulk_import_trades
   * @summary Bulk Import Trades
   * @request POST:/routes/trading-platform/bulk-import-trades
   */
  export namespace bulk_import_trades {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BulkTradeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = BulkImportTradesData;
  }

  /**
   * @description Health check for business metrics system
   * @tags dbtn/module:business_metrics, dbtn/hasAuth
   * @name business_metrics_health_check
   * @summary Business Metrics Health Check
   * @request GET:/routes/business-metrics/health
   */
  export namespace business_metrics_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BusinessMetricsHealthCheckData;
  }

  /**
   * @description Get comprehensive business metrics including MRR, CLTV, and churn analytics
   * @tags dbtn/module:business_metrics, dbtn/hasAuth
   * @name get_comprehensive_business_metrics
   * @summary Get Comprehensive Business Metrics
   * @request GET:/routes/business-metrics/comprehensive
   */
  export namespace get_comprehensive_business_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Months
       * Number of months to analyze
       * @min 1
       * @max 36
       * @default 12
       */
      months?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetComprehensiveBusinessMetricsData;
  }

  /**
   * @description List all affiliates with filtering and pagination (admin only)
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name list_affiliates
   * @summary List Affiliates
   * @request GET:/routes/admin/affiliate/list
   */
  export namespace list_affiliates {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Status
       * Filter by status: pending, approved, rejected, suspended
       */
      status?: string | null;
      /**
       * Page
       * @min 1
       * @default 1
       */
      page?: number;
      /**
       * Limit
       * @min 1
       * @max 100
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListAffiliatesData;
  }

  /**
   * @description Approve or reject an affiliate application (admin only)
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name approve_affiliate
   * @summary Approve Affiliate
   * @request POST:/routes/admin/affiliate/approve
   */
  export namespace approve_affiliate {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AffiliateApprovalRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ApproveAffiliateData;
  }

  /**
   * @description Get overall affiliate program analytics (admin only)
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name get_affiliate_program_analytics
   * @summary Get Affiliate Program Analytics
   * @request GET:/routes/admin/affiliate/analytics
   */
  export namespace get_affiliate_program_analytics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAffiliateProgramAnalyticsData;
  }

  /**
   * @description List all referrals with filtering (admin only)
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name list_all_referrals
   * @summary List All Referrals
   * @request GET:/routes/admin/affiliate/referrals
   */
  export namespace list_all_referrals {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Status
       * Filter by status: pending, converted, cancelled
       */
      status?: string | null;
      /**
       * Affiliate Id
       * Filter by affiliate ID
       */
      affiliate_id?: string | null;
      /**
       * Page
       * @min 1
       * @default 1
       */
      page?: number;
      /**
       * Limit
       * @min 1
       * @max 100
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListAllReferralsData;
  }

  /**
   * @description Test Stripe API connection
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name check_stripe_connection
   * @summary Check Stripe Connection
   * @request GET:/routes/stripe/health
   */
  export namespace check_stripe_connection {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckStripeConnectionData;
  }

  /**
   * @description Create a Stripe product and price for subscriptions
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_stripe_product
   * @summary Create Stripe Product
   * @request POST:/routes/stripe/create-product
   */
  export namespace create_stripe_product {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateProductRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateStripeProductData;
  }

  /**
   * @description List all Stripe products and prices
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name list_stripe_products
   * @summary List Stripe Products
   * @request GET:/routes/stripe/products
   */
  export namespace list_stripe_products {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListStripeProductsData;
  }

  /**
   * @description Create a Stripe checkout session with dynamic discount support
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_stripe_checkout
   * @summary Create Stripe Checkout
   * @request POST:/routes/stripe/create-checkout
   */
  export namespace create_stripe_checkout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCheckoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateStripeCheckoutData;
  }

  /**
   * @description Create a Stripe checkout session for a direct subscription (no trial)
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_subscription_checkout
   * @summary Create Subscription Checkout
   * @request POST:/routes/stripe/create-subscription-checkout
   */
  export namespace create_subscription_checkout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateSubscriptionCheckoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateSubscriptionCheckoutData;
  }

  /**
   * @description Create a Stripe checkout session for TradingBait at $7.99/month — no trial.
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_trial_checkout2
   * @summary Create Trial Checkout
   * @request POST:/routes/stripe/create-trial-checkout
   * @originalName create_trial_checkout
   * @duplicate
   */
  export namespace create_trial_checkout2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateTrialCheckoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTrialCheckout2Data;
  }

  /**
   * @description Send support email from user to support team
   * @tags dbtn/module:support_email, dbtn/hasAuth
   * @name send_support_email
   * @summary Send Support Email
   * @request POST:/routes/send-support-email
   */
  export namespace send_support_email {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SupportEmailRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendSupportEmailData;
  }

  /**
   * @description Get real-time traffic summary
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_real_time_summary
   * @summary Get Real Time Summary
   * @request GET:/routes/traffic-analytics/real-time-summary
   */
  export namespace get_real_time_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRealTimeSummaryData;
  }

  /**
   * @description Get business KPIs and metrics
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_business_metrics
   * @summary Get Business Metrics
   * @request GET:/routes/traffic-analytics/business-metrics
   */
  export namespace get_business_metrics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * Number of days to analyze
       * @default 7
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBusinessMetricsData;
  }

  /**
   * @description Get endpoint performance analytics
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_endpoint_analytics
   * @summary Get Endpoint Analytics
   * @request GET:/routes/traffic-analytics/endpoint-analytics
   */
  export namespace get_endpoint_analytics {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * Number of hours to analyze
       * @default 24
       */
      hours?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEndpointAnalyticsData;
  }

  /**
   * @description Get user behavior and navigation patterns
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_user_behavior
   * @summary Get User Behavior
   * @request GET:/routes/traffic-analytics/user-behavior
   */
  export namespace get_user_behavior {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * Number of hours to analyze
       * @default 24
       */
      hours?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUserBehaviorData;
  }

  /**
   * @description Get system health and performance metrics
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_system_health2
   * @summary Get System Health
   * @request GET:/routes/traffic-analytics/system-health
   * @originalName get_system_health
   * @duplicate
   */
  export namespace get_system_health2 {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hours
       * Number of hours to analyze
       * @default 24
       */
      hours?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSystemHealth2Data;
  }

  /**
   * @description Get historical trends and patterns
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_historical_trends
   * @summary Get Historical Trends
   * @request GET:/routes/traffic-analytics/historical-trends
   */
  export namespace get_historical_trends {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days
       * Number of days for historical analysis
       * @default 30
       */
      days?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHistoricalTrendsData;
  }

  /**
   * @description Check for traffic and performance alerts
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name check_traffic_alerts
   * @summary Check Traffic Alerts
   * @request GET:/routes/traffic-analytics/alerts-check
   */
  export namespace check_traffic_alerts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckTrafficAlertsData;
  }

  /**
   * No description
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name test_admin
   * @summary Test Admin
   * @request GET:/routes/admin/test
   */
  export namespace test_admin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestAdminData;
  }

  /**
   * @description List all users with pagination (admin only)
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name list_all_users
   * @summary List All Users
   * @request GET:/routes/admin/users
   */
  export namespace list_all_users {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page
       * @default 1
       */
      page?: number;
      /**
       * Limit
       * @default 50
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListAllUsersData;
  }

  /**
   * @description Grant subscription access to a user (admin only)
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name grant_subscription
   * @summary Grant Subscription
   * @request POST:/routes/admin/grant-subscription
   */
  export namespace grant_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SubscriptionManagementRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GrantSubscriptionData;
  }

  /**
   * @description Revoke subscription access from a user (admin only)
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name revoke_subscription
   * @summary Revoke Subscription
   * @request POST:/routes/admin/revoke-subscription
   */
  export namespace revoke_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SubscriptionManagementRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RevokeSubscriptionData;
  }
}
