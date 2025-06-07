from typing import List, Generic, TypeVar
from pydantic import BaseModel

# 定义一个类型变量用于泛型分页响应模型
DataType = TypeVar('DataType')

class PaginatedResponse(BaseModel, Generic[DataType]):
    """通用分页响应模型，包含总记录数和分页后的数据项列表"""
    total: int
    items: List[DataType] 