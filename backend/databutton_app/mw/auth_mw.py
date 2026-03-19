import functools
from http import HTTPStatus
from typing import Annotated, Callable
import jwt
from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.requests import HTTPConnection
from jwt import PyJWKClient
from pydantic import BaseModel
from starlette.requests import Request


class AuthConfig(BaseModel):
    issuer: str
    jwks_url: str
    audience: str | None = None
    audiences: tuple[str, ...] = ()


class User(BaseModel):
    # The subject, or user ID, from the authenticated token
    sub: str

    # Optional extra user data
    user_id: str | None = None
    name: str | None = None
    picture: str | None = None
    email: str | None = None


def get_auth_configs(request: HTTPConnection) -> list[AuthConfig]:
    auth_configs: list[AuthConfig] | None = request.app.state.auth_configs

    if auth_configs is None or len(auth_configs) == 0:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="No auth config"
        )
    return auth_configs


AuthConfigsDep = Annotated[list[AuthConfig], Depends(get_auth_configs)]


def get_audit_log(request: HTTPConnection) -> Callable[[str], None] | None:
    return getattr(request.app.state.databutton_app_state, "audit_log", None)


AuditLogDep = Annotated[Callable[[str], None] | None, Depends(get_audit_log)]


def get_authorized_user(
    request: HTTPConnection,
    auth_configs: AuthConfigsDep,
) -> User:
    try:
        if isinstance(request, WebSocket):
            user = authorize_websocket(request, auth_configs)
        elif isinstance(request, Request):
            user = authorize_request(request, auth_configs)
        else:
            raise ValueError("Unexpected request type")

        if user is not None:
            return user
        pass
    except Exception as e:
        pass

    if isinstance(request, WebSocket):
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated"
        )
    else:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="Not authenticated"
        )


AuthorizedUser = Annotated[User, Depends(get_authorized_user)]


@functools.cache
def get_jwks_client(url: str):
    """Reuse client cached by its url, client caches keys by default."""
    return PyJWKClient(url, cache_keys=True)


def get_signing_key(url: str, token: str) -> tuple[str, str]:
    client = get_jwks_client(url)
    signing_key = client.get_signing_key_from_jwt(token)
    key = signing_key.key
    alg = signing_key.algorithm_name
    if alg not in ("RS256", "ES256"):
        raise ValueError(f"Unsupported signing algorithm: {alg}")
    return (key, alg)


def authorize_websocket(
    request: WebSocket,
    auth_configs: list[AuthConfig],
) -> User | None:
    # Parse Sec-Websocket-Protocol
    header = "Sec-Websocket-Protocol"
    sep = ","
    prefix = "Authorization.Bearer."
    protocols_header = request.headers.get(header)
    protocols = (
        [h.strip() for h in protocols_header.split(sep)] if protocols_header else []
    )

    token: str | None = None
    for p in protocols:
        if p.startswith(prefix):
            token = p.removeprefix(prefix)
            break

    if not token:
        pass
        return None

    return authorize_token(token, auth_configs)


def authorize_request(
    request: Request,
    auth_configs: list[AuthConfig],
) -> User | None:
    auth_header = request.headers.get("authorization")
    if not auth_header:
        pass
        return None

    token = auth_header.startswith("Bearer ") and auth_header.removeprefix("Bearer ")
    if not token:
        pass
        return None

    return authorize_token(token, auth_configs)


def authorize_token(
    token: str,
    auth_configs: list[AuthConfig],
) -> User | None:
    # Partially parse token without verification to get issuer and audience
    try:
        unverified_payload = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False,
            },
        )
        token_iss: str | None = unverified_payload.get("iss")
        token_aud: str | None = unverified_payload.get("aud")
    except Exception as e:
        pass
        return None

    # Try to validate with each auth config
    for auth_config in auth_configs:
        # Check if issuer matches
        if token_iss != auth_config.issuer:
            continue

        # Determine expected audience
        audiences: tuple[str, ...] = (
            (auth_config.audience,) if auth_config.audience is not None else auth_config.audiences
        )
        
        if token_aud not in audiences:
            pass
            continue

        # Validate token with full verification
        try:
            key, alg = get_signing_key(auth_config.jwks_url, token)
        except Exception as e:
            pass
            continue

        try:
            payload = jwt.decode(
                token,
                key=key,
                algorithms=[alg],
                audience=token_aud,
            )
        except jwt.PyJWTError as e:
            pass
            continue

        # Parse user from payload
        try:
            user = User.model_validate(payload)
            pass
            return user
        except Exception as e:
            pass
            continue

    pass
    return None
