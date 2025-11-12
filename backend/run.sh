#!/bin/bash

# Define the input and output file paths
input_file="src/ui/frontend/assets/main-DsLaT6SU.js"
output_file="src/ui/frontend/assets/live2d_volume_lip_sync.js"

# Use grep to filter lines related to specific Live2D, Canvas, and PixiJS functionalities
# Modify the patterns as needed to match the relevant code sections
grep -E "live2d\.min|MotionManager|mouthSync|AnalyserNode|Live2DModel|CanvasRenderer|pixi\.js|PIXI\.Application" "$input_file" > "$output_file"

echo "Filtered code has been copied to $output_file"



curl -v -X POST "http://localhost:8000/convert" \
     -F "audio_file=@/Users/michaelholborn/Documents/SoftwareLocal/payments/noice/aipayment/noice/VTUBERGALORE/Open-LLM-VTuber/edgetts_output.wav" \
     -F "pitch_shift=0" \
     -F "method=rmvpe" \
     -F "index_rate=0.7" \
     -F "protect=0.5" \
     -F "output_volume=1.0" \
     --output converted.wav