from contextvars import ContextVar
from typing import Optional

# 定义一个上下文变量，用于存储当前操作用户的ID
# 默认值为None，表示未设置
current_user_id: ContextVar[Optional[int]] = ContextVar("current_user_id", default=None)
