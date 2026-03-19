
"""Enhanced Traffic Analytics and Performance Monitoring for TradingBait"""

import time
import logging
from typing import Dict, Any, Optional, List
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from datetime import datetime, timedelta
import uuid
import asyncio
from collections import defaultdict
import hashlib

# Initialize Firebase
initialize_firebase()

class TrafficAnalyticsMiddleware(BaseHTTPMiddleware):
    """Comprehensive traffic analytics and performance monitoring middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.metrics_buffer = []
        self.user_sessions = {}
        self.active_connections = set()
        self.buffer_size = 50
        self.last_flush = time.time()
        self.flush_interval = 180  # 3 minutes
        self.session_timeout = 1800  # 30 minutes
        
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        # Extract user information
        user_info = await self._extract_user_info(request)
        session_info = await self._track_user_session(request, user_info)
        
        # Extract request details
        request_info = {
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "user_agent": request.headers.get("user-agent", ""),
            "referer": request.headers.get("referer", ""),
            "client_ip": request.client.host if request.client else None,
            "timestamp": datetime.utcnow().isoformat(),
            "start_time": start_time,
            "user_id": user_info.get("user_id"),
            "session_id": session_info.get("session_id"),
            "is_authenticated": user_info.get("is_authenticated", False),
            "user_tier": user_info.get("user_tier", "free"),
            "device_type": self._detect_device_type(request.headers.get("user-agent", "")),
            "is_mobile": self._is_mobile_device(request.headers.get("user-agent", "")),
            "country": self._extract_country(request),
            "is_api_call": request.url.path.startswith("/api/") or "api" in request.url.path
        }
        
        # Track active connection
        self.active_connections.add(request_id)
        
        try:
            response = await call_next(request)
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            # Create comprehensive analytics record
            analytics_record = {
                **request_info,
                "status_code": response.status_code,
                "response_time_ms": response_time,
                "success": response.status_code < 400,
                "end_time": end_time,
                "response_size": self._get_response_size(response),
                "cache_hit": response.headers.get("x-cache") == "HIT",
                "endpoint_category": self._categorize_endpoint(request.url.path),
                "business_event": self._detect_business_event(request.url.path, request.method),
                "performance_tier": self._classify_performance(response_time),
                "session_duration": session_info.get("session_duration", 0)
            }
            
            # Update session tracking
            await self._update_session_activity(session_info.get("session_id"), analytics_record)
            
            # Add to metrics buffer
            self.metrics_buffer.append(analytics_record)
            
            # Log performance
            self._log_request(analytics_record)
            
            # Flush if needed
            await self._flush_if_needed()
            
            return response
            
        except Exception as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            # Create error record
            error_record = {
                **request_info,
                "status_code": 500,
                "response_time_ms": response_time,
                "success": False,
                "end_time": end_time,
                "error": str(e),
                "error_type": type(e).__name__,
                "error_category": self._categorize_error(e),
                "endpoint_category": self._categorize_endpoint(request.url.path),
                "business_event": None,
                "performance_tier": "error"
            }
            
            self.metrics_buffer.append(error_record)
            self._log_error(error_record)
            await self._flush_if_needed()
            
            raise e
        finally:
            # Remove from active connections
            self.active_connections.discard(request_id)
    
    async def _extract_user_info(self, request: Request) -> Dict[str, Any]:
        """Extract user information from request"""
        try:
            # Try to get user from auth headers
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                # This is a simplified extraction - you'd integrate with your auth system
                return {
                    "user_id": "authenticated_user",  # Replace with actual user ID extraction
                    "is_authenticated": True,
                    "user_tier": "pro"  # Extract from your subscription system
                }
            
            # For non-authenticated users, create anonymous identifier
            ip = request.client.host if request.client else "unknown"
            user_agent = request.headers.get("user-agent", "")
            anonymous_id = hashlib.md5(f"{ip}:{user_agent}".encode()).hexdigest()[:8]
            
            return {
                "user_id": f"anon_{anonymous_id}",
                "is_authenticated": False,
                "user_tier": "free"
            }
            
        except Exception:
            return {
                "user_id": "unknown",
                "is_authenticated": False,
                "user_tier": "free"
            }
    
    async def _track_user_session(self, request: Request, user_info: Dict[str, Any]) -> Dict[str, Any]:
        """Track user session information"""
        user_id = user_info.get("user_id", "unknown")
        current_time = time.time()
        
        # Clean up expired sessions
        self._cleanup_expired_sessions(current_time)
        
        # Check if user has existing active session
        existing_session = None
        for session_id, session_data in self.user_sessions.items():
            if (session_data.get("user_id") == user_id and 
                current_time - session_data.get("last_activity", 0) < self.session_timeout):
                existing_session = session_id
                break
        
        if existing_session:
            # Update existing session
            session_data = self.user_sessions[existing_session]
            session_duration = current_time - session_data.get("start_time", current_time)
            session_data.update({
                "last_activity": current_time,
                "request_count": session_data.get("request_count", 0) + 1,
                "session_duration": session_duration
            })
            
            return {
                "session_id": existing_session,
                "session_duration": session_duration,
                "is_new_session": False
            }
        else:
            # Create new session
            new_session_id = str(uuid.uuid4())
            self.user_sessions[new_session_id] = {
                "user_id": user_id,
                "start_time": current_time,
                "last_activity": current_time,
                "request_count": 1,
                "user_agent": request.headers.get("user-agent", ""),
                "initial_referer": request.headers.get("referer", ""),
                "client_ip": request.client.host if request.client else None,
                "is_authenticated": user_info.get("is_authenticated", False),
                "pages_visited": []
            }
            
            return {
                "session_id": new_session_id,
                "session_duration": 0,
                "is_new_session": True
            }
    
    async def _update_session_activity(self, session_id: str, analytics_record: Dict[str, Any]):
        """Update session with current activity"""
        if session_id and session_id in self.user_sessions:
            session = self.user_sessions[session_id]
            
            # Track page visits (only for UI routes, not API calls)
            if not analytics_record.get("is_api_call", False):
                pages = session.get("pages_visited", [])
                current_page = analytics_record.get("path", "")
                if current_page and (not pages or pages[-1] != current_page):
                    pages.append(current_page)
                    session["pages_visited"] = pages[-20]  # Keep last 20 pages
    
    def _cleanup_expired_sessions(self, current_time: float):
        """Remove expired user sessions"""
        expired_sessions = []
        for session_id, session_data in self.user_sessions.items():
            if current_time - session_data.get("last_activity", 0) > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.user_sessions[session_id]
    
    def _detect_device_type(self, user_agent: str) -> str:
        """Detect device type from user agent"""
        user_agent_lower = user_agent.lower()
        if "mobile" in user_agent_lower or "android" in user_agent_lower:
            return "mobile"
        elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
            return "tablet"
        else:
            return "desktop"
    
    def _is_mobile_device(self, user_agent: str) -> bool:
        """Check if request is from mobile device"""
        mobile_indicators = ["mobile", "android", "iphone", "ipod", "blackberry", "windows phone"]
        return any(indicator in user_agent.lower() for indicator in mobile_indicators)
    
    def _extract_country(self, request: Request) -> str:
        """Extract country from request headers (would integrate with GeoIP)"""
        # Placeholder - in production you'd use GeoIP service
        cf_country = request.headers.get("cf-ipcountry", "")
        return cf_country if cf_country else "unknown"
    
    def _get_response_size(self, response: Response) -> int:
        """Get response size in bytes"""
        try:
            content_length = response.headers.get("content-length")
            if content_length:
                return int(content_length)
            elif hasattr(response, 'body'):
                return len(response.body)
        except:
            pass
        return 0
    
    def _categorize_endpoint(self, path: str) -> str:
        """Categorize endpoint by functionality"""
        if "/auth" in path or "/login" in path:
            return "authentication"
        elif "/api/stripe" in path or "/payment" in path:
            return "billing"
        elif "/api/trade" in path or "/journal" in path:
            return "trading"
        elif "/api/analytics" in path or "/stats" in path:
            return "analytics"
        elif "/api/ai" in path or "/coach" in path:
            return "ai_features"
        elif "/api/admin" in path:
            return "admin"
        elif "/health" in path:
            return "health_check"
        elif path.startswith("/api/"):
            return "api"
        else:
            return "frontend"
    
    def _detect_business_event(self, path: str, method: str) -> Optional[str]:
        """Detect business-relevant events"""
        if method == "POST":
            if "/signup" in path or "/register" in path:
                return "user_signup"
            elif "/login" in path:
                return "user_login"
            elif "/subscribe" in path or "/checkout" in path:
                return "subscription_attempt"
            elif "/trade" in path:
                return "trade_created"
            elif "/journal" in path:
                return "journal_entry"
        elif method == "GET":
            if "/dashboard" in path:
                return "dashboard_view"
            elif "/analytics" in path:
                return "analytics_view"
        return None
    
    def _classify_performance(self, response_time_ms: float) -> str:
        """Classify request performance"""
        if response_time_ms < 100:
            return "excellent"
        elif response_time_ms < 300:
            return "good"
        elif response_time_ms < 1000:
            return "acceptable"
        elif response_time_ms < 3000:
            return "slow"
        else:
            return "very_slow"
    
    def _categorize_error(self, error: Exception) -> str:
        """Categorize error types"""
        error_type = type(error).__name__
        if "Auth" in error_type or "Permission" in error_type:
            return "authentication"
        elif "NotFound" in error_type or "404" in str(error):
            return "not_found"
        elif "Validation" in error_type:
            return "validation"
        elif "Database" in error_type or "Connection" in error_type:
            return "database"
        else:
            return "application"
    
    def _log_request(self, record: Dict[str, Any]):
        """Log request with performance indicators"""
        response_time = record["response_time_ms"]
        status = record["status_code"]
        path = record["path"]
        user_type = "auth" if record["is_authenticated"] else "anon"
        
        if response_time > 3000:
            pass
        elif response_time > 1000:
            pass
        elif status >= 400:
            pass
        else:
            pass
    
    def _log_error(self, record: Dict[str, Any]):
        """Log error with context"""
        pass
    
    async def _flush_if_needed(self):
        """Flush metrics buffer if needed"""
        current_time = time.time()
        
        if (len(self.metrics_buffer) >= self.buffer_size or 
            current_time - self.last_flush >= self.flush_interval):
            await self._flush_metrics()
    
    async def _flush_metrics(self):
        """Flush all metrics to storage"""
        if not self.metrics_buffer:
            return
        
        try:
            current_time = datetime.utcnow()
            date_key = current_time.strftime("%Y-%m-%d")
            hour_key = current_time.strftime("%H")
            
            # Store detailed metrics
            db_firestore = firestore.client()
            detail_ref = db_firestore.collection("traffic_detailed").document(f"{date_key}_{hour_key}")
            detail_doc = detail_ref.get()
            existing_detailed = detail_doc.to_dict().get("records", []) if detail_doc.exists else []

            # Add new metrics
            existing_detailed.extend(self.metrics_buffer)
            detail_ref.set({"records": existing_detailed})
            
            # Store aggregated metrics
            await self._store_aggregated_metrics(date_key, hour_key)
            
            # Store session analytics
            await self._store_session_analytics(date_key, hour_key)
            
            pass
            
            # Clear buffer
            self.metrics_buffer = []
            self.last_flush = time.time()
            
        except Exception as e:
            pass
    
    async def _store_aggregated_metrics(self, date_key: str, hour_key: str):
        """Store aggregated hourly metrics"""
        try:
            # Calculate aggregations
            total_requests = len(self.metrics_buffer)
            successful_requests = [m for m in self.metrics_buffer if m.get('success', False)]
            failed_requests = [m for m in self.metrics_buffer if not m.get('success', True)]
            
            # Response time metrics
            response_times = [m['response_time_ms'] for m in self.metrics_buffer]
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            # User metrics
            unique_users = len(set(m.get('user_id') for m in self.metrics_buffer if m.get('user_id')))
            authenticated_users = len(set(m.get('user_id') for m in self.metrics_buffer if m.get('is_authenticated')))
            
            # Business events
            business_events = [m.get('business_event') for m in self.metrics_buffer if m.get('business_event')]
            business_event_counts = defaultdict(int)
            for event in business_events:
                business_event_counts[event] += 1
            
            # Device breakdown
            device_breakdown = defaultdict(int)
            for m in self.metrics_buffer:
                device_breakdown[m.get('device_type', 'unknown')] += 1
            
            # Endpoint categories
            endpoint_categories = defaultdict(int)
            for m in self.metrics_buffer:
                endpoint_categories[m.get('endpoint_category', 'unknown')] += 1
            
            summary = {
                "timestamp": datetime.utcnow().isoformat(),
                "total_requests": total_requests,
                "successful_requests": len(successful_requests),
                "failed_requests": len(failed_requests),
                "error_rate": (len(failed_requests) / total_requests * 100) if total_requests > 0 else 0,
                "avg_response_time_ms": round(avg_response_time, 2),
                "unique_users": unique_users,
                "authenticated_users": authenticated_users,
                "active_sessions": len(self.user_sessions),
                "business_events": dict(business_event_counts),
                "device_breakdown": dict(device_breakdown),
                "endpoint_categories": dict(endpoint_categories)
            }
            
            db_firestore = firestore.client()
            db_firestore.collection("traffic_summaries").document(f"{date_key}_{hour_key}").set(summary)

        except Exception as e:
            pass

    async def _store_session_analytics(self, date_key: str, hour_key: str):
        """Store session analytics data"""
        try:
            # Get current active sessions summary
            active_sessions_summary = []
            current_time = time.time()
            
            for session_id, session_data in self.user_sessions.items():
                if current_time - session_data.get("last_activity", 0) < 300:  # Active in last 5 minutes
                    active_sessions_summary.append({
                        "session_id": session_id,
                        "user_id": session_data.get("user_id"),
                        "duration": current_time - session_data.get("start_time", current_time),
                        "request_count": session_data.get("request_count", 0),
                        "is_authenticated": session_data.get("is_authenticated", False),
                        "pages_visited_count": len(session_data.get("pages_visited", [])),
                        "device_type": self._detect_device_type(session_data.get("user_agent", ""))
                    })
            
            session_analytics = {
                "timestamp": datetime.utcnow().isoformat(),
                "total_active_sessions": len(active_sessions_summary),
                "authenticated_sessions": len([s for s in active_sessions_summary if s["is_authenticated"]]),
                "avg_session_duration": sum(s["duration"] for s in active_sessions_summary) / len(active_sessions_summary) if active_sessions_summary else 0,
                "avg_pages_per_session": sum(s["pages_visited_count"] for s in active_sessions_summary) / len(active_sessions_summary) if active_sessions_summary else 0,
                "sessions": active_sessions_summary
            }
            
            db_firestore = firestore.client()
            db_firestore.collection("traffic_sessions").document(f"{date_key}_{hour_key}").set(session_analytics)

        except Exception as e:
            pass
    
    def get_current_stats(self) -> Dict[str, Any]:
        """Get current real-time statistics"""
        current_time = time.time()
        
        # Active sessions (active in last 5 minutes)
        active_sessions = 0
        authenticated_sessions = 0
        for session_data in self.user_sessions.values():
            if current_time - session_data.get("last_activity", 0) < 300:
                active_sessions += 1
                if session_data.get("is_authenticated", False):
                    authenticated_sessions += 1
        
        return {
            "active_connections": len(self.active_connections),
            "active_sessions": active_sessions,
            "authenticated_sessions": authenticated_sessions,
            "total_sessions": len(self.user_sessions),
            "buffer_size": len(self.metrics_buffer),
            "last_flush": datetime.fromtimestamp(self.last_flush).isoformat()
        }


# Legacy function for backward compatibility
def get_performance_analytics(hours: int = 24) -> Dict[str, Any]:
    """Get performance analytics for the last N hours"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        all_metrics = []
        db_firestore = firestore.client()

        # Collect metrics from Firestore
        current_time = start_time
        while current_time <= end_time:
            date_key = current_time.strftime("%Y-%m-%d")
            hour_key = current_time.strftime("%H")
            try:
                doc = db_firestore.collection("traffic_detailed").document(f"{date_key}_{hour_key}").get()
                hourly_metrics = doc.to_dict().get("records", []) if doc.exists else []
                all_metrics.extend(hourly_metrics)
            except:
                pass

            current_time += timedelta(hours=1)
        
        if not all_metrics:
            return {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "avg_response_time": 0,
                "error_rate": 0,
                "p95_response_time": 0,
                "slowest_endpoints": [],
                "error_breakdown": {},
                "unique_users": 0,
                "time_range": {
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat(),
                    "hours": hours
                }
            }
        
        # Calculate enhanced analytics
        total_requests = len(all_metrics)
        successful_requests = [m for m in all_metrics if m.get('success', False)]
        failed_requests = [m for m in all_metrics if not m.get('success', True)]
        
        # Response time analytics
        response_times = [m['response_time_ms'] for m in all_metrics]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Calculate P95
        sorted_times = sorted(response_times)
        p95_index = int(0.95 * len(sorted_times))
        p95_response_time = sorted_times[p95_index] if sorted_times else 0
        
        # Error rate
        error_rate = (len(failed_requests) / total_requests * 100) if total_requests > 0 else 0
        
        # User analytics
        unique_users = len(set(m.get('user_id') for m in all_metrics if m.get('user_id')))
        
        # Slowest endpoints
        endpoint_times = {}
        for metric in all_metrics:
            path = metric.get('path', 'unknown')
            if path not in endpoint_times:
                endpoint_times[path] = []
            endpoint_times[path].append(metric['response_time_ms'])
        
        slowest_endpoints = []
        for path, times in endpoint_times.items():
            avg_time = sum(times) / len(times)
            slowest_endpoints.append({
                'path': path,
                'avg_response_time': round(avg_time, 2),
                'request_count': len(times)
            })
        
        slowest_endpoints.sort(key=lambda x: x['avg_response_time'], reverse=True)
        slowest_endpoints = slowest_endpoints[:10]
        
        # Error breakdown
        error_breakdown = {}
        for metric in failed_requests:
            error_type = metric.get('error_type', 'Unknown')
            error_breakdown[error_type] = error_breakdown.get(error_type, 0) + 1
        
        return {
            "total_requests": total_requests,
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "avg_response_time": round(avg_response_time, 2),
            "p95_response_time": round(p95_response_time, 2),
            "error_rate": round(error_rate, 2),
            "unique_users": unique_users,
            "slowest_endpoints": slowest_endpoints,
            "error_breakdown": error_breakdown,
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "hours": hours
            }
        }
        
    except Exception as e:
        pass
        return {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time": 0,
            "error_rate": 0,
            "p95_response_time": 0,
            "unique_users": 0,
            "slowest_endpoints": [],
            "error_breakdown": {},
            "time_range": {
                "start": (datetime.utcnow() - timedelta(hours=24)).isoformat(),
                "end": datetime.utcnow().isoformat(),
                "hours": 24
            }
        }


def get_real_time_stats() -> Dict[str, Any]:
    """Get real-time performance statistics"""
    try:
        # Get current hour detailed metrics
        current_time = datetime.utcnow()
        date_key = current_time.strftime("%Y-%m-%d")
        hour_key = current_time.strftime("%H")
        detailed_key = f"traffic_analytics_detailed_{date_key}_{hour_key}"
        summary_key = f"traffic_summary_{date_key}_{hour_key}"
        
        db_firestore = firestore.client()

        # Try to get summary first (more efficient)
        try:
            summary_doc = db_firestore.collection("traffic_summaries").document(f"{date_key}_{hour_key}").get()
            summary = summary_doc.to_dict() if summary_doc.exists else {}
            if summary:
                return {
                    "current_hour_requests": summary.get("total_requests", 0),
                    "avg_response_time": summary.get("avg_response_time_ms", 0),
                    "error_count": summary.get("failed_requests", 0),
                    "error_rate": summary.get("error_rate", 0),
                    "unique_users": summary.get("unique_users", 0),
                    "active_sessions": summary.get("active_sessions", 0),
                    "last_updated": summary.get("timestamp", current_time.isoformat())
                }
        except:
            pass
        
        # Fallback to detailed metrics
        detail_doc = db_firestore.collection("traffic_detailed").document(f"{date_key}_{hour_key}").get()
        current_hour_metrics = detail_doc.to_dict().get("records", []) if detail_doc.exists else []
        
        if not current_hour_metrics:
            return {
                "current_hour_requests": 0,
                "avg_response_time": 0,
                "error_count": 0,
                "error_rate": 0,
                "unique_users": 0,
                "active_sessions": 0,
                "last_updated": current_time.isoformat()
            }
        
        # Calculate stats from detailed metrics
        total_requests = len(current_hour_metrics)
        response_times = [m['response_time_ms'] for m in current_hour_metrics]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        error_count = len([m for m in current_hour_metrics if not m.get('success', True)])
        unique_users = len(set(m.get('user_id') for m in current_hour_metrics if m.get('user_id')))
        
        return {
            "current_hour_requests": total_requests,
            "avg_response_time": round(avg_response_time, 2),
            "error_count": error_count,
            "error_rate": round((error_count / total_requests * 100), 2) if total_requests > 0 else 0,
            "unique_users": unique_users,
            "active_sessions": 0,  # Would need middleware instance
            "last_updated": current_time.isoformat()
        }
        
    except Exception as e:
        pass
        return {
            "current_hour_requests": 0,
            "avg_response_time": 0,
            "error_count": 0,
            "error_rate": 0,
            "unique_users": 0,
            "active_sessions": 0,
            "last_updated": datetime.utcnow().isoformat()
        }
