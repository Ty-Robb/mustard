# Chat Visualization Prompting Guide

## Overview

The chat system supports automatic visualization generation through two approaches:
1. **General agents** that can include charts/tables when appropriate
2. **Data Visualization Specialist** agent specifically for creating visualizations

## Getting Visualizations in Your Responses

### Explicit Visualization Requests

To ensure you get a chart or table, use explicit language:

**Good prompts:**
- "Show me a **chart** of the Methodist Church split"
- "Create a **pie chart** showing church attendance by age group"
- "Display a **table** comparing different Bible translations"
- "Generate a **bar graph** of giving trends over the last 5 years"
- "Visualize the budget breakdown with a **chart**"

**Less effective prompts:**
- "Show me the split" (ambiguous - could mean text or visual)
- "Display the data" (unclear format)
- "What are the numbers?" (likely to get text response)

### Using the Data Visualization Specialist

For best results with data visualization:
1. Select the "Data Visualization Specialist" agent
2. Be specific about the type of visualization you want
3. Provide context about what data to visualize

**Example prompts for the specialist:**
- "Create a line chart showing church growth over the past 10 years"
- "Generate a comparison table of different ministry programs"
- "Build a pie chart of our congregation demographics"

### Keywords That Trigger Visualizations

Include these words to increase the likelihood of getting a chart:
- Chart, graph, plot, diagram
- Visualize, illustrate, display visually
- Pie chart, bar chart, line graph, table
- Show graphically, represent visually

## Supported Visualization Types

### Charts
- **Line Chart**: Trends over time, growth patterns
- **Bar Chart**: Comparing categories, survey results
- **Pie/Doughnut Chart**: Parts of a whole, percentages
- **Area Chart**: Cumulative data, stacked comparisons
- **Radar Chart**: Multi-dimensional comparisons
- **Scatter Plot**: Correlations between variables

### Tables
- **Data Tables**: Structured information, lists
- **Comparison Tables**: Side-by-side analysis
- **Schedule Tables**: Event planning, calendars

## Examples

### Example 1: Church Demographics
**Prompt**: "Create a pie chart showing our church membership by age group"
**Result**: Pie chart with age group breakdowns

### Example 2: Financial Trends
**Prompt**: "Show a line chart of our monthly giving for the past year"
**Result**: Line chart with monthly data points

### Example 3: Ministry Comparison
**Prompt**: "Generate a table comparing our different ministry programs including attendance, budget, and volunteer count"
**Result**: Sortable table with program details

## Tips for Better Visualizations

1. **Be Specific**: Mention the exact type of chart you want
2. **Provide Context**: Explain what aspect of the data is important
3. **Use the Right Agent**: The Data Visualization Specialist is optimized for creating charts
4. **Include Time Frames**: For trends, specify the period you're interested in
5. **Mention Comparisons**: If comparing items, state what you want to compare

## Troubleshooting

If you're not getting visualizations:
- Add explicit chart/table keywords to your prompt
- Try the Data Visualization Specialist agent
- Rephrase to clearly request a visual representation
- Include specific chart type in your request

Remember: The AI needs clear signals that you want a visual representation rather than a textual explanation.
