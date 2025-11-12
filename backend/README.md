![](./assets/banner.jpg)

<h1 align="center">Orphiq - AI Companion Engine</h1>
<h3 align="center">



[![Docker](https://img.shields.io/badge/orphiq%2Fai--companion--engine-%25230db7ed.svg?logo=docker&logoColor=blue&labelColor=white&color=blue)](https://hub.docker.com/r/orphiq/ai-companion-engine) 

[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/orphiq)
[![](https://dcbadge.limes.pink/api/server/orphiq)](https://discord.gg/orphiq)

[Documentation](https://orphiq.ai/docs/quick-start)

</h3> 

> :warning: This project draws inspiration from [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) but has evolved into its own distinct platform with enhanced AI capabilities, improved user experience, and additional features. While we share some architectural concepts, Orphiq represents a significant evolution in AI companion technology.

> :warning: If you want to run the server remotely and access it on a different machine, such as running the server on your computer and access it on your phone, you will need to configure `https`, because the microphone on the front end will only launch in a secure context (a.k.a. https or localhost). See [MDN Web Doc](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). Therefore, you should configure https with a reverse proxy to access the page on a remote machine (non-localhost).

## ⭐️ What is Orphiq?

**Orphiq** is an advanced **AI Companion Engine** that combines state-of-the-art language models with interactive visual avatars. Built on the foundation of Open-LLM-VTuber, Orphiq enhances the experience with:

- **Advanced AI Capabilities**: Leveraging the latest LLM technologies for more natural and contextually aware conversations
- **Enhanced User Experience**: Streamlined interface and improved interaction patterns
- **Extended Model Support**: Additional integration with cutting-edge AI models and services
- **Improved Performance**: Optimized resource usage and faster response times

The engine supports both web and desktop applications, with special features for desktop pet mode that allows your AI companion to be present anywhere on your screen.

### 👀 Demo
| ![](assets/i1.jpg) | ![](assets/i2.jpg) |
|:---:|:---:|
| ![](assets/i3.jpg) | ![](assets/i4.jpg) |

## ✨ Features & Highlights

- 🖥️ **Cross-platform support**: Perfect compatibility with macOS, Linux, and Windows. Optimized for both NVIDIA and non-NVIDIA GPUs, with flexible deployment options.

- 🔒 **Privacy-focused**: Run completely offline using local models - no internet required. Your conversations stay on your device, ensuring privacy and security.

- 💻 **Dual-mode interface**: 
  - Web interface for easy access and sharing
  - Desktop client with transparent background and global top-most support
  - Seamless switching between modes

- 🎯 **Advanced interaction features**:
  - 👁️ Visual perception with camera and screen capture
  - 🎤 Voice interaction with echo cancellation
  - 🫱 Touch and gesture support
  - 😊 Dynamic facial expressions
  - 🐱 Desktop pet mode with click-through
  - 💭 Thought visualization
  - 🗣️ Proactive communication
  - 💾 Persistent conversation history
  - 🌍 Multi-language support

- 🧠 **Extended model support**:
  - 🤖 LLMs: OpenAI, Claude, Gemini, Mistral, and more
  - 🎙️ ASR: Whisper, FunASR, and others
  - 🔊 TTS: Multiple voice synthesis options

- 🔧 **Enhanced customization**:
  - ⚙️ Simplified configuration
  - 🎨 Extensive character customization
  - 🧩 Flexible agent architecture
  - 🔌 Modular design for easy extension

## 🚀 Quick Start

Please refer to the [Quick Start](https://orphiq.ai/docs/quick-start) section in our documentation for installation.

## 🛠️ CLI Usage

The Orphiq CLI (`cli.py`) provides a simple way to manage your AI companion engine. Here are the main commands:

```bash
# Interactive menu mode
python cli.py

# Or use specific commands
python cli.py setup    # Create or update configuration
python cli.py build   # Install dependencies and prepare environment
python cli.py run     # Start the server
```

### Setup Command
The setup command helps you:
- Create initial configuration
- Set up API keys
- Choose your preferred LLM provider
- Configure language settings

### Build Command
The build command:
- Creates a Python virtual environment
- Installs all required dependencies
- Sets up system-level requirements
- Verifies the installation

### Run Command
The run command:
- Starts the AI companion engine
- Handles environment setup
- Manages server configuration
- Provides real-time status updates

For more detailed CLI documentation, visit our [CLI Guide](https://orphiq.ai/docs/cli).

## ☝ Update
> :warning: `v1.0.0` has breaking changes and requires re-deployment. For users coming from versions before `v1.0.0`, we recommend a fresh installation using the CLI:

```bash
python cli.py build    # Fresh installation
python cli.py setup   # Configure your settings
python cli.py run     # Start the engine
```

## 😢 Uninstall  
Most files, including Python dependencies and models, are stored in the project folder.

However, models downloaded via ModelScope or Hugging Face may also be in `MODELSCOPE_CACHE` or `HF_HOME`. While we aim to keep them in the project's `models` directory, it's good to double-check.  

Review the installation guide for any extra tools you no longer need, such as `ffmpeg` or `deeplx`.  

## 📜 Third-Party Licenses

### Live2D Sample Models Notice

This project includes Live2D sample models provided by Live2D Inc. These assets are licensed separately under the Live2D Free Material License Agreement and the Terms of Use for Live2D Cubism Sample Data. They are not covered by the MIT license of this project.

This content uses sample data owned and copyrighted by Live2D Inc. The sample data are utilized in accordance with the terms and conditions set by Live2D Inc. (See [Live2D Free Material License Agreement](https://www.live2d.jp/en/terms/live2d-free-material-license-agreement/) and [Terms of Use](https://www.live2d.com/eula/live2d-sample-model-terms_en.html)).

Note: For commercial use, especially by medium or large-scale enterprises, the use of these Live2D sample models may be subject to additional licensing requirements. If you plan to use this project commercially, please ensure that you have the appropriate permissions from Live2D Inc., or use versions of the project without these models.
