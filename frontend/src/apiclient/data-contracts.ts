/** AccountDeletionRequest */
export interface AccountDeletionRequest {
  /** Confirmation Text */
  confirmation_text: string;
  /**
   * Immediate Deletion
   * @default true
   */
  immediate_deletion?: boolean;
}

/** AccountDeletionResponse */
export interface AccountDeletionResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Anonymized Data Retained */
  anonymized_data_retained: boolean;
  /** Deletion Timestamp */
  deletion_timestamp: string;
}

/** AffiliateAnalytics */
export interface AffiliateAnalytics {
  /** Affiliate Id */
  affiliate_id: string;
  /** Period Start */
  period_start: string;
  /** Period End */
  period_end: string;
  /**
   * Total Clicks
   * @default 0
   */
  total_clicks?: number;
  /**
   * Total Signups
   * @default 0
   */
  total_signups?: number;
  /**
   * Total Conversions
   * @default 0
   */
  total_conversions?: number;
  /**
   * Conversion Rate
   * @default 0
   */
  conversion_rate?: number;
  /**
   * Total Revenue Generated
   * @default 0
   */
  total_revenue_generated?: number;
  /**
   * Total Commissions Earned
   * @default 0
   */
  total_commissions_earned?: number;
  /**
   * Active Subscribers
   * @default 0
   */
  active_subscribers?: number;
  /**
   * Cancelled Subscribers
   * @default 0
   */
  cancelled_subscribers?: number;
}

/** AffiliateApprovalRequest */
export interface AffiliateApprovalRequest {
  /** Affiliate Id */
  affiliate_id: string;
  /** Action */
  action: string;
  /** Notes */
  notes?: string | null;
}

/** AffiliateApprovalResponse */
export interface AffiliateApprovalResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** AffiliateListItem */
export interface AffiliateListItem {
  /** Affiliate Id */
  affiliate_id: string;
  /** Full Name */
  full_name: string;
  /** Email */
  email: string;
  /** Company Name */
  company_name?: string | null;
  /** Website Url */
  website_url?: string | null;
  /** Status */
  status: string;
  /** Referral Code */
  referral_code: string;
  /** Total Earnings */
  total_earnings: number;
  /** Total Referrals */
  total_referrals: number;
  /** Active Referrals */
  active_referrals: number;
  /** Created At */
  created_at: string;
  /** Marketing Experience */
  marketing_experience: string;
  /** Referral Method */
  referral_method: string;
}

/** AffiliateManagementResponse */
export interface AffiliateManagementResponse {
  /** Affiliates */
  affiliates: AffiliateListItem[];
  /** Total Count */
  total_count: number;
  /** Pending Count */
  pending_count: number;
  /** Approved Count */
  approved_count: number;
  /** Total Earnings Paid */
  total_earnings_paid: number;
  /** Total Active Referrals */
  total_active_referrals: number;
}

/** AffiliateProfile */
export interface AffiliateProfile {
  /** Affiliate Id */
  affiliate_id: string;
  /** User Id */
  user_id: string;
  /** Full Name */
  full_name: string;
  /** Email */
  email: string;
  /** Company Name */
  company_name?: string | null;
  /** Website Url */
  website_url?: string | null;
  /** Social Media Handles */
  social_media_handles?: Record<string, string> | null;
  /** Audience Size */
  audience_size?: number | null;
  /** Audience Description */
  audience_description: string;
  /** Marketing Experience */
  marketing_experience: string;
  /** Referral Method */
  referral_method: string;
  /** Motivation */
  motivation: string;
  /** Status */
  status: string;
  /** Referral Code */
  referral_code: string;
  /**
   * Commission Rate First Month
   * @default 0.2
   */
  commission_rate_first_month?: number;
  /**
   * Commission Rate Recurring
   * @default 0.1
   */
  commission_rate_recurring?: number;
  /**
   * Total Earnings
   * @default 0
   */
  total_earnings?: number;
  /**
   * Pending Earnings
   * @default 0
   */
  pending_earnings?: number;
  /**
   * Paid Earnings
   * @default 0
   */
  paid_earnings?: number;
  /**
   * Total Referrals
   * @default 0
   */
  total_referrals?: number;
  /**
   * Active Referrals
   * @default 0
   */
  active_referrals?: number;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
  /** Approved At */
  approved_at?: string | null;
  /** Approved By */
  approved_by?: string | null;
}

/** AffiliateProfileResponse */
export interface AffiliateProfileResponse {
  profile: AffiliateProfile;
  analytics: AffiliateAnalytics;
  /** Recent Referrals */
  recent_referrals: ReferralRecord[];
}

/** AffiliateRegistrationRequest */
export interface AffiliateRegistrationRequest {
  /** Full Name */
  full_name: string;
  /**
   * Email
   * @format email
   */
  email: string;
  /** Company Name */
  company_name?: string | null;
  /** Website Url */
  website_url?: string | null;
  /** Social Media Handles */
  social_media_handles?: Record<string, string> | null;
  /** Audience Size */
  audience_size?: number | null;
  /** Audience Description */
  audience_description: string;
  /** Marketing Experience */
  marketing_experience: string;
  /** Referral Method */
  referral_method: string;
  /** Motivation */
  motivation: string;
  /** Terms Accepted */
  terms_accepted: boolean;
}

/** AffiliateRegistrationResponse */
export interface AffiliateRegistrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Affiliate Id */
  affiliate_id?: string | null;
  /** Status */
  status: string;
}

/** AnalyticsResponse */
export interface AnalyticsResponse {
  /** Total Entries */
  total_entries: number;
  /** Current Streak */
  current_streak: number;
  /** Longest Streak */
  longest_streak: number;
  /** Avg Mood Score */
  avg_mood_score: number;
  /** Avg Energy Level */
  avg_energy_level: number;
  /** Habit Completion Rates */
  habit_completion_rates: Record<string, number>;
  /** Most Consistent Habit */
  most_consistent_habit?: string | null;
  /**
   * Improvement Areas
   * @default []
   */
  improvement_areas?: string[];
  /** Trading Performance */
  trading_performance?: Record<string, any> | null;
}

/** ApplyDiscountRequest */
export interface ApplyDiscountRequest {
  /** Code */
  code: string;
  /** User Email */
  user_email: string;
  /** Order Amount */
  order_amount?: number | null;
}

/** ApplyDiscountResponse */
export interface ApplyDiscountResponse {
  /** Valid */
  valid: boolean;
  /** Discount Amount */
  discount_amount: number;
  /** Discount Type */
  discount_type: string;
  /** Message */
  message: string;
  /** Stripe Coupon Id */
  stripe_coupon_id?: string | null;
  /** Minimum Amount Required */
  minimum_amount_required?: number | null;
}

/** BehavioralInsight */
export interface BehavioralInsight {
  /** Type */
  type: string;
  /** Title */
  title: string;
  /** Message */
  message: string;
  /** Confidence */
  confidence: number;
  /** Category */
  category: string;
}

/** BehavioralInsightsResponse */
export interface BehavioralInsightsResponse {
  /** Insights */
  insights: BehavioralInsight[];
  /** Streak Data */
  streak_data: Record<string, any>;
  /** Consistency Score */
  consistency_score: number;
}

/** BillingHistory */
export interface BillingHistory {
  /** Id */
  id: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Status */
  status: string;
  /** Created */
  created: number;
  /** Description */
  description: string;
  /** Invoice Pdf */
  invoice_pdf?: string | null;
  /** Receipt Url */
  receipt_url?: string | null;
}

/** Body_analyze_file_structure */
export interface BodyAnalyzeFileStructure {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** Body_process_file */
export interface BodyProcessFile {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** Body_upload_image */
export interface BodyUploadImage {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** Body_upload_trade_screenshot */
export interface BodyUploadTradeScreenshot {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** BulkAuditResponse */
export interface BulkAuditResponse {
  /** Total Users */
  total_users: number;
  /** Complete Records */
  complete_records: number;
  /** Missing Local Subscriptions */
  missing_local_subscriptions: number;
  /** Missing Stripe Data */
  missing_stripe_data: number;
  /** Mismatched Data */
  mismatched_data: number;
  /** Errors */
  errors: number;
  /** Users */
  users: SubscriptionAuditResult[];
}

/** BulkEditRequest */
export interface BulkEditRequest {
  /** Trade Ids */
  trade_ids: string[];
  /** Field Updates */
  field_updates: Record<string, any>;
  /** Reason */
  reason: string;
  /** User Notes */
  user_notes?: string | null;
}

/** BulkEditResponse */
export interface BulkEditResponse {
  /** Success */
  success: boolean;
  /** Total Trades */
  total_trades: number;
  /** Successful Edits */
  successful_edits: number;
  /** Failed Edits */
  failed_edits?: Record<string, string>[];
  /** Validation Warnings */
  validation_warnings?: string[];
  /** Recalculated Metrics */
  recalculated_metrics?: Record<string, any>;
  /** Audit Log Id */
  audit_log_id: string;
}

/** BulkTradeRequest */
export interface BulkTradeRequest {
  /** Evaluation Id */
  evaluation_id: string;
  /** Trades */
  trades: Record<string, any>[];
}

/** BulkTradeResponse */
export interface BulkTradeResponse {
  /** Success */
  success: boolean;
  /** Imported Count */
  imported_count: number;
  /** Failed Count */
  failed_count: number;
  /** Message */
  message: string;
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** CLTVMetrics */
export interface CLTVMetrics {
  /** Average Cltv */
  average_cltv: number;
  /** Median Cltv */
  median_cltv: number;
  /** Cltv By Cohort */
  cltv_by_cohort: Record<string, number>;
  /** Average Customer Lifespan Months */
  average_customer_lifespan_months: number;
  /** Average Monthly Revenue Per User */
  average_monthly_revenue_per_user: number;
}

/** CancelTrialRequest */
export interface CancelTrialRequest {
  /** Reason */
  reason?: string | null;
}

/** CategoryQuestionsResponse */
export interface CategoryQuestionsResponse {
  category: SupportCategory;
  /** Questions */
  questions: SupportQuestion[];
}

/** CategoryResponse */
export interface CategoryResponse {
  /** Categories */
  categories: SupportCategory[];
}

/** ChurnMetrics */
export interface ChurnMetrics {
  /** Monthly Churn Rate */
  monthly_churn_rate: number;
  /** Annual Churn Rate */
  annual_churn_rate: number;
  /** Revenue Churn Rate */
  revenue_churn_rate: number;
  /** Gross Revenue Retention */
  gross_revenue_retention: number;
  /** Net Revenue Retention */
  net_revenue_retention: number;
  /** Customers At Risk */
  customers_at_risk: number;
  /** Churn By Segment */
  churn_by_segment: Record<string, number>;
  /** Churn Reasons */
  churn_reasons: Record<string, number>;
}

/** CleanupResponse */
export interface CleanupResponse {
  /** Success */
  success: boolean;
  /** Corrupted Entries Found */
  corrupted_entries_found: CorruptedEntryInfo[];
  cleanup_result?: CleanupResult;
  /** Message */
  message: string;
}

/** CleanupResult */
export interface CleanupResult {
  /** Fixed Entries */
  fixed_entries: string[];
  /** Skipped Entries */
  skipped_entries: string[];
  /** Backup Created */
  backup_created: boolean;
  /** Backup Key */
  backup_key: string;
}

/** CohortAnalysis */
export interface CohortAnalysis {
  /** Cohort Data */
  cohort_data: Record<string, any>[];
  /** Retention By Cohort */
  retention_by_cohort: Record<string, number[]>;
  /** Revenue By Cohort */
  revenue_by_cohort: Record<string, number[]>;
}

/** CommissionCalculationRequest */
export interface CommissionCalculationRequest {
  /** Prop Firm */
  prop_firm: string;
  /** Symbol */
  symbol: string;
  /** Quantity */
  quantity: number;
}

/** CommissionCalculationResponse */
export interface CommissionCalculationResponse {
  /** Prop Firm */
  prop_firm: string;
  /** Symbol */
  symbol: string;
  /** Quantity */
  quantity: number;
  /** Commission Per Contract */
  commission_per_contract: number;
  /** Total Commission */
  total_commission: number;
  /** Calculation Method */
  calculation_method: string;
}

/** ComprehensivePatternResponse */
export interface ComprehensivePatternResponse {
  /** Insights */
  insights: InsightResult[];
  /** Patterns Detected */
  patterns_detected: PatternResult[];
  /** Analysis Summary */
  analysis_summary: Record<string, any>;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** ConflictResolutionRequest */
export interface ConflictResolutionRequest {
  /** Conflict Id */
  conflict_id: string;
  /** Resolution Action */
  resolution_action: string;
  /** Custom Value */
  custom_value?: null;
  /**
   * Apply To Similar
   * @default false
   */
  apply_to_similar?: boolean;
  /** Reason */
  reason: string;
}

/** ConnectRequest */
export interface ConnectRequest {
  /** Platform */
  platform: string;
  /** Credentials */
  credentials: Record<string, any>;
}

/** CorruptedEntryInfo */
export interface CorruptedEntryInfo {
  /** Date */
  date: string;
  /** Storage Key */
  storage_key: string;
  /** Data Type */
  data_type: string;
  /** Corrupted Data */
  corrupted_data: any;
  /** Error Message */
  error_message: string;
}

/** CreateCheckoutRequest */
export interface CreateCheckoutRequest {
  /** Customer Email */
  customer_email: string;
  /** Success Url */
  success_url: string;
  /** Cancel Url */
  cancel_url: string;
  /** Referral Code */
  referral_code?: string | null;
  /** Discount Code */
  discount_code?: string | null;
  /**
   * Include Pro Waitlist
   * @default false
   */
  include_pro_waitlist?: boolean | null;
}

/** CreateCheckoutResponse */
export interface CreateCheckoutResponse {
  /** Checkout Url */
  checkout_url: string;
  /** Session Id */
  session_id: string;
  /**
   * Discount Applied
   * @default false
   */
  discount_applied?: boolean;
  /** Discount Amount */
  discount_amount?: number | null;
}

/** CreateCustomMoodRequest */
export interface CreateCustomMoodRequest {
  /** Name */
  name: string;
  /**
   * Category
   * @default "custom"
   */
  category?: string | null;
  /** Color */
  color?: string | null;
  /** Icon */
  icon?: string | null;
}

/** CreateHabitRequest */
export interface CreateHabitRequest {
  /** Name */
  name: string;
  /** Category */
  category: string;
  /** Description */
  description?: string | null;
}

/** CreateJournalEntryRequest */
export interface CreateJournalEntryRequest {
  /** Date */
  date: string;
  /** Mood */
  mood?: string | null;
  /** Energy Level */
  energy_level?: number | null;
  /** Market Outlook */
  market_outlook?: string | null;
  /** Post Market Outlook */
  post_market_outlook?: string | null;
  /** Pre Market Notes */
  pre_market_notes?: string | null;
  /** Post Market Notes */
  post_market_notes?: string | null;
  /** Post Market Mood */
  post_market_mood?: string | null;
  /** Lessons Learned */
  lessons_learned?: string | null;
  /**
   * Habits
   * @default []
   */
  habits?: Habit[];
  /** Goals */
  goals?: string | null;
  /** Daily Intentions */
  daily_intentions?: string | null;
  /** Challenges */
  challenges?: string | null;
  /** Wins */
  wins?: string | null;
  /** Uploaded File */
  uploaded_file?: Record<string, any> | null;
}

/** CreateProductRequest */
export interface CreateProductRequest {
  /** Name */
  name: string;
  /** Price Cents */
  price_cents: number;
  /**
   * Currency
   * @default "usd"
   */
  currency?: string;
  /**
   * Interval
   * @default "month"
   */
  interval?: string;
}

/** CreateProductResponse */
export interface CreateProductResponse {
  /** Product Id */
  product_id: string;
  /** Price Id */
  price_id: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Interval */
  interval: string;
}

/** CreateSubscriptionCheckoutRequest */
export interface CreateSubscriptionCheckoutRequest {
  /** Customer Email */
  customer_email: string;
  /** Success Url */
  success_url: string;
  /** Cancel Url */
  cancel_url: string;
  /** Plan Name */
  plan_name: string;
  /** Discount Code */
  discount_code?: string | null;
}

/** CreateSubscriptionCheckoutResponse */
export interface CreateSubscriptionCheckoutResponse {
  /** Checkout Url */
  checkout_url: string;
  /** Session Id */
  session_id: string;
  /**
   * Discount Applied
   * @default false
   */
  discount_applied?: boolean;
  /** Discount Amount */
  discount_amount?: number | null;
}

/** CreateTrialCheckoutRequest */
export interface CreateTrialCheckoutRequest {
  /** Customer Email */
  customer_email: string;
  /** Success Url */
  success_url: string;
  /** Cancel Url */
  cancel_url: string;
  /** Discount Code */
  discount_code?: string | null;
  /**
   * Plan Name
   * @default "basic"
   */
  plan_name?: string;
}

/** CreateTrialCheckoutResponse */
export interface CreateTrialCheckoutResponse {
  /** Checkout Url */
  checkout_url: string;
  /** Session Id */
  session_id: string;
  /**
   * Discount Applied
   * @default false
   */
  discount_applied?: boolean;
  /** Discount Amount */
  discount_amount?: number | null;
}

/** CreateTrialRequest */
export interface CreateTrialRequest {
  /** Plan Name */
  plan_name: string;
  /** Price Id */
  price_id: string;
}

/** CreateWeeklyIntentionsRequest */
export interface CreateWeeklyIntentionsRequest {
  /** Trading Goals */
  trading_goals: string;
  /** Personal Goals */
  personal_goals: string;
}

/** CustomerPortalResponse */
export interface CustomerPortalResponse {
  /** Url */
  url: string;
}

/** DailyStatsRequest */
export interface DailyStatsRequest {
  /** Date */
  date: string;
  /**
   * Days Back
   * @default 30
   */
  days_back?: number | null;
}

/** DailySummary */
export interface DailySummary {
  /** Date */
  date: string;
  /** Mood */
  mood: string;
  /** Habit Completion */
  habit_completion: number;
}

/** DailyUserMetrics */
export interface DailyUserMetrics {
  /** Date */
  date: string;
  /** Active Users */
  active_users: number;
  /** Unique Users */
  unique_users: number;
  /** Authenticated Users */
  authenticated_users: number;
  /** Session Count */
  session_count: number;
  /** Page Views */
  page_views: number;
  /** New Signups */
  new_signups: number;
  /** Returning Users */
  returning_users: number;
  /** Avg Session Duration */
  avg_session_duration: number;
}

/** DataExportRequest */
export interface DataExportRequest {
  /**
   * Include Trading Data
   * @default false
   */
  include_trading_data?: boolean;
  /**
   * Include Journal Entries
   * @default false
   */
  include_journal_entries?: boolean;
  /**
   * Include Preferences
   * @default true
   */
  include_preferences?: boolean;
}

/** DataExportResponse */
export interface DataExportResponse {
  /** Export Data */
  export_data: Record<string, any>;
  /** Export Date */
  export_date: string;
  /** Note */
  note: string;
}

/** DataQualityAssessment */
export interface DataQualityAssessment {
  /** Total Trades */
  total_trades: number;
  /** Quality Score */
  quality_score: number;
  /** Issues */
  issues: DataQualityIssue[];
  /** Conflicts */
  conflicts: TradeConflict[];
  /** Unmatched Trades */
  unmatched_trades: Record<string, any>[];
  /** Summary Stats */
  summary_stats: Record<string, any>;
  /** Recommendations */
  recommendations: string[];
  /** Assessment Timestamp */
  assessment_timestamp: string;
}

/** DataQualityIssue */
export interface DataQualityIssue {
  /** Issue Id */
  issue_id: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Affected Trades */
  affected_trades?: string[];
  /** Suggested Actions */
  suggested_actions?: string[];
  /**
   * Auto Resolvable
   * @default false
   */
  auto_resolvable?: boolean;
  /** Metadata */
  metadata?: Record<string, any>;
  /** Created At */
  created_at: string;
}

/** DeleteAccountTradesRequest */
export interface DeleteAccountTradesRequest {
  /** Account Id */
  account_id: string;
}

/** DeleteAccountTradesResponse */
export interface DeleteAccountTradesResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Deleted Count */
  deleted_count: number;
}

/** DeleteAllTradesResponse */
export interface DeleteAllTradesResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Deleted Count */
  deleted_count: number;
}

/** DeleteResponse */
export interface DeleteResponse {
  /** Success */
  success: boolean;
  /** Deletedcount */
  deletedCount: number;
  /** Message */
  message: string;
}

/** DiscountAnalytics */
export interface DiscountAnalytics {
  /** Total Discounts */
  total_discounts: number;
  /** Active Discounts */
  active_discounts: number;
  /** Total Uses */
  total_uses: number;
  /** Total Savings */
  total_savings: number;
  /** Total Revenue Impact */
  total_revenue_impact: number;
  /** Top Performing Codes */
  top_performing_codes: Record<string, any>[];
  /** Usage By Month */
  usage_by_month: Record<string, any>[];
}

/** DiscountCreateRequest */
export interface DiscountCreateRequest {
  /**
   * Code
   * Discount code (e.g., SAVE20)
   * @minLength 3
   * @maxLength 50
   */
  code: string;
  /**
   * Name
   * Display name for the discount
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * Discount Type
   * Type of discount: percentage, fixed_amount, or free_trial
   */
  discount_type: string;
  /**
   * Value
   * Discount value (percentage or amount in dollars)
   * @exclusiveMin 0
   */
  value: number;
  /**
   * Max Uses
   * Maximum total uses (null for unlimited)
   */
  max_uses?: number | null;
  /**
   * Max Uses Per User
   * Maximum uses per user
   * @default 1
   */
  max_uses_per_user?: number | null;
  /**
   * Expires At
   * Expiration date (null for no expiration)
   */
  expires_at?: string | null;
  /**
   * Minimum Amount
   * Minimum purchase amount required
   */
  minimum_amount?: number | null;
  /**
   * Description
   * Internal description
   */
  description?: string | null;
  /**
   * Active
   * Whether the discount is active
   * @default true
   */
  active?: boolean;
}

/** DiscountDetails */
export interface DiscountDetails {
  /** Id */
  id: string;
  /** Code */
  code: string;
  /** Name */
  name: string;
  /** Discount Type */
  discount_type: string;
  /** Value */
  value: number;
  /** Max Uses */
  max_uses: number | null;
  /** Max Uses Per User */
  max_uses_per_user: number;
  /** Current Uses */
  current_uses: number;
  /** Expires At */
  expires_at: string | null;
  /** Minimum Amount */
  minimum_amount: number | null;
  /** Description */
  description: string | null;
  /** Active */
  active: boolean;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Created By */
  created_by: string;
  /** Updated At */
  updated_at: string | null;
  /** Updated By */
  updated_by: string | null;
  /** Stripe Coupon Id */
  stripe_coupon_id: string | null;
}

/** DiscountUpdateRequest */
export interface DiscountUpdateRequest {
  /** Name */
  name?: string | null;
  /** Max Uses */
  max_uses?: number | null;
  /** Max Uses Per User */
  max_uses_per_user?: number | null;
  /** Expires At */
  expires_at?: string | null;
  /** Minimum Amount */
  minimum_amount?: number | null;
  /** Description */
  description?: string | null;
  /** Active */
  active?: boolean | null;
}

/** EarlyAccessResponse */
export interface EarlyAccessResponse {
  /** Signups */
  signups: EarlyAccessSignup[];
  stats: EarlyAccessStats;
  /** Total Count */
  total_count: number;
}

/** EarlyAccessSignup */
export interface EarlyAccessSignup {
  /** Email */
  email: string;
  /** Signup Date */
  signup_date: string;
  /** Confirmed */
  confirmed: boolean;
  /** Source */
  source: string;
  /** User Agent */
  user_agent?: string | null;
  /** Ip Address */
  ip_address?: string | null;
}

/** EarlyAccessSignupRequest */
export interface EarlyAccessSignupRequest {
  /**
   * Email
   * @format email
   */
  email: string;
}

/** EarlyAccessSignupResponse */
export interface EarlyAccessSignupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Already Subscribed
   * @default false
   */
  already_subscribed?: boolean;
}

/** EarlyAccessStats */
export interface EarlyAccessStats {
  /** Total Signups */
  total_signups: number;
  /** Confirmed Signups */
  confirmed_signups: number;
  /** Confirmation Rate */
  confirmation_rate: number;
  /** Signups Today */
  signups_today: number;
  /** Signups This Week */
  signups_this_week: number;
  /** Signups This Month */
  signups_this_month: number;
}

/**
 * EndpointAnalyticsResponse
 * Endpoint performance analytics
 */
export interface EndpointAnalyticsResponse {
  /** Most Used Endpoints */
  most_used_endpoints: Record<string, any>[];
  /** Slowest Endpoints */
  slowest_endpoints: Record<string, any>[];
  /** Error Prone Endpoints */
  error_prone_endpoints: Record<string, any>[];
  /** Endpoint Categories */
  endpoint_categories: Record<string, number>;
  /** Performance Distribution */
  performance_distribution: Record<string, number>;
}

/** ErrorReport */
export interface ErrorReport {
  /** Error Id */
  error_id: string;
  /** Message */
  message: string;
  /** Severity */
  severity: string;
  /** Component */
  component: string;
  /** Timestamp */
  timestamp: string;
  /** Context */
  context: Record<string, any>;
}

/** Evaluation */
export interface Evaluation {
  /** Id */
  id: string;
  /** Accountid */
  accountId: string;
  /** Platform */
  platform: string;
  /** Type */
  type: string;
  /** Status */
  status: string;
  /** Createdat */
  createdAt: string;
  /** Updatedat */
  updatedAt: string;
  /** Balance */
  balance?: number | null;
  /** Equity */
  equity?: number | null;
  /** Drawdown */
  drawdown?: number | null;
  /** Profittarget */
  profitTarget?: number | null;
  /** Maxdrawdown */
  maxDrawdown?: number | null;
  /** Tradingdays */
  tradingDays?: number | null;
  /** Remainingdays */
  remainingDays?: number | null;
}

/** EvaluationRequest */
export interface EvaluationRequest {
  /** Accountid */
  accountId: string;
  /** Platform */
  platform: string;
  /**
   * Type
   * @default "challenge"
   */
  type?: string;
  /** Balance */
  balance?: number | null;
  /** Profittarget */
  profitTarget?: number | null;
  /** Maxdrawdown */
  maxDrawdown?: number | null;
  /** Tradingdays */
  tradingDays?: number | null;
}

/** ExtractMissingTradeResponse */
export interface ExtractMissingTradeResponse {
  /** Success */
  success: boolean;
  /** Missing Trade Found */
  missing_trade_found: boolean;
  /** Trade Added */
  trade_added: boolean;
  /** Missing Trade Data */
  missing_trade_data?: Record<string, any> | null;
  /** Message */
  message: string;
}

/** FeatureUnlockStatus */
export interface FeatureUnlockStatus {
  /** Journal Count */
  journal_count: number;
  /** Trade Count */
  trade_count: number;
  /** Feature Unlocks */
  feature_unlocks: Record<string, boolean>;
  /** Requirements */
  requirements: Record<string, number>;
}

/**
 * FifoCalculationRequest
 * Request for FIFO calculation
 */
export interface FifoCalculationRequest {
  /**
   * Trades
   * List of trades to calculate FIFO for
   */
  trades: Record<string, any>[];
  /**
   * Use Grouping
   * Whether to use trade grouping before FIFO calculation
   * @default true
   */
  use_grouping?: boolean;
  /**
   * Grouping Strategies
   * Grouping strategies to apply
   * @default ["symbol","session","scaling"]
   */
  grouping_strategies?: string[] | null;
  /**
   * Include Audit Trail
   * Include detailed audit trail in response
   * @default true
   */
  include_audit_trail?: boolean;
}

/**
 * FifoCalculationResponse
 * Response from FIFO calculation
 */
export interface FifoCalculationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Total Trades Processed */
  total_trades_processed: number;
  /** Total Groups */
  total_groups: number;
  /** Total Fifo Pnl */
  total_fifo_pnl: number;
  /** Total Broker Pnl */
  total_broker_pnl: number;
  /** Total Pnl Difference */
  total_pnl_difference: number;
  /** Fifo Win Rate */
  fifo_win_rate: number;
  /** Broker Win Rate */
  broker_win_rate: number;
  /** Methodology Impact */
  methodology_impact: string;
  /** Group Results */
  group_results: FifoGroupResult[];
  /** Ungrouped Trades */
  ungrouped_trades?: FifoTradeResult[];
  /** Audit Trail */
  audit_trail?: Record<string, any>[];
  /** Calculation Timestamp */
  calculation_timestamp: string;
}

/**
 * FifoGroupResult
 * FIFO calculation result for a group of trades
 */
export interface FifoGroupResult {
  /** Group Id */
  group_id: string;
  /** Group Type */
  group_type: string;
  /** Grouping Strategy */
  grouping_strategy: string;
  /** Symbol */
  symbol: string;
  /** Trade Count */
  trade_count: number;
  /** Total Fifo Pnl */
  total_fifo_pnl: number;
  /** Total Broker Pnl */
  total_broker_pnl: number;
  /** Total Pnl Difference */
  total_pnl_difference: number;
  /** Total Realized Pnl */
  total_realized_pnl: number;
  /** Total Unrealized Pnl */
  total_unrealized_pnl: number;
  /** Trades */
  trades: FifoTradeResult[];
  /** Fifo Win Rate */
  fifo_win_rate: number;
  /** Broker Win Rate */
  broker_win_rate: number;
  /** Avg Fifo Pnl */
  avg_fifo_pnl: number;
  /** Avg Broker Pnl */
  avg_broker_pnl: number;
}

/**
 * FifoTradeResult
 * FIFO calculation result for a single trade
 */
export interface FifoTradeResult {
  /** Trade Id */
  trade_id: string;
  /** Symbol */
  symbol: string;
  /** Timestamp */
  timestamp: string;
  /** Action */
  action: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /** Realized Pnl */
  realized_pnl: number;
  /** Unrealized Pnl */
  unrealized_pnl: number;
  /** Total Commission */
  total_commission: number;
  /** Total Swap */
  total_swap: number;
  /** Fifo Net Pnl */
  fifo_net_pnl: number;
  /** Broker Pnl */
  broker_pnl: number;
  /** Pnl Difference */
  pnl_difference: number;
  /** Position Quantity */
  position_quantity: number;
  /** Position Avg Price */
  position_avg_price: number;
  /** Position Direction */
  position_direction: string;
  /** Lots Closed */
  lots_closed?: Record<string, any>[];
  /** Lots Opened */
  lots_opened?: Record<string, any>[];
  /** Calculation Details */
  calculation_details?: Record<string, any>;
}

/** FileAnalysisResponse */
export interface FileAnalysisResponse {
  /** Success */
  success: boolean;
  /** Analysis */
  analysis?: Record<string, any> | null;
  /** Error */
  error?: string | null;
  /** Filename */
  filename: string;
  /** File Size */
  file_size: number;
}

/** FinancialSummary */
export interface FinancialSummary {
  /** Totalwithdrawals */
  totalWithdrawals: number;
  /** Totalrefunds */
  totalRefunds: number;
  /** Netbusinessrevenue */
  netBusinessRevenue: number;
  /** Totalcashflow */
  totalCashFlow: number;
  /** Period */
  period: string;
  /** Startdate */
  startDate: string;
  /** Enddate */
  endDate: string;
}

/** GetNotificationStatsResponse */
export interface GetNotificationStatsResponse {
  /** Total Signups */
  total_signups: number;
  /** Recent Signups */
  recent_signups: number;
  /** Top Features */
  top_features: Record<string, any>[];
}

/**
 * GroupAnalysisRequest
 * Request for analyzing existing groups
 */
export interface GroupAnalysisRequest {
  /** Group Ids */
  group_ids: string[];
  /**
   * Analysis Type
   * Type of analysis: basic, comprehensive, comparative
   * @default "comprehensive"
   */
  analysis_type?: string;
  /** User Id */
  user_id?: string | null;
}

/**
 * GroupAnalysisResponse
 * Group analysis response
 */
export interface GroupAnalysisResponse {
  /** Group Analyses */
  group_analyses: Record<string, any>[];
  /** Comparative Metrics */
  comparative_metrics?: Record<string, any> | null;
  /** Insights */
  insights: string[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * GroupMetrics
 * Group-level metrics
 */
export interface GroupMetrics {
  /** Group Id */
  group_id: string;
  /** Group Type */
  group_type: string;
  /** Grouping Strategy */
  grouping_strategy: string;
  /** Total Trades */
  total_trades: number;
  /** Total Pnl */
  total_pnl: number;
  /** Win Rate */
  win_rate: number;
  /** Total Volume */
  total_volume: number;
  /** Risk Reward Ratio */
  risk_reward_ratio: number;
  /** Avg Hold Time Minutes */
  avg_hold_time_minutes?: number | null;
  /** Start Time */
  start_time?: string | null;
  /** End Time */
  end_time?: string | null;
  /** Duration Minutes */
  duration_minutes?: number | null;
  /** Trading Style */
  trading_style?: string | null;
  /** Market Type */
  market_type?: string | null;
  /** Confidence Score */
  confidence_score: number;
  /** Metadata */
  metadata: Record<string, any>;
}

/**
 * GroupWithTrades
 * Group with full trade details
 */
export interface GroupWithTrades {
  /** Group-level metrics */
  metrics: GroupMetrics;
  /** Trades */
  trades: Record<string, any>[];
}

/**
 * GroupingRequest
 * Request for trade grouping
 */
export interface GroupingRequest {
  /** Trades */
  trades: TradeData[];
  /**
   * Strategies
   * @default ["symbol","session","scaling"]
   */
  strategies?: string[] | null;
  /** Custom Params */
  custom_params?: Record<string, any> | null;
  /** User Id */
  user_id?: string | null;
}

/**
 * GroupingResponse
 * Complete grouping response
 */
export interface GroupingResponse {
  /** Groups */
  groups: GroupWithTrades[];
  /** Ungrouped Trades */
  ungrouped_trades: Record<string, any>[];
  /** Summary of grouping operation */
  summary: GroupingSummary;
  /** Detailed grouping statistics */
  grouping_stats: GroupingStats;
  /** Execution Time Ms */
  execution_time_ms: number;
}

/**
 * GroupingStats
 * Detailed grouping statistics
 */
export interface GroupingStats {
  /** Strategy Distribution */
  strategy_distribution: Record<string, Record<string, any>>;
  /** Trading Style Distribution */
  trading_style_distribution: Record<string, Record<string, any>>;
  /** Market Type Distribution */
  market_type_distribution: Record<string, Record<string, any>>;
  /** Performance Metrics */
  performance_metrics: Record<string, number>;
}

/**
 * GroupingSummary
 * Summary of grouping operation
 */
export interface GroupingSummary {
  /** Total Groups */
  total_groups: number;
  /** Total Trades */
  total_trades: number;
  /** Grouped Trades */
  grouped_trades: number;
  /** Ungrouped Trades */
  ungrouped_trades: number;
  /** Grouping Efficiency */
  grouping_efficiency: number;
  /** Avg Group Size */
  avg_group_size: number;
  /** Total Pnl */
  total_pnl: number;
  /** Profitable Groups */
  profitable_groups: number;
  /** Avg Group Confidence */
  avg_group_confidence: number;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** Habit */
export interface Habit {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Category */
  category: string;
  /**
   * Completed
   * @default false
   */
  completed?: boolean;
  /** Notes */
  notes?: string | null;
}

/** HabitDefinition */
export interface HabitDefinition {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Category */
  category: string;
  /** Created At */
  created_at?: string | null;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
  /** Description */
  description?: string | null;
}

/** HabitResponse */
export interface HabitResponse {
  /** Success */
  success: boolean;
  /**
   * Habits
   * @default []
   */
  habits?: HabitDefinition[];
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** HealthCheckResponse */
export interface HealthCheckResponse {
  /** Status */
  status: string;
  /** Timestamp */
  timestamp: string;
  /** Version */
  version: string;
  /** Environment */
  environment: string;
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** HelpfulVoteRequest */
export interface HelpfulVoteRequest {
  /** Question Id */
  question_id: string;
  /** Helpful */
  helpful: boolean;
}

/** HistoricalMetricsResponse */
export interface HistoricalMetricsResponse {
  /** Metrics */
  metrics: DailyUserMetrics[];
  /** Total Days */
  total_days: number;
  /** Date Range */
  date_range: Record<string, string>;
}

/**
 * HistoricalTrendsResponse
 * Historical data trends and patterns
 */
export interface HistoricalTrendsResponse {
  /** Hourly Traffic */
  hourly_traffic: Record<string, any>[];
  /** Daily Growth */
  daily_growth: Record<string, any>[];
  /** Weekly Patterns */
  weekly_patterns: Record<string, number[]>;
  /** Monthly Summary */
  monthly_summary: Record<string, any>;
}

/** ImageDeleteResponse */
export interface ImageDeleteResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** ImageUploadResponse */
export interface ImageUploadResponse {
  /** Success */
  success: boolean;
  /** Image Id */
  image_id: string;
  /** Message */
  message: string;
  /** File Size */
  file_size?: number | null;
  /** Content Type */
  content_type?: string | null;
}

/** InfrastructureHealthResponse */
export interface InfrastructureHealthResponse {
  /** Overall Status */
  overall_status: string;
  /** Timestamp */
  timestamp: string;
  /** Services */
  services: Record<string, any>;
  /** Critical Issues */
  critical_issues: any[];
  /** Warnings */
  warnings: any[];
  /** Total Response Time Ms */
  total_response_time_ms: number;
}

/** InsightResult */
export interface InsightResult {
  /** Insight Id */
  insight_id: string;
  /** Title */
  title: string;
  /** Insight Type */
  insight_type: string;
  /** Description */
  description: string;
  /** Confidence Level */
  confidence_level: number;
  /** Priority */
  priority: string;
  /** Category */
  category: string;
  /** Ai Narrative */
  ai_narrative: string;
  /** Recommended Actions */
  recommended_actions: string[];
  /** Success Metrics */
  success_metrics: string[];
  /** Estimated Impact */
  estimated_impact: string;
}

/** IssueSeverity */
export enum IssueSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

/** IssueType */
export enum IssueType {
  MissingData = "missing_data",
  DataConflict = "data_conflict",
  InvalidFormat = "invalid_format",
  DuplicateTrades = "duplicate_trades",
  UnmatchedTrades = "unmatched_trades",
  SymbolMismatch = "symbol_mismatch",
  TimestampIssues = "timestamp_issues",
  CalculationMismatch = "calculation_mismatch",
}

/** JournalEntry */
export interface JournalEntry {
  /** Date */
  date: string;
  /** User Id */
  user_id: string;
  /** Mood */
  mood?: string | null;
  /** Energy Level */
  energy_level?: number | null;
  /** Market Outlook */
  market_outlook?: string | null;
  /** Post Market Outlook */
  post_market_outlook?: string | null;
  /** Pre Market Notes */
  pre_market_notes?: string | null;
  /** Post Market Notes */
  post_market_notes?: string | null;
  /** Post Market Mood */
  post_market_mood?: string | null;
  /** Lessons Learned */
  lessons_learned?: string | null;
  /**
   * Habits
   * @default []
   */
  habits?: Habit[];
  /** Goals */
  goals?: string | null;
  /** Daily Intentions */
  daily_intentions?: string | null;
  /** Challenges */
  challenges?: string | null;
  /** Wins */
  wins?: string | null;
  /** Uploaded File */
  uploaded_file?: Record<string, any> | null;
  /** File Analysis */
  file_analysis?: Record<string, any> | null;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/** JournalListResponse */
export interface JournalListResponse {
  /** Success */
  success: boolean;
  /**
   * Entries
   * @default []
   */
  entries?: JournalEntry[];
  /**
   * Total Count
   * @default 0
   */
  total_count?: number;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** JournalResponse */
export interface JournalResponse {
  /** Success */
  success: boolean;
  entry?: JournalEntry | null;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** LogFailureRequest */
export interface LogFailureRequest {
  /** Error Type */
  error_type: string;
  /** Error Message */
  error_message: string;
  /** User Agent */
  user_agent?: string | null;
  /** Additional Context */
  additional_context?: Record<string, any> | null;
}

/** MRRMetrics */
export interface MRRMetrics {
  /** Current Mrr */
  current_mrr: number;
  /** Arr */
  arr: number;
  /** New Mrr */
  new_mrr: number;
  /** Expansion Mrr */
  expansion_mrr: number;
  /** Contraction Mrr */
  contraction_mrr: number;
  /** Churned Mrr */
  churned_mrr: number;
  /** Net Mrr Growth */
  net_mrr_growth: number;
  /** Mrr Growth Rate */
  mrr_growth_rate: number;
}

/** ManualTradeEntry */
export interface ManualTradeEntry {
  /** Symbol */
  symbol: string;
  /** Trade Type */
  trade_type: string;
  /** Quantity */
  quantity: number;
  /** Open Price */
  open_price: number;
  /** Close Price */
  close_price: number;
  /** Open Time */
  open_time: string;
  /** Close Time */
  close_time: string;
  /**
   * Commission
   * @default 0
   */
  commission?: number | null;
  /**
   * Swap
   * @default 0
   */
  swap?: number | null;
  /** Comment */
  comment?: string | null;
  /** Account Id */
  account_id?: string | null;
}

/** ManualTradeRequest */
export interface ManualTradeRequest {
  /** Symbol */
  symbol: string;
  /** Trade Type */
  trade_type: string;
  /** Direction */
  direction: string;
  /** Quantity */
  quantity: number;
  /** Entry Price */
  entry_price: number;
  /** Exit Price */
  exit_price?: number | null;
  /** Pnl */
  pnl?: number | null;
  /** Open Time */
  open_time: string;
  /** Close Time */
  close_time?: string | null;
  /**
   * Commission
   * @default 0
   */
  commission?: number | null;
  /**
   * Swap
   * @default 0
   */
  swap?: number | null;
  /** Notes */
  notes?: string | null;
  /** Custom Tags */
  custom_tags?: string[] | null;
  /** Chart Image Ids */
  chart_image_ids?: string[] | null;
  /** Evaluation Id */
  evaluation_id: string;
  /** Strategy */
  strategy?: string | null;
  /** Market Conditions */
  market_conditions?: string | null;
  /** Emotions Before */
  emotions_before?: string | null;
  /** Emotions After */
  emotions_after?: string | null;
  /** Lessons Learned */
  lessons_learned?: string | null;
}

/** MigrationResponse */
export interface MigrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data: Record<string, any>;
}

/** MigrationResult */
export interface MigrationResult {
  /** Dry Run */
  dry_run: boolean;
  /** Journal Entries Found */
  journal_entries_found: number;
  /** Journal Entries Migrated */
  journal_entries_migrated: number;
  /** Journal Entries Skipped */
  journal_entries_skipped: number;
  /** Weekly Reviews Found */
  weekly_reviews_found: number;
  /** Weekly Reviews Migrated */
  weekly_reviews_migrated: number;
  /** Habit Definitions Found */
  habit_definitions_found: number;
  /** Habit Definitions Migrated */
  habit_definitions_migrated: number;
  /** Total Migrated */
  total_migrated: number;
  /** Errors */
  errors: string[];
  /** Sample Firestore Paths */
  sample_firestore_paths: string[];
}

/** MoodDefinition */
export interface MoodDefinition {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Category */
  category: string;
  /**
   * Is Predefined
   * @default true
   */
  is_predefined?: boolean;
  /** Color */
  color?: string | null;
  /** Icon */
  icon?: string | null;
  /**
   * Usage Count
   * @default 0
   */
  usage_count?: number;
  /** Created At */
  created_at?: string | null;
  /** User Id */
  user_id?: string | null;
}

/** MoodResponse */
export interface MoodResponse {
  /** Success */
  success: boolean;
  /**
   * Moods
   * @default []
   */
  moods?: MoodDefinition[];
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** NotificationSignupRequest */
export interface NotificationSignupRequest {
  /**
   * Email
   * @format email
   */
  email: string;
  /**
   * Features Interested
   * @default []
   */
  features_interested?: string[];
  /**
   * Current Role
   * @default ""
   */
  current_role?: string;
  /**
   * Experience Level
   * @default ""
   */
  experience_level?: string;
}

/** NotificationSignupResponse */
export interface NotificationSignupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Signup Id */
  signup_id: string;
}

/** PatternAnalysisRequest */
export interface PatternAnalysisRequest {
  /** User Id */
  user_id: string;
  /** Trades Data */
  trades_data: Record<string, any>[];
  /**
   * Minimum Confidence
   * @default 0.7
   */
  minimum_confidence?: number;
  /** Context Filter */
  context_filter?: string | null;
}

/** PatternResult */
export interface PatternResult {
  /** Pattern Type */
  pattern_type: string;
  /** Pattern Name */
  pattern_name: string;
  /** Description */
  description: string;
  /** Confidence Score */
  confidence_score: number;
  /** Impact Score */
  impact_score: number;
  /** Supporting Data */
  supporting_data: Record<string, any>;
  /** Actionable Insights */
  actionable_insights: string[];
  /** Occurrence Frequency */
  occurrence_frequency: string;
  /** Trend Direction */
  trend_direction: string;
}

/** PaymentMethod */
export interface PaymentMethod {
  /** Id */
  id: string;
  /** Type */
  type: string;
  /** Card Brand */
  card_brand?: string | null;
  /** Card Last4 */
  card_last4?: string | null;
  /** Card Exp Month */
  card_exp_month?: number | null;
  /** Card Exp Year */
  card_exp_year?: number | null;
  /** Is Default */
  is_default: boolean;
}

/** PerformanceStats */
export interface PerformanceStats {
  /** Total Requests */
  total_requests: number;
  /** Successful Requests */
  successful_requests: number;
  /** Failed Requests */
  failed_requests: number;
  /** Avg Response Time */
  avg_response_time: number;
  /** P95 Response Time */
  p95_response_time: number;
  /** Error Rate */
  error_rate: number;
  /** Slowest Endpoints */
  slowest_endpoints: Record<string, any>[];
  /** Error Breakdown */
  error_breakdown: Record<string, number>;
  /** Time Range */
  time_range: Record<string, any>;
}

/** ProNotificationRequest */
export interface ProNotificationRequest {
  /** Email */
  email: string;
  /** User Id */
  user_id: string;
  /** Notify Me */
  notify_me: boolean;
  /**
   * Current Plan
   * @default "Basic"
   */
  current_plan?: string | null;
}

/** ProNotificationResponse */
export interface ProNotificationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Discount Eligible */
  discount_eligible: boolean;
}

/** ProcessFileResponse */
export interface ProcessFileResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Trades Processed */
  trades_processed: number;
  /** Evaluation Info */
  evaluation_info?: Record<string, any> | null;
}

/** PropFirmListResponse */
export interface PropFirmListResponse {
  /** Available Firms */
  available_firms: Record<string, string>;
  /** Current Selection */
  current_selection?: string | null;
  /** Commission Info */
  commission_info?: Record<string, any> | null;
}

/** PropFirmPreferenceRequest */
export interface PropFirmPreferenceRequest {
  /** Prop Firm */
  prop_firm: string;
  /** Custom Commission Rate */
  custom_commission_rate?: number | null;
}

/** PropFirmPreferenceResponse */
export interface PropFirmPreferenceResponse {
  /** Success */
  success: boolean;
  /** Prop Firm */
  prop_firm: string;
  /** Commission Info */
  commission_info: Record<string, any>;
  /** Message */
  message: string;
}

/** PublicEvaluationsResponse */
export interface PublicEvaluationsResponse {
  /** Evaluations */
  evaluations: Record<string, any>[];
}

/** PublicJournalResponse */
export interface PublicJournalResponse {
  /** Entries */
  entries: Record<string, any>[];
}

/** PublicTradesResponse */
export interface PublicTradesResponse {
  /** Trades */
  trades: Record<string, any>[];
}

/** RealTimeStats */
export interface RealTimeStats {
  /** Current Hour Requests */
  current_hour_requests: number;
  /** Avg Response Time */
  avg_response_time: number;
  /** Error Count */
  error_count: number;
  /** Error Rate */
  error_rate: number;
  /** Last Updated */
  last_updated: string;
}

/** ReferralLinkRequest */
export interface ReferralLinkRequest {
  /** Campaign Name */
  campaign_name?: string | null;
  /** Custom Params */
  custom_params?: Record<string, string> | null;
}

/** ReferralLinkResponse */
export interface ReferralLinkResponse {
  /** Referral Url */
  referral_url: string;
  /** Referral Code */
  referral_code: string;
  /** Qr Code Url */
  qr_code_url?: string | null;
}

/** ReferralRecord */
export interface ReferralRecord {
  /** Referral Id */
  referral_id: string;
  /** Affiliate Id */
  affiliate_id: string;
  /** Referred User Id */
  referred_user_id: string;
  /** Referred Email */
  referred_email: string;
  /** Referral Code */
  referral_code: string;
  /** Status */
  status: string;
  /** Subscription Id */
  subscription_id?: string | null;
  /** First Payment Amount */
  first_payment_amount?: number | null;
  /** First Payment Date */
  first_payment_date?: string | null;
  /** First Commission Amount */
  first_commission_amount?: number | null;
  /**
   * First Commission Status
   * @default "pending"
   */
  first_commission_status?: string;
  /**
   * Recurring Commission Total
   * @default 0
   */
  recurring_commission_total?: number;
  /** Last Payment Date */
  last_payment_date?: string | null;
  /** Created At */
  created_at: string;
  /** Converted At */
  converted_at?: string | null;
}

/** RefundRequest */
export interface RefundRequest {
  /** Evaluationid */
  evaluationId: string;
  /** Amount */
  amount: number;
  /** Reason */
  reason: string;
  /** Description */
  description?: string | null;
}

/** RefundResponse */
export interface RefundResponse {
  /** Success */
  success: boolean;
  transaction: Transaction;
  /** Message */
  message: string;
  /** Businessimpact */
  businessImpact: Record<string, number>;
}

/** RepairTradesRequest */
export interface RepairTradesRequest {
  /** User Id */
  user_id: string;
  /** Evaluation Id */
  evaluation_id?: string | null;
  /**
   * Dry Run
   * @default true
   */
  dry_run?: boolean;
}

/** RepairTradesResponse */
export interface RepairTradesResponse {
  /** Trades Analyzed */
  trades_analyzed: number;
  /** Trades Repaired */
  trades_repaired: number;
  /** Trades Already Ok */
  trades_already_ok: number;
  /** Trades No Datetime Found */
  trades_no_datetime_found: number;
  /** Dry Run */
  dry_run: boolean;
  /** Sample Repairs */
  sample_repairs: any[];
}

/** ScreenshotListResponse */
export interface ScreenshotListResponse {
  /** Screenshots */
  screenshots: ScreenshotMetadata[];
}

/** ScreenshotMetadata */
export interface ScreenshotMetadata {
  /** Screenshot Id */
  screenshot_id: string;
  /** Trade Id */
  trade_id: string;
  /** Filename */
  filename: string;
  /** Content Type */
  content_type: string;
  /** File Size */
  file_size: number;
  /** Uploaded At */
  uploaded_at: string;
  /** Static Url */
  static_url: string;
  /** Caption */
  caption?: string | null;
}

/** ScreenshotUploadResponse */
export interface ScreenshotUploadResponse {
  /** Screenshot Id */
  screenshot_id: string;
  /** Static Url */
  static_url: string;
  /** Message */
  message: string;
}

/** SearchRequest */
export interface SearchRequest {
  /** Query */
  query: string;
  /** Category Id */
  category_id?: string | null;
  /**
   * Limit
   * @default 10
   */
  limit?: number;
}

/** SearchResponse */
export interface SearchResponse {
  /** Results */
  results: SupportQuestion[];
  /** Total Count */
  total_count: number;
  /** Query */
  query: string;
}

/** SimpleRepairResponse */
export interface SimpleRepairResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Trades Repaired */
  trades_repaired: number;
}

/** StatusResult */
export interface StatusResult {
  /** Riff Journal Entries */
  riff_journal_entries: number;
  /** Riff Weekly Reviews */
  riff_weekly_reviews: number;
  /** Riff Habit Definitions */
  riff_habit_definitions: number;
  /** Firestore Users With Journal */
  firestore_users_with_journal: number;
  /** Firestore Journal Entries */
  firestore_journal_entries: number;
  /** Firestore Weekly Reviews */
  firestore_weekly_reviews: number;
  /** Firestore Habit Definitions */
  firestore_habit_definitions: number;
}

/** StreakCalendarDay */
export interface StreakCalendarDay {
  /** Date */
  date: string;
  /** Has Journal Entry */
  has_journal_entry: boolean;
  /** Pre Market Completion Rate */
  pre_market_completion_rate: number;
  /** During Trading Completion Rate */
  during_trading_completion_rate: number;
  /** Post Market Completion Rate */
  post_market_completion_rate: number;
  /** Overall Completion Rate */
  overall_completion_rate: number;
  /** Mood */
  mood?: string | null;
  /** Streak Status */
  streak_status: string;
}

/** StreakInfo */
export interface StreakInfo {
  /** Streak Type */
  streak_type: string;
  /** Current Streak */
  current_streak: number;
  /** Longest Streak */
  longest_streak: number;
  /** Last Activity Date */
  last_activity_date?: string | null;
  /** Total Completions */
  total_completions: number;
  /** Habit Name */
  habit_name?: string | null;
}

/** StreakResponse */
export interface StreakResponse {
  /** Streaks */
  streaks: StreakInfo[];
  /** Calendar Data */
  calendar_data: StreakCalendarDay[];
  /** Total Journal Days */
  total_journal_days: number;
  /** Recovery Mode Active */
  recovery_mode_active: boolean;
  /** Recovery Days Remaining */
  recovery_days_remaining: number;
}

/** StripeConnectionResponse */
export interface StripeConnectionResponse {
  /** Connected */
  connected: boolean;
  /** Account Id */
  account_id?: string | null;
  /** Currency */
  currency?: string | null;
}

/** SubscriptionAuditResult */
export interface SubscriptionAuditResult {
  /** User Email */
  user_email: string;
  /** User Id */
  user_id: string | null;
  /** Local Subscription */
  local_subscription: Record<string, any> | null;
  /** Stripe Customer */
  stripe_customer: Record<string, any> | null;
  /** Stripe Subscriptions */
  stripe_subscriptions: Record<string, any>[];
  /** Firestore User */
  firestore_user: Record<string, any> | null;
  /** Status */
  status: string;
  /** Recommendations */
  recommendations: string[];
}

/** SubscriptionDetails */
export interface SubscriptionDetails {
  /** Id */
  id: string;
  /** Status */
  status: string;
  /** Current Period Start */
  current_period_start: number;
  /** Current Period End */
  current_period_end: number;
  /** Cancel At Period End */
  cancel_at_period_end: boolean;
  /** Product Name */
  product_name: string;
  /** Price Amount */
  price_amount: number;
  /** Currency */
  currency: string;
  /** Interval */
  interval: string;
  /** Created */
  created: number;
  /** Next Payment Date */
  next_payment_date?: number | null;
}

/** SubscriptionFailureStats */
export interface SubscriptionFailureStats {
  /** Total Failures */
  total_failures: number;
  /** Failure Rate Per Hour */
  failure_rate_per_hour: number;
  /** Error Types */
  error_types: Record<string, number>;
  /** Hourly Breakdown */
  hourly_breakdown: Record<string, number>;
  /** Analysis Period Hours */
  analysis_period_hours: number;
  /** Last Updated */
  last_updated: string;
}

/** SubscriptionManagementRequest */
export interface SubscriptionManagementRequest {
  /** User Id */
  user_id: string;
  /** Subscription Type */
  subscription_type: string;
  /** Subscription Status */
  subscription_status: string;
  /** Subscription Notes */
  subscription_notes?: string | null;
}

/** SubscriptionManagementResponse */
export interface SubscriptionManagementResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SubscriptionRestoreRequest */
export interface SubscriptionRestoreRequest {
  /** User Email */
  user_email: string;
  /**
   * Subscription Type
   * @default "professional"
   */
  subscription_type?: string;
  /**
   * Subscription Status
   * @default "active"
   */
  subscription_status?: string;
  /**
   * Force Restore
   * @default false
   */
  force_restore?: boolean;
}

/** SubscriptionRestoreResponse */
export interface SubscriptionRestoreResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Subscription Data */
  subscription_data: Record<string, any> | null;
}

/** SupportCategory */
export interface SupportCategory {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description: string;
  /** Icon */
  icon: string;
  /** Color */
  color: string;
}

/** SupportEmailRequest */
export interface SupportEmailRequest {
  /**
   * User Email
   * @format email
   */
  user_email: string;
  /** Subject */
  subject: string;
  /** Message */
  message: string;
  /**
   * Priority
   * @default "medium"
   */
  priority?: string;
  /** User Name */
  user_name?: string | null;
  /** User Id */
  user_id?: string | null;
}

/** SupportEmailResponse */
export interface SupportEmailResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SupportQuestion */
export interface SupportQuestion {
  /** Id */
  id: string;
  /** Category Id */
  category_id: string;
  /** Question */
  question: string;
  /** Answer */
  answer: string;
  /** Keywords */
  keywords: string[];
  /**
   * Helpful Count
   * @default 0
   */
  helpful_count?: number;
  /**
   * View Count
   * @default 0
   */
  view_count?: number;
}

/** SupportTicketRequest */
export interface SupportTicketRequest {
  /** User Email */
  user_email: string;
  /** Subject */
  subject: string;
  /** Message */
  message: string;
  /** Category */
  category: string;
  /**
   * Priority
   * @default "medium"
   */
  priority?: string;
  /** User Context */
  user_context?: Record<string, any> | null;
  /** Conversation History */
  conversation_history?: Record<string, any>[] | null;
}

/** SupportTicketResponse */
export interface SupportTicketResponse {
  /** Success */
  success: boolean;
  /** Ticket Id */
  ticket_id?: string | null;
  /** Message */
  message: string;
  /** Error */
  error?: string | null;
}

/**
 * SystemHealthResponse
 * System health and performance metrics
 */
export interface SystemHealthResponse {
  /** Uptime Percentage */
  uptime_percentage: number;
  /** Error Breakdown */
  error_breakdown: Record<string, number>;
  /** Performance Trends */
  performance_trends: Record<string, number[]>;
  /** Resource Usage */
  resource_usage: Record<string, number>;
  /** Alert Triggers */
  alert_triggers: Record<string, any>[];
}

/** TagSuggestion */
export interface TagSuggestion {
  /** Tag */
  tag: string;
  /** Usage Count */
  usage_count: number;
}

/** TrackingEvent */
export interface TrackingEvent {
  /** Event Type */
  event_type: string;
  /** User Id */
  user_id?: string | null;
  /** Properties */
  properties?: Record<string, any> | null;
  /** Timestamp */
  timestamp?: string | null;
}

/** TrackingResponse */
export interface TrackingResponse {
  /** Status */
  status: string;
  /** Event Id */
  event_id: string;
  /** Timestamp */
  timestamp: string;
}

/** TradeConflict */
export interface TradeConflict {
  /** Trade Id */
  trade_id: string;
  /** Field Name */
  field_name: string;
  /** Broker Value */
  broker_value: any;
  /** Parsed Value */
  parsed_value: any;
  /** Confidence Level */
  confidence_level: number;
  /** Suggested Value */
  suggested_value: any;
  /** Reasoning */
  reasoning: string;
}

/**
 * TradeData
 * Individual trade data
 */
export interface TradeData {
  /** Symbol */
  symbol: string;
  /**
   * Entry Time
   * @format date-time
   */
  entry_time: string;
  /** Exit Time */
  exit_time?: string | null;
  /** Quantity */
  quantity: number;
  /** Entry Price */
  entry_price: number;
  /** Exit Price */
  exit_price?: number | null;
  /** Pnl */
  pnl: number;
  /**
   * Commission
   * @default 0
   */
  commission?: number | null;
  /** Platform */
  platform?: string | null;
  /** Strategy */
  strategy?: string | null;
}

/** TradeDeleteRequest */
export interface TradeDeleteRequest {
  /** Trade Ids */
  trade_ids: string[];
  /** Reason */
  reason: string;
  /** User Notes */
  user_notes?: string | null;
}

/** TradeEditRequest */
export interface TradeEditRequest {
  /** Trade Id */
  trade_id: string;
  /** Field Updates */
  field_updates: Record<string, any>;
  /** Reason */
  reason: string;
  /** User Notes */
  user_notes?: string | null;
}

/** TradeEditResponse */
export interface TradeEditResponse {
  /** Success */
  success: boolean;
  /** Trade Id */
  trade_id: string;
  /** Changes Applied */
  changes_applied: Record<string, any>;
  /** Validation Warnings */
  validation_warnings?: string[];
  /** Recalculated Metrics */
  recalculated_metrics?: Record<string, any>;
  /** Audit Log Id */
  audit_log_id: string;
}

/**
 * TrafficSummaryResponse
 * Real-time traffic summary
 */
export interface TrafficSummaryResponse {
  /** Total Requests */
  total_requests: number;
  /** Active Sessions */
  active_sessions: number;
  /** Authenticated Sessions */
  authenticated_sessions: number;
  /** Error Rate */
  error_rate: number;
  /** Avg Response Time */
  avg_response_time: number;
  /** Unique Users Today */
  unique_users_today: number;
  /** Requests Per Minute */
  requests_per_minute: number;
  /** Last Updated */
  last_updated: string;
}

/** Transaction */
export interface Transaction {
  /** Id */
  id: string;
  /** Evaluationid */
  evaluationId: string;
  /** Type */
  type: string;
  /** Amount */
  amount: number;
  /** Reason */
  reason?: string | null;
  /** Description */
  description?: string | null;
  /** Status */
  status: string;
  /** Requestedat */
  requestedAt: string;
  /** Processedat */
  processedAt?: string | null;
  /** Completedat */
  completedAt?: string | null;
  /** Userid */
  userId: string;
  /** Accountid */
  accountId: string;
  /** Evaluationtype */
  evaluationType: string;
  /** Firmname */
  firmName: string;
}

/** TransactionHistory */
export interface TransactionHistory {
  /** Transactions */
  transactions: Transaction[];
  /** Totalcount */
  totalCount: number;
  /** Summary */
  summary: Record<string, number>;
}

/** TrialCheckoutRequest */
export interface TrialCheckoutRequest {
  /** Customer Email */
  customer_email: string;
  /** Success Url */
  success_url: string;
  /** Cancel Url */
  cancel_url: string;
  /** Plan Name */
  plan_name: string;
}

/** TrialCheckoutResponse */
export interface TrialCheckoutResponse {
  /** Checkout Url */
  checkout_url: string;
}

/** TrialUsageUpdate */
export interface TrialUsageUpdate {
  /** Feature Type */
  feature_type: string;
  /**
   * Increment
   * @default 1
   */
  increment?: number;
}

/** UpdateCustomMoodRequest */
export interface UpdateCustomMoodRequest {
  /** Name */
  name?: string | null;
  /** Category */
  category?: string | null;
  /** Color */
  color?: string | null;
  /** Icon */
  icon?: string | null;
  /** Is Active */
  is_active?: boolean | null;
}

/** UpdateHabitRequest */
export interface UpdateHabitRequest {
  /** Name */
  name?: string | null;
  /** Category */
  category?: string | null;
  /** Is Active */
  is_active?: boolean | null;
  /** Description */
  description?: string | null;
}

/** UpdateJournalEntryRequest */
export interface UpdateJournalEntryRequest {
  /** Mood */
  mood?: string | null;
  /** Energy Level */
  energy_level?: number | null;
  /** Market Outlook */
  market_outlook?: string | null;
  /** Post Market Outlook */
  post_market_outlook?: string | null;
  /** Pre Market Notes */
  pre_market_notes?: string | null;
  /** Post Market Notes */
  post_market_notes?: string | null;
  /** Post Market Mood */
  post_market_mood?: string | null;
  /** Lessons Learned */
  lessons_learned?: string | null;
  /** Habits */
  habits?: Habit[] | null;
  /** Goals */
  goals?: string | null;
  /** Daily Intentions */
  daily_intentions?: string | null;
  /** Challenges */
  challenges?: string | null;
  /** Wins */
  wins?: string | null;
}

/** UsageInfo */
export interface UsageInfo {
  /** Trades Count */
  trades_count: number;
  /** Trades Limit */
  trades_limit?: number | null;
  /** Journal Entries Count */
  journal_entries_count: number;
  /** Ai Insights Used */
  ai_insights_used: number;
  /** Ai Insights Limit */
  ai_insights_limit?: number | null;
  /** Plan Name */
  plan_name: string;
  /**
   * Features
   * @default []
   */
  features?: string[];
}

/** UserAccessSummary */
export interface UserAccessSummary {
  /** User Id */
  user_id: string;
  /** Email */
  email: string;
  /** Name */
  name: string;
  /** Access Status */
  access_status: string;
  /** Granted At */
  granted_at?: string | null;
  /** Last Login */
  last_login?: string | null;
  /** Access Expires */
  access_expires?: string | null;
  /** Application Id */
  application_id?: string | null;
  /** Granted By */
  granted_by?: string | null;
  /** Revoked By */
  revoked_by?: string | null;
  /** Revoked At */
  revoked_at?: string | null;
  /** Admin Notes */
  admin_notes?: string | null;
  /**
   * Subscription Type
   * @default "free"
   */
  subscription_type?: string;
  /**
   * Subscription Status
   * @default "active"
   */
  subscription_status?: string;
}

/** UserActivityEvent */
export interface UserActivityEvent {
  /** User Id */
  user_id: string;
  /** Event Type */
  event_type: string;
  /** Page Path */
  page_path?: string | null;
  /** Session Id */
  session_id?: string | null;
  /**
   * Timestamp
   * @format date-time
   */
  timestamp: string;
  /** Metadata */
  metadata?: Record<string, any> | null;
}

/** UserAnalytics */
export interface UserAnalytics {
  /** Active Users 24H */
  active_users_24h: number;
  /** Page Views */
  page_views: Record<string, number>;
  /** Feature Usage */
  feature_usage: Record<string, number>;
  /** User Journeys */
  user_journeys: Record<string, any>[];
  /** Engagement Metrics */
  engagement_metrics: Record<string, number>;
}

/**
 * UserBehaviorResponse
 * User behavior and navigation patterns
 */
export interface UserBehaviorResponse {
  /** Page Views */
  page_views: Record<string, number>;
  /** User Journeys */
  user_journeys: Record<string, any>[];
  /** Session Duration Avg */
  session_duration_avg: number;
  /** Bounce Rate */
  bounce_rate: number;
  /** Device Breakdown */
  device_breakdown: Record<string, number>;
  /** Geographic Distribution */
  geographic_distribution: Record<string, number>;
}

/** UserBillingInfo */
export interface UserBillingInfo {
  /** Customer Id */
  customer_id?: string | null;
  subscription?: SubscriptionDetails | null;
  /**
   * Payment Methods
   * @default []
   */
  payment_methods?: PaymentMethod[];
  /**
   * Billing History
   * @default []
   */
  billing_history?: BillingHistory[];
  /** Customer Portal Url */
  customer_portal_url?: string | null;
  /**
   * Total Spent
   * @default 0
   */
  total_spent?: number;
}

/** UserInitializationRequest */
export interface UserInitializationRequest {
  /** User Id */
  user_id: string;
  /** Email */
  email?: string | null;
  /** Display Name */
  display_name?: string | null;
  /** Provider Id */
  provider_id?: string | null;
}

/** UserInitializationResponse */
export interface UserInitializationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** User Created */
  user_created: boolean;
  /** Firestore Updated */
  firestore_updated: boolean;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** WeeklyIntentions */
export interface WeeklyIntentions {
  /** Week Start Date */
  week_start_date: string;
  /** Trading Goals */
  trading_goals: string;
  /** Personal Goals */
  personal_goals: string;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
  /**
   * Is Archived
   * @default false
   */
  is_archived?: boolean;
}

/** WeeklyIntentionsListResponse */
export interface WeeklyIntentionsListResponse {
  /** Success */
  success: boolean;
  current_week?: WeeklyIntentions | null;
  /**
   * Archived Weeks
   * @default []
   */
  archived_weeks?: WeeklyIntentions[];
  /** Message */
  message: string;
  /**
   * Is Editable
   * @default false
   */
  is_editable?: boolean;
  /**
   * Days Until Sunday
   * @default 0
   */
  days_until_sunday?: number;
}

/** WeeklyIntentionsResponse */
export interface WeeklyIntentionsResponse {
  /** Success */
  success: boolean;
  intentions?: WeeklyIntentions | null;
  /** Message */
  message: string;
  /**
   * Is Editable
   * @default false
   */
  is_editable?: boolean;
  /**
   * Days Until Sunday
   * @default 0
   */
  days_until_sunday?: number;
}

/** WeeklyReviewCreate */
export interface WeeklyReviewCreate {
  /** Start Date */
  start_date: string;
  /** End Date */
  end_date: string;
  /** Trading Days */
  trading_days: number;
  /** Total Trades */
  total_trades: number;
  /** Good Trades */
  good_trades: number;
  /** Bad Trades */
  bad_trades: number;
  /** Wins */
  wins: number;
  /** Losses */
  losses: number;
  /** Break Even */
  break_even: number;
  /** Total Pnl */
  total_pnl: number;
  /** Emotional Reflection */
  emotional_reflection: string;
  /** Trading Reflections */
  trading_reflections: string;
  /** Execution Goals */
  execution_goals: string;
  /** Habit Metrics */
  habit_metrics: Record<string, any>[];
  /** Improvement Metrics */
  improvement_metrics: Record<string, any>[];
  /** Chart Images Base64 */
  chart_images_base64: string[];
}

/** WeeklyReviewDetailResponse */
export interface WeeklyReviewDetailResponse {
  review: WeeklyReviewResponse;
  /** Daily Summaries */
  daily_summaries: DailySummary[];
  /** Chart Images */
  chart_images: string[];
}

/** WeeklyReviewListResponse */
export interface WeeklyReviewListResponse {
  /** Reviews */
  reviews: WeeklyReviewResponse[];
  /** Total */
  total: number;
  /** Page */
  page: number;
  /** Limit */
  limit: number;
}

/** WeeklyReviewResponse */
export interface WeeklyReviewResponse {
  /** Review Id */
  review_id: string;
  /** User Id */
  user_id: string;
  /** Start Date */
  start_date: string;
  /** End Date */
  end_date: string;
  /** Trading Days */
  trading_days: number;
  /** Total Trades */
  total_trades: number;
  /** Good Trades */
  good_trades: number;
  /** Bad Trades */
  bad_trades: number;
  /** Wins */
  wins: number;
  /** Losses */
  losses: number;
  /** Break Even */
  break_even: number;
  /** Total Pnl */
  total_pnl: number;
  /** Emotional Reflection */
  emotional_reflection: string;
  /** Trading Reflections */
  trading_reflections: string;
  /** Execution Goals */
  execution_goals: string;
  /** Habit Metrics */
  habit_metrics: Record<string, any>[];
  /** Improvement Metrics */
  improvement_metrics: Record<string, any>[];
  /** Created At */
  created_at: string;
}

/** WelcomeEmailRequest */
export interface WelcomeEmailRequest {
  /**
   * Email
   * @format email
   */
  email: string;
  /** User Id */
  user_id: string;
  /**
   * Signup Method
   * @default "email"
   */
  signup_method?: string;
  /** User Name */
  user_name?: string | null;
}

/** WelcomeEmailResponse */
export interface WelcomeEmailResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** WithdrawalRequest */
export interface WithdrawalRequest {
  /** Evaluationid */
  evaluationId: string;
  /** Amount */
  amount: number;
  /** Reason */
  reason?: string | null;
  /** Description */
  description?: string | null;
}

/** WithdrawalResponse */
export interface WithdrawalResponse {
  /** Success */
  success: boolean;
  transaction: Transaction;
  /** Message */
  message: string;
  /** Newbalance */
  newBalance?: number | null;
}

/** BusinessMetricsResponse */
export interface AppApisBusinessMetricsBusinessMetricsResponse {
  mrr_metrics: MRRMetrics;
  cltv_metrics: CLTVMetrics;
  churn_metrics: ChurnMetrics;
  cohort_analysis: CohortAnalysis;
  /** Key Ratios */
  key_ratios: Record<string, number>;
  /** Historical Trends */
  historical_trends: Record<string, any>[];
  /** Timestamp */
  timestamp: string;
}

/** ManualTradeResponse */
export interface AppApisManualInterventionManualTradeResponse {
  /** Success */
  success: boolean;
  /** Trade Id */
  trade_id: string;
  /** Trade Data */
  trade_data: Record<string, any>;
  /** Validation Warnings */
  validation_warnings?: string[];
  /** Calculated Pnl */
  calculated_pnl: number;
  /** Audit Log Id */
  audit_log_id: string;
}

/** ManualTradeResponse */
export interface AppApisManualTradesManualTradeResponse {
  /** Success */
  success: boolean;
  /** Trade Id */
  trade_id: string;
  /** Message */
  message: string;
  /** Trade Data */
  trade_data?: Record<string, any> | null;
}

/**
 * BusinessMetricsResponse
 * Business KPIs and metrics
 */
export interface AppApisTrafficAnalyticsBusinessMetricsResponse {
  /** Daily Active Users */
  daily_active_users: number;
  /** Signup Rate */
  signup_rate: number;
  /** Conversion Rate */
  conversion_rate: number;
  /** Feature Adoption */
  feature_adoption: Record<string, number>;
  /** User Engagement Score */
  user_engagement_score: number;
  /** Revenue Events */
  revenue_events: number;
  /** Churn Indicators */
  churn_indicators: Record<string, any>;
  /** Growth Metrics */
  growth_metrics: Record<string, number>;
}

export type CheckHealthData = HealthResponse;

export type GetTrialStatusData = any;

export type OptionsTrialStatusData = any;

/** Response Create Trial Subscription */
export type CreateTrialSubscriptionData = Record<string, any>;

export type CreateTrialSubscriptionError = HTTPValidationError;

/** Response Track Feature Usage */
export type TrackFeatureUsageData = Record<string, any>;

export type TrackFeatureUsageError = HTTPValidationError;

export interface CheckFeatureLimitParams {
  /** Feature Type */
  featureType: string;
}

/** Response Check Feature Limit */
export type CheckFeatureLimitData = Record<string, any>;

export type CheckFeatureLimitError = HTTPValidationError;

/** Response Cancel Trial */
export type CancelTrialData = Record<string, any>;

export type CancelTrialError = HTTPValidationError;

/** Response Get Trial Users */
export type GetTrialUsersData = Record<string, any>[];

/** Response Trial Health Check */
export type TrialHealthCheckData = Record<string, any>;

export type DeleteAccountTradesData = DeleteAccountTradesResponse;

export type DeleteAccountTradesError = HTTPValidationError;

export type DeleteAllUserTradesData = DeleteAllTradesResponse;

export type AnalyzeFileStructureData = FileAnalysisResponse;

export type AnalyzeFileStructureError = HTTPValidationError;

export interface ProcessFileParams {
  /** Analysis */
  analysis: string;
  /** Evaluation Id */
  evaluation_id: string;
  /** Broker Timezone */
  broker_timezone: string;
}

export type ProcessFileData = ProcessFileResponse;

export type ProcessFileError = HTTPValidationError;

export type FifoHealthCheckData = any;

export type OptionsUserStatusData = any;

export interface CheckUserStatusParams {
  /**  T */
  _t?: number | null;
}

export type CheckUserStatusData = any;

export type CheckUserStatusError = HTTPValidationError;

export type AssessDataQualityData = DataQualityAssessment;

export interface GetIssueDetailsParams {
  /** Issue Id */
  issueId: string;
}

export type GetIssueDetailsData = any;

export type GetIssueDetailsError = HTTPValidationError;

/** Issue Ids */
export type AutoResolveIssuesPayload = string[];

export type AutoResolveIssuesData = any;

export type AutoResolveIssuesError = HTTPValidationError;

export type TradingJournalHealthCheckData = any;

export type CreateJournalEntryData = JournalResponse;

export type CreateJournalEntryError = HTTPValidationError;

export interface GetJournalEntriesParams {
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
}

export type GetJournalEntriesData = JournalListResponse;

export type GetJournalEntriesError = HTTPValidationError;

export interface GetJournalEntryByDateParams {
  /** Entry Date */
  entryDate: string;
}

export type GetJournalEntryByDateData = JournalResponse;

export type GetJournalEntryByDateError = HTTPValidationError;

export interface UpdateJournalEntryParams {
  /** Entry Date */
  entryDate: string;
}

export type UpdateJournalEntryData = JournalResponse;

export type UpdateJournalEntryError = HTTPValidationError;

export interface DeleteJournalEntryParams {
  /** Entry Date */
  entryDate: string;
}

export type DeleteJournalEntryData = any;

export type DeleteJournalEntryError = HTTPValidationError;

export type GetHabitDefinitionsData = HabitResponse;

export type CreateHabitDefinitionData = HabitResponse;

export type CreateHabitDefinitionError = HTTPValidationError;

export interface UpdateHabitDefinitionParams {
  /** Habit Id */
  habitId: string;
}

export type UpdateHabitDefinitionData = HabitResponse;

export type UpdateHabitDefinitionError = HTTPValidationError;

export interface DeleteHabitDefinitionParams {
  /** Habit Id */
  habitId: string;
}

export type DeleteHabitDefinitionData = any;

export type DeleteHabitDefinitionError = HTTPValidationError;

export type GetMoodDefinitionsData = MoodResponse;

export type CreateMoodDefinitionData = MoodResponse;

export type CreateMoodDefinitionError = HTTPValidationError;

export interface UpdateMoodDefinitionParams {
  /** Mood Id */
  moodId: string;
}

export type UpdateMoodDefinitionData = MoodResponse;

export type UpdateMoodDefinitionError = HTTPValidationError;

export interface DeleteMoodDefinitionParams {
  /** Mood Id */
  moodId: string;
}

export type DeleteMoodDefinitionData = any;

export type DeleteMoodDefinitionError = HTTPValidationError;

export interface GetStreakDataParams {
  /**
   * Days
   * @default 90
   */
  days?: number;
}

export type GetStreakDataData = StreakResponse;

export type GetStreakDataError = HTTPValidationError;

export interface GetBehavioralInsightsParams {
  /**
   * Days
   * @default 30
   */
  days?: number;
}

export type GetBehavioralInsightsData = BehavioralInsightsResponse;

export type GetBehavioralInsightsError = HTTPValidationError;

export interface GetJournalAnalyticsParams {
  /**
   * Days
   * @default 30
   */
  days?: number;
}

export type GetJournalAnalyticsData = AnalyticsResponse;

export type GetJournalAnalyticsError = HTTPValidationError;

export type MigrateHabitsFromJournalsData = any;

export type SaveJournalEntryData = JournalResponse;

export type SaveJournalEntryError = HTTPValidationError;

export type EditTradeData = TradeEditResponse;

export type EditTradeError = HTTPValidationError;

export type BulkEditTradesData = BulkEditResponse;

export type BulkEditTradesError = HTTPValidationError;

export type AddManualTradeData = AppApisManualInterventionManualTradeResponse;

export type AddManualTradeError = HTTPValidationError;

export type DeleteTradesData = any;

export type DeleteTradesError = HTTPValidationError;

export type ResolveConflictData = any;

export type ResolveConflictError = HTTPValidationError;

export interface GetAuditLogParams {
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

export type GetAuditLogData = any;

export type GetAuditLogError = HTTPValidationError;

export type BackfillEvaluationIdsData = any;

export type HistoricalAnalyticsHealthCheckData = any;

export type TrackUserEventData = any;

export type TrackUserEventError = HTTPValidationError;

export type GenerateDailyMetricsData = any;

export type GenerateDailyMetricsError = HTTPValidationError;

export interface GetHistoricalMetricsParams {
  /**
   * Days Back
   * @default 30
   */
  days_back?: number;
}

export type GetHistoricalMetricsData = HistoricalMetricsResponse;

export type GetHistoricalMetricsError = HTTPValidationError;

export type InitializeHistoricalDataData = any;

export interface ClearHistoricalDataParams {
  /**
   * Confirm
   * @default false
   */
  confirm?: boolean;
}

export type ClearHistoricalDataData = any;

export type ClearHistoricalDataError = HTTPValidationError;

export type GetSupportCategoriesData = CategoryResponse;

export interface GetCategoryQuestionsParams {
  /** Category Id */
  categoryId: string;
}

export type GetCategoryQuestionsData = CategoryQuestionsResponse;

export type GetCategoryQuestionsError = HTTPValidationError;

export type SearchKnowledgeBaseData = SearchResponse;

export type SearchKnowledgeBaseError = HTTPValidationError;

export interface VoteHelpfulParams {
  /** Question Id */
  questionId: string;
}

export type VoteHelpfulData = any;

export type VoteHelpfulError = HTTPValidationError;

export type CreateTicketData = SupportTicketResponse;

export type CreateTicketError = HTTPValidationError;

export interface ListTicketsParams {
  /**
   * Limit
   * @default 20
   */
  limit?: number;
}

export type ListTicketsData = any;

export type ListTicketsError = HTTPValidationError;

export interface GetTicketParams {
  /** Ticket Id */
  ticketId: string;
}

export type GetTicketData = any;

export type GetTicketError = HTTPValidationError;

export type GetTicketCategoriesData = any;

export type DiscountHealthCheckData = any;

export type CreateDiscountData = DiscountDetails;

export type CreateDiscountError = HTTPValidationError;

export interface ListDiscountsParams {
  /**
   * Active Only
   * @default false
   */
  active_only?: boolean;
}

/** Response List Discounts */
export type ListDiscountsData = DiscountDetails[];

export type ListDiscountsError = HTTPValidationError;

export interface GetDiscountParams {
  /** Discount Id */
  discountId: string;
}

export type GetDiscountData = DiscountDetails;

export type GetDiscountError = HTTPValidationError;

export interface UpdateDiscountParams {
  /** Discount Id */
  discountId: string;
}

export type UpdateDiscountData = DiscountDetails;

export type UpdateDiscountError = HTTPValidationError;

export interface DeleteDiscountParams {
  /** Discount Id */
  discountId: string;
}

/** Response Delete Discount */
export type DeleteDiscountData = Record<string, any>;

export type DeleteDiscountError = HTTPValidationError;

export type ApplyDiscountData = ApplyDiscountResponse;

export type ApplyDiscountError = HTTPValidationError;

export type GetDiscountAnalyticsData = DiscountAnalytics;

export type GetInfrastructureHealthData = InfrastructureHealthResponse;

export interface GetSubscriptionFailureStatsParams {
  /**
   * Hours
   * @default 24
   */
  hours?: number;
}

export type GetSubscriptionFailureStatsData = SubscriptionFailureStats;

export type GetSubscriptionFailureStatsError = HTTPValidationError;

/** Response Log Subscription Failure */
export type LogSubscriptionFailureData = Record<string, string>;

export type LogSubscriptionFailureError = HTTPValidationError;

/** Response Get System Health */
export type GetSystemHealthData = Record<string, any>;

export type GetUserBillingInfoData = UserBillingInfo;

export type GetCustomerPortalUrlData = CustomerPortalResponse;

export type GetUsageInfoData = UsageInfo;

/** Response Cancel Subscription */
export type CancelSubscriptionData = Record<string, any>;

/** Response Reactivate Subscription */
export type ReactivateSubscriptionData = Record<string, any>;

export type TestEndpointData = any;

export type RepairUserTradesData = SimpleRepairResponse;

export type PropFirmHealthCheckData = any;

export type GetAvailablePropFirmsData = PropFirmListResponse;

export type SetUserPropFirmPreferenceData = PropFirmPreferenceResponse;

export type SetUserPropFirmPreferenceError = HTTPValidationError;

export interface GetPropFirmCommissionInfoParams {
  /** Prop Firm */
  propFirm: string;
}

/** Response Get Prop Firm Commission Info */
export type GetPropFirmCommissionInfoData = Record<string, any>;

export type GetPropFirmCommissionInfoError = HTTPValidationError;

export type CalculateCommissionCostData = CommissionCalculationResponse;

export type CalculateCommissionCostError = HTTPValidationError;

/** Response Get User Prop Firm Preference */
export type GetUserPropFirmPreferenceData = Record<string, any>;

export type BasicHealthCheckData = HealthCheckResponse;

/** Response Ping */
export type PingData = Record<string, any>;

export type MigrationDryRunData = MigrationResult;

export type MigrationExecuteData = MigrationResult;

export type MigrationStatusData = StatusResult;

export interface GetUserTradesParams {
  /** User Id */
  userId: string;
}

export type GetUserTradesData = PublicTradesResponse;

export type GetUserTradesError = HTTPValidationError;

export interface GetUserEvaluationsParams {
  /** User Id */
  userId: string;
}

export type GetUserEvaluationsData = PublicEvaluationsResponse;

export type GetUserEvaluationsError = HTTPValidationError;

export interface GetUserJournalEntriesParams {
  /** User Id */
  userId: string;
}

export type GetUserJournalEntriesData = PublicJournalResponse;

export type GetUserJournalEntriesError = HTTPValidationError;

export type GetCurrentWeeklyIntentionsData = WeeklyIntentionsResponse;

export type CreateOrUpdateCurrentWeeklyIntentionsData = WeeklyIntentionsResponse;

export type CreateOrUpdateCurrentWeeklyIntentionsError = HTTPValidationError;

export type GetWeeklyIntentionsHistoryData = WeeklyIntentionsListResponse;

export type TriggerSundayResetData = any;

export type WeeklyIntentionsHealthCheckData = any;

export type SignupForProNotificationsData = ProNotificationResponse;

export type SignupForProNotificationsError = HTTPValidationError;

export interface CheckNotificationPreferenceParams {
  /** User Id */
  userId: string;
}

export type CheckNotificationPreferenceData = any;

export type CheckNotificationPreferenceError = HTTPValidationError;

export type GetWaitlistStatsData = any;

export interface GlobalOptionsHandlerParams {
  /** Full Path */
  fullPath: string;
}

export type GlobalOptionsHandlerData = any;

export type GlobalOptionsHandlerError = HTTPValidationError;

export type DetectCorruptedEntriesData = CleanupResponse;

export type CleanupCorruptedEntriesData = CleanupResponse;

export type DownloadTechnicalAssessmentData = any;

export type ReviewAutomationHealthCheckData = any;

export type CheckReviewsData = any;

export type TriggerReviewsData = any;

export type TriggerWeeklyReviewEndpointData = any;

export type TriggerMonthlyReviewEndpointData = any;

export type GetReviewScheduleData = any;

export type AffiliateSystemHealthCheckData = any;

export type RegisterAffiliateData = AffiliateRegistrationResponse;

export type RegisterAffiliateError = HTTPValidationError;

export type GetAffiliateProfileData = AffiliateProfileResponse;

export type GenerateReferralLinkData = ReferralLinkResponse;

export type GenerateReferralLinkError = HTTPValidationError;

/** Response Get Affiliate Earnings */
export type GetAffiliateEarningsData = Record<string, any>;

export interface TrackReferralSignupParams {
  /** Referred User Id */
  referred_user_id: string;
  /** Referred Email */
  referred_email: string;
  /** Referral Code */
  referral_code?: string | null;
}

/** Response Track Referral Signup */
export type TrackReferralSignupData = Record<string, any>;

export type TrackReferralSignupError = HTTPValidationError;

export interface TrackReferralConversionParams {
  /** User Id */
  user_id: string;
  /** Subscription Id */
  subscription_id: string;
  /** Payment Amount */
  payment_amount: number;
}

/** Response Track Referral Conversion */
export type TrackReferralConversionData = Record<string, any>;

export type TrackReferralConversionError = HTTPValidationError;

export type GetFeatureUnlockStatusData = FeatureUnlockStatus;

export type StripeWebhookHandlerData = any;

export type StripeWebhookHandlerError = HTTPValidationError;

export type WebhookHealthCheckData = any;

export interface GetPerformanceMetricsParams {
  /**
   * Hours
   * @min 1
   * @max 168
   * @default 24
   */
  hours?: number;
}

export type GetPerformanceMetricsData = PerformanceStats;

export type GetPerformanceMetricsError = HTTPValidationError;

export type GetRealtimeStatsData = RealTimeStats;

export interface GetErrorReportsParams {
  /**
   * Hours
   * @min 1
   * @max 168
   * @default 24
   */
  hours?: number;
  /** Severity */
  severity?: string | null;
}

/** Response Get Error Reports */
export type GetErrorReportsData = ErrorReport[];

export type GetErrorReportsError = HTTPValidationError;

export interface GetUserAnalyticsParams {
  /**
   * Hours
   * @min 1
   * @max 168
   * @default 24
   */
  hours?: number;
}

export type GetUserAnalyticsData = UserAnalytics;

export type GetUserAnalyticsError = HTTPValidationError;

/** Response Get Analytics System Health */
export type GetAnalyticsSystemHealthData = Record<string, any>;

export type TrackAnalyticsUserEventData = TrackingResponse;

export type TrackAnalyticsUserEventError = HTTPValidationError;

export type MigrateJournalDataEndpointData = MigrationResponse;

export type MigrateUserDataEndpointData = MigrationResponse;

export interface CleanupLegacyStorageEndpointParams {
  /**
   * Dry Run
   * @default true
   */
  dry_run?: boolean;
}

export type CleanupLegacyStorageEndpointData = MigrationResponse;

export type CleanupLegacyStorageEndpointError = HTTPValidationError;

export type GetMigrationStatusData = any;

export type CreateWeeklyReviewData = WeeklyReviewResponse;

export type CreateWeeklyReviewError = HTTPValidationError;

export interface ListWeeklyReviewsParams {
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
}

export type ListWeeklyReviewsData = WeeklyReviewListResponse;

export type ListWeeklyReviewsError = HTTPValidationError;

export interface GetWeeklyReviewParams {
  /** Review Id */
  reviewId: string;
}

export type GetWeeklyReviewData = WeeklyReviewDetailResponse;

export type GetWeeklyReviewError = HTTPValidationError;

export type GetLightFaviconData = any;

export type GetDarkFaviconData = any;

export type GetFaviconIcoData = any;

export type RepairTradesDatetimeData = RepairTradesResponse;

export type RepairTradesDatetimeError = HTTPValidationError;

export type ExtractMissingFirstTradeData = ExtractMissingTradeResponse;

export type AnalyzeTradesData = GroupingResponse;

export type AnalyzeTradesError = HTTPValidationError;

export interface GetUserGroupsParams {
  /**
   * Limit
   * @min 1
   * @max 200
   * @default 50
   */
  limit?: number;
  /** User Id */
  userId: string;
}

export type GetUserGroupsData = any;

export type GetUserGroupsError = HTTPValidationError;

export type AnalyzeGroupsData = GroupAnalysisResponse;

export type AnalyzeGroupsError = HTTPValidationError;

export type GetAvailableStrategiesData = any;

export type GroupingHealthCheckData = any;

export type CorsStatusData = any;

export type InitializeUserData = UserInitializationResponse;

export type InitializeUserError = HTTPValidationError;

export type AutoInitializeUserData = any;

export type UserInitializationHealthCheckData = any;

export type SendWelcomeEmailData = WelcomeEmailResponse;

export type SendWelcomeEmailError = HTTPValidationError;

export interface GetFaviconPngParams {
  /** Size */
  size: string;
}

export type GetFaviconPngData = any;

export type GetFaviconPngError = HTTPValidationError;

export type GetAppleTouchIconData = any;

export interface GetLogoParams {
  /** Size */
  size: string;
  /** Format */
  format: string;
}

export type GetLogoData = any;

export type GetLogoError = HTTPValidationError;

export type GetOgImageData = any;

export type GetTwitterImageData = any;

export type GetMainLogoData = any;

export type EarlyAccessSignupData = EarlyAccessSignupResponse;

export type EarlyAccessSignupError = HTTPValidationError;

export type GetEarlyAccessStatsData = any;

export type UploadImageData = ImageUploadResponse;

export type UploadImageError = HTTPValidationError;

export interface GetImageParams {
  /** Image Id */
  imageId: string;
}

export type GetImageData = any;

export type GetImageError = HTTPValidationError;

export interface DeleteImageParams {
  /** Image Id */
  imageId: string;
}

export type DeleteImageData = ImageDeleteResponse;

export type DeleteImageError = HTTPValidationError;

export type ListUserImagesData = any;

export type CreateWithdrawalData = WithdrawalResponse;

export type CreateWithdrawalError = HTTPValidationError;

export interface DeleteWithdrawalParams {
  /** Transaction Id */
  transactionId: string;
}

export type DeleteWithdrawalData = any;

export type DeleteWithdrawalError = HTTPValidationError;

export type CreateRefundData = RefundResponse;

export type CreateRefundError = HTTPValidationError;

export interface DeleteRefundParams {
  /** Transaction Id */
  transactionId: string;
}

export type DeleteRefundData = any;

export type DeleteRefundError = HTTPValidationError;

export interface GetTransactionHistoryParams {
  /** Transaction Type */
  transaction_type?: string | null;
}

export type GetTransactionHistoryData = TransactionHistory;

export type GetTransactionHistoryError = HTTPValidationError;

export interface GetTransactionParams {
  /** Transaction Id */
  transactionId: string;
}

export type GetTransactionData = Transaction;

export type GetTransactionError = HTTPValidationError;

export interface GetFinancialSummaryParams {
  /**
   * Period
   * @default "monthly"
   */
  period?: string;
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
}

export type GetFinancialSummaryData = FinancialSummary;

export type GetFinancialSummaryError = HTTPValidationError;

export type ComprehensivePatternAnalysisStandaloneData = ComprehensivePatternResponse;

export type ComprehensivePatternAnalysisStandaloneError = HTTPValidationError;

export type PatternRecognitionHealthData = any;

export type CalculateFifoForTradesData = FifoCalculationResponse;

export type CalculateFifoForTradesError = HTTPValidationError;

export type GetEarlyAccessSignupsData = EarlyAccessResponse;

/** Response Export Early Access Signups */
export type ExportEarlyAccessSignupsData = Record<string, any>;

export interface MarkSignupConfirmedParams {
  /** Email */
  email: string;
}

/** Response Mark Signup Confirmed */
export type MarkSignupConfirmedData = Record<string, any>;

export type MarkSignupConfirmedError = HTTPValidationError;

export type SubscriptionAuditHealthCheckData = any;

export interface AuditSingleUserParams {
  /** User Email */
  user_email: string;
}

export type AuditSingleUserData = SubscriptionAuditResult;

export type AuditSingleUserError = HTTPValidationError;

export type AuditMissingUsersData = BulkAuditResponse;

export type RestoreSubscriptionData = SubscriptionRestoreResponse;

export type RestoreSubscriptionError = HTTPValidationError;

export type CreateManualTradeData = AppApisManualTradesManualTradeResponse;

export type CreateManualTradeError = HTTPValidationError;

/** Response Get Tag Suggestions */
export type GetTagSuggestionsData = TagSuggestion[];

export interface UpdateManualTradeParams {
  /** Trade Id */
  tradeId: string;
}

export type UpdateManualTradeData = AppApisManualTradesManualTradeResponse;

export type UpdateManualTradeError = HTTPValidationError;

export interface DeleteManualTradeParams {
  /** Evaluation Id */
  evaluation_id: string;
  /** Trade Id */
  tradeId: string;
}

export type DeleteManualTradeData = any;

export type DeleteManualTradeError = HTTPValidationError;

export type SignupForAiCoachNotificationsData = NotificationSignupResponse;

export type SignupForAiCoachNotificationsError = HTTPValidationError;

export type GetNotificationStatsData = GetNotificationStatsResponse;

export type ExportPersonalDataData = DataExportResponse;

export type ExportPersonalDataError = HTTPValidationError;

export type DeleteAccountData = AccountDeletionResponse;

export type DeleteAccountError = HTTPValidationError;

/** Response Get Data Retention Info */
export type GetDataRetentionInfoData = Record<string, any>;

export type DeleteAllTradesData = DeleteResponse;

export interface DeleteTradesByAccountParams {
  /** Account Id */
  accountId: string;
}

export type DeleteTradesByAccountData = DeleteResponse;

export type DeleteTradesByAccountError = HTTPValidationError;

export interface DeleteTradesByEvaluationParams {
  /** Evaluation Id */
  evaluationId: string;
}

export type DeleteTradesByEvaluationData = DeleteResponse;

export type DeleteTradesByEvaluationError = HTTPValidationError;

export type CreateTrialCheckoutData = TrialCheckoutResponse;

export type CreateTrialCheckoutError = HTTPValidationError;

export interface ListTradeScreenshotsParams {
  /** Trade Id */
  tradeId: string;
}

export type ListTradeScreenshotsData = ScreenshotListResponse;

export type ListTradeScreenshotsError = HTTPValidationError;

export interface UploadTradeScreenshotParams {
  /** Trade Id */
  tradeId: string;
}

export type UploadTradeScreenshotData = ScreenshotUploadResponse;

export type UploadTradeScreenshotError = HTTPValidationError;

export interface GetPublicScreenshotParams {
  /** Screenshot Id */
  screenshotId: string;
}

export type GetPublicScreenshotData = any;

export type GetPublicScreenshotError = HTTPValidationError;

export interface GetTradeScreenshotParams {
  /** Screenshot Id */
  screenshotId: string;
}

export type GetTradeScreenshotData = any;

export type GetTradeScreenshotError = HTTPValidationError;

export interface DeleteTradeScreenshotParams {
  /** Screenshot Id */
  screenshotId: string;
}

export type DeleteTradeScreenshotData = any;

export type DeleteTradeScreenshotError = HTTPValidationError;

export type TradingPlatformHealthCheckData = any;

export type ConnectPlatformData = any;

export type ConnectPlatformError = HTTPValidationError;

export interface GetPlatformConnectionParams {
  /** Platform */
  platform: string;
}

export type GetPlatformConnectionData = any;

export type GetPlatformConnectionError = HTTPValidationError;

export interface DisconnectPlatformParams {
  /** Platform */
  platform: string;
}

export type DisconnectPlatformData = any;

export type DisconnectPlatformError = HTTPValidationError;

export interface SyncPlatformTradesParams {
  /** Platform */
  platform: string;
}

export type SyncPlatformTradesData = any;

export type SyncPlatformTradesError = HTTPValidationError;

/** Response Get Evaluations */
export type GetEvaluationsData = Evaluation[];

export type CreateEvaluationData = Evaluation;

export type CreateEvaluationError = HTTPValidationError;

export interface DeleteEvaluationParams {
  /** Evaluation Id */
  evaluationId: string;
}

export type DeleteEvaluationData = DeleteResponse;

export type DeleteEvaluationError = HTTPValidationError;

export type BulkImportTradesData = BulkTradeResponse;

export type BulkImportTradesError = HTTPValidationError;

export type BusinessMetricsHealthCheckData = any;

export interface GetComprehensiveBusinessMetricsParams {
  /**
   * Months
   * Number of months to analyze
   * @min 1
   * @max 36
   * @default 12
   */
  months?: number;
}

export type GetComprehensiveBusinessMetricsData = AppApisBusinessMetricsBusinessMetricsResponse;

export type GetComprehensiveBusinessMetricsError = HTTPValidationError;

export interface ListAffiliatesParams {
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
}

export type ListAffiliatesData = AffiliateManagementResponse;

export type ListAffiliatesError = HTTPValidationError;

export type ApproveAffiliateData = AffiliateApprovalResponse;

export type ApproveAffiliateError = HTTPValidationError;

/** Response Get Affiliate Program Analytics */
export type GetAffiliateProgramAnalyticsData = Record<string, any>;

export interface ListAllReferralsParams {
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
}

/** Response List All Referrals */
export type ListAllReferralsData = Record<string, any>;

export type ListAllReferralsError = HTTPValidationError;

export type CheckStripeConnectionData = StripeConnectionResponse;

export type CreateStripeProductData = CreateProductResponse;

export type CreateStripeProductError = HTTPValidationError;

/** Response List Stripe Products */
export type ListStripeProductsData = Record<string, any>;

export type CreateStripeCheckoutData = CreateCheckoutResponse;

export type CreateStripeCheckoutError = HTTPValidationError;

export type CreateSubscriptionCheckoutData = CreateSubscriptionCheckoutResponse;

export type CreateSubscriptionCheckoutError = HTTPValidationError;

export type CreateTrialCheckout2Data = CreateTrialCheckoutResponse;

export type CreateTrialCheckout2Error = HTTPValidationError;

export type SendSupportEmailData = SupportEmailResponse;

export type SendSupportEmailError = HTTPValidationError;

export type GetRealTimeSummaryData = TrafficSummaryResponse;

export interface GetBusinessMetricsParams {
  /**
   * Days
   * Number of days to analyze
   * @default 7
   */
  days?: number;
}

export type GetBusinessMetricsData = AppApisTrafficAnalyticsBusinessMetricsResponse;

export type GetBusinessMetricsError = HTTPValidationError;

export interface GetEndpointAnalyticsParams {
  /**
   * Hours
   * Number of hours to analyze
   * @default 24
   */
  hours?: number;
}

export type GetEndpointAnalyticsData = EndpointAnalyticsResponse;

export type GetEndpointAnalyticsError = HTTPValidationError;

export interface GetUserBehaviorParams {
  /**
   * Hours
   * Number of hours to analyze
   * @default 24
   */
  hours?: number;
}

export type GetUserBehaviorData = UserBehaviorResponse;

export type GetUserBehaviorError = HTTPValidationError;

export interface GetSystemHealth2Params {
  /**
   * Hours
   * Number of hours to analyze
   * @default 24
   */
  hours?: number;
}

export type GetSystemHealth2Data = SystemHealthResponse;

export type GetSystemHealth2Error = HTTPValidationError;

export interface GetHistoricalTrendsParams {
  /**
   * Days
   * Number of days for historical analysis
   * @default 30
   */
  days?: number;
}

export type GetHistoricalTrendsData = HistoricalTrendsResponse;

export type GetHistoricalTrendsError = HTTPValidationError;

export type CheckTrafficAlertsData = any;

export type TestAdminData = any;

export interface ListAllUsersParams {
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
}

/** Response List All Users */
export type ListAllUsersData = UserAccessSummary[];

export type ListAllUsersError = HTTPValidationError;

export type GrantSubscriptionData = SubscriptionManagementResponse;

export type GrantSubscriptionError = HTTPValidationError;

export type RevokeSubscriptionData = SubscriptionManagementResponse;

export type RevokeSubscriptionError = HTTPValidationError;
