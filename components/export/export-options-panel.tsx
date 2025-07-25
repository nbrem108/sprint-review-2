/**
 * Export Options Panel
 * Provides comprehensive export configuration with quality presets and format-specific options
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  FileText, 
  Image, 
  Download, 
  Zap, 
  Shield, 
  Palette,
  Monitor,
  Smartphone,
  Globe,
  Info,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  Clock,
  RefreshCw
} from 'lucide-react';
import { ExportOptions } from '@/lib/export-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExportOptionsPanelProps {
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onExport: () => void;
  isExporting: boolean;
  estimatedFileSize?: number;
  estimatedTime?: number;
}

interface QualityPreset {
  id: string;
  name: string;
  description: string;
  quality: 'low' | 'medium' | 'high';
  compression: boolean;
  includeImages: boolean;
  interactive: boolean;
  icon: React.ReactNode;
  color: string;
}

const qualityPresets: QualityPreset[] = [
  {
    id: 'fast',
    name: 'Fast Export',
    description: 'Quick export with reduced quality for preview',
    quality: 'low',
    compression: true,
    includeImages: false,
    interactive: false,
    icon: <Zap className="h-4 w-4" />,
    color: 'text-orange-600'
  },
  {
    id: 'standard',
    name: 'Standard Quality',
    description: 'Balanced quality and file size',
    quality: 'medium',
    compression: true,
    includeImages: true,
    interactive: true,
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600'
  },
  {
    id: 'high',
    name: 'High Quality',
    description: 'Best quality for professional use',
    quality: 'high',
    compression: false,
    includeImages: true,
    interactive: true,
    icon: <Shield className="h-4 w-4" />,
    color: 'text-blue-600'
  },
  {
    id: 'web',
    name: 'Web Optimized',
    description: 'Optimized for web sharing and embedding',
    quality: 'medium',
    compression: true,
    includeImages: true,
    interactive: true,
    icon: <Globe className="h-4 w-4" />,
    color: 'text-purple-600'
  }
];

const formatOptions = [
  { value: 'pdf', label: 'PDF Document', description: 'Portable Document Format', icon: <FileText className="h-4 w-4" /> },
  { value: 'html', label: 'HTML Web Page', description: 'Interactive web page', icon: <Monitor className="h-4 w-4" /> },
  { value: 'markdown', label: 'Markdown Text', description: 'Plain text with formatting', icon: <FileText className="h-4 w-4" /> },
  { value: 'executive', label: 'Executive Summary', description: 'Professional executive report', icon: <Shield className="h-4 w-4" /> }
];

export function ExportOptionsPanel({
  options,
  onOptionsChange,
  onExport,
  isExporting,
  estimatedFileSize,
  estimatedTime
}: ExportOptionsPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyPreset = (preset: QualityPreset) => {
    setSelectedPreset(preset.id);
    onOptionsChange({
      ...options,
      quality: preset.quality,
      compression: preset.compression,
      includeImages: preset.includeImages,
      interactive: preset.interactive
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Calculating...';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const getFormatSpecificOptions = () => {
    switch (options.format) {
      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pdf-compression" className="text-sm">PDF Compression</Label>
              <Switch
                id="pdf-compression"
                checked={options.compression}
                onCheckedChange={(checked) => onOptionsChange({ ...options, compression: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pdf-images" className="text-sm">Include Images</Label>
              <Switch
                id="pdf-images"
                checked={options.includeImages}
                onCheckedChange={(checked) => onOptionsChange({ ...options, includeImages: checked })}
              />
            </div>
          </div>
        );
      
      case 'html':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="html-interactive" className="text-sm">Interactive Elements</Label>
              <Switch
                id="html-interactive"
                checked={options.interactive}
                onCheckedChange={(checked) => onOptionsChange({ ...options, interactive: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="html-images" className="text-sm">Embed Images</Label>
              <Switch
                id="html-images"
                checked={options.includeImages}
                onCheckedChange={(checked) => onOptionsChange({ ...options, includeImages: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="html-responsive" className="text-sm">Responsive Design</Label>
              <Switch
                id="html-responsive"
                checked={true}
                disabled
              />
            </div>
          </div>
        );
      
      case 'markdown':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="markdown-metadata" className="text-sm">Include Metadata</Label>
              <Switch
                id="markdown-metadata"
                checked={true}
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="markdown-structure" className="text-sm">Structured Format</Label>
              <Switch
                id="markdown-structure"
                checked={true}
                disabled
              />
            </div>
          </div>
        );
      
      case 'executive':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="executive-metrics" className="text-sm">Enhanced Metrics</Label>
              <Switch
                id="executive-metrics"
                checked={true}
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="executive-branding" className="text-sm">Professional Branding</Label>
              <Switch
                id="executive-branding"
                checked={true}
                disabled
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select
              value={options.format}
              onValueChange={(value) => onOptionsChange({ ...options, format: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex items-center gap-2">
                      {format.icon}
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Quality Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quality Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {qualityPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="h-auto p-3 flex flex-col items-start gap-2"
                >
                  <div className={`flex items-center gap-1 ${preset.color}`}>
                    {preset.icon}
                    <span className="text-xs font-medium">{preset.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 text-left">{preset.description}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quality Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Quality Level</Label>
              <Badge variant="outline">{options.quality || 'medium'}</Badge>
            </div>
            <Slider
              value={[options.quality === 'low' ? 0 : options.quality === 'high' ? 2 : 1]}
              onValueChange={([value]) => {
                const quality = value === 0 ? 'low' : value === 2 ? 'high' : 'medium';
                onOptionsChange({ ...options, quality });
              }}
              max={2}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fast</span>
              <span>Balanced</span>
              <span>High Quality</span>
            </div>
          </div>

          <Separator />

          {/* Format-Specific Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format Options</Label>
            {getFormatSpecificOptions()}
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">Advanced Options</span>
              <Settings className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </Button>
            
            {showAdvanced && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="advanced-compression" className="text-sm">Compression</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reduce file size with compression</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="advanced-compression"
                    checked={options.compression}
                    onCheckedChange={(checked) => onOptionsChange({ ...options, compression: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="advanced-interactive" className="text-sm">Interactive Elements</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Include interactive charts and navigation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="advanced-interactive"
                    checked={options.interactive}
                    onCheckedChange={(checked) => onOptionsChange({ ...options, interactive: checked })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Export Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Preview</Label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-600">File Size</div>
                  <div className="font-medium">{formatFileSize(estimatedFileSize)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-600">Est. Time</div>
                  <div className="font-medium">{formatTime(estimatedTime)}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Button */}
          <Button
            onClick={onExport}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {options.format.toUpperCase()}
              </>
            )}
          </Button>

          {/* Format Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Tip:</strong> {options.format === 'pdf' && 'PDF is best for printing and sharing'}
                {options.format === 'html' && 'HTML maintains interactivity and can be embedded'}
                {options.format === 'markdown' && 'Markdown is perfect for documentation and RAG systems'}
                {options.format === 'executive' && 'Executive format is optimized for stakeholder presentations'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 