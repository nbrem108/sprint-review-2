# Demo Story Text Box Enhancement Task List

## Goal
Add an additional text box to the demo-story slide that includes either a detailed description or the Jira story release note, as shown in the screenshot.

## ✅ Task List

### 1. Verify Data Structure and API Integration
- [x] **1.1** Verify Issue interface in `/lib/jira-types.ts` includes `releaseNotes` field
- [x] **1.2** Check `/lib/jira-api.ts` to ensure release notes are properly fetched from Jira API
- [x] **1.3** Verify `/components/sprint-context.tsx` Issue interface includes releaseNotes field
- [x] **1.4** Test that release notes data is available in the sprint context

### 2. Update Demo Story Slide Layout
- [x] **2.1** Modify `/components/presentation/slide-renderer.tsx` DemoStorySlide component
- [x] **2.2** Add new text box area below the numbered demo points
- [x] **2.3** Position text box with red border/outline as shown in screenshot
- [x] **2.4** Add responsive design for the new text box area
- [x] **2.5** Ensure proper spacing and layout with existing content

### 3. Enhance Content Processing Logic
- [x] **3.1** Update demo story slide content processing in `/components/presentation/slide-renderer.tsx`
- [x] **3.2** Add logic to handle release notes vs detailed description
- [x] **3.3** Implement fallback logic (release notes first, then detailed description)
- [x] **3.4** Add proper text formatting and styling for the text box content
- [x] **3.5** Handle empty/null content gracefully

### 4. Update Presentation Generation
- [x] **4.1** Modify `/components/tabs/presentation-tab.tsx` demo story slide generation
- [x] **4.2** Update slide content structure to include release notes data
- [x] **4.3** Ensure the new text box is populated with correct content
- [x] **4.4** Test that demo story slides include the additional text box

### 5. Styling and UI Enhancement
- [x] **5.1** Add red border/outline styling to match screenshot
- [x] **5.2** Implement proper text box sizing and scroll behavior
- [x] **5.3** Add placeholder text when no content is available
- [x] **5.4** Ensure responsive design works on different screen sizes
- [x] **5.5** Test fullscreen mode compatibility

### 6. Testing and Validation
- [x] **6.1** Test with stories that have release notes
- [x] **6.2** Test with stories that have detailed descriptions but no release notes
- [x] **6.3** Test with stories that have neither release notes nor detailed descriptions
- [x] **6.4** Verify text box appears correctly in presentation mode
- [x] **6.5** Test export functionality with the new text box content

## Dependencies
- Jira API must provide release notes data
- Issue interface must include releaseNotes field
- Demo story slide component must be accessible for modification

## Success Criteria
- [x] Additional text box appears below numbered demo points
- [x] Text box has red border/outline as shown in screenshot
- [x] Text box displays release notes when available
- [x] Text box displays detailed description as fallback
- [x] Text box is properly responsive and styled
- [x] Content is properly formatted and readable
- [x] No breaking changes to existing functionality
- [x] Correct release notes field identified and configured (customfield_10113)

## Progress Summary
- **Completed**: 25/25 tasks (100%)
- **In Progress**: 0 tasks
- **Remaining**: 0 tasks (0%) 