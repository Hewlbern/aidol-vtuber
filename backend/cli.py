import argparse
import os
import sys
import subprocess
from pathlib import Path
import logging
import platform
import time

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def ensure_required_packages():
    """Ensure required packages are installed and imported"""
    required_packages = ["ruamel.yaml", "requests"]
    if not install_requirements(required_packages):
        print("\n❌ Failed to install required packages")
        return False
    
    # Import after installation
    global yaml, requests
    import requests
    from ruamel.yaml import YAML
    yaml = YAML()
    return True

def install_requirements(packages):
    """Install required packages"""
    try:
        for package in packages:
            print(f"\n📦 Installing {package}...")
            # Special handling for pydantic to ensure v1
            if package.startswith("pydantic"):
                subprocess.run([sys.executable, "-m", "pip", "install", "pydantic<2.0"], check=True)
            else:
                subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)
            logger.debug(f"Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install requirements: {e}")
        return False

def get_default_paths():
    """Get default paths for config files"""
    base_dir = Path(__file__).parent
    config_dir = base_dir / "config" / "templates"
    user_config = Path("conf.yaml")
    default_config = config_dir / "conf.default.yaml"
    zh_config = config_dir / "conf.ZH.default.yaml"
    
    # Log path information
    logger.debug(f"Config directory: {config_dir} (exists: {config_dir.exists()})")
    logger.debug(f"User config path: {user_config} (exists: {user_config.exists()})")
    logger.debug(f"Default config path: {default_config} (exists: {default_config.exists()})")
    logger.debug(f"Chinese config path: {zh_config} (exists: {zh_config.exists()})")
    
    return user_config, default_config, zh_config

def check_uv_environment():
    """Check if uv is installed and set up virtual environment if needed"""
    try:
        # Check if uv is installed
        subprocess.run(["uv", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("\n❌ uv is not installed. Please install it first:")
        print("curl -LsSf https://astral.sh/uv/install.sh | sh")
        print("Or visit: https://github.com/astral/uv for other installation methods")
        sys.exit(1)

    # Check if virtual environment exists
    if not Path(".venv").exists():
        print("\n🔧 Setting up virtual environment...")
        try:
            subprocess.run(["uv", "venv"], check=True)
            subprocess.run(["uv", "sync"], check=True)
            print("✅ Virtual environment created successfully!")
        except subprocess.CalledProcessError as e:
            print(f"\n❌ Failed to set up virtual environment: {e}")
            sys.exit(1)

def prompt_language_choice():
    """Prompt user to choose config language"""
    while True:
        print("\nPlease choose your preferred configuration language:")
        print("1. English")
        print("2. Chinese (中文)")
        choice = input("Enter choice (1/2): ").strip()
        
        if choice == "1":
            return "en"
        elif choice == "2":
            return "zh"
        else:
            print("Invalid choice. Please enter 1 or 2.")

def check_dependencies():
    """Check and install required system dependencies"""
    missing_deps = []
    
    if platform.system() == "Darwin":  # macOS
        try:
            # Check Homebrew
            subprocess.run(["brew", "--version"], check=True, capture_output=True)
            
            # Check other dependencies
            for pkg in ["portaudio", "libsndfile"]:
                try:
                    subprocess.run(["brew", "list", pkg], check=True, capture_output=True)
                except subprocess.CalledProcessError:
                    missing_deps.append(pkg)
                    
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("\n❌ Homebrew is required but not installed!")
            print("Please install Homebrew first:")
            print("/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            sys.exit(1)
    
    return missing_deps

def install_dependencies(missing_deps):
    """Install missing system dependencies"""
    if platform.system() == "Darwin":  # macOS
        print("\n🔧 Installing missing dependencies...")
        for pkg in missing_deps:
            if pkg == "openssl@1.1":
                continue  # Skip OpenSSL 1.1 as it's handled separately
            try:
                print(f"\nInstalling {pkg}...")
                subprocess.run(["brew", "install", pkg], check=True)
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to install {pkg}: {e}")
                return False
    return True

def show_main_menu():
    """Show the main menu and get user choice"""
    while True:
        print("\n=== Open-LLM-VTuber CLI ===")
        print("1. Setup - Create or update configuration")
        print("2. Build - Install dependencies and prepare environment")
        print("3. Run - Start the server")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            setup_command()
        elif choice == "2":
            build_command()
        elif choice == "3":
            run_command()
        elif choice == "4":
            print("\nGoodbye!")
            exit(0)
        else:
            print("\nInvalid choice. Please enter a number between 1 and 4.")

def setup_command():
    """Handle the setup command - merge configs and prepare server"""
    print("\n=== Server Configuration Setup ===")
    
    if not ensure_required_packages():
        return

    # Check for .env and OpenAI API key
    if not Path(".env").exists():
        print("\n⚠️ No .env file found. Creating one...")
        api_key = input("Please enter your OpenAI API key: ").strip()
        with open(".env", "w") as f:
            f.write(f"OPENAI_API_KEY={api_key}\n")
        print("✅ Created .env file with API key")

    # Get language preference
    lang = prompt_language_choice()
    logger.debug(f"Selected language: {lang}")
    
    # Get LLM provider preference
    llm_config = select_llm_provider()
    logger.debug(f"Selected LLM config: {llm_config}")
    
    # Load and modify config
    config_path = Path("conf.yaml")
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.load(f)
        
        # Update LLM provider and model
        config['character_config']['agent_config']['agent_settings']['basic_memory_agent']['llm_provider'] = llm_config['provider']
        config['character_config']['agent_config']['llm_configs'][llm_config['provider']]['model'] = llm_config['model']
        
        with open(config_path, 'w') as f:
            yaml.dump(config, f)
    
    print("\n✅ Configuration complete!")
    print(f"Selected LLM: {llm_config['provider']} with model {llm_config['model']}")

def check_ollama_installed():
    """Check if Ollama is installed"""
    try:
        subprocess.run(["ollama", "version"], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def install_ollama():
    """Install Ollama"""
    if platform.system() == "Darwin":  # macOS
        try:
            print("\n📦 Installing Ollama...")
            subprocess.run(["brew", "install", "ollama"], check=True)
            print("✅ Ollama installed successfully!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"\n❌ Failed to install Ollama: {e}")
            print("Please install manually: curl -fsSL https://ollama.com/install.sh | sh")
            return False
    else:
        print("\nTo install Ollama, run:")
        print("curl -fsSL https://ollama.com/install.sh | sh")
        print("Or visit: https://ollama.com for other installation methods")
        return False

def build_command():
    """Handle the build command - install dependencies and prepare environment"""
    print("\n=== Building Environment ===")
    
    base_dir = Path(__file__).parent
    
    # Create required directories
    required_dirs = [
        # Core config directories
        base_dir / "config" / "templates",
        base_dir / "config" / "sample_conf",
        base_dir / "config" / "characters",
        base_dir / "config" / "live2d-models",
        # Shared resources
        base_dir / "config" / "shared",
        base_dir / "config" / "shared" / "backgrounds",
        base_dir / "config" / "shared" / "assets",
        base_dir / "config" / "shared" / "avatars",
        # Runtime directories
        base_dir / "cache",
        base_dir / "logs",
    ]
    
    for directory in required_dirs:
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            print(f"\nCreated directory: {directory}")

    # Check system dependencies first
    missing_deps = check_dependencies()
    if missing_deps:
        print("\nMissing system dependencies found:")
        for dep in missing_deps:
            print(f"- {dep}")
        
        # Install dependencies
        if missing_deps:
            choice = input("\nWould you like to install remaining dependencies? (y/n): ").lower()
            if choice == 'y':
                if not install_dependencies(missing_deps):
                    print("\n❌ Failed to install some dependencies")
                    return
                print("\n✅ System dependencies installed successfully!")
            else:
                print("\n⚠️ Skipping dependency installation")
                return

    # Check for .env file and OpenAI API key
    if not Path(".env").exists():
        print("\n⚠️ No .env file found. Creating one...")
        api_key = input("Please enter your OpenAI API key: ").strip()
        try:
            with open(".env", "w") as f:
                f.write(f"OPENAI_API_KEY={api_key}\n")
            print("✅ Created .env file with API key")
            
            # Verify the file was written correctly
            with open(".env", "r") as f:
                content = f.read().strip()
            if not content.startswith("OPENAI_API_KEY="):
                raise Exception("Failed to write API key correctly")
                
        except Exception as e:
            logger.error(f"Failed to create .env file: {str(e)}")
            print("\n❌ Error creating .env file")
            print("Please create it manually with your OpenAI API key")
            return
    
    # Create and setup Python virtual environment
    print("\n🔧 Setting up Python environment...")
    
    venv_path = Path(".venv")
    if venv_path.exists():
        print("\nExisting virtual environment found.")
        choice = input("Would you like to recreate it? (y/n): ").lower()
        if choice == 'y':
            try:
                import shutil
                shutil.rmtree(venv_path)
                print("Removed existing virtual environment.")
            except Exception as e:
                logger.error(f"Failed to remove existing venv: {e}")
                print("\n❌ Failed to remove existing virtual environment")
                return
    
    try:
        # Create new virtual environment using UV
        print("\nCreating virtual environment...")
        subprocess.run(["uv", "venv"], check=True)
        print("✅ Virtual environment created")
        
        # Install dependencies using UV
        print("\nInstalling Python dependencies...")
        subprocess.run(["uv", "pip", "install", "--upgrade", "pip"], check=True)
        
        # Install project in editable mode
        subprocess.run(["uv", "pip", "install", "-e", "."], check=True)
        print("✅ Dependencies installed")
        
        # Verify core dependencies
        try:
            subprocess.run([
                str(venv_path / "bin" / "python"), 
                "-c", 
                """
import uvicorn, ruamel.yaml, numpy, torch, requests, openai
from dotenv import load_dotenv
                """.strip()
            ], check=True)
            print("\n✅ Core dependencies verified")
        except subprocess.CalledProcessError:
            print("\n⚠️ Some dependencies may be missing.")
            print("Please try running the build command again.")
            return
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to setup Python environment: {e}")
        print("\n❌ Failed to setup Python environment")
        print("Please check the logs for more details")
        return
    
    print("\n✅ Build completed successfully!")
    print("\nYou can now:")
    print("1. Run 'python cli.py setup' to create configuration")
    print("2. Run 'python cli.py run' to start the server")

def find_venv():
    """Find and validate virtual environment"""
    venv_paths = [
        Path(".venv"),
        Path("venv"),
        Path(os.environ.get("VIRTUAL_ENV", ""))
    ]
    
    for venv_path in venv_paths:
        if venv_path.exists() and (venv_path / "bin" / "python").exists():
            logger.debug(f"Found virtual environment at: {venv_path}")
            return venv_path
    
    return None

def verify_dependencies(venv_path):
    """Verify required dependencies are installed"""
    logger.debug("Verifying dependencies...")
    
    try:
        # Try importing key dependencies
        result = subprocess.run(
            [str(venv_path / "bin" / "python"), "-c", 
             "import uvicorn, yaml, numpy, torch"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            logger.debug("Core dependencies verified")
            return True
    except Exception as e:
        logger.error(f"Error verifying dependencies: {e}")
    
    return False

def rebuild_python_with_openssl():
    """Rebuild Python with the correct OpenSSL version"""
    print("\n🔧 Rebuilding Python with OpenSSL...")
    try:
        # Get current Python version
        current_version = platform.python_version()
        logger.debug(f"Current Python version: {current_version}")
        
        # Install pyenv if not present
        try:
            subprocess.run(["pyenv", "--version"], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Installing pyenv...")
            subprocess.run(["brew", "install", "pyenv"], check=True)
        
        # Set OpenSSL environment variables for Python build
        build_env = os.environ.copy()
        openssl_path = subprocess.check_output(
            ["brew", "--prefix", "openssl@3"],
            text=True
        ).strip()
        
        build_env.update({
            "PYTHON_CONFIGURE_OPTS": f"--with-openssl={openssl_path}",
            "CFLAGS": f"-I{openssl_path}/include",
            "LDFLAGS": f"-L{openssl_path}/lib",
        })
        
        # Reinstall Python with OpenSSL 3
        print(f"Rebuilding Python {current_version} with OpenSSL 3...")
        subprocess.run(["pyenv", "install", "--force", current_version], env=build_env, check=True)
        subprocess.run(["pyenv", "global", current_version], check=True)
        
        print("✅ Python rebuilt successfully with OpenSSL 3")
        return True
    except Exception as e:
        logger.error(f"Failed to rebuild Python: {e}", exc_info=True)
        print(f"\n❌ Failed to rebuild Python: {e}")
        return False

def verify_ssl():
    """Verify SSL is working properly"""
    try:
        # Try importing ssl
        result = subprocess.run(
            [sys.executable, "-c", "import ssl; print(ssl.OPENSSL_VERSION)"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            logger.debug(f"OpenSSL version: {result.stdout.strip()}")
            return True
    except Exception as e:
        logger.error(f"SSL verification failed: {e}")
    return False

def check_ollama():
    """Check if Ollama is installed and running"""
    # First check if Ollama is installed
    if not check_ollama_installed():
        print("\n⚠️ Ollama is not installed.")
        choice = input("Would you like to install Ollama now? (y/n): ").lower()
        if choice == 'y':
            if not install_ollama():
                print("\n❌ Please install Ollama manually and try again")
                return False
        else:
            print("\n❌ Ollama is required for the server to function")
            return False

    # Check if server is running first
    try:
        requests.get("http://localhost:11434/api/version", timeout=2)
        print("✅ Ollama server is running")
    except:
        print("\n⚠️ Ollama server is not running")
        choice = input("Would you like to start the Ollama server now? (y/n): ").lower()
        if choice == 'y':
            try:
                print("Starting Ollama server...")
                # Start ollama server in background
                if platform.system() == "Darwin":  # macOS
                    subprocess.Popen(["ollama", "serve"], 
                                   stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL)
                else:
                    subprocess.Popen(["ollama", "serve"], 
                                   stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL,
                                   start_new_session=True)
                
                # Wait for server to start
                for _ in range(10):  # Try for 10 seconds
                    try:
                        requests.get("http://localhost:11434/api/version", timeout=1)
                        print("✅ Ollama server started successfully!")
                        break
                    except:
                        time.sleep(1)
                else:  # Server didn't start
                    print("❌ Failed to start Ollama server")
                    return False
            except Exception as e:
                print(f"❌ Failed to start Ollama server: {e}")
                return False
        else:
            print("\n❌ Ollama server is required to run the application")
            return False

    # Now check if the model is pulled
    try:
        print("\nChecking for required model...")
        result = subprocess.run(["ollama", "list"], check=True, capture_output=True, text=True)
        if "qwen2.5" not in result.stdout:
            print("\n📥 Pulling required model (qwen2.5)...")
            try:
                subprocess.run(["ollama", "pull", "qwen2.5"], check=True)
                print("✅ Model downloaded successfully!")
            except subprocess.CalledProcessError as e:
                print(f"\n❌ Failed to pull model: {e}")
                print("Please check your internet connection and try again")
                return False
        else:
            print("✅ Required model is already installed")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Failed to check models: {e}")
        print("Please ensure the Ollama server is running properly")
        return False

    return True

def verify_openai_key():
    """Verify that the OpenAI API key is valid"""
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        logger.error("OpenAI API key not found in environment variables")
        return False
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        logger.debug("Created OpenAI client")
        
        # Test API connection
        try:
            models = client.models.list()
            logger.debug("Successfully connected to OpenAI API")
            return True
        except Exception as e:
            logger.error(f"Failed to list models: {str(e)}")
            return False
            
    except ImportError as e:
        logger.error(f"Failed to import OpenAI package: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error verifying OpenAI key: {str(e)}")
        return False

def run_command():
    """Handle the run command - start the server"""
    print("\n=== Starting Server ===")
    
    if not ensure_required_packages():
        return
    
    # Check configuration
    user_config = Path("conf.yaml")
    if not user_config.exists():
        print("\n❌ Configuration file not found!")
        print("Running setup first...")
        setup_command()
    
    # Check OpenAI API key if using OpenAI
    try:
        with open("conf.yaml") as f:
            config = yaml.load(f)
        
        llm_provider = config['character_config']['agent_config']['agent_settings']['basic_memory_agent']['llm_provider']
        logger.debug(f"Using LLM provider: {llm_provider}")
        
        if llm_provider == "openai_llm":
            logger.info("Verifying OpenAI API key...")
            if not os.getenv("OPENAI_API_KEY"):
                print("\n❌ OpenAI API key not found in environment!")
                print("Please check that:")
                print("1. The .env file exists")
                print("2. The .env file contains OPENAI_API_KEY=your-key")
                print("3. The key format looks correct")
                return
                
            if not verify_openai_key():
                print("\n❌ OpenAI API key verification failed!")
                print("Please check:")
                print("1. Your API key is valid")
                print("2. You have proper internet connection")
                print("3. The OpenAI API is accessible")
                print("\nCheck the logs for detailed error information")
                return
            
            logger.info("OpenAI API key verified successfully")
            
    except Exception as e:
        logger.error(f"Error checking configuration: {str(e)}")
        print("\n❌ Failed to check configuration")
        print("Please run 'python cli.py setup' first")
        return
    
    # Verify SSL is working
    if not verify_ssl():
        print("\n⚠️ SSL is not working properly.")
        if platform.system() == "Darwin":
            print("This might be due to Python being built against the wrong OpenSSL version.")
            choice = input("Would you like to rebuild Python with OpenSSL 3? (y/n): ").lower()
            if choice == 'y':
                if rebuild_python_with_openssl():
                    print("\n✅ Python rebuilt successfully. Please restart the CLI.")
                    return
                else:
                    print("\n❌ Failed to rebuild Python.")
                    return
            else:
                print("\n⚠️ Continuing without rebuilding Python...")
    
    # Find virtual environment
    venv_path = find_venv()
    if not venv_path:
        print("\n❌ No virtual environment found!")
        print("Running build to create environment...")
        build_command()
        venv_path = find_venv()
        if not venv_path:
            print("\n❌ Failed to create virtual environment")
            return
    
    # Verify dependencies
    if not verify_dependencies(venv_path):
        print("\n⚠️ Some dependencies are missing.")
        choice = input("Would you like to install missing dependencies? (y/n): ").lower()
        if choice == 'y':
            try:
                print("\nInstalling dependencies...")
                subprocess.run(
                    [str(venv_path / "bin" / "uv"), "pip", "install", "-e", "."],
                    check=True
                )
                print("✅ Dependencies installed")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to install dependencies: {e}")
                print("\n❌ Failed to install dependencies")
                return
        else:
            print("\n⚠️ Continuing without installing dependencies...")
    
    print("\n🚀 Starting server...")
    try:
        # Add environment variables for OpenSSL
        env = os.environ.copy()
        if platform.system() == "Darwin":
            try:
                # Try OpenSSL 3 first
                openssl_path = subprocess.check_output(
                    ["brew", "--prefix", "openssl@3"],
                    text=True
                ).strip()
            except subprocess.CalledProcessError:
                try:
                    # Fallback to OpenSSL 1.1
                    openssl_path = subprocess.check_output(
                        ["brew", "--prefix", "openssl@1.1"],
                        text=True
                    ).strip()
                except subprocess.CalledProcessError:
                    logger.error("Neither OpenSSL 3 nor 1.1 found")
                    print("\n❌ OpenSSL not found. Please run build command first.")
                    return
                
            logger.debug(f"Using OpenSSL from: {openssl_path}")
            
            # Set OpenSSL environment variables
            env.update({
                "LDFLAGS": f"-L{openssl_path}/lib",
                "CPPFLAGS": f"-I{openssl_path}/include",
                "PKG_CONFIG_PATH": f"{openssl_path}/lib/pkgconfig",
                "DYLD_LIBRARY_PATH": f"{openssl_path}/lib",
                "OPENSSL_DIR": openssl_path,
                "OPENSSL_ROOT_DIR": openssl_path,
            })
            
            logger.debug("OpenSSL environment variables set")
        
        # Run server using the virtual environment's Python
        python_path = venv_path / "bin" / "python"
        subprocess.run([str(python_path), "run_server.py"], env=env, check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Server startup failed: {e}")
        print(f"\n❌ Error starting server: {e}")
        
        if platform.system() == "Darwin":
            print("\nTry running 'python cli.py build' to fix dependency issues")
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        print(f"\n❌ Unexpected error: {e}")

def select_llm_provider():
    """Prompt user to choose LLM provider"""
    while True:
        print("\nPlease choose your LLM provider:")
        print("1. OpenAI (GPT-4/3.5)")
        print("2. Claude")
        print("3. Ollama")
        print("4. Other")
        choice = input("Enter choice (1-4): ").strip()
        
        if choice == "1":
            return {
                "provider": "openai_llm",
                "model": input("\nEnter model name (default: gpt-4): ").strip() or "gpt-4"
            }
        elif choice == "2":
            return {
                "provider": "claude_llm",
                "model": input("\nEnter model name (default: claude-3-haiku-20240307): ").strip() or "claude-3-haiku-20240307"
            }
        elif choice == "3":
            return {
                "provider": "ollama_llm",
                "model": input("\nEnter model name (default: qwen2.5): ").strip() or "qwen2.5"
            }
        elif choice == "4":
            print("\nAvailable providers:")
            print("- openai_compatible_llm")
            print("- llama_cpp_llm")
            print("- gemini_llm")
            print("- zhipu_llm")
            print("- deepseek_llm")
            print("- groq_llm")
            print("- mistral_llm")
            provider = input("\nEnter provider name: ").strip()
            model = input("Enter model name: ").strip()
            return {"provider": provider, "model": model}
        else:
            print("Invalid choice. Please enter 1-4.")

def main():
    # Create the main parser
    parser = argparse.ArgumentParser(
        description='Open-LLM-VTuber CLI - Setup and run your VTuber server'
    )
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Setup command
    setup_parser = subparsers.add_parser('setup', help='Create or update server configuration')
    
    # Run command
    run_parser = subparsers.add_parser('run', help='Start the server')
    
    # Parse arguments
    args = parser.parse_args()
    
    # If no command is provided, show interactive menu
    if not args.command:
        show_main_menu()
        return
    
    # Handle commands
    if args.command == 'setup':
        setup_command()
    elif args.command == 'run':
        run_command()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}") 