/**
 * Testing Dashboard
 * Displays comprehensive test results, performance metrics, and quality scores
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  FileText,
  Zap,
  Shield,
  Activity,
  Target,
  Users
} from 'lucide-react';
import { TestSuite, TestResult, exportTestingSuite } from '@/lib/export-testing-suite';
import { GeneratedPresentation, ExportOptions } from '@/lib/export-service';

interface TestingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: GeneratedPresentation;
  options: ExportOptions;
}

export function TestingDashboard({
  isOpen,
  onClose,
  presentation,
  options
}: TestingDashboardProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && testSuites.length === 0) {
      runTests();
    }
  }, [isOpen]);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await exportTestingSuite.runAllTests(presentation, options);
      setTestSuites(results);
      setSummary(exportTestingSuite.getTestSummary());
    } catch (error) {
      console.error('Testing failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (successRate >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (successRate: number) => {
    if (successRate >= 90) return 'text-green-600';
    if (successRate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (successRate: number) => {
    if (successRate >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (successRate >= 70) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="default" className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="h-6 w-6" />
            Export Testing Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runTests}
              disabled={isRunning}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {isRunning && (
          <Alert className="mb-6">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Running comprehensive export tests... This may take a few moments.
            </AlertDescription>
          </Alert>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Overall Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Overall Test Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalSuites}</div>
                    <div className="text-sm text-gray-600">Test Suites</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.passedTests}</div>
                    <div className="text-sm text-gray-600">Passed Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.failedTests}</div>
                    <div className="text-sm text-gray-600">Failed Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{summary.overallSuccessRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-medium">{summary.overallSuccessRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={summary.overallSuccessRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Test Suites Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Test Suites Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testSuites.map((suite) => (
                    <div
                      key={suite.name}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedSuite(selectedSuite === suite.name ? null : suite.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(suite.successRate)}
                          <div>
                            <h4 className="font-medium">{suite.name}</h4>
                            <p className="text-sm text-gray-600">{suite.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {suite.passedTests}/{suite.totalTests} passed
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDuration(suite.totalDuration)}
                            </div>
                          </div>
                          {getStatusBadge(suite.successRate)}
                        </div>
                      </div>
                      
                      {selectedSuite === suite.name && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="space-y-3">
                            {suite.tests.map((test, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  {test.passed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">{test.testName}</div>
                                    <div className="text-xs text-gray-600">{test.details}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">
                                    {formatDuration(test.duration)}
                                  </div>
                                  {test.metrics && (
                                    <div className="text-xs text-gray-400">
                                      {Object.entries(test.metrics).map(([key, value]) => (
                                        <span key={key} className="mr-2">
                                          {key}: {String(value)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-bold">{formatDuration(summary.totalDuration)}</div>
                    <div className="text-sm text-gray-600">Total Test Time</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold">{summary.overallSuccessRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-lg font-bold">{summary.totalTests}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quality Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testSuites.map((suite) => (
                    <div key={suite.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {suite.name === 'Functional Testing' && <FileText className="h-4 w-4 text-blue-600" />}
                        {suite.name === 'Performance Testing' && <Zap className="h-4 w-4 text-green-600" />}
                        {suite.name === 'Quality Testing' && <Shield className="h-4 w-4 text-purple-600" />}
                        {suite.name === 'User Experience Testing' && <Users className="h-4 w-4 text-orange-600" />}
                        <span className="font-medium">{suite.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Progress value={suite.successRate} className="h-2" />
                        </div>
                        <span className={`font-bold ${getStatusColor(suite.successRate)}`}>
                          {suite.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.overallSuccessRate >= 90 ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Excellent! Your export system is performing exceptionally well. All tests are passing with high success rates.
                      </AlertDescription>
                    </Alert>
                  ) : summary.overallSuccessRate >= 70 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Good performance overall. Consider addressing failed tests to improve reliability and user experience.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Several tests are failing. Review the detailed results above and address critical issues to improve export quality.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {testSuites.some(suite => suite.successRate < 80) && (
                    <div className="text-sm text-gray-600">
                      <h4 className="font-medium mb-2">Areas for Improvement:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {testSuites
                          .filter(suite => suite.successRate < 80)
                          .map(suite => (
                            <li key={suite.name}>
                              {suite.name}: {suite.failedTests} failed tests
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Test Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <Badge variant="outline" className="ml-2">{options.format.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality:</span>
                    <Badge variant="outline" className="ml-2">{options.quality || 'medium'}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Slides:</span>
                    <span className="ml-2 font-medium">{presentation.slides.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Compression:</span>
                    <Badge variant="outline" className="ml-2">
                      {options.compression ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!summary && !isRunning && (
          <div className="text-center py-8">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No test results available. Click "Run Tests" to start testing.</p>
          </div>
        )}
      </div>
    </div>
  );
} 