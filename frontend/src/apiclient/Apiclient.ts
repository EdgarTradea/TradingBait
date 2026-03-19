import {
  AccountDeletionRequest,
  AddManualTradeData,
  AddManualTradeError,
  AffiliateApprovalRequest,
  AffiliateRegistrationRequest,
  AffiliateSystemHealthCheckData,
  AnalyzeFileStructureData,
  AnalyzeFileStructureError,
  AnalyzeGroupsData,
  AnalyzeGroupsError,
  AnalyzeTradesData,
  AnalyzeTradesError,
  ApplyDiscountData,
  ApplyDiscountError,
  ApplyDiscountRequest,
  ApproveAffiliateData,
  ApproveAffiliateError,
  AssessDataQualityData,
  AuditMissingUsersData,
  AuditSingleUserData,
  AuditSingleUserError,
  AuditSingleUserParams,
  AutoInitializeUserData,
  AutoResolveIssuesData,
  AutoResolveIssuesError,
  AutoResolveIssuesPayload,
  BackfillEvaluationIdsData,
  BasicHealthCheckData,
  BodyAnalyzeFileStructure,
  BodyProcessFile,
  BodyUploadImage,
  BodyUploadTradeScreenshot,
  BulkEditRequest,
  BulkEditTradesData,
  BulkEditTradesError,
  BulkImportTradesData,
  BulkImportTradesError,
  BulkTradeRequest,
  BusinessMetricsHealthCheckData,
  CalculateCommissionCostData,
  CalculateCommissionCostError,
  CalculateFifoForTradesData,
  CalculateFifoForTradesError,
  CancelSubscriptionData,
  CancelTrialData,
  CancelTrialError,
  CancelTrialRequest,
  CheckFeatureLimitData,
  CheckFeatureLimitError,
  CheckFeatureLimitParams,
  CheckHealthData,
  CheckNotificationPreferenceData,
  CheckNotificationPreferenceError,
  CheckNotificationPreferenceParams,
  CheckReviewsData,
  CheckStripeConnectionData,
  CheckTrafficAlertsData,
  CheckUserStatusData,
  CheckUserStatusError,
  CheckUserStatusParams,
  CleanupCorruptedEntriesData,
  CleanupLegacyStorageEndpointData,
  CleanupLegacyStorageEndpointError,
  CleanupLegacyStorageEndpointParams,
  ClearHistoricalDataData,
  ClearHistoricalDataError,
  ClearHistoricalDataParams,
  CommissionCalculationRequest,
  ComprehensivePatternAnalysisStandaloneData,
  ComprehensivePatternAnalysisStandaloneError,
  ConflictResolutionRequest,
  ConnectPlatformData,
  ConnectPlatformError,
  ConnectRequest,
  CorsStatusData,
  CreateCheckoutRequest,
  CreateCustomMoodRequest,
  CreateDiscountData,
  CreateDiscountError,
  CreateEvaluationData,
  CreateEvaluationError,
  CreateHabitDefinitionData,
  CreateHabitDefinitionError,
  CreateHabitRequest,
  CreateJournalEntryData,
  CreateJournalEntryError,
  CreateJournalEntryRequest,
  CreateManualTradeData,
  CreateManualTradeError,
  CreateMoodDefinitionData,
  CreateMoodDefinitionError,
  CreateOrUpdateCurrentWeeklyIntentionsData,
  CreateOrUpdateCurrentWeeklyIntentionsError,
  CreateProductRequest,
  CreateRefundData,
  CreateRefundError,
  CreateStripeCheckoutData,
  CreateStripeCheckoutError,
  CreateStripeProductData,
  CreateStripeProductError,
  CreateSubscriptionCheckoutData,
  CreateSubscriptionCheckoutError,
  CreateSubscriptionCheckoutRequest,
  CreateTicketData,
  CreateTicketError,
  CreateTrialCheckout2Data,
  CreateTrialCheckout2Error,
  CreateTrialCheckoutData,
  CreateTrialCheckoutError,
  CreateTrialCheckoutRequest,
  CreateTrialRequest,
  CreateTrialSubscriptionData,
  CreateTrialSubscriptionError,
  CreateWeeklyIntentionsRequest,
  CreateWeeklyReviewData,
  CreateWeeklyReviewError,
  CreateWithdrawalData,
  CreateWithdrawalError,
  DailyStatsRequest,
  DataExportRequest,
  DeleteAccountData,
  DeleteAccountError,
  DeleteAccountTradesData,
  DeleteAccountTradesError,
  DeleteAccountTradesRequest,
  DeleteAllTradesData,
  DeleteAllUserTradesData,
  DeleteDiscountData,
  DeleteDiscountError,
  DeleteDiscountParams,
  DeleteEvaluationData,
  DeleteEvaluationError,
  DeleteEvaluationParams,
  DeleteHabitDefinitionData,
  DeleteHabitDefinitionError,
  DeleteHabitDefinitionParams,
  DeleteImageData,
  DeleteImageError,
  DeleteImageParams,
  DeleteJournalEntryData,
  DeleteJournalEntryError,
  DeleteJournalEntryParams,
  DeleteManualTradeData,
  DeleteManualTradeError,
  DeleteManualTradeParams,
  DeleteMoodDefinitionData,
  DeleteMoodDefinitionError,
  DeleteMoodDefinitionParams,
  DeleteRefundData,
  DeleteRefundError,
  DeleteRefundParams,
  DeleteTradeScreenshotData,
  DeleteTradeScreenshotError,
  DeleteTradeScreenshotParams,
  DeleteTradesByAccountData,
  DeleteTradesByAccountError,
  DeleteTradesByAccountParams,
  DeleteTradesByEvaluationData,
  DeleteTradesByEvaluationError,
  DeleteTradesByEvaluationParams,
  DeleteTradesData,
  DeleteTradesError,
  DeleteWithdrawalData,
  DeleteWithdrawalError,
  DeleteWithdrawalParams,
  DetectCorruptedEntriesData,
  DisconnectPlatformData,
  DisconnectPlatformError,
  DisconnectPlatformParams,
  DiscountCreateRequest,
  DiscountHealthCheckData,
  DiscountUpdateRequest,
  DownloadTechnicalAssessmentData,
  EarlyAccessSignupData,
  EarlyAccessSignupError,
  EarlyAccessSignupRequest,
  EditTradeData,
  EditTradeError,
  EvaluationRequest,
  ExportEarlyAccessSignupsData,
  ExportPersonalDataData,
  ExportPersonalDataError,
  ExtractMissingFirstTradeData,
  FifoCalculationRequest,
  FifoHealthCheckData,
  GenerateDailyMetricsData,
  GenerateDailyMetricsError,
  GenerateReferralLinkData,
  GenerateReferralLinkError,
  GetAffiliateEarningsData,
  GetAffiliateProfileData,
  GetAffiliateProgramAnalyticsData,
  GetAnalyticsSystemHealthData,
  GetAppleTouchIconData,
  GetAuditLogData,
  GetAuditLogError,
  GetAuditLogParams,
  GetAvailablePropFirmsData,
  GetAvailableStrategiesData,
  GetBehavioralInsightsData,
  GetBehavioralInsightsError,
  GetBehavioralInsightsParams,
  GetBusinessMetricsData,
  GetBusinessMetricsError,
  GetBusinessMetricsParams,
  GetCategoryQuestionsData,
  GetCategoryQuestionsError,
  GetCategoryQuestionsParams,
  GetComprehensiveBusinessMetricsData,
  GetComprehensiveBusinessMetricsError,
  GetComprehensiveBusinessMetricsParams,
  GetCurrentWeeklyIntentionsData,
  GetCustomerPortalUrlData,
  GetDarkFaviconData,
  GetDataRetentionInfoData,
  GetDiscountAnalyticsData,
  GetDiscountData,
  GetDiscountError,
  GetDiscountParams,
  GetEarlyAccessSignupsData,
  GetEarlyAccessStatsData,
  GetEndpointAnalyticsData,
  GetEndpointAnalyticsError,
  GetEndpointAnalyticsParams,
  GetErrorReportsData,
  GetErrorReportsError,
  GetErrorReportsParams,
  GetEvaluationsData,
  GetFaviconIcoData,
  GetFaviconPngData,
  GetFaviconPngError,
  GetFaviconPngParams,
  GetFeatureUnlockStatusData,
  GetFinancialSummaryData,
  GetFinancialSummaryError,
  GetFinancialSummaryParams,
  GetHabitDefinitionsData,
  GetHistoricalMetricsData,
  GetHistoricalMetricsError,
  GetHistoricalMetricsParams,
  GetHistoricalTrendsData,
  GetHistoricalTrendsError,
  GetHistoricalTrendsParams,
  GetImageData,
  GetImageError,
  GetImageParams,
  GetInfrastructureHealthData,
  GetIssueDetailsData,
  GetIssueDetailsError,
  GetIssueDetailsParams,
  GetJournalAnalyticsData,
  GetJournalAnalyticsError,
  GetJournalAnalyticsParams,
  GetJournalEntriesData,
  GetJournalEntriesError,
  GetJournalEntriesParams,
  GetJournalEntryByDateData,
  GetJournalEntryByDateError,
  GetJournalEntryByDateParams,
  GetLightFaviconData,
  GetLogoData,
  GetLogoError,
  GetLogoParams,
  GetMainLogoData,
  GetMigrationStatusData,
  GetMoodDefinitionsData,
  GetNotificationStatsData,
  GetOgImageData,
  GetPerformanceMetricsData,
  GetPerformanceMetricsError,
  GetPerformanceMetricsParams,
  GetPlatformConnectionData,
  GetPlatformConnectionError,
  GetPlatformConnectionParams,
  GetPropFirmCommissionInfoData,
  GetPropFirmCommissionInfoError,
  GetPropFirmCommissionInfoParams,
  GetPublicScreenshotData,
  GetPublicScreenshotError,
  GetPublicScreenshotParams,
  GetRealTimeSummaryData,
  GetRealtimeStatsData,
  GetReviewScheduleData,
  GetStreakDataData,
  GetStreakDataError,
  GetStreakDataParams,
  GetSubscriptionFailureStatsData,
  GetSubscriptionFailureStatsError,
  GetSubscriptionFailureStatsParams,
  GetSupportCategoriesData,
  GetSystemHealth2Data,
  GetSystemHealth2Error,
  GetSystemHealth2Params,
  GetSystemHealthData,
  GetTagSuggestionsData,
  GetTicketCategoriesData,
  GetTicketData,
  GetTicketError,
  GetTicketParams,
  GetTradeScreenshotData,
  GetTradeScreenshotError,
  GetTradeScreenshotParams,
  GetTransactionData,
  GetTransactionError,
  GetTransactionHistoryData,
  GetTransactionHistoryError,
  GetTransactionHistoryParams,
  GetTransactionParams,
  GetTrialStatusData,
  GetTrialUsersData,
  GetTwitterImageData,
  GetUsageInfoData,
  GetUserAnalyticsData,
  GetUserAnalyticsError,
  GetUserAnalyticsParams,
  GetUserBehaviorData,
  GetUserBehaviorError,
  GetUserBehaviorParams,
  GetUserBillingInfoData,
  GetUserEvaluationsData,
  GetUserEvaluationsError,
  GetUserEvaluationsParams,
  GetUserGroupsData,
  GetUserGroupsError,
  GetUserGroupsParams,
  GetUserJournalEntriesData,
  GetUserJournalEntriesError,
  GetUserJournalEntriesParams,
  GetUserPropFirmPreferenceData,
  GetUserTradesData,
  GetUserTradesError,
  GetUserTradesParams,
  GetWaitlistStatsData,
  GetWeeklyIntentionsHistoryData,
  GetWeeklyReviewData,
  GetWeeklyReviewError,
  GetWeeklyReviewParams,
  GlobalOptionsHandlerData,
  GlobalOptionsHandlerError,
  GlobalOptionsHandlerParams,
  GrantSubscriptionData,
  GrantSubscriptionError,
  GroupAnalysisRequest,
  GroupingHealthCheckData,
  GroupingRequest,
  HelpfulVoteRequest,
  HistoricalAnalyticsHealthCheckData,
  InitializeHistoricalDataData,
  InitializeUserData,
  InitializeUserError,
  ListAffiliatesData,
  ListAffiliatesError,
  ListAffiliatesParams,
  ListAllReferralsData,
  ListAllReferralsError,
  ListAllReferralsParams,
  ListAllUsersData,
  ListAllUsersError,
  ListAllUsersParams,
  ListDiscountsData,
  ListDiscountsError,
  ListDiscountsParams,
  ListStripeProductsData,
  ListTicketsData,
  ListTicketsError,
  ListTicketsParams,
  ListTradeScreenshotsData,
  ListTradeScreenshotsError,
  ListTradeScreenshotsParams,
  ListUserImagesData,
  ListWeeklyReviewsData,
  ListWeeklyReviewsError,
  ListWeeklyReviewsParams,
  LogFailureRequest,
  LogSubscriptionFailureData,
  LogSubscriptionFailureError,
  ManualTradeEntry,
  ManualTradeRequest,
  MarkSignupConfirmedData,
  MarkSignupConfirmedError,
  MarkSignupConfirmedParams,
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
  ProcessFileError,
  ProcessFileParams,
  PropFirmHealthCheckData,
  PropFirmPreferenceRequest,
  ReactivateSubscriptionData,
  ReferralLinkRequest,
  RefundRequest,
  RegisterAffiliateData,
  RegisterAffiliateError,
  RepairTradesDatetimeData,
  RepairTradesDatetimeError,
  RepairTradesRequest,
  RepairUserTradesData,
  ResolveConflictData,
  ResolveConflictError,
  RestoreSubscriptionData,
  RestoreSubscriptionError,
  ReviewAutomationHealthCheckData,
  RevokeSubscriptionData,
  RevokeSubscriptionError,
  SaveJournalEntryData,
  SaveJournalEntryError,
  SearchKnowledgeBaseData,
  SearchKnowledgeBaseError,
  SearchRequest,
  SendSupportEmailData,
  SendSupportEmailError,
  SendWelcomeEmailData,
  SendWelcomeEmailError,
  SetUserPropFirmPreferenceData,
  SetUserPropFirmPreferenceError,
  SignupForAiCoachNotificationsData,
  SignupForAiCoachNotificationsError,
  SignupForProNotificationsData,
  SignupForProNotificationsError,
  StripeWebhookHandlerData,
  StripeWebhookHandlerError,
  SubscriptionAuditHealthCheckData,
  SubscriptionManagementRequest,
  SubscriptionRestoreRequest,
  SupportEmailRequest,
  SupportTicketRequest,
  SyncPlatformTradesData,
  SyncPlatformTradesError,
  SyncPlatformTradesParams,
  TestAdminData,
  TestEndpointData,
  TrackAnalyticsUserEventData,
  TrackAnalyticsUserEventError,
  TrackFeatureUsageData,
  TrackFeatureUsageError,
  TrackReferralConversionData,
  TrackReferralConversionError,
  TrackReferralConversionParams,
  TrackReferralSignupData,
  TrackReferralSignupError,
  TrackReferralSignupParams,
  TrackUserEventData,
  TrackUserEventError,
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
  UpdateDiscountError,
  UpdateDiscountParams,
  UpdateHabitDefinitionData,
  UpdateHabitDefinitionError,
  UpdateHabitDefinitionParams,
  UpdateHabitRequest,
  UpdateJournalEntryData,
  UpdateJournalEntryError,
  UpdateJournalEntryParams,
  UpdateJournalEntryRequest,
  UpdateManualTradeData,
  UpdateManualTradeError,
  UpdateManualTradeParams,
  UpdateMoodDefinitionData,
  UpdateMoodDefinitionError,
  UpdateMoodDefinitionParams,
  UploadImageData,
  UploadImageError,
  UploadTradeScreenshotData,
  UploadTradeScreenshotError,
  UploadTradeScreenshotParams,
  UserActivityEvent,
  UserInitializationHealthCheckData,
  UserInitializationRequest,
  VoteHelpfulData,
  VoteHelpfulError,
  VoteHelpfulParams,
  WebhookHealthCheckData,
  WeeklyIntentionsHealthCheckData,
  WeeklyReviewCreate,
  WelcomeEmailRequest,
  WithdrawalRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Apiclient<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current trial status for the user
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name get_trial_status
   * @summary Get Trial Status
   * @request GET:/routes/trial-management/status
   */
  get_trial_status = (params: RequestParams = {}) =>
    this.request<GetTrialStatusData, any>({
      path: `/routes/trial-management/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle preflight CORS requests for trial status
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name options_trial_status
   * @summary Options Trial Status
   * @request OPTIONS:/routes/trial-management/status
   */
  options_trial_status = (params: RequestParams = {}) =>
    this.request<OptionsTrialStatusData, any>({
      path: `/routes/trial-management/status`,
      method: "OPTIONS",
      ...params,
    });

  /**
   * @description Create a new trial subscription with Stripe
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name create_trial_subscription
   * @summary Create Trial Subscription
   * @request POST:/routes/trial-management/create
   */
  create_trial_subscription = (data: CreateTrialRequest, params: RequestParams = {}) =>
    this.request<CreateTrialSubscriptionData, CreateTrialSubscriptionError>({
      path: `/routes/trial-management/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Track usage of trial features
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name track_feature_usage
   * @summary Track Feature Usage
   * @request POST:/routes/trial-management/track-usage
   */
  track_feature_usage = (data: TrialUsageUpdate, params: RequestParams = {}) =>
    this.request<TrackFeatureUsageData, TrackFeatureUsageError>({
      path: `/routes/trial-management/track-usage`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if user can use a specific feature
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name check_feature_limit
   * @summary Check Feature Limit
   * @request GET:/routes/trial-management/check-limit/{feature_type}
   */
  check_feature_limit = ({ featureType, ...query }: CheckFeatureLimitParams, params: RequestParams = {}) =>
    this.request<CheckFeatureLimitData, CheckFeatureLimitError>({
      path: `/routes/trial-management/check-limit/${featureType}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Cancel trial subscription to avoid charges
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name cancel_trial
   * @summary Cancel Trial
   * @request POST:/routes/trial-management/cancel
   */
  cancel_trial = (data: CancelTrialRequest, params: RequestParams = {}) =>
    this.request<CancelTrialData, CancelTrialError>({
      path: `/routes/trial-management/cancel`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Admin endpoint to view all trial users
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name get_trial_users
   * @summary Get Trial Users
   * @request GET:/routes/trial-management/admin/users
   */
  get_trial_users = (params: RequestParams = {}) =>
    this.request<GetTrialUsersData, any>({
      path: `/routes/trial-management/admin/users`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for trial management system
   *
   * @tags dbtn/module:trial_management, dbtn/hasAuth
   * @name trial_health_check
   * @summary Trial Health Check
   * @request GET:/routes/trial-management/health
   */
  trial_health_check = (params: RequestParams = {}) =>
    this.request<TrialHealthCheckData, any>({
      path: `/routes/trial-management/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete all trades for a specific account/evaluation
   *
   * @tags dbtn/module:trade_deletion, dbtn/hasAuth
   * @name delete_account_trades
   * @summary Delete Account Trades
   * @request DELETE:/routes/trades/account
   */
  delete_account_trades = (data: DeleteAccountTradesRequest, params: RequestParams = {}) =>
    this.request<DeleteAccountTradesData, DeleteAccountTradesError>({
      path: `/routes/trades/account`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete all trades for the authenticated user across all accounts
   *
   * @tags dbtn/module:trade_deletion, dbtn/hasAuth
   * @name delete_all_user_trades
   * @summary Delete All User Trades
   * @request DELETE:/routes/trades/all
   */
  delete_all_user_trades = (params: RequestParams = {}) =>
    this.request<DeleteAllUserTradesData, any>({
      path: `/routes/trades/all`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Analyze the structure of an uploaded trading file using OpenAI
   *
   * @tags dbtn/module:file_analysis, dbtn/hasAuth
   * @name analyze_file_structure
   * @summary Analyze File Structure
   * @request POST:/routes/analyze-structure
   */
  analyze_file_structure = (data: BodyAnalyzeFileStructure, params: RequestParams = {}) =>
    this.request<AnalyzeFileStructureData, AnalyzeFileStructureError>({
      path: `/routes/analyze-structure`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Process uploaded file and save trades to specified evaluation
   *
   * @tags dbtn/module:file_analysis, dbtn/hasAuth
   * @name process_file
   * @summary Process File
   * @request POST:/routes/process-file
   */
  process_file = (query: ProcessFileParams, data: BodyProcessFile, params: RequestParams = {}) =>
    this.request<ProcessFileData, ProcessFileError>({
      path: `/routes/process-file`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Health check for FIFO calculation API
   *
   * @tags dbtn/module:fifo_calculation, dbtn/hasAuth
   * @name fifo_health_check
   * @summary Fifo Health Check
   * @request GET:/routes/health
   */
  fifo_health_check = (params: RequestParams = {}) =>
    this.request<FifoHealthCheckData, any>({
      path: `/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle preflight CORS requests for user status check
   *
   * @tags dbtn/module:user_status, dbtn/hasAuth
   * @name options_user_status
   * @summary Options User Status
   * @request OPTIONS:/routes/user-status/check
   */
  options_user_status = (params: RequestParams = {}) =>
    this.request<OptionsUserStatusData, any>({
      path: `/routes/user-status/check`,
      method: "OPTIONS",
      ...params,
    });

  /**
   * @description Check if the authenticated user has an active subscription
   *
   * @tags dbtn/module:user_status, dbtn/hasAuth
   * @name check_user_status
   * @summary Check User Status
   * @request GET:/routes/user-status/check
   */
  check_user_status = (query: CheckUserStatusParams, params: RequestParams = {}) =>
    this.request<CheckUserStatusData, CheckUserStatusError>({
      path: `/routes/user-status/check`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Assess data quality for user's trades
   *
   * @tags dbtn/module:data_quality, dbtn/hasAuth
   * @name assess_data_quality
   * @summary Assess Data Quality
   * @request POST:/routes/data-quality/assess
   */
  assess_data_quality = (params: RequestParams = {}) =>
    this.request<AssessDataQualityData, any>({
      path: `/routes/data-quality/assess`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get detailed information about a specific data quality issue
   *
   * @tags dbtn/module:data_quality, dbtn/hasAuth
   * @name get_issue_details
   * @summary Get Issue Details
   * @request GET:/routes/data-quality/issues/{issue_id}
   */
  get_issue_details = ({ issueId, ...query }: GetIssueDetailsParams, params: RequestParams = {}) =>
    this.request<GetIssueDetailsData, GetIssueDetailsError>({
      path: `/routes/data-quality/issues/${issueId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Automatically resolve resolvable issues
   *
   * @tags dbtn/module:data_quality, dbtn/hasAuth
   * @name auto_resolve_issues
   * @summary Auto Resolve Issues
   * @request POST:/routes/data-quality/resolve-auto
   */
  auto_resolve_issues = (data: AutoResolveIssuesPayload, params: RequestParams = {}) =>
    this.request<AutoResolveIssuesData, AutoResolveIssuesError>({
      path: `/routes/data-quality/resolve-auto`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for trading journal API
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name trading_journal_health_check
   * @summary Trading Journal Health Check
   * @request GET:/routes/routes/health
   */
  trading_journal_health_check = (params: RequestParams = {}) =>
    this.request<TradingJournalHealthCheckData, any>({
      path: `/routes/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new journal entry
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name create_journal_entry
   * @summary Create Journal Entry
   * @request POST:/routes/routes/entries
   */
  create_journal_entry = (data: CreateJournalEntryRequest, params: RequestParams = {}) =>
    this.request<CreateJournalEntryData, CreateJournalEntryError>({
      path: `/routes/routes/entries`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get journal entries for user with pagination
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_journal_entries
   * @summary Get Journal Entries
   * @request GET:/routes/routes/entries
   */
  get_journal_entries = (query: GetJournalEntriesParams, params: RequestParams = {}) =>
    this.request<GetJournalEntriesData, GetJournalEntriesError>({
      path: `/routes/routes/entries`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific journal entry by date
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_journal_entry_by_date
   * @summary Get Journal Entry By Date
   * @request GET:/routes/routes/entries/{entry_date}
   */
  get_journal_entry_by_date = ({ entryDate, ...query }: GetJournalEntryByDateParams, params: RequestParams = {}) =>
    this.request<GetJournalEntryByDateData, GetJournalEntryByDateError>({
      path: `/routes/routes/entries/${entryDate}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update an existing journal entry
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name update_journal_entry
   * @summary Update Journal Entry
   * @request PUT:/routes/routes/entries/{entry_date}
   */
  update_journal_entry = (
    { entryDate, ...query }: UpdateJournalEntryParams,
    data: UpdateJournalEntryRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateJournalEntryData, UpdateJournalEntryError>({
      path: `/routes/routes/entries/${entryDate}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a journal entry
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name delete_journal_entry
   * @summary Delete Journal Entry
   * @request DELETE:/routes/routes/entries/{entry_date}
   */
  delete_journal_entry = ({ entryDate, ...query }: DeleteJournalEntryParams, params: RequestParams = {}) =>
    this.request<DeleteJournalEntryData, DeleteJournalEntryError>({
      path: `/routes/routes/entries/${entryDate}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get all habit definitions for the user
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_habit_definitions
   * @summary Get Habit Definitions
   * @request GET:/routes/routes/habits
   */
  get_habit_definitions = (params: RequestParams = {}) =>
    this.request<GetHabitDefinitionsData, any>({
      path: `/routes/routes/habits`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new habit definition
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name create_habit_definition
   * @summary Create Habit Definition
   * @request POST:/routes/routes/habits
   */
  create_habit_definition = (data: CreateHabitRequest, params: RequestParams = {}) =>
    this.request<CreateHabitDefinitionData, CreateHabitDefinitionError>({
      path: `/routes/routes/habits`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update an existing habit definition
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name update_habit_definition
   * @summary Update Habit Definition
   * @request PUT:/routes/routes/habits/{habit_id}
   */
  update_habit_definition = (
    { habitId, ...query }: UpdateHabitDefinitionParams,
    data: UpdateHabitRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateHabitDefinitionData, UpdateHabitDefinitionError>({
      path: `/routes/routes/habits/${habitId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Soft delete a habit definition (mark as inactive)
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name delete_habit_definition
   * @summary Delete Habit Definition
   * @request DELETE:/routes/routes/habits/{habit_id}
   */
  delete_habit_definition = ({ habitId, ...query }: DeleteHabitDefinitionParams, params: RequestParams = {}) =>
    this.request<DeleteHabitDefinitionData, DeleteHabitDefinitionError>({
      path: `/routes/routes/habits/${habitId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get all mood definitions for the user
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_mood_definitions
   * @summary Get Mood Definitions
   * @request GET:/routes/routes/moods
   */
  get_mood_definitions = (params: RequestParams = {}) =>
    this.request<GetMoodDefinitionsData, any>({
      path: `/routes/routes/moods`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new mood definition
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name create_mood_definition
   * @summary Create Mood Definition
   * @request POST:/routes/routes/moods
   */
  create_mood_definition = (data: CreateCustomMoodRequest, params: RequestParams = {}) =>
    this.request<CreateMoodDefinitionData, CreateMoodDefinitionError>({
      path: `/routes/routes/moods`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update an existing mood definition
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name update_mood_definition
   * @summary Update Mood Definition
   * @request PUT:/routes/routes/moods/{mood_id}
   */
  update_mood_definition = (
    { moodId, ...query }: UpdateMoodDefinitionParams,
    data: UpdateCustomMoodRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateMoodDefinitionData, UpdateMoodDefinitionError>({
      path: `/routes/routes/moods/${moodId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Soft delete a mood definition (mark as inactive)
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name delete_mood_definition
   * @summary Delete Mood Definition
   * @request DELETE:/routes/routes/moods/{mood_id}
   */
  delete_mood_definition = ({ moodId, ...query }: DeleteMoodDefinitionParams, params: RequestParams = {}) =>
    this.request<DeleteMoodDefinitionData, DeleteMoodDefinitionError>({
      path: `/routes/routes/moods/${moodId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get comprehensive streak data including streaks and calendar
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_streak_data
   * @summary Get Streak Data
   * @request GET:/routes/routes/streaks
   */
  get_streak_data = (query: GetStreakDataParams, params: RequestParams = {}) =>
    this.request<GetStreakDataData, GetStreakDataError>({
      path: `/routes/routes/streaks`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get behavioral insights based on journal entries
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_behavioral_insights
   * @summary Get Behavioral Insights
   * @request GET:/routes/routes/insights
   */
  get_behavioral_insights = (query: GetBehavioralInsightsParams, params: RequestParams = {}) =>
    this.request<GetBehavioralInsightsData, GetBehavioralInsightsError>({
      path: `/routes/routes/insights`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get comprehensive journal analytics including trading performance
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name get_journal_analytics
   * @summary Get Journal Analytics
   * @request GET:/routes/routes/analytics
   */
  get_journal_analytics = (query: GetJournalAnalyticsParams, params: RequestParams = {}) =>
    this.request<GetJournalAnalyticsData, GetJournalAnalyticsError>({
      path: `/routes/routes/analytics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description One-time migration to extract habit definitions from existing journal entries
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name migrate_habits_from_journals
   * @summary Migrate Habits From Journals
   * @request POST:/routes/routes/migrate-habits
   */
  migrate_habits_from_journals = (params: RequestParams = {}) =>
    this.request<MigrateHabitsFromJournalsData, any>({
      path: `/routes/routes/migrate-habits`,
      method: "POST",
      ...params,
    });

  /**
   * @description Unified save endpoint - creates new entry or updates existing one (upsert pattern)
   *
   * @tags dbtn/module:trading_journal_unified, dbtn/hasAuth
   * @name save_journal_entry
   * @summary Save Journal Entry
   * @request POST:/routes/routes/save-entry
   */
  save_journal_entry = (data: CreateJournalEntryRequest, params: RequestParams = {}) =>
    this.request<SaveJournalEntryData, SaveJournalEntryError>({
      path: `/routes/routes/save-entry`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Edit a single trade with validation and audit trail
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name edit_trade
   * @summary Edit Trade
   * @request POST:/routes/manual-intervention/edit-trade
   */
  edit_trade = (data: TradeEditRequest, params: RequestParams = {}) =>
    this.request<EditTradeData, EditTradeError>({
      path: `/routes/manual-intervention/edit-trade`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Edit multiple trades with the same changes
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name bulk_edit_trades
   * @summary Bulk Edit Trades
   * @request POST:/routes/manual-intervention/bulk-edit
   */
  bulk_edit_trades = (data: BulkEditRequest, params: RequestParams = {}) =>
    this.request<BulkEditTradesData, BulkEditTradesError>({
      path: `/routes/manual-intervention/bulk-edit`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Manually add a new trade
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name add_manual_trade
   * @summary Add Manual Trade
   * @request POST:/routes/manual-intervention/add-trade
   */
  add_manual_trade = (data: ManualTradeEntry, params: RequestParams = {}) =>
    this.request<AddManualTradeData, AddManualTradeError>({
      path: `/routes/manual-intervention/add-trade`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete multiple trades
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name delete_trades
   * @summary Delete Trades
   * @request POST:/routes/manual-intervention/delete-trades
   */
  delete_trades = (data: TradeDeleteRequest, params: RequestParams = {}) =>
    this.request<DeleteTradesData, DeleteTradesError>({
      path: `/routes/manual-intervention/delete-trades`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Resolve a data conflict
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name resolve_conflict
   * @summary Resolve Conflict
   * @request POST:/routes/manual-intervention/resolve-conflict
   */
  resolve_conflict = (data: ConflictResolutionRequest, params: RequestParams = {}) =>
    this.request<ResolveConflictData, ResolveConflictError>({
      path: `/routes/manual-intervention/resolve-conflict`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get audit log for user's manual interventions
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name get_audit_log
   * @summary Get Audit Log
   * @request GET:/routes/manual-intervention/audit-log
   */
  get_audit_log = (query: GetAuditLogParams, params: RequestParams = {}) =>
    this.request<GetAuditLogData, GetAuditLogError>({
      path: `/routes/manual-intervention/audit-log`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Backfill evaluationId for existing manual trades that don't have this field
   *
   * @tags dbtn/module:manual_intervention, dbtn/hasAuth
   * @name backfill_evaluation_ids
   * @summary Backfill Evaluation Ids
   * @request POST:/routes/manual-intervention/backfill-evaluation-ids
   */
  backfill_evaluation_ids = (params: RequestParams = {}) =>
    this.request<BackfillEvaluationIdsData, any>({
      path: `/routes/manual-intervention/backfill-evaluation-ids`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for historical analytics system
   *
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name historical_analytics_health_check
   * @summary Historical Analytics Health Check
   * @request GET:/routes/historical-analytics/health
   */
  historical_analytics_health_check = (params: RequestParams = {}) =>
    this.request<HistoricalAnalyticsHealthCheckData, any>({
      path: `/routes/historical-analytics/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Track a user activity event for historical analytics
   *
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name track_user_event
   * @summary Track User Event
   * @request POST:/routes/historical-analytics/track-event
   */
  track_user_event = (data: UserActivityEvent, params: RequestParams = {}) =>
    this.request<TrackUserEventData, TrackUserEventError>({
      path: `/routes/historical-analytics/track-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate daily metrics from collected events
   *
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name generate_daily_metrics
   * @summary Generate Daily Metrics
   * @request POST:/routes/historical-analytics/generate-daily-metrics
   */
  generate_daily_metrics = (data: DailyStatsRequest, params: RequestParams = {}) =>
    this.request<GenerateDailyMetricsData, GenerateDailyMetricsError>({
      path: `/routes/historical-analytics/generate-daily-metrics`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get historical user metrics for the specified number of days
   *
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name get_historical_metrics
   * @summary Get Historical Metrics
   * @request GET:/routes/historical-analytics/metrics
   */
  get_historical_metrics = (query: GetHistoricalMetricsParams, params: RequestParams = {}) =>
    this.request<GetHistoricalMetricsData, GetHistoricalMetricsError>({
      path: `/routes/historical-analytics/metrics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Initialize historical data collection and backfill recent data
   *
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name initialize_historical_data
   * @summary Initialize Historical Data
   * @request POST:/routes/historical-analytics/initialize-historical-data
   */
  initialize_historical_data = (params: RequestParams = {}) =>
    this.request<InitializeHistoricalDataData, any>({
      path: `/routes/historical-analytics/initialize-historical-data`,
      method: "POST",
      ...params,
    });

  /**
   * @description Clear all historical analytics data (use with caution)
   *
   * @tags dbtn/module:historical_analytics, dbtn/hasAuth
   * @name clear_historical_data
   * @summary Clear Historical Data
   * @request DELETE:/routes/historical-analytics/clear-data
   */
  clear_historical_data = (query: ClearHistoricalDataParams, params: RequestParams = {}) =>
    this.request<ClearHistoricalDataData, ClearHistoricalDataError>({
      path: `/routes/historical-analytics/clear-data`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Get all support categories
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_support_categories
   * @summary Get Support Categories
   * @request GET:/routes/support/categories
   */
  get_support_categories = (params: RequestParams = {}) =>
    this.request<GetSupportCategoriesData, any>({
      path: `/routes/support/categories`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all questions for a specific category
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_category_questions
   * @summary Get Category Questions
   * @request GET:/routes/support/categories/{category_id}/questions
   */
  get_category_questions = ({ categoryId, ...query }: GetCategoryQuestionsParams, params: RequestParams = {}) =>
    this.request<GetCategoryQuestionsData, GetCategoryQuestionsError>({
      path: `/routes/support/categories/${categoryId}/questions`,
      method: "GET",
      ...params,
    });

  /**
   * @description Search the knowledge base
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name search_knowledge_base
   * @summary Search Knowledge Base
   * @request POST:/routes/support/search
   */
  search_knowledge_base = (data: SearchRequest, params: RequestParams = {}) =>
    this.request<SearchKnowledgeBaseData, SearchKnowledgeBaseError>({
      path: `/routes/support/search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Vote on whether a question was helpful
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name vote_helpful
   * @summary Vote Helpful
   * @request POST:/routes/support/questions/{question_id}/helpful
   */
  vote_helpful = ({ questionId, ...query }: VoteHelpfulParams, data: HelpfulVoteRequest, params: RequestParams = {}) =>
    this.request<VoteHelpfulData, VoteHelpfulError>({
      path: `/routes/support/questions/${questionId}/helpful`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a new support ticket and send emails
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name create_ticket
   * @summary Create Ticket
   * @request POST:/routes/support/tickets
   */
  create_ticket = (data: SupportTicketRequest, params: RequestParams = {}) =>
    this.request<CreateTicketData, CreateTicketError>({
      path: `/routes/support/tickets`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List recent support tickets
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name list_tickets
   * @summary List Tickets
   * @request GET:/routes/support/tickets
   */
  list_tickets = (query: ListTicketsParams, params: RequestParams = {}) =>
    this.request<ListTicketsData, ListTicketsError>({
      path: `/routes/support/tickets`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get ticket details by ID
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_ticket
   * @summary Get Ticket
   * @request GET:/routes/support/tickets/{ticket_id}
   */
  get_ticket = ({ ticketId, ...query }: GetTicketParams, params: RequestParams = {}) =>
    this.request<GetTicketData, GetTicketError>({
      path: `/routes/support/tickets/${ticketId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get available ticket categories
   *
   * @tags dbtn/module:support, dbtn/hasAuth
   * @name get_ticket_categories
   * @summary Get Ticket Categories
   * @request GET:/routes/support/ticket-categories
   */
  get_ticket_categories = (params: RequestParams = {}) =>
    this.request<GetTicketCategoriesData, any>({
      path: `/routes/support/ticket-categories`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint for discount management
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name discount_health_check
   * @summary Discount Health Check
   * @request GET:/routes/discount-management/health
   */
  discount_health_check = (params: RequestParams = {}) =>
    this.request<DiscountHealthCheckData, any>({
      path: `/routes/discount-management/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new discount code (admin only)
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name create_discount
   * @summary Create Discount
   * @request POST:/routes/discount-management/discounts
   */
  create_discount = (data: DiscountCreateRequest, params: RequestParams = {}) =>
    this.request<CreateDiscountData, CreateDiscountError>({
      path: `/routes/discount-management/discounts`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all discount codes (admin only)
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name list_discounts
   * @summary List Discounts
   * @request GET:/routes/discount-management/discounts
   */
  list_discounts = (query: ListDiscountsParams, params: RequestParams = {}) =>
    this.request<ListDiscountsData, ListDiscountsError>({
      path: `/routes/discount-management/discounts`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific discount by ID (admin only)
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name get_discount
   * @summary Get Discount
   * @request GET:/routes/discount-management/discounts/{discount_id}
   */
  get_discount = ({ discountId, ...query }: GetDiscountParams, params: RequestParams = {}) =>
    this.request<GetDiscountData, GetDiscountError>({
      path: `/routes/discount-management/discounts/${discountId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a discount code (admin only)
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name update_discount
   * @summary Update Discount
   * @request PUT:/routes/discount-management/discounts/{discount_id}
   */
  update_discount = (
    { discountId, ...query }: UpdateDiscountParams,
    data: DiscountUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateDiscountData, UpdateDiscountError>({
      path: `/routes/discount-management/discounts/${discountId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a discount code (admin only)
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name delete_discount
   * @summary Delete Discount
   * @request DELETE:/routes/discount-management/discounts/{discount_id}
   */
  delete_discount = ({ discountId, ...query }: DeleteDiscountParams, params: RequestParams = {}) =>
    this.request<DeleteDiscountData, DeleteDiscountError>({
      path: `/routes/discount-management/discounts/${discountId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Apply and validate a discount code for a customer
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name apply_discount
   * @summary Apply Discount
   * @request POST:/routes/discount-management/apply-discount
   */
  apply_discount = (data: ApplyDiscountRequest, params: RequestParams = {}) =>
    this.request<ApplyDiscountData, ApplyDiscountError>({
      path: `/routes/discount-management/apply-discount`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get discount usage analytics (admin only)
   *
   * @tags dbtn/module:discount_management, dbtn/hasAuth
   * @name get_discount_analytics
   * @summary Get Discount Analytics
   * @request GET:/routes/discount-management/analytics
   */
  get_discount_analytics = (params: RequestParams = {}) =>
    this.request<GetDiscountAnalyticsData, any>({
      path: `/routes/discount-management/analytics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get comprehensive infrastructure health status. Requires authentication to prevent abuse.
   *
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name get_infrastructure_health
   * @summary Get Infrastructure Health
   * @request GET:/routes/infrastructure/health
   */
  get_infrastructure_health = (params: RequestParams = {}) =>
    this.request<GetInfrastructureHealthData, any>({
      path: `/routes/infrastructure/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get statistics on recent subscription verification failures. Requires authentication to protect sensitive monitoring data.
   *
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name get_subscription_failure_stats
   * @summary Get Subscription Failure Stats
   * @request GET:/routes/infrastructure/subscription-failures
   */
  get_subscription_failure_stats = (query: GetSubscriptionFailureStatsParams, params: RequestParams = {}) =>
    this.request<GetSubscriptionFailureStatsData, GetSubscriptionFailureStatsError>({
      path: `/routes/infrastructure/subscription-failures`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Log a subscription verification failure for monitoring. Used by the frontend when retries are exhausted.
   *
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name log_subscription_failure
   * @summary Log Subscription Failure
   * @request POST:/routes/infrastructure/log-subscription-failure
   */
  log_subscription_failure = (data: LogFailureRequest, params: RequestParams = {}) =>
    this.request<LogSubscriptionFailureData, LogSubscriptionFailureError>({
      path: `/routes/infrastructure/log-subscription-failure`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Public health check endpoint for load balancers and monitoring. Returns basic system status without sensitive details.
   *
   * @tags dbtn/module:infrastructure_health, dbtn/hasAuth
   * @name get_system_health
   * @summary Get System Health
   * @request GET:/routes/infrastructure/system-health
   */
  get_system_health = (params: RequestParams = {}) =>
    this.request<GetSystemHealthData, any>({
      path: `/routes/infrastructure/system-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get comprehensive billing information for the current user
   *
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name get_user_billing_info
   * @summary Get User Billing Info
   * @request GET:/routes/user-billing/info
   */
  get_user_billing_info = (params: RequestParams = {}) =>
    this.request<GetUserBillingInfoData, any>({
      path: `/routes/user-billing/info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create and return Stripe Customer Portal URL for subscription management
   *
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name get_customer_portal_url
   * @summary Get Customer Portal Url
   * @request GET:/routes/user-billing/customer-portal
   */
  get_customer_portal_url = (params: RequestParams = {}) =>
    this.request<GetCustomerPortalUrlData, any>({
      path: `/routes/user-billing/customer-portal`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current usage statistics and limits for the user
   *
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name get_usage_info
   * @summary Get Usage Info
   * @request GET:/routes/user-billing/usage
   */
  get_usage_info = (params: RequestParams = {}) =>
    this.request<GetUsageInfoData, any>({
      path: `/routes/user-billing/usage`,
      method: "GET",
      ...params,
    });

  /**
   * @description Cancel user's subscription at period end
   *
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name cancel_subscription
   * @summary Cancel Subscription
   * @request POST:/routes/user-billing/cancel-subscription
   */
  cancel_subscription = (params: RequestParams = {}) =>
    this.request<CancelSubscriptionData, any>({
      path: `/routes/user-billing/cancel-subscription`,
      method: "POST",
      ...params,
    });

  /**
   * @description Reactivate a subscription that was scheduled for cancellation
   *
   * @tags dbtn/module:user_billing, dbtn/hasAuth
   * @name reactivate_subscription
   * @summary Reactivate Subscription
   * @request POST:/routes/user-billing/reactivate-subscription
   */
  reactivate_subscription = (params: RequestParams = {}) =>
    this.request<ReactivateSubscriptionData, any>({
      path: `/routes/user-billing/reactivate-subscription`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:repair_trades_simple, dbtn/hasAuth
   * @name test_endpoint
   * @summary Test Endpoint
   * @request GET:/routes/repair-trades-simple/test
   */
  test_endpoint = (params: RequestParams = {}) =>
    this.request<TestEndpointData, any>({
      path: `/routes/repair-trades-simple/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Simple repair for the specific user with missing datetime fields
   *
   * @tags dbtn/module:repair_trades_simple, dbtn/hasAuth
   * @name repair_user_trades
   * @summary Repair User Trades
   * @request POST:/routes/repair-trades-simple/repair-user-trades
   */
  repair_user_trades = (params: RequestParams = {}) =>
    this.request<RepairUserTradesData, any>({
      path: `/routes/repair-trades-simple/repair-user-trades`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for prop firm management system
   *
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name prop_firm_health_check
   * @summary Prop Firm Health Check
   * @request GET:/routes/prop-firms/health
   */
  prop_firm_health_check = (params: RequestParams = {}) =>
    this.request<PropFirmHealthCheckData, any>({
      path: `/routes/prop-firms/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get list of available prop firms and user's current selection
   *
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name get_available_prop_firms
   * @summary Get Available Prop Firms
   * @request GET:/routes/prop-firms/list
   */
  get_available_prop_firms = (params: RequestParams = {}) =>
    this.request<GetAvailablePropFirmsData, any>({
      path: `/routes/prop-firms/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set user's prop firm preference
   *
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name set_user_prop_firm_preference
   * @summary Set User Prop Firm Preference
   * @request POST:/routes/prop-firms/set-preference
   */
  set_user_prop_firm_preference = (data: PropFirmPreferenceRequest, params: RequestParams = {}) =>
    this.request<SetUserPropFirmPreferenceData, SetUserPropFirmPreferenceError>({
      path: `/routes/prop-firms/set-preference`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get detailed commission information for a specific prop firm
   *
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name get_prop_firm_commission_info
   * @summary Get Prop Firm Commission Info
   * @request GET:/routes/prop-firms/commission-info/{prop_firm}
   */
  get_prop_firm_commission_info = (
    { propFirm, ...query }: GetPropFirmCommissionInfoParams,
    params: RequestParams = {},
  ) =>
    this.request<GetPropFirmCommissionInfoData, GetPropFirmCommissionInfoError>({
      path: `/routes/prop-firms/commission-info/${propFirm}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Calculate commission cost for a specific trade
   *
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name calculate_commission_cost
   * @summary Calculate Commission Cost
   * @request POST:/routes/prop-firms/calculate-commission
   */
  calculate_commission_cost = (data: CommissionCalculationRequest, params: RequestParams = {}) =>
    this.request<CalculateCommissionCostData, CalculateCommissionCostError>({
      path: `/routes/prop-firms/calculate-commission`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get user's current prop firm preference and commission info
   *
   * @tags dbtn/module:prop_firm_management, dbtn/hasAuth
   * @name get_user_prop_firm_preference
   * @summary Get User Prop Firm Preference
   * @request GET:/routes/prop-firms/user-preference
   */
  get_user_prop_firm_preference = (params: RequestParams = {}) =>
    this.request<GetUserPropFirmPreferenceData, any>({
      path: `/routes/prop-firms/user-preference`,
      method: "GET",
      ...params,
    });

  /**
   * @description Basic unauthenticated health check endpoint for monitoring
   *
   * @tags dbtn/module:health_check, dbtn/hasAuth
   * @name basic_health_check
   * @summary Basic Health Check
   * @request GET:/routes/health/check
   */
  basic_health_check = (params: RequestParams = {}) =>
    this.request<BasicHealthCheckData, any>({
      path: `/routes/health/check`,
      method: "GET",
      ...params,
    });

  /**
   * @description Simple ping endpoint
   *
   * @tags dbtn/module:health_check, dbtn/hasAuth
   * @name ping
   * @summary Ping
   * @request GET:/routes/health/ping
   */
  ping = (params: RequestParams = {}) =>
    this.request<PingData, any>({
      path: `/routes/health/ping`,
      method: "GET",
      ...params,
    });

  /**
   * @description Preview what would be migrated — no writes to Firestore.
   *
   * @tags migration, dbtn/module:journal_migration, dbtn/hasAuth
   * @name migration_dry_run
   * @summary Migration Dry Run
   * @request POST:/routes/journal-migration/dry-run
   */
  migration_dry_run = (params: RequestParams = {}) =>
    this.request<MigrationDryRunData, any>({
      path: `/routes/journal-migration/dry-run`,
      method: "POST",
      ...params,
    });

  /**
   * @description Execute the migration — write all journal data from Riff storage to Firestore.
   *
   * @tags migration, dbtn/module:journal_migration, dbtn/hasAuth
   * @name migration_execute
   * @summary Migration Execute
   * @request POST:/routes/journal-migration/execute
   */
  migration_execute = (params: RequestParams = {}) =>
    this.request<MigrationExecuteData, any>({
      path: `/routes/journal-migration/execute`,
      method: "POST",
      ...params,
    });

  /**
   * @description Compare record counts between Riff storage and Firestore.
   *
   * @tags migration, dbtn/module:journal_migration, dbtn/hasAuth
   * @name migration_status
   * @summary Migration Status
   * @request GET:/routes/journal-migration/status
   */
  migration_status = (params: RequestParams = {}) =>
    this.request<MigrationStatusData, any>({
      path: `/routes/journal-migration/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get user's trades for public dashboard (no auth required)
   *
   * @tags dbtn/module:public_data, dbtn/hasAuth
   * @name get_user_trades
   * @summary Get User Trades
   * @request GET:/routes/public-data/trades/{user_id}
   */
  get_user_trades = ({ userId, ...query }: GetUserTradesParams, params: RequestParams = {}) =>
    this.request<GetUserTradesData, GetUserTradesError>({
      path: `/routes/public-data/trades/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get user's evaluations for public dashboard (no auth required)
   *
   * @tags dbtn/module:public_data, dbtn/hasAuth
   * @name get_user_evaluations
   * @summary Get User Evaluations
   * @request GET:/routes/public-data/evaluations/{user_id}
   */
  get_user_evaluations = ({ userId, ...query }: GetUserEvaluationsParams, params: RequestParams = {}) =>
    this.request<GetUserEvaluationsData, GetUserEvaluationsError>({
      path: `/routes/public-data/evaluations/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get user's journal entries for public dashboard (no auth required)
   *
   * @tags dbtn/module:public_data, dbtn/hasAuth
   * @name get_user_journal_entries
   * @summary Get User Journal Entries
   * @request GET:/routes/public-data/journal/{user_id}
   */
  get_user_journal_entries = ({ userId, ...query }: GetUserJournalEntriesParams, params: RequestParams = {}) =>
    this.request<GetUserJournalEntriesData, GetUserJournalEntriesError>({
      path: `/routes/public-data/journal/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current week's intentions
   *
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name get_current_weekly_intentions
   * @summary Get Current Weekly Intentions
   * @request GET:/routes/weekly-intentions/current
   */
  get_current_weekly_intentions = (params: RequestParams = {}) =>
    this.request<GetCurrentWeeklyIntentionsData, any>({
      path: `/routes/weekly-intentions/current`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create or update current week's intentions (only allowed on Sunday)
   *
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name create_or_update_current_weekly_intentions
   * @summary Create Or Update Current Weekly Intentions
   * @request POST:/routes/weekly-intentions/current
   */
  create_or_update_current_weekly_intentions = (data: CreateWeeklyIntentionsRequest, params: RequestParams = {}) =>
    this.request<CreateOrUpdateCurrentWeeklyIntentionsData, CreateOrUpdateCurrentWeeklyIntentionsError>({
      path: `/routes/weekly-intentions/current`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all weekly intentions (current and archived)
   *
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name get_weekly_intentions_history
   * @summary Get Weekly Intentions History
   * @request GET:/routes/weekly-intentions/history
   */
  get_weekly_intentions_history = (params: RequestParams = {}) =>
    this.request<GetWeeklyIntentionsHistoryData, any>({
      path: `/routes/weekly-intentions/history`,
      method: "GET",
      ...params,
    });

  /**
   * @description Manually trigger Sunday reset (archives previous weeks)
   *
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name trigger_sunday_reset
   * @summary Trigger Sunday Reset
   * @request POST:/routes/weekly-intentions/sunday-reset
   */
  trigger_sunday_reset = (params: RequestParams = {}) =>
    this.request<TriggerSundayResetData, any>({
      path: `/routes/weekly-intentions/sunday-reset`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for weekly intentions API
   *
   * @tags dbtn/module:weekly_intentions, dbtn/hasAuth
   * @name weekly_intentions_health_check
   * @summary Weekly Intentions Health Check
   * @request GET:/routes/weekly-intentions/health
   */
  weekly_intentions_health_check = (params: RequestParams = {}) =>
    this.request<WeeklyIntentionsHealthCheckData, any>({
      path: `/routes/weekly-intentions/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Store user preference for Pro tier notifications and discount eligibility
   *
   * @tags dbtn/module:pro_notifications, dbtn/hasAuth
   * @name signup_for_pro_notifications
   * @summary Signup For Pro Notifications
   * @request POST:/routes/pro-notifications/signup
   */
  signup_for_pro_notifications = (data: ProNotificationRequest, params: RequestParams = {}) =>
    this.request<SignupForProNotificationsData, SignupForProNotificationsError>({
      path: `/routes/pro-notifications/signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if user has already signed up for Pro notifications
   *
   * @tags dbtn/module:pro_notifications, dbtn/hasAuth
   * @name check_notification_preference
   * @summary Check Notification Preference
   * @request GET:/routes/pro-notifications/check/{user_id}
   */
  check_notification_preference = (
    { userId, ...query }: CheckNotificationPreferenceParams,
    params: RequestParams = {},
  ) =>
    this.request<CheckNotificationPreferenceData, CheckNotificationPreferenceError>({
      path: `/routes/pro-notifications/check/${userId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get Pro waitlist statistics (admin only for now)
   *
   * @tags dbtn/module:pro_notifications, dbtn/hasAuth
   * @name get_waitlist_stats
   * @summary Get Waitlist Stats
   * @request GET:/routes/pro-notifications/stats
   */
  get_waitlist_stats = (params: RequestParams = {}) =>
    this.request<GetWaitlistStatsData, any>({
      path: `/routes/pro-notifications/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Global OPTIONS handler for all CORS preflight requests
   *
   * @tags dbtn/module:global_cors, dbtn/hasAuth
   * @name global_options_handler
   * @summary Global Options Handler
   * @request OPTIONS:/routes/{full_path}
   */
  global_options_handler = ({ fullPath, ...query }: GlobalOptionsHandlerParams, params: RequestParams = {}) =>
    this.request<GlobalOptionsHandlerData, GlobalOptionsHandlerError>({
      path: `/routes/${fullPath}`,
      method: "OPTIONS",
      ...params,
    });

  /**
   * @description Detect corrupted journal entries for the current user
   *
   * @tags dbtn/module:journal_cleanup, dbtn/hasAuth
   * @name detect_corrupted_entries
   * @summary Detect Corrupted Entries
   * @request GET:/routes/detect-corrupted-entries
   */
  detect_corrupted_entries = (params: RequestParams = {}) =>
    this.request<DetectCorruptedEntriesData, any>({
      path: `/routes/detect-corrupted-entries`,
      method: "GET",
      ...params,
    });

  /**
   * @description Clean up corrupted journal entries by removing them and creating backups
   *
   * @tags dbtn/module:journal_cleanup, dbtn/hasAuth
   * @name cleanup_corrupted_entries
   * @summary Cleanup Corrupted Entries
   * @request POST:/routes/cleanup-corrupted-entries
   */
  cleanup_corrupted_entries = (params: RequestParams = {}) =>
    this.request<CleanupCorruptedEntriesData, any>({
      path: `/routes/cleanup-corrupted-entries`,
      method: "POST",
      ...params,
    });

  /**
   * @description Download the TradingBait technical assessment PDF.
   *
   * @tags dbtn/module:pdf_export, dbtn/hasAuth
   * @name download_technical_assessment
   * @summary Download Technical Assessment
   * @request GET:/routes/pdf/technical-assessment
   */
  download_technical_assessment = (params: RequestParams = {}) =>
    this.request<DownloadTechnicalAssessmentData, any>({
      path: `/routes/pdf/technical-assessment`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for review automation API
   *
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name review_automation_health_check
   * @summary Review Automation Health Check
   * @request GET:/routes/review-automation/health
   */
  review_automation_health_check = (params: RequestParams = {}) =>
    this.request<ReviewAutomationHealthCheckData, any>({
      path: `/routes/review-automation/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if any reviews are due for the user
   *
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name check_reviews
   * @summary Check Reviews
   * @request POST:/routes/review-automation/check
   */
  check_reviews = (params: RequestParams = {}) =>
    this.request<CheckReviewsData, any>({
      path: `/routes/review-automation/check`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually trigger review checks and automation
   *
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name trigger_reviews
   * @summary Trigger Reviews
   * @request POST:/routes/review-automation/trigger
   */
  trigger_reviews = (params: RequestParams = {}) =>
    this.request<TriggerReviewsData, any>({
      path: `/routes/review-automation/trigger`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually trigger weekly review
   *
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name trigger_weekly_review_endpoint
   * @summary Trigger Weekly Review Endpoint
   * @request POST:/routes/review-automation/trigger/weekly
   */
  trigger_weekly_review_endpoint = (params: RequestParams = {}) =>
    this.request<TriggerWeeklyReviewEndpointData, any>({
      path: `/routes/review-automation/trigger/weekly`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually trigger monthly review
   *
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name trigger_monthly_review_endpoint
   * @summary Trigger Monthly Review Endpoint
   * @request POST:/routes/review-automation/trigger/monthly
   */
  trigger_monthly_review_endpoint = (params: RequestParams = {}) =>
    this.request<TriggerMonthlyReviewEndpointData, any>({
      path: `/routes/review-automation/trigger/monthly`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get user's review schedule and history
   *
   * @tags dbtn/module:review_automation, dbtn/hasAuth
   * @name get_review_schedule
   * @summary Get Review Schedule
   * @request GET:/routes/review-automation/schedule
   */
  get_review_schedule = (params: RequestParams = {}) =>
    this.request<GetReviewScheduleData, any>({
      path: `/routes/review-automation/schedule`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for affiliate system
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name affiliate_system_health_check
   * @summary Affiliate System Health Check
   * @request GET:/routes/affiliate/health
   */
  affiliate_system_health_check = (params: RequestParams = {}) =>
    this.request<AffiliateSystemHealthCheckData, any>({
      path: `/routes/affiliate/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Register a new affiliate
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name register_affiliate
   * @summary Register Affiliate
   * @request POST:/routes/affiliate/register
   */
  register_affiliate = (data: AffiliateRegistrationRequest, params: RequestParams = {}) =>
    this.request<RegisterAffiliateData, RegisterAffiliateError>({
      path: `/routes/affiliate/register`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get affiliate profile and analytics
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name get_affiliate_profile
   * @summary Get Affiliate Profile
   * @request GET:/routes/affiliate/profile
   */
  get_affiliate_profile = (params: RequestParams = {}) =>
    this.request<GetAffiliateProfileData, any>({
      path: `/routes/affiliate/profile`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a new referral link for affiliate
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name generate_referral_link
   * @summary Generate Referral Link
   * @request POST:/routes/affiliate/generate-link
   */
  generate_referral_link = (data: ReferralLinkRequest, params: RequestParams = {}) =>
    this.request<GenerateReferralLinkData, GenerateReferralLinkError>({
      path: `/routes/affiliate/generate-link`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get detailed earnings information for affiliate
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name get_affiliate_earnings
   * @summary Get Affiliate Earnings
   * @request GET:/routes/affiliate/earnings
   */
  get_affiliate_earnings = (params: RequestParams = {}) =>
    this.request<GetAffiliateEarningsData, any>({
      path: `/routes/affiliate/earnings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Track when a referred user signs up (called during user registration)
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name track_referral_signup
   * @summary Track Referral Signup
   * @request POST:/routes/affiliate/track-signup
   */
  track_referral_signup = (query: TrackReferralSignupParams, params: RequestParams = {}) =>
    this.request<TrackReferralSignupData, TrackReferralSignupError>({
      path: `/routes/affiliate/track-signup`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Track when a referred user converts to paid subscription
   *
   * @tags dbtn/module:affiliate_system, dbtn/hasAuth
   * @name track_referral_conversion
   * @summary Track Referral Conversion
   * @request POST:/routes/affiliate/track-conversion
   */
  track_referral_conversion = (query: TrackReferralConversionParams, params: RequestParams = {}) =>
    this.request<TrackReferralConversionData, TrackReferralConversionError>({
      path: `/routes/affiliate/track-conversion`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get feature unlock status based on user activity
   *
   * @tags dbtn/module:feature_unlock, dbtn/hasAuth
   * @name get_feature_unlock_status
   * @summary Get Feature Unlock Status
   * @request GET:/routes/feature-unlock-status
   */
  get_feature_unlock_status = (params: RequestParams = {}) =>
    this.request<GetFeatureUnlockStatusData, any>({
      path: `/routes/feature-unlock-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle Stripe webhook events
   *
   * @tags dbtn/module:stripe_webhooks, dbtn/hasAuth
   * @name stripe_webhook_handler
   * @summary Stripe Webhook Handler
   * @request POST:/routes/stripe-webhooks/webhook
   */
  stripe_webhook_handler = (params: RequestParams = {}) =>
    this.request<StripeWebhookHandlerData, StripeWebhookHandlerError>({
      path: `/routes/stripe-webhooks/webhook`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for webhook system
   *
   * @tags dbtn/module:stripe_webhooks, dbtn/hasAuth
   * @name webhook_health_check
   * @summary Webhook Health Check
   * @request GET:/routes/stripe-webhooks/health
   */
  webhook_health_check = (params: RequestParams = {}) =>
    this.request<WebhookHealthCheckData, any>({
      path: `/routes/stripe-webhooks/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get performance analytics for the specified time period
   *
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_performance_metrics
   * @summary Get Performance Metrics
   * @request GET:/routes/analytics/performance
   */
  get_performance_metrics = (query: GetPerformanceMetricsParams, params: RequestParams = {}) =>
    this.request<GetPerformanceMetricsData, GetPerformanceMetricsError>({
      path: `/routes/analytics/performance`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get real-time performance statistics
   *
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_realtime_stats
   * @summary Get Realtime Stats
   * @request GET:/routes/analytics/realtime
   */
  get_realtime_stats = (params: RequestParams = {}) =>
    this.request<GetRealtimeStatsData, any>({
      path: `/routes/analytics/realtime`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get error reports from the specified time period
   *
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_error_reports
   * @summary Get Error Reports
   * @request GET:/routes/analytics/errors
   */
  get_error_reports = (query: GetErrorReportsParams, params: RequestParams = {}) =>
    this.request<GetErrorReportsData, GetErrorReportsError>({
      path: `/routes/analytics/errors`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get user behavior analytics
   *
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_user_analytics
   * @summary Get User Analytics
   * @request GET:/routes/analytics/user-analytics
   */
  get_user_analytics = (query: GetUserAnalyticsParams, params: RequestParams = {}) =>
    this.request<GetUserAnalyticsData, GetUserAnalyticsError>({
      path: `/routes/analytics/user-analytics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get system health metrics
   *
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name get_analytics_system_health
   * @summary Get Analytics System Health
   * @request GET:/routes/analytics/health
   */
  get_analytics_system_health = (params: RequestParams = {}) =>
    this.request<GetAnalyticsSystemHealthData, any>({
      path: `/routes/analytics/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Track a user event for analytics
   *
   * @tags dbtn/module:analytics, dbtn/hasAuth
   * @name track_analytics_user_event
   * @summary Track Analytics User Event
   * @request POST:/routes/analytics/track-event
   */
  track_analytics_user_event = (data: TrackingEvent, params: RequestParams = {}) =>
    this.request<TrackAnalyticsUserEventData, TrackAnalyticsUserEventError>({
      path: `/routes/analytics/track-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Migrate all journal data to unified format
   *
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name migrate_journal_data_endpoint
   * @summary Migrate Journal Data Endpoint
   * @request POST:/routes/migration/migrate-journal-data
   */
  migrate_journal_data_endpoint = (params: RequestParams = {}) =>
    this.request<MigrateJournalDataEndpointData, any>({
      path: `/routes/migration/migrate-journal-data`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate journal data for the authenticated user only
   *
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name migrate_user_data_endpoint
   * @summary Migrate User Data Endpoint
   * @request POST:/routes/migration/migrate-user-data
   */
  migrate_user_data_endpoint = (params: RequestParams = {}) =>
    this.request<MigrateUserDataEndpointData, any>({
      path: `/routes/migration/migrate-user-data`,
      method: "POST",
      ...params,
    });

  /**
   * @description Clean up legacy storage files (admin only)
   *
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name cleanup_legacy_storage_endpoint
   * @summary Cleanup Legacy Storage Endpoint
   * @request POST:/routes/migration/cleanup-legacy-storage
   */
  cleanup_legacy_storage_endpoint = (query: CleanupLegacyStorageEndpointParams, params: RequestParams = {}) =>
    this.request<CleanupLegacyStorageEndpointData, CleanupLegacyStorageEndpointError>({
      path: `/routes/migration/cleanup-legacy-storage`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get status of migration for the current user
   *
   * @tags dbtn/module:migration_tools, dbtn/hasAuth
   * @name get_migration_status
   * @summary Get Migration Status
   * @request GET:/routes/migration/migration-status
   */
  get_migration_status = (params: RequestParams = {}) =>
    this.request<GetMigrationStatusData, any>({
      path: `/routes/migration/migration-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new weekly review
   *
   * @tags dbtn/module:weekly_reviews, dbtn/hasAuth
   * @name create_weekly_review
   * @summary Create Weekly Review
   * @request POST:/routes/weekly-reviews
   */
  create_weekly_review = (data: WeeklyReviewCreate, params: RequestParams = {}) =>
    this.request<CreateWeeklyReviewData, CreateWeeklyReviewError>({
      path: `/routes/weekly-reviews`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all weekly reviews for a user with pagination
   *
   * @tags dbtn/module:weekly_reviews, dbtn/hasAuth
   * @name list_weekly_reviews
   * @summary List Weekly Reviews
   * @request GET:/routes/weekly-reviews
   */
  list_weekly_reviews = (query: ListWeeklyReviewsParams, params: RequestParams = {}) =>
    this.request<ListWeeklyReviewsData, ListWeeklyReviewsError>({
      path: `/routes/weekly-reviews`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific weekly review with daily summaries and chart images
   *
   * @tags dbtn/module:weekly_reviews, dbtn/hasAuth
   * @name get_weekly_review
   * @summary Get Weekly Review
   * @request GET:/routes/weekly-reviews/{review_id}
   */
  get_weekly_review = ({ reviewId, ...query }: GetWeeklyReviewParams, params: RequestParams = {}) =>
    this.request<GetWeeklyReviewData, GetWeeklyReviewError>({
      path: `/routes/weekly-reviews/${reviewId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve light theme favicon
   *
   * @tags dbtn/module:static_assets
   * @name get_light_favicon
   * @summary Get Light Favicon
   * @request GET:/routes/light.ico
   */
  get_light_favicon = (params: RequestParams = {}) =>
    this.request<GetLightFaviconData, any>({
      path: `/routes/light.ico`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve dark theme favicon
   *
   * @tags dbtn/module:static_assets
   * @name get_dark_favicon
   * @summary Get Dark Favicon
   * @request GET:/routes/dark.ico
   */
  get_dark_favicon = (params: RequestParams = {}) =>
    this.request<GetDarkFaviconData, any>({
      path: `/routes/dark.ico`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve favicon.ico file
   *
   * @tags dbtn/module:static_assets
   * @name get_favicon_ico
   * @summary Get Favicon Ico
   * @request GET:/routes/favicon.ico
   */
  get_favicon_ico = (params: RequestParams = {}) =>
    this.request<GetFaviconIcoData, any>({
      path: `/routes/favicon.ico`,
      method: "GET",
      ...params,
    });

  /**
   * @description Repair trades that are missing openTime/closeTime by extracting from raw_row_data
   *
   * @tags dbtn/module:repair_trades, dbtn/hasAuth
   * @name repair_trades_datetime
   * @summary Repair Trades Datetime
   * @request POST:/routes/repair-trades
   */
  repair_trades_datetime = (data: RepairTradesRequest, params: RequestParams = {}) =>
    this.request<RepairTradesDatetimeData, RepairTradesDatetimeError>({
      path: `/routes/repair-trades`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Extract the first trade that AI used for column mapping but didn't import
   *
   * @tags dbtn/module:repair_trades, dbtn/hasAuth
   * @name extract_missing_first_trade
   * @summary Extract Missing First Trade
   * @request POST:/routes/extract-missing-first-trade
   */
  extract_missing_first_trade = (params: RequestParams = {}) =>
    this.request<ExtractMissingFirstTradeData, any>({
      path: `/routes/extract-missing-first-trade`,
      method: "POST",
      ...params,
    });

  /**
   * @description Analyze and group trades using multiple strategies
   *
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name analyze_trades
   * @summary Analyze Trades
   * @request POST:/routes/trade-grouping/analyze-trades
   */
  analyze_trades = (data: GroupingRequest, params: RequestParams = {}) =>
    this.request<AnalyzeTradesData, AnalyzeTradesError>({
      path: `/routes/trade-grouping/analyze-trades`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get stored grouping results for a user
   *
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name get_user_groups
   * @summary Get User Groups
   * @request GET:/routes/trade-grouping/user-groups/{user_id}
   */
  get_user_groups = ({ userId, ...query }: GetUserGroupsParams, params: RequestParams = {}) =>
    this.request<GetUserGroupsData, GetUserGroupsError>({
      path: `/routes/trade-grouping/user-groups/${userId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Perform detailed analysis on specific trade groups
   *
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name analyze_groups
   * @summary Analyze Groups
   * @request POST:/routes/trade-grouping/analyze-groups
   */
  analyze_groups = (data: GroupAnalysisRequest, params: RequestParams = {}) =>
    this.request<AnalyzeGroupsData, AnalyzeGroupsError>({
      path: `/routes/trade-grouping/analyze-groups`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get available grouping strategies and their descriptions
   *
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name get_available_strategies
   * @summary Get Available Strategies
   * @request GET:/routes/trade-grouping/strategies
   */
  get_available_strategies = (params: RequestParams = {}) =>
    this.request<GetAvailableStrategiesData, any>({
      path: `/routes/trade-grouping/strategies`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for trade grouping service
   *
   * @tags dbtn/module:trade_grouping, dbtn/hasAuth
   * @name grouping_health_check
   * @summary Grouping Health Check
   * @request GET:/routes/trade-grouping/health
   */
  grouping_health_check = (params: RequestParams = {}) =>
    this.request<GroupingHealthCheckData, any>({
      path: `/routes/trade-grouping/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check CORS configuration status
   *
   * @tags dbtn/module:global_cors, dbtn/hasAuth
   * @name cors_status
   * @summary Cors Status
   * @request GET:/routes/cors-status
   */
  cors_status = (params: RequestParams = {}) =>
    this.request<CorsStatusData, any>({
      path: `/routes/cors-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize a new user in Firestore and our storage systems
   *
   * @tags dbtn/module:user_initialization, dbtn/hasAuth
   * @name initialize_user
   * @summary Initialize User
   * @request POST:/routes/user-initialization/initialize-user
   */
  initialize_user = (data: UserInitializationRequest, params: RequestParams = {}) =>
    this.request<InitializeUserData, InitializeUserError>({
      path: `/routes/user-initialization/initialize-user`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Auto-initialize the current authenticated user
   *
   * @tags dbtn/module:user_initialization, dbtn/hasAuth
   * @name auto_initialize_user
   * @summary Auto Initialize User
   * @request POST:/routes/user-initialization/auto-initialize
   */
  auto_initialize_user = (params: RequestParams = {}) =>
    this.request<AutoInitializeUserData, any>({
      path: `/routes/user-initialization/auto-initialize`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for user initialization system
   *
   * @tags dbtn/module:user_initialization, dbtn/hasAuth
   * @name user_initialization_health_check
   * @summary User Initialization Health Check
   * @request GET:/routes/user-initialization/health
   */
  user_initialization_health_check = (params: RequestParams = {}) =>
    this.request<UserInitializationHealthCheckData, any>({
      path: `/routes/user-initialization/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Send welcome email to new users after signup
   *
   * @tags dbtn/module:welcome_email, dbtn/hasAuth
   * @name send_welcome_email
   * @summary Send Welcome Email
   * @request POST:/routes/send-welcome-email
   */
  send_welcome_email = (data: WelcomeEmailRequest, params: RequestParams = {}) =>
    this.request<SendWelcomeEmailData, SendWelcomeEmailError>({
      path: `/routes/send-welcome-email`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Serve favicon PNG files (16x16, 32x32)
   *
   * @tags dbtn/module:static_assets
   * @name get_favicon_png
   * @summary Get Favicon Png
   * @request GET:/routes/favicon-{size}.png
   */
  get_favicon_png = ({ size, ...query }: GetFaviconPngParams, params: RequestParams = {}) =>
    this.request<GetFaviconPngData, GetFaviconPngError>({
      path: `/routes/favicon-${size}.png`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve Apple Touch Icon (180x180)
   *
   * @tags dbtn/module:static_assets
   * @name get_apple_touch_icon
   * @summary Get Apple Touch Icon
   * @request GET:/routes/apple-touch-icon.png
   */
  get_apple_touch_icon = (params: RequestParams = {}) =>
    this.request<GetAppleTouchIconData, any>({
      path: `/routes/apple-touch-icon.png`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve logo files in various sizes and formats
   *
   * @tags dbtn/module:static_assets
   * @name get_logo
   * @summary Get Logo
   * @request GET:/routes/logo-{size}.{format}
   */
  get_logo = ({ size, format, ...query }: GetLogoParams, params: RequestParams = {}) =>
    this.request<GetLogoData, GetLogoError>({
      path: `/routes/logo-${size}.${format}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve Open Graph image (1200x630)
   *
   * @tags dbtn/module:static_assets
   * @name get_og_image
   * @summary Get Og Image
   * @request GET:/routes/og-image.png
   */
  get_og_image = (params: RequestParams = {}) =>
    this.request<GetOgImageData, any>({
      path: `/routes/og-image.png`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve Twitter card image (1200x675)
   *
   * @tags dbtn/module:static_assets
   * @name get_twitter_image
   * @summary Get Twitter Image
   * @request GET:/routes/twitter-image.png
   */
  get_twitter_image = (params: RequestParams = {}) =>
    this.request<GetTwitterImageData, any>({
      path: `/routes/twitter-image.png`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve main logo (512x512)
   *
   * @tags dbtn/module:static_assets
   * @name get_main_logo
   * @summary Get Main Logo
   * @request GET:/routes/logo.png
   */
  get_main_logo = (params: RequestParams = {}) =>
    this.request<GetMainLogoData, any>({
      path: `/routes/logo.png`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle early access email signup with duplicate prevention and confirmation email.
   *
   * @tags dbtn/module:early_access_signup, dbtn/hasAuth
   * @name early_access_signup
   * @summary Early Access Signup
   * @request POST:/routes/early-access-signup
   */
  early_access_signup = (data: EarlyAccessSignupRequest, params: RequestParams = {}) =>
    this.request<EarlyAccessSignupData, EarlyAccessSignupError>({
      path: `/routes/early-access-signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get early access signup statistics (for admin use).
   *
   * @tags dbtn/module:early_access_signup, dbtn/hasAuth
   * @name get_early_access_stats
   * @summary Get Early Access Stats
   * @request GET:/routes/early-access-stats
   */
  get_early_access_stats = (params: RequestParams = {}) =>
    this.request<GetEarlyAccessStatsData, any>({
      path: `/routes/early-access-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload chart screenshot or other trading-related images
   *
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name upload_image
   * @summary Upload Image
   * @request POST:/routes/image-upload/upload
   */
  upload_image = (data: BodyUploadImage, params: RequestParams = {}) =>
    this.request<UploadImageData, UploadImageError>({
      path: `/routes/image-upload/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Retrieve an uploaded image
   *
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name get_image
   * @summary Get Image
   * @request GET:/routes/image-upload/image/{image_id}
   */
  get_image = ({ imageId, ...query }: GetImageParams, params: RequestParams = {}) =>
    this.request<GetImageData, GetImageError>({
      path: `/routes/image-upload/image/${imageId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete an uploaded image
   *
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name delete_image
   * @summary Delete Image
   * @request DELETE:/routes/image-upload/image/{image_id}
   */
  delete_image = ({ imageId, ...query }: DeleteImageParams, params: RequestParams = {}) =>
    this.request<DeleteImageData, DeleteImageError>({
      path: `/routes/image-upload/image/${imageId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description List all images uploaded by the user
   *
   * @tags dbtn/module:image_upload, dbtn/hasAuth
   * @name list_user_images
   * @summary List User Images
   * @request GET:/routes/image-upload/list
   */
  list_user_images = (params: RequestParams = {}) =>
    this.request<ListUserImagesData, any>({
      path: `/routes/image-upload/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a withdrawal request for funded accounts. Immediate processing - no approval workflow.
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name create_withdrawal
   * @summary Create Withdrawal
   * @request POST:/routes/withdrawals
   */
  create_withdrawal = (data: WithdrawalRequest, params: RequestParams = {}) =>
    this.request<CreateWithdrawalData, CreateWithdrawalError>({
      path: `/routes/withdrawals`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a withdrawal transaction and restore the amount to evaluation balance. Only allows deletion of recent transactions (within 48 hours).
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name delete_withdrawal
   * @summary Delete Withdrawal
   * @request DELETE:/routes/withdrawals/{transaction_id}
   */
  delete_withdrawal = ({ transactionId, ...query }: DeleteWithdrawalParams, params: RequestParams = {}) =>
    this.request<DeleteWithdrawalData, DeleteWithdrawalError>({
      path: `/routes/withdrawals/${transactionId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Create a refund for evaluation costs. Immediate processing - no approval workflow. Impacts business P&L as cost mitigation.
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name create_refund
   * @summary Create Refund
   * @request POST:/routes/refunds
   */
  create_refund = (data: RefundRequest, params: RequestParams = {}) =>
    this.request<CreateRefundData, CreateRefundError>({
      path: `/routes/refunds`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a refund transaction and remove it from evaluation transactions. Only allows deletion of recent transactions (within 48 hours).
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name delete_refund
   * @summary Delete Refund
   * @request DELETE:/routes/refunds/{transaction_id}
   */
  delete_refund = ({ transactionId, ...query }: DeleteRefundParams, params: RequestParams = {}) =>
    this.request<DeleteRefundData, DeleteRefundError>({
      path: `/routes/refunds/${transactionId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get transaction history for user. Optional filtering by transaction type (withdrawal, refund, deposit).
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name get_transaction_history
   * @summary Get Transaction History
   * @request GET:/routes/transactions
   */
  get_transaction_history = (query: GetTransactionHistoryParams, params: RequestParams = {}) =>
    this.request<GetTransactionHistoryData, GetTransactionHistoryError>({
      path: `/routes/transactions`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get specific transaction details.
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name get_transaction
   * @summary Get Transaction
   * @request GET:/routes/transactions/{transaction_id}
   */
  get_transaction = ({ transactionId, ...query }: GetTransactionParams, params: RequestParams = {}) =>
    this.request<GetTransactionData, GetTransactionError>({
      path: `/routes/transactions/${transactionId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get financial summary showing business impact of withdrawals and refunds.
   *
   * @tags dbtn/module:withdrawals_refunds, dbtn/hasAuth
   * @name get_financial_summary
   * @summary Get Financial Summary
   * @request GET:/routes/financial-summary
   */
  get_financial_summary = (query: GetFinancialSummaryParams, params: RequestParams = {}) =>
    this.request<GetFinancialSummaryData, GetFinancialSummaryError>({
      path: `/routes/financial-summary`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Perform comprehensive pattern analysis using advanced AI recognition
   *
   * @tags dbtn/module:comprehensive_pattern_analysis, dbtn/hasAuth
   * @name comprehensive_pattern_analysis_standalone
   * @summary Comprehensive Pattern Analysis Standalone
   * @request POST:/routes/comprehensive-pattern-analysis
   */
  comprehensive_pattern_analysis_standalone = (data: PatternAnalysisRequest, params: RequestParams = {}) =>
    this.request<ComprehensivePatternAnalysisStandaloneData, ComprehensivePatternAnalysisStandaloneError>({
      path: `/routes/comprehensive-pattern-analysis`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for pattern recognition system
   *
   * @tags dbtn/module:comprehensive_pattern_analysis, dbtn/hasAuth
   * @name pattern_recognition_health
   * @summary Pattern Recognition Health
   * @request GET:/routes/pattern-recognition-health
   */
  pattern_recognition_health = (params: RequestParams = {}) =>
    this.request<PatternRecognitionHealthData, any>({
      path: `/routes/pattern-recognition-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Calculate FIFO P&L for trades with optional grouping
   *
   * @tags dbtn/module:fifo_calculation, dbtn/hasAuth
   * @name calculate_fifo_for_trades
   * @summary Calculate Fifo For Trades
   * @request POST:/routes/calculate-fifo
   */
  calculate_fifo_for_trades = (data: FifoCalculationRequest, params: RequestParams = {}) =>
    this.request<CalculateFifoForTradesData, CalculateFifoForTradesError>({
      path: `/routes/calculate-fifo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all early access signups (admin only)
   *
   * @tags dbtn/module:admin_early_access, dbtn/hasAuth
   * @name get_early_access_signups
   * @summary Get Early Access Signups
   * @request GET:/routes/admin/early-access/signups
   */
  get_early_access_signups = (params: RequestParams = {}) =>
    this.request<GetEarlyAccessSignupsData, any>({
      path: `/routes/admin/early-access/signups`,
      method: "GET",
      ...params,
    });

  /**
   * @description Export early access signups as CSV data (admin only)
   *
   * @tags dbtn/module:admin_early_access, dbtn/hasAuth
   * @name export_early_access_signups
   * @summary Export Early Access Signups
   * @request POST:/routes/admin/early-access/export
   */
  export_early_access_signups = (params: RequestParams = {}) =>
    this.request<ExportEarlyAccessSignupsData, any>({
      path: `/routes/admin/early-access/export`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually mark an email as confirmed (admin only)
   *
   * @tags dbtn/module:admin_early_access, dbtn/hasAuth
   * @name mark_signup_confirmed
   * @summary Mark Signup Confirmed
   * @request POST:/routes/admin/early-access/mark-confirmed/{email}
   */
  mark_signup_confirmed = ({ email, ...query }: MarkSignupConfirmedParams, params: RequestParams = {}) =>
    this.request<MarkSignupConfirmedData, MarkSignupConfirmedError>({
      path: `/routes/admin/early-access/mark-confirmed/${email}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for subscription audit system
   *
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name subscription_audit_health_check
   * @summary Subscription Audit Health Check
   * @request GET:/routes/subscription-audit/health
   */
  subscription_audit_health_check = (params: RequestParams = {}) =>
    this.request<SubscriptionAuditHealthCheckData, any>({
      path: `/routes/subscription-audit/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Audit subscription data for a single user
   *
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name audit_single_user
   * @summary Audit Single User
   * @request POST:/routes/subscription-audit/audit-user
   */
  audit_single_user = (query: AuditSingleUserParams, params: RequestParams = {}) =>
    this.request<AuditSingleUserData, AuditSingleUserError>({
      path: `/routes/subscription-audit/audit-user`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Audit all users known to have missing subscriptions
   *
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name audit_missing_users
   * @summary Audit Missing Users
   * @request POST:/routes/subscription-audit/audit-missing-users
   */
  audit_missing_users = (params: RequestParams = {}) =>
    this.request<AuditMissingUsersData, any>({
      path: `/routes/subscription-audit/audit-missing-users`,
      method: "POST",
      ...params,
    });

  /**
   * @description Restore missing subscription record for a user
   *
   * @tags dbtn/module:subscription_audit, dbtn/hasAuth
   * @name restore_subscription
   * @summary Restore Subscription
   * @request POST:/routes/subscription-audit/restore-subscription
   */
  restore_subscription = (data: SubscriptionRestoreRequest, params: RequestParams = {}) =>
    this.request<RestoreSubscriptionData, RestoreSubscriptionError>({
      path: `/routes/subscription-audit/restore-subscription`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a new manual trade entry with rich metadata
   *
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name create_manual_trade
   * @summary Create Manual Trade
   * @request POST:/routes/manual-trades/create
   */
  create_manual_trade = (data: ManualTradeRequest, params: RequestParams = {}) =>
    this.request<CreateManualTradeData, CreateManualTradeError>({
      path: `/routes/manual-trades/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get tag suggestions based on user's previous tag usage
   *
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name get_tag_suggestions
   * @summary Get Tag Suggestions
   * @request GET:/routes/manual-trades/tag-suggestions
   */
  get_tag_suggestions = (params: RequestParams = {}) =>
    this.request<GetTagSuggestionsData, any>({
      path: `/routes/manual-trades/tag-suggestions`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update an existing manual trade
   *
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name update_manual_trade
   * @summary Update Manual Trade
   * @request PUT:/routes/manual-trades/update/{trade_id}
   */
  update_manual_trade = (
    { tradeId, ...query }: UpdateManualTradeParams,
    data: ManualTradeRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateManualTradeData, UpdateManualTradeError>({
      path: `/routes/manual-trades/update/${tradeId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a manual trade
   *
   * @tags dbtn/module:manual_trades, dbtn/hasAuth
   * @name delete_manual_trade
   * @summary Delete Manual Trade
   * @request DELETE:/routes/manual-trades/delete/{trade_id}
   */
  delete_manual_trade = ({ tradeId, ...query }: DeleteManualTradeParams, params: RequestParams = {}) =>
    this.request<DeleteManualTradeData, DeleteManualTradeError>({
      path: `/routes/manual-trades/delete/${tradeId}`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Register user for AI Coach launch notifications
   *
   * @tags dbtn/module:ai_coach_notifications, dbtn/hasAuth
   * @name signup_for_ai_coach_notifications
   * @summary Signup For Ai Coach Notifications
   * @request POST:/routes/ai-coach-notifications/signup
   */
  signup_for_ai_coach_notifications = (data: NotificationSignupRequest, params: RequestParams = {}) =>
    this.request<SignupForAiCoachNotificationsData, SignupForAiCoachNotificationsError>({
      path: `/routes/ai-coach-notifications/signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get statistics about AI Coach notification signups
   *
   * @tags dbtn/module:ai_coach_notifications, dbtn/hasAuth
   * @name get_notification_stats
   * @summary Get Notification Stats
   * @request GET:/routes/ai-coach-notifications/stats
   */
  get_notification_stats = (params: RequestParams = {}) =>
    this.request<GetNotificationStatsData, any>({
      path: `/routes/ai-coach-notifications/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Export user's personal data in compliance with GDPR Article 15 (Right of access)
   *
   * @tags dbtn/module:gdpr_compliance, dbtn/hasAuth
   * @name export_personal_data
   * @summary Export Personal Data
   * @request POST:/routes/export-personal-data
   */
  export_personal_data = (data: DataExportRequest, params: RequestParams = {}) =>
    this.request<ExportPersonalDataData, ExportPersonalDataError>({
      path: `/routes/export-personal-data`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete user account with smart data anonymization in compliance with GDPR Article 17 (Right to erasure)
   *
   * @tags dbtn/module:gdpr_compliance, dbtn/hasAuth
   * @name delete_account
   * @summary Delete Account
   * @request POST:/routes/delete-account
   */
  delete_account = (data: AccountDeletionRequest, params: RequestParams = {}) =>
    this.request<DeleteAccountData, DeleteAccountError>({
      path: `/routes/delete-account`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get information about what data is stored and retention policies
   *
   * @tags dbtn/module:gdpr_compliance, dbtn/hasAuth
   * @name get_data_retention_info
   * @summary Get Data Retention Info
   * @request GET:/routes/data-retention-info
   */
  get_data_retention_info = (params: RequestParams = {}) =>
    this.request<GetDataRetentionInfoData, any>({
      path: `/routes/data-retention-info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete ALL trades for the user - both within evaluations and orphaned trades
   *
   * @tags dbtn/module:trade_management, dbtn/hasAuth
   * @name delete_all_trades
   * @summary Delete All Trades
   * @request DELETE:/routes/all-trades
   */
  delete_all_trades = (params: RequestParams = {}) =>
    this.request<DeleteAllTradesData, any>({
      path: `/routes/all-trades`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Delete all trades for a specific account ID WITHOUT deleting the evaluations
   *
   * @tags dbtn/module:trade_management, dbtn/hasAuth
   * @name delete_trades_by_account
   * @summary Delete Trades By Account
   * @request DELETE:/routes/trades-by-account/{account_id}
   */
  delete_trades_by_account = ({ accountId, ...query }: DeleteTradesByAccountParams, params: RequestParams = {}) =>
    this.request<DeleteTradesByAccountData, DeleteTradesByAccountError>({
      path: `/routes/trades-by-account/${accountId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Delete all trades for a specific evaluation WITHOUT deleting the evaluation itself
   *
   * @tags dbtn/module:trade_management, dbtn/hasAuth
   * @name delete_trades_by_evaluation
   * @summary Delete Trades By Evaluation
   * @request DELETE:/routes/trades-by-evaluation/{evaluation_id}
   */
  delete_trades_by_evaluation = (
    { evaluationId, ...query }: DeleteTradesByEvaluationParams,
    params: RequestParams = {},
  ) =>
    this.request<DeleteTradesByEvaluationData, DeleteTradesByEvaluationError>({
      path: `/routes/trades-by-evaluation/${evaluationId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Creates a Stripe checkout session for a free trial.
   *
   * @tags dbtn/module:stripe, dbtn/hasAuth
   * @name create_trial_checkout
   * @summary Create Trial Checkout
   * @request POST:/routes/create-trial-checkout
   */
  create_trial_checkout = (data: TrialCheckoutRequest, params: RequestParams = {}) =>
    this.request<CreateTrialCheckoutData, CreateTrialCheckoutError>({
      path: `/routes/create-trial-checkout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all screenshots for a specific trade
   *
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name list_trade_screenshots
   * @summary List Trade Screenshots
   * @request GET:/routes/trade-screenshots/list/{trade_id}
   */
  list_trade_screenshots = ({ tradeId, ...query }: ListTradeScreenshotsParams, params: RequestParams = {}) =>
    this.request<ListTradeScreenshotsData, ListTradeScreenshotsError>({
      path: `/routes/trade-screenshots/list/${tradeId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload a screenshot for a specific trade
   *
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name upload_trade_screenshot
   * @summary Upload Trade Screenshot
   * @request POST:/routes/trade-screenshots/upload/{trade_id}
   */
  upload_trade_screenshot = (
    { tradeId, ...query }: UploadTradeScreenshotParams,
    data: BodyUploadTradeScreenshot,
    params: RequestParams = {},
  ) =>
    this.request<UploadTradeScreenshotData, UploadTradeScreenshotError>({
      path: `/routes/trade-screenshots/upload/${tradeId}`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Serve screenshot publicly (no authentication required)
   *
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name get_public_screenshot
   * @summary Get Public Screenshot
   * @request GET:/routes/trade-screenshots/public/{screenshot_id}
   */
  get_public_screenshot = ({ screenshotId, ...query }: GetPublicScreenshotParams, params: RequestParams = {}) =>
    this.request<GetPublicScreenshotData, GetPublicScreenshotError>({
      path: `/routes/trade-screenshots/public/${screenshotId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Serve screenshot via /image/ path for backward compatibility
   *
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name get_trade_screenshot
   * @summary Get Trade Screenshot
   * @request GET:/routes/trade-screenshots/image/{screenshot_id}
   */
  get_trade_screenshot = ({ screenshotId, ...query }: GetTradeScreenshotParams, params: RequestParams = {}) =>
    this.request<GetTradeScreenshotData, GetTradeScreenshotError>({
      path: `/routes/trade-screenshots/image/${screenshotId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a specific screenshot
   *
   * @tags dbtn/module:trade_screenshots, dbtn/hasAuth
   * @name delete_trade_screenshot
   * @summary Delete Trade Screenshot
   * @request DELETE:/routes/trade-screenshots/delete/{screenshot_id}
   */
  delete_trade_screenshot = ({ screenshotId, ...query }: DeleteTradeScreenshotParams, params: RequestParams = {}) =>
    this.request<DeleteTradeScreenshotData, DeleteTradeScreenshotError>({
      path: `/routes/trade-screenshots/delete/${screenshotId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Health check for trading platform API
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name trading_platform_health_check
   * @summary Trading Platform Health Check
   * @request GET:/routes/trading-platform/health
   */
  trading_platform_health_check = (params: RequestParams = {}) =>
    this.request<TradingPlatformHealthCheckData, any>({
      path: `/routes/trading-platform/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Connect to a trading platform (MT4, MT5)
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name connect_platform
   * @summary Connect Platform
   * @request POST:/routes/trading-platform/connect
   */
  connect_platform = (data: ConnectRequest, params: RequestParams = {}) =>
    this.request<ConnectPlatformData, ConnectPlatformError>({
      path: `/routes/trading-platform/connect`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get platform connection status
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name get_platform_connection
   * @summary Get Platform Connection
   * @request GET:/routes/trading-platform/connection/{platform}
   */
  get_platform_connection = ({ platform, ...query }: GetPlatformConnectionParams, params: RequestParams = {}) =>
    this.request<GetPlatformConnectionData, GetPlatformConnectionError>({
      path: `/routes/trading-platform/connection/${platform}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Disconnect from a trading platform
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name disconnect_platform
   * @summary Disconnect Platform
   * @request DELETE:/routes/trading-platform/connection/{platform}
   */
  disconnect_platform = ({ platform, ...query }: DisconnectPlatformParams, params: RequestParams = {}) =>
    this.request<DisconnectPlatformData, DisconnectPlatformError>({
      path: `/routes/trading-platform/connection/${platform}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Sync trades from connected platform
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name sync_platform_trades
   * @summary Sync Platform Trades
   * @request POST:/routes/trading-platform/sync/{platform}
   */
  sync_platform_trades = ({ platform, ...query }: SyncPlatformTradesParams, params: RequestParams = {}) =>
    this.request<SyncPlatformTradesData, SyncPlatformTradesError>({
      path: `/routes/trading-platform/sync/${platform}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get all evaluations for user
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name get_evaluations
   * @summary Get Evaluations
   * @request GET:/routes/trading-platform/evaluations
   */
  get_evaluations = (params: RequestParams = {}) =>
    this.request<GetEvaluationsData, any>({
      path: `/routes/trading-platform/evaluations`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new trading evaluation
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name create_evaluation
   * @summary Create Evaluation
   * @request POST:/routes/trading-platform/evaluations
   */
  create_evaluation = (data: EvaluationRequest, params: RequestParams = {}) =>
    this.request<CreateEvaluationData, CreateEvaluationError>({
      path: `/routes/trading-platform/evaluations`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete an evaluation and all its trades
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name delete_evaluation
   * @summary Delete Evaluation
   * @request DELETE:/routes/trading-platform/evaluations/{evaluation_id}
   */
  delete_evaluation = ({ evaluationId, ...query }: DeleteEvaluationParams, params: RequestParams = {}) =>
    this.request<DeleteEvaluationData, DeleteEvaluationError>({
      path: `/routes/trading-platform/evaluations/${evaluationId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Import multiple trades from AI parser into a specific evaluation
   *
   * @tags dbtn/module:trading_platform, dbtn/hasAuth
   * @name bulk_import_trades
   * @summary Bulk Import Trades
   * @request POST:/routes/trading-platform/bulk-import-trades
   */
  bulk_import_trades = (data: BulkTradeRequest, params: RequestParams = {}) =>
    this.request<BulkImportTradesData, BulkImportTradesError>({
      path: `/routes/trading-platform/bulk-import-trades`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for business metrics system
   *
   * @tags dbtn/module:business_metrics, dbtn/hasAuth
   * @name business_metrics_health_check
   * @summary Business Metrics Health Check
   * @request GET:/routes/business-metrics/health
   */
  business_metrics_health_check = (params: RequestParams = {}) =>
    this.request<BusinessMetricsHealthCheckData, any>({
      path: `/routes/business-metrics/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get comprehensive business metrics including MRR, CLTV, and churn analytics
   *
   * @tags dbtn/module:business_metrics, dbtn/hasAuth
   * @name get_comprehensive_business_metrics
   * @summary Get Comprehensive Business Metrics
   * @request GET:/routes/business-metrics/comprehensive
   */
  get_comprehensive_business_metrics = (query: GetComprehensiveBusinessMetricsParams, params: RequestParams = {}) =>
    this.request<GetComprehensiveBusinessMetricsData, GetComprehensiveBusinessMetricsError>({
      path: `/routes/business-metrics/comprehensive`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description List all affiliates with filtering and pagination (admin only)
   *
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name list_affiliates
   * @summary List Affiliates
   * @request GET:/routes/admin/affiliate/list
   */
  list_affiliates = (query: ListAffiliatesParams, params: RequestParams = {}) =>
    this.request<ListAffiliatesData, ListAffiliatesError>({
      path: `/routes/admin/affiliate/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Approve or reject an affiliate application (admin only)
   *
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name approve_affiliate
   * @summary Approve Affiliate
   * @request POST:/routes/admin/affiliate/approve
   */
  approve_affiliate = (data: AffiliateApprovalRequest, params: RequestParams = {}) =>
    this.request<ApproveAffiliateData, ApproveAffiliateError>({
      path: `/routes/admin/affiliate/approve`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get overall affiliate program analytics (admin only)
   *
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name get_affiliate_program_analytics
   * @summary Get Affiliate Program Analytics
   * @request GET:/routes/admin/affiliate/analytics
   */
  get_affiliate_program_analytics = (params: RequestParams = {}) =>
    this.request<GetAffiliateProgramAnalyticsData, any>({
      path: `/routes/admin/affiliate/analytics`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all referrals with filtering (admin only)
   *
   * @tags dbtn/module:admin_affiliate, dbtn/hasAuth
   * @name list_all_referrals
   * @summary List All Referrals
   * @request GET:/routes/admin/affiliate/referrals
   */
  list_all_referrals = (query: ListAllReferralsParams, params: RequestParams = {}) =>
    this.request<ListAllReferralsData, ListAllReferralsError>({
      path: `/routes/admin/affiliate/referrals`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Test Stripe API connection
   *
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name check_stripe_connection
   * @summary Check Stripe Connection
   * @request GET:/routes/stripe/health
   */
  check_stripe_connection = (params: RequestParams = {}) =>
    this.request<CheckStripeConnectionData, any>({
      path: `/routes/stripe/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a Stripe product and price for subscriptions
   *
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_stripe_product
   * @summary Create Stripe Product
   * @request POST:/routes/stripe/create-product
   */
  create_stripe_product = (data: CreateProductRequest, params: RequestParams = {}) =>
    this.request<CreateStripeProductData, CreateStripeProductError>({
      path: `/routes/stripe/create-product`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all Stripe products and prices
   *
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name list_stripe_products
   * @summary List Stripe Products
   * @request GET:/routes/stripe/products
   */
  list_stripe_products = (params: RequestParams = {}) =>
    this.request<ListStripeProductsData, any>({
      path: `/routes/stripe/products`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a Stripe checkout session with dynamic discount support
   *
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_stripe_checkout
   * @summary Create Stripe Checkout
   * @request POST:/routes/stripe/create-checkout
   */
  create_stripe_checkout = (data: CreateCheckoutRequest, params: RequestParams = {}) =>
    this.request<CreateStripeCheckoutData, CreateStripeCheckoutError>({
      path: `/routes/stripe/create-checkout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a Stripe checkout session for a direct subscription (no trial)
   *
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_subscription_checkout
   * @summary Create Subscription Checkout
   * @request POST:/routes/stripe/create-subscription-checkout
   */
  create_subscription_checkout = (data: CreateSubscriptionCheckoutRequest, params: RequestParams = {}) =>
    this.request<CreateSubscriptionCheckoutData, CreateSubscriptionCheckoutError>({
      path: `/routes/stripe/create-subscription-checkout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a Stripe checkout session for TradingBait at $7.99/month — no trial.
   *
   * @tags dbtn/module:stripe_integration, dbtn/hasAuth
   * @name create_trial_checkout2
   * @summary Create Trial Checkout
   * @request POST:/routes/stripe/create-trial-checkout
   * @originalName create_trial_checkout
   * @duplicate
   */
  create_trial_checkout2 = (data: CreateTrialCheckoutRequest, params: RequestParams = {}) =>
    this.request<CreateTrialCheckout2Data, CreateTrialCheckout2Error>({
      path: `/routes/stripe/create-trial-checkout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send support email from user to support team
   *
   * @tags dbtn/module:support_email, dbtn/hasAuth
   * @name send_support_email
   * @summary Send Support Email
   * @request POST:/routes/send-support-email
   */
  send_support_email = (data: SupportEmailRequest, params: RequestParams = {}) =>
    this.request<SendSupportEmailData, SendSupportEmailError>({
      path: `/routes/send-support-email`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get real-time traffic summary
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_real_time_summary
   * @summary Get Real Time Summary
   * @request GET:/routes/traffic-analytics/real-time-summary
   */
  get_real_time_summary = (params: RequestParams = {}) =>
    this.request<GetRealTimeSummaryData, any>({
      path: `/routes/traffic-analytics/real-time-summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get business KPIs and metrics
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_business_metrics
   * @summary Get Business Metrics
   * @request GET:/routes/traffic-analytics/business-metrics
   */
  get_business_metrics = (query: GetBusinessMetricsParams, params: RequestParams = {}) =>
    this.request<GetBusinessMetricsData, GetBusinessMetricsError>({
      path: `/routes/traffic-analytics/business-metrics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get endpoint performance analytics
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_endpoint_analytics
   * @summary Get Endpoint Analytics
   * @request GET:/routes/traffic-analytics/endpoint-analytics
   */
  get_endpoint_analytics = (query: GetEndpointAnalyticsParams, params: RequestParams = {}) =>
    this.request<GetEndpointAnalyticsData, GetEndpointAnalyticsError>({
      path: `/routes/traffic-analytics/endpoint-analytics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get user behavior and navigation patterns
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_user_behavior
   * @summary Get User Behavior
   * @request GET:/routes/traffic-analytics/user-behavior
   */
  get_user_behavior = (query: GetUserBehaviorParams, params: RequestParams = {}) =>
    this.request<GetUserBehaviorData, GetUserBehaviorError>({
      path: `/routes/traffic-analytics/user-behavior`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get system health and performance metrics
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_system_health2
   * @summary Get System Health
   * @request GET:/routes/traffic-analytics/system-health
   * @originalName get_system_health
   * @duplicate
   */
  get_system_health2 = (query: GetSystemHealth2Params, params: RequestParams = {}) =>
    this.request<GetSystemHealth2Data, GetSystemHealth2Error>({
      path: `/routes/traffic-analytics/system-health`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get historical trends and patterns
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name get_historical_trends
   * @summary Get Historical Trends
   * @request GET:/routes/traffic-analytics/historical-trends
   */
  get_historical_trends = (query: GetHistoricalTrendsParams, params: RequestParams = {}) =>
    this.request<GetHistoricalTrendsData, GetHistoricalTrendsError>({
      path: `/routes/traffic-analytics/historical-trends`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Check for traffic and performance alerts
   *
   * @tags dbtn/module:traffic_analytics, dbtn/hasAuth
   * @name check_traffic_alerts
   * @summary Check Traffic Alerts
   * @request GET:/routes/traffic-analytics/alerts-check
   */
  check_traffic_alerts = (params: RequestParams = {}) =>
    this.request<CheckTrafficAlertsData, any>({
      path: `/routes/traffic-analytics/alerts-check`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name test_admin
   * @summary Test Admin
   * @request GET:/routes/admin/test
   */
  test_admin = (params: RequestParams = {}) =>
    this.request<TestAdminData, any>({
      path: `/routes/admin/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all users with pagination (admin only)
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name list_all_users
   * @summary List All Users
   * @request GET:/routes/admin/users
   */
  list_all_users = (query: ListAllUsersParams, params: RequestParams = {}) =>
    this.request<ListAllUsersData, ListAllUsersError>({
      path: `/routes/admin/users`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Grant subscription access to a user (admin only)
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name grant_subscription
   * @summary Grant Subscription
   * @request POST:/routes/admin/grant-subscription
   */
  grant_subscription = (data: SubscriptionManagementRequest, params: RequestParams = {}) =>
    this.request<GrantSubscriptionData, GrantSubscriptionError>({
      path: `/routes/admin/grant-subscription`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Revoke subscription access from a user (admin only)
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name revoke_subscription
   * @summary Revoke Subscription
   * @request POST:/routes/admin/revoke-subscription
   */
  revoke_subscription = (data: SubscriptionManagementRequest, params: RequestParams = {}) =>
    this.request<RevokeSubscriptionData, RevokeSubscriptionError>({
      path: `/routes/admin/revoke-subscription`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
