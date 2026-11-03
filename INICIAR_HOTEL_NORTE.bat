@echo off
title HOTEL NORTE - Sistema de Recepcion y Puente Automatico Booking.com (ID 2862226)
cd /d "%~dp0"
echo ============================================================================
echo   HOTEL NORTE - INICIANDO PUENTE EN TIEMPO REAL BOOKING.COM (#2862226)
echo ============================================================================
start "" "http://localhost:3847"
node server_booking_bridge.js
pause
