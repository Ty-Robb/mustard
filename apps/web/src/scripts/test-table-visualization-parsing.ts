import { VisualizationParser } from '../lib/utils/visualization-parser';

// Test content with the exact table format from the user's message
const testContent = `
1. Theological Foundations for LGBTQ+ Inclusion

Those who hold an affirming view do so not by discarding Scripture, but by interpreting it through a different lens, often emphasizing themes of love, justice, and the progressive nature of God's revelation.

The Growth of Affirming Views

The acceptance of LGBTQ+ people within Christian communities has grown significantly over the past two decades. This trend is particularly noticeable in the United States and Western Europe, though it is not uniform across all denominations.

Data from the Pew Research Center illustrates this shift among U.S. Christians regarding same-sex marriage.

Source: Pew Research Center data analysis.

This chart shows a clear upward trend in support across major Christian traditions, though the starting points and rates of change differ significantly. Mainline denominations (like Episcopalians, UCC, ELCA) show the highest support, while Evangelical support, though growing, remains a minority position.

3. Practical Issues and Challenges for Churches

This theological debate is not abstract; it creates tangible challenges for pastors and church leaders on the ground. Navigating this issue requires immense pastoral wisdom and care.

Here are some of the key issues that arise:

\`\`\`table
{
  "data": {
    "headers": ["Area of Ministry", "Specific Challenge", "Key Question for Leadership"],
    "rows": [
      [
        "Church Governance & Policy",
        "Revising church bylaws, membership covenants, and statements of faith. Deciding on policies for same-sex weddings and facility use.",
        "Will we be a church that is fully affirming, traditional, or a 'third way' that allows for disagreement? How do we make this decision?"
      ],
      [
        "Denominational Unity",
        "Many denominations (e.g., The United Methodist Church) are facing schism over this issue. Local churches must decide whether to stay or leave.",
        "Is our alignment with our denomination on this issue more important than the unity of our local congregation, or vice versa?"
      ],
      [
        "Pastoral Care & Discipleship",
        "Counseling LGBTQ+ individuals and couples. Ministering to families with differing views. Discipling people in a way that respects their conscience.",
        "How can we provide loving and biblically-grounded care to everyone in our church, regardless of their orientation or theological view?"
      ],
      [
        "Leadership & Volunteering",
        "Determining eligibility for leadership roles. Can an openly gay person serve as a pastor, elder, small group leader, or worship team member?",
        "What are our biblical and theological criteria for leadership, and how do they apply to LGBTQ+ individuals in our congregation?"
      ]
    ]
  }
}
\`\`\`

This is the end of the content.
`;

console.log('Testing table visualization parsing...\n');

// Test if content contains visualization
const hasVisualization = VisualizationParser.containsVisualization(testContent);
console.log('Contains visualization:', hasVisualization);

// Extract visualizations
const visualizations = VisualizationParser.extractVisualizations(testContent);
console.log('\nExtracted visualizations:', visualizations.length);

// Process the response (extract visualizations and clean content)
const { cleanContent, attachments } = VisualizationParser.processResponse(testContent);

console.log('\nAttachments found:', attachments.length);

if (attachments.length > 0) {
  attachments.forEach((attachment, index) => {
    console.log(`\nAttachment ${index + 1}:`);
    console.log('- Type:', attachment.type);
    console.log('- Name:', attachment.name);
    console.log('- Config:', JSON.stringify(attachment.config, null, 2));
    
    if (attachment.type === 'table' && attachment.data) {
      const tableData = attachment.data as any;
      console.log('- Headers:', tableData.headers);
      console.log('- Row count:', tableData.rows?.length || 0);
      if (tableData.rows && tableData.rows.length > 0) {
        console.log('- First row:', tableData.rows[0]);
      }
    }
  });
} else {
  console.log('\nNo attachments found - this might indicate a parsing issue.');
}

console.log('\n--- Clean Content (without visualization blocks) ---');
console.log(cleanContent);
