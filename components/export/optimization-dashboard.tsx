/**
 * Optimization Dashboard
 * Displays performance metrics, optimization results, and system recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  RefreshCw,
  HardDrive,
  Cpu,
  Wifi,

  Gauge,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { 
  OptimizationResult, 
  PerformanceMetrics, 
  OptimizationConfig,
  exportOptimization 
} from '@/lib/export-optimization';
import { GeneratedPresentation, ExportOptions } from '@/lib/export-service';

interface OptimizationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: GeneratedPresentation;
  options: ExportOptions;
}

export function OptimizationDashboard({
  isOpen,
  onClose,
  presentation,
  options
}: OptimizationDashboardProps) {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [config, setConfig] = useState<OptimizationConfig | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);
  const [resourcePoolStats, setResourcePoolStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const currentConfig = exportOptimization.getConfig();
      const history = exportOptimization.getPerformanceHistory();
      const poolStats = exportOptimization.getResourcePoolStats();

      setConfig(currentConfig);
      setPerformanceHistory(history);
      setResourcePoolStats(poolStats);
    } catch (error) {
      console.error('Failed to load optimization data:', error);
    }
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    try {
      const result = await exportOptimization.optimizeExport(presentation, options);
      setOptimizationResult(result);
      await loadData(); // Refresh data after optimization
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value < threshold * 0.5) return 'text-green-600';
    if (value < threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value: number, threshold: number) => {
    if (value < threshold * 0.5) return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (value < threshold) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Export Optimization Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runOptimization}
              disabled={isOptimizing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
              {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {isOptimizing && (
          <Alert className="mb-6">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Running export optimization... This may take a few moments.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* System Performance Metrics */}
          {optimizationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  System Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(optimizationResult.metrics.memoryUsage, 0.8)}`}>
                      {(optimizationResult.metrics.memoryUsage * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Cpu className="h-5 w-5 text-green-600" />
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(optimizationResult.metrics.cpuUsage, 0.7)}`}>
                      {(optimizationResult.metrics.cpuUsage * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">CPU Usage</div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Wifi className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(optimizationResult.metrics.networkLatency, 100)}`}>
                      {optimizationResult.metrics.networkLatency.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Network Latency</div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(optimizationResult.metrics.cacheHitRate, 50)}`}>
                      {optimizationResult.metrics.cacheHitRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Cache Hit Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Results */}
          {optimizationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Optimization Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Optimization Status</span>
                    <Badge variant={optimizationResult.optimized ? "default" : "secondary"}>
                      {optimizationResult.optimized ? 'Optimized' : 'No Improvements'}
                    </Badge>
                  </div>

                  {optimizationResult.improvements.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Applied Improvements:</h4>
                      <ul className="space-y-1">
                        {optimizationResult.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Object.keys(optimizationResult.performanceGains).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Performance Gains:</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(optimizationResult.performanceGains).map(([key, gain]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm capitalize">{key}</span>
                            <span className="text-sm font-medium text-green-600">+{gain.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Processing Time:</span>
                      <span className="ml-2 font-medium">{formatTime(optimizationResult.metrics.processingTime)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Compression Ratio:</span>
                      <span className="ml-2 font-medium">{(optimizationResult.metrics.compressionRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Throughput:</span>
                      <span className="ml-2 font-medium">{formatFileSize(optimizationResult.metrics.throughput)}/s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {optimizationResult && optimizationResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {optimizationResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration */}
          {config && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Optimization Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Max Concurrent:</span>
                    <span className="ml-2 font-medium">{config.maxConcurrentExports}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Memory Threshold:</span>
                    <span className="ml-2 font-medium">{(config.memoryThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Compression Level:</span>
                    <span className="ml-2 font-medium">{config.compressionLevel}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache Strategy:</span>
                    <Badge variant="outline" className="ml-2">{config.cacheStrategy}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Preload Enabled:</span>
                    <Badge variant="outline" className="ml-2">
                      {config.preloadEnabled ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Background Processing:</span>
                    <Badge variant="outline" className="ml-2">
                      {config.backgroundProcessing ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Adaptive Quality:</span>
                    <Badge variant="outline" className="ml-2">
                      {config.adaptiveQuality ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Resource Pooling:</span>
                    <Badge variant="outline" className="ml-2">
                      {config.resourcePooling ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resource Pool Statistics */}
          {resourcePoolStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Resource Pool Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Resources:</span>
                    <span className="ml-2 font-medium">{resourcePoolStats.totalResources}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Size:</span>
                    <span className="ml-2 font-medium">{formatFileSize(resourcePoolStats.totalSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Oldest Resource:</span>
                    <span className="ml-2 font-medium">
                      {resourcePoolStats.oldestResource ? new Date(resourcePoolStats.oldestResource).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Newest Resource:</span>
                    <span className="ml-2 font-medium">
                      {resourcePoolStats.newestResource ? new Date(resourcePoolStats.newestResource).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance History */}
          {performanceHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Performance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Average Processing Time:</span>
                      <span className="ml-2 font-medium">
                        {formatTime(performanceHistory.reduce((sum, m) => sum + m.processingTime, 0) / performanceHistory.length)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average Memory Usage:</span>
                      <span className="ml-2 font-medium">
                        {(performanceHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / performanceHistory.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average CPU Usage:</span>
                      <span className="ml-2 font-medium">
                        {(performanceHistory.reduce((sum, m) => sum + m.cpuUsage, 0) / performanceHistory.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average Cache Hit Rate:</span>
                      <span className="ml-2 font-medium">
                        {(performanceHistory.reduce((sum, m) => sum + m.cacheHitRate, 0) / performanceHistory.length).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Showing last {performanceHistory.length} performance measurements
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Current Export Configuration
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
                  <span className="text-gray-600">Images:</span>
                  <Badge variant="outline" className="ml-2">
                    {options.includeImages ? 'Included' : 'Excluded'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Compression:</span>
                  <Badge variant="outline" className="ml-2">
                    {options.compression ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Interactive:</span>
                  <Badge variant="outline" className="ml-2">
                    {options.interactive ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Slides:</span>
                  <span className="ml-2 font-medium">{presentation.slides.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 