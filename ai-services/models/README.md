# AI Model Weights (Not Committed)

This folder holds local AI/ML model weights and caches used by the AI services. To keep the repository lightweight and avoid committing large binaries, this directory is ignored by Git via the project root `.gitignore`.

What to place here:
- FER weights (e.g., `FER_static_ResNet50_AffectNet.pt`, `FER_dinamic_LSTM_Aff-Wild2.pt`)
- Hugging Face caches (if using local files)
- Any additional model artifacts required by services

How to obtain weights:
- Follow the instructions in `ai-services/models/face_emotion_recognition/README.md` for Emo-AffectNet.
- Or configure the service to download/cache models on first run if supported.

Note: If you share the project, document how teammates can fetch the models.
