"""FastAPI routes for WLASL and Sign MNIST training, status, and prediction."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.modules.component_04_sign_avatar_lecture_generator.models.sign_mnist import (
    SignMnistModelInfoModel,
    SignMnistPredictRequestModel,
    SignMnistPredictResponseModel,
    SignMnistStatusModel,
    SignMnistTrainRequestModel,
    SignMnistTrainResponseModel,
)
from src.modules.component_04_sign_avatar_lecture_generator.models.wlasl import (
    WlaslLabelsResponseModel,
    WlaslModelInfoModel,
    WlaslPredictRequestModel,
    WlaslPredictResponseModel,
    WlaslStatusModel,
    WlaslTrainRequestModel,
    WlaslTrainResponseModel,
)
from src.modules.component_04_sign_avatar_lecture_generator.services import (
    sign_mnist_service,
    wlasl_pipeline_service,
)
from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_enrichment import (
    invalidate_cache as invalidate_wlasl_cache,
)
from src.modules.component_04_sign_avatar_lecture_generator.services.wlasl_pipeline_service import (
    get_landmark_sequence_async,
)


router = APIRouter(prefix="/api/signs", tags=["WLASL Signs"])


@router.get("/labels", response_model=WlaslLabelsResponseModel)
async def get_sign_labels():
    """Return generated WLASL labels.csv records."""
    return await wlasl_pipeline_service.get_labels_preview_async()


@router.get("/status", response_model=WlaslStatusModel)
async def get_sign_status():
    """Return current WLASL dataset/model pipeline status."""
    return await wlasl_pipeline_service.get_status_summary_async()


@router.post("/train", response_model=WlaslTrainResponseModel)
async def train_sign_model(payload: WlaslTrainRequestModel):
    """Launch the WLASL LSTM training script in the background."""
    try:
        result = await wlasl_pipeline_service.launch_training_job_async(payload.model_dump())
        # Invalidate the enrichment label-map cache so the new model is picked up
        # on the next call to generate_sign_avatar_sequence.
        invalidate_wlasl_cache()
        return result
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/predict", response_model=WlaslPredictResponseModel)
async def predict_sign(payload: WlaslPredictRequestModel):
    """Predict a sign label from processed landmarks or a provided sequence."""
    try:
        return await wlasl_pipeline_service.predict_from_landmarks_async(payload.model_dump())
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/model-info", response_model=WlaslModelInfoModel)
async def get_sign_model_info():
    """Return saved model, metrics, and label-map metadata."""
    return await wlasl_pipeline_service.get_model_info_async()


@router.get("/landmark-sequence/{gloss_word}")
async def get_landmark_sequence(gloss_word: str):
    """Return a time-indexed frame sequence (pose + hand landmarks) for one gloss word.

    Used by the frontend sign avatar player to animate the 2D canvas avatar with
    WLASL-derived motion data. Falls back to a deterministic synthetic pose when
    no extracted landmark files exist for the requested word.
    """
    return await get_landmark_sequence_async(gloss_word)


@router.get("/mnist/status", response_model=SignMnistStatusModel)
async def get_sign_mnist_status():
    """Return current Sign MNIST archive dataset and model pipeline status."""
    return await sign_mnist_service.get_status_summary_async()


@router.post("/mnist/train", response_model=SignMnistTrainResponseModel)
async def train_sign_mnist(payload: SignMnistTrainRequestModel):
    """Launch the Sign MNIST alphabet training script in the background."""
    try:
        return await sign_mnist_service.launch_training_job_async(payload.model_dump())
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/mnist/predict", response_model=SignMnistPredictResponseModel)
async def predict_sign_mnist(payload: SignMnistPredictRequestModel):
    """Predict a static alphabet handshape from 784 grayscale pixels."""
    try:
        return await sign_mnist_service.predict_sign_mnist_async(payload.model_dump())
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/mnist/model-info", response_model=SignMnistModelInfoModel)
async def get_sign_mnist_model_info():
    """Return saved Sign MNIST model, metrics, and label-map metadata."""
    return await sign_mnist_service.get_model_info_async()
