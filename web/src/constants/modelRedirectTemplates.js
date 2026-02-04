/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

/**
 * 模型重定向模板库
 * 格式: { "标准模型名": ["可能的原始模型名1", "可能的原始模型名2", ...] }
 * 当检测到模型列表中有匹配的原始模型名时，会自动生成重定向映射
 */
export const MODEL_REDIRECT_TEMPLATES = {
    // Embedding 模型
    "BGE-M3": ["baai/bge-m3", "BAAI/bge-m3", "Pro/BAAI/bge-m3"],
    "BGE-Large-EN-V1.5": ["BAAI/bge-large-en-v1.5"],
    "BGE-Large-ZH-V1.5": ["BAAI/bge-large-zh-v1.5"],
    "BGE-Reranker-V2-M3": ["BAAI/bge-reranker-v2-m3", "bge-reranker-v2-m3", "Pro/BAAI/bge-reranker-v2-m3"],
    "BCE-Embedding-Base-V1": ["netease-youdao/bce-embedding-base_v1"],
    "BCE-Reranker-Base-V1": ["netease-youdao/bce-reranker-base_v1"],

    // Baichuan
    "Baichuan2-13B": ["baichuan-inc/baichuan2-13b-chat"],

    // 其他模型
    "Bielik-11B-Instruct-V2.3": ["speakleash/bielik-11b-v2.3-instruct"],
    "Bielik-11B-Instruct-V2.6": ["speakleash/bielik-11b-v2.6-instruct"],
    "Breeze-7B-Instruct": ["mediatek/breeze-7b-instruct"],
    "ChatGLM3-6B": ["thudm/chatglm3-6b"],

    // CodeGemma
    "CodeGemma-1.1-7B": ["google/codegemma-1.1-7b"],
    "CodeGemma-7B": ["google/codegemma-7b"],
    "CodeLlama-70B": ["meta/codellama-70b"],
    "Codestral-22B-Instruct": ["mistralai/codestral-22b-instruct-v0.1"],

    // Claude
    "Claude-sonnet-4": ["anthropic/claude-sonnet-4"],
    "Claude-haiku-4": ["anthropic/claude-haiku-4"],
    "Claude-opus-4": ["anthropic/claude-opus-4"],
    "Claude-sonnet-5": ["anthropic/claude-sonnet-5"],
    "Claude-haiku-5": ["anthropic/claude-haiku-5"],
    "Claude-opus-5": ["anthropic/claude-opus-5"],

    // DBRX
    "DBRX-Instruct": ["databricks/dbrx-instruct"],

    // DeepSeek
    "DeepSeek-Coder": ["deepseek-ai/deepseek-coder-6.7b-instruct"],
    "DeepSeek-OCR": ["deepseek-ai/DeepSeek-OCR"],
    "DeepSeek-R1": [
        "deepseek-ai/deepseek-r1-distill-llama-8b",
        "deepseek-ai/deepseek-r1-distill-qwen-14b",
        "deepseek-ai/deepseek-r1-distill-qwen-32b",
        "deepseek-ai/deepseek-r1-distill-qwen-7b",
        "deepseek-ai/DeepSeek-R1",
        "Pro/deepseek-ai/DeepSeek-R1",
        "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
        "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
        "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
        "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
        "Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
        "DeepSeek-R1-Distill-Llama-70B",
        "DeepSeek-R1-Distill-Llama-8B",
        "DeepSeek-R1-Distill-Qwen-14B",
        "DeepSeek-R1-Distill-Qwen-32B",
        "DeepSeek-R1-Distill-Qwen-7B"
    ],
    "DeepSeek-V2.5": ["deepseek-ai/DeepSeek-V2.5"],
    "DeepSeek-V3": ["deepseek-ai/DeepSeek-V3", "Pro/deepseek-ai/DeepSeek-V3", "DeepSeek-V3-0324"],
    "DeepSeek-V3.1": [
        "DeepSeek-V3.1-Terminus",
        "deepseek/deepseek-chat-v3.1",
        "deepseek-ai/deepseek-v3.1",
        "deepseek-ai/deepseek-v3.1-terminus",
        "deepseek-ai/DeepSeek-V3.1-Terminus",
        "Pro/deepseek-ai/DeepSeek-V3.1-Terminus"
    ],
    "DeepSeek-V3.2": [
        "deepseek-ai/deepseek-v3.2",
        "DeepSeek-V3.2-Exp",
        "deepseek/deepseek-chat-v3.2",
        "deepseek-ai/DeepSeek-V3.2",
        "Pro/deepseek-ai/DeepSeek-V3.2"
    ],
    "DeepSeek-VL2": ["deepseek-ai/deepseek-vl2"],

    // Google 
    "DePlot": ["google/deplot"],

    // Mistral
    "Devstral-2-123B-Instruct": ["mistralai/devstral-2-123b-instruct-2512"],

    // ERNIE
    "ERNIE-4.5-300B-A47B": ["baidu/ERNIE-4.5-300B-A47B"],

    // NVIDIA Embed
    "Embed-QA-4": ["nvidia/embed-qa-4"],

    // Falcon
    "Falcon3-7B-Instruct": ["tiiuae/falcon3-7b-instruct"],

    // Fish Speech
    "Fish-Speech-1.4": ["fishaudio/fish-speech-1.4"],
    "Fish-Speech-1.5": ["fishaudio/fish-speech-1.5"],

    // FLUX
    "FLUX.1": ["black-forest-labs/FLUX.1-pro", "black-forest-labs/FLUX.1-dev"],
    "FLUX.1-Schnell": ["black-forest-labs/FLUX.1-schnell", "Pro/black-forest-labs/FLUX.1-schnell"],

    // GLM
    "GLM-4": [
        "Pro/THUDM/glm-4-9b-chat",
        "THUDM/GLM-4-9B-0414",
        "THUDM/glm-4-9b-chat",
        "THUDM/GLM-4-32B-0414",
        "GLM-4-32B-0414",
        "GLM-4-9B-0414"
    ],
    "GLM-4.1V": ["THUDM/GLM-4.1V-9B-Thinking", "Pro/THUDM/GLM-4.1V-9B-Thinking"],
    "GLM-4.5-Air": ["zai-org/GLM-4.5-Air"],
    "GLM-4.5V": ["zai-org/GLM-4.5V"],
    "GLM-4.6": ["zai-org/GLM-4.6"],
    "GLM-4.6V": ["zai-org/GLM-4.6V"],
    "GLM-4.7": ["z-ai/glm4.7", "Pro/zai-org/GLM-4.7"],
    "GLM-Z1": [
        "THUDM/GLM-Z1-Rumination-32B-0414",
        "THUDM/GLM-Z1-9B-0414",
        "THUDM/GLM-Z1-32B-0414",
        "GLM-Z1-32B-0414",
        "GLM-Z1-9B-0414"
    ],

    // Gemini
    "gemini-2.5-flash-lite": ["假流式/gemini-2.5-flash-lite", "流式抗截断/gemini-2.5-flash-lite"],
    "gemini-2.5-pro": [
        "google/gemini-2.5-pro",
        "gemini-2.5-pro-max",
        "gemini-2.5-pro-high",
        "gemini-2.5-pro-medium",
        "gemini-2.5-pro-low",
        "gemini-2.5-pro-minimal",
        "假流式/gemini-2.5-pro",
        "假流式/gemini-2.5-pro-max",
        "假流式/gemini-2.5-pro-high",
        "假流式/gemini-2.5-pro-medium",
        "假流式/gemini-2.5-pro-low",
        "假流式/gemini-2.5-pro-minimal",
        "流式抗截断/gemini-2.5-pro",
        "流式抗截断/gemini-2.5-pro-max",
        "流式抗截断/gemini-2.5-pro-high",
        "流式抗截断/gemini-2.5-pro-medium",
        "流式抗截断/gemini-2.5-pro-low",
        "流式抗截断/gemini-2.5-pro-minimal"
    ],
    "gemini-2.5-flash": [
        "google/gemini-2.5-flash",
        "gemini-2.5-flash-thinking",
        "gemini-2.5-flash-max",
        "gemini-2.5-flash-high",
        "gemini-2.5-flash-medium",
        "gemini-2.5-flash-low",
        "gemini-2.5-flash-minimal",
        "假流式/gemini-2.5-flash-thinking",
        "假流式/gemini-2.5-flash",
        "假流式/gemini-2.5-flash-max",
        "假流式/gemini-2.5-flash-high",
        "假流式/gemini-2.5-flash-medium",
        "假流式/gemini-2.5-flash-low",
        "假流式/gemini-2.5-flash-minimal",
        "流式抗截断/gemini-2.5-flash-thinking",
        "流式抗截断/gemini-2.5-flash",
        "流式抗截断/gemini-2.5-flash-max",
        "流式抗截断/gemini-2.5-flash-high",
        "流式抗截断/gemini-2.5-flash-medium",
        "流式抗截断/gemini-2.5-flash-low",
        "流式抗截断/gemini-2.5-flash-minimal"
    ],
    "gemini-3-pro-preview": [
        "google/gemini-3-pro-preview",
        "gemini-3-pro-high",
        "gemini-3-pro-low",
        "gemini-3-pro-preview-max",
        "gemini-3-pro-preview-high",
        "gemini-3-pro-preview-low",
        "假流式/gemini-3-pro-high",
        "假流式/gemini-3-pro-low",
        "假流式/gemini-3-pro-preview",
        "假流式/gemini-3-pro-preview-high",
        "假流式/gemini-3-pro-preview-low",
        "流式抗截断/gemini-3-pro-high",
        "流式抗截断/gemini-3-pro-low",
        "流式抗截断/gemini-3-pro-preview",
        "流式抗截断/gemini-3-pro-preview-high",
        "流式抗截断/gemini-3-pro-preview-low"
    ],
    "gemini-3-flash-preview": [
        "gemini-3-flash",
        "google/gemini-3-flash-preview",
        "gemini-3-flash-preview-max",
        "gemini-3-flash-preview-high",
        "gemini-3-flash-preview-medium",
        "gemini-3-flash-preview-low",
        "gemini-3-flash-preview-minimal",
        "假流式/gemini-3-flash",
        "假流式/gemini-3-flash-preview",
        "假流式/gemini-3-flash-preview-high",
        "假流式/gemini-3-flash-preview-medium",
        "假流式/gemini-3-flash-preview-low",
        "假流式/gemini-3-flash-preview-minimal",
        "流式抗截断/gemini-3-flash",
        "流式抗截断/gemini-3-flash-preview",
        "流式抗截断/gemini-3-flash-preview-high",
        "流式抗截断/gemini-3-flash-preview-medium",
        "流式抗截断/gemini-3-flash-preview-low",
        "流式抗截断/gemini-3-flash-preview-minimal",
        "流式抗截断/gemini-3-flash-preview-search"
    ],
    "gemini-3-pro-image": [
        "gemini-3-pro-image",
        "假流式/gemini-3-pro-image",
        "流式抗截断/gemini-3-pro-image"
    ],

    // Grok
    "grok-4": ["x-ai/grok-4", "grok-4-expert", "grok-4-heavy"],
    "grok-4.1": ["x-ai/grok-4.1", "grok-4.1-expert", "grok-4.1-heavy"],
    "grok-4-fast": ["grok-4-fast-expert", "x-ai/grok-4-fast"],
    "grok-4.1-fast": ["x-ai/grok-4.1-fast", "grok-4.1-fast-expert"],

    // GPT
    "gpt-5-mini": ["gpt-5-nano-2025-08-07"],

    // Gemma
    "Gemma-2": [
        "google/gemma-2-2b-it",
        "google/gemma-2-9b-it",
        "google/gemma-2-27b-it",
        "gotocompany/gemma-2-9b-cpt-sahabatai-instruct"
    ],
    "Gemma-3": [
        "google/gemma-3-1b-it",
        "google/gemma-3-4b-it",
        "google/gemma-3-12b-it",
        "google/gemma-3-27b-it"
    ],
    "Gemma-3N": ["google/gemma-3n-e2b-it", "google/gemma-3n-e4b-it"],
    "Gemma-2B": ["google/gemma-2b"],
    "Gemma-7B": ["google/gemma-7b"],

    // Granite (IBM)
    "Granite-3.0-3B-Instruct": ["ibm/granite-3.0-3b-a800m-instruct"],
    "Granite-3.0-8B-Instruct": ["ibm/granite-3.0-8b-instruct"],
    "Granite-3.3-8B-Instruct": ["ibm/granite-3.3-8b-instruct"],
    "Granite-8B-Code-Instruct": ["ibm/granite-8b-code-instruct"],
    "Granite-34B-Code-Instruct": ["ibm/granite-34b-code-instruct"],
    "Granite-Guardian-3-8B": ["ibm/granite-guardian-3.0-8b"],

    // Hunyuan
    "Hunyuan-A13B-Instruct": ["tencent/Hunyuan-A13B-Instruct"],
    "Hunyuan-MT-7B": ["tencent/Hunyuan-MT-7B"],

    // InternLM
    "InternLM2.5-7B": ["internlm/internlm2_5-7b-chat"],

    // Jamba
    "Jamba-1.5-Large-Instruct": ["ai21labs/jamba-1.5-large-instruct"],
    "Jamba-1.5-Mini-Instruct": ["ai21labs/jamba-1.5-mini-instruct"],

    // Kimi
    "Kimi-Dev-72B": ["moonshotai/Kimi-Dev-72B"],
    "Kimi-K2": ["Kimi-K2-0905"],
    "Kimi-K2-Instruct": [
        "moonshotai/kimi-k2-instruct",
        "moonshotai/kimi-k2-instruct-0905",
        "Pro/moonshotai/Kimi-K2-Instruct-0905"
    ],
    "Kimi-K2-Thinking": [
        "moonshotai/Kimi-K2-Thinking",
        "moonshotai/kimi-k2-thinking",
        "Pro/moonshotai/Kimi-K2-Thinking"
    ],
    "Kimi-K2.5": ["moonshotai/kimi-k2.5", "Pro/moonshotai/Kimi-K2.5"],

    // Llama
    "Llama-3.1-8B-Instruct": ["meta/llama-3.1-8b-instruct"],
    "Llama-3.1-70B-Instruct": ["meta/llama-3.1-70b-instruct"],
    "Llama-3.1-405B-Instruct": ["meta/llama-3.1-405b-instruct"],
    "Llama-3.2-1B-Instruct": ["meta/llama-3.2-1b-instruct"],
    "Llama-3.2-3B-Instruct": ["meta/llama-3.2-3b-instruct"],
    "Llama-3.2-11B-VL-Instruct": ["meta/llama-3.2-11b-vision-instruct"],
    "Llama-3.2-90B-VL-Instruct": ["meta/llama-3.2-90b-vision-instruct"],
    "Llama-3.3-70B-Instruct": ["meta/llama-3.3-70b-instruct"],
    "Llama-4-Maverick-17B-128E-Instruct": ["meta/llama-4-maverick-17b-128e-instruct"],
    "Llama-4-Scout-17B-16E-Instruct": ["meta/llama-4-scout-17b-16e-instruct"],
    "Llama3-8B-Instruct": ["meta/llama3-8b-instruct"],
    "Llama3-70B-Instruct": ["meta/llama3-70b-instruct"],
    "Llama2-70B": ["meta/llama2-70b"],

    // NVIDIA Llama 
    "Llama-3.1-Nemotron-51B-Instruct": ["nvidia/llama-3.1-nemotron-51b-instruct"],
    "Llama-3.1-Nemotron-70B-Instruct": ["nvidia/llama-3.1-nemotron-70b-instruct"],
    "Llama-3.1-Nemotron-Nano-4B": ["nvidia/llama-3.1-nemotron-nano-4b-v1.1"],
    "Llama-3.1-Nemotron-Nano-8B": ["nvidia/llama-3.1-nemotron-nano-8b-v1"],
    "Llama-3.1-Nemotron-Ultra-253B": ["nvidia/llama-3.1-nemotron-ultra-253b-v1"],
    "Llama-3.3-Nemotron-Super-49B-V1": ["nvidia/llama-3.3-nemotron-super-49b-v1"],
    "Llama-3.3-Nemotron-Super-49B-V1.5": ["nvidia/llama-3.3-nemotron-super-49b-v1.5"],
    "Llama3-ChatQA-1.5-8B": ["nvidia/llama3-chatqa-1.5-8b"],
    "Llama3-ChatQA-1.5-70B": ["nvidia/llama3-chatqa-1.5-70b"],

    // MiniMax
    "MiniMax-M1": ["MiniMaxAI/MiniMax-M1-80k", "MiniMax-M1-80k"],
    "MiniMax-M2": ["MiniMaxAI/MiniMax-M2", "minimaxai/minimax-m2"],
    "MiniMax-M2.1": ["Pro/MiniMaxAI/MiniMax-M2.1", "minimaxai/minimax-m2.1"],

    // Mistral
    "Magistral-Small": ["mistralai/magistral-small-2506"],
    "Mistral-7B-Instruct": ["mistralai/mistral-7b-instruct-v0.2", "mistralai/mistral-7b-instruct-v0.3"],
    "Mistral-Large": ["mistralai/mistral-large"],
    "Mistral-Large-2-Instruct": ["mistralai/mistral-large-2-instruct"],
    "Mistral-Large-3-675B-Instruct": ["mistralai/mistral-large-3-675b-instruct-2512"],
    "Mistral-Medium-3-Instruct": ["mistralai/mistral-medium-3-instruct"],
    "Mistral-Small-24B-Instruct": ["mistralai/mistral-small-24b-instruct"],
    "Mistral-Small-3.1-24B-Instruct": ["mistralai/mistral-small-3.1-24b-instruct-2503"],
    "Mixtral-8x7B-Instruct": ["mistralai/mixtral-8x7b-instruct-v0.1"],
    "Mixtral-8x22B": ["mistralai/mixtral-8x22b-v0.1"],
    "Mixtral-8x22B-Instruct": ["mistralai/mixtral-8x22b-instruct-v0.1"],
    "Mistral-Nemo-12B-Instruct": ["nv-mistralai/mistral-nemo-12b-instruct"],

    // NVIDIA
    "NV-Embed": ["nvidia/nv-embed-v1"],
    "NVIDIA-Nemotron-Nano-9B": ["nvidia/nvidia-nemotron-nano-9b-v2"],
    "Nemotron-4-340B-Instruct": ["nvidia/nemotron-4-340b-instruct"],
    "Nemotron-Mini-4B-Instruct": ["nvidia/nemotron-mini-4b-instruct"],

    // Phi (Microsoft)
    "Phi-3-Mini-4K-Instruct": ["microsoft/phi-3-mini-4k-instruct"],
    "Phi-3-Mini-128K-Instruct": ["microsoft/phi-3-mini-128k-instruct"],
    "Phi-3-Small-8K-Instruct": ["microsoft/phi-3-small-8k-instruct"],
    "Phi-3-Small-128K-Instruct": ["microsoft/phi-3-small-128k-instruct"],
    "Phi-3-Medium-4K-Instruct": ["microsoft/phi-3-medium-4k-instruct"],
    "Phi-3-Medium-128K-Instruct": ["microsoft/phi-3-medium-128k-instruct"],
    "Phi-3-Vision-128K-Instruct": ["microsoft/phi-3-vision-128k-instruct"],
    "Phi-3.5-Mini-Instruct": ["microsoft/phi-3.5-mini-instruct"],
    "Phi-3.5-MoE-Instruct": ["microsoft/phi-3.5-moe-instruct"],
    "Phi-3.5-Vision-Instruct": ["microsoft/phi-3.5-vision-instruct"],
    "Phi-4-Mini-Instruct": ["microsoft/phi-4-mini-instruct"],
    "Phi-4-Mini-Flash-Reasoning": ["microsoft/phi-4-mini-flash-reasoning"],
    "Phi-4-Multimodal-Instruct": ["microsoft/phi-4-multimodal-instruct"],

    // QWQ / Qwen
    "QWQ-32B": ["qwen/qwq-32b", "QwQ-32B"],
    "QVQ-72B-Preview": ["Qwen/QVQ-72B-Preview"],
    "Qwen-Image": ["Qwen/Qwen-Image", "Qwen-Image"],
    "Qwen-Image-Edit": ["Qwen/Qwen-Image-Edit-2509", "Qwen/Qwen-Image-Edit"],
    "Qwen2-7B-Instruct": ["qwen/qwen2-7b-instruct", "Qwen/Qwen2-7B-Instruct", "Pro/Qwen/Qwen2-7B-Instruct"],
    "Qwen2-VL-72B-Instruct": ["Qwen/Qwen2-VL-72B-Instruct"],
    "Qwen2.5-7B-Instruct": [
        "qwen/qwen2.5-7b-instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "Pro/Qwen/Qwen2.5-7B-Instruct",
        "LoRA/Qwen/Qwen2.5-7B-Instruct"
    ],
    "Qwen2.5-14B-Instruct": ["Qwen/Qwen2.5-14B-Instruct", "LoRA/Qwen/Qwen2.5-14B-Instruct"],
    "Qwen2.5-32B-Instruct": ["Qwen/Qwen2.5-32B-Instruct", "LoRA/Qwen/Qwen2.5-32B-Instruct"],
    "Qwen2.5-72B-Instruct": [
        "Qwen/Qwen2.5-72B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct-128K",
        "LoRA/Qwen/Qwen2.5-72B-Instruct"
    ],
    "Qwen2.5-Coder-7B-Instruct": [
        "qwen/qwen2.5-coder-7b-instruct",
        "Qwen/Qwen2.5-Coder-7B-Instruct",
        "Pro/Qwen/Qwen2.5-Coder-7B-Instruct"
    ],
    "Qwen2.5-Coder-32B-Instruct": ["qwen/qwen2.5-coder-32b-instruct", "Qwen/Qwen2.5-Coder-32B-Instruct"],
    "Qwen2.5-VL-7B-Instruct": ["Pro/Qwen/Qwen2.5-VL-7B-Instruct"],
    "Qwen2.5-VL-32B-Instruct": ["Qwen/Qwen2.5-VL-32B-Instruct"],
    "Qwen2.5-VL-72B-Instruct": ["Qwen/Qwen2.5-VL-72B-Instruct"],

    // Qwen3
    "Qwen3": ["Qwen3-1.7B", "Qwen3-14B", "Qwen3-4B", "Qwen3-8B"],
    "Qwen3-8B": ["Qwen/Qwen3-8B"],
    "Qwen3-14B": ["Qwen/Qwen3-14B"],
    "Qwen3-32B": ["Qwen/Qwen3-32B"],
    "Qwen3-30B-A3B": ["Qwen/Qwen3-30B-A3B"],
    "Qwen3-30B-A3B-Instruct": ["Qwen/Qwen3-30B-A3B-Instruct-2507", "Qwen3-30B-A3B-Instruct-2507"],
    "Qwen3-30B-A3B-Thinking": ["Qwen3-30B-A3B-Thinking-2507", "Qwen/Qwen3-30B-A3B-Thinking-2507"],
    "Qwen3-235B-A22B": ["qwen/qwen3-235b-a22b"],
    "Qwen3-235B-A22B-Instruct": ["Qwen3-235B-A22B-Instruct-2507", "Qwen/Qwen3-235B-A22B-Instruct-2507"],
    "Qwen3-235B-A22B-Thinking": ["Qwen3-235B-A22B-Thinking-2507", "Qwen/Qwen3-235B-A22B-Thinking-2507"],
    "Qwen3-Coder-30B-A3B-Instruct": ["Qwen/Qwen3-Coder-30B-A3B-Instruct"],
    "Qwen3-Coder-480B-A35B-Instruct": ["qwen/qwen3-coder-480b-a35b-instruct", "Qwen/Qwen3-Coder-480B-A35B-Instruct"],
    "Qwen3-Embedding": [
        "Qwen/Qwen3-Embedding-0.6B",
        "Qwen/Qwen3-Embedding-4B",
        "Qwen/Qwen3-Embedding-8B",
        "Qwen3-Embedding-0.6B",
        "Qwen3-Embedding-4B",
        "Qwen3-Embedding-8B"
    ],
    "Qwen3-Next-80B-A3B-Instruct": ["Qwen/Qwen3-Next-80B-A3B-Instruct"],
    "Qwen3-Next-80B-A3B-Thinking": ["Qwen/Qwen3-Next-80B-A3B-Thinking"],
    "Qwen3-VL-8B-Instruct": ["Qwen/Qwen3-VL-8B-Instruct"],
    "Qwen3-VL-8B-Thinking": ["Qwen/Qwen3-VL-8B-Thinking"],
    "Qwen3-VL-30B-A3B-Instruct": ["Qwen/Qwen3-VL-30B-A3B-Instruct"],
    "Qwen3-VL-30B-A3B-Thinking": ["Qwen/Qwen3-VL-30B-A3B-Thinking"],
    "Qwen3-VL-32B-Instruct": ["Qwen/Qwen3-VL-32B-Instruct"],
    "Qwen3-VL-32B-Thinking": ["Qwen/Qwen3-VL-32B-Thinking"],
    "Qwen3-VL-235B-A22B-Instruct": ["Qwen/Qwen3-VL-235B-A22B-Instruct"],
    "Qwen3-VL-235B-A22B-Thinking": ["Qwen/Qwen3-VL-235B-A22B-Thinking"],
    "Qwen3-Reranker": [
        "Qwen/Qwen3-Reranker-0.6B",
        "Qwen/Qwen3-Reranker-4B",
        "Qwen/Qwen3-Reranker-8B",
        "Qwen3-Reranker-0.6B",
        "Qwen3-Reranker-8B"
    ],

    // StarCoder
    "StarCoder2-7B": ["bigcode/starcoder2-7b"],
    "StarCoder2-15B": ["bigcode/starcoder2-15b"],

    // Step
    "Step-3.5-Flash": ["stepfun-ai/step-3.5-flash"],
    "Step3": ["stepfun-ai/step3"],

    // Yi
    "Yi-Large": ["01-ai/yi-large"],

    // 中文模型
    "即梦图片生成-4.0": ["即梦图片生成 4.0"],
    "即梦文生图-3.0": ["即梦文生图 3.0"],
    "即梦文生图-3.1": ["即梦文生图 3.1"],
};

/**
 * 根据模型列表生成重定向映射
 * @param {string[]} models - 当前渠道的模型列表
 * @param {Object} existingMapping - 现有的重定向映射
 * @param {Object} customTemplates - 自定义模板库（可选，不传则使用内置模板）
 * @returns {Object} 生成的重定向映射
 */
export function generateRedirectMapping(models, existingMapping = {}, customTemplates = null) {
    const result = { ...existingMapping };
    const templates = customTemplates || MODEL_REDIRECT_TEMPLATES;

    if (!Array.isArray(models) || models.length === 0) {
        return result;
    }

    // 遍历每个模型
    for (const model of models) {
        if (!model) continue;

        // 在模板库中查找匹配
        for (const [standardName, aliases] of Object.entries(templates)) {
            if (Array.isArray(aliases) && aliases.includes(model)) {
                // 找到匹配，添加重定向（标准名 -> 原始名）
                // 只有当这个标准名还没有映射时才添加
                if (!result[standardName]) {
                    result[standardName] = model;
                }
                break;
            }
        }
    }

    return result;
}

/**
 * 统计有多少个模型可以被重定向
 * @param {string[]} models - 当前渠道的模型列表
 * @param {Object} customTemplates - 自定义模板库（可选，不传则使用内置模板）
 * @returns {number} 可重定向的模型数量
 */
export function countRedirectableModels(models, customTemplates = null) {
    const templates = customTemplates || MODEL_REDIRECT_TEMPLATES;

    if (!Array.isArray(models) || models.length === 0) {
        return 0;
    }

    let count = 0;
    const matchedStandards = new Set();

    for (const model of models) {
        if (!model) continue;

        for (const [standardName, aliases] of Object.entries(templates)) {
            if (Array.isArray(aliases) && aliases.includes(model) && !matchedStandards.has(standardName)) {
                matchedStandards.add(standardName);
                count++;
                break;
            }
        }
    }

    return count;
}

