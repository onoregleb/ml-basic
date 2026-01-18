import base64
import json
import os
import time
import uuid
from dataclasses import dataclass
from typing import Any, Optional

import requests


class GigaChatError(RuntimeError):
    pass


@dataclass
class GigaChatConfig:
    # Either provide client_id+client_secret OR authorization_key (base64 of "client_id:client_secret")
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    authorization_key: Optional[str] = None
    scope: str = "GIGACHAT_API_PERS"
    oauth_url: str = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    chat_completions_url: str = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    model: str = "GigaChat-Pro"
    verify_ssl: bool = True
    ca_bundle: Optional[str] = None
    timeout_seconds: int = 30


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def load_gigachat_config() -> Optional[GigaChatConfig]:
    authorization_key = os.getenv("GIGACHAT_AUTHORIZATION_KEY")
    client_id = os.getenv("GIGACHAT_CLIENT_ID")
    client_secret = os.getenv("GIGACHAT_CLIENT_SECRET")
    if not authorization_key and (not client_id or not client_secret):
        return None

    return GigaChatConfig(
        client_id=client_id,
        client_secret=client_secret,
        authorization_key=authorization_key,
        scope=os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS"),
        oauth_url=os.getenv("GIGACHAT_OAUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"),
        chat_completions_url=os.getenv(
            "GIGACHAT_CHAT_COMPLETIONS_URL", "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
        ),
        model=os.getenv("GIGACHAT_MODEL", "GigaChat-Pro"),
        verify_ssl=_env_bool("GIGACHAT_VERIFY_SSL", True),
        ca_bundle=os.getenv("GIGACHAT_CA_BUNDLE"),
        timeout_seconds=int(os.getenv("GIGACHAT_TIMEOUT_SECONDS", "30")),
    )


def _basic_auth_header(client_id: str, client_secret: str) -> str:
    token = f"{client_id}:{client_secret}".encode("utf-8")
    return "Basic " + base64.b64encode(token).decode("ascii")


def _basic_auth_header_from_key(authorization_key: str) -> str:
    # The key is already base64(client_id:client_secret)
    return "Basic " + authorization_key.strip()


def _extract_json_object(text: str) -> Optional[dict[str, Any]]:
    """
    Best-effort extraction of a JSON object from a model response.
    """
    if not text:
        return None
    # Try full parse first
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass

    # Try to find first {...} block
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = text[start : end + 1]
    try:
        obj = json.loads(candidate)
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


class GigaChatClient:
    def __init__(self, config: GigaChatConfig):
        self.config = config
        self._access_token: Optional[str] = None
        self._expires_at: float = 0.0

    def _get_access_token(self) -> str:
        # Reuse token with a small safety margin
        now = time.time()
        if self._access_token and now < (self._expires_at - 15):
            return self._access_token

        rq_uid = str(uuid.uuid4())
        if self.config.authorization_key:
            auth_header = _basic_auth_header_from_key(self.config.authorization_key)
        else:
            if not self.config.client_id or not self.config.client_secret:
                raise GigaChatError(
                    "GigaChat credentials are not configured. Set GIGACHAT_AUTHORIZATION_KEY or "
                    "GIGACHAT_CLIENT_ID and GIGACHAT_CLIENT_SECRET."
                )
            auth_header = _basic_auth_header(self.config.client_id, self.config.client_secret)

        headers = {
            "Authorization": auth_header,
            "RqUID": rq_uid,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        data = {"scope": self.config.scope}

        resp = requests.post(
            self.config.oauth_url,
            headers=headers,
            data=data,
            timeout=self.config.timeout_seconds,
            verify=(self.config.ca_bundle or self.config.verify_ssl),
        )
        if not resp.ok:
            raise GigaChatError(f"OAuth failed: HTTP {resp.status_code}: {resp.text}")

        payload = resp.json()
        token = payload.get("access_token")
        expires_in = payload.get("expires_in", 1800)  # docs say ~30 min
        if not token:
            raise GigaChatError(f"OAuth response missing access_token: {payload}")

        self._access_token = token
        self._expires_at = time.time() + float(expires_in)
        return token

    def grade_project_submission(self, assignment_text: str, submission_text: str) -> dict[str, Any]:
        """
        Returns a dict that includes parsed evaluation fields when possible.
        """
        token = self._get_access_token()

        system_prompt = (
            "Ты — строгий, но доброжелательный проверяющий проекта по машинному обучению. "
            "Твоя задача — оценить отчёт студента по заданию и вернуть JSON."
        )
        user_prompt = f"""
ЗАДАНИЕ (контекст):
{assignment_text}

ОТЧЁТ СТУДЕНТА:
{submission_text}

ПРАВИЛА ОТВЕТА:
- Верни ТОЛЬКО валидный JSON без пояснений и без Markdown.
- Формат:
{{
  "score": 0-100,
  "passed": true|false,
  "summary": "1-3 предложения",
  "strengths": ["..."],
  "improvements": ["..."],
  "rubric": {{
    "data_and_features": 0-20,
    "model_choice": 0-20,
    "k_selection": 0-20,
    "segment_interpretation": 0-20,
    "business_recommendations": 0-20
  }}
}}
- Проставь passed=true если score >= 70.
""".strip()

        body = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 800,
        }

        resp = requests.post(
            self.config.chat_completions_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=body,
            timeout=self.config.timeout_seconds,
            verify=(self.config.ca_bundle or self.config.verify_ssl),
        )
        if not resp.ok:
            raise GigaChatError(f"Chat completion failed: HTTP {resp.status_code}: {resp.text}")

        payload = resp.json()
        content: str = ""
        try:
            content = payload["choices"][0]["message"]["content"]
        except Exception:
            content = ""

        parsed = _extract_json_object(content)
        return {
            "raw": payload,
            "text": content,
            "parsed": parsed,
        }

