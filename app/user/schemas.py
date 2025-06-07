from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

# --- Token 相关 ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User 相关 ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    background_preference: Optional[str] = None

class UserCreate(UserBase):
    username: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    background_preference: Optional[str] = None

class User(UserBase):
    id: int
    username: str
    
    model_config = ConfigDict(from_attributes=True)

# --- 用户偏好更新 ---
class UserPreferenceUpdate(BaseModel):
    background_preference: Optional[str] = None 