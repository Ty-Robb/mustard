import { getDatabase } from '../lib/mongodb';
import { VisualizationParser } from '@/lib/utils/visualization-parser';

async function testChatVisualizationDebug() {
  console.log('=== Chat Visualization Debug Test ===\n');

  try {
    // Connect to MongoDB
    const db = await getDatabase();
    const sessionsCollection = db.collection('chat_sessions');
    const messagesCollection = db.collection('chat_messages');

    // Find the most recent session
    const recentSession = await sessionsCollection.findOne(
      {},
      { sort: { updatedAt: -1 } }
    );

    if (!recentSession) {
      console.log('No sessions found');
      return;
    }

    console.log('Recent session:', {
      id: recentSession._id,
      title: recentSession.title,
      agentId: recentSession.metadata?.agentId,
      updatedAt: recentSession.updatedAt
    });

    // Find messages for this session
    const messages = await messagesCollection
      .find({ sessionId: recentSession._id.toString() })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(`\nFound ${messages.length} messages in session`);

    // Check each message for attachments
    for (const message of messages) {
      console.log(`\nMessage ${message._id}:`);
      console.log(`- Role: ${message.role}`);
      console.log(`- Content length: ${message.content.length}`);
      console.log(`- Has metadata: ${!!message.metadata}`);
      console.log(`- Has attachments: ${!!message.metadata?.attachments}`);
      
      if (message.metadata?.attachments) {
        console.log(`- Attachments count: ${message.metadata.attachments.length}`);
        for (const attachment of message.metadata.attachments) {
          console.log(`  - ${attachment.type}: ${attachment.id}`);
          console.log(`    Has data: ${!!attachment.data}`);
          console.log(`    Has config: ${!!attachment.config}`);
          if (attachment.type === 'chart') {
            console.log(`    Chart type: ${attachment.config?.type}`);
            console.log(`    Data points: ${attachment.data?.datasets?.[0]?.data?.length || 0}`);
          }
        }
      }

      // Test parsing the message content
      if (message.role === 'assistant') {
        console.log('\nTesting visualization parser on this message...');
        const result = VisualizationParser.processResponse(message.content);
        console.log(`- Clean text length: ${result.cleanContent.length}`);
        console.log(`- Attachments found: ${result.attachments.length}`);
        if (result.attachments.length > 0) {
          console.log('- Parsed attachments:');
          for (const att of result.attachments) {
            console.log(`  - ${att.type}: ${att.id}`);
          }
        }
      }
    }

    // Find a message with visualization content
    console.log('\n=== Looking for visualization blocks in content ===');
    for (const message of messages) {
      if (message.role === 'assistant') {
        const hasChartBlock = message.content.includes('```chart');
        const hasTableBlock = message.content.includes('```table');
        
        if (hasChartBlock || hasTableBlock) {
          console.log(`\nMessage ${message._id} contains visualization blocks:`);
          console.log(`- Has chart block: ${hasChartBlock}`);
          console.log(`- Has table block: ${hasTableBlock}`);
          
          // Extract and show the visualization blocks
          const chartMatches = message.content.match(/```chart\n([\s\S]*?)```/g);
          const tableMatches = message.content.match(/```table\n([\s\S]*?)```/g);
          
          if (chartMatches) {
            console.log(`- Found ${chartMatches.length} chart block(s)`);
          }
          if (tableMatches) {
            console.log(`- Found ${tableMatches.length} table block(s)`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testChatVisualizationDebug();
