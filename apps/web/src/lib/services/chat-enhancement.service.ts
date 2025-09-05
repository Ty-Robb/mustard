/**
 * Chat Enhancement Service
 * Adds biblical references and follow-up suggestions to chat responses
 */

import { ChatMessage } from '@/types/chat';

export interface EnhancedResponse {
  content: string;
  suggestions?: {
    followUpQuestions?: string[];
    actionChoices?: {
      label: string;
      action: string;
    }[];
    relatedTopics?: string[];
  };
  biblicalReferences?: {
    verse: string;
    text: string;
    relevance: string;
  }[];
}

export class ChatEnhancementService {
  /**
   * Enhance a chat response with biblical references and suggestions
   */
  async enhanceResponse(
    userMessage: string,
    assistantResponse: string,
    agentId?: string
  ): Promise<EnhancedResponse> {
    // Analyze the topic to determine relevant enhancements
    const topic = this.analyzeTopic(userMessage);
    
    // Add biblical references based on topic
    const biblicalReferences = this.getBiblicalReferences(topic, userMessage);
    
    // Generate follow-up suggestions
    const suggestions = this.generateSuggestions(topic, userMessage, assistantResponse);
    
    // For simple guidance questions, provide direct biblical answers
    if (this.isSimpleGuidanceQuestion(userMessage)) {
      const enhancedContent = this.addBiblicalContext(assistantResponse, biblicalReferences);
      return {
        content: enhancedContent,
        suggestions,
        biblicalReferences
      };
    }
    
    return {
      content: assistantResponse,
      suggestions,
      biblicalReferences
    };
  }

  /**
   * Analyze the topic of the user's message
   */
  private analyzeTopic(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Prayer-related topics
    if (lowerMessage.includes('pray') || lowerMessage.includes('prayer')) {
      return 'prayer';
    }
    
    // Anxiety and worry
    if (lowerMessage.includes('anxiety') || lowerMessage.includes('worry') || lowerMessage.includes('stress')) {
      return 'anxiety';
    }
    
    // Forgiveness
    if (lowerMessage.includes('forgive') || lowerMessage.includes('forgiveness')) {
      return 'forgiveness';
    }
    
    // Family and relationships
    if (lowerMessage.includes('marriage') || lowerMessage.includes('spouse') || lowerMessage.includes('husband') || lowerMessage.includes('wife')) {
      return 'marriage';
    }
    
    if (lowerMessage.includes('child') || lowerMessage.includes('parent') || lowerMessage.includes('family')) {
      return 'family';
    }
    
    // Faith and doubt
    if (lowerMessage.includes('faith') || lowerMessage.includes('believe') || lowerMessage.includes('doubt')) {
      return 'faith';
    }
    
    // Work and purpose
    if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
      return 'work';
    }
    
    if (lowerMessage.includes('purpose') || lowerMessage.includes('calling') || lowerMessage.includes('meaning')) {
      return 'purpose';
    }
    
    // Biblical figures
    if (lowerMessage.includes('moses') || lowerMessage.includes('abraham') || lowerMessage.includes('david') || 
        lowerMessage.includes('jesus') || lowerMessage.includes('paul') || lowerMessage.includes('mary')) {
      return 'biblical-figure';
    }
    
    // Bible study
    if (lowerMessage.includes('bible') || lowerMessage.includes('scripture') || lowerMessage.includes('verse')) {
      return 'bible-study';
    }
    
    return 'general';
  }

  /**
   * Get relevant biblical references for the topic
   */
  private getBiblicalReferences(topic: string, message: string): any[] {
    const references: Record<string, any[]> = {
      prayer: [
        {
          verse: 'Philippians 4:6',
          text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
          relevance: 'Encouragement to bring all concerns to God in prayer'
        },
        {
          verse: 'Matthew 6:9-13',
          text: 'This, then, is how you should pray: "Our Father in heaven, hallowed be your name..."',
          relevance: 'Jesus teaches the model prayer'
        },
        {
          verse: '1 Thessalonians 5:17',
          text: 'Pray continually',
          relevance: 'The importance of constant communication with God'
        }
      ],
      anxiety: [
        {
          verse: 'Philippians 4:6-7',
          text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
          relevance: 'God\'s promise of peace in exchange for our anxieties'
        },
        {
          verse: '1 Peter 5:7',
          text: 'Cast all your anxiety on him because he cares for you.',
          relevance: 'God invites us to give Him our worries'
        },
        {
          verse: 'Matthew 6:25-26',
          text: 'Therefore I tell you, do not worry about your life, what you will eat or drink; or about your body, what you will wear... Look at the birds of the air; they do not sow or reap or store away in barns, and yet your heavenly Father feeds them.',
          relevance: 'Jesus teaches about God\'s provision'
        }
      ],
      forgiveness: [
        {
          verse: 'Ephesians 4:32',
          text: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',
          relevance: 'We forgive because God first forgave us'
        },
        {
          verse: 'Matthew 6:14-15',
          text: 'For if you forgive other people when they sin against you, your heavenly Father will also forgive you. But if you do not forgive others their sins, your Father will not forgive your sins.',
          relevance: 'The importance of forgiving others'
        },
        {
          verse: 'Colossians 3:13',
          text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.',
          relevance: 'Forgiveness as a reflection of God\'s forgiveness'
        }
      ],
      marriage: [
        {
          verse: 'Ephesians 5:25',
          text: 'Husbands, love your wives, just as Christ loved the church and gave himself up for her',
          relevance: 'Sacrificial love in marriage'
        },
        {
          verse: 'Genesis 2:24',
          text: 'That is why a man leaves his father and mother and is united to his wife, and they become one flesh.',
          relevance: 'God\'s design for marriage'
        },
        {
          verse: '1 Corinthians 13:4-7',
          text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud...',
          relevance: 'The characteristics of true love'
        }
      ],
      family: [
        {
          verse: 'Proverbs 22:6',
          text: 'Start children off on the way they should go, and even when they are old they will not turn from it.',
          relevance: 'The importance of godly parenting'
        },
        {
          verse: 'Ephesians 6:1-3',
          text: 'Children, obey your parents in the Lord, for this is right. "Honor your father and mother"—which is the first commandment with a promise—"so that it may go well with you and that you may enjoy long life on the earth."',
          relevance: 'God\'s design for family relationships'
        },
        {
          verse: 'Psalm 127:3',
          text: 'Children are a heritage from the Lord, offspring a reward from him.',
          relevance: 'Children as God\'s blessing'
        }
      ],
      faith: [
        {
          verse: 'Hebrews 11:1',
          text: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
          relevance: 'The definition of faith'
        },
        {
          verse: 'Mark 9:24',
          text: 'Immediately the boy\'s father exclaimed, "I do believe; help me overcome my unbelief!"',
          relevance: 'God understands our struggles with faith'
        },
        {
          verse: 'Romans 10:17',
          text: 'Consequently, faith comes from hearing the message, and the message is heard through the word about Christ.',
          relevance: 'How faith grows'
        }
      ],
      work: [
        {
          verse: 'Colossians 3:23-24',
          text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward.',
          relevance: 'Working as unto the Lord'
        },
        {
          verse: 'Proverbs 16:3',
          text: 'Commit to the Lord whatever you do, and he will establish your plans.',
          relevance: 'Trusting God with our work'
        },
        {
          verse: '2 Thessalonians 3:10',
          text: 'For even when we were with you, we gave you this rule: "The one who is unwilling to work shall not eat."',
          relevance: 'The value of honest work'
        }
      ],
      purpose: [
        {
          verse: 'Jeremiah 29:11',
          text: 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future.',
          relevance: 'God has a purpose for your life'
        },
        {
          verse: 'Romans 8:28',
          text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
          relevance: 'God works all things for our good'
        },
        {
          verse: 'Ephesians 2:10',
          text: 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.',
          relevance: 'We are created for a purpose'
        }
      ],
      'biblical-figure': [
        {
          verse: 'Hebrews 11:1-40',
          text: 'The Hall of Faith chapter',
          relevance: 'Examples of faith from biblical heroes'
        }
      ],
      'bible-study': [
        {
          verse: '2 Timothy 3:16-17',
          text: 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.',
          relevance: 'The purpose and power of Scripture'
        },
        {
          verse: 'Psalm 119:105',
          text: 'Your word is a lamp for my feet, a light on my path.',
          relevance: 'God\'s word guides our way'
        }
      ],
      general: [
        {
          verse: 'Proverbs 3:5-6',
          text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
          relevance: 'Trusting God in all areas of life'
        }
      ]
    };

    return references[topic] || references.general;
  }

  /**
   * Generate follow-up suggestions based on the conversation
   */
  private generateSuggestions(topic: string, userMessage: string, response: string): any {
    const suggestions: Record<string, any> = {
      prayer: {
        followUpQuestions: [
          'What specific areas of my life need more prayer?',
          'How can I develop a consistent prayer routine?',
          'What are different types of prayer in the Bible?',
          'How do I know if God is answering my prayers?'
        ]
      },
      anxiety: {
        followUpQuestions: [
          'What are practical steps to overcome anxiety?',
          'How can I trust God with my worries?',
          'What does the Bible say about peace?',
          'Can you help me create a prayer for anxiety?'
        ]
      },
      forgiveness: {
        followUpQuestions: [
          'How do I forgive someone who keeps hurting me?',
          'What if I don\'t feel like forgiving?',
          'How do I know if I\'ve truly forgiven someone?',
          'What about forgiving myself?'
        ]
      },
      marriage: {
        followUpQuestions: [
          'How can I improve communication in my marriage?',
          'What does biblical submission mean?',
          'How do we resolve conflicts God\'s way?',
          'Can you suggest marriage devotions?'
        ]
      },
      family: {
        followUpQuestions: [
          'How do I teach my children about God?',
          'What are biblical discipline principles?',
          'How can we have family devotions?',
          'Dealing with rebellious teenagers?'
        ]
      },
      faith: {
        followUpQuestions: [
          'How can I grow stronger in my faith?',
          'What do I do when I have doubts?',
          'How do I hear from God?',
          'What are spiritual disciplines?'
        ]
      },
      work: {
        followUpQuestions: [
          'How do I find God\'s calling for my career?',
          'Dealing with difficult coworkers biblically?',
          'Should Christians be ambitious?',
          'How to maintain integrity at work?'
        ]
      },
      purpose: {
        followUpQuestions: [
          'How do I discover my spiritual gifts?',
          'What if I feel stuck in life?',
          'How do I know God\'s will?',
          'Finding meaning in everyday tasks?'
        ]
      },
      'biblical-figure': {
        followUpQuestions: [
          'What can I learn from their life?',
          'How did they overcome challenges?',
          'What were their strengths and weaknesses?',
          'How can I apply their example today?'
        ]
      },
      'bible-study': {
        followUpQuestions: [
          'How do I start studying the Bible?',
          'What Bible translation should I use?',
          'Can you explain this passage?',
          'Create a reading plan for me?'
        ]
      },
      general: {
        followUpQuestions: [
          'Tell me more about this topic',
          'What does the Bible say about this?',
          'How can I apply this to my life?',
          'Can you provide more examples?'
        ]
      }
    };

    return suggestions[topic] || suggestions.general;
  }

  /**
   * Check if this is a simple guidance question
   */
  private isSimpleGuidanceQuestion(message: string): boolean {
    const simplePatterns = [
      /^who (was|is)/i,
      /^what (is|are|was|were)/i,
      /^when (did|was|is)/i,
      /^where (is|was|did)/i,
      /^tell me about/i,
      /^explain/i
    ];

    return simplePatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Add biblical context to the response
   */
  private addBiblicalContext(response: string, biblicalReferences: any[]): string {
    if (!biblicalReferences || biblicalReferences.length === 0) {
      return response;
    }

    // Add a biblical perspective section
    let enhancedResponse = response + '\n\n**Biblical Perspective:**\n\n';
    
    biblicalReferences.forEach((ref, index) => {
      enhancedResponse += `${index + 1}. **${ref.verse}** - "${ref.text}"\n   *${ref.relevance}*\n\n`;
    });

    return enhancedResponse;
  }

  /**
   * Format the enhanced response for the chat
   */
  formatEnhancedMessage(message: ChatMessage, enhancement: EnhancedResponse): ChatMessage {
    return {
      ...message,
      content: enhancement.content,
      metadata: {
        ...message.metadata,
        suggestions: enhancement.suggestions,
        biblicalReferences: enhancement.biblicalReferences
      }
    };
  }
}

// Export singleton instance
export const chatEnhancementService = new ChatEnhancementService();
