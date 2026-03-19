#!/usr/bin/env python3
"""
TradingBait API Testing Runner

Comprehensive testing suite for API endpoints with performance monitoring.
"""

import asyncio
import time
import json
import sys
from typing import Dict, List, Any, Optional
import aiohttp
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TestResult:
    endpoint: str
    method: str
    status: int
    response_time: float
    success: bool
    error: Optional[str] = None

@dataclass
class PerformanceBenchmark:
    endpoint: str
    average_response_time: float
    max_acceptable_time: float
    success_rate: float
    total_requests: int

class ApiTestRunner:
    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.results: List[TestResult] = []
        self.benchmarks: List[PerformanceBenchmark] = []
    
    async def test_endpoint(
        self,
        session: aiohttp.ClientSession,
        endpoint: str,
        method: str = 'GET',
        body: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        expected_status: int = 200
    ) -> TestResult:
        """Test a single endpoint and measure performance"""
        start_time = time.time()
        
        try:
            url = f"{self.base_url}{endpoint}"
            async with session.request(
                method=method,
                url=url,
                json=body,
                headers=headers or {},
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as response:
                response_time = (time.time() - start_time) * 1000  # Convert to ms
                success = response.status == expected_status
                
                error = None
                if not success:
                    error = f"Expected {expected_status}, got {response.status}"
                elif response_time > 5000:  # 5 second threshold
                    error = f"Slow response: {response_time:.0f}ms"
                    success = False
                
                result = TestResult(
                    endpoint=endpoint,
                    method=method,
                    status=response.status,
                    response_time=response_time,
                    success=success,
                    error=error
                )
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            result = TestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                response_time=response_time,
                success=False,
                error=str(e)
            )
        
        self.results.append(result)
        return result
    
    async def load_test(
        self,
        endpoint: str,
        concurrent_requests: int = 10,
        total_requests: int = 100,
        method: str = 'GET',
        body: Optional[Dict] = None
    ) -> PerformanceBenchmark:
        """Run load test on endpoint"""
        print(f"🚀 Load testing {endpoint} with {concurrent_requests} concurrent requests...")
        
        results: List[TestResult] = []
        
        async with aiohttp.ClientSession() as session:
            # Run requests in batches to control concurrency
            batch_size = concurrent_requests
            total_batches = (total_requests + batch_size - 1) // batch_size
            
            for batch in range(total_batches):
                batch_start = batch * batch_size
                batch_end = min(batch_start + batch_size, total_requests)
                batch_requests = batch_end - batch_start
                
                # Create batch of concurrent requests
                tasks = [
                    self.test_endpoint(session, endpoint, method, body)
                    for _ in range(batch_requests)
                ]
                
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results, filtering out exceptions
                for result in batch_results:
                    if isinstance(result, TestResult):
                        results.append(result)
                
                # Brief pause between batches
                if batch < total_batches - 1:
                    await asyncio.sleep(0.1)
        
        # Calculate performance metrics
        successful_requests = [r for r in results if r.success]
        response_times = [r.response_time for r in successful_requests]
        
        benchmark = PerformanceBenchmark(
            endpoint=endpoint,
            average_response_time=sum(response_times) / len(response_times) if response_times else 0,
            max_acceptable_time=3000,  # 3 seconds
            success_rate=(len(successful_requests) / len(results)) * 100 if results else 0,
            total_requests=len(results)
        )
        
        self.benchmarks.append(benchmark)
        
        print(f"✅ Load test completed")
        print(f"📊 Success rate: {benchmark.success_rate:.1f}%")
        print(f"⏱️  Average response time: {benchmark.average_response_time:.0f}ms")
        
        return benchmark
    
    async def run_health_checks(self) -> List[TestResult]:
        """Run basic health checks"""
        print('🏥 Running health checks...')
        
        health_endpoints = [
            '/routes/health/check',
            '/routes/stripe/check-connection',
            '/routes/analytics/system-health',
        ]
        
        results = []
        async with aiohttp.ClientSession() as session:
            for endpoint in health_endpoints:
                result = await self.test_endpoint(session, endpoint)
                results.append(result)
                status_icon = '✅' if result.success else '❌'
                print(f"{status_icon} {endpoint}: {result.status} ({result.response_time:.0f}ms)")
        
        return results
    
    async def run_critical_user_journeys(self) -> List[TestResult]:
        """Test critical user journey endpoints"""
        print('👤 Testing critical user journeys...')
        
        journeys = [
            # Trading data management
            {'endpoint': '/routes/trades/performance-metrics', 'method': 'GET'},
            {'endpoint': '/routes/trades/realtime-stats', 'method': 'GET'},
            
            # Journal functionality
            {'endpoint': '/routes/journal/entries', 'method': 'GET'},
            
            # Analytics
            {'endpoint': '/routes/habits/analytics', 'method': 'GET'},
            {'endpoint': '/routes/analytics/comprehensive-analysis', 'method': 'GET'},
            
            # GDPR compliance
            {'endpoint': '/routes/gdpr-compliance/data-retention-info', 'method': 'GET'},
            
            # User management
            {'endpoint': '/routes/admin/current-user-info', 'method': 'GET'},
        ]
        
        results = []
        async with aiohttp.ClientSession() as session:
            for journey in journeys:
                result = await self.test_endpoint(
                    session, 
                    journey['endpoint'], 
                    journey['method']
                )
                results.append(result)
                status_icon = '✅' if result.success else '❌'
                print(f"{status_icon} {journey['endpoint']}: {result.status} ({result.response_time:.0f}ms)")
        
        return results
    
    async def run_performance_tests(self) -> List[PerformanceBenchmark]:
        """Run performance tests on key endpoints"""
        print('🚄 Running performance tests...')
        
        performance_endpoints = [
            '/routes/health/check',
            '/routes/trades/performance-metrics',
            '/routes/habits/analytics',
            '/routes/analytics/comprehensive-analysis',
        ]
        
        benchmarks = []
        for endpoint in performance_endpoints:
            benchmark = await self.load_test(endpoint, 5, 25)  # 5 concurrent, 25 total
            benchmarks.append(benchmark)
        
        return benchmarks
    
    def generate_report(self) -> str:
        """Generate comprehensive test report"""
        total_tests = len(self.results)
        successful_tests = len([r for r in self.results if r.success])
        average_response_time = sum(r.response_time for r in self.results) / total_tests if total_tests > 0 else 0
        
        report = "\n📋 TradingBait API Test Report\n"
        report += "" + "=" * 30 + "\n"
        report += f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        report += f"Total Tests: {total_tests}\n"
        report += f"Successful: {successful_tests} ({(successful_tests / total_tests * 100):.1f}%)\n" if total_tests > 0 else "No tests run\n"
        report += f"Average Response Time: {average_response_time:.0f}ms\n\n"
        
        # Failed tests
        failed_tests = [r for r in self.results if not r.success]
        if failed_tests:
            report += "❌ Failed Tests:\n"
            for test in failed_tests:
                report += f"  - {test.method} {test.endpoint}: {test.error}\n"
            report += "\n"
        
        # Performance benchmarks
        if self.benchmarks:
            report += "📊 Performance Benchmarks:\n"
            for benchmark in self.benchmarks:
                status = "✅" if benchmark.average_response_time <= benchmark.max_acceptable_time else "⚠️"
                report += f"  {status} {benchmark.endpoint}:\n"
                report += f"    - Avg Response: {benchmark.average_response_time:.0f}ms\n"
                report += f"    - Success Rate: {benchmark.success_rate:.1f}%\n"
                report += f"    - Total Requests: {benchmark.total_requests}\n"
        
        return report
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get test metrics as structured data"""
        total_tests = len(self.results)
        successful_tests = len([r for r in self.results if r.success])
        
        return {
            'total_tests': total_tests,
            'successful_tests': successful_tests,
            'failure_rate': ((total_tests - successful_tests) / total_tests) * 100 if total_tests > 0 else 0,
            'success_rate': (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
            'average_response_time': sum(r.response_time for r in self.results) / total_tests if total_tests > 0 else 0,
            'benchmarks': [{
                'endpoint': b.endpoint,
                'average_response_time': b.average_response_time,
                'success_rate': b.success_rate,
                'total_requests': b.total_requests,
                'acceptable': b.average_response_time <= b.max_acceptable_time
            } for b in self.benchmarks],
            'failed_tests': [{
                'endpoint': r.endpoint,
                'method': r.method,
                'error': r.error,
                'response_time': r.response_time
            } for r in self.results if not r.success]
        }

async def main():
    """Main test runner"""
    # Configuration
    base_url = "https://riff.new/_projects/47e89438-adfe-4372-b617-66a3eabfadfe/dbtn/devx/app"
    
    # Initialize test runner
    runner = ApiTestRunner(base_url)
    
    print("🧪 TradingBait API Test Suite")
    print("" + "=" * 30)
    
    try:
        # Run comprehensive test suite
        await runner.run_health_checks()
        print()
        
        await runner.run_critical_user_journeys()
        print()
        
        await runner.run_performance_tests()
        print()
        
        # Generate and display report
        report = runner.generate_report()
        print(report)
        
        # Get metrics for potential JSON export
        metrics = runner.get_metrics()
        
        # Save metrics to file
        with open('test_results.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print("📁 Test results saved to test_results.json")
        
        # Exit with appropriate code
        if metrics['success_rate'] < 90:  # 90% success rate threshold
            print("\n⚠️  Test suite failed - success rate below 90%")
            sys.exit(1)
        else:
            print("\n✅ All tests passed successfully!")
            sys.exit(0)
            
    except Exception as e:
        print(f"\n💥 Test suite encountered error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
