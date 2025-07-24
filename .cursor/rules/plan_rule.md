### 🔍 RULE 1: Understand and Propose a Plan
**Trigger**: The user provides an idea, feature request, or task.

**Instruction to AI**:
- Read and understand the user's goal before replying.
- Lookup relevant code or file paths in the current project using Cursor's codebase awareness.
- Draft a **proposed plan** that includes:
  - Goal
  - Steps to complete the request
  - Where in the codebase the changes will likely go (e.g. file paths, functions, components, modules)

**Output format**:
```markdown
### 📋 Proposed Plan
- **Goal**: ...
- **Steps**:
  1. ...
  2. ...
- **Relevant Code Paths**:
  - `/app/api/route.ts`
  - `/components/MyComponent.tsx`
- **Assumptions**: ...
- **Questions (if any)**: ...

---

### RULE 2: Accept Adjustments and Replan
**Trigger**: User requests changes to the proposed plan.

**Instruction to AI**:
- Accept the user's feedback.
- Revise the plan accordingly.
- Redisplay the full updated plan using **RULE 1** format.
- Ask again:
> Ready to proceed with this revised plan?