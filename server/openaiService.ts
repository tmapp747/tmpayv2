/**
 * OpenAI Service for TMPay Support Assistant
 * 
 * This service provides integration with OpenAI's API for the support chatbot
 * functionality, allowing users to get intelligent responses to their questions.
 * It securely leverages codebase knowledge while respecting privacy boundaries.
 */

import OpenAI from 'openai';
import { NextFunction, Request, Response } from 'express';
import type { ChatCompletionMessageParam } from 'openai/resources';

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define allowed knowledge domains to prevent exposure of sensitive information
const ALLOWED_KNOWLEDGE_DOMAINS = [
  'payment processing',
  'gcash integration',
  'manual payments',
  'casino transfers',
  'account management',
  'transaction statuses',
  'deposit methods',
  'withdrawal methods',
  'security practices',
  'cryptocurrency',
  'fiat currency',
  'user interface',
  'error resolution',
  'contact support'
];

// Define protected information categories that must not be exposed
const PROTECTED_INFORMATION = [
  'API credentials',
  'database connections',
  'private keys',
  'environment variables',
  'security tokens',
  'user passwords',
  'encryption keys',
  'webhook secrets',
  'admin credentials',
  'server configurations',
  'IP addresses',
  'internal URLs'
];

/**
 * Handle chat completion requests through OpenAI API
 * 
 * @param messages An array of messages representing the conversation history
 * @returns The AI-generated response
 */
export async function getAIChatResponse(messages: ChatCompletionMessageParam[]) {
  try {
    // Create a system message for context if not already provided
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: `You are a knowledgeable support assistant for TMPay, a casino e-wallet platform.
Your goal is to help users with any questions related to deposits, withdrawals, account management,
and casino transfers. Be concise, accurate, and helpful. For technical issues or account-specific
problems, suggest users contact their manager or customer support. 

SECURITY NOTICE:
- Never share API keys, database credentials, private keys, or internal implementation details
- Do not discuss internal system architecture in technical detail
- Never provide information that could compromise system security
- Do not share information about administrative interfaces or secret endpoints

Always maintain a professional and friendly tone. Current date: ${new Date().toLocaleDateString()}`
      } as ChatCompletionMessageParam);
    }

    // Make request to OpenAI API 
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      success: true,
      response: completion.choices[0].message,
      usage: completion.usage,
    };
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    return {
      success: false,
      error: error.message || 'Error communicating with AI service',
      details: error.response?.data || {},
    };
  }
}

/**
 * Middleware to check if the OpenAI API key is configured
 */
export function requireOpenAIKey(req: Request, res: Response, next: NextFunction) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'AI support services are currently unavailable. Please try again later or contact customer support.'
    });
  }
  next();
}

/**
 * Securely check if a user query might request protected information
 * This prevents accidental exposure of sensitive details
 * 
 * @param query The user's query to analyze
 * @returns Boolean indicating if query appears to request protected info
 */
function containsProtectedInfoRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for keywords suggesting requests for sensitive info
  const sensitivePatterns = [
    /\bapi\s*key/i,
    /\btoken/i,
    /\bcredential/i,
    /\bpassword/i,
    /\bsecret/i,
    /\bdatabase\s*connection/i,
    /\bapi\s*endpoint/i,
    /\bserver\s*address/i,
    /\badmin\s*access/i,
    /\binternal\s*url/i,
    /how\s*to\s*access\s*.*\s*backend/i,
    /where\s*(is|are)\s*.*\s*stored/i
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(lowerQuery));
}

/**
 * Get knowledge-base enhanced response for specific TMPay topics
 * 
 * This function adds domain-specific knowledge about TMPay operations
 * before sending to OpenAI to ensure more accurate responses
 * 
 * @param query User's question
 * @param userContext Optional context about the user (username, role, etc.)
 * @returns Enhanced AI response with TMPay-specific knowledge
 */
export async function getKnowledgeBaseResponse(query: string, userContext: any = {}) {
  try {
    // Check for protected information requests
    if (containsProtectedInfoRequest(query)) {
      return {
        success: true,
        response: {
          role: 'assistant',
          content: 'I apologize, but I cannot provide information about internal system details, API credentials, or sensitive configuration data. If you need technical assistance, please contact your account manager or email support@tmpay.com for help with your specific issue.'
        },
        isProtectedRequest: true
      };
    }
    
    // Extract user context
    const { username, role = 'player' } = userContext;
    
    // Create messages array with system instructions and user context
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful TMPay support assistant responding to a ${role}.
Your expertise is in casino e-wallet payments, particularly with GCash integration, 
manual payments, and casino fund transfers. TMPay supports several payment methods including:
1. GCash QR code payments (most popular)
2. Manual bank transfers
3. Crypto payments via PHPT

SECURITY GUIDELINES:
- Never reveal API credentials, tokens, or sensitive implementation details
- Do not discuss database structure or connection information
- Never share information about admin interfaces or backdoor access
- Do not provide technical debugging steps that could expose system architecture
- For technical issues, direct users to contact their manager or support
- Never provide information that could be used to exploit the system

When responding to questions, be accurate, concise, and friendly. For questions about
specific account details or technical issues you cannot resolve, suggest contacting
their immediate manager or customer support at support@tmpay.com.
Current date: ${new Date().toLocaleDateString()}`
      },
      {
        role: 'user',
        content: username ? `I am ${username}. ${query}` : query
      }
    ];
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return {
      success: true,
      response: completion.choices[0].message,
      usage: completion.usage,
    };
  } catch (error: any) {
    console.error('Error in knowledge base response:', error);
    return {
      success: false,
      error: error.message || 'Error processing support request',
      details: error.response?.data || {},
    };
  }
}

/**
 * Generate deposit troubleshooting guidance based on transaction details
 * 
 * @param transactionDetails Details about a problematic transaction
 * @returns AI-generated troubleshooting steps
 */
export async function getTroubleshootingGuidance(transactionDetails: any) {
  try {
    // First check security (don't troubleshoot sensitive operations)
    if (
      transactionDetails.type === 'admin_operation' || 
      transactionDetails.type === 'system_action' ||
      (transactionDetails.metadata && transactionDetails.metadata.internal_only)
    ) {
      return {
        success: true,
        guidance: "This type of transaction requires administrator assistance. Please contact your account manager or support team for help with this transaction.",
        isRestrictedOperation: true
      };
    }
    
    // Sanitize transaction details to remove any sensitive data before sending to OpenAI
    const sanitizedDetails = {
      type: transactionDetails.type,
      amount: transactionDetails.amount,
      status: transactionDetails.status,
      method: transactionDetails.method,
      error: transactionDetails.error || 'None reported',
      gcashStatus: transactionDetails.gcashStatus || 'N/A',
      casinoStatus: transactionDetails.casinoStatus || 'N/A',
      completedAt: transactionDetails.completedAt 
        ? new Date(transactionDetails.completedAt).toLocaleString() 
        : 'Not completed',
      createdAt: transactionDetails.createdAt 
        ? new Date(transactionDetails.createdAt).toLocaleString() 
        : 'Unknown'
    };

    const prompt = `
A user is having trouble with a ${sanitizedDetails.type} transaction.
Details:
- Amount: ${sanitizedDetails.amount}
- Status: ${sanitizedDetails.status}
- Payment Method: ${sanitizedDetails.method}
- Error (if any): ${sanitizedDetails.error}
- GCash Status: ${sanitizedDetails.gcashStatus}
- Casino Status: ${sanitizedDetails.casinoStatus}
- Created: ${sanitizedDetails.createdAt}
- Completed: ${sanitizedDetails.completedAt}

Please provide step-by-step troubleshooting guidance to help them resolve this issue.
Focus on the most likely causes based on the status and recommend specific actions.
`;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert troubleshooter for TMPay casino payment platform. You provide detailed, step-by-step guidance to resolve transaction issues. Be concise and actionable.

IMPORTANT SECURITY GUIDELINES:
- Never suggest modifying database records directly
- Never suggest using developer tools or admin interfaces
- For payment issues that can't be resolved through the user interface, direct users to contact their manager
- Don't suggest technical workarounds that bypass normal payment flows
- Don't reference internal system details or technical implementation

Focus on actions the user can take through the normal application interface.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.5, // Lower temperature for more precise troubleshooting
      max_tokens: 1200,
    });

    return {
      success: true,
      guidance: completion.choices[0].message.content,
      usage: completion.usage,
    };
  } catch (error: any) {
    console.error('Error generating troubleshooting guidance:', error);
    return {
      success: false,
      error: error.message || 'Error generating troubleshooting steps',
      fallbackGuidance: "We're having trouble generating personalized guidance right now. Please contact your manager or support for assistance with this transaction."
    };
  }
}

export default {
  getAIChatResponse,
  getKnowledgeBaseResponse,
  getTroubleshootingGuidance,
  requireOpenAIKey
};