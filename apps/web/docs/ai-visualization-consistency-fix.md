# AI Visualization Auto-Generation Consistency Fix

## Issue
AI agents were not consistently generating bar charts and other visualizations when they should have been automatically included in responses containing statistics, percentages, or comparisons.

## Root Cause
The system prompts for AI agents had visualization instructions, but they weren't explicit enough about when to trigger visualization generation. The AI would sometimes miss opportunities to include charts when mentioning percentages or comparative data.

## Solution
Updated the system prompts for key AI agents (`general-assistant` and `essay-writer`) to include more explicit and comprehensive visualization rules.

### Key Changes

1. **Explicit Trigger Rules**
   - Added a "CRITICAL VISUALIZATION RULES" section that the AI MUST follow
   - Listed specific triggers that require visualizations:
     - Any percentage (e.g., "92% Christian") → Use pie/bar chart
     - Multiple numbers being compared → Use bar chart
     - Changes over time → Use line chart
     - Lists of items with values → Use table or bar chart
     - Comparisons between groups → Use table or bar chart
     - Budget/financial breakdowns → Use pie chart
     - Rankings or ordered lists → Use bar chart or table

2. **Keyword Scanning**
   - Instructed AI to SCAN responses for trigger words/phrases:
     - "percentage", "%", "percent"
     - "compared to", "versus", "vs", "comparison"
     - "breakdown", "distribution", "split"
     - "over time", "trend", "growth", "decline"
     - "ranking", "top", "highest", "lowest"
     - Numbers with categories (e.g., "3 types", "5 groups")
     - "statistics", "data", "survey", "study" (for essay-writer)

3. **Concrete Examples**
   - Provided specific examples showing exactly when and how to generate visualizations
   - Example: "If you mention '92% Christian population', you MUST include [pie chart visualization]"

4. **Color Format Fix**
   - Ensured all visualizations use solid hex colors (e.g., `#3b82f6`) instead of rgba colors
   - This prevents rendering issues that were previously fixed in the visualization-fallback.ts

## Updated Agents

### general-assistant
- Enhanced with explicit visualization rules for general ministry questions
- Will now automatically generate charts when discussing statistics or comparisons

### essay-writer
- Updated with the same explicit rules for theological essays and sermons
- Added specific triggers for essay-type content like "statistics", "data", "survey", "study"

## Expected Behavior
When an AI agent mentions any of the following, it will now automatically include the appropriate visualization:
- Percentages: "92% of churches..." → Pie chart
- Comparisons: "Youth attendance vs adult attendance" → Bar chart
- Trends: "Church growth over the past 5 years" → Line chart
- Lists with values: "Top 5 ministries by budget" → Bar chart or table
- Structured data: "Comparison of theological positions" → Table

## Testing
To verify the fix:
1. Ask questions that include statistical information
2. Request comparisons between groups or categories
3. Ask about trends or changes over time
4. The AI should now consistently include appropriate visualizations

## Technical Details
- File modified: `src/lib/services/vertex-ai.service.ts`
- Agents updated: `general-assistant`, `essay-writer`
- Visualization formats remain unchanged (chart and table JSON blocks)
- Color format standardized to hex values for consistent rendering
