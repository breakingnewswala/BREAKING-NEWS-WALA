/**
 * BREAKING NEWS WALA — Mock AI Provider Adapter
 * High-fidelity deterministic mock adapter for offline test execution and CI/CD pipelines.
 */

import { ProviderId, PROVIDER_IDS, MODEL_IDS, ModelIdentifier } from '../constants';
import { IProviderAdapter, ModelRequest, ModelResponse, ProviderError } from './provider.interface';

export class MockProviderAdapter implements IProviderAdapter {
  public readonly providerId: ProviderId = PROVIDER_IDS.MOCK;
  public readonly providerName: string = 'Mock Provider Engine';
  public readonly supportedModels: ModelIdentifier[] = [
    MODEL_IDS.MOCK_MODEL,
    MODEL_IDS.GEMINI_FLASH,
    MODEL_IDS.GEMINI_PRO,
    MODEL_IDS.CLAUDE_HAIKU,
    MODEL_IDS.GPT_4O_MINI,
  ];

  private simulatedFailureMode?: 'timeout' | 'rate_limit' | 'server_error' | 'auth_error' | 'invalid_json';
  private failureCountdown = 0;
  private defaultResponseData: Record<string, unknown> = {
    title: 'सत्यापित समाचार शीर्षक',
    summary: 'यह मॉक इंजन द्वारा उत्पन्न निष्पक्ष समाचार सारांश है।',
    status: 'success',
  };

  public isConfigured(): boolean {
    return true;
  }

  public async getHealth(): Promise<'healthy' | 'degraded' | 'unhealthy' | 'standby'> {
    if (this.simulatedFailureMode === 'server_error') return 'unhealthy';
    if (this.simulatedFailureMode === 'rate_limit') return 'degraded';
    return 'healthy';
  }

  public setSimulatedFailure(
    mode?: 'timeout' | 'rate_limit' | 'server_error' | 'auth_error' | 'invalid_json',
    count = 1
  ): void {
    this.simulatedFailureMode = mode;
    this.failureCountdown = count;
  }

  public setDefaultResponse(data: Record<string, unknown>): void {
    this.defaultResponseData = data;
  }

  public async execute(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    // Check simulated failure conditions
    if (this.simulatedFailureMode && this.failureCountdown > 0) {
      this.failureCountdown--;
      const mode = this.simulatedFailureMode;
      if (this.failureCountdown === 0) {
        this.simulatedFailureMode = undefined;
      }

      if (mode === 'timeout') {
        const timeout = request.timeoutMs || 100;
        await new Promise((r) => setTimeout(r, Math.min(timeout + 20, 200)));
        throw new ProviderError(
          'Mock execution timed out after timeout limit',
          this.providerId,
          'ERR_PROVIDER_TIMEOUT',
          true,
          408
        );
      }

      if (mode === 'rate_limit') {
        throw new ProviderError(
          'Mock rate limit exceeded (HTTP 429)',
          this.providerId,
          'ERR_RATE_LIMIT_EXCEEDED',
          true,
          429
        );
      }

      if (mode === 'server_error') {
        throw new ProviderError(
          'Mock internal provider error (HTTP 503)',
          this.providerId,
          'ERR_PROVIDER_UNAVAILABLE',
          true,
          503
        );
      }

      if (mode === 'auth_error') {
        throw new ProviderError(
          'Mock invalid API key credentials (HTTP 401)',
          this.providerId,
          'ERR_AUTHENTICATION_FAILED',
          false, // Non-retryable!
          401
        );
      }

      if (mode === 'invalid_json') {
        return {
          providerId: this.providerId,
          modelIdentifier: request.modelIdentifier,
          rawText: '<<<THIS IS NOT VALID JSON>>>',
          promptTokens: 50,
          completionTokens: 10,
          totalTokens: 60,
          durationMs: Date.now() - startTime,
          isFallback: false,
        };
      }
    }

    // Deterministic Hindi structured response generation based on task or request
    let responseObj = { ...this.defaultResponseData };

    if (request.userPrompt.includes('शीर्षक') || request.systemPrompt.includes('Headline')) {
      responseObj = {
        options: [
          {
            headline: 'मध्यप्रदेश में कृषि सुधारों को मिली गति, किसानों को सीधा लाभ',
            subheadline: 'ग्रामीण विकास के लिए नई योजनाओं की घोषणा',
            tone: 'informative',
            characterCount: 65,
          },
          {
            headline: 'भोपाल: राज्य स्तरीय बैठक में प्रशासनिक प्राथमिकताओं पर हुआ मंथन',
            subheadline: 'मुख्यमंत्री ने अधिकारियों को दिए सख्त निर्देश',
            tone: 'engaging',
            characterCount: 68,
          },
        ],
        suggestedTags: ['मध्यप्रदेश', 'कृषि', 'ग्रामीण विकास'],
        isFactPreserved: true,
      };
    } else if (request.userPrompt.includes('FactCheck') || request.systemPrompt.includes('Fact-Check')) {
      responseObj = {
        claimsIdentified: [
          {
            claimText: 'घटनास्थल पर दो समुदायों के बीच तनाव',
            verificationDimension: 'प्राथमिक स्रोत एवं आधिकारिक संस्करण',
            status: 'NEEDS_OFFICIAL_STATEMENT',
            riskLevel: 'MEDIUM',
            editorialAdvice: 'पुलिस अधीक्षक या जिला दंडाधिकारी का आधिकारिक बयान अनिवार्य रूप से जोड़ें।',
          },
        ],
        overallAdvisory: 'आलेख की भाषा संतुलित है किंतु संवेदनशील दावों पर आधिकारिक प्रशासनिक पुष्टि आवश्यक है।',
        potentialContradictions: [],
        missingEvidenceNotes: ['पुलिस रिपोर्ट या प्राथमिकी संख्या संलग्न नहीं है'],
        humanReviewChecklist: [
          'स्थान एवं समय की पुष्टि',
          'संबंधित पक्ष का उत्तर (Right of Reply)',
          'मानहानि एवं कानूनी समीक्षा',
        ],
        isAutomatedApproval: false,
      };
    } else if (request.userPrompt.includes('structure') || request.systemPrompt.includes('Structuring')) {
      responseObj = {
        suggestedHeadline: 'भोपाल: शहर के विकास कार्यों में आई तेज़ी, नई सड़क परियोजनाओं को मंज़ूरी',
        leadStandfirst: 'राजधानी भोपाल में बुनियादी ढांचे के सुदृढ़ीकरण हेतु राज्य सरकार ने महत्वपूर्ण निर्णय लिया है।',
        bodyParagraphs: [
          'भोपाल नगर निगम एवं लोक निर्माण विभाग की संयुक्त समीक्षा बैठक में विकास कार्यों को समयसीमा के भीतर पूर्ण करने का संकल्प लिया गया।',
          'परियोजना के अंतर्गत मुख्य मार्गों के चौड़ीकरण तथा जल निकासी प्रणाली को दुरुस्त करने पर विशेष बल दिया जाएगा।',
        ],
        contextBackground: 'पूर्व में स्वीकृत योजनाओं की प्रगति की समीक्षा करते हुए यह निर्णय लिया गया है।',
        missingInformationNotices: ['विभाग द्वारा बजट का सटीक आवंटन विवरण प्रतीक्षित है'],
        suggestedCategory: 'विकास एवं प्रशासन',
        suggestedDistrict: 'भोपाल',
      };
    }

    const rawText = JSON.stringify(responseObj, null, 2);
    const durationMs = Math.max(5, Date.now() - startTime);

    return {
      providerId: this.providerId,
      modelIdentifier: request.modelIdentifier,
      rawText,
      structuredData: responseObj,
      promptTokens: Math.round(request.userPrompt.length / 4) + 20,
      completionTokens: Math.round(rawText.length / 4) + 10,
      totalTokens: Math.round((request.userPrompt.length + rawText.length) / 4) + 30,
      durationMs,
      isFallback: false,
    };
  }
}

