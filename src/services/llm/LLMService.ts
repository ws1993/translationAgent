import axios from 'axios';
import { LLMConfig } from '../../types';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
}

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      if (this.config.provider === 'openai' || this.config.provider === 'custom') {
        return await this.sendOpenAIMessage(messages);
      } else if (this.config.provider === 'anthropic') {
        return await this.sendAnthropicMessage(messages);
      }
      throw new Error('Unsupported provider');
    } catch (error) {
      console.error('LLM API error:', error);
      throw error;
    }
  }

  private async sendOpenAIMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: this.config.model,
        messages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
    };
  }

  private async sendAnthropicMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await axios.post(
      `${baseUrl}/messages`,
      {
        model: this.config.model,
        max_tokens: this.config.maxTokens || 2000,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature || 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    return {
      content: response.data.content[0].text,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage([
        { role: 'user', content: 'Hello' }
      ]);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}
