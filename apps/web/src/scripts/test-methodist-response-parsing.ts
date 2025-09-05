import { VisualizationParser } from '../lib/utils/visualization-parser';

const methodistResponse = `Of course. Navigating the recent division within The United Methodist Church is a painful and complex process for many leaders, congregations, and families. Here is a clear, practical, and faith-informed breakdown of the schism.

Executive Summary: The Split at a Glance
The recent division within The United Methodist Church (UMC) is a formal separation primarily driven by decades of disagreement over theology and biblical interpretation, specifically concerning human sexuality—the ordination of LGBTQ+ clergy and the performance of same-sex marriages.

The Two Main Groups: The division has resulted in the original United Methodist Church (UMC) and a new, more theologically conservative denomination, the Global Methodist Church (GMC).
The Mechanism: The separation occurred through a temporary provision in the UMC's rulebook (the Book of Discipline) known as Paragraph 2553. This provision allowed local churches to "disaffiliate" from the UMC for reasons of conscience and keep their property, provided they met certain financial and procedural requirements. This disaffiliation window officially closed on December 31, 2023.
1. The Core Theological Divide: The "Why"
At its heart, the disagreement is about the authority and interpretation of Scripture as it relates to ministry and human relationships.

| Traditionalist / Conservative View (Now primarily the GMC) | Progressive / Centrist View (Now primarily the UMC) | | :--- | :--- | | Biblical Interpretation: Upholds a traditional reading of Scripture, believing that homosexual practice is "incompatible with Christian teaching." | Biblical Interpretation: Emphasizes themes of love, justice, and radical inclusion, believing the Holy Spirit is leading the church to a new, more inclusive understanding. | | Marriage: Defines marriage exclusively as a covenant between one man and one woman. | Marriage: Seeks to allow for the celebration of same-sex marriages by UMC clergy and in UMC churches. | | Ordination: Believes the standards for ordination should exclude "self-avowed practicing homosexuals." | Ordination: Advocates for the full inclusion and ordination of qualified LGBTQ+ candidates for ministry. | | Authority: Places a high value on the unified teaching of the global church and the Book of Discipline as it has historically stood. | Authority: Places a high value on contextual ministry and allowing for regional or individual conscience to guide practice. |

This wasn't a new debate. It reached a breaking point at the 2019 Special Session of the General Conference. At that conference, a "Traditional Plan" was narrowly approved, strengthening the church's prohibitions. Instead of creating unity, this action solidified the divisions and convinced many that a formal separation was the only path forward.

2. The Process of Separation: The "How"
The separation wasn't a top-down decree but a church-by-church process.

Paragraph 2553 ("The Exit Ramp"): This provision was created to provide a legal and procedural path for churches to leave. It was a temporary measure.
Requirements for Disaffiliation: A local church had to:
Hold a formal "Church Conference" where all professing members could vote.
Achieve a two-thirds majority vote in favor of disaffiliation.
Pay two years of "apportionments" (the local church's share of denominational costs).
Pay its share of unfunded clergy pension liabilities.
The Deadline: The final day for a disaffiliation to be ratified by its regional "Annual Conference" was December 31, 2023. Now that this date has passed, this specific "exit ramp" is closed.
As of the end of 2023, approximately 7,600 churches in the United States (about 25% of the total) voted to disaffiliate. Most of these have joined or are exploring joining the Global Methodist Church.

3. The New Denominational Landscape: The "Who"
| The United Methodist Church (UMC) | The Global Methodist Church (GMC) | | :--- | :--- | | Who They Are: The "continuing" UMC. It remains a large, global denomination. | Who They Are: The new denomination, officially launched on May 1, 2022. Formed by the Wesleyan Covenant Association (WCA) and other theologically conservative groups. | | Theological Stance: While the restrictive language is still technically in the Book of Discipline, it is widely expected to be removed or revised at the upcoming 2024 General Conference. The UMC is moving in a more centrist-to-progressive direction, allowing for diverse practices on sexuality by region. | Theological Stance: Explicitly traditionalist on marriage and sexuality. Its Transitional Book of Doctrines and Discipline states that marriage is between a man and a woman and that clergy are expected to adhere to this teaching. | | Structure & Governance: Retains its current structure of bishops and a large global bureaucracy, though this may be streamlined in the future. | Structure & Governance: Designed to be a "leaner" denomination with less bureaucracy, more accountability, and more authority given to the local church. Bishops serve limited terms and have less administrative power. |

Practical and Pastoral Implications for Church Workers
This season has been marked by deep grief, broken relationships, and difficult decisions. As you minister in this context, consider the following:

Acknowledge the Grief: Whether your church stayed or left, there has been a loss. People have lost friends, a sense of stability, and the church family they once knew. Create space for lament and honest conversation.
Focus on Your Local Mission: The division can be an all-consuming distraction. The most faithful response is to refocus your congregation on its unique, God-given mission to its local community. The Great Commission has not been rescinded.
Communicate with Clarity and Grace: Be clear about where your church has landed and why. Avoid demonizing those who made a different choice. Model a spirit of "in essentials, unity; in non-essentials, liberty; in all things, charity."
Re-cast Vision: This is a moment of reset. It's an opportunity to ask foundational questions: "Who are we now?" and "What is God calling us to do next?" Use this moment to build a new sense of identity and purpose. 5s. Lean on the Sovereignty of God: Denominations are human structures. While we grieve their brokenness, our ultimate hope is not in a denominational brand but in Jesus Christ, the head of the Church. God is still at work, building His kingdom through His faithful people, regardless of their sign.`;

console.log('Testing Methodist response parsing...\n');

// Check if response contains visualization
const containsViz = VisualizationParser.containsVisualization(methodistResponse);
console.log('Contains visualization:', containsViz);

// Try to extract visualizations
const visualizations = VisualizationParser.extractVisualizations(methodistResponse);
console.log('Extracted visualizations:', visualizations.length);

// Process the response
const processed = VisualizationParser.processResponse(methodistResponse);
console.log('\nProcessed response:');
console.log('- Clean content length:', processed.cleanContent.length);
console.log('- Attachments:', processed.attachments.length);

// Check if the response should have visualizations added
const shouldAdd = VisualizationParser.shouldAddVisualization(methodistResponse);
console.log('\nShould add visualization:', shouldAdd);

// Suggest visualization type
const suggestedType = VisualizationParser.suggestVisualizationType(methodistResponse);
console.log('Suggested visualization type:', suggestedType);

// The response has tables in markdown format, let's check if we can detect them
const hasMarkdownTables = methodistResponse.includes('|');
console.log('\nHas markdown tables:', hasMarkdownTables);

// Count markdown tables
const tableMatches = methodistResponse.match(/\|[^|]+\|/g);
console.log('Number of markdown table rows:', tableMatches ? tableMatches.length : 0);
