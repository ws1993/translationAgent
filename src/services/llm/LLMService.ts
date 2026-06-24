import axios from 'axios';
import { LLMConfig } from '../../types';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
}

export type StreamCallback = (chunk: string, fullText: string) => void;

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

  async sendMessageStream(messages: LLMMessage[], onStream?: StreamCallback): Promise<LLMResponse> {
    try {
      if (this.config.provider === 'openai' || this.config.provider === 'custom') {
        return await this.sendOpenAIMessageStream(messages, onStream);
      } else if (this.config.provider === 'anthropic') {
        return await this.sendAnthropicMessageStream(messages, onStream);
      }
      throw new Error('Unsupported provider');
    } catch (error) {
      console.error('LLM API stream error:', error);
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

  private async sendOpenAIMessageStream(messages: LLMMessage[], onStream?: StreamCallback): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) {
      throw new Error('No response body reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              onStream?.(content, fullText);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }

    return { content: fullText };
  }

  private async sendAnthropicMessageStream(messages: LLMMessage[], onStream?: StreamCallback): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 2000,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature || 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) {
      throw new Error('No response body reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const json = JSON.parse(data);
            if (json.type === 'content_block_delta' && json.delta?.text) {
              const content = json.delta.text;
              fullText += content;
              onStream?.(content, fullText);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }

    return { content: fullText };
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
