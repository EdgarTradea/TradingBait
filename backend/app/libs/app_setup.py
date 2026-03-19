"""Enhanced FastAPI app setup with traffic analytics middleware"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.auth.user import get_authorized_user
from app.env import Mode, mode
from app.libs.performance_monitoring import TrafficAnalyticsMiddleware

# Import all routers
from app.apis.admin import router as adminRouter
from app.apis.admin_affiliate import router as admin_affiliateRouter
from app.apis.admin_early_access import router as admin_early_accessRouter
from app.apis.advanced_integration import router as advanced_integrationRouter
from app.apis.affiliate_system import router as affiliate_systemRouter
from app.apis.ai_coach import router as ai_coachRouter
from app.apis.analytics import router as analyticsRouter
from app.apis.archive_management import router as archive_managementRouter
from app.apis.auth_admin import router as auth_adminRouter
from app.apis.bulk_trade_operations import router as bulk_trade_operationsRouter
from app.apis.business_metrics import router as business_metricsRouter
from app.apis.challenges import router as challengesRouter
from app.apis.calculation_testing import router as calculation_testingRouter
from app.apis.chat import router as chatRouter
from app.apis.coach_hub import router as coach_hubRouter
from app.apis.coaching_profiles import router as coaching_profilesRouter
from app.apis.coaching_sessions import router as coaching_sessionsRouter
from app.apis.comprehensive_pattern_analysis import router as comprehensive_pattern_analysisRouter
from app.apis.conversational_profile import router as conversational_profileRouter
from app.apis.data_quality import router as data_qualityRouter
from app.apis.diagram_service import router as diagram_serviceRouter
from app.apis.discount_management import router as discount_managementRouter
from app.apis.early_access_signup import router as early_access_signupRouter
from app.apis.feature_unlock import router as feature_unlockRouter
from app.apis.fifo_calculation import router as fifo_calculationRouter
from app.apis.file_analysis import router as file_analysisRouter
from app.apis.gdpr_compliance import router as gdpr_complianceRouter
from app.apis.habit_coaching_integration import router as habit_coaching_integrationRouter
from app.apis.health_check import router as health_checkRouter
from app.apis.help_content import router as help_contentRouter
from app.apis.infrastructure_health import router as infrastructure_healthRouter
from app.apis.journal_coaching_integration import router as journal_coaching_integrationRouter
from app.apis.manual_intervention import router as manual_interventionRouter
from app.apis.my_new_api import router as my_new_apiRouter
from app.apis.pattern_analysis import router as pattern_analysisRouter
from app.apis.pro_notifications import router as pro_notificationsRouter
from app.apis.prop_firm_management import router as prop_firm_managementRouter
from app.apis.quality_testing import router as quality_testingRouter
from app.apis.repair_trades import router as repair_tradesRouter
from app.apis.repair_trades_simple import router as repair_trades_simpleRouter
from app.apis.review_automation import router as review_automationRouter
from app.apis.static_assets import router as static_assetsRouter
from app.apis.stripe_integration import router as stripe_integrationRouter
from app.apis.stripe_webhooks import router as stripe_webhooksRouter
from app.apis.support import router as supportRouter
from app.apis.trade_deletion import router as trade_deletionRouter
from app.apis.trade_grouping import router as trade_groupingRouter
from app.apis.trade_management import router as trade_managementRouter
from app.apis.trading_journal_unified import router as trading_journal_unifiedRouter
from app.apis.trading_platform import router as trading_platformRouter
from app.apis.user_billing import router as user_billingRouter
from app.apis.user_initialization import router as user_initializationRouter
from app.apis.user_status import router as user_statusRouter
from app.apis.weekly_intentions import router as weekly_intentionsRouter
from app.apis.welcome_email import router as welcome_emailRouter
from app.apis.withdrawals_refunds import router as withdrawals_refundsRouter

# Global middleware instance for access to real-time stats
traffic_middleware = None

def create_enhanced_app() -> FastAPI:
    """Create FastAPI app with traffic analytics middleware"""
    global traffic_middleware
    
    prefix = (
        "/api"
        if mode == Mode.PROD
        else "/_projects/47e89438-adfe-4372-b617-66a3eabfadfe/dbtn/devx/app/routes"
    )

    app = FastAPI(prefix=prefix)
    
    # Configure CORS for production
    if mode == Mode.PROD:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "https://www.tradingbait.com",
                "https://tradingbait.com"
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
        pass
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "https://riff.new",
                "https://*.riff.new",
                "https://tradingbait.com",
                "https://www.tradingbait.com"
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
        pass
    
    # Add traffic analytics middleware
    traffic_middleware = TrafficAnalyticsMiddleware(app)
    app.add_middleware(TrafficAnalyticsMiddleware)
    
    pass
    
    # Include all routers with auth dependencies
    app.include_router(adminRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(admin_affiliateRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(admin_early_accessRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(advanced_integrationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(affiliate_systemRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(ai_coachRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(analyticsRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(archive_managementRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(auth_adminRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(bulk_trade_operationsRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(business_metricsRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(challengesRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(calculation_testingRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(chatRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(coach_hubRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(coaching_profilesRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(coaching_sessionsRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(comprehensive_pattern_analysisRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(conversational_profileRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(data_qualityRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(diagram_serviceRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(discount_managementRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(early_access_signupRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(feature_unlockRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(fifo_calculationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(file_analysisRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(gdpr_complianceRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(habit_coaching_integrationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(health_checkRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(help_contentRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(infrastructure_healthRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(journal_coaching_integrationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(manual_interventionRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(my_new_apiRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(pattern_analysisRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(pro_notificationsRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(prop_firm_managementRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(quality_testingRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(repair_tradesRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(repair_trades_simpleRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(review_automationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(static_assetsRouter)
    app.include_router(stripe_integrationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(stripe_webhooksRouter)
    app.include_router(supportRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(trade_deletionRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(trade_groupingRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(trade_managementRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(trading_journal_unifiedRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(trading_platformRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(user_billingRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(user_initializationRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(user_statusRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(weekly_intentionsRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(welcome_emailRouter, dependencies=[Depends(get_authorized_user)])
    app.include_router(withdrawals_refundsRouter, dependencies=[Depends(get_authorized_user)])

    if mode == Mode.PROD:
        pass
    else:
        pass

    return app

def get_traffic_middleware():
    """Get the global traffic middleware instance for real-time stats"""
    return traffic_middleware
