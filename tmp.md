C:\Users\admin\Desktop\Nekolinic>python main.py
前端目录路径: C:\Users\admin\Desktop\Nekolinic\frontend
前端目录是否存在: True
前端目录中的文件: ['assets', 'config', 'css', 'dashboard.html', 'debug_bill_modal.html', 'debug_bill_real_css.html', 'debug_bill_simple.html', 'index.html', 'js', 'test_bill_modal.html', 'test_bill_modal_final.html', 'test_bill_modal_fixed.html', 'test_dashboard_notification.html', 'test_fixed_bill_modal.html', 'test_new_bill_modal.html', 'test_notification.html', 'test_shownotification_debug.html', 'utils']
INFO:     Started server process [7768]
INFO:     Waiting for application startup.
管理员用户已存在，无需初始化
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     127.0.0.1:2827 - "GET /api/v1/users/me HTTP/1.1" 200 OK
INFO:     127.0.0.1:2828 - "GET /config/settings.json HTTP/1.1" 304 Not Modified
INFO:     127.0.0.1:2827 - "GET /utils/i18n.js HTTP/1.1" 304 Not Modified
INFO:     127.0.0.1:2827 - "GET /api/v1/users/settings HTTP/1.1" 200 OK
INFO:     127.0.0.1:2827 - "GET /api/v1/users/me HTTP/1.1" 200 OK
INFO:     127.0.0.1:2827 - "GET /utils/i18n.js HTTP/1.1" 304 Not Modified
INFO:     127.0.0.1:2827 - "GET /api/v1/users/me HTTP/1.1" 200 OK
INFO:     127.0.0.1:2827 - "GET /api/v1/users/settings HTTP/1.1" 200 OK
INFO:     127.0.0.1:2827 - "GET /api/v1/patients/?skip=0&limit=10 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Python313\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |                ~~~~~~~~~~~~~~~~~~~~~~~^^
    |   File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    |         "unhandled errors in a TaskGroup", self._exceptions
    |     ) from None
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Python313\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |         self.scope, self.receive, self.send
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |                                    ~~~~~~~~~~~~~~~~~~^^
    |   File "C:\Python313\Lib\contextlib.py", line 162, in __exit__
    |     self.gen.throw(value)
    |     ~~~~~~~~~~~~~~^^^^^^^
    |   File "C:\Python313\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\admin\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 327, in app
    |     content = await serialize_response(
    |               ^^^^^^^^^^^^^^^^^^^^^^^^^
    |     ...<9 lines>...
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 168, in serialize_response
    |     value, errors_ = await run_in_threadpool(
    |                      ^^^^^^^^^^^^^^^^^^^^^^^^
    |         field.validate, response_content, {}, loc=("response",)
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |         func, args, abandon_on_cancel=abandon_on_cancel, limiter=limiter
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |   File "C:\Python313\Lib\site-packages\fastapi\_compat.py", line 129, in validate
    |     self._type_adapter.validate_python(value, from_attributes=True),
    |     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\pydantic\type_adapter.py", line 421, in validate_python
    |     return self.validator.validate_python(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\pydantic\_internal\_mock_val_ser.py", line 100, in __getattr__
    |     raise PydanticUserError(self._error_message, code=self._code)
    | pydantic.errors.PydanticUserError: `TypeAdapter[typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]]` is not fully defined; you should define `typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]` and all referenced types, then call `.rebuild()` on the instance.
    |
    | For further information visit https://errors.pydantic.dev/2.11/u/class-not-fully-defined
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Python313\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        self.scope, self.receive, self.send
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
                                   ~~~~~~~~~~~~~~~~~~^^
  File "C:\Python313\Lib\contextlib.py", line 162, in __exit__
    self.gen.throw(value)
    ~~~~~~~~~~~~~~^^^^^^^
  File "C:\Python313\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\admin\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Python313\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 327, in app
    content = await serialize_response(
              ^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<9 lines>...
    )
    ^
  File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 168, in serialize_response
    value, errors_ = await run_in_threadpool(
                     ^^^^^^^^^^^^^^^^^^^^^^^^
        field.validate, response_content, {}, loc=("response",)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        func, args, abandon_on_cancel=abandon_on_cancel, limiter=limiter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
  File "C:\Python313\Lib\site-packages\fastapi\_compat.py", line 129, in validate
    self._type_adapter.validate_python(value, from_attributes=True),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\pydantic\type_adapter.py", line 421, in validate_python
    return self.validator.validate_python(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\pydantic\_internal\_mock_val_ser.py", line 100, in __getattr__
    raise PydanticUserError(self._error_message, code=self._code)
pydantic.errors.PydanticUserError: `TypeAdapter[typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]]` is not fully defined; you should define `typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]` and all referenced types, then call `.rebuild()` on the instance.

For further information visit https://errors.pydantic.dev/2.11/u/class-not-fully-defined
INFO:     127.0.0.1:2828 - "GET /api/v1/patients/?skip=0&limit=10 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Python313\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |                ~~~~~~~~~~~~~~~~~~~~~~~^^
    |   File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    |         "unhandled errors in a TaskGroup", self._exceptions
    |     ) from None
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Python313\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |         self.scope, self.receive, self.send
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |                                    ~~~~~~~~~~~~~~~~~~^^
    |   File "C:\Python313\Lib\contextlib.py", line 162, in __exit__
    |     self.gen.throw(value)
    |     ~~~~~~~~~~~~~~^^^^^^^
    |   File "C:\Python313\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\admin\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Python313\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 327, in app
    |     content = await serialize_response(
    |               ^^^^^^^^^^^^^^^^^^^^^^^^^
    |     ...<9 lines>...
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 168, in serialize_response
    |     value, errors_ = await run_in_threadpool(
    |                      ^^^^^^^^^^^^^^^^^^^^^^^^
    |         field.validate, response_content, {}, loc=("response",)
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |         func, args, abandon_on_cancel=abandon_on_cancel, limiter=limiter
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |     )
    |     ^
    |   File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |   File "C:\Python313\Lib\site-packages\fastapi\_compat.py", line 129, in validate
    |     self._type_adapter.validate_python(value, from_attributes=True),
    |     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\pydantic\type_adapter.py", line 421, in validate_python
    |     return self.validator.validate_python(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Python313\Lib\site-packages\pydantic\_internal\_mock_val_ser.py", line 100, in __getattr__
    |     raise PydanticUserError(self._error_message, code=self._code)
    | pydantic.errors.PydanticUserError: `TypeAdapter[typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]]` is not fully defined; you should define `typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]` and all referenced types, then call `.rebuild()` on the instance.
    |
    | For further information visit https://errors.pydantic.dev/2.11/u/class-not-fully-defined
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Python313\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        self.scope, self.receive, self.send
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
                                   ~~~~~~~~~~~~~~~~~~^^
  File "C:\Python313\Lib\contextlib.py", line 162, in __exit__
    self.gen.throw(value)
    ~~~~~~~~~~~~~~^^^^^^^
  File "C:\Python313\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\admin\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Python313\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Python313\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Python313\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Python313\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 327, in app
    content = await serialize_response(
              ^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<9 lines>...
    )
    ^
  File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 168, in serialize_response
    value, errors_ = await run_in_threadpool(
                     ^^^^^^^^^^^^^^^^^^^^^^^^
        field.validate, response_content, {}, loc=("response",)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        func, args, abandon_on_cancel=abandon_on_cancel, limiter=limiter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
  File "C:\Python313\Lib\site-packages\fastapi\_compat.py", line 129, in validate
    self._type_adapter.validate_python(value, from_attributes=True),
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\pydantic\type_adapter.py", line 421, in validate_python
    return self.validator.validate_python(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Python313\Lib\site-packages\pydantic\_internal\_mock_val_ser.py", line 100, in __getattr__
    raise PydanticUserError(self._error_message, code=self._code)
pydantic.errors.PydanticUserError: `TypeAdapter[typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]]` is not fully defined; you should define `typing.Annotated[app.core.schemas.PaginatedResponse[Patient], FieldInfo(annotation=PaginatedResponse[Patient], required=True)]` and all referenced types, then call `.rebuild()` on the instance.

For further information visit https://errors.pydantic.dev/2.11/u/class-not-fully-defined