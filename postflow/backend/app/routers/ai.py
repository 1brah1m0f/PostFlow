from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
from app.core.config import settings
from app.routers.deps import get_current_user_id
from uuid import UUID

router = APIRouter(prefix="/ai", tags=["ai"])


class CaptionRequest(BaseModel):
    topic: Optional[str] = None
    image_url: Optional[str] = None


class CaptionResponse(BaseModel):
    caption: str


@router.post("/caption", response_model=CaptionResponse)
def generate_caption(
    payload: CaptionRequest,
    user_id: UUID = Depends(get_current_user_id),
):
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(503, "AI caption generation is not configured.")

    topic_line = f"Topic/context: {payload.topic}" if payload.topic else "No specific topic provided."
    has_image = "An image has been attached to this post." if payload.image_url else "No image attached."

    system_prompt = (
        "You are an expert Instagram content creator. "
        "Write engaging, authentic Instagram captions. "
        "Include relevant emojis and 5-10 hashtags at the end. "
        "Keep the tone warm and conversational. "
        "Output only the caption text — no explanations, no quotes around it."
    )

    user_prompt = (
        f"{topic_line}\n"
        f"{has_image}\n\n"
        "Write a compelling Instagram caption for this post."
    )

    try:
        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://postflow-1.onrender.com",
                "X-Title": "PostFlow",
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 400,
                "temperature": 0.8,
            },
            timeout=30,
        )
        response.raise_for_status()
        caption = response.json()["choices"][0]["message"]["content"].strip()
        return CaptionResponse(caption=caption)
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"OpenRouter error: {e.response.text}")
    except Exception as e:
        raise HTTPException(502, f"AI generation failed: {str(e)}")
