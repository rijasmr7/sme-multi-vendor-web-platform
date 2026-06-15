@echo off
set SERVICE=%1

if not "%SERVICE%"=="" goto run_service

:menu
echo =======================================================
echo SME Multi-Vendor Web Platform - Unit Testing Menu
echo =======================================================
echo 1) User Service (user-service)
echo 2) Product Service (product-service)
echo 3) AI Service (ai-service)
echo 4) Analytics Service (analytics-service)
echo 5) Order Service (order-service)
echo 6) Location Service (location-service)
echo 7) WebAR Service (webar-service)
echo 8) AI Recommender Service (ai-recommender-service)
echo 9) Run All Services
echo q) Exit
echo.
set /p opt="Choose an option (1-9 or q): "

if "%opt%"=="1" set "SERVICE=user-service" & goto run_service
if "%opt%"=="2" set "SERVICE=product-service" & goto run_service
if "%opt%"=="3" set "SERVICE=ai-service" & goto run_service
if "%opt%"=="4" set "SERVICE=analytics-service" & goto run_service
if "%opt%"=="5" set "SERVICE=order-service" & goto run_service
if "%opt%"=="6" set "SERVICE=location-service" & goto run_service
if "%opt%"=="7" set "SERVICE=webar-service" & goto run_service
if "%opt%"=="8" set "SERVICE=ai-recommender-service" & goto run_service
if "%opt%"=="9" set "SERVICE=all" & goto run_service
if "%opt%"=="q" goto exit_script
if "%opt%"=="Q" goto exit_script
echo Invalid option, please try again.
echo.
goto menu

:run_service
echo.
echo Running tests for: %SERVICE%
echo =======================================================

if "%SERVICE%"=="user-service" goto test_user
if "%SERVICE%"=="product-service" goto test_product
if "%SERVICE%"=="ai-service" goto test_ai
if "%SERVICE%"=="analytics-service" goto test_analytics
if "%SERVICE%"=="order-service" goto test_order
if "%SERVICE%"=="location-service" goto test_location
if "%SERVICE%"=="webar-service" goto test_webar
if "%SERVICE%"=="ai-recommender-service" goto test_recommender
if "%SERVICE%"=="all" goto test_all
echo Service "%SERVICE%" not recognized.
goto menu

:test_user
echo [1/8] Testing User Service...
cd services\user-service
if not exist node_modules\jest (
    echo [User Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_product
goto end

:test_product
echo [2/8] Testing Product Service...
cd services\product-service
if not exist node_modules\jest (
    echo [Product Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_ai
goto end

:test_ai
echo [3/8] Testing AI Service...
cd services\ai-service
if not exist node_modules\jest (
    echo [AI Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_analytics
goto end

:test_analytics
echo [4/8] Testing Analytics Service...
cd services\analytics-service
if not exist node_modules\jest (
    echo [Analytics Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_order
goto end

:test_order
echo [5/8] Testing Order Service...
cd services\order-service
if not exist node_modules\jest (
    echo [Order Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_location
goto end

:test_location
echo [6/8] Testing Location Service...
cd services\location-service
if not exist node_modules\jest (
    echo [Location Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_webar
goto end

:test_webar
echo [7/8] Testing WebAR Service...
cd services\webar-service
if not exist node_modules\jest (
    echo [WebAR Service] Jest not found. Running npm install...
    call npm install
)
call npm test
cd ..\..
if "%SERVICE%"=="all" goto test_recommender
goto end

:test_recommender
echo [8/8] Testing AI Recommender Service (Python)...
cd services\ai-recommender-service
where pytest >nul 2>nul
if %errorlevel% neq 0 (
    echo [AI Recommender Service] pytest not found. Installing...
    call pip install pytest
)
call pytest tests\test_recommender.py
cd ..\..
goto end

:test_all
goto test_user

:end
echo.
echo =======================================================
echo Done testing %SERVICE%.
echo =======================================================
pause
:exit_script
