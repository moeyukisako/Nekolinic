INFO:     127.0.0.1:3169 - "POST /api/v1/finance/bills HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 1963, in _exec_single_context
    self.dialect.do_execute(
    ~~~~~~~~~~~~~~~~~~~~~~~^
        cursor, str_statement, effective_parameters, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\default.py", line 943, in do_execute
    cursor.execute(statement, parameters)
    ~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: bills.medical_record_id

The above exception was the direct cause of the following exception:

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
  File "C:\Python313\Lib\site-packages\starlette\middleware\cors.py", line 93, in __call__
    await self.simple_response(scope, receive, send, request_headers=headers)
  File "C:\Python313\Lib\site-packages\starlette\middleware\cors.py", line 144, in simple_response
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
  File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<3 lines>...
    )
    ^
  File "C:\Python313\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
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
  File "C:\Users\admin\Desktop\Nekolinic\app\finance\api.py", line 94, in create_bill
    return service.billing_service.create_bill(db=db, bill_data=bill_data)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\admin\Desktop\Nekolinic\app\finance\service.py", line 172, in create_bill
    db.commit()
    ~~~~~~~~~^^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\session.py", line 2032, in commit
    trans.commit(_to_root=True)
    ~~~~~~~~~~~~^^^^^^^^^^^^^^^
  File "<string>", line 2, in commit
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\state_changes.py", line 139, in _go
    ret_value = fn(self, *arg, **kw)
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\session.py", line 1313, in commit
    self._prepare_impl()
    ~~~~~~~~~~~~~~~~~~^^
  File "<string>", line 2, in _prepare_impl
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\state_changes.py", line 139, in _go
    ret_value = fn(self, *arg, **kw)
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\session.py", line 1288, in _prepare_impl
    self.session.flush()
    ~~~~~~~~~~~~~~~~~~^^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\session.py", line 4345, in flush
    self._flush(objects)
    ~~~~~~~~~~~^^^^^^^^^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\session.py", line 4480, in _flush
    with util.safe_reraise():
         ~~~~~~~~~~~~~~~~~^^
  File "C:\Python313\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 224, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\session.py", line 4441, in _flush
    flush_context.execute()
    ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\unitofwork.py", line 466, in execute
    rec.execute(self)
    ~~~~~~~~~~~^^^^^^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\unitofwork.py", line 642, in execute
    util.preloaded.orm_persistence.save_obj(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self.mapper,
        ^^^^^^^^^^^^
        uow.states_for_mapper_hierarchy(self.mapper, False, False),
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        uow,
        ^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\persistence.py", line 93, in save_obj
    _emit_insert_statements(
    ~~~~~~~~~~~~~~~~~~~~~~~^
        base_mapper,
        ^^^^^^^^^^^^
    ...<3 lines>...
        insert,
        ^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\orm\persistence.py", line 1233, in _emit_insert_statements
    result = connection.execute(
        statement,
        params,
        execution_options=execution_options,
    )
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 1415, in execute
    return meth(
        self,
        distilled_parameters,
        execution_options or NO_OPTIONS,
    )
  File "C:\Python313\Lib\site-packages\sqlalchemy\sql\elements.py", line 523, in _execute_on_connection
    return connection._execute_clauseelement(
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self, distilled_params, execution_options
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 1637, in _execute_clauseelement
    ret = self._execute_context(
        dialect,
    ...<8 lines>...
        cache_hit=cache_hit,
    )
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 1842, in _execute_context
    return self._exec_single_context(
           ~~~~~~~~~~~~~~~~~~~~~~~~~^
        dialect, context, statement, parameters
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 1982, in _exec_single_context
    self._handle_dbapi_exception(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        e, str_statement, effective_parameters, cursor, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 2351, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\base.py", line 1963, in _exec_single_context
    self.dialect.do_execute(
    ~~~~~~~~~~~~~~~~~~~~~~~^
        cursor, str_statement, effective_parameters, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Python313\Lib\site-packages\sqlalchemy\engine\default.py", line 943, in do_execute
    cursor.execute(statement, parameters)
    ~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
sqlalchemy.exc.IntegrityError: (sqlite3.IntegrityError) UNIQUE constraint failed: bills.medical_record_id
[SQL: INSERT INTO bills (invoice_number, bill_date, total_amount, status, patient_id, medical_record_id, payment_method, provider_transaction_id, created_at, updated_at, created_by_id, updated_by_id, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)]
[parameters: ('INV-1749488304316-404', '2025-06-09 16:58:24.316000', 150.0, 'UNPAID', 120, 40, None, None, '2025-06-09 16:58:24.327084', '2025-06-09 16:58:24.327084', 1, 1, None)]
(Background on this error at: https://sqlalche.me/e/20/gkpj)