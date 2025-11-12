import sys
import os
import tempfile
from pathlib import Path

import edge_tts
import soundfile as sf
from loguru import logger
from .tts_interface import TTSInterface
from ..rvc.inferrvc import VC
from ..rvc.inferrvc.pipeline.main import Pipeline
import faiss

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Set RVC environment variables
os.environ["index_root"] = os.path.join(os.path.dirname(current_dir), "models", "rvc")

# Check out doc at https://github.com/rany2/edge-tts
# Use `edge-tts --list-voices` to list all available voices


class EdgeTTSEngine(TTSInterface):
    def __init__(self, voice="en-US-AvaMultilingualNeural", rvc_config=None):
        self.voice = voice
        self.rvc_config = rvc_config
        self.vc = None
        self.rvc_pipeline = None
        self.rvc_index = None
        self.rvc_big_npy = None

        self.temp_audio_file = "temp"
        self.file_extension = "mp3"
        self.new_audio_dir = "cache"

        if not os.path.exists(self.new_audio_dir):
            os.makedirs(self.new_audio_dir)

        # Initialize RVC if configured
        if self.rvc_config and self.rvc_config.get("use_rvc", False):
            try:
                # Initialize VC
                self.vc = VC()
                # Load the RVC model with both protect values
                self.vc.get_vc(
                    self.rvc_config.get("model_path", "models/rvc/houshou/added_IVF405_Flat_nprobe_1_Houshou_Marine_v2.pth"),
                    0.5,  # First protect value
                    self.rvc_config.get("protect", 0.25)  # Second protect value
                )

                # Pre-load the index file
                index_path = self.rvc_config.get("index_path", "models/rvc/houshou/added_IVF405_Flat_nprobe_1_Houshou_Marine_v2.index")
                if os.path.exists(index_path):
                    try:
                        self.rvc_index = faiss.read_index(index_path)
                        self.rvc_big_npy = self.rvc_index.reconstruct_n(0, self.rvc_index.ntotal)
                        logger.info("RVC index pre-loaded successfully")
                    except Exception as e:
                        logger.error(f"Failed to pre-load RVC index: {e}")
                        self.rvc_index = None
                        self.rvc_big_npy = None

                # Initialize pipeline with pre-loaded components
                if self.vc and self.rvc_index is not None:
                    self.rvc_pipeline = Pipeline(
                        tgt_sr=44100,  # Target sample rate
                        config=self.vc.config
                    )
                    logger.info("RVC pipeline initialized successfully")

                logger.info("RVC model and components pre-loaded successfully")
            except Exception as e:
                logger.error(f"Failed to initialize RVC: {e}")
                self.vc = None
                self.rvc_pipeline = None
                self.rvc_index = None
                self.rvc_big_npy = None

    def generate_audio(self, text, file_name_no_ext=None):
        """
        Generate speech audio file using TTS.
        text: str
            the text to speak
        file_name_no_ext: str
            name of the file without extension

        Returns:
        str: the path to the generated audio file
        """
        file_name = self.generate_cache_file_name(file_name_no_ext, self.file_extension)

        try:
            communicate = edge_tts.Communicate(text, self.voice)
            communicate.save_sync(file_name)
        except Exception as e:
            logger.critical(f"\nError: edge-tts unable to generate audio: {e}")
            logger.critical("It's possible that edge-tts is blocked in your region.")
            return None

        # Apply RVC if configured and components are pre-loaded
        if (self.rvc_config and self.rvc_config.get("use_rvc", False) and 
            self.vc and self.rvc_pipeline and self.rvc_index is not None):
            try:
                # Convert the audio using RVC with optimized parameters
                tgt_sr, audio_opt, times, info = self.vc.vc_inference(
                    sid=0,  # Using first speaker
                    input_audio_path=Path(file_name),
                    f0_up_key=self.rvc_config.get("f0_up_key", 0),
                    f0_method=self.rvc_config.get("f0_method", "rmvpe"),  # rmvpe is faster than harvest
                    index_file=Path(self.rvc_config.get("index_path", "models/rvc/houshou/added_IVF405_Flat_nprobe_1_Houshou_Marine_v2.index")),
                    index_rate=self.rvc_config.get("index_rate", 0.3),  # Further reduced for faster processing
                    filter_radius=self.rvc_config.get("filter_radius", 2),  # Reduced for faster processing
                    rms_mix_rate=self.rvc_config.get("rms_mix_rate", 0.15),  # Reduced for faster processing
                    protect=self.rvc_config.get("protect", 0.25)  # Reduced for faster processing
                )

                if info:
                    logger.error(f"Error in RVC conversion: {info}")
                    return file_name

                # Save the converted audio
                if audio_opt is not None:
                    # Create a temporary file for the converted audio
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                        sf.write(temp_file.name, audio_opt, tgt_sr)
                        # Replace the original file with the converted one
                        os.replace(temp_file.name, file_name)
                        logger.info("RVC conversion completed successfully")

            except Exception as e:
                logger.error(f"Error in RVC conversion: {e}")
                return file_name

        return file_name


# en-US-AvaMultilingualNeural
# en-US-EmmaMultilingualNeural
# en-US-JennyNeural
