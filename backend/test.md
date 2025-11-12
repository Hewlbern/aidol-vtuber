curl -v -X POST "http://localhost:8000/convert" \
     -F "audio_file=@/Users/michaelholborn/Documents/SoftwareLocal/payments/noice/aipayment/noice/VTUBERGALORE/Open-LLM-VTuber/harvard.wav" \
     -F "pitch_shift=0" \
     -F "method=rmvpe" \
     -F "index_rate=0.7" \
     -F "protect=0.5" \
     -F "output_volume=1.0" \
     --output converted.wav