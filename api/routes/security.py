from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from pydantic.types import SecretType
from api.routes.signup import SECRET_KEY, Token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/signup")
ALGORITHM = "HS256"

class TokenData(BaseModel):
    email: str 

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate user credentials',
            headers={'WWW-Authenticate': 'Bearer'},
            )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) 

        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception

        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

