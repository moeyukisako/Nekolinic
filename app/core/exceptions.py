class NekolicBaseException(Exception):
    """
    所有自定义异常的基类
    """
    def __init__(self, message: str = "An error occurred"):
        self.message = message
        super().__init__(self.message)


class ResourceNotFoundException(NekolicBaseException):
    """
    资源未找到异常的通用基类
    """
    def __init__(self, resource_type: str, resource_id: int):
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} with id {resource_id} not found")


class PatientNotFoundException(ResourceNotFoundException):
    """
    病患未找到异常
    """
    def __init__(self, patient_id: int):
        super().__init__("Patient", patient_id)
        self.patient_id = patient_id


class DoctorNotFoundException(ResourceNotFoundException):
    """
    医生未找到异常
    """
    def __init__(self, doctor_id: int):
        super().__init__("Doctor", doctor_id)
        self.doctor_id = doctor_id


class MedicalRecordNotFoundException(ResourceNotFoundException):
    """
    病历未找到异常
    """
    def __init__(self, record_id: int):
        super().__init__("Medical Record", record_id)
        self.record_id = record_id


class ValidationException(NekolicBaseException):
    """
    数据验证异常
    """
    def __init__(self, message: str = "Validation error", errors: dict = None):
        self.errors = errors or {}
        super().__init__(message)


class AuthenticationException(NekolicBaseException):
    """
    认证异常
    """
    pass


class AuthorizationException(NekolicBaseException):
    """
    授权异常
    """
    pass


class BusinessLogicException(NekolicBaseException):
    """
    业务逻辑异常
    """
    pass
