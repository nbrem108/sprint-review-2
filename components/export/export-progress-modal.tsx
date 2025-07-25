/**
 * Export Progress Modal
 * Provides real-time progress tracking, quality metrics, and error handling
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Download, 
  RefreshCw,
  FileText,
  Image,
  Settings,
  Clock,
  HardDrive
} from 'lucide-react';
import { ExportProgress, ExportResult, ExportOptions } from '@/lib/export-service';
import { QualityReport } from '@/lib/export-quality-assurance';
import { ExportError } from '@/lib/export-error-handler';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ExportProgress;
  result?: ExportResult;
  qualityReport?: QualityReport;
  error?: ExportError;
  onRetry?: () => void;
  onDownload?: (result: ExportResult) => void;
  options: ExportOptions;
}

export function ExportProgressModal({
  isOpen,
  onClose,
  progress,
  result,
  qualityReport,
  error,
  onRetry,
  onDownload,
  options
}: ExportProgressModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return <Settings className="h-4 w-4" />;
      case 'rendering':
        return <Image className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4" />;
      case 'finalizing':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return 'text-blue-600';
      case 'rendering':
        return 'text-purple-600';
      case 'processing':
        return 'text-orange-600';
      case 'finalizing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 75) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="default" className="bg-red-100 text-red-800">Needs Improvement</Badge>;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {error ? (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Export Failed
              </>
            ) : result ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Export Completed
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                Exporting...
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Section */}
          {!result && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStageIcon(progress.stage)}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${getStageColor(progress.stage)}`}>
                        {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {progress.current}/{progress.total}
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                    <p className="text-sm text-gray-600 mt-2">{progress.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Section */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{error.message}</p>
                  {error.details && (
                    <p className="text-sm opacity-90">{error.details}</p>
                  )}
                  {error.recoverable && onRetry && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onRetry}
                      className="mt-2"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Export
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Section */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Export Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Format:</span>
                    <Badge variant="outline">{result.format.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="font-medium">{formatFileSize(result.fileSize)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Time:</span>
                    <span className="font-medium">{formatTime(result.metadata.processingTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quality:</span>
                    <Badge variant="outline">{result.metadata.quality}</Badge>
                  </div>
                </div>

                {onDownload && (
                  <Button 
                    onClick={() => onDownload(result)} 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {result.fileName}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quality Report Section */}
          {qualityReport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Quality Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Quality Score</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getQualityScoreColor(qualityReport.overallScore)}`}>
                      {qualityReport.overallScore}/100
                    </span>
                    {getQualityScoreBadge(qualityReport.overallScore)}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Visual Fidelity:</span>
                    <span className="ml-2 font-medium">{qualityReport.metrics.visualFidelity}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">File Size:</span>
                    <span className="ml-2 font-medium">{formatFileSize(qualityReport.metrics.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="ml-2 font-medium">{formatTime(qualityReport.metrics.processingTime)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Errors:</span>
                    <span className="ml-2 font-medium">{qualityReport.metrics.errorCount}</span>
                  </div>
                </div>

                {qualityReport.metrics.warnings.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Warnings:</span>
                    <ul className="mt-2 space-y-1">
                      {qualityReport.metrics.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {qualityReport.recommendations.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Recommendations:</span>
                    <ul className="mt-2 space-y-1">
                      {qualityReport.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? 'Hide' : 'Show'} Detailed Report
                </Button>

                {showDetails && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-2">Browser Compatibility</h4>
                      <div className="space-y-2">
                        {qualityReport.metrics.compatibility.map((browser, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{browser.browser}</span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={browser.supported ? "default" : "destructive"}
                                className={browser.supported ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {browser.supported ? 'Supported' : 'Not Supported'}
                              </Badge>
                              {browser.issues.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {browser.issues.length} issue{browser.issues.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Export Options Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Settings</CardTitle>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 