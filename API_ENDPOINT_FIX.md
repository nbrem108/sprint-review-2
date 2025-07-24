# API Endpoint Fix

## 🚨 Issue Identified
The frontend was still using the old API endpoints in `route.ts` instead of the new endpoints in the dedicated route directories, causing the wrong summary format to be displayed.

## 📋 API Structure

### **Old Structure (Being Used)**
```
/api/generate-summaries/
  ├── route.ts (old implementation)
  ├── current-sprint/ (new implementation, not being used)
  ├── upcoming-sprint/ (new implementation, not being used)
  └── demo-stories/ (new implementation, not being used)
```

### **Updated Endpoints**
Changed all API calls from:
```diff
- /api/generate-summaries/current-sprint
- /api/generate-summaries/upcoming-sprint
- /api/generate-summaries/demo-stories
+ /api/generate-summaries/current-sprint/route
+ /api/generate-summaries/upcoming-sprint/route
+ /api/generate-summaries/demo-stories/route
```

## 🔧 Changes Made

### **1. Current Sprint Endpoint**
```typescript
const response = await fetch("/api/generate-summaries/current-sprint/route", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sprintName: state.selectedSprint.name,
    sprintStartDate: state.selectedSprint.startDate,
    sprintEndDate: state.selectedSprint.endDate,
    issues: state.issues,
    metrics: state.metrics,
  }),
})
```

### **2. Upcoming Sprint Endpoint**
```typescript
const response = await fetch("/api/generate-summaries/upcoming-sprint/route", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sprintName: state.selectedSprint?.name,
    upcomingSprintName: state.upcomingSprint.name,
    issues: state.issues,
    upcomingIssues: state.upcomingIssues,
  }),
})
```

### **3. Demo Stories Endpoint**
```typescript
const response = await fetch("/api/generate-summaries/demo-stories/route", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sprintName: state.selectedSprint?.name,
    issues: state.issues,
    demoStoryIds: state.demoStories,
  }),
})
```

### **4. Generate All Function**
Updated all endpoints in the parallel generation function:
```typescript
const promises = [
  fetch("/api/generate-summaries/current-sprint/route", ...),
  fetch("/api/generate-summaries/upcoming-sprint/route", ...),
  fetch("/api/generate-summaries/demo-stories/route", ...)
]
```

## ✅ Expected Results

### **Current Sprint Summary**
Will now use the new format with:
- Proper section structure
- Detailed breakdowns
- Professional formatting
- Same structure as upcoming sprint

### **Upcoming Sprint Summary**
Already using the correct format with:
- Sprint Overview
- Key Features & Deliverables
- Success Criteria

### **Demo Stories**
Will use the new endpoint for consistent formatting.

## 🔄 Next Steps

1. **Verify Summaries**
   - Generate new current sprint summary
   - Confirm format matches upcoming sprint
   - Check presentation integration

2. **Clean Up**
   - Once verified, remove old `route.ts`
   - Update any remaining references
   - Update documentation

3. **Monitor**
   - Watch for any errors
   - Gather feedback on format
   - Make adjustments if needed

The frontend is now using the new API endpoints, which should result in consistent, properly formatted summaries across all types. 