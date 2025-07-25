/**
 * Cache Management Dashboard
 * Provides comprehensive cache statistics, health monitoring, and management controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  HardDrive,
  Clock,
  BarChart3,
  Settings,
  Download,
  Activity,
  Zap
} from 'lucide-react';
import { exportCache } from '@/lib/export-cache';
import { CacheStats, CacheEntry } from '@/lib/export-cache';

interface CacheManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CacheManagementDashboard({
  isOpen,
  onClose
}: CacheManagementDashboardProps) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [health, setHealth] = useState<{ healthy: boolean; issues: string[] } | null>(null);
  const [mostAccessed, setMostAccessed] = useState<CacheEntry[]>([]);
  const [largestEntries, setLargestEntries] = useState<CacheEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const cacheStats = exportCache.getStats();
      const cacheHealth = exportCache.isHealthy();
      const mostAccessedEntries = exportCache.getMostAccessedEntries(5);
      const largestCacheEntries = exportCache.getLargestEntries(5);

      setStats(cacheStats);
      setHealth(cacheHealth);
      setMostAccessed(mostAccessedEntries);
      setLargestEntries(largestCacheEntries);
    } catch (error) {
      console.error('Failed to refresh cache data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearCache = () => {
    exportCache.clear();
    refreshData();
  };

  const cleanupCache = () => {
    exportCache.cleanup();
    refreshData();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getHealthIcon = () => {
    if (!health) return <Activity className="h-4 w-4" />;
    return health.healthy ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getHealthColor = () => {
    if (!health) return 'text-gray-600';
    return health.healthy ? 'text-green-600' : 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Cache Management Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {stats && (
          <div className="space-y-6">
            {/* Cache Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getHealthIcon()}
                  Cache Health Status
                  <Badge 
                    variant={health?.healthy ? "default" : "destructive"}
                    className={health?.healthy ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {health?.healthy ? 'Healthy' : 'Issues Detected'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health?.issues && health.issues.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {health.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cache is operating normally with no issues detected.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Cache Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Entries</p>
                      <p className="text-2xl font-bold">{stats.totalEntries}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Size</p>
                      <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Hit Rate</p>
                      <p className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Avg Entry Size</p>
                      <p className="text-2xl font-bold">{formatFileSize(stats.averageEntrySize)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cache Usage Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="text-sm font-medium">
                    {formatFileSize(stats.totalSize)} / {formatFileSize(exportCache.getConfig().maxSize)}
                  </span>
                </div>
                <Progress 
                  value={(stats.totalSize / exportCache.getConfig().maxSize) * 100} 
                  className="h-2" 
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Entry Count</span>
                  <span className="text-sm font-medium">
                    {stats.totalEntries} / {exportCache.getConfig().maxEntries}
                  </span>
                </div>
                <Progress 
                  value={(stats.totalEntries / exportCache.getConfig().maxEntries) * 100} 
                  className="h-2" 
                />
              </CardContent>
            </Card>

            {/* Most Accessed Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most Accessed Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mostAccessed.map((entry, index) => (
                    <div key={entry.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{entry.result.format}</Badge>
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{entry.key}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{entry.accessCount} accesses</p>
                        <p className="text-xs text-gray-500">{formatTime(entry.lastAccessed)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Largest Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Largest Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {largestEntries.map((entry, index) => (
                    <div key={entry.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{entry.result.format}</Badge>
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{entry.key}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatFileSize(entry.size)}</p>
                        <p className="text-xs text-gray-500">{entry.accessCount} accesses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cache Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cache Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={cleanupCache}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Cleanup Cache
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={clearCache}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Cache
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cleanup removes expired entries, while Clear removes all cached data.
                </p>
              </CardContent>
            </Card>

            {/* Cache Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cache Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Max Size:</span>
                    <span className="ml-2 font-medium">{formatFileSize(exportCache.getConfig().maxSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Entries:</span>
                    <span className="ml-2 font-medium">{exportCache.getConfig().maxEntries}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">TTL:</span>
                    <span className="ml-2 font-medium">{Math.round(exportCache.getConfig().ttl / (1000 * 60 * 60))} hours</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cleanup Interval:</span>
                    <span className="ml-2 font-medium">{Math.round(exportCache.getConfig().cleanupInterval / (1000 * 60))} minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 