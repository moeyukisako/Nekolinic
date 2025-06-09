ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
INFO:     127.0.0.1:10006 - "GET /api/v1/pharmacy/medicines/1 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
INFO:     127.0.0.1:10027 - "GET /api/v1/pharmacy/medicines/1 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
INFO:     127.0.0.1:10028 - "GET /api/v1/pharmacy/medicines/?skip=0&limit=10 HTTP/1.1" 200 OK
INFO:     127.0.0.1:10028 - "POST /api/v1/pharmacy/inventory/bulk-stock-in HTTP/1.1" 200 OK
INFO:     127.0.0.1:10028 - "GET /api/v1/pharmacy/medicines/?skip=0&limit=10 HTTP/1.1" 200 OK
INFO:     127.0.0.1:10125 - "GET /api/v1/pharmacy/medicines/?skip=0&limit=10 HTTP/1.1" 200 OK
INFO:     127.0.0.1:10125 - "GET /.well-known/appspecific/com.chrome.devtools.json HTTP/1.1" 404 Not Found
INFO:     127.0.0.1:10125 - "GET /api/v1/pharmacy/medicines/2 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
INFO:     127.0.0.1:10126 - "GET /api/v1/pharmacy/inventory/drugs/2/history?skip=0&limit=20 HTTP/1.1" 200 OK
INFO:     127.0.0.1:10126 - "GET /api/v1/pharmacy/medicines/2 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
INFO:     127.0.0.1:13550 - "GET /dashboard.html HTTP/1.1" 200 OK
INFO:     127.0.0.1:13550 - "GET /.well-known/appspecific/com.chrome.devtools.json HTTP/1.1" 404 Not Found
INFO:     127.0.0.1:13550 - "GET /css/style.css HTTP/1.1" 200 OK
INFO:     127.0.0.1:13551 - "GET /css/medical-records.css HTTP/1.1" 200 OK
INFO:     127.0.0.1:13551 - "GET /css/prescription-manager.css HTTP/1.1" 200 OK
INFO:     127.0.0.1:13550 - "GET /js/apiClient.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13551 - "GET /js/main.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13550 - "GET /utils/i18n.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13550 - "GET /js/utils/ui.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13551 - "GET /js/utils/configManager.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13551 - "GET /config/settings.json HTTP/1.1" 304 Not Modified
INFO:     127.0.0.1:13555 - "GET /js/modules/patientManager.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13551 - "GET /js/modules/medicalRecords.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13550 - "GET /api/v1/users/me HTTP/1.1" 200 OK
INFO:     127.0.0.1:13556 - "GET /js/modules/medicineManager.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13557 - "GET /js/modules/prescriptionManager.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13558 - "GET /js/modules/settingsManager.js HTTP/1.1" 200 OK
INFO:     127.0.0.1:13558 - "GET /api/v1/users/settings HTTP/1.1" 200 OK
INFO:     127.0.0.1:13558 - "GET /api/v1/pharmacy/medicines/?skip=0&limit=10 HTTP/1.1" 200 OK
INFO:     127.0.0.1:13558 - "GET /api/v1/pharmacy/medicines/?skip=0&limit=10 HTTP/1.1" 200 OK
INFO:     127.0.0.1:13558 - "GET /api/v1/pharmacy/medicines/1 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
INFO:     127.0.0.1:13557 - "GET /api/v1/pharmacy/inventory/drugs/1/history?skip=0&limit=20 HTTP/1.1" 200 OK
INFO:     127.0.0.1:13557 - "GET /api/v1/pharmacy/medicines/1 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
  + Exception Group Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 76, in collapse_excgroups
    |     yield
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 177, in __call__
    |     async with anyio.create_task_group() as task_group:
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 772, in __aexit__
    |     raise BaseExceptionGroup(
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
    | Traceback (most recent call last):
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    |     result = await app(  # type: ignore[func-returns-value]
    |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    |     return await self.app(scope, receive, send)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    |     await super().__call__(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    |     await self.app(scope, receive, _send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    |     with recv_stream, send_stream, collapse_excgroups():
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    |     self.gen.throw(typ, value, traceback)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    |     response = await self.dispatch_func(request, call_next)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    |     response = await call_next(request)
    |                ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    |     raise app_exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    |     await self.app(scope, receive_or_disconnect, send_no_error)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    |     await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    |     await self.middleware_stack(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    |     await route.handle(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    |     await self.app(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    |     await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    |     raise exc
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    |     await app(scope, receive, sender)
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    |     response = await f(request)
    |                ^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    |     raw_response = await run_endpoint_function(
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    |     return await run_in_threadpool(dependant.call, **values)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    |     return await anyio.to_thread.run_sync(func)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    |     return await get_async_backend().run_sync_in_worker_thread(
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    |     return await future
    |            ^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    |     result = context.run(func, *args)
    |              ^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    |     drug = service.drug_service.get_with_stock(db, id=medicine_id)
    |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |   File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    |     current_stock = db.query(models.InventoryTransaction.quantity).filter(
    |                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'
    +------------------------------------

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 176, in __call__
    with recv_stream, send_stream, collapse_excgroups():
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\contextlib.py", line 158, in __exit__
    self.gen.throw(typ, value, traceback)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_utils.py", line 82, in collapse_excgroups
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 178, in __call__
    response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\app.py", line 92, in dispatch
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 156, in call_next
    raise app_exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\base.py", line 141, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\starlette\concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\moeyukisako\AppData\Local\Programs\Python\Python311\Lib\site-packages\anyio\_backends\_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\api.py", line 304, in read_medicine
    drug = service.drug_service.get_with_stock(db, id=medicine_id)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\moeyukisako\Desktop\Nekolinic\app\pharmacy\service.py", line 51, in get_with_stock
    current_stock = db.query(models.InventoryTransaction.quantity).filter(
                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'InventoryTransaction' has no attribute 'quantity'