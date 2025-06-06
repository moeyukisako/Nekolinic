from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from jose import JWTError, jwt
from .core.config import settings
from .core.exceptions import (
    NekolicBaseException,
    ResourceNotFoundException,
    PatientNotFoundException,
    DoctorNotFoundException,
    MedicalRecordNotFoundException,
    ValidationException,
    AuthenticationException,
    AuthorizationException
)
from .core.auditing import register_audit_listeners
from .core.context import current_user_id

# 定义lifespan上下文管理器
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 应用启动时执行
    register_audit_listeners()
    yield
    # 应用关闭时执行
    # 此处可以添加资源清理代码

# 创建FastAPI应用
app = FastAPI(
    title="Nekolinic API",
    description="医疗诊所管理系统API",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 用户上下文中间件，用于设置当前用户ID
class UserContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 从认证头中获取用户ID
        user_id = None
        auth_header = request.headers.get("Authorization")
        
        if auth_header and auth_header.startswith("Bearer "):
            # 获取令牌
            token = auth_header.split("Bearer ")[1]
            try:
                # 解析JWT令牌
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                username: str = payload.get("sub")
                
                if username:
                    # 如果令牌有效，查询数据库获取用户ID
                    # 注意：这是一个简化实现，理想情况下应该将用户ID直接存储在令牌中
                    from app.user import service as user_service
                    from sqlalchemy.orm import Session
                    from app.core.database import SessionLocal
                    
                    db = SessionLocal()
                    try:
                        user = user_service.user_service.get_by_attributes(db, username=username)
                        if user:
                            user_id = user.id
                    finally:
                        db.close()
            except JWTError:
                # 令牌无效，不设置用户ID
                pass
        
        # 设置上下文变量
        token = None
        if user_id:
            token = current_user_id.set(user_id)
        
        # 处理请求
        response = await call_next(request)
        
        # 重置上下文变量
        if token:
            current_user_id.reset(token)
        
        return response

# 注册中间件
app.add_middleware(UserContextMiddleware)

# 注册全局异常处理器
@app.exception_handler(PatientNotFoundException)
async def patient_not_found_exception_handler(request: Request, exc: PatientNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": f"找不到ID为 {exc.patient_id} 的患者"},
    )

@app.exception_handler(DoctorNotFoundException)
async def doctor_not_found_exception_handler(request: Request, exc: DoctorNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": f"找不到ID为 {exc.doctor_id} 的医生"},
    )

@app.exception_handler(MedicalRecordNotFoundException)
async def record_not_found_exception_handler(request: Request, exc: MedicalRecordNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": f"找不到ID为 {exc.record_id} 的病历"},
    )

@app.exception_handler(ResourceNotFoundException)
async def resource_not_found_exception_handler(request: Request, exc: ResourceNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": f"找不到ID为 {exc.resource_id} 的 {exc.resource_type}"},
    )

@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message, "errors": exc.errors},
    )

@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": exc.message},
        headers={"WWW-Authenticate": "Bearer"}
    )

@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"message": exc.message},
    )

@app.exception_handler(NekolicBaseException)
async def nekolic_base_exception_handler(request: Request, exc: NekolicBaseException):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": exc.message},
    )

# 根路由
@app.get("/")
def read_root():
    return {"message": "欢迎使用Nekolinic医疗诊所管理系统API"}

# 导入并挂载各模块的路由器
from .routes import router as api_router
app.include_router(api_router, prefix="/api/v1")
