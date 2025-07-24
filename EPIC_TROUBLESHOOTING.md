# Epic Information Troubleshooting Guide

## Issue Description
Epic or parent names are not being pulled into presentations consistently.

## Root Causes Identified

### 1. JIRA Field Mapping Issues
- The application was using hardcoded field IDs (`customfield_10011`) that may not match your JIRA instance
- Different JIRA instances use different field IDs for epic information
- Epic information can be stored in multiple different fields depending on JIRA configuration
- **Your JIRA instance appears to have NO standard epic fields configured**

### 2. Incomplete Epic Extraction Logic
- The original extraction logic was overly complex and had fallback issues
- Epic key information was being set to `undefined`
- Parent information fallback wasn't working correctly

### 3. Missing Field Requests
- The API wasn't requesting all possible epic-related fields
- Some JIRA instances use different field names for epic information

## Solutions Implemented

### 1. Enhanced Field Mapping
- Added support for multiple epic field types:
  - `epic` - Direct epic field (most reliable)
  - `customfield_10014` - Epic Link field
  - `customfield_10015` - Epic Name field
  - `customfield_10016` - Epic Status field
  - `customfield_10011` - Epic or Parent Name field (original)
  - `parent` - Parent information fallback
  - **NEW: All custom fields from customfield_10017 to customfield_10040**
  - **NEW: Issue links for epic relationships**

### 2. Improved Extraction Logic
- Enhanced `extractSafeIssue()` function with better fallback logic
- Added proper epic key extraction from epic names
- Improved parent information handling
- **NEW: Comprehensive custom field scanning**
- **NEW: Issue link relationship detection**
- Added debugging information for development

### 3. Better Epic Grouping
- Enhanced `EpicBreakdown` component with improved grouping logic
- Better handling of issues without epic information
- More robust epic key and name extraction

### 4. Debugging Tools
- Added field analysis utility (`analyzeJiraFields`)
- Added debug button in Setup tab
- **NEW: Test Epic Extraction button**
- Enhanced console logging for epic information

## Field Analysis Results

Based on your JIRA instance analysis:
- **Total available fields:** 145
- **Epic-related fields found:** 0 (none)
- **Custom fields available:** Multiple (customfield_10017 through customfield_10040+)

This suggests your JIRA instance either:
1. Doesn't use standard epic fields
2. Uses custom field names for epic information
3. Stores epic relationships in issue links
4. Doesn't have epic functionality enabled

## How to Troubleshoot

### Step 1: Use the Debug Tools
1. Go to the Setup tab
2. Select a project, board, and sprint
3. Load sprint issues
4. Click "Test Epic Extraction" to see current epic data
5. Click "Debug Fields" to analyze available fields

### Step 2: Check Console Output
Look for these debug messages:
- `🔍 Epic debug for [ISSUE-KEY]:` - Shows epic information for each issue
- `🔍 EpicBreakdown - Issues with epic info:` - Shows epic grouping information
- `🔍 JIRA Field Analysis:` - Shows available fields in your JIRA instance
- `🔍 Testing Epic Extraction:` - Shows current epic extraction results

### Step 3: Identify Epic Information Sources
From the field analysis, look for:
- **Custom fields with epic-like values** (long text strings, issue keys)
- **Issue links** that might contain epic relationships
- **Parent-child relationships** in the issue structure
- **Any fields containing "epic", "parent", "theme", or "initiative"**

### Step 4: Manual Field Mapping (if needed)
If epic information is found in unexpected fields, you may need to:
1. Update the field IDs in `lib/jira-types.ts`
2. Update the fields array in `lib/jira-api.ts`
3. Modify the extraction logic in `extractSafeIssue()`

## Alternative Epic Information Sources

Since your JIRA instance doesn't have standard epic fields, consider:

### 1. Issue Links
- Epic relationships might be stored as issue links
- Look for link types containing "epic", "parent", or "child"
- Check if linked issues are of type "Epic"

### 2. Custom Fields
- Epic information might be in custom fields with different names
- Look for fields containing long text descriptions
- Check for fields that might contain initiative or theme information

### 3. Parent-Child Relationships
- Issues might be organized in a parent-child hierarchy
- Parent issues might serve as "epics" for child issues

### 4. Labels or Components
- Epic information might be stored in labels or components
- Check if labels contain epic or theme information

## Testing the Fix

1. **Load a sprint** with issues
2. **Use "Test Epic Extraction"** to see current epic data
3. **Use "Debug Fields"** to analyze available fields
4. **Check console logs** for detailed field information
5. **Generate summaries and presentations** to see if epic information appears

## Expected Results

After the comprehensive fix, you should see:
- Console logs showing field analysis results
- Epic extraction test results showing found/not found issues
- Better understanding of what fields contain epic-like information
- Improved epic grouping in presentations (if epic data is found)

## If No Epic Information is Found

If the analysis shows no epic information is available:

1. **Check JIRA configuration** - Ensure epics are enabled and configured
2. **Verify issue setup** - Ensure issues are properly linked to epics
3. **Consider alternative grouping** - Use components, labels, or other fields for grouping
4. **Manual epic assignment** - Consider adding epic information manually

## Support

If you continue to have issues:
1. Run both debug tools and share the console output
2. Check what fields contain epic-like information in your JIRA instance
3. Verify that issues in your sprint actually have epic information assigned
4. Consider if your JIRA instance uses a different approach for epic management 