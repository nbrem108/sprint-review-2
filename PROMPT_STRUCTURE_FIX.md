# Prompt Structure Fix

## 🚨 Issue Identified
The current sprint summary was using a different prompt structure than the upcoming sprint summary, leading to inconsistent formatting in the generated content.

## 📋 Prompt Comparison

### **Upcoming Sprint (Target Format)**
```markdown
Please provide:

1. **Sprint Overview** — Briefly summarize the general nature of the work based solely on the provided issues.
2. **Key Features & Deliverables** — List any feature work, enhancements, or user-facing changes if identifiable.
3. **Success Criteria** — If clear success measures or expected outcomes are evident, summarize them. Otherwise, state "Not specified."
```

### **Current Sprint (Old Format)**
```markdown
Please provide:

1. **Sprint Overview** — Briefly summarize the general nature of the work completed based solely on the provided issues.
2. **Key Features & Deliverables** — List any feature work, enhancements, or user-facing changes that were completed.
3. **Success Criteria** — If clear success measures or expected outcomes were achieved, summarize them. Otherwise, state "Limited progress due to blockers."
```

## ✅ Changes Made

### **1. Section Instructions**
Updated the current sprint prompt to match the upcoming sprint's structure:

**Sprint Overview:**
```diff
- Briefly summarize the general nature of the work completed based solely on the provided issues.
+ Briefly summarize the general nature of the work based solely on the provided issues.
```

**Key Features & Deliverables:**
```diff
- List any feature work, enhancements, or user-facing changes that were completed.
+ List any feature work, enhancements, or user-facing changes if identifiable.
```

**Success Criteria:**
```diff
- If clear success measures or expected outcomes were achieved, summarize them. Otherwise, state "Limited progress due to blockers."
+ If clear success measures or expected outcomes are evident, summarize them. Otherwise, state "Not specified."
```

### **2. Prompt Structure**
Both routes now use identical structure:
```markdown
You are generating a professional sprint [review/planning] summary based on the provided data. Do NOT invent [accomplishments/goals], deliverables, or success criteria that aren't directly inferable from the input.

**Sprint:** [Name]
**[End/Start] Date:** [Date]
**Total Story Points:** [Points]
**Total Issues:** [Count]

**[Completed/Planned] Issues:**
[Issue Details]

Please provide:

1. **Sprint Overview** — Briefly summarize...
2. **Key Features & Deliverables** — List any feature work...
3. **Success Criteria** — If clear success measures...

Format the response as a concise and structured [review/planning] summary suitable for stakeholders and sprint [review/planning] meetings. Avoid adding assumptions or extrapolated information.
```

## 🔄 Expected Results

### **Current Sprint Summary**
Will now generate with:
- Same section structure as upcoming sprint
- Same instruction format
- Same "Not specified" message for no progress
- Same level of detail and formatting

### **Consistency Achieved**
Both summaries will have:
- ✅ **Identical section names**
- ✅ **Identical instruction format**
- ✅ **Identical success criteria messaging**
- ✅ **Identical formatting approach**

## 🔍 Verification Steps

1. **Generate New Summary**
   - Generate a current sprint summary
   - Check section structure matches upcoming sprint
   - Verify "Not specified" message appears correctly

2. **Compare Formats**
   - Check section headers match
   - Verify bullet point formatting
   - Confirm consistent messaging

3. **Check Integration**
   - Verify presentation slide formatting
   - Check epic breakdown display
   - Confirm overall layout consistency

The current sprint summary should now generate in the exact same format as the upcoming sprint summary, just with a focus on completed work instead of planned work. 