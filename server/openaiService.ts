/**
 * OpenAI Service for TMPay Support Assistant
 * 
 * This service provides integration with OpenAI's API for the support chatbot
 * functionality, allowing users to get intelligent responses to their questions.
 */

import OpenAI from 'openai';
import { NextFunction, Request, Response } from 'express';

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Handle chat completion requests through OpenAI API
 * 
 * @param messages An array of messages representing the conversation history
 * @returns The AI-generated response
 */
export async function getAIChatResponse(messages: any[]) {
  try {
    // Create a system message for context if not already provided
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: `You are a knowledgeable support assistant for TMPay, a casino e-wallet platform.
Your goal is to help users with any questions related to deposits, withdrawals, account management,
and casino transfers. Be concise, accurate, and helpful. For technical issues or account-specific
problems, suggest users contact their manager or customer support. Always maintain a professional
and friendly tone. Current date: ${new Date().toLocaleDateString()}`
      });
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
    // Extract user context
    const { username, role = 'player' } = userContext;
    
    // Create messages array with system instructions and user context
    const messages = [
      {
        role: 'system',
        content: `You are a helpful TMPay support assistant responding to a ${role}.
Your expertise is in casino e-wallet payments, particularly with GCash integration, 
manual payments, and casino fund transfers. TMPay supports several payment methods including:
1. GCash QR code payments (most popular)
2. Manual bank transfers
3. Crypto payments via PHPT
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
    const prompt = `
A user is having trouble with a ${transactionDetails.type} transaction.
Details:
- Amount: ${transactionDetails.amount}
- Status: ${transactionDetails.status}
- Payment Method: ${transactionDetails.method}
- Error (if any): ${transactionDetails.error || 'None reported'}
- GCash Status: ${transactionDetails.gcashStatus || 'N/A'}
- Casino Status: ${transactionDetails.casinoStatus || 'N/A'}

Please provide step-by-step troubleshooting guidance to help them resolve this issue.
Focus on the most likely causes based on the status and recommend specific actions.
`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert troubleshooter for TMPay casino payment platform. You provide detailed, step-by-step guidance to resolve transaction issues. Be concise and actionable.'
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