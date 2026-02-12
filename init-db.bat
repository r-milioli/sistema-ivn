@echo off
REM =====================================================
REM SISTEMA IVN - Inicializar Banco de Dados (Windows)
REM =====================================================

echo ======================================
echo Inicializando Banco de Dados
echo ======================================

REM Verificar se o container está rodando
docker compose ps db | findstr "Up" >nul
if errorlevel 1 (
    echo Container do banco nao esta rodando!
    echo Execute: docker compose up -d db
    exit /b 1
)

echo Aplicando schema do banco...
echo.

REM Executar o SQL no container
docker compose exec -T db psql -U postgres -d igreja_db < database_schema_jornada_unica.sql

echo.
echo Schema aplicado com sucesso!
echo.
echo Testando conexao...
docker compose exec db psql -U postgres -d igreja_db -c "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"

echo.
echo Pronto! Reinicie a aplicacao se necessario:
echo   docker compose restart app

pause
