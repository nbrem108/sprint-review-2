### 🧩 RULE 3: Generate a Task List from the Plan
**Trigger**: User confirms the plan.

**Instruction to AI**:
- Translate the confirmed plan into a specific list of actionable tasks.
- Include file paths, function names, or components where work will occur.
- Order tasks logically if dependent.

**Output format**:
```markdown
### ✅ Task List
- [ ] Update `/components/UserProfile.tsx` to support profile images.
- [ ] Modify API in `/app/api/profile/route.ts` to accept new image field.
- [ ] Add validation logic in `/lib/validators/user.ts`.


**Output location**:
/tasks/task_list_name.md
- you will use this to execute and check off as we complete the tasks
